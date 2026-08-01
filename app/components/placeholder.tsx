import { Construction } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Placeholder({ title, description }: { title: string; description?: string }) {
	const { t } = useI18n();
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl bg-card p-10 text-center">
			<Construction className="size-8 text-gold" strokeWidth={1.5} />
			<h1 className="font-serif text-xl font-semibold">{title}</h1>
			<p className="text-sm text-muted-foreground">{description ?? t("common_loading")}</p>
		</div>
	);
}
