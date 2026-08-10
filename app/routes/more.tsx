import type { Route } from "./+types/more";
import { Link } from "react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Lainnya | Moozhaf" }];
}

export default function More() {
	const { t } = useI18n();
	return (
		<div className="mx-auto max-w-2xl space-y-6 p-4">
			<h1 className="font-serif text-2xl font-semibold">{t("nav.more")}</h1>

			<div className="grid gap-3">
				<Link
					to="/odoj"
					className="group flex items-center justify-between rounded-xl border border-gold-border bg-card p-4 transition-colors hover:bg-accent"
				>
					<div className="flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-lg bg-gold-surface text-teal">
							<BookOpen className="size-5" />
						</span>
						<div>
							<p className="font-semibold">One Day One Juz</p>
							<p className="text-sm text-muted-foreground">
								Kelola penugasan juz & pantau hafalan
							</p>
						</div>
					</div>
					<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
				</Link>
			</div>
		</div>
	);
}
