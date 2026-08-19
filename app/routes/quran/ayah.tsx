import { Link } from "react-router";
import { ChevronRight, Play, Pause, ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { Route } from "./+types/ayah";
import { getSurah, getSurahMeta } from "@/lib/data/quran";
import type { Ayah, Surah } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { TafsirCard } from "@/components/quran/tafsir-card";
import { ShareDialog } from "@/components/share-dialog";
import { useLastRead } from "@/lib/hooks";
import { generateAyahShareImage } from "@/lib/share-ayat-image";

export function meta({ params }: Route.MetaArgs) {
	const number = Number(params.number);
	const ayahIndex = Number(params.ayah);
	const surah = getSurahMeta(number);
	if (!surah) return [{ title: "Ayat tidak ditemukan — Moozhaf" }];
	const title = `${surah.name}:${ayahIndex} — ${surah.translation} | Moozhaf`;
	const url = `${SITE_URL}/quran/${params.number}/${params.ayah}`;

	return [
		{ title },
		{ name: "description", content: title },
		{ property: "og:title", content: title },
		{ property: "og:description", content: title },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "article" },
		{ name: "twitter:card", content: "summary" },
	];
}

export function loader({ params }: Route.LoaderArgs) {
	const number = Number(params.number);
	const ayahIndex = Number(params.ayah);
	if (!number || number < 1 || number > 114 || !ayahIndex || ayahIndex < 1) {
		throw new Response("Ayat tidak ditemukan", { status: 404 });
	}
	return { number, ayahIndex };
}

