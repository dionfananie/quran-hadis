# PLAN — Moozhaf: Fitur Murojaah & Tracker Hafalan

> Plan manajemen fitur. Di-eksekusi **manual** oleh Edo (bukan lewat memory). Document dikelola di repo (`PLAN.md`) supaya selalu sinkron dengan codebase.

**Goal:** Fitur pemantauan hafalan Al-Qur'an di Moozhaf (`quran-hadis`): **Murojaah** (log + hitung hari) dan **Tracker Hafalan** (progress per surah), dengan autentikasi email/password dan penyimpanan di Cloudflare D1.

**Architecture:** React Router 7 full-stack di Cloudflare Worker (sudah ada). Tambah binding **Cloudflare D1** (SQLite). Auth pakai **session cookie** HttpOnly tanpa library external — hash password pakai Web Crypto (PBKDF2-SHA256). Multi-user (tiap email punya data sendiri).

**Tech Stack:** Cloudflare Workers (V8), D1, React Router 7 (+Hono-style route di worker), Radix UI + Tailwind v4 (sudah ada), i18n id/en (`@/lib/i18n`).

**Keputusan final (sudah disepakati Edo — JANGAN diubah tanpa konfirmasi):**
- 🎯 Scope iterasi 1: **Murojaah + Tracker Hafalan** saja. `tes ujian` & `one-day-one-juz` = iterasi berikutnya (di luar scope).
- 📊 Status per surah cuma **`belum` / `sudah`**.
- 🔁 Streak murojaah = **KUMULATIF total** (jumlah hari unik murojaah), **TANPA reset** walau bolos.
- 🖥️ UI direkomendasikan **2 halaman terpisah**: `/hafalan` dan `/murojaah`.

---

## ⚠️ Blocker prasyarat (wajib selesai sebelum coding)

Token Cloudflare yang ada (`cfut_...` di `ai-article-writer/.env`) **hanya izin Workers/Deploy, BUKAN D1**. Sudah ditest: `wrangler d1 list` gagal `Authentication error [code: 10000]`, meski akun Super Admin.

**Opsi solusi:**
1. **`wrangler login` interaktif** (akun Super Admin): jalankan `npx --yes wrangler@4.88.0 login` dengan TTY; buka URL di browser, Allow. Server headless → pakai `ssh -L` port forward, atau login dari laptop Edo lalu token tersimpan di `~/.wrangler`.
2. **Buat API Token baru** di dashboard Cloudflare dengan izin minimal: **Account → D1 → Edit** (+ `Workers Scripts Edit` biar deploy tetap jalan). Lalu `export CLOUDFLARE_API_TOKEN=<token-baru>`.

**Verifikasi:** `cd /home/ubuntu/project/quran-hadis && npx --yes wrangler@4.88.0 d1 list` → list DB tanpa error auth.

---

## Task 1: Buat Database D1
- `npx --yes wrangler@4.88.0 d1 create moozhaf-db` → catat `database_id`.
- `npx --yes wrangler@4.88.0 types` → update `worker-configuration.d.ts`.

## Task 2: Binding D1 di wrangler.json
```jsonc
"d1_databases": [
  { "binding": "DB", "database_name": "moozhaf-db", "database_id": "<uuid>", "migrations_dir": "migrations" }
]
```

## Task 3: Migration skema
Create: `migrations/0001_init.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hafalan (
  user_id TEXT NOT NULL,
  surah_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'belum',   -- 'belum' | 'sudah'
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, surah_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS murojaah_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,               -- YYYY-MM-DD
  surah_number INTEGER NOT NULL,
  ayah_range TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_murojaah_user_date ON murojaah_log(user_id, date);
```
Terapkan: `npx --yes wrangler@4.88.0 d1 execute moozhaf-db --file=migrations/0001_init.sql`

