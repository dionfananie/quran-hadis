import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ChevronRight, Play, Pause } from "lucide-react";
import type { Route } from "./+types/juz";
import { getSurah, getSurahMeta, getSurahTajwid, surahAudioUrl } from "@/lib/data/quran";
import { useI18n, type TKey } from "@/lib/i18n";
import { useShowTranslation, useShowTajwid } from "@/lib/hooks";
import { TAJWEED_RULES, parseTajweed } from "@/lib/tajweed";
import { cn } from "@/lib/utils";
import { MemorizeButton } from "@/components/memorize-button";
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

const LEGEND_GROUPS: { titleKey: TKey; match: (id: string) => boolean }[] = [
	{ titleKey: "quran.legend.madd", match: (id) => id.startsWith("madda-") },
	{ titleKey: "quran.legend.idgham", match: (id) => id.startsWith("idgham-") },
	{ titleKey: "quran.legend.ikhfa", match: (id) => id === "ikhafa" || id === "ikhafa-shafawi" },
	{ titleKey: "quran.legend.other", match: () => true },
];

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
	const [showTajwid, setShowTajwid] = useShowTajwid();
	const [tajwidMap, setTajwidMap] = useState<Record<number, string[]>>({});
	const [showLegend, setShowLegend] = useState(false);
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

	// Lazy-load tajwid utk semua surat dlm juz saat toggle ON
	useEffect(() => {
		if (!showTajwid || !meta) return;
		let cancelled = false;
		(async () => {
			const map: Record<number, string[]> = {};
			for (let s = meta.start.surah; s <= meta.end.surah; s++) {
				const bundle = await getSurahTajwid(s);
				if (cancelled) return;
				if (bundle) map[s] = bundle;
			}
			if (!cancelled) setTajwidMap(map);
		})();
		return () => { cancelled = true; };
	}, [showTajwid, meta]);

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

	// Divider/header saat masuk surah baru di dalam halaman juz.
	function SurahDivider({ surah, name }: { surah: number; name: string }) {
		const metaS = getSurahMeta(surah);
		return (
			<div className="mb-3 flex items-center gap-3">
				<div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
				<div className="flex items-center gap-2 rounded-full border border-gold-border bg-gold-surface px-4 py-1.5">
					<span className="size-6 rounded-full bg-teal text-center font-serif text-xs font-semibold leading-6 text-white dark:bg-primary">
						{surah}
					</span>
					<span className="font-serif text-sm font-semibold text-teal dark:text-primary">{name}</span>
					{metaS?.numberOfAyahs && (
						<span className="hidden text-xs text-muted-foreground sm:inline">
							· {metaS.numberOfAyahs} ayat
						</span>
					)}
				</div>
				<div className="h-px flex-1 bg-gradient-to-r from-gold to-transparent" />
			</div>
		);
	}

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
				<div className="mt-4 flex justify-center">
					<MemorizeButton kind="juz" refNumber={n} />
				</div>
				</div>

			{/* Display toolbar */}
			<div className="rounded-xl border border-gold-border bg-card p-3">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
					<div className="flex gap-1 rounded-lg bg-muted p-1">
						<button
							type="button"
							onClick={() => setShowTajwid(!showTajwid)}
							className={cn(showTajwid ? activePill : idlePill)}
						>
							{t("quran.tajwid")}
						</button>
						{showTajwid && (
							<button
								type="button"
								onClick={() => setShowLegend((v) => !v)}
								className={cn(
									showLegend ? activePill : `${pillBase} bg-gold-surface text-teal hover:text-foreground`,
								)}
							>
								{t("quran.tajwidLegend")}
							</button>
						)}
					</div>
				</div>

				{showLegend && (
					<div className="mt-3 grid gap-6 rounded-xl border border-gold-border bg-card p-4 animate-in fade-in-0 duration-200 sm:grid-cols-2 lg:grid-cols-4">
						{LEGEND_GROUPS.map((group) => {
							const rules = TAJWEED_RULES.filter((r) => group.match(r.id));
							return (
								<div key={group.titleKey} className="min-w-0">
									<h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gold">
										{t(group.titleKey)}
									</h3>
									<ul className="space-y-1.5">
										{rules.map((rule) => (
											<li key={rule.id} className="flex items-center gap-2 text-xs">
												<span
													aria-hidden
													className="size-3 shrink-0 rounded-full border border-black/10 dark:border-white/20"
													style={{ backgroundColor: rule.color }}
												/>
												<span className="leading-snug text-muted-foreground">
													{t(group.titleKey) && rule.nameKey ? t(rule.nameKey as TKey) : rule.nameKey}
												</span>
											</li>
										))}
									</ul>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Ayahs */}
			<div className="space-y-3">
				{ayahs.map((a, idx) => {
					const isPlaying = current === a.key;
					const surahChanged = idx === 0 || a.surah !== ayahs[idx - 1].surah;
					const ayahTajwid =
						showTajwid && tajwidMap[a.surah]
							? tajwidMap[a.surah][a.inSurah - 1]
							: undefined;
					return (
						<div key={a.key}>
							{surahChanged && <SurahDivider surah={a.surah} name={a.surahName} />}
							<div
								id={`${a.surah}:${a.inSurah}`}
								className={cn(
									"flex items-start gap-3 rounded-xl border bg-card p-5 transition-colors",
									isPlaying
										? "border-gold bg-gold-surface/60"
										: "border-gold-border/50 hover:border-gold-border hover:bg-accent",
								)}
							>
							<Link
								to={`/quran/${a.surah}/${a.inSurah}`}
								className="flex min-w-0 flex-1 items-start gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-gold/70"
							>
								<span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-surface text-xs font-semibold text-teal dark:text-primary">
									{a.inSurah}
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									{ayahTajwid ? (
										<p className="font-arabic text-xl leading-[2] text-teal dark:text-primary">
											{parseTajweed(ayahTajwid)}
										</p>
									) : (
										<p className="font-arabic text-xl leading-[2] text-teal dark:text-primary" dir="rtl">{a.arab}</p>
									)}
									{showTranslation && a.translation && (
										<p className="text-sm leading-relaxed text-muted-foreground">{a.translation}</p>
									)}
									<span className="text-[11px] text-muted-foreground">{a.surahName} · ayat {a.inSurah}</span>
								</div>
							</Link>
							<button
								type="button"
								onClick={() => toggleAyah(a.key, a.audio)}
								aria-label="Putar ayat"
								aria-pressed={isPlaying}
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-gold",
									isPlaying
										? "bg-teal text-white dark:bg-primary dark:text-primary-foreground"
										: "bg-gold-surface text-teal hover:bg-teal hover:text-white dark:hover:bg-primary dark:hover:text-primary-foreground",
								)}
							>
								{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
							</button>
							</div>
						</div>
					);
				})}
			</div>

			{/* Juz navigation */}
			<div className="flex items-center justify-between gap-4 border-t border-gold-border pt-6">
				{n > 1 ? (
					<Link
						to={`/quran/juz/${n - 1}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						<ArrowLeft className="size-4" />
						Juz {n - 1}
					</Link>
				) : (
					<div />
				)}
				<Link
					to="/quran"
					className="text-xs font-bold uppercase tracking-[0.05em] text-gold hover:underline"
				>
					{t("home.surahIndex")}
				</Link>
				{n < 30 ? (
					<Link
						to={`/quran/juz/${n + 1}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						Juz {n + 1}
						<ChevronRight className="size-4" />
					</Link>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}