function AyahPlayer({ ayah, surah }: { ayah: Ayah; surah: Surah }) {
	const { t } = useI18n();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playing, setPlaying] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);
	const [reciter, setReciter] = useState<string>(() => Object.keys(ayah.audio)[0] ?? "");

	const reciters = Object.keys(ayah.audio);
	const audioUrl = ayah.audio[reciter] ?? Object.values(ayah.audio)[0];

	// Re-point the source whenever the reciter changes; if the user was already
	// listening, resume playback so the switcher feels instant.
	useEffect(() => {
		const a = audioRef.current;
		if (!a) return;
		const wasPlaying = !a.paused;
		a.src = audioUrl;
		if (wasPlaying) void a.play();
	}, [audioUrl]);

	const toggle = () => {
		if (!audioUrl) return;
		const a = audioRef.current ?? new Audio(audioUrl);
		audioRef.current = a;
		a.onplay = () => setPlaying(true);
		a.onpause = () => setPlaying(false);
		a.onended = () => setPlaying(false);
		if (a.paused) {
			void a.play();
		} else {
			a.pause();
		}
	};

	const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/quran/${surah.number}/${ayah.number.inSurah}`;
	const shareText = `${ayah.arab}\n\n${ayah.translation}\n\n${t("common_shareMore")}\n${shareUrl}`;

	// Data utk opsi "Bagikan Gambar" di ShareDialog.
	const shareImageSource = {
		arab: ayah.arab,
		translation: ayah.translation || "",
		surahName: surah.name,
		surahNumber: surah.number,
		ayahNumber: ayah.number.inSurah,
	};

	return (
		<div className="space-y-4">
			{audioUrl && (
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={toggle}
						className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					>
						{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
						{playing ? t("common_pause") : t("home.listenRecitation")}
					</button>
					<button
						type="button"
						onClick={() => setShareOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg border border-gold-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<Share2 className="size-4" />
						{t("common_share")}
						</button>
						</div>
					)}
			{reciters.length > 1 && (
				<div className="flex flex-wrap gap-2">
					{reciters.map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => setReciter(r)}
							className={`rounded-lg px-3 py-1 text-xs capitalize transition-colors ${reciter === r
								? "bg-teal text-white"
								: "bg-gold-surface text-muted-foreground hover:text-foreground"
								}`}
						>
							{r}
						</button>
					))}
				</div>
			)}

			<ShareDialog
				open={shareOpen}
				onOpenChange={setShareOpen}
				title={`${surah.name}:${ayah.number.inSurah}`}
				text={shareText}
				url={shareUrl}
				imageSource={shareImageSource}
			/>
		</div>
	);
}

export default function QuranAyah({ loaderData, params }: Route.ComponentProps) {
	const { t, lang } = useI18n();
	const { number, ayahIndex } = loaderData;
	const [surah, setSurah] = useState<Awaited<ReturnType<typeof getSurah>>>(undefined);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [, recordLastRead] = useLastRead();

	useEffect(() => {
		let cancelled = false;
		getSurah(number)
			.then((s) => { if (cancelled) return; if (!s) throw new Error("Not found"); setSurah(s); })
			.catch(() => { if (!cancelled) setError(true); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [number]);

	const meta = getSurahMeta(number);
	const ayah = surah?.ayahs.find((a) => a.number.inSurah === ayahIndex);
	const prevAyah = ayahIndex > 1 ? ayahIndex - 1 : null;
	const nextAyah = surah && ayahIndex < surah.ayahs.length ? ayahIndex + 1 : null;

	useEffect(() => {
		if (!surah || !ayah) return;
		recordLastRead({ surah: number, ayah: ayahIndex, readAt: Date.now() });
	}, [surah, ayah, number, ayahIndex, recordLastRead]);

	if (loading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
				<p className="text-sm text-muted-foreground">{t("common_loading")}</p>
			</div>
		);
	}

	if (error || !surah || !ayah) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<p className="font-serif text-xl font-semibold text-teal">
					{meta?.name ?? `Surah ${number}`}:{ayahIndex}
				</p>
				<p className="text-muted-foreground">{t("common_error")}</p>
				<Link
					to={`/quran/${number}`}
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
				<Link to="/" className="hover:text-foreground">Moozhaf</Link>
				<ChevronRight className="size-3" />
				<Link to="/quran" className="hover:text-foreground">{t("nav.quran")}</Link>
				<ChevronRight className="size-3" />
				<Link to={`/quran/${number}`} className="hover:text-foreground">{surah.name}</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal">{t("common_verse")} {ayahIndex}</span>
			</nav>

			{/* Ayah card */}
			<div className="rounded-2xl border border-gold-border bg-card p-8">
				<div className="flex flex-col items-center gap-6 text-center">
					<div className="flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-full bg-gold-surface font-serif text-sm font-semibold text-teal">
							{ayah.number.inSurah}
						</span>
						<span className="text-sm text-muted-foreground">
							{surah.name} • Juz {ayah.meta?.juz}
						</span>
					</div>
					<p className="font-arabic text-3xl leading-[2] text-teal md:text-4xl">{ayah.arab}</p>
					<p className="text-lg leading-relaxed text-muted-foreground">{ayah.translation}</p>
					<AyahPlayer ayah={ayah} surah={surah} />
				</div>
			</div>

			{/* Ayah metadata */}
			<div className="grid gap-3 sm:grid-cols-2">
				{ayah.meta && (
					<div className="rounded-xl border border-gold-border bg-card p-4">
						<h3 className="mb-2 font-serif text-sm font-semibold text-teal">{t("quran.info")}</h3>
						<div className="space-y-1 text-sm text-muted-foreground">
							<p>Juz: {ayah.meta.juz}</p>
							<p>Halaman: {ayah.meta.page}</p>
							{surah.revelation && <p>Jenis: {surah.revelation}</p>}
						</div>
					</div>
				)}
				<div className="rounded-xl border border-gold-border bg-card p-4">
					<h3 className="mb-2 font-serif text-sm font-semibold text-teal">{t("quran.ayahImage")}</h3>
					{ayah.image && (
						<img
							src={ayah.image.primary}
							alt={`${surah.name} ${ayah.number.inSurah}`}
							className="w-full rounded-lg"
							loading="lazy"
						/>
					)}
				</div>
			</div>

			{/* Tafsir */}
			{ayah.tafsir && <TafsirCard tafsir={ayah.tafsir} />}

			{/* Navigation */}
			<div className="flex items-center justify-between gap-4 border-t border-gold-border pt-6">
				{prevAyah ? (
					<Link
						to={`/quran/${number}/${prevAyah}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						<ArrowLeft className="size-4" />
						{t("common_verse")} {prevAyah}
					</Link>
				) : (
					<div />
				)}
				<Link
					to={`/quran/${number}`}
					className="text-xs font-bold uppercase tracking-[0.05em] text-gold hover:underline"
				>
					{t("home.surahIndex")}
				</Link>
				{nextAyah ? (
					<Link
						to={`/quran/${number}/${nextAyah}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						{t("common_verse")} {nextAyah}
						<ArrowRight className="size-4" />
					</Link>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}
