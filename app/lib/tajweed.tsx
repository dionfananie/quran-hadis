import type { ReactNode } from "react";
import type { TKey } from "@/lib/i18n";

export interface TajweedRule {
	id: string;
	nameKey: TKey;
	color: string;
}

export const TAJWEED_RULES: TajweedRule[] = [
	{ id: "hamza-wasl", nameKey: "tajwid.hamzaWasl", color: "#AAAAAA" },
	{ id: "silent", nameKey: "tajwid.silent", color: "#AAAAAA" },
	{ id: "laam-shamsiyah", nameKey: "tajwid.laamShamsiyah", color: "#AAAAAA" },
	{ id: "madda-normal", nameKey: "tajwid.maddaNormal", color: "#537FFF" },
	{ id: "madda-permissible", nameKey: "tajwid.maddaPermissible", color: "#4050FF" },
	{ id: "madda-obligatory", nameKey: "tajwid.maddaObligatory", color: "#2144C1" },
	{ id: "madda-necessary", nameKey: "tajwid.maddaNecessary", color: "#000EBC" },
	{ id: "qalaqah", nameKey: "tajwid.qalaqah", color: "#DD0008" },
	{ id: "ikhafa", nameKey: "tajwid.ikhafa", color: "#9400A8" },
	{ id: "ikhafa-shafawi", nameKey: "tajwid.ikhafaShafawi", color: "#D500B7" },
	{ id: "idgham-shafawi", nameKey: "tajwid.idghamShafawi", color: "#58B800" },
	{ id: "iqlab", nameKey: "tajwid.iqlab", color: "#26BFFD" },
	{ id: "idgham-with-ghunnah", nameKey: "tajwid.idghamWithGhunnah", color: "#169777" },
	{ id: "idgham-without-ghunnah", nameKey: "tajwid.idghamWithoutGhunnah", color: "#169200" },
	{ id: "idgham-mutajanisayn", nameKey: "tajwid.idghamMutajanisayn", color: "#A1A1A1" },
	{ id: "idgham-mutaqaribayn", nameKey: "tajwid.idghamMutaqaribayn", color: "#A1A1A1" },
	{ id: "ghunnah", nameKey: "tajwid.ghunnah", color: "#FF7E1E" },
];

export const codeToColor: Record<string, string> = {
	h: "#AAAAAA",
	s: "#AAAAAA",
	l: "#AAAAAA",
	n: "#537FFF",
	p: "#4050FF",
	m: "#000EBC",
	q: "#DD0008",
	o: "#2144C1",
	c: "#D500B7",
	f: "#9400A8",
	w: "#58B800",
	i: "#26BFFD",
	a: "#169777",
	u: "#169200",
	d: "#A1A1A1",
	b: "#A1A1A1",
	g: "#FF7E1E",
};

const TOKEN_RE = /\[([a-z])(?::(\d+))?\[([^\]]*)\]/g;

export function parseTajweed(text: string): ReactNode {
	try {
		const nodes: ReactNode[] = [];
		let lastIndex = 0;
		for (const match of text.matchAll(TOKEN_RE)) {
			const index = match.index ?? 0;
			if (index > lastIndex) {
				nodes.push(text.slice(lastIndex, index));
			}
			const [, code, , content] = match;
			nodes.push(
				<span key={index} style={{ color: codeToColor[code] ?? "inherit" }}>
					{content}
				</span>,
			);
			lastIndex = index + match[0].length;
		}
		if (lastIndex < text.length) {
			nodes.push(text.slice(lastIndex));
		}
		return <span dir="rtl">{nodes}</span>;
	} catch {
		return text;
	}
}
