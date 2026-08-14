# PLAN — Moozhaf: Murojaah & Hafalan (Perorangan)

> Plan fitur **pemantauan hafalan & murajaah per-orangan** di Moozhaf (`quran-hadis`).
> Di-eksekusi manual oleh Edo via agent. Document di `plan/hafalan-murajaah.md`.
> Berbeda dari `plan/PLAN.md` awal (versi group) — versi ini **per-orangan, wajib login**.

> **Status:** PLAN (belum eksekusi).

**Goal:** User login sendiri → memantau **murajaah** (riwayat bacaan harian + total) dan **hafalan** (checklist per-juz ATAU per-surah). Checklist dicentang langsung di halaman juz/surah. Entry point tambahan dari halaman profile.

**Architecture:** React Router 7 + Cloudflare Worker + **Cloudflare D1** (sudah ada `moozhaf-db`). Auth **Google OAuth** (sudah ada di `workers/api/odoj.ts`). Scoped per-user dari session cookie.

---

## Halaman & route

| Route | Fungsi |
|---|---|
| `/murajaah` | Homepage murajaah (masuk utama) |
| `/murajaah/tracker` | Halaman tracker hafalan (checklist), mode juz ATAU surah |
| `/login` | (sudah ada) guard bila belum login |

**Guard:** `/murajaah` & `/murajaah/tracker` wajib login → redirect `/login` (state.from untuk balik).

## Tracker (`/murajaah/tracker`)

- **Dua mode terpisah**: mode **juz** & mode **surah** — user bisa ganti-ganti (toggle/segmented control).
- Mode **juz**: daftar 30 juz (dari `app/data/juz.json`), tiap juz actionable → checkbox / klik centang.
- Mode **surah**: daftar 114 surah (dari `getSurahIndex()`), tiap surah actionable → checkbox / klik centang.
- **Checklist bisa centang di halaman juz/surah**: di `/quran/juz/:number` & `/quran/:number` ada tombol/card "Tandai hafalan selesai" (toggle) yang menulis ke API.

---

## Skema DB (migration)

Create: `migrations/0003_hafalan_murojaah.sql`

```sql
-- Status hafalan per-juz (user_id + juz_number unik)
CREATE TABLE IF NOT EXISTS hafalan_juz (
  user_id     TEXT NOT NULL,
  juz_number  INTEGER NOT NULL,          -- 1..30
  done        INTEGER NOT NULL DEFAULT 0, -- 0/1
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, juz_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Status hafalan per-surah (user_id + surah_number unik)
CREATE TABLE IF NOT EXISTS hafalan_surah (
  user_id       TEXT NOT NULL,
  surah_number  INTEGER NOT NULL,        -- 1..114
  done          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, surah_number),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Log murajaah (riwayat bacaan harian) — streak kumulatif = COUNT(DISTINCT date)
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
```

> Migration juga menyertakan index & bisa di-apply: `npx --yes wrangler@4.88.0 d1 execute moozhaf-db --file=migrations/0003_hafalan_murojaah.sql`.

---

## API (Hono, scoped user dari session)

Create `workers/api/hafalan.ts`; routing di `workers/app.ts` (`/api` → odojApp, tambah hafalanApp). Semua butuh auth (user_id dari session cookie yang sudah ada).

**Hafalan (checklist):**
- `GET /api/hafalan/juz` → `{ list: [{ juz_number, done }] }` (user scoped)
- `PUT /api/hafalan/juz/:n` `{ done: boolean }` → upsert (set status)
- `GET /api/hafalan/surah` → `{ list: [{ surah_number, done }] }`
- `PUT /api/hafalan/surah/:n` `{ done: boolean }` → upsert

**Murojaah (riwayat):**
- `GET /api/murojaah` → `{ list, total_days, today_done }`
  - `list` = riwayat centang (tanggal + mode + ref)
  - `total_days` = `COUNT(DISTINCT date)` (kumulatif, tanpa reset)
  - `today_done` = jumlah centang hari ini
