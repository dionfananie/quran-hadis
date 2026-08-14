/* Moozhaf PWA — Service Worker (manual, zero-dep).
 * Strategy:
 *  - Prerender/precache app shell pada 'install' (navigasi + icon + manifest).
 *  - Cache-FIRST untuk assets statis & data konten (quran/tajwid/hadith JSON).
 *  - Network-FIRST untuk navigasi & API dinamis (update dari jaringan, fallback cache).
 *  - Skip waiting + clients claim agar update langsung aktif (tanpa paksa reload).
 */
const VERSION = "moozhaf-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const API_CACHE = `${VERSION}-api`;
const NAV_CACHE = `${VERSION}-nav`;

const SHELL_URLS = [
	"/",
	"/manifest.webmanifest",
	"/icon.png",
	"/icon-192.png",
	"/icon-512.png",
	"/favicon.ico",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(SHELL_CACHE)
			.then((cache) => cache.addAll(SHELL_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => !k.startsWith(VERSION))
						.map((k) => caches.delete(k)),
				),
			),
	);
	self.clients.claim();
});

function isStaticAsset(url) {
	return (
		url.pathname.startsWith("/assets/") ||
		/\.(css|js|woff2?|png|svg|ico|webp|webmanifest)$/.test(url.pathname)
	);
}

function isContentData(url) {
	return (
		url.pathname.startsWith("/data/quran/") ||
		url.pathname.startsWith("/data/tajwid/") ||
		url.pathname.startsWith("/data/hadith/") ||
		url.pathname.startsWith("/data/surah-") ||
		url.pathname.endsWith("/surah-index.json")
	);
}

function isApi(url) {
	return url.pathname.startsWith("/api/");
}

async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response && response.ok) cache.put(request, response.clone());
	return response;
}

async function networkFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	try {
		const response = await fetch(request);
		if (response && response.ok) cache.put(request, response.clone());
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		return Response.error();
	}
}

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;
	const url = new URL(request.url);

	// Hanya handle request ke origin sendiri (hindari font/CDN eksternal di cache).
	if (url.origin !== self.location.origin) return;

	// Data konten (Quran/hadits): cache-first — ini inti offline reading.
	if (isContentData(url)) {
		event.respondWith(cacheFirst(request, STATIC_CACHE));
		return;
	}

	// Assets statis build: cache-first.
	if (isStaticAsset(url)) {
		event.respondWith(cacheFirst(request, STATIC_CACHE));
		return;
	}

	// API dinamis: network-first, fallback cache (biar offline tetap bisa).
	if (isApi(url)) {
		event.respondWith(networkFirst(request, API_CACHE));
		return;
	}

	// Navigasi (mode: navigate): network-first, fallback ke shell "/".
	if (request.mode === "navigate") {
		event.respondWith(
			networkFirst(request, NAV_CACHE).then((resp) => {
				if (resp && resp.ok) return resp;
				return caches.match("/");
			}),
		);
		return;
	}
});
