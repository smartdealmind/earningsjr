import { uid } from './lib';
import { audit } from './logger';

async function getUserFamilyId(c: any, userId: string) {
  const fm = await c.env.DB.prepare(
    `SELECT family_id FROM FamilyMember WHERE user_id=? LIMIT 1`
  ).bind(userId).first<{ family_id: string }>();
  return (fm as any)?.family_id ?? null;
}

export async function bumpStatsAndMaybeAward(c: any, kidId: string, deltaPoints: number) {
  const day = Math.floor(Date.now() / 86400000);
  
  // Ensure KidStats row exists and update stats
  await c.env.DB.prepare(`
    INSERT INTO KidStats (kid_user_id,total_approved,total_points_earned,last_approved_day,streak_days)
    VALUES (?,1,?,?,1)
    ON CONFLICT(kid_user_id) DO UPDATE SET 
      total_approved=total_approved+1,
      total_points_earned=total_points_earned + ?,
      streak_days = CASE 
         WHEN KidStats.last_approved_day = ?-1 THEN KidStats.streak_days+1
         WHEN KidStats.last_approved_day = ? THEN KidStats.streak_days
         ELSE 1 END,
      last_approved_day = ?
  `).bind(kidId, Math.max(deltaPoints, 0), day, Math.max(deltaPoints, 0), day, day, day).run();

  // Read back stats
  const stats = await c.env.DB.prepare(
    `SELECT total_approved,total_points_earned,streak_days FROM KidStats WHERE kid_user_id=?`
  ).bind(kidId).first<any>();
  
  if (!stats) return; // safety check

  // Count approved chores in last 7 days
  const since = Date.now() - 7 * 86400000;
  const week = await c.env.DB.prepare(`
    SELECT COUNT(*) as n
    FROM ChoreEvent E
    JOIN Chore C ON C.id=E.chore_id
    WHERE E.type='approved' AND C.kid_user_id=? AND E.created_at>=?
  `).bind(kidId, since).first<any>();
  const weekApproved = (week as any)?.n ?? 0;

  // Evaluate achievement rules
  const toAward: Array<{ key: string; meta?: any }> = [];
  if (stats.total_approved === 1) toAward.push({ key: 'first_chore' });
  if (weekApproved >= 5) toAward.push({ key: 'five_chores_week', meta: { count: weekApproved } });
  if (stats.total_points_earned >= 100) toAward.push({ key: 'hundred_points', meta: { points: stats.total_points_earned } });
  if (stats.streak_days >= 3) toAward.push({ key: 'streak_3', meta: { streak: stats.streak_days } });

  // Award new badges
  for (const a of toAward) {
    // Skip if already awarded
    const exists = await c.env.DB.prepare(
      `SELECT 1 FROM BadgeAward WHERE kid_user_id=? AND achievement_key=?`
    ).bind(kidId, a.key).first();
    if (exists) continue;

    const id = uid('bad');
    const now = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO BadgeAward (id,kid_user_id,achievement_key,awarded_at,meta_json)
      VALUES (?,?,?,?,?)
    `).bind(id, kidId, a.key, now, JSON.stringify(a.meta ?? {})).run();

    await audit(c, { action: 'badge.award', targetId: id, meta: { kidId, achievement: a.key } });

    // Optional: bonus points
    const ach = await c.env.DB.prepare(`SELECT points_reward FROM Achievement WHERE key=?`).bind(a.key).first<any>();
    const bonus = (ach?.points_reward ?? 0) | 0;
    if (bonus > 0) {
      const plId = uid('plg');
      const familyId = await getUserFamilyId(c, kidId);
      await c.env.DB.prepare(`
        INSERT INTO PointsLedger (id,kid_user_id,family_id,delta_points,reason,ref_id,created_at)
        VALUES (?,?,?,?,?,?,?)
      `).bind(plId, kidId, familyId, bonus, 'badge_bonus', id, now).run();
      await c.env.DB.prepare(`UPDATE KidProfile SET points_balance=points_balance+? WHERE user_id=?`)
        .bind(bonus, kidId).run();
    }
  }
}

