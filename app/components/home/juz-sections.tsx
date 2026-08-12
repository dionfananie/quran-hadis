import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import juzData from "@/data/juz.json";
import { getSurahMeta } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";

type JuzMeta = {
	juz: number;
	start: { surah: number; ayah: number };
	end: { surah: number; ayah: number };
};

const juzList = juzData as unknown as JuzMeta[];

function surahName(n: number, lang: "id" | "en"): string {
	const meta = getSurahMeta(n);
	if (!meta) return `Surah ${n}`;
	return lang === "id" ? meta.name : meta.translation;
}

function rangeLabel(m: JuzMeta): string {
	return `${m.start.surah}:${m.start.ayah} – ${m.end.surah}:${m.end.ayah}`;
}

function JuzCard({ juz }: { juz: JuzMeta }) {
	const { t, lang } = useI18n();
	return (
		<Link
			to={`/quran/juz/${juz.juz}`}
			className="group flex flex-col gap-3 rounded-xl border border-gold-border/50 bg-card p-5 transition-colors hover:bg-accent hover:border-gold-border"
		>
			<div className="flex items-start justify-between">
				<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-surface font-serif text-lg font-semibold text-teal">
					{juz.juz}
				</span>
				<ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-gold" />
			</div>
			<div>
				<p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gold">{t("home.juz")}</p>
				<p className="mt-0.5 font-serif text-lg font-semibold leading-tight text-teal">
					{surahName(juz.start.surah, lang)}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">{rangeLabel(juz)}</p>
			</div>
		</Link>
	);
}

export function JuzQuickRead() {
	const { t } = useI18n();
	const quick = juzList.filter((j) => j.juz >= 1 && j.juz <= 3);
	return (
		<section aria-label={t("home.quickRead")} className="space-y-6">
			<div className="flex items-end justify-between border-b border-gold-border pb-4">
				<div>
					<h2 className="font-serif text-2xl font-semibold tracking-[-0.48px] text-teal">
						{t("home.quickRead")}
					</h2>
					<p className="mt-1 text-[16px] leading-6 text-muted-foreground opacity-70">
						{t("home.quickReadDesc")}
					</p>
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				{quick.map((j) => (
					<JuzCard key={j.juz} juz={j} />
				))}
			</div>
		</section>
	);
}

export function JuzAllSection() {
	const { t } = useI18n();
	return (
		<section aria-label={t("home.allJuz")} className="space-y-6">
			<div className="flex items-end justify-between border-b border-gold-border pb-4">
				<div>
					<h2 className="font-serif text-2xl font-semibold tracking-[-0.48px] text-teal">
						{t("home.allJuz")}
					</h2>
					<p className="mt-1 text-[16px] leading-6 text-muted-foreground opacity-70">
						{t("home.allJuzDesc")}
					</p>
				</div>
			</div>
			<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{juzList.map((j) => (
					<JuzCard key={j.juz} juz={j} />
				))}
			</div>
		</section>
	);
}
