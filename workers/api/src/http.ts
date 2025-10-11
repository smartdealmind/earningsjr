// Unified HTTP helpers

export function ok<T extends object>(c: any, data: T, status = 200) {
  return c.json({ ok: true, ...data }, status);
}

export function err(c: any, status: number, code: string, message?: string, extra?: any) {
  return c.json({ ok: false, error: { code, message, ...extra } }, status);
}

export async function readJson<T>(c: any): Promise<T | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

// Simple sliding window: N requests / windowSec per key
export async function rateLimit(c: any, key: string, limit = 30, windowSec = 60) {
  const k = `rl:${key}:${Math.floor(Date.now()/1000/windowSec)}`;
  const cnt = Number(await c.env.SESSION_KV.get(k)) || 0;
  if (cnt >= limit) return false;
  await c.env.SESSION_KV.put(k, String(cnt + 1), { expirationTtl: windowSec + 5 });
  return true;
}

