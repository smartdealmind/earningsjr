-- Schema: ChoreCoins v1
PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

-- Users
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK(role IN ('parent','kid','helper')),
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

-- Families
CREATE TABLE IF NOT EXISTS Family (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Memberships
CREATE TABLE IF NOT EXISTS FamilyMember (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('parent','kid','helper')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES User(id)   ON DELETE CASCADE,
  UNIQUE(family_id, user_id)
);

-- Kid profiles
CREATE TABLE IF NOT EXISTS KidProfile (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  family_id TEXT NOT NULL,
  birthdate TEXT,
  display_name TEXT,
  avatar_url TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES User(id)   ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE
);

-- Exchange rules (per family)
CREATE TABLE IF NOT EXISTS ExchangeRule (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  points_per_currency INTEGER NOT NULL,           -- e.g., 100 points = $1
  currency_code TEXT NOT NULL DEFAULT 'USD',
  rounding TEXT NOT NULL DEFAULT 'down',          -- 'nearest'|'down'|'up'
  weekly_allowance_points INTEGER NOT NULL DEFAULT 0,
  required_task_min_pct INTEGER NOT NULL DEFAULT 20,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  UNIQUE(family_id)
);

-- Task template library (global)
CREATE TABLE IF NOT EXISTS TaskTemplate (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  min_age INTEGER,
  max_age INTEGER,
  category TEXT,
  default_points INTEGER NOT NULL DEFAULT 0,
  is_required_default INTEGER NOT NULL CHECK(is_required_default IN (0,1)) DEFAULT 0,
  is_global INTEGER NOT NULL CHECK(is_global IN (0,1)) DEFAULT 1
);

-- Chores (instances)
CREATE TABLE IF NOT EXISTS Chore (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  kid_user_id TEXT,                 -- nullable until claimed/assigned
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_required INTEGER NOT NULL CHECK(is_required IN (0,1)) DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('open','claimed','submitted','approved','denied','expired')) DEFAULT 'open',
  due_at INTEGER,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,         -- user id of creator
  assigned_by_user_id TEXT,         -- who assigned to kid (if any)
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (kid_user_id) REFERENCES User(id) ON DELETE SET NULL
);

-- Chore events (timeline)
CREATE TABLE IF NOT EXISTS ChoreEvent (
  id TEXT PRIMARY KEY,
  chore_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  type TEXT NOT NULL,               -- e.g., 'created','claimed','submitted','approved','denied'
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chore_id) REFERENCES Chore(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Points ledger
CREATE TABLE IF NOT EXISTS PointsLedger (
  id TEXT PRIMARY KEY,
  kid_user_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  delta_points INTEGER NOT NULL,
  reason TEXT,
  ref_id TEXT,                      -- chore id or system ref
  created_at INTEGER NOT NULL,
  FOREIGN KEY (kid_user_id) REFERENCES User(id)   ON DELETE CASCADE,
  FOREIGN KEY (family_id)  REFERENCES Family(id) ON DELETE CASCADE
);

-- Goals
CREATE TABLE IF NOT EXISTS Goal (
  id TEXT PRIMARY KEY,
  kid_user_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_amount_cents INTEGER NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  target_points INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active','achieved','cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at INTEGER NOT NULL,
  achieved_at INTEGER,
  FOREIGN KEY (kid_user_id) REFERENCES User(id)   ON DELETE CASCADE,
  FOREIGN KEY (family_id)  REFERENCES Family(id) ON DELETE CASCADE
);

-- Kid requests (ask for extra tasks)
CREATE TABLE IF NOT EXISTS TaskRequest (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  kid_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  suggested_points INTEGER,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','denied')) DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  decided_by TEXT,
  FOREIGN KEY (family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (kid_user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Trusted links (cross-family helpers)
CREATE TABLE IF NOT EXISTS TrustedLink (
  id TEXT PRIMARY KEY,
  granting_family_id TEXT NOT NULL,
  trusted_user_id TEXT NOT NULL,
  scope TEXT NOT NULL,              -- 'assign_tasks','view_progress'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (granting_family_id) REFERENCES Family(id) ON DELETE CASCADE,
  FOREIGN KEY (trusted_user_id)     REFERENCES User(id)    ON DELETE CASCADE
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_member_family ON FamilyMember(family_id);
CREATE INDEX IF NOT EXISTS idx_member_user   ON FamilyMember(user_id);
CREATE INDEX IF NOT EXISTS idx_kidprofile_family ON KidProfile(family_id);
CREATE INDEX IF NOT EXISTS idx_chore_family_status ON Chore(family_id, status);
CREATE INDEX IF NOT EXISTS idx_chore_kid ON Chore(kid_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_kid_time ON PointsLedger(kid_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_goal_kid_status ON Goal(kid_user_id, status);
CREATE INDEX IF NOT EXISTS idx_request_kid_status ON TaskRequest(kid_user_id, status);

