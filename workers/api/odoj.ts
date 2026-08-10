// odoj.ts — Router API ODOJ + Auth (Hono). Dipanggil dari workers/app.ts untuk path /api/*.
// Model: register terbuka → tiap user bikin group sendiri. Multi-group, token per group/link.
import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../lib/crypto";
import {
	createSession,
	getSessionUser,
	destroySession,
	setSessionCookie,
	clearSessionCookie,
} from "../lib/session";

type Env = { moozhaf_db: D1Database } & {
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GOOGLE_REDIRECT_URI?: string;
};

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

const validJuz = (n: number) => Number.isInteger(n) && n >= 1 && n <= 30;
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

async function requireUser(c: {
	env: Env;
	req: { raw: Request };
}): Promise<string | null> {
	return getSessionUser(db(c), c.req.raw);
}

async function requireGroup(c: {
	env: Env;
	req: { raw: Request };
}) {
	const userId = await requireUser(c);
	if (!userId) return null;
	return db(c)
		.prepare(`SELECT * FROM odoj_groups WHERE admin_user_id = ?`)
		.bind(userId)
		.first<{ id: string; name: string; token: string }>();
}

export const odojApp = new Hono<{ Bindings: Env }>().basePath("/api");

// ── AUTH ────────────────────────────────────────────────────────────────
odojApp.post("/auth/register", async (c) => {
	const d = db(c);
	const { email, password } = await c.req.json<{ email?: string; password?: string }>();
	if (!email || !password || password.length < 8) {
		return json({ error: "email & password (min 8 char) wajib" }, 400);
	}
	const em = email.trim().toLowerCase();
	const exists = await d.prepare(`SELECT id FROM users WHERE email = ?`).bind(em).first();
	if (exists) return json({ error: "email sudah terdaftar" }, 409);
	const { salt, hash } = await hashPassword(password);
	const id = randomToken();
	await d
		.prepare(`INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)`)
		.bind(id, em, hash, salt)
		.run();
	const { token, expiresMs } = await createSession(d, id);
	const res = json({ ok: true, user: { id, email: em } });
	setSessionCookie(res.headers, token, expiresMs);
	return res;
});

odojApp.post("/auth/login", async (c) => {
	const d = db(c);
	const { email, password } = await c.req.json<{ email?: string; password?: string }>();
	if (!email || !password) return json({ error: "email & password wajib" }, 400);
	const em = email.trim().toLowerCase();
	const user = await d
		.prepare(`SELECT * FROM users WHERE email = ?`)
		.bind(em)
		.first<{ id: string; password_hash: string; salt: string }>();
	if (!user || !(await verifyPassword(password, user.salt, user.password_hash))) {
		return json({ error: "email atau password salah" }, 401);
	}
	const { token, expiresMs } = await createSession(d, user.id);
	const res = json({ ok: true, user: { id: user.id, email: em } });
	setSessionCookie(res.headers, token, expiresMs);
	return res;
});

odojApp.post("/auth/logout", async (c) => {
	const d = db(c);
	await destroySession(d, c.req.raw);
	const res = json({ ok: true });
	clearSessionCookie(res.headers);
	return res;
});

