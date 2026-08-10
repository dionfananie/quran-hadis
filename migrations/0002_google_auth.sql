-- 0002_google_auth.sql — Dukungan Login Google (OAuth) pada tabel users
-- Menambah kolom untuk mengaitkan akun Google + info profil dasar.

ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
