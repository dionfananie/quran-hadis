# PLAN — Moozhaf: One Day One Juz (ODOJ) PERORANGAN

> Plan manajemen fitur. Di-eksekusi **manual** oleh Edo. Document dikelola di repo (`plan/odoj-personal.md`) supaya sinkron dengan codebase.
>
> **Status desain:** ✅ **DONE** (tombol "ODOJ Saya" diimplementasikan 2026-08-14 di landing `/odoj` + card entry di `/user-profile`). TIDAK ada route/halaman baru — reuse view existing. Paling ringkas + non-destruktif. **TIDAK ada route/halaman baru.** Hanya tambah tombol **"ODOJ Saya"** di landing `/odoj` yang mengarah ke **`/odoj/view` existing** (yang sudah menampilkan daftar juz + tanggal + status). Reuse penuh skema & API ODOJ existing; ODOJ multi-group tetap utuh.

---

## Goal

Fitur **One Day One Juz (ODOJ) Perorangan** di Moozhaf (`quran-hadis`): pengguna login sendiri → melihat **view tracking pribadinya** → tahu **juz target untuk hari ini** → baca juz → tandai **"Selesai dibaca"**.

**Tanpa admin, tanpa multi-peserta, tanpa assign ke orang lain.** Murni untuk diri sendiri.

---

## Keputusan produk (kesepakatan Edo)

- 👤 **Login**: pakai **Google OAuth** yang **sudah ada** di proyek (`/api/auth/google`, `users.google_id/name/avatar_url`). Satu user = satu ODOJ pribadi.
- 🚫 **Tanpa admin-group baru, tanpa route/halaman baru.** Entry personal cukup **satu tombol di landing `/odoj`** yang mengarah ke **`/odoj/view` existing** (view publik ODOJ sudah menampilkan **daftar juz + tanggal**). Reuse penuh.
- 📅 **Model 30-hari khatam**: dari **start date**, hari ke-`n` = juz `n`. Juz 1 di hari-1, juz 2 di hari-2, … juz 30 di hari-30. Tanggal setiap juz dihitung dari start date.
- ✅ **Status `done`** dicatat per assignment. User menandai selesai dari halaman baca juz (tombol existing via `odoj_token`).
- 🔒 **Scoped per user** (group = user sendiri).

---

## Pendekatan teknis: reuse GRUP-EXISTING user (jika sudah ada) + view publik

**Skema D1 TIDAK BERUBAH & TIDAK ADA ROUTE/HALAMAN BARU.**

Inti ide (permintaan Edo): di landing `/odoj`, tambah **tombol/entry "ODOJ Saya / My ODOJ"** yang membawa user ke halaman **`/odoj/view` yang sudah ada** (yang sudah menampilkan list juz + tanggal + status + tombol "Baca Juz Ini"). Tidak perlu halaman personal baru, tidak perlu endpoint baru.

Alur button:
1. User login & sudah punya **group ODOJ** (`admin_user_id = user id`).
2. FETCH `GET /api/odoj/groups/me` → ambil `{ token, name }`.
3. Redirect ke `/odoj/view?group=<group_token>&date=<tanggal target>`.
   - `date` = hari ini (atau tanggal start). View existing menampilkan juz-juz utk tanggal tsb + status + tombol baca.

**Kondisi prasyarat**: user harus punya group + assignment (seperti skema ODOJ existing). 

**Opsi seed (agar nggak manual):** opsional tambah `GET /api/odoj/groups/me` (atau endpoint ODOJ personal kecil) yang **auto-seed** — kalau user belum punya group, otomatis buatkan group + participant diri + assignment 30 juz sesuai start date. Dengan begitu tombol di `/odoj` selalu punya group utk diedirect. (Ini menambah sedikitlogika backend, tapi TIDAK menambah route UI baru.)

> Daripada membuat tabel/API baru — kami REUSE seluruh tabel `odoj_groups/odoj_participants/odoj_assignment` + `GET /odoj/view` & halaman `odoj/view` yang sudah ada. Hanya tambah:
> - 1 tombol di `odoj.tsx`.
> - (Opsional) logic auto-seed di endpoint group `/odoj/groups/me`.

---

## Fitur / Behavior

