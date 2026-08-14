# PLAN — Moozhaf: Progressive Web App (PWA)

> Plan fitur **mengubah Moozhaf menjadi PWA**: installable, offline-capable, push notifikasi (opsional), ikon & manifest.

> **Status:** ✅ **DONE** (ditandai 2026-08-14). PWA sudah diimplementasikan: manifest, service worker, icon, CTA install. Di-eksekusi via `plan/pwa.md` oleh agent.

**Goal:** User bisa **install Moozhaf ke home screen** (Android/iOS/desktop), membuka cepat, dan tetap bisa membaca konten **offline** (Qur'an, hadits) setelah ter-cache. Dukungan dasar ekosistem PWA: `manifest.webmanifest` + service worker + ikon.

**Architecture:** React Router 7 + Vite (Cloudflare Worker) — sudah ada. PWA ditambahkan dengan `vite-plugin-pwa` (pakai Workbox, gesit & standar) ATAU manual zero-dep (manifest + SW sendiri). Lihat keputusan teknis.

**Tech Stack:** Vite plugin (`vite-plugin-pwa` / Workbox) jika setuju tambah dep; React Router 7; tailwind. Sudah ada `public/icon.png`, `favicon.ico`.

---

## Keputusan teknis (perlu dipilih Edo)

**A) Zero-dependency (manual)** — tidak tambah library. Cocok dengan gaya "avoid deps".
- Buat `public/manifest.webmanifest` manual.
- Buat `public/sw.js` manual (basic: CACHE-first utk assets, network-first utk konten online).
- Ikon: pakai `public/icon.png` (perlu cek ukuran ≥512px utk kriteria install).
- **Plus:** tanpa node_modules tambahan, ringan, full kontrol, tidak bentrok dengan build stack Cloudflare.
- **Minus:** precache manual lebih ribet (daftar asset harus di-update tiap build), tanpa generator otomatis; SW lama di-endpoint `/sw.js` (statis) tapi route-nya didaftarkan dari app.

**B) `vite-plugin-pwa`** (Workbox) — standar industri.
- Tambah `vite-plugin-pwa` (devDependency); otomatis generate manifest, precache semua asset build, inject register.
- **Plus:** precache otomatis beres; fitur lengkap (offline, update prompt, dev mode).
- **Minus:** tambah dep; harus pastikan kompatibel dgn Vite Cloudflare plugin (ada risiko konflik build) — perlu spike.

