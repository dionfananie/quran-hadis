import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { InstallAppBanner } from "./install-app-banner";
import { MobileTopBar } from "./mobile-top-bar";
import { TopNav } from "./top-nav";
import { useI18n } from "@/lib/i18n";

function Footer() {
	const { t } = useI18n();
	return (
		<footer className="pb-28 md:pb-10 mt-4">
			<div className="mx-auto max-w-6xl px-4 md:px-8">
				<div className="rounded-2xl bg-surface-low px-6 py-6 text-center dark:bg-surface">
					<p className="font-serif text-lg font-semibold">{t("appName")}</p>
					<p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
						© {new Date().getFullYear()} Moozhaf
					</p>
				</div>
			</div>
		</footer>
	);
}

export function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col">
			<TopNav />
			<MobileTopBar />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 md:px-8 md:pt-12">
				{children}
			</main>
			<Footer />
			<InstallAppBanner />
			<BottomNav />
		</div>
	);
}