### Entry point: Button "ODOJ Saya" di landing `/odoj` → `/odoj/view`
- **`/odoj`** (landing ODOJ existing, `app/routes/odoj.tsx`) **TETAP** landing admin-group.
- Tambahkan **button/card "ODOJ Saya / My ODOJ"** → mengarah ke **route `/odoj/view` yang sudah ada** (`app/routes/odoj-view.tsx`), lengkap dengan query param yang benar.
- **TIDAK membuat route/halaman baru.** View page existing SUDAH menampilkan **daftar juz + tanggal/date + status + tombol "Baca Juz Ini"** → itulah halaman tracking personal.

### Alur tombol "ODOJ Saya"
1. User login (Google). Ambil group-nya via `GET /api/odoj/groups/me` → `{ token }`.
2. Redirect ke `/odoj/view?group=<group_token>&date=<tanggal>`.
   - `date` default = **hari ini** (`new Date().toISOString().slice(0,10)`), atau tanggal start program.
3. View existing menampilkan juz-juz utk tanggal tsb + status + tombol baca → user baca & tandai selesai (reuse alur existing).

### Kondisi prasyarat
- User harus punya **group ODOJ** + **assignment** supaya view menampilkan data. Bila user belum punya group, tombol perlu fallback (mis. arahkan ke `/odoj/create` untuk buat group, ATAU auto-seed — lihat bawah).

### Auto-seed (opsional, agar tombol selalu berfungsi)
- Bila dianggap perlu, tambah **logika seed** di `GET /api/odoj/groups/me`: kalau user belum punya group, otomatis:
  - buat group `{name: "ODOJ Saya", admin_user_id: user}` + token,
  - buat participant `{name: user.name || "Saya"}`,
  - generate assignment 30 juz utk 30 hari berturut sejak start date (hari ini).
- Hasilnya: tombol di `/odoj` selalu bisa redirect ke `/odoj/view` tanpa form manual.
- **Rekomendasi awal:** skope awal cukup tambah tombol + redirect utk user yang SUDAH punya group. Auto-seed bisa jalan jika kamu mau pengalaman "buka langsung langsung jalan".

### Tandai selesai
- Sepenuhnya reuse alur existing: user klik "Baca Juz Ini" di `/odoj/view` → halaman `/quran/juz/<n>?odoj_token=<token>` → tombol "Selesai Dibaca" → `POST /api/odoj/read/complete {token}`.

### Navigasi & entry point
- Menu "One Day One Juz" di `app/routes/more.tsx` → tetap ke `/odoj` (landing). Dari sana ada tombol "ODOJ Saya" ke view personal.
- Guard: landing `/odoj` sudah handle login bila perlu (redirect ke `/login`).

---

## Backend changes (workers)

**SANGAT MINIMAL — hampir semua reuse API existing.**

1. **`GET /api/odoj/groups/me`** — SUDAH ADA (baris 311 `workers/api/odoj.ts`), return `{ group: { id, name, token } | null }`. Langsung dipakai tombol.
2. **`GET /odoj/view`** — SUDAH ADA (baris 323), validasi token group + date. Langsung dipakai.
3. **`POST /odoj/read/complete`** & **halaman juz** — SUDAH ADA, reuse penuh.

**(Opsional) Auto-seed pendek:** tambahkan seed group+participant+first assignment di dalam `GET /api/odoj/groups/me` bila `group` null (untuk user yang belum punya group), supaya tombol "ODOJ Saya" mudah di-onboard. Detail di Task B.

---

## UI changes (app)

- **`app/routes/odoj.tsx`** → landing existing. **TAMBAH** button/card **"ODOJ Saya / My ODOJ"**:
  - `onClick` → fetch `GET /api/odoj/groups/me` → dapat `token` → `nav('/odoj/view?group='+token+'&date='+today)`.
  - Bila `group` null → fallback `nav('/odoj/create')` (buat group dulu) ATAU tampil pesan "Buat group dulu".
- **`app/routes/odoj-create.tsx`** dst → **dibiarkan utuh** (ODOJ multi-group existing).
- **`app/routes/odoj-view.tsx`** → **dibiarkan utuh** (sudah jadi halaman tracking/personal).
- **`app/routes/more.tsx`** → keep arah `/odoj` (tidak wajib diubah).
- **`app/routes.ts`** → **TIDAK BERUBAH** (tidak ada route baru).

---

## Langkah Implementasi (panduan eksekusi untuk agent/developer)

> Commit ke branch fitur (mis. `feat/odoj-personal`).

