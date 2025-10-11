-- Trusted relatives invite flow

CREATE TABLE IF NOT EXISTS TrustedInvite (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  expires_at INTEGER NOT NULL,
  accepted_by TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trustedinvite_family ON TrustedInvite(family_id);

