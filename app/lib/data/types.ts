export interface Bismillah {
	arab: string;
	translation: string;
}

export interface SurahIndexEntry {
	number: number;
	name: string;
	arabic: string | null;
	translation: string;
	revelation: string;
	numberOfAyahs: number;
	audio: string | null;
	bismillah: Bismillah | null;
}

export interface AyahMeta {
	juz: number;
	page: number;
	manzil: number;
	ruku: number;
	hizbQuarter: number;
	sajda: { recommended: boolean; obligatory: boolean } | null;
}

export interface Ayah {
	number: { inQuran: number; inSurah: number };
	arab: string;
	translation: string;
	audio: Record<string, string>;
	image: { primary: string; secondary: string };
	tafsir: { kemenag: { short: string; long: string } };
	meta: AyahMeta;
}

export interface Surah extends SurahIndexEntry {
	description: string;
	ayahs: Ayah[];
}

export interface DailyVerse {
	surah: number;
	ayah: number;
	arab: string;
	translation: string;
	audio?: string;
}

export interface Hadith {
	number: number;
	arab: string;
	id: string;
}

export interface HadithChunk {
	start: number;
	end: number;
	file: string;
}

export interface HadithBook {
	id: string;
	nameId: string;
	nameEn: string;
	total: number;
	chunks: HadithChunk[];
}

export interface AsmaulHusna {
	number: number;
	arabic: string;
	latin: string;
	meaningId: string;
	meaningEn: string;
}

export interface AzkarItem {
	id: string;
	arabic: string;
	transliteration?: string;
	translationId: string;
	translationEn: string;
	count: number;
}

export interface AzkarCategory {
	id: string;
	titleId: string;
	titleEn: string;
	items: AzkarItem[];
}
