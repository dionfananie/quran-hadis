import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Route } from "./+types/hadith";
import { getHadith, getHadithBook } from "@/lib/data/hadith";
import type { Hadith } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { ShareDialog } from "@/components/share-dialog";

export function meta({ params, data }: Route.MetaArgs) {
	const book = data?.book;
	const number = data?.number;
	if (!book || !number) return [{ title: "Hadith" }];
	const title = `${book.nameId} — Hadits Nomor ${number} | Moozhaf`;
	const description = `Baca hadits nomor ${number} dari ${book.nameId} (${book.nameEn}) lengkap dengan teks Arab dan terjemahan bahasa Indonesia.`;
	const url = `${SITE_URL}/hadith/${params.book}/${params.number}`;

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
	const number = Number(params.number);
	const book = getHadithBook(params.book);
	if (!book || !number || number < 1 || number > book.total) {
		throw new Response("Hadits tidak ditemukan", { status: 404 });
	}
	return { book, number };
}

export default function HadithDetail({ loaderData }: Route.ComponentProps) {
	const { t, lang } = useI18n();
	const { book, number } = loaderData;
	const [hadith, setHadith] = useState<Hadith | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [copied, setCopied] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;
		getHadith(book.id, number)
			.then((h) => {
				if (cancelled) return;
				if (!h) throw new Error("Not found");
				setHadith(h);
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
	}, [book.id, number]);

	const prevNumber = number > 1 ? number - 1 : null;
	const nextNumber = number < book.total ? number + 1 : null;

	const copy = async () => {
		if (!hadith) return;
		if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
		try {
			await navigator.clipboard.writeText(`${hadith.arab}\n\n${hadith.id}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore clipboard errors
		}
	};

	const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/hadith/${book.id}/${number}`;
	const shareText = hadith ? `${hadith.arab}\n\n${hadith.id}\n\n${t("common_shareMore")}\n${shareUrl}` : shareUrl;

	if (loading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
				<div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
				<p className="text-sm text-muted-foreground">{t("common_loading")}</p>
			</div>
		);
	}

	if (error || !hadith) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<p className="font-serif text-xl font-semibold text-teal">
					{lang === "id" ? book.nameId : book.nameEn} #{number}
				</p>
				<p className="text-muted-foreground">{t("common_error")}</p>
				<Link
					to={`/hadith/${book.id}`}
					className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white"
				>
					<ArrowLeft className="size-4" />
					{lang === "id" ? book.nameId : book.nameEn}
				</Link>
			</div>
		);
	}

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
				<Link to={`/hadith/${book.id}`} className="hover:text-foreground">
					{lang === "id" ? book.nameId : book.nameEn}
				</Link>
				<ChevronRight className="size-3" />
				<span className="text-teal">#{number}</span>
			</nav>

			{/* Hadith card */}
			<div className="rounded-2xl border border-gold-border bg-card p-8">
				<div className="flex flex-col items-center gap-6 text-center">
					<div className="flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-full bg-gold-surface font-serif text-sm font-semibold text-teal">
							{hadith.number}
						</span>
						<span className="text-sm text-muted-foreground">
							{lang === "id" ? book.nameId : book.nameEn}
						</span>
					</div>
					<p className="font-arabic text-3xl leading-[2.2] text-teal md:text-4xl">{hadith.arab}</p>
					<p className="text-lg leading-relaxed text-muted-foreground">{hadith.id}</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={copy}
							className="inline-flex items-center gap-1.5 rounded-lg border border-gold-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accenthover:text-foreground"
						>
							{copied ? <Check className="size-4 text-teal" /> : <Copy className="size-4" />}
							{copied ? t("common_copied") : t("common_copy")}
						</button>
						<button
							type="button"
							onClick={() => setShareOpen(true)}
							className="inline-flex items-center gap-1.5 rounded-lg border border-gold-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accenthover:text-foreground"
						>
							<Share2 className="size-4" />
							{t("common_share")}
						</button>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<div className="flex items-center justify-between gap-4 border-t border-gold-border pt-6">
				{prevNumber ? (
					<Link
						to={`/hadith/${book.id}/${prevNumber}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						<ArrowLeft className="size-4" />
						#{prevNumber}
					</Link>
				) : (
					<div />
				)}
				<Link
					to={`/hadith/${book.id}`}
					className="text-xs font-bold uppercase tracking-[0.05em] text-gold hover:underline"
				>
					{lang === "id" ? book.nameId : book.nameEn}
				</Link>
				{nextNumber ? (
					<Link
						to={`/hadith/${book.id}/${nextNumber}`}
						className="flex items-center gap-2 text-sm font-medium text-teal hover:underline"
					>
						#{nextNumber}
						<ArrowRight className="size-4" />
					</Link>
				) : (
					<div />
				)}
			</div>

			<ShareDialog
				open={shareOpen}
				onOpenChange={setShareOpen}
				title={`${lang === "id" ? book.nameId : book.nameEn} #${number}`}
				text={shareText}
				url={shareUrl}
			/>
		</div>
	);
}
