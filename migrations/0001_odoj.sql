-- 0001_odoj.sql — Tabel fitur One Day One Juz (ODOJ)
-- Model: multi-group, tiap group punya 1 admin + link view publik + assign 30 juz/hari.

-- Group ODOJ: unit utama. Tiap group punya admin + peserta + penugasan sendiri.
CREATE TABLE IF NOT EXISTS odoj_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,          -- nama group, mis. "Group Tahfidz Masjid X"
  admin_user_id TEXT NOT NULL, -- user id admin (dari tabel users)
  token TEXT NOT NULL UNIQUE,  -- token utk link view publik group ini
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Peserta per group (pure nama, tanpa akun)
CREATE TABLE IF NOT EXISTS odoj_participants (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES odoj_groups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_odoj_part_group ON odoj_participants(group_id);

-- Penugasan harian per group: juz -> peserta, per tanggal, + token + status selesai
CREATE TABLE IF NOT EXISTS odoj_assignment (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  date TEXT NOT NULL,            -- YYYY-MM-DD (lokal)
  juz_number INTEGER NOT NULL,   -- 1..30
  participant_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,    -- token utk link baca peserta
  status TEXT NOT NULL DEFAULT 'assigned',  -- 'assigned' | 'done'
  done_by TEXT,                  -- 'admin' | 'participant'
  read_at TEXT,                  -- timestamp saat ditandai done
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES odoj_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES odoj_participants(id) ON DELETE CASCADE,
  UNIQUE (group_id, date, juz_number)
);
CREATE INDEX IF NOT EXISTS idx_odoj_assign_group_date ON odoj_assignment(group_id, date);
CREATE INDEX IF NOT EXISTS idx_odoj_assign_token ON odoj_assignment(token);