## Task 4: Auth utility
Create:
- `workers/lib/crypto.ts` — `hashPassword(pwd)`→`{salt,hash}`, `verifyPassword(pwd,salt,hash)` via `crypto.subtle` PBKDF2-SHA256 (100k iterasi), timing-safe compare.
- `workers/lib/session.ts` — buat session token (getRandomValues), set cookie HttpOnly+Secure+SameSite=Lax, simpan di tabel `sessions`, baca/validasi dari header `Cookie` + expiry.

## Task 5: API Auth
Create `workers/api/auth.ts`; routing di `workers/app.ts`.
- `POST /api/auth/register` `{email,password}` → create user + set cookie
- `POST /api/auth/login` `{email,password}` → set cookie
- `POST /api/auth/logout` → hapus session
- `GET /api/auth/me` → `{email}` atau 401
Rules: email lowercase; password min 8 char; verify time-constant.

## Task 6: API Hafalan (CRUD)
Create `workers/api/hafalan.ts` (semua butuh auth, user_id dari session).
- `GET /api/hafalan` — semua status user
- `PUT /api/hafalan/:surah` `{status: 'belum'|'sudah'}` — set status
- `PUT /api/hafalan/:surah/review` — update `last_reviewed_at`

## Task 7: API Murojaah (+ streak kumulatif)
Create `workers/api/murojaah.ts`, `workers/lib/streak.ts`.
- `GET /api/murojaah` — daftar log + `total_days` (jumlah tanggal unik, KUMULATIF)
- `POST /api/murojaah` `{date, surah_number, ayah_range, note}` — tambah log
- `DELETE /api/murojaah/:id`
Streak kumulatif = `SELECT COUNT(DISTINCT date) FROM murojaah_log WHERE user_id=?`.

## Task 8: UI Auth
Create `app/routes/login.tsx`, `app/routes/register.tsx`; update `app/routes.ts`. Form → fetch `/api/auth/*` → redirect `/hafalan`. Tambah i18n keys.

## Task 9: UI Murojaah
Create `app/routes/murojaah.tsx`; update `app/routes.ts`. Form tambah log (pilih surah, rentang ayat, catatan) + riwayat + tampilan total hari. Pakai komponen UI yang ada.

## Task 10: UI Tracker Hafalan
Create `app/routes/hafalan.tsx`; update `app/routes.ts`. Grid surah dari `app/data/surah-index.json`, status per surah, klik set status, progress bar. Link ke `/quran/:number`.

## Task 11: Navigasi + Akses kontrol
- Update `app/routes/more.tsx` (ganti Placeholder → menu "Murojaah" & "Hafalan").
- Guard route: redirect ke `/login` bila belum auth.

## Task 12: Deploy & verifikasi
1. `npx --yes wrangler@4.88.0 d1 execute moozhaf-db --remote --file=migrations/0001_init.sql`
2. `npx --yes wrangler@4.88.0 deploy`
3. Test browser: register → login → tambah hafalan → tambah murojaah → reload data tetap ada.

---

## Daftar file berubah
**Create:** `migrations/0001_init.sql`, `workers/lib/crypto.ts`, `workers/lib/session.ts`, `workers/lib/streak.ts`, `workers/api/auth.ts`, `workers/api/hafalan.ts`, `workers/api/murojaah.ts`, `app/routes/login.tsx`, `app/routes/register.tsx`, `app/routes/murojaah.tsx`, `app/routes/hafalan.tsx`.
**Modify:** `wrangler.json`, `workers/app.ts`, `app/routes.ts`, `app/routes/more.tsx`, `app/lib/i18n.tsx`, `worker-configuration.d.ts` (via `wrangler types`).
**Jangan diubah:** `react-router.config.ts`, `vite.config.ts`, file `.server` internal.

## Risiko / catatan
- **Blocker D1** (paling kritis): must solve dulu.
- Auth homemade (PBKDF2+sessin cookie) — aman untuk skala kecil/keluarga, bukan enterprise. Tradeoff: zero dependency.
- Reset password & `tes ujian`/`one-day-one-juz` di luar scope iterasi 1.
