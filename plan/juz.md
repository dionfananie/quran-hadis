# PLAN — Moozhaf: Halaman Juz (Juz Reader)

> Plan & dokumentasi fitur **halaman baca per-juz** di Moozhaf (`quran-hadis`). Menggantikan konsep lama di mana ODOJ mengarahkan "Baca Juz Ini" ke `/quran/<n>` (yang sebenarnya halaman surat — salah).
> Di-eksekusi manual. Document di `plan/juz.md`.

> ✅ **STATUS: DONE** (ditandai 2026-08-14). Fitur utama halaman juz sudah diimplementasikan & sesuai halaman surah. Tiga fitur minor dari rencana masih opsional/belum (font-size, bismillah, prev/next) — lihat catatan bawah.

**Goal:** Halaman `/quran/juz/:number` untuk membaca isi **satu juz** (30 juz), dengan **desain & fitur PERSIS sama seperti halaman surah** (`/quran/:number`). Bedanya hanya konten: 1 juz berisi **beberapa surat** (bukan 1 surat).

**Route:** `quran/juz/:number` → `app/routes/quran/juz.tsx`.

---

## ✅ Sudah Dikerjakan (dokumentasi)

### 1. Data mapping juz — `app/data/juz.json`
- Berisi 30 juz. Tiap juz: start & end `{surah, ayah}`.
- **Sumber data & cara generate:** diambil dari **metadata nyata** di `public/data/quran/<surah>.json` → tiap ayat punya `meta.juz`. Skrip iterasi 114 surat, catat ayat pertama & terakhir tiap juz. **TIDAK manual/tebakan** — akurat dari dataset lokal.
- Catatan: **equran.id & myQuran API tidak menyediakan data juz** (sudah dicek) → pakai dataset lokal Moozhaf.

### 2. Route awal (masih `/juz/:number`)
- `app/routes.ts` sudah tambah `route("juz/:number", "routes/quran/juz.tsx")`.
- ⚠️ **REVISI dibutuhkan** → pindah ke `route("quran/juz/:number", ...)` (lihat Improvement di bawah).

### 3. Halaman `app/routes/quran/juz.tsx` (versi dasar)
- Breadcrumb sederhana + judul "Juz N" + tombol "Selesai Dibaca" bila `odoj_token`.
- Menampilkan seluruh ayat juz: load surat-surat dlm rentang (`meta.start.surah`…`end.surah`), filter `meta.juz === n`.
- Ayat menampilkan arab, sumber `[Surah : ayat]`, terjemahan.
- Sudah ke-push di commit `5106dcc`.

### 4. Integrasi ODOJ
- `app/routes/odoj-view.tsx`: link "Baca Juz Ini" → `/juz/<n>` (sebelumnya salah ke `/quran/<n>`).
- ⚠️ Perlu di-update ke `/quran/juz/<n>` bila route berubah.

---

## 🔍 Tajwid di Halaman Juz (PLAN)
> Menambahkan **tampilan & highlight tajwid** di halaman juz, meniru halaman surah. Ini **mungkin dilakukan** — data tajwid sudah tersedia.

**Data (sudah diverifikasi):** `public/data/tajwid/<surah>.json` = **array** panjang = jumlah ayat surat. Index = `inSurah - 1` (sejajar `surah.ayahs`). Format elemen = string tajwid bertag (mis. `'ا[m[لٓ][m[مٓ]'`). Dikonsumsi via helper `getSurahTajwid(number)` → `string[]` (di `app/lib/data/quran.ts`).

**Kendala khusus juz:** 1 juz berisi **beberapa surat**. Tajwid disimpan per-surat → di halaman juz harus gabungkan bundle dari semua surat dlm rentang, lalu cocokkan per ayat via `(surah, inSurah)`.

**Yang PERLU diperbaiki di helper/data:**
- Sekarang `getSurahTajwid(number)` fetch satu surat. Untuk juz, perlu **mengumpulkan tajwid beberapa surat** (`meta.start.surah` … `meta.end.surah`) — mis. loop `getSurahTajwid(s)` & simpan per-surat.

