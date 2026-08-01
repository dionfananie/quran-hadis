import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { surahIndex } from "@/lib/data/quran";
import { searchQuran, type Relevance, type SearchType, type VectorSearchResult } from "@/lib/vector-search";
import { useI18n, type TKey } from "@/lib/i18n";

const MIN_QUERY_LENGTH = 2;

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

function AiResultItem({
	result,
	match,
	onSelect,
}: {
	result: VectorSearchResult;
	match: string;
	onSelect: () => void;
}) {
	const { t } = useI18n();
	return (
		<CommandItem
			value={`${match} ai-${result.type}-${result.href}-${result.title}`}
			onSelect={onSelect}
			className="items-start gap-3"
		>
			<span className="mt-1 shrink-0 rounded-md bg-gold-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
				{t(TYPE_LABELS[result.type])}
			</span>
			<span className="flex-1 space-y-1">
				<span className="flex items-center gap-2">
					<span className="truncate font-medium text-foreground">{result.title}</span>
					<span className="shrink-0 text-[10px] font-medium text-gold">
						{t(relevanceLabel(result.relevance))}
					</span>
				</span>
				{result.arabic && (
					<span className="block font-arabic text-lg leading-relaxed text-teal">{result.arabic}</span>
				)}
				<span className="block text-sm text-muted-foreground">{result.text}</span>
			</span>
		</CommandItem>
	);
}

export function SearchDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t, lang } = useI18n();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [aiResults, setAiResults] = useState<VectorSearchResult[]>([]);
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState(false);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, onOpenChange]);

	useEffect(() => {
		if (!open) {
			setQuery("");
			setAiResults([]);
			setAiLoading(false);
			setAiError(false);
			return;
		}
	}, [open]);

	useEffect(() => {
		const q = query.trim();
		if (q.length < MIN_QUERY_LENGTH) {
			setAiResults([]);
			setAiError(false);
			setAiLoading(false);
			return;
		}

		let cancelled = false;
		const timer = setTimeout(() => {
			setAiLoading(true);
			setAiError(false);
			searchQuran(q)
				.then((results) => {
					if (cancelled) return;
					setAiResults(results);
				})
				.catch(() => {
					if (cancelled) return;
					setAiError(true);
					setAiResults([]);
				})
				.finally(() => {
					if (!cancelled) setAiLoading(false);
				});
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	const go = (href: string) => {
		onOpenChange(false);
		navigate(href);
	};

	const showAi = query.trim().length >= MIN_QUERY_LENGTH;

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title={t("search.title")}
			description={t("common_searchShortcut")}
		>
			<CommandInput
				placeholder={t("search.placeholder")}
				value={query}
				onValueChange={setQuery}
				autoFocus
			/>
			<CommandList>
				{showAi && (
					<CommandGroup heading={t("search.aiResults")} forceMount>
						{aiLoading ? (
							<CommandItem value={`${query.trim()} ai-loading`} disabled>
								<Sparkles className="size-4 animate-pulse text-gold" />
								{t("common_loading")}
							</CommandItem>
						) : aiError ? (
							<CommandItem value={`${query.trim()} ai-error`} disabled>
								<span className="text-muted-foreground">{t("common_error")}</span>
							</CommandItem>
						) : aiResults.length > 0 ? (
							<>
								{aiResults.map((result) => (
									<AiResultItem
										key={`${result.type}-${result.href}-${result.title}`}
										result={result}
										match={query.trim()}
										onSelect={() => go(result.href)}
									/>
								))}
								<CommandItem
									value={`${query.trim()} ai-more`}
									onSelect={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
								>
									<span className="flex-1 text-muted-foreground">{t("common_viewAll")}</span>
									<ArrowRight className="size-4" />
								</CommandItem>
							</>
						) : (
							!aiLoading && (
								<CommandItem value={`${query.trim()} ai-empty`} disabled>
									<span className="text-muted-foreground">{t("common_notFound")}</span>
								</CommandItem>
							)
						)}
					</CommandGroup>
				)}

				<CommandGroup heading={t("nav.quran")}>
					{surahIndex.map((s) => (
						<CommandItem
							key={s.number}
							value={`${s.number} ${s.name} ${s.translation} ${s.arabic ?? ""}`}
							onSelect={() => go(`/quran/${s.number}`)}
						>
							<span className="font-serif text-xs font-semibold text-primary">{s.number}</span>
							<span className="flex-1 truncate">{lang === "id" ? s.translation : s.name}</span>
							{s.arabic && <span className="font-arabic text-lg text-primary">{s.arabic}</span>}
						</CommandItem>
					))}
				</CommandGroup>

				<CommandEmpty>{t("common_notFound")}</CommandEmpty>
			</CommandList>
		</CommandDialog>
	);
}
