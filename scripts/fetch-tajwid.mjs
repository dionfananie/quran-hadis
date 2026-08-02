import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const API = "https://api.alquran.cloud/v1/surah";
const OUT_DIR = join(ROOT, "public", "data", "tajwid");
const DELAY_MS = 150;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ok = 0;
let failed = 0;
const failedList = [];

mkdirSync(OUT_DIR, { recursive: true });

for (let n = 1; n <= 114; n++) {
	try {
		const res = await fetch(`${API}/${n}/quran-tajweed`, {
			signal: AbortSignal.timeout(20000),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = await res.json();
		const ayahs = json?.data?.ayahs ?? [];
		const text = new Array(ayahs.length);
		for (const ayah of ayahs) {
			text[ayah.numberInSurah - 1] = ayah.text ?? "";
		}
		writeFileSync(join(OUT_DIR, `${n}.json`), JSON.stringify(text));
		ok++;
		const filled = text.filter((t) => t != null).length;
		console.log(`tajwid ${String(n).padStart(3)} ok — ${filled} ayahs`);
	} catch (err) {
		failed++;
		failedList.push(n);
		writeFileSync(join(OUT_DIR, `${n}.json`), "[]");
		console.error(`tajwid ${String(n).padStart(3)} FAILED — ${err.message}`);
	}
	await delay(DELAY_MS);
}

console.log(
	`\nDone. ${ok} surahs written, ${failed} failed${failedList.length ? ` (${failedList.join(", ")})` : ""}.`,
);