### Task A — Tombol "ODOJ Saya" di `app/routes/odoj.tsx`
1. Import `useNavigate` (sudah ada) + tambah handler:
   ```ts
   async function goPersonal() {
     const res = await fetch('/api/odoj/groups/me');
     const data = await res.json();
     if (!data.group) { nav('/odoj/create'); return; }
     const today = new Date().toISOString().slice(0, 10);
     nav(`/odoj/view?group=${encodeURIComponent(data.group.token)}&date=${encodeURIComponent(today)}`);
   }
   ```
2. Tambah button di Hero (dekat CTA existing) &/atau CTA bawah:
   - Label: `t("odoj.myOdoj")` (tambah i18n key) atau "ODOJ Saya".
   - `icon` buku/user → `Link`/`Button onClick={goPersonal}`.
3. (Opsional) Tambah i18n key `odoj.myOdoj` & `odoj.myOdojDesc` di `app/lib/i18n.tsx` (id & en).

### Task B — (Opsional) Auto-seed di `GET /api/odoj/groups/me`
Di `workers/api/odoj.ts` (Hono), di endpoint group `/odoj/groups/me`:
- Bila `requireGroup` mengembalikan null (user belum punya group) → seed:
  - `INSERT INTO odoj_groups (id, name, admin_user_id, token)` nama "ODOJ Saya".
  - `INSERT INTO odoj_participants (id, group_id, name)` nama user/email.
  - (Opsional) `INSERT INTO odoj_assignment` utk 30 juz mulai hari ini `{date: +n hari, juz_number: n+1, participant_id}`.
- Lalu return group (seperti normal).
> Jika skope awal mau simpel, ENDPOINT TIDAK DIUBAH — cukup Task A dengan fallback ke `/odoj/create`.

### Task C — Typecheck, build, deploy
```bash
npm run cf-typegen && tsc -b      # types + typecheck
react-router build                 # build
npx --yes wrangler@4.88.0 deploy   # deploy
```

### Task D — Verifikasi manual
1. Login → `/odoj` → lihat button "ODOJ Saya".
2. Klik → redirect `/odoj/view?group=...&date=...` → tampil list juz + tanggal + status.
3. Klik "Baca Juz Ini" juz hari ini → halaman juz → "Selesai Dibaca" → `POST complete` → kembali view, status jadi hijau/done.
4. (Bila auto-seed) user baru tanpa group → klik tombol → group & assignment otomatis dibuat → view terisi.

---

## Risk & catatan

- **Landing `/odoj` TIDAK ditimpa** — ODOJ multi-group existing tetap utuh. Personal cukup lompat ke `/odoj/view` via tombol.
- **`date` default hari ini.** Jika mau tanggal per juz lain (mis. juz kena-pada-hari ke-n), itu tergantung `date` yang diseleksi; view existing menampilkan juz utk date tersebut. (Opsi lanjutan: tambah datepicker di halaman personal — diluar scope awal.)
- **User belum punya group** → fallback ke `/odoj/create` (atau auto-seed bila Task B dikerjakan).
- **Isolasi user** sudah dijamin `requireGroup` scoped `admin_user_id`.
- **Bug pre-existing** di `workers/api/odoj.ts:239` — header `authorization: *** ${tokenJson.access_token}` (kemungkinan rusak). Ini di **Google OAuth callback** → potensi login Google rusak di production. Verifikasi/fix terpisah & disarankan sebelum mengandalkan Google login.
- **TIDAK ada migration baru, TIDAK ada tabel baru, TIDAK ada route baru** pada skope tombol sederhana. (Auto-seed Task B memakai tabel existing.)

---

## Daftar file berubah (ringkas)

**Create:**
- *(tidak ada file baru pada skope tombol; opsional `workers/lib/odoj-seed.ts` bila Task B di-refactor)*

**Modify:**
- `app/routes/odoj.tsx` → tombol "ODOJ Saya" + handler redirect ke `/odoj/view?group=&date=`
- `app/lib/i18n.tsx` → (opsional) key `odoj.myOdoj` / `odoj.myOdojDesc`
- *(opsional, bila Task B)* `workers/api/odoj.ts` → seed di `GET /odoj/groups/me`

**Dibiarkan utuh:**
- `odoj-create.tsx`, `odoj-history.tsx`, `odoj-history-date.tsx`, `odoj-view.tsx`, `routes.ts`

**Dependensi:** tidak ada baru.
