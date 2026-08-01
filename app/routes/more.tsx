import type { Route } from "./+types/more";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "More" }];
}

export default function More() {
	const { t } = useI18n();
	return <Placeholder title={t("nav.more")} />;
}
