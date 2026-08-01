import type { Route } from "./+types/settings";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Settings" }];
}

export default function Settings() {
	const { t } = useI18n();
	return <Placeholder title={t("settings.title")} />;
}
