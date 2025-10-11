import { Hono } from 'hono';
import { uid, hashPassword, verifyPassword, cookieSerialize } from './lib';
import { ok, err, readJson, rateLimit } from './http';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  ASSETS: R2Bucket;
};

type Vars = { userId?: string, role?: string };

const app = new Hono<{ Bindings: Bindings, Variables: Vars }>();

// CORS with Pages domain allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // local dev
  'https://chorecoins.pages.dev', // production Pages
  'https://chorecoins-api.thejmgfam.workers.dev' // API domain
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    // Allow *.pages.dev for previews and localhost for dev
    return (
      u.hostname.endsWith('.pages.dev') || 
      u.hostname === 'localhost' ||
      ALLOWED_ORIGINS.includes(origin)
    );
  } catch { return false; }
}

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allow = isAllowedOrigin(origin) ? origin : '';
  if (allow) {
    c.header('Access-Control-Allow-Origin', allow);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  c.header('Access-Control-Expose-Headers', 'Set-Cookie');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

// --- Session extractor ---
app.use('*', async (c, next) => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.split(/;\s*/).find(kv => kv.startsWith('cc_sess='));
  if (match) {
    const token = decodeURIComponent(match.split('=')[1] || '');
    if (token) {
      const raw = await c.env.SESSION_KV.get(`sess:${token}`);
      if (raw) {
        const s = JSON.parse(raw) as { userId: string, role: string, exp: number };
        if (Date.now() < s.exp) {
          c.set('userId', s.userId);
          c.set('role', s.role);
        }
      }
    }
  }
  await next();
});

// --- Helper functions ---
function requireAuth(c: any) {
  const userId = c.get('userId');
  if (!userId) return c.json({ ok: false, error: 'auth_required' }, 401);
  return null;
}
function requireRole(c: any, roles: string[]) {
  const role = c.get('role');
  if (!role || !roles.includes(role)) return c.json({ ok: false, error: 'forbidden' }, 403);
  return null;
}
async function getUserFamilyId(c: any, userId: string) {
  const fm = await c.env.DB.prepare(
    `SELECT family_id FROM FamilyMember WHERE user_id=? LIMIT 1`
  ).bind(userId).first<{ family_id: string }>();
  return (fm as any)?.family_id ?? null;
}
function nowMs() { return Date.now(); }

function genKidEmail(kidId: string) {
  // Kids may not have real email; use unique placeholder domain
  return `${kidId}@kid.chorecoins.local`;
}

// Root route
app.get('/', (c) => {
  return c.json({
    name: 'ChoreCoins API',
    version: '0.0.1',
    endpoints: {
      health: '/healthz',
      version: '/version',
      auth: ['/auth/register-parent', '/auth/login', '/auth/logout', '/auth/kid-login'],
      resources: ['/me', '/templates', '/kids', '/chores', '/goals', '/requests', '/exchange/rules', '/eligibility', '/ledger', '/kids/balances', '/exchange/quote']
    },
    docs: 'https://github.com/smartdealmind/chorecoins'
  });
});

// Liveness + environment probe
app.get('/healthz', async (c) => {
  let d1Ok = false;
  let kvOk = false;
  let userVersion: number | null = null;
  let tablesOk = false;

  const requiredTables = [
    'User','Family','FamilyMember','KidProfile','ExchangeRule',
    'TaskTemplate','Chore','ChoreEvent','PointsLedger','Goal','TaskRequest','TrustedLink'
  ];

  try {
    // Try to get user_version, but don't fail if it doesn't work
    try {
      const vu = await c.env.DB.prepare('PRAGMA user_version;').first<{ user_version: number }>();
      userVersion = vu ? (vu as any).user_version ?? null : null;
    } catch {
      // PRAGMA might not be supported, skip it
      userVersion = null;
    }

    const res = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table';"
    ).all<{ name: string }>();

    const have = new Set((res?.results ?? []).map(r => r.name));
    tablesOk = requiredTables.every(t => have.has(t));
    d1Ok = true;
  } catch (err) {
    d1Ok = false;
  }

  try {
    const k = `healthz:${Date.now()}`;
    await c.env.SESSION_KV.put(k, 'ok', { expirationTtl: 60 });
    const v = await c.env.SESSION_KV.get(k);
    kvOk = v === 'ok';
  } catch {
    kvOk = false;
  }

  return c.json({
    ok: d1Ok && kvOk && tablesOk,
    service: 'chorecoins-api',
    d1: { ok: d1Ok, user_version: userVersion, tables_ok: tablesOk },
    kv: { ok: kvOk }
  });
});

// optional: version
app.get('/version', (c) => c.json({ version: '0.0.1' }));

