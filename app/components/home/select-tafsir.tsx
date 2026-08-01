import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useI18n, type TKey } from "@/lib/i18n";

const TAFSIRS: { id: string; nameKey: TKey; descKey: TKey }[] = [
	{ id: "jalalayn", nameKey: "tafsir.jalalayn", descKey: "tafsir.jalalayn.desc" },
	{ id: "ibn-kathir", nameKey: "tafsir.ibnKathir", descKey: "tafsir.ibnKathir.desc" },
	{ id: "al-muntakhab", nameKey: "tafsir.alMuntakhab", descKey: "tafsir.alMuntakhab.desc" },
	{ id: "al-muyassar", nameKey: "tafsir.alMuyassar", descKey: "tafsir.alMuyassar.desc" },
];

export function SelectTafsir({ surah, ayah }: { surah: number; ayah: number }) {
	const { t } = useI18n();

	return (
		<section aria-label={t("home.selectTafsir")}>
			<h2 className="font-serif text-xl font-semibold">{t("home.selectTafsir")}</h2>
			<div className="mt-4 grid gap-2 sm:grid-cols-2">
				{TAFSIRS.map((tf) => (
					<Link
						key={tf.id}
						to={`/quran/${surah}/${ayah}`}
						className="group flex items-center justify-between gap-3 rounded-lg border border-gold-border bg-card p-4 transition-colors hover:bg-accent"
					>
						<div>
							<p className="font-semibold">{t(tf.nameKey)}</p>
							<p className="text-sm text-muted-foreground">{t(tf.descKey)}</p>
						</div>
						<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
					</Link>
				))}
			</div>
		</section>
	);
}
