import { SurahIndex } from "@/components/surah-index";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
	const title = "Al-Qur'an Lengkap 114 Surah — Baca, Tafsir & Audio | Moozhaf";
	const description =
		"Baca Al-Qur'an 30 Juz lengkap 114 surah dengan terjemahan bahasa Indonesia, tafsir Kemenag, dan audio murottal. Gratis, tanpa aplikasi.";
	const url = `${SITE_URL}/quran`;

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

export default function QuranIndex() {
	const { t } = useI18n();

	return (
		<div className="space-y-6 pt-4 md:pt-8">
			<section className="text-center">
				<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal md:text-4xl">
					{t("nav.quran")}
				</h1>
				<p className="mt-2 text-muted-foreground">
					{t("home.heroSubtitle")}
				</p>
			</section>
			<SurahIndex viewAll={false} />
		</div>
	);
}