// --- Auth: Register parent + family bootstrap ---
app.post('/auth/register-parent', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  try {
    const body = await c.req.json<{ email: string, password: string, first_name?: string, last_name?: string, family_name: string }>();
    const { email, password, first_name, last_name, family_name } = body || {};
    if (!email || !password || !family_name) return c.json({ ok: false, error: 'Missing fields' }, 400);

    const userId = uid('usr');
    const familyId = uid('fam');
    const memberId = uid('mbr');
    const exchangeId = uid('exr');
    const now = Date.now();

    // Unique email guard
    const existing = await c.env.DB.prepare('SELECT id FROM User WHERE email = ?').bind(email).first();
    if (existing) return c.json({ ok: false, error: 'Email already registered' }, 409);

    const pwd = await hashPassword(password);

  try {
    // D1 batch execution
    const result = await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at) VALUES (?,?,?,?,?,'parent',?);
      `).bind(userId, email, pwd, first_name ?? null, last_name ?? null, now),
      
      c.env.DB.prepare(`INSERT INTO Family (id,name,created_at) VALUES (?,?,?);`).bind(familyId, family_name, now),
      
      c.env.DB.prepare(`
        INSERT INTO FamilyMember (id,family_id,user_id,role,created_at) VALUES (?,?,?,'parent',?);
      `).bind(memberId, familyId, userId, now),
      
      c.env.DB.prepare(`
        INSERT INTO ExchangeRule (id,family_id,points_per_currency,currency_code,rounding,weekly_allowance_points,required_task_min_pct,created_at)
        VALUES (?,?,100,'USD','down',0,20,?);
      `).bind(exchangeId, familyId, now)
    ]);
    
    // Check if any query failed
    const failed = result.find(r => !r.success);
    if (failed) {
      return c.json({ ok: false, error: 'Database error during registration' }, 500);
    }
  } catch (err) {
    return c.json({ ok: false, error: 'Database error' }, 500);
  }

  // Create session
  const token = uid('tok');
  const sess = { userId, role: 'parent', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }; // 7 days
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7
  }));

  return c.json({ ok: true, userId, familyId });
  } catch (err: any) {
    console.error('Registration error:', err);
    return c.json({ ok: false, error: err.message || 'Registration failed' }, 500);
  }
});

// --- Auth: Login ---
app.post('/auth/login', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const body = await c.req.json<{ email: string, password: string }>();
  const { email, password } = body || {};
  if (!email || !password) return c.json({ ok: false, error: 'Missing fields' }, 400);

  const row = await c.env.DB.prepare(`SELECT id, password_hash, role FROM User WHERE email = ?`).bind(email).first<{ id: string, password_hash: string, role: string }>();
  if (!row) return c.json({ ok: false, error: 'Invalid credentials' }, 401);

  const ok = await verifyPassword(password, (row as any).password_hash);
  if (!ok) return c.json({ ok: false, error: 'Invalid credentials' }, 401);

  const token = uid('tok');
  const role = (row as any).role as string;
  const sess = { userId: (row as any).id as string, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 };
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7
  }));

  return c.json({ ok: true });
});

// --- Auth: Logout ---
app.post('/auth/logout', async (c) => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.split(/;\s*/).find(kv => kv.startsWith('cc_sess='));
  if (match) {
    const token = decodeURIComponent(match.split('=')[1] || '');
    if (token) await c.env.SESSION_KV.delete(`sess:${token}`);
  }
  c.header('Set-Cookie', cookieSerialize('cc_sess', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0 }));
  return c.json({ ok: true });
});

// --- Kid login (PIN) ---
app.post('/auth/kid-login', async (c) => {
  // Rate limit
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(c, `auth:${ip}`, 10, 60))) {
    return err(c, 429, 'rate_limited', 'Too many attempts, try again soon');
  }

  const body = await c.req.json<{ kid_user_id?: string; display_name?: string; pin: string }>();
  const { kid_user_id, display_name, pin } = body || {};
  if (!pin || (!kid_user_id && !display_name)) {
    return c.json({ ok: false, error: 'Missing kid_user_id/display_name or pin' }, 400);
  }

  // Resolve kid user
  let row: any;
  if (kid_user_id) {
    row = await c.env.DB.prepare(`SELECT U.id, U.password_hash, U.role 
                                  FROM User U WHERE U.id=? AND U.role='kid'`)
          .bind(kid_user_id).first();
  } else {
    row = await c.env.DB.prepare(`SELECT U.id, U.password_hash, U.role
                                  FROM User U 
                                  JOIN KidProfile K ON K.user_id = U.id
                                  WHERE K.display_name=? AND U.role='kid' LIMIT 1`)
          .bind(display_name).first();
  }
  if (!row) return c.json({ ok:false, error:'kid_not_found' }, 404);

  const ok = await verifyPassword(pin, (row as any).password_hash);
  if (!ok) return c.json({ ok:false, error:'invalid_pin' }, 401);

  // Create session
  const token = uid('tok');
  const sess = { userId: (row as any).id as string, role: 'kid', exp: Date.now() + 1000*60*60*24*7 };
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60*60*24*7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7
  }));
  return c.json({ ok:true, kid_user_id: (row as any).id });
});

// --- Me ---
app.get('/me', async (c) => {
  const userId = c.get('userId');
  if (!userId) return c.json({ ok: false, authenticated: false }, 200);

  const u = await c.env.DB.prepare(`SELECT id,email,first_name,last_name,role,created_at FROM User WHERE id=?`).bind(userId).first();
  if (!u) return c.json({ ok: false, authenticated: false }, 200);

  // find any family for this user
  const fm = await c.env.DB.prepare(`SELECT family_id, role FROM FamilyMember WHERE user_id=? LIMIT 1`).bind(userId).first<{ family_id: string, role: string }>();
  const familyId = (fm as any)?.family_id ?? null;

  return c.json({ ok: true, authenticated: true, user: u, familyId });
});

// --- GET /templates?age= ---
app.get('/templates', async (c) => {
  const ageStr = c.req.query('age');
  const age = ageStr ? parseInt(ageStr, 10) : undefined;

  let q = `SELECT id,title,description,min_age,max_age,category,default_points,is_required_default
           FROM TaskTemplate WHERE is_global = 1`;
  const args: any[] = [];
  if (age != null && !Number.isNaN(age)) {
    q += ` AND (min_age IS NULL OR min_age <= ?) AND (max_age IS NULL OR max_age >= ?)`;
    args.push(age, age);
  }
  q += ` ORDER BY min_age NULLS FIRST, title`;

  const res = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok: true, templates: res.results ?? [] });
});

// --- POST /kids (parent creates kid) ---
app.post('/kids', async (c) => {
  // Guards
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;

  const parentId = c.get('userId');
  const familyId = await getUserFamilyId(c, parentId);
  if (!familyId) return c.json({ ok: false, error: 'family_not_found' }, 400);

  const body = await c.req.json<{ display_name: string; birthdate?: string; pin?: string }>();
  const { display_name, birthdate, pin } = body || {};
  if (!display_name) return c.json({ ok: false, error: 'missing_display_name' }, 400);

  const kidUserId = uid('usr');
  const kidProfileId = uid('kid');
  const memberId = uid('mbr');
  const now = nowMs();
  const email = genKidEmail(kidUserId);
  const pinPwd = await hashPassword(pin && pin.length ? pin : crypto.randomUUID().slice(0,6));

  // Create user (role=kid), member, profile
  await c.env.DB.prepare(`
    INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at)
    VALUES (?,?,?,?,?,'kid',?)
  `).bind(kidUserId, email, pinPwd, display_name, null, now).run();

  await c.env.DB.prepare(`
    INSERT INTO FamilyMember (id,family_id,user_id,role,created_at)
    VALUES (?,?,?,?,?)
  `).bind(memberId, familyId, kidUserId, 'kid', now).run();

  await c.env.DB.prepare(`
    INSERT INTO KidProfile (id,user_id,family_id,birthdate,display_name,points_balance,created_at)
    VALUES (?,?,?,?,?,0,?)
  `).bind(kidProfileId, kidUserId, familyId, birthdate ?? null, display_name, now).run();

  return c.json({ ok: true, kid_user_id: kidUserId, kid_profile_id: kidProfileId });
});

// --- POST /chores (create one or bulk from templates) ---
app.post('/chores', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const parentId = c.get('userId');
  const role = c.get('role');
  if (!['parent','helper'].includes(role)) return c.json({ ok:false, error:'forbidden' }, 403);

  const familyId = await getUserFamilyId(c, parentId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  type Body =
    | { title: string; description?: string; category?: string; is_required?: boolean; points?: number; kid_user_id?: string; due_at?: number; }
    | { from_template_ids: string[]; kid_user_id?: string; due_at?: number; };

  const b = await c.req.json<Body>();

  const created: string[] = [];
  const now = nowMs();

  const make = async (p: { title:string; description?:string; category?:string; is_required?:boolean; points?:number; kid_user_id?:string; due_at?:number; }) => {
    const id = uid('chr');
    await c.env.DB.prepare(`
      INSERT INTO Chore (id,family_id,kid_user_id,title,description,category,is_required,points,status,due_at,created_at,created_by,assigned_by_user_id)
      VALUES (?,?,?,?,?,?,?,?, 'open', ?,?,?,?)
    `).bind(
      id, familyId, p.kid_user_id ?? null, p.title, p.description ?? null, p.category ?? null,
      p.is_required ? 1 : 0, p.points ?? 0, p.due_at ?? null, now, parentId, parentId
    ).run();
    created.push(id);
  };

  if ('from_template_ids' in b) {
    if (!b.from_template_ids?.length) return c.json({ ok:false, error:'missing_templates' }, 400);
    const rows = await c.env.DB.prepare(
      `SELECT id,title,description,category,default_points,is_required_default FROM TaskTemplate WHERE id IN (${b.from_template_ids.map(()=>'?').join(',')})`
    ).bind(...b.from_template_ids).all<{title:string,description:string,category:string,default_points:number,is_required_default:number}>();
    for (const t of (rows.results ?? [])) {
      await make({
        title: t.title,
        description: t.description ?? undefined,
        category: t.category ?? undefined,
        is_required: t.is_required_default === 1,
        points: t.default_points ?? 0,
        kid_user_id: (b as any).kid_user_id,
        due_at: (b as any).due_at
      });
    }
  } else {
    await make(b as any);
  }

  return c.json({ ok:true, chore_ids: created });
});

// --- GET /chores (parent view or kid view) ---
app.get('/chores', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');

  const status = c.req.query('status'); // optional
  const where: string[] = [];
  const args: any[] = [];

  if (role === 'kid') {
    where.push(`kid_user_id = ?`);
    args.push(userId);
  } else {
    // parent/helper: scope to their family
    const familyId = await getUserFamilyId(c, userId);
    if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);
    where.push(`family_id = ?`);
    args.push(familyId);
  }
  if (status) { where.push(`status = ?`); args.push(status); }

  const q = `
    SELECT id,family_id,kid_user_id,title,category,is_required,points,status,due_at,created_at
    FROM Chore
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
  `;
  const res = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok:true, chores: res.results ?? [] });
});

// --- POST /chores/:id/claim (kid claims chore) ---
app.post('/chores/:id/claim', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  if (role !== 'kid') return c.json({ ok:false, error:'for_kid_only' }, 403);

  const id = c.req.param('id');
  const now = nowMs();

  // claim open chore for this kid (or unassigned)
  const row = await c.env.DB.prepare(`SELECT family_id,kid_user_id,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'open') return c.json({ ok:false, error:'not_open' }, 400);
  if (row.kid_user_id && row.kid_user_id !== userId) return c.json({ ok:false, error:'not_assigned_to_you' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET kid_user_id=?, status='claimed' WHERE id=?`).bind(userId, id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, userId, 'claimed', now).run();

  return c.json({ ok:true });
});

// --- POST /chores/:id/submit (kid submits chore) ---
app.post('/chores/:id/submit', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); const role = c.get('role');
  if (role !== 'kid') return c.json({ ok:false, error:'for_kid_only' }, 403);

  const id = c.req.param('id'); const now = nowMs();
  const row = await c.env.DB.prepare(`SELECT kid_user_id,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row || row.kid_user_id !== userId) return c.json({ ok:false, error:'not_found_or_not_yours' }, 404);
  if (!['claimed','open'].includes(row.status)) return c.json({ ok:false, error:'bad_status' }, 400);

  await c.env.DB.prepare(`UPDATE Chore SET status='submitted' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, userId, 'submitted', now).run();

  return c.json({ ok:true });
});

// --- POST /chores/:id/approve (parent approves chore) ---
app.post('/chores/:id/approve', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;

  const approverId = c.get('userId'); const id = c.req.param('id'); const now = nowMs();

  const row = await c.env.DB.prepare(`SELECT family_id,kid_user_id,is_required,points,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'submitted') return c.json({ ok:false, error:'not_submitted' }, 400);

  // family guard: approver must belong to same family
  const famApprover = await getUserFamilyId(c, approverId);
  if (!famApprover || famApprover !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET status='approved' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, approverId, 'approved', now).run();

  // credit points if not required
  if (row.is_required === 0 && row.kid_user_id) {
    await c.env.DB.prepare(`
      INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
      VALUES (?,?,?,?,?,?,?)
    `).bind(uid('plg'), row.kid_user_id, row.family_id, row.points, 'chore_approved', id, now).run();

    await c.env.DB.prepare(`UPDATE KidProfile SET points_balance = points_balance + ? WHERE user_id=?`)
      .bind(row.points, row.kid_user_id).run();
  }

  return c.json({ ok:true });
});

