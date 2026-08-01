import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "moeslem.theme";

function systemPrefersDark(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}

function initialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return systemPrefersDark() ? "dark" : "light";
}

const ThemeContext = createContext<{
	theme: Theme;
	resolved: Theme;
	setTheme: (theme: Theme) => void;
	toggle: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("light");
	const [resolved, setResolved] = useState<Theme>("light");

	useEffect(() => {
		const initial = initialTheme();
		setThemeState(initial);
		setResolved(initial);
		applyTheme(initial);
	}, []);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		setResolved(next);
		applyTheme(next);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, next);
		}
	}, []);

	const toggle = useCallback(() => {
		setTheme(resolved === "dark" ? "light" : "dark");
	}, [resolved, setTheme]);

	const value = useMemo(
		() => ({ theme, resolved, setTheme, toggle }),
		[theme, resolved, setTheme, toggle],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
