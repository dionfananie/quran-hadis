import { ArrowRight, BookmarkPlus } from "lucide-react";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadingHistory } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { getSurahMeta } from "@/lib/data/quran";
import { useMounted } from "@/lib/hooks";

export function ContinueReadingCard() {
	const { t } = useI18n();
	const mounted = useMounted();
	const [history] = useReadingHistory();

	if (!mounted) {
		return <Skeleton className="h-4 w-28 rounded" />;
	}

	if (history.length === 0) return null;

	return (
		<Link
			to="/quran"
			className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-[0.05em] text-gold hover:underline"
		>
			{t("home.viewHistory")}
			<ArrowRight className="size-2.5" />
		</Link>
	);
}

const DEFAULT_READS = [
	{ surah: 18, ayah: 1, labelKey: "home.lastReadTime" as const },
	{ surah: 55, ayah: 1, labelKey: "home.yesterday" as const },
];

function RelativeTime({ readAt }: { readAt: number }) {
	const { t } = useI18n();
	const hours = (Date.now() - readAt) / 3.6e6;
	return <>{hours < 6 ? t("home.lastReadTime") : t("home.yesterday")}</>;
}

export function LastReadGrid() {
	const { t } = useI18n();
	const mounted = useMounted();
	const [history] = useReadingHistory();

	if (!mounted) {
		return <Skeleton className="h-40 w-full rounded-lg" />;
	}

	const reads = history.slice(0, 2);
	const items =
		reads.length > 0
			? reads.map((r) => ({ surah: r.surah, ayah: r.ayah, readAt: r.readAt }))
			: DEFAULT_READS;

	// Calculate progress percentage based on ayah position within surah
	const progressPct = (item: { surah: number; ayah: number }) => {
		const surah = getSurahMeta(item.surah);
		if (!surah || !surah.numberOfAyahs) return 33;
		return Math.min(85, Math.round((item.ayah / surah.numberOfAyahs) * 100));
	};

	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{items.map((item) => {
				const surah = getSurahMeta(item.surah);
				if (!surah) return null;
				const pct = progressPct(item);
				return (
					<Link
						key={`${item.surah}-${item.ayah}`}
						to={`/quran/${surah.number}/${item.ayah}`}
						className="group relative flex flex-1 flex-col overflow-clip rounded-lg border border-gold-border bg-card p-6 transition-colors hover:bg-accent"
					>
						{/* Subtle corner motif */}
						<div className="absolute right-0 top-0 size-12 rounded-tr-lg border-r-2 border-t-2 border-transparent border-t-gold/0 border-r-gold/0" />

						{/* Arabic watermark background */}
						{surah.arabic && (
							<div className="pointer-events-none absolute -right-4 -top-2 text-[100px] leading-[150px] text-teal opacity-10">
								{surah.arabic}
							</div>
						)}

						<div className="relative flex flex-col gap-4 pt-[3px]">
							{/* "LAST READ" badge */}
							<div className="w-fit rounded-sm border border-gold-border bg-gold-surface px-2 py-0.5">
								<p className="text-[10px] font-bold uppercase leading-[15px] text-gold">
									{t("home.lastRead")}:{" "}
									{"readAt" in item ? <RelativeTime readAt={item.readAt} /> : t(item.labelKey)}
								</p>
							</div>

							<div>
								<h3 className="font-serif text-2xl font-semibold tracking-[-0.48px] text-teal">
									{surah.name}
								</h3>
								<p className="text-[16px] leading-6 text-muted-foreground">
									{t("common_verse")} {item.ayah} • {surah.translation}
								</p>
							</div>

							{/* Progress bar */}
							<div className="h-1 w-full overflow-clip rounded-xl bg-[#e2e3de]">
								<div
									className="h-full rounded-xl bg-gold transition-all"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					</Link>
				);
			})}

			{/* Bookmark placeholder card */}
			<Link
				to="/quran"
				className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gold-border px-6 py-11 transition-colors hover:bg-accent"
			>
				<div className="flex size-12 items-center justify-center rounded-xl bg-gold-surface">
					<BookmarkPlus className="size-[21px] text-gold" />
				</div>
				<p className="text-xs font-bold uppercase tracking-[0.1em] text-gold">
					{t("home.addBookmark")}
				</p>
			</Link>
		</div>
	);
}
