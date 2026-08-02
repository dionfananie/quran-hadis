import { useRef, useState } from "react";
import { Pause, Play, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { DailyVerse } from "@/lib/data/types";
import { SelectTafsir } from "@/components/home/select-tafsir";
import { ShareDialog } from "@/components/share-dialog";
import screenBg from "@/assets/screen.png";

export function DailyVerseCard({ verse }: { verse: DailyVerse }) {
	const { t } = useI18n();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playing, setPlaying] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);

	const toggle = () => {
		if (!verse.audio) return;
		const a = audioRef.current ?? new Audio(verse.audio);
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

	const url = `${typeof window !== "undefined" ? window.location.origin : ""}/quran/${verse.surah}/${verse.ayah}`;
	const shareText = `${verse.arab}\n\n${verse.translation}\n\n${t("common_shareMore")}\n${url}`;

	return (
		<section
			aria-label={t("home.dailyVerse")}
			className="relative flex flex-col gap-12 overflow-clip rounded-2xl border border-gold-border bg-green p-12 md:flex-row"
		>

			{/* Readability overlay */}
			<div aria-hidden className="absolute inset-0 bg-teal/45" />

			{/* Decorative SVG background */}
			<div className="pointer-events-none absolute -bottom-8 -right-4 size-32 text-gold/20">
				<svg viewBox="0 0 128 128" fill="none" className="size-full">
					<path
						d="M64 8C33 8 8 33 8 64s25 56 56 56 56-25 56-56S95 8 64 8zm0 104c-26 0-48-22-48-48s22-48 48-48 48 22 48 48-22 48-48 48z"
						fill="currentColor"
						opacity="0.3"
					/>
					<path
						d="M64 24c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 72c-17 0-32-15-32-32s15-32 32-32 32 15 32 32-15 32-32 32z"
						fill="currentColor"
						opacity="0.5"
					/>
				</svg>
			</div>

			{/* Main content */}
			<div className="relative flex w-full flex-col gap-4 pt-[5px]">
				<p className="text-xs font-bold uppercase tracking-[0.1em] text-gold">
					{t("home.dailyVerse")}
				</p>

				<section className="mt-[28px]" />

				<div className="drop-shadow-[0_1px_0.5px_rgba(0,0,0,0.05)]">
					<p className="font-arabic text-5xl leading-[78px] text-white">{verse.arab}</p>
				</div>

				<p className="text-lg leading-7 text-white/70">
					&ldquo;{verse.translation}&rdquo; ({verse.surah}:{verse.ayah})
				</p>

				{/* Action buttons */}
				<div className="flex flex-wrap gap-4">
					{verse.audio && (
						<button
							type="button"
							onClick={toggle}
							className="inline-flex items-center gap-2 bg-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90"
						>
							{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
							{playing ? t("common_pause") : t("home.listenRecitation")}
						</button>
					)}
					<button
						type="button"
						onClick={() => setShareOpen(true)}
						className="inline-flex items-center gap-1 border border-gold-border px-6 py-4 text-xs font-bold uppercase tracking-[0.1em] text-gold shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-colors hover:bg-accent"
					>
						<Share2 className="size-4" />
						{t("common_share")}
					</button>
				</div>

				{/* Select Tafsir */}
				<div className="border-t border-white/10 pt-6">
					<SelectTafsir surah={verse.surah} ayah={verse.ayah} inverse />
				</div>
			</div>

			<ShareDialog
				open={shareOpen}
				onOpenChange={setShareOpen}
				title={`${verse.surah}:${verse.ayah}`}
				text={shareText}
				url={url}
			/>
		</section>
	);
}
