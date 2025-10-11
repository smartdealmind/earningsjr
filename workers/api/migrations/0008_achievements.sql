-- Achievements & Badges

CREATE TABLE IF NOT EXISTS Achievement (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_reward INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS BadgeAward (
  id TEXT PRIMARY KEY,
  kid_user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  awarded_at INTEGER NOT NULL,
  meta_json TEXT,
  UNIQUE (kid_user_id, achievement_key),
  FOREIGN KEY(kid_user_id) REFERENCES KidProfile(user_id) ON DELETE CASCADE,
  FOREIGN KEY(achievement_key) REFERENCES Achievement(key) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS KidStats (
  kid_user_id TEXT PRIMARY KEY,
  total_approved INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  last_approved_day INTEGER,
  streak_days INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(kid_user_id) REFERENCES KidProfile(user_id) ON DELETE CASCADE
);

-- Seed base achievements
INSERT OR IGNORE INTO Achievement (key, title, description, icon, points_reward) VALUES
  ('first_chore', 'First Steps', 'Completed your very first chore!', '🌟', 10),
  ('five_chores_week', 'Week Warrior', 'Completed 5+ chores this week', '🔥', 25),
  ('hundred_points', 'Century Club', 'Earned 100+ lifetime points', '💯', 50),
  ('streak_3', 'On a Roll', '3-day approval streak', '⚡', 15);

