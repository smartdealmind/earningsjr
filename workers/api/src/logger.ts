import { uid } from './lib';

export async function audit(c: any, {
  action, targetId, meta = {}, familyId
}: { action: string; targetId?: string; meta?: any; familyId?: string }) {
  try {
    const id = uid('aud');
    const ts = Date.now();
    const userId = c.get('userId') ?? null;
    const ip = c.req.header('CF-Connecting-IP') ?? null;
    const ua = c.req.header('User-Agent') ?? null;
    const fam = familyId ?? (userId ? await getFam(c, userId) : null);
    
    await c.env.DB.prepare(
      `INSERT INTO AuditLog (id,ts,user_id,family_id,action,target_id,meta_json,ip,ua)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, ts, userId, fam, action, targetId ?? null, JSON.stringify(meta).slice(0, 2048), ip, ua).run();
  } catch (e) {
    // Don't throw on logging failures
    console.error('Audit log failed:', e);
  }
}

async function getFam(c: any, userId: string) {
  const r = await c.env.DB.prepare(
    `SELECT family_id FROM FamilyMember WHERE user_id=? LIMIT 1`
  ).bind(userId).first<{ family_id: string }>();
  return (r as any)?.family_id ?? null;
}

