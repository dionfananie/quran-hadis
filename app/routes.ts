import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("quran", "routes/quran/index.tsx"),
	route("quran/:number", "routes/quran/surah.tsx"),
	route("quran/:number/:ayah", "routes/quran/ayah.tsx"),
	route("hadith", "routes/hadith/index.tsx"),
	route("hadith/:book", "routes/hadith/book.tsx"),
	route("hadith/:book/:number", "routes/hadith/hadith.tsx"),
	route("prayer-times", "routes/prayer-times.tsx"),
	route("search", "routes/search.tsx"),
	route("asmaul-husna", "routes/asmaul-husna.tsx"),
	route("azkar", "routes/azkar.tsx"),
	route("more", "routes/more.tsx"),
	route("settings", "routes/settings.tsx"),
	route("sitemap.xml", "routes/sitemap.tsx"),
] satisfies RouteConfig;
