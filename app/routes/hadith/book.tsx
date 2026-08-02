import { Link } from "react-router";
import { ArrowLeft, ArrowRight, ChevronRight, CornerDownLeft } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/book";
import { findHadithChunk, getHadithBook, getHadithChunk } from "@/lib/data/hadith";
import type { Hadith } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

const PAGE_SIZE = 20;

export function meta({ params, data }: Route.MetaArgs) {
	const book = data?.book;
	if (!book) return [{ title: "Hadith" }];
	const title = `${book.nameId} — Kumpulan Hadits | Moozhaf`;
	const description = `Baca kumpulan hadits ${book.nameId} (${book.nameEn}) lengkap dengan teks Arab dan terjemahan bahasa Indonesia. Total ${book.total.toLocaleString("id-ID")} hadits.`;
	const url = `${SITE_URL}/hadith/${params.book}`;

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: "article" },
		{ name: "twitter:card", content: "summary" },
	];
}

export function loader({ params }: Route.LoaderArgs) {
	const book = getHadithBook(params.book);
	if (!book) throw new Response("Kitab tidak ditemukan", { status: 404 });
	return { book };
}

export default function HadithBook({ loaderData }: Route.ComponentProps) {
	const { t, lang } = useI18n();
	const { book } = loaderData;
	const [page, setPage] = useState(0);
	const [items, setItems] = useState<Hadith[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [jump, setJump] = useState("");

	const start = page * PAGE_SIZE + 1;
	const end = Math.min(start + PAGE_SIZE - 1, book.total);
	const pageCount = Math.ceil(book.total / PAGE_SIZE);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		const chunk = findHadithChunk(book, start);
		if (!chunk) {
			setItems([]);
			setLoading(false);
			return;
		}

		getHadithChunk(book.id, chunk.file)
			.then((list) => {
				if (cancelled) return;
				setItems(list.filter((h) => h.number >= start && h.number <= end));
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [book, start, end]);

	const goToNumber = (n: number) => {
		const clamped = Math.min(Math.max(1, n), book.total);
		setPage(Math.floor((clamped - 1) / PAGE_SIZE));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const submitJump = (e: FormEvent) => {
		e.preventDefault();
		const n = Number(jump);
		if (!n || n < 1) return;
		goToNumber(n);
		setJump("");
	};

	const locale = lang === "id" ? "id-ID" : "en-US";

	return (
		<div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link to="/" className="hover:text-foreground">
					Moozhaf
				</Link>
				<ChevronRight className="size-3" />
				<Link to="/hadith" className="hover:text-foreground">
					{t("nav.hadith")}
				</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal">{lang === "id" ? book.nameId : book.nameEn}</span>
			</nav>

			{/* Book header */}
			<div className="rounded-2xl border border-gold-border bg-card p-8">
				<div className="flex flex-col items-center gap-4 text-center">
					<div>
						<h1 className="font-serif text-3xl font-semibold tracking-[-0.48px] text-teal">
							{lang === "id" ? book.nameId : book.nameEn}
						</h1>
						<p className="mt-1 text-muted-foreground">
							{book.total.toLocaleString(locale)} {t("hadith.hadiths")}
						</p>
					</div>
				</div>
			</div>

			{/* Toolbar */}
			<div className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={() => goToNumber(start - PAGE_SIZE)}
						disabled={page === 0}
						className="inline-flex items-center gap-1.5 rounded-lg border border-gold-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accenthover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ArrowLeft className="size-4" />
						{t("common_previous")}
					</button>
					<span className="text-sm text-muted-foreground">
						{start.toLocaleString(locale)}–{end.toLocaleString(locale)} {t("hadith.of")}{" "}
						{book.total.toLocaleString(locale)}
					</span>
					<button
						type="button"
						onClick={() => goToNumber(start + PAGE_SIZE)}
						disabled={page >= pageCount - 1}
						className="inline-flex items-center gap-1.5 rounded-lg border border-gold-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accenthover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
					>
						{t("common_next")}
						<ArrowRight className="size-4" />
					</button>
				</div>

				<form
					onSubmit={submitJump}
					className="flex items-center gap-2 rounded-xl border border-gold-border bg-card p-3"
				>
					<input
						value={jump}
						onChange={(e) => setJump(e.target.value)}
						inputMode="numeric"
						placeholder={t("hadith.jumpTo")}
						aria-label={t("hadith.hadithNumber")}
						className="w-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
					/>
					<button
						type="submit"
						className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					>
						<CornerDownLeft className="size-4" />
						{t("hadith.go")}
					</button>
				</form>
			</div>

			{/* Hadith list */}
			{loading ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
					<div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
					<p className="text-sm text-muted-foreground">{t("common_loading")}</p>
				</div>
			) : error || items.length === 0 ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
					<p className="text-muted-foreground">{t("common_error")}</p>
					<Link
						to="/hadith"
						className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white"
					>
						<ArrowLeft className="size-4" />
						{t("hadith.books")}
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{items.map((h) => (
						<Link
							key={h.number}
							to={`/hadith/${book.id}/${h.number}`}
							className="group block rounded-xl border border-gold-border/50 bg-card p-5 transition-colors hover:border-gold-border hover:bg-accent"
						>
							<div className="flex items-start gap-4">
								<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-surface text-xs font-semibold text-teal">
									{h.number}
								</span>
								<div className="min-w-0 flex-1 space-y-2">
									<p className="line-clamp-2 font-arabic text-xl leading-[2] text-teal">{h.arab}</p>
									<p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{h.id}</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
