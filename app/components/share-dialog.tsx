import { useEffect, useRef, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { generateAyahShareImage, type AyahShareInput } from "@/lib/share-ayat-image";

function WhatsAppIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-6">
			<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
		</svg>
	);
}

function XIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-6">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	text: string;
	url: string;
	/** Bila ada, seluruh opsi share menggunakan GAMBAR ayat (bukan teks/link). */
	imageSource?: AyahShareInput;
}

/** Generate gambar ayat → File PNG. Di-cache per dialog. */
async function buildShareFile(imageSource: AyahShareInput): Promise<File> {
	const blob = await generateAyahShareImage(imageSource);
	const name = `ayat-${imageSource.surahNumber}-${imageSource.ayahNumber}.png`;
	return new File([blob], name, { type: "image/png" });
}

export function ShareDialog({ open, onOpenChange, title, text, url, imageSource }: ShareDialogProps) {
	const { t } = useI18n();
	const [copied, setCopied] = useState(false);
	const [busy, setBusy] = useState(false);
	const fileCache = useRef<File | null>(null);

	// Reset cache tiap dialog dibuka agar gambar fresh.
	useEffect(() => {
		if (open) fileCache.current = null;
	}, [open]);

	async function getFile(): Promise<File | null> {
		if (!imageSource) return null;
		if (fileCache.current) return fileCache.current;
		setBusy(true);
		try {
			const f = await buildShareFile(imageSource);
			fileCache.current = f;
			return f;
		} finally {
			setBusy(false);
		}
	}

	// Share native dgn GAMBAR (muncul chooser termasuk WhatsApp/X). Fallback teks.
	async function shareNative() {
		if (imageSource) {
			const file = await getFile();
			if (file) {
				const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
				if (nav.canShare && nav.canShare({ files: [file] })) {
					try {
						await navigator.share({ files: [file], title, text });
						onOpenChange(false);
						return;
					} catch {
						/* user cancel / gagal → fallthrough */
					}
				}
				// fallback download
				downloadFile(file);
				onOpenChange(false);
				return;
			}
		}
		if (typeof navigator !== "undefined" && "share" in navigator) {
			try {
				await navigator.share({ title, text, url });
				onOpenChange(false);
			} catch {
				/* cancel */
			}
		}
	}

	// Copy: bila imageSource → copy GAMBAR ke clipboard; bila tidak → copy teks.
	async function copy() {
		if (imageSource) {
			const file = await getFile();
			if (file && typeof navigator.clipboard !== "undefined" && "write" in navigator.clipboard) {
				try {
					await navigator.clipboard.write([
						new ClipboardItem({ "image/png": file }),
					]);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
					return;
				} catch {
					/* gambar tak bisa dicopy → fallback teks */
				}
			}
		}
		if (typeof navigator !== "undefined" && "clipboard" in navigator) {
			try {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch {
				/* ignore */
			}
		}
	}

	function downloadFile(file: File) {
		const url = URL.createObjectURL(file);
		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	const whatsappUrl = `https://api.whatsapp.com/send/?text=${encodeURIComponent(text)}`;
	const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

	const optionClass =
		"flex w-full flex-col items-center gap-2 rounded-lg border border-gold-border px-4 py-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50";

	const busyLabel = t("odoj.loading"); // "Memuat…"

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("common_shareTo")}</DialogTitle>
					<DialogDescription>
						{title}
						{imageSource ? " — akan dibagikan sebagai gambar" : ""}
					</DialogDescription>
				</DialogHeader>

				{imageSource ? (
					/* Mode gambar: setiap pilihan meng-share GAMBAR ayat */
					<div className="grid grid-cols-2 gap-3">
						<button type="button" disabled={busy} onClick={shareNative} className={optionClass}>
							{busy ? <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <WhatsAppIcon />}
							<span>{busy ? busyLabel : "WhatsApp"}</span>
						</button>
						<button type="button" disabled={busy} onClick={shareNative} className={optionClass}>
							{busy ? <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <XIcon />}
							<span>{busy ? busyLabel : "Lainnya"}</span>
						</button>
						<button type="button" disabled={busy} onClick={copy} className={`${optionClass} col-span-2`}>
							{copied ? <Check className="size-6 text-teal" /> : <Copy className="size-6" />}
							<span>{copied ? t("common_copied") : busy ? busyLabel : t("common_copy")}</span>
						</button>
						<button type="button" disabled={busy} onClick={shareNative} className={`${optionClass} col-span-2 bg-teal text-white`}>
							<Share2 className="size-5" />
							<span>{t("common_more")}</span>
						</button>
					</div>
				) : (
					/* Mode teks/link (default) */
					<div className="grid grid-cols-3 gap-3">
						<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={optionClass}>
							<WhatsAppIcon />
							<span>WhatsApp</span>
						</a>
						<a href={xUrl} target="_blank" rel="noopener noreferrer" className={optionClass}>
							<XIcon />
							<span>X</span>
						</a>
						<button type="button" onClick={copy} className={optionClass}>
							{copied ? <Check className="size-6 text-teal" /> : <Copy className="size-6" />}
							<span>{copied ? t("common_copied") : t("common_copy")}</span>
						</button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
