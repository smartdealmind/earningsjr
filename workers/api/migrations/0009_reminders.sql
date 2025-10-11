-- Daily Reminders

CREATE TABLE IF NOT EXISTS ReminderPref (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  kid_user_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  hour_local INTEGER NOT NULL DEFAULT 19,
  minute_local INTEGER NOT NULL DEFAULT 0,
  days_mask INTEGER NOT NULL DEFAULT 127,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  channel TEXT NOT NULL DEFAULT 'inapp',
  updated_at INTEGER NOT NULL,
  UNIQUE (kid_user_id),
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (kid_user_id) REFERENCES KidProfile(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminderpref_family ON ReminderPref(family_id);

CREATE TABLE IF NOT EXISTS ReminderEvent (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  kid_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  due_required_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  delivered_at INTEGER,
  acked_at INTEGER,
  status TEXT NOT NULL DEFAULT 'new',
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (kid_user_id) REFERENCES KidProfile(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminderevent_family ON ReminderEvent(family_id);
CREATE INDEX IF NOT EXISTS idx_reminderevent_kid ON ReminderEvent(kid_user_id);
CREATE INDEX IF NOT EXISTS idx_reminderevent_status ON ReminderEvent(status);

