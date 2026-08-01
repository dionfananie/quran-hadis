import type { Route } from "./+types/asmaul-husna";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Asmaul Husna" }];
}

export default function AsmaulHusna() {
	const { t } = useI18n();
	return <Placeholder title={t("asmaulHusna.title")} description={t("asmaulHusna.subtitle")} />;
}
