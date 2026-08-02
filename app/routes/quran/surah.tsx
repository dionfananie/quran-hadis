import { Link } from "react-router";
import { ChevronRight, Play, Pause, ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { Route } from "./+types/surah";
import { getSurah, getSurahMeta, surahIndex } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export function meta({ params, data }: Route.MetaArgs) {
	const surah = data?.surah;
	if (!surah) return [{ title: "Surah tidak ditemukan — Moozhaf" }];
	const title = `${surah.name} (${surah.translation}) — Baca Surah ${surah.name} | Moozhaf`;
	const description = surah.description.slice(0, 160);
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
	const [playing, setPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

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

	const meta = getSurahMeta(number);
	const prevSurah = surahIndex.find((s) => s.number === number - 1);
	const nextSurah = surahIndex.find((s) => s.number === number + 1);

	const toggleAudio = () => {
		if (!surah?.audio) return;
		const a = audioRef.current ?? new Audio(surah.audio);
		audioRef.current = a;
		if (playing) {
			a.pause();
			setPlaying(false);
		} else {
			void a.play();
			setPlaying(true);
			a.onended = () => setPlaying(false);
		}
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
						{surah.audio && (
							<button
								type="button"
								onClick={toggleAudio}
								className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
							>
								{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
								{playing ? t("common_pause") : t("home.listenRecitation")}
							</button>
						)}
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
				{surah.ayahs.map((ayah) => (
					<Link
						key={ayah.number.inSurah}
						to={`/quran/${surah.number}/${ayah.number.inSurah}`}
						className="group block rounded-xl border border-gold-border/50 bg-card p-5 transition-colors hover:bg-accent"
					>
						<div className="flex items-start gap-4">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-surface text-xs font-semibold text-teal">
								{ayah.number.inSurah}
							</span>
							<div className="min-w-0 flex-1 space-y-2">
								<p className="font-arabic text-xl leading-[2] text-teal">{ayah.arab}</p>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{ayah.translation}
								</p>
							</div>
						</div>
					</Link>
				))}
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
