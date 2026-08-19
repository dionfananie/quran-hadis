// share-ayat-image.ts — Generate gambar share 1 ayat (canvas, tanpa dependency eksternal).
// Gaya FINAL4: background full + scrim gelap + ayat arab (auto-shrink dlm margin 24px kiri/kanan)
// + arti (wrap) + sumber + logo Moozhaf + footer moozhaf.oppia.world.
// V1: pakai 1 background default (public/backgrounds/bg-1.jpg). Random bg untuk nanti.

import { SITE_URL } from "@/lib/seo";

export const SHARE_BACKGROUNDS = ["/backgrounds/bg-1.jpg"];

export interface AyahShareInput {
	arab: string;
	translation: string;
	surahName: string; // e.g. "Al-Insyirah"
	surahNumber: number;
	ayahNumber: number; // number.inSurah
	backgroundUrl?: string; // default: /backgrounds/bg-1.jpg
}

const W = 1080;
const H = 1620;
const MARGIN = 24; // jarak konten dari sisi kanan & kiri (px)

/** Pastikan font (atau fallback) tersedia sebelum render. */
async function ensureFonts() {
	if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
		try {
			await document.fonts.ready;
		} catch {
			/* ignore */
		}
	}
}

/** Muat gambar background ke HTMLImageElement. Same-origin (PWA static) — TANPA crossOrigin
 *  agar canvas tidak jadi "dirty" (yang memblokir toBlob/toDataURL). */
function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

function scrim(ctx: CanvasRenderingContext2D, w: number, h: number) {
	// Gradasi gelap vertikal: 0.30 area tengah paling gelap, atas/bawah lebih ringan.
	const grad = ctx.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, "rgba(0,0,8,0.28)");
	grad.addColorStop(0.30, "rgba(0,0,8,0.70)");
	grad.addColorStop(0.72, "rgba(0,0,8,0.70)");
	grad.addColorStop(1, "rgba(0,0,8,0.25)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

export async function generateAyahShareImage(input: AyahShareInput): Promise<Blob> {
	await ensureFonts();

	const bgUrl = input.backgroundUrl || SHARE_BACKGROUNDS[0];
	let bg: HTMLImageElement;
	try {
		bg = await loadImage(bgUrl);
	} catch {
		bg = await loadImage(SHARE_BACKGROUNDS[0]);
	}

	// Ukuran canvas mengikuti rasio background (portrait). Bila bg sudah 1080x1620, pakai itu.
	const cw = bg.naturalWidth || W;
	const ch = bg.naturalHeight || H;

	const canvas = document.createElement("canvas");
	canvas.width = cw;
	canvas.height = ch;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas 2d not supported");

	// 1. Background full (cover) + scrim
	ctx.drawImage(bg, 0, 0, cw, ch);
	scrim(ctx, cw, ch);

	const LX = MARGIN;
	const RX = cw - MARGIN;
	const CX = cw / 2;
	const MAX_W = RX - LX;

	// 2. Ayat arab — auto-shrink font, lalu WRAP ke beberapa baris bila terlalu panjang,
	//    agar tidak overlap & tidak melewati margin kiri-kanan.
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#ffffff";
	ctx.direction = "rtl";
	let arabSize = 80;
	// Turunkan ukuran font sampai teks muat SATU baris (min 34px).
	while (arabSize > 34) {
		ctx.font = `700 ${arabSize}px "Amiri", serif`;
		if (ctx.measureText(input.arab).width <= MAX_W) break;
		arabSize -= 4;
	}
	ctx.font = `700 ${arabSize}px "Amiri", serif`;
	// Segmen-segmen: urutkan teks arab jadi baris-baris yang muat dalam MAX_W.
	const arabLines = wrapText(ctx, input.arab, MAX_W);
	const arabLineH = arabSize * 1.55;
	const arabBlockH = arabLines.length * arabLineH;
	// Titik mulai agar blok ayat terpusat dengan arti tetap punya ruang.
	let arabTop = ch * 0.4 - (arabBlockH - arabLineH) / 2;
	if (arabTop < ch * 0.16) arabTop = ch * 0.16;
	for (let i = 0; i < arabLines.length; i++) {
		ctx.fillText(arabLines[i], CX, arabTop + i * arabLineH);
	}
	const arabBottom = arabTop + arabLines.length * arabLineH;

	// 3. Arti — wrap agar tidak melewati [LX..RX]
	ctx.direction = "ltr";
	const transSize = Math.round(ch * 0.027);
	ctx.font = `italic 400 ${transSize}px "Plus Jakarta Sans", "Noto Serif", serif`;
	const artiLines = wrapText(ctx, input.translation, MAX_W);
	const artiStartY = arabBottom + ch * 0.05;
	let y = artiStartY;
	const lineH = transSize * 1.5;
	for (const ln of artiLines) {
		ctx.fillText(ln, CX, y);
		y += lineH;
	}

	// 4. Sumber (sekali)
	const srcSize = Math.round(ch * 0.022);
	ctx.font = `500 ${srcSize}px "Plus Jakarta Sans", sans-serif`;
	ctx.fillStyle = "#d6e0da";
	ctx.fillText(`QS. ${input.surahName} ${input.surahNumber} : ${input.ayahNumber}`, CX, y + ch * 0.06);

	// 5. Logo
	const logoSize = Math.round(ch * 0.033);
	ctx.font = `700 ${logoSize}px "Plus Jakarta Sans", serif`;
	ctx.fillStyle = "#ffffff";
	ctx.fillText("Moozhaf", CX, ch - ch * 0.062);

	// 6. Footer
	const footSize = Math.round(ch * 0.019);
	ctx.font = `500 ${footSize}px "Plus Jakarta Sans", sans-serif`;
	ctx.fillStyle = "#d6e0da";
	ctx.fillText(SITE_URL.replace("https://", ""), CX, ch - ch * 0.018);

	// Export PNG
	return await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("toBlob failed"));
		}, "image/png");
	});
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let cur = "";
	for (const w of words) {
		const trial = cur ? `${cur} ${w}` : w;
		if (ctx.measureText(trial).width <= maxWidth) {
			cur = trial;
		} else {
			if (cur) lines.push(cur);
			cur = w;
		}
	}
	if (cur) lines.push(cur);
	return lines;
}
