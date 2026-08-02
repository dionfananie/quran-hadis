import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useI18n, type TKey } from "@/lib/i18n";
import { useStoredState } from "@/lib/hooks";
import { TAFSIR_STORAGE_KEY, type TafsirId } from "@/components/quran/tafsir-card";

const TAFSIRS: { id: TafsirId; nameKey: TKey; descKey: TKey }[] = [
	{ id: "kemenag", nameKey: "tafsir.kemenag", descKey: "tafsir.kemenag.desc" },
	{ id: "quraish", nameKey: "tafsir.quraish", descKey: "tafsir.quraish.desc" },
	{ id: "jalalayn", nameKey: "tafsir.jalalayn", descKey: "tafsir.jalalayn.desc" },
];

export function SelectTafsir({
	surah,
	ayah,
	inverse = false,
}: {
	surah: number;
	ayah: number;
	inverse?: boolean;
}) {
	const { t } = useI18n();
	const [, setStored] = useStoredState<TafsirId>(TAFSIR_STORAGE_KEY, "kemenag");
	const titleId = useId();

	return (
		<section aria-labelledby={titleId}>
			<h2
				id={titleId}
				className={
					inverse
						? "font-serif text-lg font-semibold text-white"
						: "font-serif text-xl font-semibold"
				}
			>
				{t("home.selectTafsir")}
			</h2>
			<div className="mt-4 grid gap-2 sm:grid-cols-3">
				{TAFSIRS.map((tf) => (
					<Link
						key={tf.id}
						to={`/quran/${surah}/${ayah}`}
						onClick={() => setStored(tf.id)}
						className={`group flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-gold/70 ${inverse
								? "border-white/15 bg-white/10 hover:bg-white/15"
								: "border-gold-border bg-card hover:bg-accent"
							}`}
					>
						<div>
							<p className={inverse ? "font-semibold text-white" : "font-semibold"}>
								{t(tf.nameKey)}
							</p>
							<p className={inverse ? "text-sm text-white/70" : "text-sm text-muted-foreground"}>
								{t(tf.descKey)}
							</p>
						</div>
						<ArrowRight
							className={`size-4 shrink-0 transition-transform group-hover:translate-x-1 ${inverse ? "text-white/60" : "text-muted-foreground"
								}`}
						/>
					</Link>
				))}
			</div>
		</section>
	);
}
