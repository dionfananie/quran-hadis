import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ChevronRight, Play, Pause } from "lucide-react";
import type { Route } from "./+types/juz";
import { getSurah, getSurahMeta, surahAudioUrl } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";
import { useShowTranslation } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import juzData from "@/data/juz.json";

export function meta({ params }: Route.MetaArgs) {
	const n = Number(params.number);
	const ok = n >= 1 && n <= 30;
	return [{
		title: ok ? `Juz ${n} | Moozhaf` : "Juz tidak ditemukan | Moozhaf",
	}];
}

type JuzMeta = {
	juz: number;
	start: { surah: number; ayah: number };
	end: { surah: number; ayah: number };
};

type FlatAyah = {
	key: string;
	inSurah: number;
	surah: number;
	surahName: string;
	arab: string;
	translation: string;
	audio?: string;
};

const pillBase =
	"inline-flex min-h-10 flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-gold";
const activePill = `${pillBase} bg-teal text-white shadow-sm dark:bg-primary dark:text-primary-foreground`;
const idlePill = `${pillBase} text-muted-foreground hover:text-foreground`;

export default function Juz() {
	const { number } = useParams<{ number: string }>();
	const { t } = useI18n();
	const [searchParams] = useSearchParams();
	const odojToken = searchParams.get("odoj_token");
	const [odojDone, setOdojDone] = useState<boolean | null>(null);
	const [odojBusy, setOdojBusy] = useState(false);
	const n = Number(number);

	const [ayahs, setAyahs] = useState<FlatAyah[] | null>(null);
	const [error, setError] = useState(false);

	// Display toggle (audio per-ayat + arab/terjemahan)
	const [showTranslation, setShowTranslation] = useShowTranslation();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [current, setCurrent] = useState<string | null>(null);

	const meta = useMemo<JuzMeta | undefined>(() => {
		if (!number) return undefined;
		return (juzData as unknown as JuzMeta[]).find((j) => j.juz === n);
	}, [number, n]);

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

	useEffect(() => {
		if (!meta) return;
		let alive = true;
		(async () => {
			try {
				const surats: FlatAyah[] = [];
				for (let s = meta.start.surah; s <= meta.end.surah; s++) {
					const surah = await getSurah(s);
					if (!surah) continue;
					const sname = getSurahMeta(s)?.name || `Surah ${s}`;
					for (const ay of surah.ayahs) {
						if (ay.meta.juz !== n) continue;
						surats.push({
							key: `${s}:${ay.number.inSurah}`,
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
		return () => { alive = false; };
	}, [meta, n]);

	useEffect(() => () => { audioRef.current?.pause(); }, []);

	const stopAudio = () => { audioRef.current?.pause(); setCurrent(null); };
	const toggleAyah = (key: string, url?: string) => {
		if (!url) return;
		if (current === key) { stopAudio(); return; }
		const a = audioRef.current ?? new Audio();
		audioRef.current = a;
		a.src = url;
		a.onended = () => setCurrent(null);
		void a.play();
		setCurrent(key);
	};

	if (!meta) return <div className="p-10 text-center text-muted-foreground">Juz tidak ditemukan.</div>;
	if (error) return <div className="p-10 text-center text-muted-foreground">Gagal memuat.</div>;
	if (!ayahs) return <div className="p-10 text-center text-muted-foreground">{t("odoj.loading")}</div>;

	return (
		<div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link to="/" className="hover:text-foreground">Moozhaf</Link>
				<ChevronRight className="size-3" />
				<Link to="/quran" className="hover:text-foreground">{t("nav.quran")}</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal dark:text-primary">Juz {n}</span>
			</nav>

			{/* Juz header */}
			<div className="rounded-2xl border border-gold-border bg-card p-8 text-center">
				<span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-surface font-serif text-xl font-semibold text-teal dark:text-primary">
					J{n}
				</span>
				<h1 className="mt-3 font-serif text-3xl font-semibold text-teal dark:text-primary">Juz {n}</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{meta.start.surah > 1 ? `Surat ${meta.start.surah}:${meta.start.ayah}` : "Al-Fatihah:1"} – Surat {meta.end.surah}:{meta.end.ayah} · {ayahs.length} {t("common_verses")}
				</p>
				{odojToken && !odojDone && (
					<button
						type="button"
						onClick={submitOdoj}
						disabled={odojBusy}
						className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50"
					>
						<span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span>
						{odojBusy ? t("odoj.loading") : "Selesai dibaca"}
					</button>
				)}
				{odojDone && (
					<p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-100 px-5 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-400">
						✓ Alhamdulillah, tercatat
					</p>
				)}
			</div>

			{/* Display toolbar */}
			<div className="rounded-xl border border-gold-border bg-card p-3">
				<div className="flex items-center justify-between">
					<div
						role="radiogroup"
						aria-label={t("quran.showTranslation")}
						className="flex gap-1 rounded-lg bg-muted p-1"
					>
						<button
							type="button"
							role="radio"
							aria-checked={!showTranslation}
							onClick={() => setShowTranslation(false)}
							className={cn(!showTranslation ? activePill : idlePill)}
						>
							{t("quran.arabicOnly")}
						</button>
						<button
							type="button"
							role="radio"
							aria-checked={showTranslation}
							onClick={() => setShowTranslation(true)}
							className={cn(showTranslation ? activePill : idlePill)}
						>
							{t("quran.arabicTranslation")}
						</button>
					</div>
					<span className="text-xs text-muted-foreground">{ayahs.length} ayat</span>
				</div>
			</div>

			{/* Ayahs */}
			<div className="space-y-6">
				{ayahs.map((a) => (
					<div key={a.key} id={`${a.surah}:${a.inSurah}`}>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => toggleAyah(a.key, a.audio)}
								title="Putar ayat"
								className="rounded-full p-1.5 text-teal hover:bg-teal/10 dark:text-primary"
							>
								{current === a.key ? <Pause className="size-4" /> : <Play className="size-4" />}
							</button>
							<span className="text-xs text-muted-foreground">[{a.surahName} : {a.inSurah}]</span>
						</div>
						<p className="mt-1 text-right text-2xl leading-loose" dir="rtl">{a.arab}</p>
						{showTranslation && a.translation && (
							<p className="mt-1 text-sm text-foreground/80">{a.translation}</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