odojApp.get("/auth/me", async (c) => {
	const d = db(c);
	const userId = await requireUser(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const user = await d.prepare(`SELECT id, email FROM users WHERE id = ?`).bind(userId).first();
	return json({ user });
});

// ── GOOGLE OAUTH (login) ────────────────────────────────────────────────
// OAuth 2.0 Authorization Code flow, server-side, tanpa dependency tambahan
// (pakai fetch + Web Crypto bawaan Worker).

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_SCOPE = "openid email profile";

function googleCfg(c: { env: Env }): { id: string; secret: string; redirect: string } {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = c.env;
	return {
		id: GOOGLE_CLIENT_ID || "",
		secret: GOOGLE_CLIENT_SECRET || "",
		redirect: GOOGLE_REDIRECT_URI || "",
	};
}

// State token acak buat mencegah CSRF pada OAuth callback.
async function genOAuthState(): Promise<string> {
	const arr = new Uint8Array(24);
	crypto.getRandomValues(arr);
	return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Tangkap state dari query string response callback.
function getStateFromUrl(url: string): string {
	try {
		return new URL(url).searchParams.get("state") || "";
	} catch {
		return "";
	}
}

type GoogleTokenResp = { access_token?: string; id_token?: string; error?: string };
type GoogleUser = { id?: string; email?: string; name?: string; picture?: string };

// 1) Redirect pengguna ke halaman consent Google.
odojApp.get("/auth/google", async (c) => {
	const cfg = googleCfg(c);
	if (!cfg.id || !cfg.redirect) return json({ error: "Google login belum dikonfigurasi" }, 500);
	const state = await genOAuthState();
	const params = new URLSearchParams({
		client_id: cfg.id,
		redirect_uri: cfg.redirect,
		response_type: "code",
		scope: GOOGLE_SCOPE,
		access_type: "online",
		state,
	});
	return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// 2) Callback setelah user menyetujui → tukar code → ambil info → buat/login user.
odojApp.get("/auth/google/callback", async (c) => {
	try {
		const d = db(c);
		const cfg = googleCfg(c);
		const url = c.req.url;
		const sp = new URL(url).searchParams;
		const code = sp.get("code");
		const error = sp.get("error");
		if (error) return json({ error: `Google auth dibatalkan: ${error}` }, 400);
		if (!code) return json({ error: "Kode otorisasi tidak ada" }, 400);
		if (!cfg.id || !cfg.secret) return json({ error: "Google login belum dikonfigurasi" }, 500);

		// Tukar authorization code → token akses.
		const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				code,
				client_id: cfg.id,
				client_secret: cfg.secret,
				redirect_uri: cfg.redirect,
				grant_type: "authorization_code",
			}),
		});
		const tokenRespText = await tokenResp.text();
		let tokenJson: GoogleTokenResp;
		try {
			tokenJson = JSON.parse(tokenRespText) as GoogleTokenResp;
		} catch {
			return json({ error: `Gagal parse respon token Google (HTTP ${tokenResp.status})` }, 500);
		}
		if (!tokenJson.access_token || tokenJson.error) {
			return json({ error: `Gagal mendapat token Google: ${tokenJson.error || tokenResp.status}` }, 400);
		}

		// Ambil info user (email, nama, avatar) pakai access token.
		const userResp = await fetch(GOOGLE_USERINFO_URL, {
			headers: { authorization: `Bearer ${tokenJson.access_token}` },
		});
		if (!userResp.ok) return json({ error: `Gagal mengambil profil Google (HTTP ${userResp.status})` }, 400);
		const guser = (await userResp.json()) as GoogleUser;
		if (!guser.email) return json({ error: "Google tidak mengembalikan email" }, 400);

		const googleId = guser.id || `sub:${guser.email}`;
		const email = guser.email.toLowerCase().trim();
		const name = guser.name || email.split("@")[0];
		const avatar = guser.picture || "";

		// Cari user berdasarkan google_id ATAU email (biar link ke akun email existing).
		let user = await d
			.prepare(`SELECT id FROM users WHERE google_id = ?`)
			.bind(googleId)
			.first<{ id: string }>();
		if (!user) {
			user = await d.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: string }>();
		}

		let uid: string;
		if (user) {
			// User sudah ada → update google_id (link) & profil.
			uid = user.id;
			await d
				.prepare(`UPDATE users SET google_id = ?, name = ?, avatar_url = ? WHERE id = ?`)
				.bind(googleId, name, avatar, uid)
				.run();
		} else {
			// User baru → buat. Kolom password_hash & salt NOT NULL → isi placeholder
			// (akun Google tidak pakai password; hanya untuk memenuhi skema).
			uid = `g_${randomToken()}`;
			await d
				.prepare(`INSERT INTO users (id, email, password_hash, salt, google_id, name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)`)
				.bind(uid, email, "", "", googleId, name, avatar)
				.run();
		}

		const { token, expiresMs } = await createSession(d, uid);
		// Redirect ke halaman admin ODOJ + set session cookie di header jawaban.
		const redirectUrl = new URL("/odoj", c.req.url).toString();
		const res = new Response(null, {
			status: 302,
			headers: { location: redirectUrl },
		});
		setSessionCookie(res.headers, token, expiresMs);
		return res;
	} catch (err) {
		return json({ error: `callback error: ${err instanceof Error ? err.message : String(err)}` }, 500);
	}
});