**Langkah eksekusi:**
1. `app/routes/quran/juz.tsx`: tambah state & lazy-load tajwid utk **semua surat dlm rentang juz** saat toggle tajwid ON.
2. Simpan sebagai `Record<surah, string[]>` (bukan array flat) supaya bisa lookup per `(surah, inSurah)`.
3. Tambah toggle **"Tajwid"** (`showTajwid`) + **"Legend Tajwid"** (`showLegend`) di toolbar — persis surah.
4. Render: pada card ayat, kalau `showTajwid`, tampilkan `parseTajweed(tajwidBySurah[a.surah][a.inSurah-1])` (fallback ke arab polos bila tak ada).
5. `parseTajweed` & `TAJWEED_RULES` sudah ada di `app/lib/tajweed.ts` — tinggal di-import.
6. Button toolbar: salin komponen dari `surah.tsx` (toggle tajwid + legend, LEGEND_GROUPS, TAJWEED_RULES).

**Catatan:** Semua util (getSurahTajwid, parseTajweed, TAJWEED_RULES, LEGEND_GROUPS) sdh dipakai surah.tsx. Di juz tinggal rakit bundle multi-surat & lookup per ayat.

**Verifikasi (done, 0 miss):** Semua 30 juz dicek — file tajwid lengkap utk semua surat dlm rentang, & panjang array tajwid **persis = jumlah ayat** surat. Jadi lookup `tajwid[surah][inSurah-1]` **tidak akan miss/salah ayat**. Bahkan utk juz yg mulai/berakhir di tengah surat tetap aman (lookup via `inSurah`, bukan index flat).

**Keputusan implementasi: MAPPING BY LOGIC (Opsi A), TIDAK buat file json baru.**
- Di `juz.tsx`, saat toggle tajwid ON → loop `getSurahTajwid(s)` utk tiap surat dlm rentang juz, simpan `Record<surah, string[]>`.
- **Alasan:**
  - Sumber data tunggal (helper yg sama dgn surah.tsx), tidak duplikasi / tidak perlu regenerate.
  - `app/data/juz.json` tetap utk batas juz saja, bukan isi tajwid.
  - Beban fetch kecil (1-3 surat, terkecuali juz 30 = 37 surat) & lazy-load saat toggle ON.
- **Penyesuaian:** helper `getSurahTajwid` saat ini utk satu surat → tak perlu diubah; cukup panggil berulang di juz.

## ✅ Lanjutan — SUDAH DONE
Sudah dikerjakan:
- **Route → `/quran/juz/:number`** — route dipindah, `odoj-view.tsx` link sudah `/quran/juz/<n>`.
- **Fitur utama persis halaman surah** sudah ada di `juz.tsx`: breadcrumb, toolbar display (Arab saja / Arab+Terjemahan = `showTranslation`), **Tajwid toggle + Legend** (`showTajwid`, `showLegend`), audio per ayat, tombol **"Selesai Dibaca"** + `odoj_token`.
> ⏳ **Masih opsional/belum** (dari rencana, tidak memblokir): setting **font-size**, **Bismillah** di awal surat dalam juz, **Prev/Next** antar juz.


---

## Daftar file
- `app/data/juz.json` ✅
- `app/routes/quran/juz.tsx` ✅ (fitur utama seperti surah; font-size/bismillah/prev-next opsional belum)
- `app/routes.ts` ✅ (route `quran/juz/:number`)
- `app/routes/odoj-view.tsx` ✅ (link `/quran/juz/<n>`)
- `app/lib/i18n.tsx` (label juz, jika perlu)

## Risiko / catatan
- Audio seluruh juz: tiap surat punya audio; 1 juz = beberapa surat → perlakukan sebagai daftar audio berurutan (atau audio per-ayat bila data ada).
- Saias & font-size: sesuaikan agar berlaku utk semua ayat dlm juz.
- Performa: load beberapa surat (1-3) → acceptable.
