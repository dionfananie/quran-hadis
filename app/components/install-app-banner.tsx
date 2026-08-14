import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

/**
 * CTA "Install App" — sticky di bawah, KOMPONEN MOBILE-ONLY (`md:hidden`).
 * Dipakai oleh AppShell supaya tampil di semua halaman saat dibuka via mobile.
 *
 * Perilaku:
 *  - Chrome/Edge (Android & desktop): menunggu event `beforeinstallprompt`,
 *    lalu tombol "Install" memicu `prompt()`. Banner otomatis hilang setelah install
 *    (event `appinstalled`) atau saat di-tutup.
 *  - iOS Safari: `beforeinstallprompt` tidak ada → tampilkan instruksi "Add to Home
 *    Screen" (tidak bisa ditutup permanen tapi bisa di-dismiss per sesi).
 *  - Mode PWA standalone: tidak tampil (sudah ter-install).
 */
type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		(navigator as unknown as { standalone?: boolean }).standalone === true
	);
}

function isIOS() {
	return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppBanner() {
	const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
	const [dismissed, setDismissed] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);
	const [iosHint, setIosHint] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || isStandalone()) {
			setIsInstalled(true);
			return;
		}

		const onBeforeInstall = (e: Event) => {
			e.preventDefault();
			setInstallEvt(e as BeforeInstallPromptEvent);
		};
		const onInstalled = () => {
			setIsInstalled(true);
			setInstallEvt(null);
		};
		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);

		// iOS: tidak ada event beforeinstallprompt → tampilkan hint "Add to Home Screen"
		// hanya setelah halaman terlihat (hindari flash sebelum styles).
		if (isIOS()) {
			const t = setTimeout(() => setIosHint(true), 1500);
			return () => {
				clearTimeout(t);
				window.removeEventListener("beforeinstallprompt", onBeforeInstall);
				window.removeEventListener("appinstalled", onInstalled);
			};
		}

		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	if (isInstalled || dismissed) return null;

	// Tampil hanya utk Chrome/Edge yang mendukung prompt, ATAU iOS (hint manual).
	const show = installEvt || iosHint;
	if (!show) return null;

	return (
		<div className="pointer-events-none fixed inset-x-0 top-16 z-40 px-3 md:hidden">
			<div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-border bg-surface-high/95 p-4 shadow-lg backdrop-blur dark:bg-surface">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
						<Download className="size-5" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-semibold">Install Moozhaf</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{iosHint
								? "Buka menu Bagikan lalu pilih “Add to Home Screen”."
								: "Pasang aplikasi untuk akses cepat & offline dari layar utama."}
						</p>
					</div>
					<button
						type="button"
						aria-label="Tutup"
						onClick={() => {
							setDismissed(true);
							setIosHint(false);
						}}
						className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent"
					>
						<X className="size-4" />
					</button>
				</div>
				{!iosHint && installEvt && (
					<Button
						className="mt-3 w-full"
						size="sm"
						onClick={async () => {
							try {
								await installEvt.prompt();
							} finally {
								// Sembunyikan setelah pilih (accepted/dismissed) untuk tidak mengganggu.
								setDismissed(true);
								setInstallEvt(null);
							}
						}}
					>
						Install Sekarang
					</Button>
				)}
			</div>
		</div>
	);
}
