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
  let dbUserVersion: number | null = null;

  try {
    // lightweight D1 probe (works even with empty DB)
    const r = await c.env.DB.prepare('PRAGMA user_version;').first<{ "user_version": number }>();
    dbUserVersion = (r && (r as any).user_version) ?? null;
    d1Ok = true;
  } catch {
    d1Ok = false;
  }

  try {
    const testKey = `healthz:${Date.now()}`;
    await c.env.SESSION_KV.put(testKey, 'ok', { expirationTtl: 60 });
    const v = await c.env.SESSION_KV.get(testKey);
    kvOk = v === 'ok';
  } catch {
    kvOk = false;
  }

  return c.json({
    ok: true,
    service: 'chorecoins-api',
    d1: { ok: d1Ok, user_version: dbUserVersion },
    kv: { ok: kvOk }
  });
});

// optional: version
app.get('/version', (c) => c.json({ version: '0.0.1' }));

export default app;