// ── GROUP ───────────────────────────────────────────────────────────────
odojApp.post("/odoj/groups", async (c) => {
	const d = db(c);
	const userId = await requireUser(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const { name } = await c.req.json<{ name?: string }>();
	if (!name?.trim()) return json({ error: "nama group wajib" }, 400);
	const existing = await d
		.prepare(`SELECT id FROM odoj_groups WHERE admin_user_id = ?`)
		.bind(userId)
		.first();
	if (existing) return json({ error: "kamu sudah punya group" }, 409);
	const id = randomToken();
	await d
		.prepare(`INSERT INTO odoj_groups (id, name, admin_user_id, token) VALUES (?, ?, ?, ?)`)
		.bind(id, name.trim(), userId, randomToken())
		.run();
	return json({ ok: true, group: { id, name: name.trim() } });
});

odojApp.get("/odoj/groups/me", async (c) => {
	const d = db(c);
	const userId = await requireUser(c);
	if (!userId) return json({ error: "unauthorized" }, 401);
	const g = await d
		.prepare(`SELECT id, name, token FROM odoj_groups WHERE admin_user_id = ?`)
		.bind(userId)
		.first();
	return json({ group: g || null });
});

// ── VIEW PUBLIK (tanpa auth, validasi token group) ─────────────────────
odojApp.get("/odoj/view", async (c) => {
	const d = db(c);
	const groupToken = c.req.query("group");
	const date = c.req.query("date");
	if (!groupToken || !validDate(date || "")) return json({ error: "link tidak valid" }, 404);
	const g = await d
		.prepare(`SELECT id, name FROM odoj_groups WHERE token = ?`)
		.bind(groupToken)
		.first<{ id: string; name: string }>();
	if (!g) return json({ error: "link tidak valid" }, 404);
	const rows = await d
		.prepare(
			`SELECT a.juz_number, p.name AS participant_name, a.token, a.status
			 FROM odoj_assignment a
			 JOIN odoj_participants p ON p.id = a.participant_id
			 WHERE a.group_id = ? AND a.date = ?
			 ORDER BY a.juz_number`,
		)
		.bind(g.id, date)
		.all<{ juz_number: number; participant_name: string; token: string; status: string }>();
	return json({ date, group_name: g.name, list: rows.results });
});

// ── SELESAI DIBACA (peserta, tanpa auth, validasi token assignment) ────
odojApp.post("/odoj/read/complete", async (c) => {
	const d = db(c);
	const { token } = await c.req.json<{ token?: string }>();
	if (!token) return json({ error: "token wajib" }, 400);
	const row = await d
		.prepare(`SELECT id, status FROM odoj_assignment WHERE token = ?`)
		.bind(token)
		.first<{ id: string; status: string }>();
	if (!row) return json({ error: "link tidak valid" }, 404);
	if (row.status !== "done") {
		await d
			.prepare(
				`UPDATE odoj_assignment SET status = 'done', done_by = 'participant', read_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
			)
			.bind(row.id)
			.run();
	}
	return json({ ok: true });
});

// ── ADMIN: peserta ─────────────────────────────────────────────────────
odojApp.get("/odoj/participants", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const rows = await d
		.prepare(`SELECT id, name FROM odoj_participants WHERE group_id = ? ORDER BY name`)
		.bind(g.id)
		.all<{ id: string; name: string }>();
	return json({ list: rows.results });
});

odojApp.post("/odoj/participants", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const { name } = await c.req.json<{ name?: string }>();
	if (!name?.trim()) return json({ error: "nama wajib" }, 400);
	const id = randomToken();
	await d
		.prepare(`INSERT INTO odoj_participants (id, group_id, name) VALUES (?, ?, ?)`)
		.bind(id, g.id, name.trim())
		.run();
	return json({ ok: true, participant: { id, name: name.trim() } });
});

odojApp.delete("/odoj/participants/:id", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	await d
		.prepare(`DELETE FROM odoj_participants WHERE id = ? AND group_id = ?`)
		.bind(c.req.param("id"), g.id)
		.run();
	return json({ ok: true });
});

// ── ADMIN: assignments ─────────────────────────────────────────────────
odojApp.get("/odoj/assignments", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const date = c.req.query("date") || new Date().toISOString().slice(0, 10);
	const rows = await d
		.prepare(
			`SELECT a.juz_number, a.participant_id, p.name, a.status, a.id
			 FROM odoj_assignment a
			 JOIN odoj_participants p ON p.id = a.participant_id
			 WHERE a.group_id = ? AND a.date = ?
			 ORDER BY a.juz_number`,
		)
		.bind(g.id, date)
		.all<{ juz_number: number; participant_id: string; name: string; status: string; id: string }>();
	return json({ date, list: rows.results });
});

odojApp.put("/odoj/assignments", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const { date, juz_number, participant_id } = await c.req.json<{
		date?: string;
		juz_number?: number;
		participant_id?: string;
	}>();
	if (!validDate(date || "") || !validJuz(Number(juz_number)) || !participant_id) {
		return json({ error: "data tidak valid" }, 400);
	}
	const own = await d
		.prepare(`SELECT id FROM odoj_participants WHERE id = ? AND group_id = ?`)
		.bind(participant_id, g.id)
		.first();
	if (!own) return json({ error: "peserta tidak valid" }, 400);
	const existing = await d
		.prepare(`SELECT id FROM odoj_assignment WHERE group_id = ? AND date = ? AND juz_number = ?`)
		.bind(g.id, date, juz_number)
		.first<{ id: string }>();
	if (existing) {
		await d
			.prepare(
				`UPDATE odoj_assignment SET participant_id = ?, status = 'assigned', done_by = NULL, updated_at = datetime('now') WHERE id = ?`,
			)
			.bind(participant_id, existing.id)
			.run();
	} else {
		await d
			.prepare(
				`INSERT INTO odoj_assignment (id, group_id, date, juz_number, participant_id, token)
				 VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.bind(randomToken(), g.id, date, juz_number, participant_id, randomToken())
			.run();
	}
	return json({ ok: true });
});

odojApp.put("/odoj/assignments/:id/done", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const own = await d
		.prepare(`SELECT id FROM odoj_assignment WHERE id = ? AND group_id = ?`)
		.bind(c.req.param("id"), g.id)
		.first();
	if (!own) return json({ error: "assignment tidak valid" }, 404);
	await d
		.prepare(
			`UPDATE odoj_assignment SET status = 'done', done_by = 'admin', read_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
		)
		.bind(c.req.param("id"))
		.run();
	return json({ ok: true });
});

odojApp.put("/odoj/assignments/:id/undone", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const own = await d
		.prepare(`SELECT id FROM odoj_assignment WHERE id = ? AND group_id = ?`)
		.bind(c.req.param("id"), g.id)
		.first();
	if (!own) return json({ error: "assignment tidak valid" }, 404);
	await d
		.prepare(
			`UPDATE odoj_assignment SET status = 'assigned', done_by = NULL, read_at = NULL, updated_at = datetime('now') WHERE id = ?`,
		)
		.bind(c.req.param("id"))
		.run();
	return json({ ok: true });
});

// ── ADMIN: copy-template ──────────────────────────────────────────────
odojApp.post("/odoj/assignments/copy-template", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const { from_date, to_date } = await c.req.json<{ from_date?: string; to_date?: string }>();
	if (!validDate(from_date || "") || !validDate(to_date || "")) {
		return json({ error: "tanggal tidak valid" }, 400);
	}
	const src = await d
		.prepare(`SELECT juz_number, participant_id FROM odoj_assignment WHERE group_id = ? AND date = ?`)
		.bind(g.id, from_date)
		.all<{ juz_number: number; participant_id: string }>();
	if (src.results.length === 0) return json({ error: "tidak ada data pada tanggal sumber" }, 404);
	await d
		.prepare(`DELETE FROM odoj_assignment WHERE group_id = ? AND date = ?`)
		.bind(g.id, to_date)
		.run();
	for (const r of src.results) {
		await d
			.prepare(
				`INSERT INTO odoj_assignment (id, group_id, date, juz_number, participant_id, token)
				 VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.bind(randomToken(), g.id, to_date, r.juz_number, r.participant_id, randomToken())
			.run();
	}
	return json({ ok: true, count: src.results.length });
});

// ── ADMIN: history ─────────────────────────────────────────────────────
odojApp.get("/odoj/history", async (c) => {
	const d = db(c);
	const g = await requireGroup(c);
	if (!g) return json({ error: "unauthorized" }, 401);
	const rows = await d
		.prepare(
			`SELECT date,
			        SUM(status = 'done') AS done,
			        COUNT(*) AS assigned
			 FROM odoj_assignment
			 WHERE group_id = ?
			 GROUP BY date
			 ORDER BY date DESC`,
		)
		.bind(g.id)
		.all<{ date: string; done: number; assigned: number }>();
	return json({ list: rows.results });
});

odojApp.all("*", (c) => json({ error: "not found" }, 404));
