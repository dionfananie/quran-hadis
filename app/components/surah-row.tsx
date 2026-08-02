import { Link } from "react-router";
import { useI18n } from "@/lib/i18n";
import type { SurahIndexEntry } from "@/lib/data/types";

export function SurahRow({ surah }: { surah: SurahIndexEntry }) {
	const { t, lang } = useI18n();

	return (
		<Link
			to={`/quran/${surah.number}`}
			className="flex items-center gap-4 rounded-lg border border-gold-border/50 bg-card p-4 transition-colors hover:bg-accent hover:border-gold-border"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-surface font-serif text-sm font-semibold text-teal">
				{surah.number}
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate font-serif font-semibold text-teal">{surah.name}</p>
				<p className="truncate text-sm text-muted-foreground">
					{lang === "id" ? surah.translation : surah.name}
				</p>
			</div>
			<div className="flex shrink-0 flex-col items-end gap-0.5">
				{surah.arabic && (
					<p className="font-arabic text-xl leading-tight text-teal">{surah.arabic}</p>
				)}
				<p className="text-xs text-muted-foreground">
					{surah.numberOfAyahs} {t("common_verses")}
				</p>
			</div>
		</Link>
	);
}
