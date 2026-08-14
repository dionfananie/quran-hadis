-- 0003_hafalan_murojaah.sql
-- Status hafalan per-juz (user_id + juz_number unik). Setiap baris = state checklist (0/1).
CREATE TABLE IF NOT EXISTS hafalan_juz (
  user_id     TEXT NOT NULL,
  juz_number  INTEGER NOT NULL,          -- 1..30
  done        INTEGER NOT NULL DEFAULT 0, -- 0/1
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, juz_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Status hafalan per-surah (user_id + surah_number unik).
CREATE TABLE IF NOT EXISTS hafalan_surah (
  user_id       TEXT NOT NULL,
  surah_number  INTEGER NOT NULL,        -- 1..114
  done          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, surah_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Log murajaah (riwayat centang harian). Streak kumulatif = COUNT(DISTINCT date).
CREATE TABLE IF NOT EXISTS murojaah_log (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  date          TEXT NOT NULL,           -- YYYY-MM-DD
  mode          TEXT NOT NULL DEFAULT 'surah', -- 'surah' | 'juz'
  ref_number    INTEGER NOT NULL,        -- surah_number atau juz_number
  note          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_murojaah_user_date ON murojaah_log(user_id, date);