// --- POST /chores/:id/deny (parent denies chore) ---
app.post('/chores/:id/deny', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;

  const approverId = c.get('userId'); const id = c.req.param('id'); const now = nowMs();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM Chore WHERE id=?`).bind(id).first<any>();
  if (!row) return c.json({ ok:false, error:'not_found' }, 404);
  if (row.status !== 'submitted') return c.json({ ok:false, error:'not_submitted' }, 400);

  const famApprover = await getUserFamilyId(c, approverId);
  if (!famApprover || famApprover !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE Chore SET status='denied' WHERE id=?`).bind(id).run();
  await c.env.DB.prepare(`INSERT INTO ChoreEvent (id,chore_id,actor_user_id,type,created_at) VALUES (?,?,?,?,?)`)
    .bind(uid('cev'), id, approverId, 'denied', now).run();

  return c.json({ ok:true });
});

// --- Ledger (parent-scoped or kid sees own) ---
app.get('/ledger', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');

  const kid = c.req.query('kid'); // optional
  let kidId = kid || userId;

  if (role !== 'kid') {
    // parent/helper: ensure the requested kid belongs to my family
    if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);
    const myFam = await getUserFamilyId(c, userId);
    const kidFam = await c.env.DB.prepare(
      `SELECT family_id FROM KidProfile WHERE user_id=?`
    ).bind(kid).first<{ family_id: string }>();
    if (!kidFam || (kidFam as any).family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);
    kidId = kid;
  }

  const rows = await c.env.DB.prepare(`
    SELECT id, delta_points, reason, ref_id, created_at 
    FROM PointsLedger
    WHERE kid_user_id = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).bind(kidId).all();

  return c.json({ ok:true, ledger: rows.results ?? [] });
});

// --- Kids balances (parent view) ---
app.get('/kids/balances', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  const rows = await c.env.DB.prepare(`
    SELECT K.user_id as kid_user_id, K.display_name, K.points_balance
    FROM KidProfile K
    WHERE K.family_id = ?
    ORDER BY K.display_name
  `).bind(familyId).all();

  return c.json({ ok:true, kids: rows.results ?? [] });
});

// --- Exchange quote (points <-> money) ---
app.post('/exchange/quote', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');

  const familyId = await getUserFamilyId(c, userId);
  if (!familyId) return c.json({ ok:false, error:'family_not_found' }, 400);

  const ex = await c.env.DB.prepare(`
    SELECT points_per_currency, currency_code, rounding FROM ExchangeRule WHERE family_id=?
  `).bind(familyId).first<{ points_per_currency: number; currency_code: string; rounding: string }>();
  if (!ex) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const body = await c.req.json<{ points?: number; amount_cents?: number }>();
  const { points, amount_cents } = body || {};
  const ppc = (ex as any).points_per_currency as number;

  let result: any = { currency: (ex as any).currency_code };

  if (typeof points === 'number') {
    const dollars = points / ppc; // e.g. 100 pts = $1
    result.amount_cents = Math.floor(dollars * 100);
  } else if (typeof amount_cents === 'number') {
    const dollars = amount_cents / 100;
    result.points = Math.ceil(dollars * ppc);
  } else {
    return c.json({ ok:false, error:'provide points or amount_cents' }, 400);
  }

  return c.json({ ok:true, ...result });
});

// --- GET current rules ---
app.get('/exchange/rules', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  const row = await c.env.DB.prepare(
    `SELECT points_per_currency, currency_code, rounding, weekly_allowance_points, required_task_min_pct
     FROM ExchangeRule WHERE family_id=?`
  ).bind(familyId).first();
  return c.json({ ok: true, rules: row || null });
});

// --- PATCH rules ---
app.patch('/exchange/rules', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;
  const userId = c.get('userId');
  const familyId = await getUserFamilyId(c, userId);
  const body = await c.req.json<{
    points_per_currency?: number;
    currency_code?: string;
    rounding?: 'nearest'|'down'|'up';
    weekly_allowance_points?: number;
    required_task_min_pct?: number;
  }>();
  const now = Date.now();
  const current = await c.env.DB.prepare(
    `SELECT * FROM ExchangeRule WHERE family_id=?`
  ).bind(familyId).first<any>();
  if (!current) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const next = {
    points_per_currency: body.points_per_currency ?? current.points_per_currency,
    currency_code: body.currency_code ?? current.currency_code,
    rounding: body.rounding ?? current.rounding,
    weekly_allowance_points: body.weekly_allowance_points ?? current.weekly_allowance_points,
    required_task_min_pct: body.required_task_min_pct ?? current.required_task_min_pct
  };
  await c.env.DB.prepare(
    `UPDATE ExchangeRule SET points_per_currency=?, currency_code=?, rounding=?, weekly_allowance_points=?, required_task_min_pct=?, updated_at=? WHERE family_id=?`
  ).bind(next.points_per_currency, next.currency_code, next.rounding, next.weekly_allowance_points, next.required_task_min_pct, now, familyId).run();

  return c.json({ ok:true, rules: next });
});

// --- Required-chores unlock eligibility ---
app.get('/eligibility', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  const kidId = c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kidId) return c.json({ ok:false, error:'kid_required' }, 400);

  const myFam = await getUserFamilyId(c, role === 'kid' ? kidId : userId);
  const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>();
  if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);

  const ex = await c.env.DB.prepare(
    `SELECT required_task_min_pct FROM ExchangeRule WHERE family_id=?`
  ).bind(myFam).first<{ required_task_min_pct: number }>();
  const minPct = (ex as any)?.required_task_min_pct ?? 0;

  const since = Date.now() - 7*24*60*60*1000;

  // Count approved chores using approval event time (more accurate)
  const rows = await c.env.DB.prepare(
    `SELECT C.is_required, COUNT(*) AS n
     FROM Chore C
     JOIN ChoreEvent E ON E.chore_id = C.id AND E.type='approved'
     WHERE C.kid_user_id=? AND E.created_at >= ?
     GROUP BY C.is_required`
  ).bind(kidId, since).all<{ is_required: number, n: number }>();
  let req = 0, total = 0;
  for (const r of (rows.results ?? [])) {
    total += r.n; if (r.is_required === 1) req += r.n;
  }
  const pct = total ? Math.round((req / total) * 100) : 0;
  const eligible = pct >= minPct;

  // Also surface outstanding required chores (open/claimed/submitted) for nudges
  const outstanding = await c.env.DB.prepare(
    `SELECT id,title,status FROM Chore
     WHERE kid_user_id=? AND is_required=1 AND status IN ('open','claimed','submitted')
     ORDER BY created_at DESC LIMIT 20`
  ).bind(kidId).all();

  return c.json({ ok:true, eligible, ratio: { required:req, total, pct }, min_required_pct: minPct, outstanding: outstanding.results ?? [] });
});

// --- Create goal ---
app.post('/goals', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); const role = c.get('role');
  const body = await c.req.json<{ kid_user_id?: string; title: string; target_amount_cents: number }>();
  const kidId = role === 'kid' ? userId : body.kid_user_id;
  if (!kidId) return c.json({ ok:false, error:'kid_required' }, 400);

  // same-family guard for parent
  if (role !== 'kid') {
    const myFam = await getUserFamilyId(c, userId);
    const kidFam = await c.env.DB.prepare(`SELECT family_id FROM KidProfile WHERE user_id=?`).bind(kidId).first<any>();
    if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);
  }

  const familyId = await getUserFamilyId(c, kidId);
  const ex = await c.env.DB.prepare(`SELECT points_per_currency,currency_code FROM ExchangeRule WHERE family_id=?`).bind(familyId).first<any>();
  if (!ex) return c.json({ ok:false, error:'exchange_rule_missing' }, 400);

  const ppc = ex.points_per_currency as number;
  const target_points = Math.ceil((body.target_amount_cents/100) * ppc);
  const goalId = uid('gol'); const now = Date.now();

  await c.env.DB.prepare(`
    INSERT INTO Goal (id,kid_user_id,family_id,title,target_amount_cents,currency_code,target_points,status,created_at)
    VALUES (?,?,?,?,?,?,?,'active',?)
  `).bind(goalId, kidId, familyId, body.title, body.target_amount_cents, ex.currency_code, target_points, now).run();

  return c.json({ ok:true, goal_id: goalId, target_points });
});

// --- Cancel goal ---
app.post('/goals/:id/cancel', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); const role = c.get('role');
  const id = c.req.param('id');

  const row = await c.env.DB.prepare(`SELECT kid_user_id,family_id,status FROM Goal WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'active') return c.json({ ok:false, error:'not_found_or_inactive' }, 404);

  // permission
  if (role === 'kid' && row.kid_user_id !== userId) return c.json({ ok:false, error:'forbidden' }, 403);
  if (role !== 'kid') {
    const myFam = await getUserFamilyId(c, userId);
    if (myFam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);
  }
  await c.env.DB.prepare(`UPDATE Goal SET status='cancelled' WHERE id=?`).bind(id).run();
  return c.json({ ok:true });
});

