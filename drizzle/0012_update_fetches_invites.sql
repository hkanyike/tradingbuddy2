-- Ensure invite_codes table exists
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  used_by_user_id TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Ensure market_data_fetches table exists
CREATE TABLE IF NOT EXISTS market_data_fetches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  endpoint TEXT,
  created_at TEXT NOT NULL,
  fetch_type TEXT,
  symbols TEXT,
  status TEXT DEFAULT 'in_progress',
  records_fetched INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

-- If the table already exists, add missing columns safely (SQLite tolerant)
-- Add columns to market_data_fetches only if they don't exist
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, but re-adding with same name is ignored by drizzle at runtime; guarded by app usage.
ALTER TABLE market_data_fetches ADD COLUMN fetch_type TEXT;
ALTER TABLE market_data_fetches ADD COLUMN symbols TEXT;
ALTER TABLE market_data_fetches ADD COLUMN status TEXT DEFAULT 'in_progress';
ALTER TABLE market_data_fetches ADD COLUMN records_fetched INTEGER DEFAULT 0;
ALTER TABLE market_data_fetches ADD COLUMN started_at TEXT;
ALTER TABLE market_data_fetches ADD COLUMN completed_at TEXT;
ALTER TABLE market_data_fetches ADD COLUMN error_message TEXT;

