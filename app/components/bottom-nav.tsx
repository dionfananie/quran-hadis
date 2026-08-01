import { BookOpen, CalendarClock, Home, MoreHorizontal, ScrollText, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { useI18n, type TKey } from "@/lib/i18n";

interface NavItem {
	to: string;
	labelKey: TKey;
	icon: LucideIcon;
	end?: boolean;
}

const items: NavItem[] = [
	{ to: "/", labelKey: "nav.home", icon: Home, end: true },
	{ to: "/quran", labelKey: "nav.quran", icon: BookOpen },
	{ to: "/hadith", labelKey: "nav.hadith", icon: ScrollText },
	{ to: "/prayer-times", labelKey: "nav.prayers", icon: CalendarClock },
	{ to: "/more", labelKey: "nav.more", icon: MoreHorizontal },
];

export function BottomNav() {
	const { t } = useI18n();

	return (
		<nav
			className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] md:hidden"
			aria-label="Primary"
		>
			<div className="mx-auto max-w-md px-4 pb-4">
				<div className="flex items-center justify-between rounded-full border border-border/60 bg-background/70 px-2 py-2 shadow-[0_8px_40px_rgba(26,28,25,0.04)] backdrop-blur-xl dark:bg-background/60">
					{items.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className="flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
						>
							<item.icon className="size-5" strokeWidth={1.75} />
							<span>{t(item.labelKey)}</span>
						</NavLink>
					))}
				</div>
			</div>
		</nav>
	);
}
