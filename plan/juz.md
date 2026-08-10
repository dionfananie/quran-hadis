# PLAN — Moozhaf: Halaman Juz (Juz Reader)

> Plan & dokumentasi fitur **halaman baca per-juz** di Moozhaf (`quran-hadis`). Menggantikan konsep lama di mana ODOJ mengarahkan "Baca Juz Ini" ke `/quran/<n>` (yang sebenarnya halaman surat — salah).
> Di-eksekusi manual. Document di `plan/juz.md`.

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

## 🔄 Improvement (Plan / belum dikerjakan)

### A. Route → `/quran/juz/:number`
- Ubah `app/routes.ts`: `route("juz/:number", ...)` → `route("quran/juz/:number", ...)`.
- Update `odoj-view.tsx` link → `/quran/juz/<n>`.
- (file yg sama `app/routes/quran/juz.tsx`)

### B. Design & fitur = persis halaman surah (`/quran/:number`)
Samakan `app/routes/quran/juz.tsx` dengan fitur `app/routes/quran/surah.tsx`:
- **Breadcrumb** (Moozhaf → Quran → Juz N)
- **Header juz**: badge romawi/"Juz N", nama, keterangan rentang surat & jumlah ayat, tombol **play audio seluruh juz** (audio per surat? atau urut), tombol **"Selesai Dibaca"** (OD]). 
- **Bismillah** (bila relevan / di awal tiap surat dalam juz).
- **Description** (deskripsi juz bila ada).
- **Display toolbar**: toggle **Arab sajā / Arab + Terjemahan** (`showTranslation`), **Tajwid toggle**, **font-size** settings — persis surah.
- **Rendering ayat**: layout sama (arab, terjemahan, nomor/sumber), pakai komponen & styling yang sama.
- **Audio per ayat** (bila surah punya playTag per ayah).
- **Prev/Next** (juz sebelumnya / berikutnya).

> Implementasi: salin struktur & state dari `surah.tsx`, tapi data sumber = kumpulan ayat dari beberapa surat (flatten dari `getSurah` per surat dlm rentang juz). Header/toolbar/perpindahan disesuaikan ke konteks juz.

---

## Daftar file
- `app/data/juz.json` ✅
- `app/routes/quran/juz.tsx` 🟡 (versi dasar sdh; perlu redesign = surah)
- `app/routes.ts` 🟡 (ubah route → `quran/juz/:number`)
- `app/routes/odoj-view.tsx` 🟡 (link → `/quran/juz/<n>`)
- `app/lib/i18n.tsx` (label juz, jika perlu)

## Risiko / catatan
- Audio seluruh juz: tiap surat punya audio; 1 juz = beberapa surat → perlakukan sebagai daftar audio berurutan (atau audio per-ayat bila data ada).
- Saias & font-size: sesuaikan agar berlaku utk semua ayat dlm juz.
- Performa: load beberapa surat (1-3) → acceptable.
