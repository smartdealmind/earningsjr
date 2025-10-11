import { Hono } from 'hono';
import { uid, hashPassword, verifyPassword, cookieSerialize } from './lib';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

type Vars = { userId?: string, role?: string };

const app = new Hono<{ Bindings: Bindings, Variables: Vars }>();

// CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');
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
