import type { Route } from "./+types/hadith";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({ params }: Route.MetaArgs) {
	return [{ title: `Hadith ${params.number}` }];
}

export default function HadithDetail() {
	const { t } = useI18n();
	return <Placeholder title={t("nav.hadith")} />;
}
