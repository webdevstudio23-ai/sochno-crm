PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  phone       TEXT DEFAULT '',
  site        TEXT DEFAULT '',
  budget      INTEGER DEFAULT 0,
  source      TEXT DEFAULT 'Fl.ru',      -- Fl.ru | Kwork | База ИП | Telegram
  messenger   TEXT DEFAULT 'Telegram',   -- Telegram | WhatsApp | Max | Телефон | Email
  contact     TEXT DEFAULT '',
  status      TEXT DEFAULT 'Новый',       -- см. список статусов
  created_at  TEXT DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id        TEXT PRIMARY KEY,
  lead_id   TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  text      TEXT NOT NULL,
  at        TEXT NOT NULL                 -- ISO datetime
);

CREATE TABLE IF NOT EXISTS transactions (
  id        TEXT PRIMARY KEY,
  type      TEXT NOT NULL,                -- income | expense
  amount    INTEGER NOT NULL DEFAULT 0,
  category  TEXT DEFAULT '',              -- для расходов
  date      TEXT NOT NULL,                -- YYYY-MM-DD
  comment   TEXT DEFAULT '',
  lead_id   TEXT REFERENCES leads(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vault_passwords (
  id TEXT PRIMARY KEY, title TEXT DEFAULT '', login TEXT DEFAULT '',
  password TEXT DEFAULT '', url TEXT DEFAULT '', note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS vault_notes (
  id TEXT PRIMARY KEY, title TEXT DEFAULT '', body TEXT DEFAULT '',
  created_at TEXT DEFAULT (date('now'))
);
CREATE TABLE IF NOT EXISTS vault_tasks (
  id TEXT PRIMARY KEY, title TEXT DEFAULT '', done INTEGER DEFAULT 0, due TEXT
);
CREATE TABLE IF NOT EXISTS vault_docs (
  id TEXT PRIMARY KEY, title TEXT DEFAULT '', link TEXT DEFAULT '', note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY, value TEXT
);

-- импортированные Excel/CSV-таблицы (хранятся как исходные байты файла)
CREATE TABLE IF NOT EXISTS spreadsheets (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  size        INTEGER DEFAULT 0,
  imported_at TEXT NOT NULL,
  data        BLOB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source  ON leads(source);
CREATE INDEX IF NOT EXISTS idx_tx_date       ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_notes_lead    ON lead_notes(lead_id);