// --- List goals + ETA ---
app.get('/goals', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId'); const role = c.get('role');
  const kid = c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);

  // family guard
  const myFam = await getUserFamilyId(c, role === 'kid' ? kid : userId);
  const kidFam = await c.env.DB.prepare(`SELECT family_id, points_balance FROM KidProfile WHERE user_id=?`).bind(kid).first<any>();
  if (!kidFam || kidFam.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);

  const goals = await c.env.DB.prepare(`
    SELECT id,title,target_amount_cents,currency_code,target_points,status,created_at,achieved_at
    FROM Goal WHERE kid_user_id=? ORDER BY created_at DESC
  `).bind(kid).all<any>();

  // avg pts/day from last 14 days
  const since = Date.now() - 14*24*60*60*1000;
  const pts = await c.env.DB.prepare(`
    SELECT SUM(delta_points) AS sum FROM PointsLedger
    WHERE kid_user_id=? AND delta_points > 0 AND created_at >= ?
  `).bind(kid, since).first<any>();
  const earned = pts?.sum || 0;
  const avgPerDay = Math.max(1, Math.round(earned / 14)); // avoid /0

  // add computed fields
  const out = (goals.results ?? []).map(g => {
    const remaining = Math.max(0, g.target_points - kidFam.points_balance);
    const etaDays = g.status === 'active' ? Math.ceil(remaining / avgPerDay) : null;
    return { ...g, current_points: kidFam.points_balance, remaining_points: remaining, eta_days: etaDays, avg_pts_per_day: avgPerDay };
  });

  return c.json({ ok:true, goals: out });
});

