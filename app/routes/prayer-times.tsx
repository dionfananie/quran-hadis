import type { Route } from "./+types/prayer-times";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Jadwal Shalat | Moozhaf" }];
}

export default function PrayerTimes() {
	const { t } = useI18n();
	return <Placeholder title={t("nav.prayers")} description={t("common_comingSoon")} />;
}
