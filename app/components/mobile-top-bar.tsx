import { Languages, Moon, Sun } from "lucide-react";
import { NavLink } from "react-router";
import logo from "@/assets/logo.png";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function MobileTopBar() {
	const { t, lang, setLang } = useI18n();
	const { resolved, toggle } = useTheme();

	return (
		<header className="sticky top-0 z-40 md:hidden">
			<div className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
				<div className="flex h-14 items-center justify-between px-4">
					<NavLink to="/" className="flex items-center gap-2">
						<img src={logo} alt="" className="size-6 rounded-full object-cover" />
						<span className="font-serif text-lg font-semibold tracking-tight">
							{t("appName")}
						</span>
					</NavLink>
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
							className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
