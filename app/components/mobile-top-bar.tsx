import { useEffect, useState } from "react";
import { Languages, Moon, Sun, User } from "lucide-react";
import { NavLink } from "react-router";
import logo from "@/assets/logo.png";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
						<UserAvatarNav />
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

// Avatar menu user → link ke /user-profile.
function UserAvatarNav() {
	const [avatar, setAvatar] = useState<string | null>(undefined as unknown as string | null);

	useEffect(() => {
		let alive = true;
		fetch("/api/auth/me")
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((d) => {
				const u = (d as { user?: { avatar_url?: string | null } | undefined }).user;
				if (!alive) return;
				setAvatar(u?.avatar_url || "");
			})
			.catch(() => alive && setAvatar(""));
		return () => {
			alive = false;
		};
	}, []);

	return (
		<NavLink
			to="/user-profile"
			title="Profil"
			aria-label="Profil"
			className="rounded-full p-1 transition-colors hover:bg-accent"
		>
			<Avatar className="size-7">
				{avatar ? <AvatarImage src={avatar} alt="Profil" /> : <AvatarFallback className="text-xs"><User className="size-4" /></AvatarFallback>}
			</Avatar>
		</NavLink>
	);
}
