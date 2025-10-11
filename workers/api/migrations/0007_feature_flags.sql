-- Feature flags for safe rollout

CREATE TABLE IF NOT EXISTS FeatureFlag (
  key TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS FamilyFlag (
  family_id TEXT NOT NULL,
  key TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(family_id, key)
);