// --- Create request (kid) ---
app.post('/requests', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  if (role !== 'kid') return c.json({ ok:false, error:'for_kid_only' }, 403);

  const body = await c.req.json<{ title: string; description?: string; suggested_points?: number }>();
  const familyId = await getUserFamilyId(c, userId);
  const now = Date.now();
  const id = uid('req');

  await c.env.DB.prepare(`
    INSERT INTO TaskRequest (id,family_id,kid_user_id,title,description,suggested_points,status,created_at)
    VALUES (?,?,?,?,?,?,'pending',?)
  `).bind(id, familyId, userId, body.title, body.description ?? null, body.suggested_points ?? null, now).run();

  return c.json({ ok:true, request_id: id });
});

// --- List requests (parent scope) or kid sees own ---
app.get('/requests', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const status = c.req.query('status'); // optional
  let q = `SELECT id,kid_user_id,title,description,suggested_points,status,created_at,decided_at,decided_by FROM TaskRequest `;
  const where: string[] = []; const args: any[] = [];

  if (role === 'kid') {
    where.push(`kid_user_id = ?`); args.push(userId);
  } else {
    const fam = await getUserFamilyId(c, userId);
    where.push(`family_id = ?`); args.push(fam);
  }
  if (status) { where.push(`status = ?`); args.push(status); }
  if (where.length) q += `WHERE ` + where.join(' AND ');
  q += ` ORDER BY created_at DESC LIMIT 200`;

  const rows = await c.env.DB.prepare(q).bind(...args).all();
  return c.json({ ok:true, requests: rows.results ?? [] });
});

