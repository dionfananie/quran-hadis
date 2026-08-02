import { Link } from "react-router";
import { ChevronRight, ScrollText } from "lucide-react";
import type { Route } from "./+types/index";
import { getHadithBooks } from "@/lib/data/hadith";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export function meta({ }: Route.MetaArgs) {
	const title = "Koleksi Hadits Shahih — Shahih Bukhari, Muslim & Lainnya | Moozhaf";
	const description =
		"Baca kumpulan hadits shahih dari Shahih Bukhari, Shahih Muslim, Sunan Abu Daud, dan kitab-kitab hadits lainnya lengkap dengan teks Arab dan terjemahan bahasa Indonesia.";
	const url = `${SITE_URL}/hadith`;

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

export default function HadithIndex() {
	const { t, lang } = useI18n();
	const books = getHadithBooks();

	return (
		<div className="space-y-6 pt-4 md:pt-8">
			<section className="text-center">
				<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal md:text-4xl">
					{t("hadith.title")}
				</h1>
				<p className="mt-2 text-muted-foreground">{t("hadith.subtitle")}</p>
			</section>

			<section aria-label={t("hadith.books")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{books.map((book) => (
					<Link
						key={book.id}
						to={`/hadith/${book.id}`}
						className="group flex items-center gap-4 rounded-xl border border-gold-border/50 bg-card p-5 transition-colors hover:border-gold-border hover:bg-accent"
					>
						<span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gold-surface text-teal">
							<ScrollText className="size-5" strokeWidth={1.75} />
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate font-serif font-semibold text-teal">
								{lang === "id" ? book.nameId : book.nameEn}
							</p>
							<p className="text-sm text-muted-foreground">
								{book.total.toLocaleString(lang === "id" ? "id-ID" : "en-US")} {t("hadith.hadiths")}
							</p>
						</div>
						<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</Link>
				))}
			</section>
		</div>
	);
}
