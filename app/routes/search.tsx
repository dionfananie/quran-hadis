import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronRight, ArrowRight, Search, Sparkles } from "lucide-react";
import type { Route } from "./+types/search";
import { searchQuran, type Relevance, type SearchType, type VectorSearchResult } from "@/lib/vector-search";
import { useI18n, type TKey } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const TABS: Array<{ value: "all" | SearchType; labelKey: TKey }> = [
	{ value: "all", labelKey: "search.type.all" },
	{ value: "ayat", labelKey: "search.type.ayat" },
	{ value: "tafsir", labelKey: "search.type.tafsir" },
	{ value: "surat", labelKey: "search.type.surat" },
	{ value: "doa", labelKey: "search.type.doa" },
];

const TYPE_LABELS: Record<SearchType, TKey> = {
	surat: "search.type.surat",
	ayat: "search.type.ayat",
	tafsir: "search.type.tafsir",
	doa: "search.type.doa",
};

function relevanceLabel(relevance: Relevance): TKey {
	if (relevance === "tinggi") return "search.relevance.high";
	if (relevance === "sedang") return "search.relevance.medium";
	return "search.relevance.low";
}

function relevanceClass(relevance: Relevance): string {
	if (relevance === "tinggi") return "bg-teal/10 text-teal";
	if (relevance === "sedang") return "bg-gold/10 text-gold";
	return "bg-muted text-muted-foreground";
}

function ResultCard({ result }: { result: VectorSearchResult }) {
	const { t } = useI18n();
	return (
		<Link
			to={result.href}
			className="group block rounded-xl border border-gold-border/50 bg-card p-5 transition-colors hover:border-gold-border hover:bg-accent"
		>
			<div className="flex items-start gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<span className="rounded-md bg-gold-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
							{t(TYPE_LABELS[result.type])}
						</span>
						<span className="truncate font-serif font-semibold text-teal">{result.title}</span>
						<span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", relevanceClass(result.relevance))}>
							{t(relevanceLabel(result.relevance))}
						</span>
					</div>
					{result.arabic && (
						<p className="font-arabic text-xl leading-relaxed text-teal">{result.arabic}</p>
					)}
					<p className="text-sm leading-relaxed text-muted-foreground">{result.text}</p>
				</div>
				<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
			</div>
		</Link>
	);
}

export function meta({ data }: Route.MetaArgs) {
	const q = data?.q;
	const title = q
		? `Pencarian AI: "${q}" — Al-Qur'an | Moozhaf`
		: "Pencarian AI Al-Qur'an — Pahami Makna, Bukan Sekadar Kata | Moozhaf";
	const description =
		"Cari ayat, tafsir, dan doa dengan bahasa sehari-hari. Pencarian AI yang memahami makna dan konteks Al-Qur'an.";
	const url = `${SITE_URL}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "website" },
		{ name: "twitter:card", content: "summary" },
	];
}

export function loader({ request }: Route.LoaderArgs) {
	const q = new URL(request.url).searchParams.get("q") ?? "";
	return { q };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
	const { t } = useI18n();
	const [searchParams, setSearchParams] = useSearchParams();
	const q = searchParams.get("q") ?? "";

	const [input, setInput] = useState(q);
	const [tab, setTab] = useState<"all" | SearchType>("all");
	const [results, setResults] = useState<VectorSearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		const next = input.trim();
		if (!next) return;
		setSearchParams({ q: next }, { replace: true });
	};

	useEffect(() => {
		const query = q.trim();
		if (query.length < MIN_QUERY_LENGTH) {
			setResults([]);
			setError(false);
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(false);

		const types: SearchType[] | undefined =
			tab === "all" ? undefined : [tab];

		searchQuran(query, { types })
			.then((r) => {
				if (cancelled) return;
				setResults(r);
			})
			.catch(() => {
				if (cancelled) return;
				setError(true);
				setResults([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [q, tab, retryKey]);

	const hasQuery = q.trim().length >= MIN_QUERY_LENGTH;

	return (
		<div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link to="/" className="hover:text-foreground">
					Moozhaf
				</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal">{t("search.title")}</span>
			</nav>

			<section className="space-y-4 text-center">
				<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal md:text-4xl">
					{t("search.title")}
				</h1>
				<p className="mx-auto max-w-xl text-muted-foreground">{t("search.subtitle")}</p>

				<form onSubmit={submit} className="relative mx-auto mt-2 max-w-xl">
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-teal/5 blur-[20px]" />
					<div className="relative flex items-center gap-3 rounded-lg border border-gold-border bg-card px-5 py-3.5 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
						<Sparkles className="size-[18px] shrink-0 text-gold" />
						<input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={t("search.placeholder")}
							className="w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/40"
						/>
						<button
							type="submit"
							className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							<Search className="size-4" />
							{t("common_search")}
						</button>
					</div>
				</form>
				<p className="text-xs text-muted-foreground">{t("search.semanticHint")}</p>
			</section>

			{!hasQuery ? (
				<div className="rounded-2xl border border-gold-border/50 bg-card p-10 text-center text-muted-foreground">
					{t("search.enterQuery")}
				</div>
			) : (
				<>
					{/* Type tabs */}
					<div className="flex flex-wrap justify-center gap-2">
						{TABS.map((item) => (
							<button
								key={item.value}
								type="button"
								onClick={() => setTab(item.value)}
								className={cn(
									"rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
									tab === item.value
										? "bg-teal text-white"
										: "bg-gold-surface text-muted-foreground hover:text-foreground",
								)}
							>
								{t(item.labelKey)}
							</button>
						))}
					</div>

					{loading ? (
						<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
							<div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
							<p className="text-sm text-muted-foreground">{t("common_loading")}</p>
						</div>
					) : error ? (
						<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
							<p className="text-muted-foreground">{t("common_error")}</p>
							<button
								type="button"
								onClick={() => setRetryKey((v) => v + 1)}
								className="mt-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white"
							>
								{t("common_continue")}
							</button>
						</div>
					) : results.length === 0 ? (
						<div className="rounded-2xl border border-gold-border/50 bg-card p-10 text-center text-muted-foreground">
							{t("search.emptyResults").replace("{q}", q)}
						</div>
					) : (
						<div className="space-y-3">
							{results.map((result) => (
								<ResultCard key={`${result.type}-${result.href}-${result.title}`} result={result} />
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
