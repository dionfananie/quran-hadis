import type { Route } from "./+types/azkar";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Azkar" }];
}

export default function Azkar() {
	const { t } = useI18n();
	return <Placeholder title={t("azkar.title")} description={t("azkar.subtitle")} />;
}
