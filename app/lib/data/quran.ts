import surahIndexData from "@/data/surah-index.json";
import dailyData from "@/data/daily.json";
import type { DailyVerse, Surah, SurahIndexEntry } from "./types";

export const surahIndex = surahIndexData as SurahIndexEntry[];
export const dailyVerses = dailyData as DailyVerse[];

const cache = new Map<number, Surah>();

export function getSurahIndex(): SurahIndexEntry[] {
	return surahIndex;
}

export function getSurahMeta(number: number): SurahIndexEntry | undefined {
	return surahIndex.find((s) => s.number === number);
}

export async function getSurah(number: number): Promise<Surah | undefined> {
	const cached = cache.get(number);
	if (cached) return cached;

	const res = await fetch(`/data/quran/${number}.json`);
	if (!res.ok) return undefined;
	const surah = (await res.json()) as Surah;
	cache.set(number, surah);
	return surah;
}

export function getDailyVerse(dayIndex: number): DailyVerse {
	return dailyVerses[dayIndex % dailyVerses.length];
}
