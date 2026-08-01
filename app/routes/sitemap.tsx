import type { Route } from "./+types/sitemap";
import { SITE_URL } from "@/lib/seo";

export function loader({}: Route.LoaderArgs) {
	const paths = [
		"/",
		"/quran",
		"/hadith",
		"/prayer-times",
		"/asmaul-husna",
		"/prayer",
		"/settings",
	];

	const urls = paths
		.map(
			(path) =>
				`<url><loc>${SITE_URL}${path}</loc><changefreq>weekly</changefreq></url>`,
		)
		.join("");

	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
}
