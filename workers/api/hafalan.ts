// hafalan.ts — API Murojaah & Hafalan (Perorangan). Hono, scoped per-user dari session.
// Membuat aplikasi Hono tersendiri (basePath kosong) yang kemudian di-mount oleh
// odoj.ts ke odojApp (`odojApp.route("/", hafalanApp)`), sehingga path final = `/api/...`.
import { Hono } from "hono";
import { getSessionUser } from "../lib/session";

type Env = { moozhaf_db: D1Database } & {
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GOOGLE_REDIRECT_URI?: string;
};

export const hafalanApp = new Hono<{ Bindings: Env }>();

const db = (c: { env: Env }) => c.env.moozhaf_db;

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});

const randomToken = (): string => {
	const arr = new Uint8Array(24);
	crypto.getRandomValues(arr);
	return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const today = (): string => {
	// Tanggal lokal user (server). YYYY-MM-DD.
	return new Date().toISOString().slice(0, 10);
};

const validJuz = (n: number) => Number.isInteger(n) && n >= 1 && n <= 30;
const validSurah = (n: number) => Number.isInteger(n) && n >= 1 && n <= 114;

async function requireUserId(c: { env: Env; req: { raw: Request } }): Promise<string | null> {
	return getSessionUser(db(c), c.req.raw);
}

// ── HAFALAN per-juz ──────────────────────────────────────────────
// GET /api/hafalan/juz → { list: [{ juz_number, done }] }
hafalanApp.get("/hafalan/juz", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const rows = await d
		.prepare(`SELECT juz_number, done FROM hafalan_juz WHERE user_id = ? ORDER BY juz_number`)
		.bind(userId)
		.all<{ juz_number: number; done: number }>();
	return json({ list: rows.results });
});

// PUT /api/hafalan/juz/:n  { done: boolean } → upsert
hafalanApp.put("/hafalan/juz/:n", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const n = Number(c.req.param("n"));
	if (!validJuz(n)) return json({ error: "invalid juz" }, 400);
	const { done } = await c.req.json<{ done?: boolean }>();
	const now = new Date().toISOString();
	await d
		.prepare(
			`INSERT INTO hafalan_juz (user_id, juz_number, done, updated_at)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(user_id, juz_number)
			 DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at`,
		)
		.bind(userId, n, done ? 1 : 0, now)
		.run();
	return json({ ok: true, juz_number: n, done: !!done });
});

// ── HAFALAN per-surah ────────────────────────────────────────────
// GET /api/hafalan/surah → { list: [{ surah_number, done }] }
hafalanApp.get("/hafalan/surah", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const rows = await d
		.prepare(`SELECT surah_number, done FROM hafalan_surah WHERE user_id = ? ORDER BY surah_number`)
		.bind(userId)
		.all<{ surah_number: number; done: number }>();
	return json({ list: rows.results });
});

// PUT /api/hafalan/surah/:n  { done: boolean } → upsert
hafalanApp.put("/hafalan/surah/:n", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const n = Number(c.req.param("n"));
	if (!validSurah(n)) return json({ error: "invalid surah" }, 400);
	const { done } = await c.req.json<{ done?: boolean }>();
	const now = new Date().toISOString();
	await d
		.prepare(
			`INSERT INTO hafalan_surah (user_id, surah_number, done, updated_at)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(user_id, surah_number)
			 DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at`,
		)
		.bind(userId, n, done ? 1 : 0, now)
		.run();
	return json({ ok: true, surah_number: n, done: !!done });
});

// ── MURAJAJAH (riwayat & stats) ──────────────────────────────────
// GET /api/murojaah → { list, total_days, today_done }
hafalanApp.get("/murojaah", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const todayStr = today();

	const [rowsR, totalRows, todayRows] = await Promise.all([
		d
			.prepare(
				`SELECT id, date, mode, ref_number, note FROM murojaah_log
				 WHERE user_id = ? ORDER BY date DESC, ref_number ASC LIMIT 200`,
			)
			.bind(userId)
			.all<{ id: string; date: string; mode: string; ref_number: number; note: string | null }>(),
		d
			.prepare(`SELECT COUNT(DISTINCT date) AS c FROM murojaah_log WHERE user_id = ?`)
			.bind(userId)
			.first<{ c: number }>(),
		d
			.prepare(`SELECT COUNT(*) AS c FROM murojaah_log WHERE user_id = ? AND date = ?`)
			.bind(userId, todayStr)
			.first<{ c: number }>(),
	]);

	return json({
		list: rowsR.results,
		total_days: totalRows?.c ?? 0,
		today_done: todayRows?.c ?? 0,
		today: todayStr,
	});
});

// PUT /api/murojaah { mode, ref_number } → toggle centang hari ini.
// Insert jika belum ada; hapus (uncheck) jika sudah ada di tanggal hari ini.
hafalanApp.put("/murojaah", async (c) => {
	const d = db(c);
	const userId = await requireUserId(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const { mode, ref_number } = await c.req.json<{ mode?: string; ref_number?: number }>();
	const m = mode === "juz" ? "juz" : "surah";
	const ref = Number(ref_number);
	if (m === "juz" ? !validJuz(ref) : !validSurah(ref)) {
		return json({ error: "invalid ref" }, 400);
	}
	const todayStr = today();

	// Cek apakah sudah ada centang hari ini untuk target tsb.
	const existing = await d
		.prepare(`SELECT id FROM murojaah_log WHERE user_id = ? AND date = ? AND mode = ? AND ref_number = ?`)
		.bind(userId, todayStr, m, ref)
		.first<{ id: string }>();

	if (existing) {
		// Uncheck: hapus log hari ini.
		await d.prepare(`DELETE FROM murojaah_log WHERE id = ?`).bind(existing.id).run();
		return json({ ok: true, checked: false, mode: m, ref_number: ref });
	}

	// Check: tambah log baru hari ini.
	const id = randomToken();
	await d
		.prepare(`INSERT INTO murojaah_log (id, user_id, date, mode, ref_number) VALUES (?, ?, ?, ?, ?)`)
		.bind(id, userId, todayStr, m, ref)
		.run();
	return json({ ok: true, checked: true, mode: m, ref_number: ref, date: todayStr });
});