// --- Approve/Deny requests (parent/helper) ---
app.post('/requests/:id/approve', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const id = c.req.param('id'); const uid = c.get('userId'); const now = Date.now();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM TaskRequest WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'pending') return c.json({ ok:false, error:'not_found_or_not_pending' }, 404);

  const fam = await getUserFamilyId(c, uid);
  if (fam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE TaskRequest SET status='approved', decided_at=?, decided_by=? WHERE id=?`).bind(now, uid, id).run();
  return c.json({ ok:true });
});

app.post('/requests/:id/deny', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent','helper']); if (r) return r;
  const id = c.req.param('id'); const uid = c.get('userId'); const now = Date.now();

  const row = await c.env.DB.prepare(`SELECT family_id,status FROM TaskRequest WHERE id=?`).bind(id).first<any>();
  if (!row || row.status !== 'pending') return c.json({ ok:false, error:'not_found_or_not_pending' }, 404);

  const fam = await getUserFamilyId(c, uid);
  if (fam !== row.family_id) return c.json({ ok:false, error:'wrong_family' }, 403);

  await c.env.DB.prepare(`UPDATE TaskRequest SET status='denied', decided_at=?, decided_by=? WHERE id=?`).bind(now, uid, id).run();
  return c.json({ ok:true });
});

// --- Trusted Relatives Invites ---

// Create invite (parent)
app.post('/trusted/invites', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const r = requireRole(c, ['parent']); if (r) return r;
  const userId = c.get('userId');
  const body = await c.req.json<{ scope: string; email?: string; ttl_hours?: number }>();
  const familyId = await getUserFamilyId(c, userId);
  
  const id = uid('tiv');
  const token = uid('ivt');
  const now = Date.now();
  const expires = now + ((body.ttl_hours ?? 168) * 3600 * 1000); // default 7 days

  await c.env.DB.prepare(`
    INSERT INTO TrustedInvite (id,family_id,scope,token,email,expires_at,created_at)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id, familyId, body.scope, token, body.email ?? null, expires, now).run();

  return c.json({ ok:true, invite: { token, scope: body.scope, expires_at: expires } });
});

