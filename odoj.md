# PLAN — Moozhaf: One Day One Juz (ODOJ)

> Plan manajemen fitur. Di-eksekusi **manual** oleh Edo (bukan lewat memory). Document dikelola di repo (`odoj.md`) supaya selalu sinkron dengan codebase.

**Goal:** Fitur **One Day One Juz (ODOJ)** di Moozhaf (`quran-hadis`): admin menugaskan **30 juz (full Al-Qur'an) setiap hari** ke daftar nama peserta. Tiap penugasan menghasilkan **link unik** untuk peserta → peserta buka link, **redirect ke halaman baca juz**, lalu menandai **"Selesai dibaca"**. Riwayat penugasan + status selesai tercatat per tanggal.

**Siapa yang berinteraksi:**
- **Admin** — satu-satunya yang **login**. Kelola nama, assign 30 juz tiap hari, kirim link, dan lihat/mengisi status selesai dari halaman admin.
- **Peserta** — **TANPA login**. Cukup punya **link unik**. Buka link → redirect ke halaman baca juz → tap "Selesai dibaca". Friction ~0, cocok untuk ritual ibadah harian.

**Model akses:** **Model A + token link.** Admin login; peserta tanpa akun, diidentifikasi via token di URL. Keputusan ini karena ODOJ = tantangan ibadah harian (friction peserta harus minimal) dan data yang dilindungi (siapa pegang juz apa) tidak sensitif. Link per tanggal + juz + token; risiko "link bocor" dapat diterima (dampak maksimal = centang palsu pada log ibadah, tanpa kerugian materi).

**Architecture:** React Router 7 full-stack di Cloudflare Worker (sudah ada). Data di **Cloudflare D1** (SQLite). Auth **hanya admin** (email/password + session cookie, pakai util `workers/lib/crypto.ts` & `workers/lib/session.ts`). Endpoint token peserta **public** (tanpa session), hanya validasi token.

> ⚠️ Catatan: keputusan routing API (Hono-style di worker vs React Router) ada di keputusan arsitektur di bawah — baca dulu sebelum coding.

**Tech Stack:** Cloudflare Workers (V8), D1, React Router 7, Radix UI + Tailwind v4 (sudah ada), i18n id/en (`@/lib/i18n`).

**Menambahkan keputusan arsitektur routing API:**

> ⚠️ **ARSITEKTUR API — WAJIB IKUTI** (kesepakatan Edo, Opsi B):
> API ODOJ & Auth disusun dengan **library Hono** untuk rute `/api/*`, sementara **React Router tetap entry utama Worker**.
> - **Install `hono`** sebagai dependency.
> - `workers/api/odoj.ts` = `new Hono()` dengan route builder (`.get(...)`, `.post(...)`, dst) utk semua path `/api/...`. **Bukan** manual `if pathname`, **bukan** React Router loader/action.
> - **`workers/app.ts` tetap entry utama** (React Router via `createRequestHandler`). Tambahkan: tangkap request `/api/*` → panggil `odojApp.fetch(request, env)` (Hono), selain itu → `requestHandler` React Router. Jangan jadikan Hono entry utama.
> - **Utilitas auth (bukan rute HTTP)**: `workers/lib/crypto.ts` & `workers/lib/session.ts` (diimpor dari router Hono).
> - **D1** diakses via `env.moozhaf_db` (binding `moozhaf_db` di `wrangler.json`). Di Hono, baca via `c.env.moozhaf_db`.
> - **UI ODOJ** (halaman admin & halaman view peserta) tetap React Router (`app/routes/...`), dan memanggil API `/api/...` via `fetch` di client.
> - Halaman baca Al-Qur'an existing (`app/routes/quran/surah.tsx` / `ayah.tsx`) tinggal ditambah tombol **"Selesai dibaca"** yang tampil **bila ada query param `odoj_token`**, memanggil `POST /api/odoj/read/complete`.
> - `workers/app.ts` adalah satu-satunya titik masuk Worker (`main` di wrangler.json) — jangan membuat entry worker kedua.

---

## 🛠️ Langkah Implementasi Berurutan (panduan eksekusi untuk agent/developer)

Urutan kerja yang diikuti. Commit tiap tahap ke branch `features`.

### Tahap A — Install Hono (dependensi)
```bash
# di root repo moozhaf (pakai npm/bun sesuai pengelola repo)
npm install hono          # atau: bun add hono
```
- Pastikan `hono` masuk `dependencies` (package.json), bukan devDependency.

### Tahap B — Refactor `workers/api/odoj.ts` ke Hono
- Tulis ulang file jadi: `export const odojApp = new Hono<{ Bindings: Env }>()`.
- Pindahkan SEMUA endpoint yang ada (yang sekarang masih manual `if pathname`) ke route builder Hono:
  - `auth`: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  - `group`: `POST /odoj/groups`, `GET /odoj/groups/me`
  - public: `GET /odoj/view`, `POST /odoj/read/complete`
  - peserta: `GET|POST /odoj/participants`, `DELETE /odoj/participants/:id`
  - assign: `GET|PUT /odoj/assignments`, `PUT /odoj/assignments/:id/done|undone`
  - copy: `POST /odoj/assignments/copy-template`
  - history: `GET /odoj/history`
- D1 diakses `c.env.moozhaf_db` (buat helper `db(c)`).
- Util `crypto.ts` & `session.ts` tetap diimpor dari `workers/lib/`.
- Hapus blok manual pathname; ganti semua dengan route Hono.

### Tahap C — Sambungkan di `workers/app.ts` (entry utama React Router tetap)
- `app.ts` **tetap** pakai `createRequestHandler` (React Router entry utama — jangan diubah jadi Hono entry).
- Ubah `fetch` handler: jika `request.url` path dimulai `/api/` → balik `odojApp.fetch(request, env)`; selain itu → `requestHandler(request, ...)`.
```ts
// contoh kerangka
const isApi = new URL(request.url).pathname.startsWith("/api");
if (isApi) return odojApp.fetch(request, env);
return requestHandler(request, { cloudflare: { env, ctx } });
```
- Verifikasi `env` yang diteruskan punya `moozhaf_db`.

### Tahap D — Daftar route UI React Router (halaman ODOJ)
- Tambah di `app/routes.ts`: `odoj/admin`, `odoj/history`, `odoj/history/:date`, `odoj/view` (publik).
- Halaman admin (`app/routes/odoj.tsx`) & riwayat: client `fetch` ke `/api/...` (lihat Task 3).
- Halaman view publik (`odoj/view`): client `fetch` ke `GET /api/odoj/view` (lihat Task 4).
- Tombol "Selesai dibaca" di `quran/surah.tsx` / `ayah.tsx`: tampil bila ada `odoj_token` di URL → `fetch` `POST /api/odoj/read/complete`.

### Tahap E — Typecheck & build (wajib lolos sebelum commit)
```bash
npm run cf-typegen && tsc -b          # types + typecheck
react-router build                    # build
wrangler deploy --dry-run             # pastikan binding moozhaf_db terbaca
```

### Tahap F — Deploy & verifikasi manual
- Ikuti Task 6 (login → buat group → assign → share view → buka dari device lain → tandai selesai → cek riwayat + isolasi group).

---

## ⚠️ Ketergantungan / prasyarat

- Auth admin: **sudah dirancang** di odoj ini (register terbuka → user bikin group). Util `crypto.ts`/`session.ts` sudah dibuat. Tidak perlu menunggu `PLAN.md` untuk eksekusi ODOJ.
- ~~D1 Blocker~~ ✅ **SUDAH TERATASI** (commit `dc94661` di `master`): DB `moozhaf-db` dibuat, binding `moozhaf_db` terpasang, migration `0001_init.sql` & `0001_odoj.sql` ter-apply remote. Token Cloudflare tersimpan di `.env` (jangan di-commit).
- Perlu tau halaman baca juz yang sudah ada di Moozhaf: `app/routes/quran/surah.tsx` (`/quran/:number`) & `app/routes/quran/ayah.tsx` (`/quran/:number/:ayah`). Ini target redirect link peserta & tempat tombol "Selesai dibaca".

---

**Keputusan produk (sudah disepakati Edo)**

- 🗂️ **Multi-Group**: ada BANYAK **Group ODOJ**. Tiap group punya **1 admin** + daftar peserta + penugasan sendiri. Data ter-isolasi antar group (admin Group A tidak melihat/ubah data Group B).
- 🎯 **30 juz penuh di-assign setiap hari** ke nama-nama di dalam group. Bukan subset.
- 👤 **Peserta = pure nama** (tanpa akun). Per-group, admin kelola daftar nama.
- 🔑 **Link view per group**: tiap group punya **token unik** → link view `…/odoj/view?group=<group_token>&date=…` publik, tapi hanya bisa buka tanggal utk group tsb. (Tidak bisa intip group lain / tanggal lain tanpa token group yg benar.)
- 🔗 **Setiap penugasan = 1 token unik** per `(group, date, juz_number, participant)`.
- 📋 **Satu link view PUBLIK per group** menampilkan SEMUA juz + nama utk tanggal tsb. Admin share link ini sekali ke group WA.
- 🖱️ **Peserta klik baris juznya** → redirect halaman baca juz (`/quran/<juz>`) dgn token → tombol **"Selesai dibaca"**.
- ✅ **Status `done` bisa diisi peserta (via link) ATAU admin**. Status: `'assigned'` → `'done'`.
- 🔁 **1 orang boleh pegang >1 juz** (muncul beberapa baris utk nama itu).
- 📅 **Riwayat + status per tanggal tercatat**. **List tanggal** per group menampilkan per baris: **juz terisi + jumlah juz selesai dibaca** (mis. "23/30 terisi, 18/30 selesai").
- ⏩ **Copy template antar-tanggal** + pintasan "Copy dari format kemarin" (masih per group).
- 🔔 **Kirim WA otomatis per peserta** (`?phone=`) = **luar scope awal** opsional; inti share = link view publik utk group. 
- 🔐 **Auth**: 1 akun admin per group. Tabel `users` (dari `PLAN.md`) → kolom `odoj_group_id` menandai admin group tsb (atau tabel relasi admin–group).

---

## Task 1: Migration skema

Create: `migrations/0001_odoj.sql` *(sudah dibuat & ter-apply remote di branch `features` — commit `99b0a7c`)*
```sql
-- Group ODOJ: unit utama. Tiap group punya admin + peserta + penugasan sendiri.
CREATE TABLE IF NOT EXISTS odoj_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,          -- nama group, mis. "Group Tahfidz Masjid X"
  admin_user_id TEXT NOT NULL, -- user id admin (dari tabel users di PLAN.md)
  token TEXT NOT NULL UNIQUE,  -- token utk link view publik group ini
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Peserta per group
CREATE TABLE IF NOT EXISTS odoj_participants (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES odoj_groups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_odoj_part_group ON odoj_participants(group_id);

-- Penugasan harian per group: juz -> peserta, per tanggal, + token + status
CREATE TABLE IF NOT EXISTS odoj_assignment (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  date TEXT NOT NULL,            -- YYYY-MM-DD (lokal)
  juz_number INTEGER NOT NULL,   -- 1..30
  participant_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,    -- token unik utk link baca peserta
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
```
Terapkan: `npx --yes wrangler@4.88.0 d1 execute moozhaf-db --file=migrations/0002_odoj.sql`

## Task 2: API ODOJ

Create `workers/api/odoj.ts`; routing di `workers/app.ts`.

**Group — setup (admin mana pun):**
- `POST /api/odoj/groups` `{name}` — buat group, set `admin_user_id`=user sesi → generate `token` group. (User bisa punya >1 group? asumsi: 1 user = 1 group utk sekarang — konfirmasi; atau izinkan multi.)
- `GET /api/odoj/groups/me` — group(s) milik user sesi (buat routing admin ke group-nya).

**Public (tanpa auth):**
- `GET /api/odoj/view?group=<group_token>&date=YYYY-MM-DD` — data view utk group+date: `{date, group_name, list:[{juz_number, participant_name, token, status}]}`. Validasi token group & tanggal. Tanpa token benar → 404.
- `POST /api/odoj/read/complete {token}` — peserta tandai **"Selesai dibaca"** → `status='done'`, `done_by='participant'`, `read_at=now`. Idempoten.

**Admin-only (guard session + scope group user sesi):**
- `GET /api/odoj/participants` — daftar nama group ini.
- `POST /api/odoj/participants` `{name}` — tambah nama ke group ini.
- `DELETE /api/odoj/participants/:id` — hapus nama dari group ini.
- `GET /api/odoj/assignments?date=YYYY-MM-DD` — penugasan 1 tanggal (default hari ini) → list `{juz, participant_id, name, status}`.
- `PUT /api/odoj/assignments` `{date, juz_number, participant_id}` — assign (upsert) group ini. **Generate token saat assignment baru.** Validasi juz 1–30, tanggal, dan participant milik group ini.
- `PUT /api/odoj/assignments/:id/done` — admin tandai done (`done_by='admin'`).
- `PUT /api/odoj/assignments/:id/undone` — balik `assigned`.
- `POST /api/odoj/assignments/copy-template` `{from_date, to_date}` — salin penugasan (sesi group) antar tanggal. **Token baru per baris hasil copy.** Konfirmasi bila target sudah terisi.
- `GET /api/odoj/history?from=&to=` — riwayat per tanggal group ini: `{date, total_assigned, total_done}` + detail.

Rules: tanggal `YYYY-MM-DD`; juz 1–30; token random kuat; SEMUA query scoped `group_id` dari sesi (pastikan tidak bocor antar group).

## Task 3: UI Admin ODOJ

Create `app/routes/odoj.tsx`; update `app/routes.ts`.

- **Guard admin**: redirect ke `/login` bila belum auth.
- **Setup group** (hanya jika user belum punya group / saat login): form nama group → buat group → redirect ke dashboard group-nya.
- **Panel "Kelola Nama"** (scoped group ini): input nama + list peserta + hapus (dropdown dipakai saat assign).
- **Halaman Assign (grid juz 1–30)** — halaman kerja utama. Tiap juz = select nama → assign; perubahan → `PUT`; juz kosong ditandai (merah/border). **Setiap juz di-assign punya tombol/check "Selesai dibaca"** (`PUT /done`/`/undone`, `done_by='admin'`). Ada **2 entry point**:
  - **Entry 1 — "Buat Baru" (kosong):** tombol **"Copy dari format kemarin"** → `copy-template {from_date: kemarin, to_date: target}`. **Hari pertama → disabled** + note "Belum ada data kemarin".
  - **Entry 2 — dari Riwayat:** baris tanggal → tombol **"Copy format ini"** → masuk halaman assign terisi (pre-fill). Konfirmasi bila target sudah terisi.
- **Tombol "Share link view"** → salin link publik utk group+date (`/odoj/view?group=<group_token>&date=<tanggal>`) utk dishare ke group WA. (Opsional: QR utk mudah dibuka di HP.)
- **Riwayat — 2 halaman (scoped group ini):**
  - **Halaman "Riwayat" (list tanggal)** (`/odoj/history`): semua tanggal berpenugasan, urut terbaru. Tiap baris: tanggal + ringkasan **`X/30 terisi · Y/30 selesai`** + tombol **"Copy format ini"** + link ke detail + link view publik.
  - **Halaman "Riwayat detail"** (`/odoj/history/:date`): isi penugasan tanggal tsb — juz 1–30 + nama + status (selesai/belum). Tombol "Edit"/"Copy" → halaman assign terisi; tombol "Selesai dibaca"/undo per juz.

## Task 4: Halaman View Publik + Redirect Peserta (tanpa login)

- **Halaman View** (`/odoj/view?group=<group_token>&date=YYYY-MM-DD`) — **public, tanpa login**:
  1. Call `GET /api/odoj/view?group=…&date=…`.
  2. Tampilkan nama group + judul (tanggal) + **tabel 30 juz**: kolom Juz | Nama | status (Selesai/Belum). Tiap baris = link **"Baca juz ini"** (ke halaman baca juz + token).
  3. Token group salah / tidak ada data tanggal tsb → pesan "Belum ada penugasan untuk tanggal ini" / "Link tidak valid".
- **Redirect & tombol "Selesai dibaca"** (di halaman baca juz `/quran/:juz`):
  1. Klik baris → redirect `/quran/<juz>?odoj_token=<token>`.
  2. Halaman baca juz, bila ada `odoj_token` → tampilkan tombol **"Selesai dibaca"** → `POST /api/odoj/read/complete {token}` → feedback sukses ("Alhamdulillah, tercatat").
  3. Token invalid → pesan ramah "Link tidak valid". **Catatan**: tombol hanya tampil bila `odoj_token` ada di URL; alur baca normal tanpa token tidak berubah.

## Task 5: Navigasi

- Update `app/routes/more.tsx` (tambah menu "One Day One Juz") → guard admin; jika user belum punya group, arahkan ke **setup group**.
- Route admin ODOJ ter-isolasi per group (user hanya lihat data group-nya).
- Route **view publik** (`/odoj/view` & tombol di halaman baca juz) **tanpa login**, tapi validasi `group_token` / `odoj_token`.

## Task 6: Deploy & verifikasi

1. Migration skema sudah ter-apply (lihat Task 1). Jika ada perubahan skema baru → `npx --yes wrangler@4.88.0 d1 execute moozhaf-db --remote --file=migrations/<file>.sql`
2. `npx --yes wrangler@4.88.0 deploy`
3. Test browser: login admin → **buat group** → tambah nama → assign 30 juz → **copy dari kemarin / copy format ini dr riwayat** → **share link view** → buka di browser lain (inkognito) → lihat tabel juz+nama → klik baris → **redirect ke halaman juz** → tap "Selesai dibaca" → cek admin: status done, `done_by='participant'`, hitungan "selesai" di list tanggal naik. Test juga tandai done dari sisi admin, dan pastikan **admin group lain tidak bisa melihat/ubah group ini** (uji isolasi).

---

## Daftar file berubah

**Create:** `migrations/0001_odoj.sql` *(sudah, commit `99b0a7c`)*, `workers/api/odoj.ts` *(WIP, refactor ke Hono)*, `workers/lib/crypto.ts` & `workers/lib/session.ts` *(sudah, commit `99b0a7c`)*, `app/routes/odoj.tsx`, `app/routes/odoj-history.tsx`, `app/routes/odoj-view.tsx`. **Modify route baca juz** (tambah tombol "Selesai dibaca" conditional).
**Modify:** `workers/app.ts` (sambung Hono utk `/api/*`), `app/routes.ts`, `app/routes/more.tsx`, `app/routes/quran/surah.tsx` & `quran/ayah.tsx` (tambah tombol done bila `odoj_token` ada), `app/lib/i18n.tsx`, `worker-configuration.d.ts` (via `wrangler types`).
**Dependensi baru:** `hono` (install di Tahap A).
**Jangan diubah:** `react-router.config.ts`, `vite.config.ts`, file `.server` internal.

## Risiko / catatan

- **Auth & tabel `users`** tergantung `PLAN.md`; kalau belum kelar, butuh versi admin-only ringan dulu (kalau begitu, `odoj_groups.admin_user_id` menunjuk user admin tunggal / superadmin).
- **Isolasi antar group** adalah prioritas keamanan — setiap query admin wajib scoped `group_id` dari sesi; jangan sampai token view/group bocor antar group.
- **Dua jenis token berbeda**: `group_token` (link view publik per group) vs `odoj_token`/`token` (link baca per assignment). Jangan tertukar.
- **Link peserta valid selamanya** kecuali dibatalkan/hapus; opsional kadaluarsa per tanggal (luar scope).
- **Risiko link view/token bocor** — diterima (data tidak sensitif); token panjang + acak.
- **1 peserta multi-juz** = beberapa baris/link pada tanggal tsb.
- **Copy template meng-generate token baru** (jangan samakan token antar tanggal/group).
- **Kirim WA otomatis** (`?phone=`) butuh nomor HP peserta → **luar scope awal**; saat ini share = link view publik ke group.
