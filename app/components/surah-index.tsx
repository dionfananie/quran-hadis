import { useState, type ReactNode } from "react";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { Link } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurahRow } from "./surah-row";
import { surahIndex } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Filter = "all" | "meccan" | "medinan";
type View = "grid" | "list";

export function SurahIndex({
	limit,
	interstitial,
	afterLimit,
	viewAll = true,
}: {
	limit?: number;
	interstitial?: ReactNode;
	afterLimit?: number;
	viewAll?: boolean;
}) {
	const { t } = useI18n();
	const [filter, setFilter] = useState<Filter>("all");
	const [view, setView] = useState<View>("list");

	const filtered = surahIndex.filter((s) => {
		if (filter === "all") return true;
		return filter === "meccan" ? s.revelation === "Makkiyah" : s.revelation === "Madaniyah";
	});
	const first = limit ? filtered.slice(0, limit) : filtered;
	const rest = limit ? filtered.slice(limit, limit + (afterLimit ?? Infinity)) : [];
	const shown = first.length + rest.length;
	const hasMore = viewAll && shown < filtered.length;

	return (
		<section aria-label={t("home.surahIndex")}>
			<div className="flex items-center justify-between">
				<h2 className="font-serif text-2xl font-semibold tracking-[-0.48px] text-teal">
					{t("home.surahIndex")}
				</h2>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setView("grid")}
						className={cn(
							"rounded-lg p-2 transition-colors",
							view === "grid" ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground",
						)}
						aria-label={t("home.grid")}
					>
						<LayoutGrid className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => setView("list")}
						className={cn(
							"rounded-lg p-2 transition-colors",
							view === "list" ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground",
						)}
						aria-label={t("home.list")}
					>
						<List className="size-4" />
					</button>
				</div>
			</div>

			<Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mt-4">
				<TabsList>
					<TabsTrigger value="all">{t("home.all")}</TabsTrigger>
					<TabsTrigger value="meccan">{t("home.meccan")}</TabsTrigger>
					<TabsTrigger value="medinan">{t("home.medinan")}</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className={cn("mt-4 grid gap-2", view === "grid" && "sm:grid-cols-2")}>
				{first.map((s) => (
					<SurahRow key={s.number} surah={s} />
				))}
			</div>

			{interstitial}

			{rest.length > 0 && (
				<div className={cn("mt-2 grid gap-2", view === "grid" && "sm:grid-cols-2")}>
					{rest.map((s) => (
						<SurahRow key={s.number} surah={s} />
					))}
				</div>
			)}

			{hasMore && (
				<Link
					to="/quran"
					className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.05em] text-gold hover:underline"
				>
					{t("common_viewAll")}
					<ChevronRight className="size-4" />
				</Link>
			)}
		</section>
	);
}
