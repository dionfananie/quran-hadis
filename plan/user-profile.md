# PLAN — Moozhaf: User Profile Page

> Plan fitur **halaman User Profile** di Moozhaf (`quran-hadis`). Di-eksekusi **manual** oleh Edo. Document dikelola di repo biar sinkron dengan codebase.

> ✅ **STATUS: DONE** (ditandai 2026-08-14). Semua fitur sudah diimplementasikan.

**Goal:** Menambah **menu user (avatar) di kanan atas header**, yang mengarah ke **halaman `/user-profile`** untuk melihat & mengubah **foto** & **nama** user yang login.

**Status:** ✅ DONE (fitur sudah jalan; plan ini dulunya bertuliskan "belum eksekusi" namun sudah usang).

---

## Fitur (detail)

### 1. User Menu icon di kanan atas header
- Di header (desktop `top-nav.tsx` & mobile `mobile-top-bar.tsx`), di **sebelah kanan** (dekat toggle theme/language), tambahkan **avatar user**:
  - Jika user login & punya `avatar_url` (dari Google) → tampilkan **image** tersebut.
  - Jika tidak ada avatar (atau belum login) → **placeholder** (ikon user / inisial).
- **Klik avatar** → navigasi ke **`/user-profile`**.

### 2. Halaman `/user-profile`
- Route baru di `app/routes.ts`: `route("user-profile", "routes/user-profile.tsx")`.
- Sidebar/guard: butuh login. Jika belum login → arahkan ke `/login`.
- Menampilkan info user:
  - **Foto** (avatar saat ini).
  - **Email** (read-only, dari akun).
  - **Nama** (dapat diedit).
- **Edit**:
  - **Ganti nama** → input + simpan.
  - **Ganti gambar** → upload file → simpan.

---

## Backend (API)

### Endpoint
- `GET /api/auth/me` — **SUDAH ADA** (di `workers/api/odoj.ts`). Returns `{ user: { id, email } }`. **Perlu diperluas** utk menyertakan `name` & `avatar_url`.
- `PATCH/PUT /api/auth/me` (BARU) — update `name` &/atau `avatar_url` user yang login.
  - Body: `{ name?, avatar_url? }` → `UPDATE users SET name=?, avatar_url=? WHERE id=?`.

### Upload gambar avatar
- Opsi A (**simple, tanpa storage eksternal**): simpan **data URL / base64** langsung ke kolom `avatar_url` di D1. Cocok utk avatar kecil. Batasi ukuran (mis. <1MB).
- Opsi B (**R2 / object storage**): setup Cloudflare R2 bucket + signed upload. Lewat scope — hanya kalau mau rapi & scalable.

**Rekomendasi awal:** **Opsi A** (data URL/base64 di kolom `avatar_url`) — paling gampang & cukup utk fitur awal. Data-nya kecil. (Detail: client resize/compress dulu biar <100KB.)

---

## Migration DB
- Tabelln `users` sudah punya kolom `name` & `avatar_url` (dari `0002_google_auth.sql`). **Tidak perlu migration baru** untuk simpan nama/avatar.
- Kalau pakai Opsi A (data URL) → cukup kolom `avatar_url` (sudah ada, TEXT).

---

## UI Files
- **Modify**: `app/components/top-nav.tsx` (tambah avatar icon kanan), `app/components/mobile-top-bar.tsx` (sama, versi mobile).
- **Create**: `app/routes/user-profile.tsx` (halaman profile: tampil + edit nama & foto).
- **Modify**: `app/routes.ts` (daftar route `user-profile`).

---

## Alur teknis (client)
1. Header cek `/api/auth/me` → dapat `{ id, email, name, avatar_url }`.
2. Kalau punya session: tampilkan avatar; klik → `/user-profile`.
3. Halaman profile: tampil data user; form ubah nama (+ upload/simpan gambar).
4. Simpan → `PATCH /api/auth/me` → refresh tampilan.

---

## Langkah Eksekusi (urutan)
1. **Backend**: perluas `GET /auth/me` (tambah name, avatar) + tambah `PATCH /auth/me`.
2. **Route**: daftar `user-profile`.
3. **Header**: tambah avatar menu (desktop + mobile) → link ke `/user-profile`.
4. **Halaman**: `user-profile.tsx` (lihat + edit nama & foto).
5. **Upload**: implement Opsi A (base64/data URL).
6. **Typecheck & build** (bun).
7. **Commit & push** (auto-deploy).
8. **Verifikasi manual**: login Google → avatar muncul → klik → `/user-profile` → ganti nama & foto → simpan → refresh.

---

## Daftar file berubah
- **Create**: `app/routes/user-profile.tsx`, `PLAN` md ini.
- **Modify**: `workers/api/odoj.ts` (perluas me, tambah PATCH me), `app/routes.ts`, `app/components/top-nav.tsx`, `app/components/mobile-top-bar.tsx`, `worker-configuration.d.ts` (auto).

## Risiko / catatan
- **Data URL avatar** bisa bikin ukuran respons `users` membesar — batasi & compress client-side.
- Pastikan update `name`/`avatar_url` hanya utk user yang login (scoped by session).
- Jangan simpan secret di md / repo (aturan keamanan).
