const ENDPOINT =
	(import.meta.env.VITE_VECTOR_SEARCH_ENDPOINT as string | undefined) ?? "";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type SearchType = "surat" | "ayat" | "tafsir" | "doa";
export type Relevance = "tinggi" | "sedang" | "rendah";

interface EquranSuratData {
	id_surat: number;
	nama: string;
	nama_arab: string;
	arti: string;
	jumlah_ayat: number;
	tempat_turun: string;
	deskripsi: string;
}

interface EquranAyatData {
	id_surat: number;
	nama_surat: string;
	nama_surat_arab: string;
	nomor_ayat: number;
	teks_arab: string;
	teks_latin: string;
	terjemahan_id: string;
}

interface EquranTafsirData {
	id_surat: number;
	nama_surat: string;
	nomor_ayat: number;
	isi: string;
}

interface EquranDoaData {
	id_doa: number;
	judul: string;
	grup: string;
	teks_arab: string;
	teks_latin: string;
	arti: string;
}

interface EquranResult {
	tipe: string;
	skor: number;
	relevansi: string;
	data: EquranSuratData & EquranAyatData & EquranTafsirData & EquranDoaData;
}

interface EquranResponse {
	status: string;
	cari: string;
	jumlah: number;
	hasil: EquranResult[];
}

export interface VectorSearchResult {
	type: SearchType;
	score: number;
	relevance: Relevance;
	href: string;
	title: string;
	arabic?: string;
	latin?: string;
	text: string;
}

const cache = new Map<string, { at: number; results: VectorSearchResult[] }>();

function truncate(text: string, max: number): string {
	const clean = text.replace(/\s+/g, " ").trim();
	return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

function mapResult(r: EquranResult): VectorSearchResult | null {
	const relevance: Relevance = r.relevansi === "tinggi" || r.relevansi === "sedang" ? r.relevansi : "rendah";

	if (r.tipe === "surat" && r.data.id_surat) {
		return {
			type: "surat",
			score: r.skor,
			relevance,
			href: `/quran/${r.data.id_surat}`,
			title: `${r.data.nama}${r.data.arti ? ` — ${r.data.arti}` : ""}`,
			text: truncate(r.data.deskripsi ?? r.data.nama, 200),
		};
	}

	if (r.tipe === "ayat" && r.data.id_surat) {
		return {
			type: "ayat",
			score: r.skor,
			relevance,
			href: `/quran/${r.data.id_surat}/${r.data.nomor_ayat}`,
			title: `${r.data.nama_surat} ${r.data.nomor_ayat}`,
			arabic: r.data.teks_arab,
			latin: r.data.teks_latin,
			text: truncate(r.data.terjemahan_id ?? "", 220),
		};
	}

	if (r.tipe === "tafsir" && r.data.id_surat) {
		return {
			type: "tafsir",
			score: r.skor,
			relevance,
			href: `/quran/${r.data.id_surat}/${r.data.nomor_ayat}`,
			title: `${r.data.nama_surat} ${r.data.nomor_ayat}`,
			text: truncate(r.data.isi ?? "", 220),
		};
	}

	if (r.tipe === "doa" && r.data.id_doa) {
		return {
			type: "doa",
			score: r.skor,
			relevance,
			href: "/azkar",
			title: r.data.judul,
			arabic: r.data.teks_arab,
			text: truncate(r.data.arti ?? "", 220),
		};
	}

	return null;
}

export interface SearchQuranOptions {
	types?: SearchType[];
	limit?: number;
	minScore?: number;
}

export async function searchQuran(
	query: string,
	options: SearchQuranOptions = {},
): Promise<VectorSearchResult[]> {
	const { types = ["surat", "ayat", "tafsir", "doa"], limit = 10, minScore = 0.35 } = options;

	const cacheKey = `${query}|${types.join(",")}|${minScore}`;
	const hit = cache.get(cacheKey);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.results;

	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ cari: query, batas: limit, tipe: types, skorMin: minScore }),
	});
	if (!res.ok) throw new Error(`Vector search failed: ${res.status}`);

	const body = (await res.json()) as EquranResponse;
	const results = (body.hasil ?? [])
		.map(mapResult)
		.filter((r): r is VectorSearchResult => r !== null)
		.filter((r) => r.score >= minScore);

	cache.set(cacheKey, { at: Date.now(), results });
	return results;
}
