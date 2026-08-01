import { Languages, Moon, Sun } from "lucide-react";
import { NavLink } from "react-router";
import { useI18n, type TKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const items: { to: string; labelKey: TKey; end?: boolean }[] = [
	{ to: "/", labelKey: "nav.home", end: true },
	{ to: "/quran", labelKey: "nav.quran" },
	{ to: "/hadith", labelKey: "nav.hadith" },
	{ to: "/prayer", labelKey: "nav.prayers" },
	{ to: "/more", labelKey: "nav.more" },
];

export function TopNav() {
	const { t, lang, setLang } = useI18n();
	const { resolved, toggle } = useTheme();

	return (
		<header className="sticky top-0 z-40 hidden md:block">
			<div className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
					<NavLink to="/" className="font-serif text-xl font-semibold tracking-tight text-foreground">
						{t("appName")}
					</NavLink>

					<nav className="flex items-center gap-1" aria-label="Primary">
						{items.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.end}
								className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
							>
								{t(item.labelKey)}
							</NavLink>
						))}
					</nav>

					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={toggle}
							className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							aria-label="Toggle theme"
						>
							{resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
						</button>
						<button
							type="button"
							onClick={() => setLang(lang === "en" ? "id" : "en")}
							className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							aria-label="Toggle language"
						>
							<Languages className="size-4" />
							{lang === "en" ? "ID" : "EN"}
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
