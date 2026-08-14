import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Tombol "Tandai hafal" — checklist hafalan per-surah/per-juz di halaman bacaan.
 * Hanya tampil untuk user yang login (cek /api/auth/me); jika belum login → hidden.
 * `kind`: "surah" | "juz". `ref`: nomor surah/juz.
 */
export function MemorizeButton({ kind, refNumber }: { kind: "surah" | "juz"; refNumber: number }) {
	const { t } = useI18n();
	const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
	const [done, setDone] = useState(false);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let alive = true;
		// Cek login; bila ya, ambil status hafalan utk target ini.
		(async () => {
			try {
				const me = await fetch("/api/auth/me");
				if (!me.ok) {
					if (alive) setLoggedIn(false);
					return;
				}
				if (!alive) return;
				setLoggedIn(true);
				const isJuz = kind === "juz";
				const path = isJuz ? "/api/hafalan/juz" : "/api/hafalan/surah";
				const res = await fetch(path);
				if (!res.ok) return;
				const data = (await res.json()) as {
					list: { juz_number: number; surah_number: number; done: number }[];
				};
				if (!alive) return;
				const found = data.list.find((x) => (isJuz ? x.juz_number : x.surah_number) === refNumber);
				setDone(found ? !!found.done : false);
			} catch {
				if (alive) setLoggedIn(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [kind, refNumber]);

	if (loggedIn === false) return null; // belum login → jangan tampil di halaman publik

	async function toggle() {
		if (busy) return;
		setBusy(true);
		try {
			const nkind = kind === "juz" ? "juz" : "surah";
			const endpoint =
				kind === "juz" ? `/api/hafalan/juz/${refNumber}` : `/api/hafalan/surah/${refNumber}`;
			const next = !done;
			const res = await fetch(endpoint, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ done: next }),
			});
			if (res.ok) setDone(next);
		} finally {
			setBusy(false);
		}
	}

	if (loggedIn === null || loggedIn === true) {
		return (
			<button
				type="button"
				onClick={toggle}
				disabled={busy || loggedIn === null}
				className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
					done
						? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
						: "bg-gold text-white hover:bg-gold/90"
				}`}
			>
				<Check className="size-4" />
				{done ? t("murajaah.memorized") : busy ? t("murajaah.memorizeSave") : t("murajaah.memorize")}
			</button>
		);
	}
	return null;
}
