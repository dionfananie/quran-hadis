import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/juz";
import { getSurah, getSurahMeta, surahAudioUrl } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import juzData from "@/data/juz.json";

export function meta({ params }: Route.MetaArgs) {
	const n = Number(params.number);
	const title = n >= 1 && n <= 30 ? `Juz ${n} | Moozhaf` : "Juz tidak ditemukan | Moozhaf";
	return [{ title }];
}

type JuzMeta = {
	juz: number;
	start: { surah: number; ayah: number };
	end: { surah: number; ayah: number };
};

type FlatAyah = {
	inQuran: number;
	inSurah: number;
	surah: number;
	surahName: string;
	arab: string;
	translation: string;
	audio?: string;
};

export default function Juz() {
	const { number } = useParams<{ number: string }>();
	const { t } = useI18n();
	const [searchParams] = useSearchParams();
	const odojToken = searchParams.get("odoj_token");
	const [odojDone, setOdojDone] = useState<boolean | null>(null);
	const [odojBusy, setOdojBusy] = useState(false);
	const n = Number(number);

	const submitOdoj = async () => {
		if (!odojToken) return;
		setOdojBusy(true);
		try {
			const res = await fetch("/api/odoj/read/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: odojToken }),
			});
			setOdojDone(res.ok);
		} catch {
			setOdojDone(false);
		} finally {
			setOdojBusy(false);
		}
	};

	const meta = useMemo<JuzMeta | undefined>(() => {
		if (!number) return undefined;
		return (juzData as JuzMeta[]).find((j) => j.juz === n);
	}, [number, n]);

	const [ayahs, setAyahs] = useState<FlatAyah[] | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!meta) return;
		let alive = true;
		(async () => {
			try {
				// Range surat dari start.surah s/d end.surah
				const surats: FlatAyah[] = [];
				for (let s = meta.start.surah; s <= meta.end.surah; s++) {
					const surah = await getSurah(s);
					if (!surah) continue;
					const sname = getSurahMeta(s)?.name || `Surah ${s}`;
					for (const ay of surah.ayahs) {
						if (ay.meta.juz !== n) continue;
						surats.push({
							inQuran: ay.number.inQuran,
							inSurah: ay.number.inSurah,
							surah: s,
							surahName: sname,
							arab: ay.arab,
							translation: ay.translation || "",
							audio: ay.audio?.alafasy,
						});
					}
				}
				if (alive) setAyahs(surats);
			} catch {
				if (alive) setError(true);
			}
		})();
		return () => {
			alive = false;
		};
	}, [meta, n]);

	if (!meta) {
		return <div className="p-8 text-center text-muted-foreground">Juz tidak ditemukan.</div>;
	}

	if (error) return <div className="p-8 text-center text-muted-foreground">Gagal memuat.</div>;
	if (!ayahs) return <div className="p-8 text-center text-muted-foreground">{t("odoj.loading")}</div>;

	return (
		<div className="mx-auto max-w-2xl p-4">
			<Link to="/quran" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
				<ArrowLeft className="size-4" /> {t("nav.quran")}
			</Link>
			<h1 className="mt-2 mb-1 font-serif text-2xl font-bold">Juz {n}</h1>
			<p className="mb-6 text-sm text-muted-foreground">
				Surat {meta.start.surah}:{meta.start.ayah} – Surat {meta.end.surah}:{meta.end.ayah} · {ayahs.length} ayat
			</p>

			{odojToken && (
				<div className="mb-6 rounded-lg border bg-muted/30 p-3">
					{odojDone === null ? (
						<button
							type="button"
							onClick={submitOdoj}
							disabled={odojBusy}
							className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
						>
							{odojBusy ? t("odoj.loading") : "Selesai Dibaca"}
						</button>
					) : odojDone ? (
						<p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
							✓ Alhamdulillah, tercatat.
						</p>
					) : (
						<p className="text-center text-sm text-red-600">
							Gagal mencatat. Coba lagi.
						</p>
					)}
				</div>
			)}

			<div className="space-y-6">
				{ayahs.map((a) => (
					<div key={a.inQuran} className="select-none">
						<a
							id={`ayah-${a.inQuran}`}
							href={`/audio?src=${encodeURIComponent(a.audio || "")}&surah=${a.surah}&ayah=${a.inSurah}`}
							className="text-right text-2xl leading-loose"
							dir="rtl"
						>
							{a.arab}
						</a>
						<p className="mt-1 text-sm text-muted-foreground">
							[{a.surahName} : {a.inSurah}]
						</p>
						{a.translation && (
							<p className="mt-1 text-sm text-foreground/80">{a.translation}</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
