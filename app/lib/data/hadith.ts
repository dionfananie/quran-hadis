import hadithBooksData from "@/data/hadith-books.json";
import type { Hadith, HadithBook } from "./types";

export const hadithBooks = hadithBooksData as HadithBook[];

const cache = new Map<string, Hadith[]>();

export function getHadithBooks(): HadithBook[] {
	return hadithBooks;
}

export function getHadithBook(id: string): HadithBook | undefined {
	return hadithBooks.find((b) => b.id === id);
}

export function findHadithChunk(book: HadithBook, number: number) {
	return book.chunks.find((c) => number >= c.start && number <= c.end);
}

export async function getHadithChunk(bookId: string, file: string): Promise<Hadith[]> {
	const key = `${bookId}/${file}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const res = await fetch(`/data/hadith/${file}`);
	if (!res.ok) return [];
	const chunk = (await res.json()) as Hadith[];
	cache.set(key, chunk);
	return chunk;
}

export async function getHadith(bookId: string, number: number): Promise<Hadith | undefined> {
	const book = getHadithBook(bookId);
	if (!book) return undefined;
	const chunk = findHadithChunk(book, number);
	if (!chunk) return undefined;
	const list = await getHadithChunk(bookId, chunk.file);
	return list.find((h) => h.number === number);
}
