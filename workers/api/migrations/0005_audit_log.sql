-- Audit log for security and compliance

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  user_id TEXT,
  family_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  meta_json TEXT NOT NULL,
  ip TEXT,
  ua TEXT,
  FOREIGN KEY(user_id) REFERENCES User(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON AuditLog(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLog(action);
CREATE INDEX IF NOT EXISTS idx_audit_family ON AuditLog(family_id);

