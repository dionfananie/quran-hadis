// crypto.ts — Hash & verifikasi password (Web Crypto PBKDF2-SHA256), zero-dep.
// Runtime: Cloudflare Workers (crypto.subtle tersedia). 100k iterasi.

const ITERATIONS = 100_000;
const KEYLEN = 256; // bits
const enc = new TextEncoder();

function bytesToHex(buf: ArrayBuffer): string {
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

function randomBytes(n: number): string {
	const arr = new Uint8Array(n);
	crypto.getRandomValues(arr);
	return bytesToHex(arr.buffer);
}

async function derive(password: string, saltBytes: Uint8Array): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
		key,
		KEYLEN,
	);
	return new Uint8Array(bits);
}

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);

/** Hash password → `{ salt, hash }` (hex). */
export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
	const salt = hexToBytes(randomBytes(16));
	const hash = await derive(password, salt);
	return { salt: bytesToHex(salt.buffer), hash: bytesToHex(hash.buffer) };
}

/** Verify password terhadap salt+hash tersimpan. Timing-safe. */
export async function verifyPassword(
	password: string,
	salt: string,
	hash: string,
): Promise<boolean> {
	try {
		const got = await derive(password, hexToBytes(salt));
		return timingSafeEqual(got, hexToBytes(hash));
	} catch {
		return false;
	}
}
