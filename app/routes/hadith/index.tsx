import type { Route } from "./+types/index";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Hadith" }];
}

export default function HadithIndex() {
	const { t } = useI18n();
	return <Placeholder title={t("hadith.title")} description={t("hadith.subtitle")} />;
}
