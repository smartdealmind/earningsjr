import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Basic CORS for now (tighten later)
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
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

export default app;

