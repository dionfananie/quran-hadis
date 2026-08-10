// session.ts — Session cookie (HttpOnly, Secure, SameSite=Lax) + validasi via D1.
// Sesi disimpan di tabel `sessions`. Token acak 32-byte hex.

const enc = new TextEncoder();

function randomToken(): string {
	const arr = new Uint8Array(32);
	crypto.getRandomValues(arr);
	return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const COOKIE = "moozhaf_session";

export function getSessionToken(request: Request): string | null {
	const header = request.headers.get("Cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [k, ...rest] = part.trim().split("=");
		if (k === COOKIE) return rest.join("=") || null;
	}
	return null;
}

/** Set cookie sesi pada Response headers. `expires` di ms sejak epoch. */
export function setSessionCookie(
	headers: Headers,
	token: string,
	expiresMs: number,
): void {
	const date = new Date(expiresMs).toUTCString();
	headers.append(
		"Set-Cookie",
		`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${date}`,
	);
}

/** Hapus cookie sesi. */
export function clearSessionCookie(headers: Headers): void {
	headers.append(
		"Set-Cookie",
		`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
	);
}

export interface Session {
	token: string;
	user_id: string;
	expires_at: string;
}

/** Buat sesi baru utk user. Return `{ token, expiresMs }`. */
export async function createSession(
	db: D1Database,
	userId: string,
	ttlMs = 1000 * 60 * 60 * 24 * 30, // 30 hari
): Promise<{ token: string; expiresMs: number }> {
	const token = randomToken();
	const expiresMs = Date.now() + ttlMs;
	await db
		.prepare(
			`INSERT INTO sessions (token, user_id, expires_at)
			 VALUES (?, ?, datetime(?, 'unixepoch'))`,
		)
		.bind(token, userId, Math.floor(expiresMs / 1000))
		.run();
	return { token, expiresMs };
}

/** Baca sesi dari request (validasi token + expiry). Return user_id atau null. */
export async function getSessionUser(
	db: D1Database,
	request: Request,
): Promise<string | null> {
	const token = getSessionToken(request);
	if (!token) return null;
	const row = await db
		.prepare(`SELECT user_id, expires_at FROM sessions WHERE token = ?`)
		.bind(token)
		.first<{ user_id: string; expires_at: string }>();
	if (!row) return null;
	// expires_at disimpan UTC (datetime) — bandingkan dengan now UTC.
	if (new Date(row.expires_at + "Z").getTime() < Date.now()) {
		await db.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
		return null;
	}
	return row.user_id;
}

/** Hapus sesi (logout). */
export async function destroySession(db: D1Database, request: Request): Promise<void> {
	const token = getSessionToken(request);
	if (token) await db.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
}