**Rekomendasi awal:** **Opsi A (manual zero-dep)** untuk skope awal — sesuai preferensi "avoid deps", dan Moozhaf kontennya statis-data (Qur'an JSON di `public/data/`), jadi caching manual cukup efektif. Bila mau "set & forget" & siap update prompt → upgrade ke Opsi B.

*(Keputusan ini perlu dipastikan ke Edo sebelum implement.)*

---

## Task 1: Manifest (`public/manifest.webmanifest`)

```json
{
  "name": "Moozhaf",
  "short_name": "Moozhaf",
  "description": "Baca Al-Qur'an & hadits, One Day One Juz, dan jadwal sholat.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
- Import `purpose` maskable perlu ikon png transparan. `icon.png` sekarang **1024×1024 RGB** (sudah diverifikasi) — **cukup utk semua size** (192/512/maskable); tidak perlu buat ulang. `favicon.ico` 48×48 (untuk favicon browser, bukan PWA).
- `theme_color`/`background_color` sama dgn warna tema app (`#0f172a` = slate-900 dgn tema moozhaf; VERIFIKASI di `app.css`/`theme.ts`).

## Task 2: Register `manifest` di `app/root.tsx`

- Tambah link manifest di `links` function:
```ts
{ rel: "manifest", href: "/manifest.webmanifest" }
{ rel: "icon", type: "image/png", href: "/icon.png" }
```
- Tambah `<meta name="theme-color" content="#0f172a" />` di `<head>`.
- (Opsional) `<meta name="apple-mobile-web-app-capable" content="yes">` + apple-touch-icon utk iOS.

## Task 3: Service Worker manual (`public/sw.js`)

Strategi cache:
- **Precache core**: `/`, `/manifest.webmanifest`, `/icon.png`, `/favicon.ico`, CSS, dan JS utama — dari import? Manual: daftar statis strings. Bila build hash berubah (Vite), daftar ini perlu update → **rekomendasi generate saat build** (lihat Task 4) supaya tak manual.
- **Cache-first utk static assets** dari origin (`self.addEventListener('fetch')` → CACHE-first utk GET navigasi & assets, network-first utk konten dinamis).
- **Konten data** (`/data/quran/*.json`, `/data/tajwid/*.json`, `/data/hadith/*`) → **cache-first** (data statis, cocok offline).
- **API dinamis** (`/api/*`) → **network-first, fallback cache**.

## Task 4: Mengenerate daftar precache saat build (agar tak manual & tak ketinggalan hash)

- Di `vite.config.ts`, tambah plugin kecil (inline) yang **setelah build** menulis daftar asset hash → `public/sw.js` atau `public/precache-manifest.json`.
- SW membaca `public/precache-manifest.json` untuk `precacheAndRoute` (manual) — pola Workbox-lite tanpa dep.
- Alternatif lebih simpel untuk v1: precache hanya rute navigasi & service worker sendiri, cache asset on-the-fly saat dimuat (runtime caching), TANPA daftar precache statis. **Ini cukup & paling zero-dep** — SW tidak perlu tahu semua hash, cukup intercept fetch dan cache on-demand. **Rekomendasi v1: runtime caching saja**, daftar precache bisa ditambahkan bertahap.

## Task 5: Register service worker di `app/entry.client.tsx` (atau komponen)

- Di `entry.client.tsx` (atau root), daftarkan:
```ts
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
```
- Jangan blokir render — register setelah load.

## Task 6: (Opsional) Push Notifications
> Lewat scope v1. Push butuh VAPID + subscription server (D1) + UI izin. Catat sebagai iterasi lanjutan.

## Task 7: Verifikasi PWA

Manual:
1. Build (`bun run build`) → `wrangler deploy`.
2. Buka site; DevTools → Application → Manifest ter-load, ikon OK, SW `activated`.
3. **Install**: Chrome/Android → "Install Moozhaf" muncul; buka app standalone.
4. **Offline**: DevTools → Network → Offline → reload → app tetap tampil (halaman cache), buka surah/hadits offline.
5. Lighthouse → PWA (cukup attainable: installable + offline).

---

## Daftar file berubah

**Create:**
- `public/manifest.webmanifest`
- `public/sw.js` (service worker manual)
- `plan/pwa.md`

**Modify:**
- `app/root.tsx` (link manifest + meta theme-color + apple touch)
- `app/entry.client.tsx` (register SW)
- `vite.config.ts` — *(opsional)* inline plugin utk runtime precache / inject daftar hash
- *(opsional)* `app/assets/` atau `public/` buat icon ulang bila `icon.png` <512px

**Jangan diubah:** `react-router.config.ts`, `workers/*` (tidak perlu), `wrangler.json` (tanpa perubahan binding PWA).

---

## Risiko / catatan

- **Ukuran `icon.png`**: kriteria install butuh setidaknya satu icon ≥144px (Android) & maskable `512x512` ideal. **Cek ukuran sekarang**; besar kemungkinan perlu `icon-512.png` baru.
- **`vite-plugin-pwa` vs Cloudflare Vite plugin**: ada risiko konflik (keduanya transformasi Vite). Biar aman, **spike dulu** kalau pilih Opsi B sebelum commit.
- **Service worker & caching data**: konten Qur'an = JSON besar per surah. Cache-first semua berpotensi menyimpan banyak data. Batasi cache (mis. versi-lu juz yang sedang aktif / ODOJ) atau pakai cache-busting volume.
- **Update SW**: versi cache (mis. `CACHE_VERSION`) harus di-bump tiap deploy asset berubah → pastikan strategi `skipWaiting`/`clientsClaim` yang bijak (tidak memaksa reload pengguna).
- **iOS**: PWA di iOS pakai halaman standalone tapi tak ada push; tetap perlu apple-mobile-web-app meta + apple-touch-icon.

---

## Scope lanjutan (bukan v1)

- Push notifications (VAPID + subscription D1).
- Update-refresh prompt ("Aplikasi diperbarui — Muat ulang?").
- Precache global penuh Qur'an/hadits (besar — perlu strategi, mis. install-time background).
- Badge notifikasi ODOJ harian.
