-- Add admin flag to users

ALTER TABLE User ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_is_admin ON User(is_admin);