// Register helper via invite (new account)
app.post('/auth/register-helper', async (c) => {
  const body = await c.req.json<{ token: string; email: string; password: string; first_name?: string }>();
  
  const inv = await c.env.DB.prepare(`SELECT * FROM TrustedInvite WHERE token=?`).bind(body.token).first<any>();
  if (!inv || inv.expires_at < Date.now() || inv.accepted_by) {
    return c.json({ ok:false, error:'invalid_or_expired' }, 400);
  }

  // Create helper user
  const userId = uid('usr');
  const now = Date.now();
  const pwd = await hashPassword(body.password);
  
  await c.env.DB.prepare(`
    INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at)
    VALUES (?,?,?,?,?,'helper',?)
  `).bind(userId, body.email, pwd, body.first_name ?? null, null, now).run();

  // Link permission
  const linkId = uid('tlk');
  await c.env.DB.prepare(`
    INSERT INTO TrustedLink (id,granting_family_id,trusted_user_id,scope,created_at)
    VALUES (?,?,?,?,?)
  `).bind(linkId, inv.family_id, userId, inv.scope, now).run();

  await c.env.DB.prepare(`UPDATE TrustedInvite SET accepted_by=? WHERE id=?`).bind(userId, inv.id).run();

  // Create session cookie
  const token = uid('tok');
  await c.env.SESSION_KV.put(
    `sess:${token}`,
    JSON.stringify({ userId, role:'helper', exp: Date.now() + 7*864e5 }),
    { expirationTtl: 7*86400 }
  );
  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly:true, secure:true, sameSite:'Lax', path:'/', maxAge:7*86400
  }));

  return c.json({ ok:true, role:'helper' });
});

// Accept invite with existing account (login first)
app.post('/trusted/accept', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const userId = c.get('userId');
  const role = c.get('role');
  
  if (!['parent','helper','kid'].includes(role)) {
    return c.json({ ok:false, error:'forbidden' }, 403);
  }

  const body = await c.req.json<{ token: string }>();
  const inv = await c.env.DB.prepare(`SELECT * FROM TrustedInvite WHERE token=?`).bind(body.token).first<any>();
  
  if (!inv || inv.expires_at < Date.now() || inv.accepted_by) {
    return c.json({ ok:false, error:'invalid_or_expired' }, 400);
  }

  const linkId = uid('tlk');
  const now = Date.now();
  
  await c.env.DB.prepare(`
    INSERT INTO TrustedLink (id,granting_family_id,trusted_user_id,scope,created_at)
    VALUES (?,?,?,?,?)
  `).bind(linkId, inv.family_id, userId, inv.scope, now).run();
  
  await c.env.DB.prepare(`UPDATE TrustedInvite SET accepted_by=? WHERE id=?`).bind(userId, inv.id).run();

  return c.json({ ok:true });
});

