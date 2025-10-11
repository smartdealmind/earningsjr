-- Payout system for converting points to money

CREATE TABLE IF NOT EXISTS Payout (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  kid_user_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'requested',
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  decided_by TEXT,
  ledger_hold_id TEXT,
  FOREIGN KEY(family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY(kid_user_id) REFERENCES KidProfile(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payout_family ON Payout(family_id);
CREATE INDEX IF NOT EXISTS idx_payout_status ON Payout(status);

