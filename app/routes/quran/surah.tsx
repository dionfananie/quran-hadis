import { Link } from "react-router";
import { ChevronRight, Play, Pause, ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import type { Route } from "./+types/surah";
import {
	getSurah,
	getSurahMeta,
	getSurahTajwid,
	surahAudioUrl,
	surahIndex,
} from "@/lib/data/quran";
import { useI18n, type TKey } from "@/lib/i18n";
import { useShowTajwid, useShowTranslation } from "@/lib/hooks";
import { TAJWEED_RULES, parseTajweed } from "@/lib/tajweed";
import { SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

const LEGEND_GROUPS: { titleKey: TKey; match: (id: string) => boolean }[] = [
	{ titleKey: "quran.legend.madd", match: (id) => id.startsWith("madda-") },
	{ titleKey: "quran.legend.idgham", match: (id) => id.startsWith("idgham-") },
	{ titleKey: "quran.legend.ikhfa", match: (id) => id === "ikhafa" || id === "ikhafa-shafawi" },
	{ titleKey: "quran.legend.other", match: () => true },
];

const pillBase =
	"inline-flex min-h-10 flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-gold";
const activePill = `${pillBase} bg-teal text-white shadow-sm dark:bg-primary dark:text-primary-foreground`;
const idlePill = `${pillBase} text-muted-foreground hover:text-foreground`;

export function meta({ params }: Route.MetaArgs) {
	const surah = getSurahMeta(Number(params.number));
	if (!surah) return [{ title: "Surah tidak ditemukan — Moozhaf" }];
	const title = `${surah.name} (${surah.translation}) — Baca Surah ${surah.name} | Moozhaf`;
	const description = surah.translation;
	const url = `${SITE_URL}/quran/${params.number}`;

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "article" },
		{ name: "twitter:card", content: "summary" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
	];
}

export function loader({ params }: Route.LoaderArgs) {
	const number = Number(params.number);
	if (!number || number < 1 || number > 114) {
		throw new Response("Surah tidak ditemukan", { status: 404 });
	}
	return { number };
}

export default function QuranSurah({ loaderData, params }: Route.ComponentProps) {
	const { t, lang } = useI18n();
	const { number } = loaderData;
	const [surah, setSurah] = useState<Awaited<ReturnType<typeof getSurah>>>(undefined);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [current, setCurrent] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [showTranslation, setShowTranslation] = useShowTranslation();
	const [showTajwid, setShowTajwid] = useShowTajwid();
	const [tajwid, setTajwid] = useState<string[] | null>(null);
	const [showLegend, setShowLegend] = useState(false);
	const arabicOnlyRef = useRef<HTMLButtonElement>(null);
	const arabicTranslationRef = useRef<HTMLButtonElement>(null);

	// Load surah data client-side
	useEffect(() => {
		let cancelled = false;
		getSurah(number)
			.then((s) => {
				if (cancelled) return;
				if (!s) throw new Error("Not found");
				setSurah(s);
			})
			.catch(() => { if (!cancelled) setError(true); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [number]);

	// Drop any playing audio when switching surahs
	useEffect(() => {
		audioRef.current?.pause();
		audioRef.current = null;
		setCurrent(null);
	}, [number]);

	// Pause on unmount
	useEffect(() => {
		return () => {
			audioRef.current?.pause();
			audioRef.current = null;
		};
	}, []);

	// Lazy-load the tajwid bundle only when the toggle is on
	useEffect(() => {
		if (!showTajwid || tajwid) return;
		let cancelled = false;
		getSurahTajwid(number)
			.then((bundle) => {
				if (cancelled || !bundle) return;
				setTajwid(bundle);
			})
			.catch(() => {});
		return () => { cancelled = true; };
	}, [showTajwid, tajwid, number]);

	const meta = getSurahMeta(number);
	const prevSurah = surahIndex.find((s) => s.number === number - 1);
	const nextSurah = surahIndex.find((s) => s.number === number + 1);

	const stop = () => {
		if (audioRef.current) audioRef.current.pause();
		setCurrent(null);
	};

	const handleRadioKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
		e.preventDefault();
		const next = !showTranslation;
		setShowTranslation(next);
		(next ? arabicTranslationRef : arabicOnlyRef).current?.focus();
	};

	const playTag = (tag: string, url: string) => {
		if (current === tag) {
			stop();
			return;
		}
		const a = audioRef.current ?? new Audio();
		audioRef.current = a;
		a.src = url;
		a.onended = () => setCurrent(null);
		void a.play();
		setCurrent(tag);
	};

	if (loading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
				<p className="text-sm text-muted-foreground">{t("common_loading")}</p>
			</div>
		);
	}

	if (error || !surah) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<p className="font-serif text-xl font-semibold text-teal">
					{meta?.name ?? `Surah ${number}`}
				</p>
				<p className="text-muted-foreground">{t("common_error")}</p>
				<Link
					to="/quran"
					className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white"
				>
					<ArrowLeft className="size-4" />
					{t("home.surahIndex")}
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link to="/" className="hover:text-foreground">
					Moozhaf
				</Link>
				<ChevronRight className="size-3" />
				<Link to="/quran" className="hover:text-foreground">
					{t("nav.quran")}
				</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal">{surah.name}</span>
			</nav>

			{/* Surah header */}
			<div className="rounded-2xl border border-gold-border bg-card p-8">
				<div className="flex flex-col items-center gap-4 text-center">
					<span className="flex size-14 items-center justify-center rounded-full bg-gold-surface font-serif text-lg font-semibold text-teal">
						{surah.number}
					</span>
					<div>
						<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal">
							{surah.name}
						</h1>
						<p className="mt-1 text-muted-foreground">{surah.translation}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{surah.revelation} • {surah.numberOfAyahs} {t("common_verses")}
						</p>
					</div>
					{surah.arabic && (
						<p className="font-arabic text-2xl leading-relaxed text-teal">{surah.arabic}</p>
					)}
					<div className="flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={() => playTag("surah", surahAudioUrl(surah.number))}
							className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_0_3px_rgba(184,134,11,0.28),0_8px_24px_rgba(0,77,64,0.16)] focus-visible:outline-2 focus-visible:outline-gold dark:bg-primary dark:text-primary-foreground dark:hover:shadow-[0_0_0_3px_rgba(233,193,118,0.32),0_8px_24px_rgba(0,0,0,0.3)]"
						>
							{current === "surah" ? <Pause className="size-4" /> : <Play className="size-4" />}
							{current === "surah" ? t("common_pause") : t("home.listenRecitation")}
						</button>
					</div>
				</div>
			</div>

			{/* Bismillah */}
			{surah.bismillah && (
				<div className="rounded-xl border border-gold-border bg-card p-6 text-center">
					<p className="font-arabic text-2xl leading-[2.5] text-teal">{surah.bismillah.arab}</p>
					<p className="mt-2 text-sm italic text-muted-foreground">{surah.bismillah.translation}</p>
				</div>
			)}

			{/* Description */}
			<div className="rounded-xl border border-gold-border bg-card p-6">
				<h2 className="mb-3 font-serif text-lg font-semibold text-teal">
					{t("quran.description")}
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">{surah.description}</p>
			</div>

			{/* Ayahs */}
			<div className="space-y-3">
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
								tabIndex={!showTranslation ? 0 : -1}
								ref={arabicOnlyRef}
								onClick={() => setShowTranslation(false)}
								onKeyDown={handleRadioKeyDown}
								className={cn(!showTranslation ? activePill : idlePill)}
							>
								{t("quran.arabicOnly")}
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={showTranslation}
								tabIndex={showTranslation ? 0 : -1}
								ref={arabicTranslationRef}
								onClick={() => setShowTranslation(true)}
								onKeyDown={handleRadioKeyDown}
								className={cn(showTranslation ? activePill : idlePill)}
							>
								{t("quran.arabicTranslation")}
							</button>
						</div>
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							<button
								type="button"
								aria-pressed={showTajwid}
								onClick={() => setShowTajwid(!showTajwid)}
								className={cn(showTajwid ? activePill : idlePill)}
							>
								{t("quran.tajwid")}
							</button>
							{showTajwid && (
								<button
									type="button"
									aria-expanded={showLegend}
									aria-controls="tajwid-legend"
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
				</div>

				{showLegend && (
					<div
						id="tajwid-legend"
						className="grid animate-in gap-6 rounded-xl border border-gold-border bg-card p-4 fade-in-0 duration-200 sm:grid-cols-2 sm:gap-5 sm:p-5 lg:grid-cols-4"
					>
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
													{t(rule.nameKey)}
												</span>
											</li>
										))}
									</ul>
								</div>
							);
						})}
					</div>
				)}

				{surah.ayahs.map((ayah) => {
					const ayahTajwid =
						showTajwid && tajwid ? tajwid[ayah.number.inSurah - 1] : undefined;
					const isPlaying = current === `ayah:${ayah.number.inSurah}`;
					return (
						<div
							key={ayah.number.inSurah}
							className={cn(
								"flex items-start gap-3 rounded-xl border bg-card p-5 transition-colors",
								isPlaying
									? "border-gold bg-gold-surface/60"
									: "border-gold-border/50 hover:border-gold-border hover:bg-accent",
							)}
						>
							<Link
								to={`/quran/${surah.number}/${ayah.number.inSurah}`}
								className="group flex min-w-0 flex-1 items-start gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-gold/70"
							>
								<span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-surface text-xs font-semibold text-teal">
									{ayah.number.inSurah}
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									{ayahTajwid ? (
										<p className="font-arabic text-xl leading-[2] text-teal dark:[text-shadow:0_0_5px_rgba(241,241,236,0.22),0_1px_2px_rgba(0,0,0,0.4)]">
											{parseTajweed(ayahTajwid)}
										</p>
									) : (
										<p className="font-arabic text-xl leading-[2] text-teal">{ayah.arab}</p>
									)}
									{showTranslation && (
										<p className="text-sm leading-relaxed text-muted-foreground">
											{ayah.translation}
										</p>
									)}
								</div>
							</Link>
							<button
								type="button"
								onClick={() =>
									playTag(
										`ayah:${ayah.number.inSurah}`,
										ayah.audio.alafasy ?? Object.values(ayah.audio)[0],
									)
								}
								aria-label={isPlaying ? t("common_pause") : t("quran.listenAyah")}
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
					);
				})}
			</div>

			{/* Surah navigation */}
			<div className="flex items-center justify-between gap-4 border-t border-gold-border pt-6">
				{prevSurah ? (
					<Link
						to={`/quran/${prevSurah.number}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						<ArrowLeft className="size-4" />
						{prevSurah.name}
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
				{nextSurah ? (
					<Link
						to={`/quran/${nextSurah.number}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						{nextSurah.name}
						<ChevronRight className="size-4" />
					</Link>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}
