import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { azkarCategories } from "@/lib/data/content";
import type { AzkarItem } from "@/lib/data/types";
import type { Route } from "./+types/prayer";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

function AzkarItemCard({ item, lang }: { item: AzkarItem; lang: string }) {
	const { t } = useI18n();
	const [count, setCount] = useState(0);
	const target = item.count;
	const done = target <= 1 || count >= target;

	return (
		<div className="rounded-lg border border-gold-border/50 bg-card p-4">
			<p className="font-arabic text-xl leading-relaxed text-teal">{item.arabic}</p>
			{item.transliteration && (
				<p className="mt-1 text-sm italic text-muted-foreground">{item.transliteration}</p>
			)}
			<p className="mt-2 text-sm leading-relaxed text-foreground">
				{lang === "id" ? item.translationId : item.translationEn}
			</p>
			{target > 1 && (
				<div className="mt-3 flex flex-wrap items-center gap-2">
					{done ? (
						<span className="inline-flex items-center gap-1.5 rounded-md bg-teal/10 px-3 py-1.5 text-sm font-semibold text-teal">
							<Check className="size-4" />
							{t("azkar.done")}
						</span>
					) : (
						<button
							type="button"
							onClick={() => setCount((c) => Math.min(c + 1, target))}
							className="inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-md bg-gold-surface px-3 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-accent70"
						>
							{t("azkar.count")}
							<span className="tabular-nums">{count}/{target}</span>
						</button>
					)}
					{count > 0 && (
						<button
							type="button"
							onClick={() => setCount(0)}
							className="inline-flex items-center gap-1.5 rounded-md border border-gold-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<RotateCcw className="size-3.5" />
							{t("azkar.reset")}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

export function meta({ }: Route.MetaArgs) {
	const title = "Azkar — Kumpulan Doa & Dzikir Harian | Moozhaf";
	const description =
		"Kumpulan dzikir dan doa harian lengkap dengan teks Arab, latin, terjemahan, dan jumlah pengulangan. Dzikir pagi dan petang, setelah shalat, sebelum tidur, dan lainnya.";
	const url = `${SITE_URL}/prayer`;

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "website" },
		{ name: "twitter:card", content: "summary" },
	];
}

export default function Azkar() {
	const { t, lang } = useI18n();

	return (
		<div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-8">
			<section className="space-y-4 text-center">
				<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal md:text-4xl">
					{t("azkar.title")}
				</h1>
				<p className="mx-auto max-w-xl text-muted-foreground">{t("azkar.subtitle")}</p>
			</section>

			<Accordion
				type="multiple"
				defaultValue={[azkarCategories[0]?.id].filter(Boolean) as string[]}
				className="rounded-xl border border-gold-border/50 bg-card px-4"
			>
				{azkarCategories.map((category) => (
					<AccordionItem key={category.id} value={category.id}>
						<AccordionTrigger className="font-serif text-lg font-semibold">
							{lang === "id" ? category.titleId : category.titleEn}
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-3">
								{category.items.map((item) => (
									<AzkarItemCard key={item.id} item={item} lang={lang} />
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}
