import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import { useEffect } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { AppShell } from "./components/app-shell";
import { I18nProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Serif:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap",
	},
	// PWA: manifest, icons, iOS meta.
	{ rel: "manifest", href: "/manifest.webmanifest" },
	{ rel: "icon", type: "image/png", href: "/icon-192.png" },
	{ rel: "apple-touch-icon", href: "/icon-192.png" },
];

const themeScript = `try{var t=localStorage.getItem("moeslem.theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
	// Daftarkan service worker (PWA) hanya di browser production.
	useEffect(() => {
		if ("serviceWorker" in navigator && import.meta.env.PROD) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				/* silent — PWA opsional */
			});
		}
	}, []);

	return (
		<html lang="id">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#004d40" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Moozhaf" />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeProvider>
					<I18nProvider>
						<AppShell>{children}</AppShell>
					</I18nProvider>
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
