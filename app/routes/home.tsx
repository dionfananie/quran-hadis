import { useState } from "react";
import { Search } from "lucide-react";
import type { Route } from "./+types/home";
import { SurahIndex } from "@/components/surah-index";
import { SearchDialog } from "@/components/search-dialog";
import { ContinueReadingCard, LastReadGrid } from "@/components/home/last-read-card";
import { DailyVerseCard } from "@/components/home/daily-verse-card";
import { PrayerMarquee } from "@/components/home/prayer-marquee";
import { getDailyVerse } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export const links: Route.LinksFunction = () => [
	{ rel: "canonical", href: `${SITE_URL}/` },
];

export function meta({}: Route.MetaArgs) {
	const title = "Moozhaf — Baca Al-Qur'an, Hadits & Jadwal Shalat Online";
	const description =
		"Baca Al-Qur'an lengkap dengan terjemahan dan tafsir Kemenag, kumpulan hadits shahih, jadwal shalat, Asmaul Husna, dan azkar harian. Gratis, tanpa aplikasi.";
	const url = `${SITE_URL}/`;

	return [
		{ title },
		{ name: "description", content: description },

		{ property: "og:site_name", content: "Moozhaf" },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:image", content: `${SITE_URL}/og-image.svg` },
		{ property: "og:locale", content: "id_ID" },
		{ property: "og:locale:alternate", content: "en_US" },

		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: `${SITE_URL}/og-image.svg` },

		{
			"script:ld+json": {
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "Moozhaf",
				alternateName: "Moozhaf",
				url: SITE_URL,
				inLanguage: ["id", "en"],
				description,
				publisher: {
					"@type": "Organization",
					name: "Moozhaf",
				},
				potentialAction: {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: `${SITE_URL}/?q={search_term_string}`,
					},
					"query-input": "required name=search_term_string",
				},
			},
		},
	];
}

export function loader({}: Route.LoaderArgs) {
	const day = new Date().getDate();
	return {
		daily: getDailyVerse(day - 1),
	};
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { t } = useI18n();
	const [searchOpen, setSearchOpen] = useState(false);
	const { daily } = loaderData;

	return (
		<div className="space-y-10 pt-4 md:pt-8">
			{/* Hero & Search — Figma "Hero & Search Section" */}
			<section className="flex flex-col items-center justify-center py-12">
				<div className="flex w-full max-w-2xl flex-col gap-6 px-6 pt-6">
					<div className="flex flex-col items-center gap-[11px] pt-[5px]">
						<p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-gold">
							{t("home.heroTitle")}
						</p>
						<h1 className="font-serif text-4xl font-normal tracking-[-1px] text-teal md:text-[40px] md:leading-[60px]">
							{t("home.heroSubtitle")}
						</h1>
					</div>

					{/* Decorative gold line */}
					<div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />

					{/* Premium search bar */}
					<div className="relative">
						<div className="pointer-events-none absolute inset-0 rounded-lg bg-teal/5 blur-[20px]" />
						<button
							type="button"
							onClick={() => setSearchOpen(true)}
							className="relative flex w-full items-center gap-3 rounded-lg border border-gold-border bg-card px-6 py-4 text-left shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-colors hover:bg-accent"
						>
							<Search className="size-[18px] shrink-0 text-muted-foreground" />
							<span className="flex-1 text-[16px] text-muted-foreground/40">
								{t("home.searchPlaceholder")}
							</span>
							<kbd className="hidden items-center gap-1 rounded-sm border border-gold-border bg-gold-surface px-1.5 py-0.5 text-[10px] text-gold/80 sm:flex">
								⌘K
							</kbd>
						</button>
					</div>
				</div>
			</section>

			{/* Continue Reading — Figma "Recent Reads Section" */}
			<section className="space-y-6">
				<div className="flex items-end justify-between border-b border-gold-border pb-4">
					<div>
						<h2 className="font-serif text-2xl font-semibold tracking-[-0.48px] text-teal">
							{t("home.continueReading")}
						</h2>
						<p className="mt-1 text-[16px] leading-6 text-muted-foreground opacity-70">
							{t("home.continueQuote")}
						</p>
					</div>
					<ContinueReadingCard />
				</div>
				<LastReadGrid />
			</section>

			<PrayerMarquee />

			<SurahIndex
				limit={3}
				afterLimit={6}
				interstitial={
					<div className="py-2">
						<DailyVerseCard verse={daily} />
					</div>
				}
			/>

			<SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
		</div>
	);
}
