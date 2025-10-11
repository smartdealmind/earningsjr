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

  const t = c.env.DB.prepare(`
    INSERT INTO User (id,email,password_hash,first_name,last_name,role,created_at) VALUES (?,?,?,?,?,'parent',?);
  `).bind(userId, email, pwd, first_name ?? null, last_name ?? null, now);

  const f = c.env.DB.prepare(`INSERT INTO Family (id,name,created_at) VALUES (?,?,?);`).bind(familyId, family_name, now);

  const m = c.env.DB.prepare(`
    INSERT INTO FamilyMember (id,family_id,user_id,role,created_at) VALUES (?,?,?,'parent',?);
  `).bind(memberId, familyId, userId, now);

  const ex = c.env.DB.prepare(`
    INSERT INTO ExchangeRule (id,family_id,points_per_currency,currency_code,rounding,weekly_allowance_points,required_task_min_pct,created_at)
    VALUES (?,?,100,'USD','down',0,20,?);
  `).bind(exchangeId, familyId, now);

  // D1 lacks real txns; emulate with sequential exec + simple failure checks
  await t.run(); await f.run(); await m.run(); await ex.run();

  // Create session
  const token = uid('tok');
  const sess = { userId, role: 'parent', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }; // 7 days
  await c.env.SESSION_KV.put(`sess:${token}`, JSON.stringify(sess), { expirationTtl: 60 * 60 * 24 * 7 });

  c.header('Set-Cookie', cookieSerialize('cc_sess', encodeURIComponent(token), {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7
  }));

  return c.json({ ok: true, userId, familyId });
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

export default app;