- `PUT /api/murojaah` `{ mode, ref_number }` → **centang/checklist hari ini untuk target itu** (upsert: set/remove flag hari ini). Otomatis tercatat di riwayat tanggal hari ini.
  - Tidak ada `POST`/`DELETE` — centang hari ini cukup sekali, toggle cukup lewat `PUT` (insert jika belum, remove jika sudah = uncheck).

> **Catatan** (keputusan 2026-08-14): API murojaah **tidak pakai `POST`/`DELETE`** — karena murojaah sesungguhnya = checklist centang harian, bukan logging yang perlu dihapus. Cukup `GET` (baca riwayat/stats) + `PUT` (toggle/centang hari ini).

---

## UI files

**Create:**
- `app/routes/murajaah.tsx` — homepage murajaah (stats: total hari, hari ini, progress; link ke tracker)
- `app/routes/murajaah/tracker.tsx` — tracker dengan mode toggle juz/surah + checklist
- `app/components/murajaah/tracker.tsx` — (opsional) komponen tracker reusable utk halaman & bisa di-embed

**Modify:**
- `app/routes.ts` — daftar `murajaah`, `murajaah/tracker`
- `app/routes/user-profile.tsx` — tambah entry point / card menu "Murajaah & Hafalan"
- `app/routes/quran/juz.tsx` — tambah toggle "Tandai hafalan juz selesai" (checklist)
- `app/routes/quran/surah.tsx` — tambah toggle "Tandai hafalan surah selesai" (checklist)
- `app/components/app-shell.tsx` atau `more.tsx` — tambah menu/nav ke `/murajaah`
- `app/lib/i18n.tsx` — keys label murajaah (id & en)

---

## Langkah eksekusi (urutan)

1. **Migration** `0003_hafalan_murojaah.sql` + apply lokal/remote.
2. **API** `workers/api/hafalan.ts` (juz/surah get-put + murojaah log) + routing.
3. **Typecheck worker config** (`wrangler types`).
4. **Route** daftar `murajaah` & `murajaah/tracker` dengan guard auth.
5. **Halaman** `/murajaah` (stats + entry) & `/murajaah/tracker` (mode toggle + checklist).
6. **Checklist di halaman juz/surah**: tambah tombol tandai done di `/quran/juz/:number` & `/quran/:number` (fetch PUT).
7. **Navigasi**: menu di `more.tsx`/nav + card entry di `user-profile.tsx`.
8. **i18n** keys.
9. **Typecheck & build** (bun).
10. **Commit & push** (auto-deploy).
11. **Verifikasi manual**: login → `/murajaah` → tracker toggle juz/surah → centang → cek di halaman juz/surah → reload data tetap ada.

---

## Daftar file berubah

**Create:** `migrations/0003_hafalan_murojaah.sql`, `workers/api/hafalan.ts`, `app/routes/murajaah.tsx`, `app/routes/murajaah/tracker.tsx`, `plan/hafalan-murajaah.md`.
**Modify:** `workers/app.ts`, `workers/api/odoj.ts` (reuse auth req), `app/routes.ts`, `app/routes/user-profile.tsx`, `app/routes/quran/juz.tsx`, `app/routes/quran/surah.tsx`, `app/routes/more.tsx`, `app/lib/i18n.tsx`, `worker-configuration.d.ts` (auto).
**Jangan diubah:** `react-router.config.ts`, `vite.config.ts`.

---

## Risiko / catatan
- **Bug pre-existing `workers/api/odoj.ts:239`** (Google OAuth header rusak) — bisa memblokir login → perlu difix terlebih dahulu agar fitur per-user berjalan.
- Streak murojaah **kumulatif** (total hari unik) sesuai keputusan awal — TANPA reset.
- Checklist juz & surah **terpisah** (2 tabel/status berbeda), sesuai permintaan "dipisah aja trackernya".
- Guard route butuh auth; tanpa login arahkan ke `/login`.
- Data status kecil (114 surah + 30 juz per user) — ringkas, aman di D1.
