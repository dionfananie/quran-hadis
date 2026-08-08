// odoj.ts — Router API ODOJ + Auth. Dipanggil dari workers/app.ts untuk path /api/*.
// Model: register terbuka → tiap user bikin group sendiri. Multi-group, token per group/link.

import { hashPassword, verifyPassword } from "../lib/crypto";
import {
	createSession,
	getSessionUser,
	destroySession,
	setSessionCookie,
	clearSessionCookie,
} from "../lib/session";

type Env = { moozhaf_db: D1Database };

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

async function requireUser(db: D1Database, request: Request): Promise<string | null> {
	return getSessionUser(db, request);
}

async function requireGroup(db: D1Database, userId: string) {
	return db
		.prepare(`SELECT * FROM odoj_groups WHERE admin_user_id = ?`)
		.bind(userId)
		.first<{ id: string; name: string; token: string }>();
}

const router = async (env: Env, request: Request): Promise<Response> => {
	const db = env.moozhaf_db;
	const url = new URL(request.url);
	const { pathname } = url;

	// ---- AUTH ----
	if (pathname === "/api/auth/register" && request.method === "POST") {
		const { email, password } = await request.json<{ email?: string; password?: string }>();
		if (!email || !password || password.length < 8) {
			return json({ error: "email & password (min 8 char) wajib" }, 400);
		}
		const em = email.trim().toLowerCase();
		const exists = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(em).first();
		if (exists) return json({ error: "email sudah terdaftar" }, 409);
		const { salt, hash } = await hashPassword(password);
		const id = randomToken();
		await db
			.prepare(`INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)`)
			.bind(id, em, hash, salt)
			.run();
		const { token, expiresMs } = await createSession(db, id);
		const res = json({ ok: true, user: { id, email: em } });
		setSessionCookie(res.headers, token, expiresMs);
		return res;
	}

	if (pathname === "/api/auth/login" && request.method === "POST") {
		const { email, password } = await request.json<{ email?: string; password?: string }>();
		if (!email || !password) return json({ error: "email & password wajib" }, 400);
		const em = email.trim().toLowerCase();
		const user = await db
			.prepare(`SELECT * FROM users WHERE email = ?`)
			.bind(em)
			.first<{ id: string; password_hash: string; salt: string }>();
		if (!user || !(await verifyPassword(password, user.salt, user.password_hash))) {
			return json({ error: "email atau password salah" }, 401);
		}
		const { token, expiresMs } = await createSession(db, user.id);
		const res = json({ ok: true, user: { id: user.id, email: em } });
		setSessionCookie(res.headers, token, expiresMs);
		return res;
	}

	if (pathname === "/api/auth/logout" && request.method === "POST") {
		await destroySession(db, request);
		const res = json({ ok: true });
		clearSessionCookie(res.headers);
		return res;
	}

	if (pathname === "/api/auth/me") {
		const userId = await requireUser(db, request);
		if (!userId) return json({ error: "unauthorized" }, 401);
		const user = await db.prepare(`SELECT id, email FROM users WHERE id = ?`).bind(userId).first();
		return json({ user });
	}

	// ---- GROUP ----
	if (pathname === "/api/odoj/groups" && request.method === "POST") {
		const userId = await requireUser(db, request);
		if (!userId) return json({ error: "unauthorized" }, 401);
		const { name } = await request.json<{ name?: string }>();
		if (!name?.trim()) return json({ error: "nama group wajib" }, 400);
		const existing = await requireGroup(db, userId);
		if (existing) return json({ error: "kamu sudah punya group" }, 409);
		const id = randomToken();
		await db
			.prepare(
				`INSERT INTO odoj_groups (id, name, admin_user_id, token) VALUES (?, ?, ?, ?)`,
			)
			.bind(id, name.trim(), userId, randomToken())
			.run();
		return json({ ok: true, group: { id, name: name.trim() } });
	}

	if (pathname === "/api/odoj/groups/me") {
		const userId = await requireUser(db, request);
		if (!userId) return json({ error: "unauthorized" }, 401);
		const g = await requireGroup(db, userId);
		return json({ group: g ? { id: g.id, name: g.name, token: g.token } : null });
	}

	// ---- VIEW PUBLIK (tanpa auth, validasi token group) ----
	if (pathname === "/api/odoj/view") {
		const groupToken = url.searchParams.get("group");
		const date = url.searchParams.get("date");
		if (!groupToken || !validDate(date || "")) return json({ error: "link tidak valid" }, 404);
		const g = await db
			.prepare(`SELECT id, name FROM odoj_groups WHERE token = ?`)
			.bind(groupToken)
			.first<{ id: string; name: string }>();
		if (!g) return json({ error: "link tidak valid" }, 404);
		const rows = await db
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
	}

	// ---- SELESAI DIBACA (peserta, tanpa auth, validasi token assignment) ----
	if (pathname === "/api/odoj/read/complete" && request.method === "POST") {
		const { token } = await request.json<{ token?: string }>();
		if (!token) return json({ error: "token wajib" }, 400);
		const row = await db
			.prepare(`SELECT id, status FROM odoj_assignment WHERE token = ?`)
			.bind(token)
			.first<{ id: string; status: string }>();
		if (!row) return json({ error: "link tidak valid" }, 404);
		if (row.status !== "done") {
			await db
				.prepare(
					`UPDATE odoj_assignment SET status = 'done', done_by = 'participant', read_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
				)
				.bind(row.id)
				.run();
		}
		return json({ ok: true });
	}

	// ---- ADMIN: peserta ----
	if (pathname === "/api/odoj/participants" && request.method === "GET") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const rows = await db
			.prepare(`SELECT id, name FROM odoj_participants WHERE group_id = ? ORDER BY name`)
			.bind(g.id)
			.all<{ id: string; name: string }>();
		return json({ list: rows.results });
	}

	if (pathname === "/api/odoj/participants" && request.method === "POST") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const { name } = await request.json<{ name?: string }>();
		if (!name?.trim()) return json({ error: "nama wajib" }, 400);
		const id = randomToken();
		await db
			.prepare(`INSERT INTO odoj_participants (id, group_id, name) VALUES (?, ?, ?)`)
			.bind(id, g.id, name.trim())
			.run();
		return json({ ok: true, participant: { id, name: name.trim() } });
	}

	const partDel = pathname.match(/^\/api\/odoj\/participants\/(.+)$/);
	if (partDel && request.method === "DELETE") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		await db
			.prepare(`DELETE FROM odoj_participants WHERE id = ? AND group_id = ?`)
			.bind(partDel[1], g.id)
			.run();
		return json({ ok: true });
	}

	// ---- ADMIN: assignments ----
	if (pathname === "/api/odoj/assignments" && request.method === "GET") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
		const rows = await db
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
	}

	if (pathname === "/api/odoj/assignments" && request.method === "PUT") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const { date, juz_number, participant_id } = await request.json<{
			date?: string;
			juz_number?: number;
			participant_id?: string;
		}>();
		if (!validDate(date || "") || !validJuz(Number(juz_number)) || !participant_id) {
			return json({ error: "data tidak valid" }, 400);
		}
		const own = await db
			.prepare(`SELECT id FROM odoj_participants WHERE id = ? AND group_id = ?`)
			.bind(participant_id, g.id)
			.first();
		if (!own) return json({ error: "peserta tidak valid" }, 400);
		// upsert: ada assignment utk (group,date,juz)? update peserta; else insert. token baru tiap upsert insert.
		const existing = await db
			.prepare(`SELECT id FROM odoj_assignment WHERE group_id = ? AND date = ? AND juz_number = ?`)
			.bind(g.id, date, juz_number)
			.first<{ id: string }>();
		if (existing) {
			await db
				.prepare(
					`UPDATE odoj_assignment SET participant_id = ?, status = 'assigned', done_by = NULL, updated_at = datetime('now') WHERE id = ?`,
				)
				.bind(participant_id, existing.id)
				.run();
		} else {
			await db
				.prepare(
					`INSERT INTO odoj_assignment (id, group_id, date, juz_number, participant_id, token)
					 VALUES (?, ?, ?, ?, ?, ?)`,
				)
				.bind(randomToken(), g.id, date, juz_number, participant_id, randomToken())
				.run();
		}
		return json({ ok: true });
	}

	const assignId = pathname.match(/^\/api\/odoj\/assignments\/(.+)\/(done|undone)$/);
	if (assignId && request.method === "PUT") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const [, id, action] = assignId;
		const done = action === "done";
		const own = await db
			.prepare(`SELECT id FROM odoj_assignment WHERE id = ? AND group_id = ?`)
			.bind(id, g.id)
			.first();
		if (!own) return json({ error: "assignment tidak valid" }, 404);
		await db
			.prepare(
				`UPDATE odoj_assignment
				 SET status = ?, done_by = ?, read_at = ?, updated_at = datetime('now')
				 WHERE id = ?`,
			)
			.bind(done ? "done" : "assigned", done ? "admin" : null, done ? "datetime('now')" : null, id)
			.run();
		return json({ ok: true });
	}

	// ---- ADMIN: copy-template ----
	if (pathname === "/api/odoj/assignments/copy-template" && request.method === "POST") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const { from_date, to_date } = await request.json<{ from_date?: string; to_date?: string }>();
		if (!validDate(from_date || "") || !validDate(to_date || "")) {
			return json({ error: "tanggal tidak valid" }, 400);
		}
		const src = await db
			.prepare(
				`SELECT juz_number, participant_id FROM odoj_assignment WHERE group_id = ? AND date = ?`,
			)
			.bind(g.id, from_date)
			.all<{ juz_number: number; participant_id: string }>();
		if (src.results.length === 0) return json({ error: "tidak ada data pada tanggal sumber" }, 404);
		await db
			.prepare(`DELETE FROM odoj_assignment WHERE group_id = ? AND date = ?`)
			.bind(g.id, to_date)
			.run();
		for (const r of src.results) {
			await db
				.prepare(
					`INSERT INTO odoj_assignment (id, group_id, date, juz_number, participant_id, token)
					 VALUES (?, ?, ?, ?, ?, ?)`,
				)
				.bind(randomToken(), g.id, to_date, r.juz_number, r.participant_id, randomToken())
				.run();
		}
		return json({ ok: true, count: src.results.length });
	}

	// ---- ADMIN: history ----
	if (pathname === "/api/odoj/history") {
		const userId = await requireUser(db, request);
		const g = userId ? await requireGroup(db, userId) : null;
		if (!g) return json({ error: "unauthorized" }, 401);
		const rows = await db
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
	}

	return json({ error: "not found" }, 404);
};

export default { fetch: (request: Request, env: Env) => router(env, request) };
