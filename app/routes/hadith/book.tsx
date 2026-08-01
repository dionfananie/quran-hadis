import type { Route } from "./+types/book";
import { Placeholder } from "@/components/placeholder";
import { useI18n } from "@/lib/i18n";

export function meta({ params }: Route.MetaArgs) {
	return [{ title: params.book }];
}

export default function HadithBook() {
	const { t } = useI18n();
	return <Placeholder title={t("hadith.books")} />;
}