// --- SVG Reward Chart Generator ---
function svgChart(opts: { kid: string; displayName: string; weekRequired: number; weekPaid: number; balance: number; currency: string }) {
  const total = opts.weekRequired + opts.weekPaid || 1;
  const reqPct = Math.round((opts.weekRequired/total)*100);
  const paidPct = 100 - reqPct;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="600" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: 700 32px system-ui, -apple-system, Segoe UI, Roboto; }
    .sub   { font: 500 18px system-ui, -apple-system, Segoe UI, Roboto; }
    .num   { font: 700 20px system-ui, -apple-system, Segoe UI, Roboto; }
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="40" y="70" class="title">ChoreCoins — Weekly Reward Chart</text>
  <text x="40" y="110" class="sub">Kid: ${opts.displayName}</text>
  <text x="40" y="140" class="sub">Balance: ${opts.balance} pts (~ ${opts.currency})</text>

  <text x="40" y="200" class="sub">This week</text>
  <rect x="40" y="220" width="${reqPct*7}" height="32" fill="#0ea5e9"/>
  <rect x="${40+reqPct*7}" y="220" width="${paidPct*7}" height="32" fill="#22c55e"/>
  <text x="40" y="270" class="num">Required: ${opts.weekRequired} (${reqPct}%)</text>
  <text x="260" y="270" class="num">Paid: ${opts.weekPaid} (${paidPct}%)</text>

  <text x="40" y="330" class="sub">Sign-offs</text>
  <circle cx="60" cy="365" r="8" fill="#0ea5e9"/><text x="80" y="370" class="sub">Required</text>
  <circle cx="220" cy="365" r="8" fill="#22c55e"/><text x="240" y="370" class="sub">Paid</text>

  <text x="40" y="440" class="sub">Parents: You can print and stick this on the fridge!</text>
  <text x="40" y="470" class="sub" fill="#64748b">Generated by ChoreCoins</text>
</svg>`;
}

// Generate & upload SVG, return a proxied URL
app.post('/charts/reward', async (c) => {
  const a = requireAuth(c); if (a) return a;
  const role = c.get('role'); const userId = c.get('userId');
  const kid = c.req.query('kid') || (role === 'kid' ? userId : null);
  if (!kid) return c.json({ ok:false, error:'kid_required' }, 400);

  // family guard
  const myFam = await getUserFamilyId(c, role === 'kid' ? kid : userId);
  const kidRow = await c.env.DB.prepare(`SELECT display_name, points_balance, family_id FROM KidProfile WHERE user_id=?`).bind(kid).first<any>();
  if (!kidRow || kidRow.family_id !== myFam) return c.json({ ok:false, error:'wrong_family' }, 403);

  // count approved required/paid in last 7d
  const since = Date.now() - 7*24*60*60*1000;
  const rows = await c.env.DB.prepare(`
    SELECT is_required, COUNT(*) AS n FROM Chore
    WHERE kid_user_id=? AND status='approved' AND created_at >= ?
    GROUP BY is_required
  `).bind(kid, since).all<any>();
  let req=0, paid=0;
  for (const r of (rows.results ?? [])) (r.is_required===1 ? (req+=r.n) : (paid+=r.n));

  const ex = await c.env.DB.prepare(`SELECT currency_code FROM ExchangeRule WHERE family_id=?`).bind(myFam).first<any>();

  const svg = svgChart({
    kid, displayName: kidRow.display_name,
    weekRequired: req, weekPaid: paid,
    balance: kidRow.points_balance,
    currency: ex?.currency_code ?? 'USD'
  });

  const key = `charts/${kid}/${Date.now()}.svg`;
  await c.env.ASSETS.put(key, svg, { httpMetadata: { contentType: 'image/svg+xml' } });

  // Proxy URL from Worker so R2 needn't be public
  return c.json({ ok:true, url: `/charts/${encodeURIComponent(key)}` });
});

// Serve a chart from R2 (public proxy)
app.get('/charts/:key{.+}', async (c) => {
  const key = decodeURIComponent(c.req.param('key'));
  const obj = await c.env.ASSETS.get(key);
  if (!obj) return c.text('Not found', 404);
  return new Response(obj.body, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control':'public, max-age=3600' }});
});

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
    // Scan families with weekly_allowance_points > 0
    const fams = await env.DB.prepare(`
      SELECT family_id, weekly_allowance_points FROM ExchangeRule WHERE weekly_allowance_points > 0
    `).all<{ family_id: string, weekly_allowance_points: number }>();

    const now = Date.now();

    for (const f of (fams.results ?? [])) {
      const kids = await env.DB.prepare(`
        SELECT user_id FROM KidProfile WHERE family_id = ?
      `).bind(f.family_id).all<{ user_id: string }>();

      for (const k of (kids.results ?? [])) {
        // credit points
        const ledgerId = uid('plg');
        await env.DB.prepare(`
          INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
          VALUES (?,?,?,?,?,?,?)
        `).bind(ledgerId, k.user_id, f.family_id, (f as any).weekly_allowance_points, 'weekly_allowance', null, now).run();

        await env.DB.prepare(`
          UPDATE KidProfile SET points_balance = points_balance + ? WHERE user_id=?
        `).bind((f as any).weekly_allowance_points, k.user_id).run();
      }
    }
  }
};
