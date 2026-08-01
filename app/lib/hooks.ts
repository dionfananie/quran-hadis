import { useEffect, useState } from "react";

export function useMounted() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}

export function useStoredState<T>(
	key: string,
	initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
	const [value, setValue] = useState<T>(initial);

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(key);
			if (raw != null) setValue(JSON.parse(raw) as T);
		} catch {
			// ignore corrupt storage
		}
	}, [key]);

	const set = (next: T | ((prev: T) => T)) => {
		setValue((prev) => {
			const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
			try {
				window.localStorage.setItem(key, JSON.stringify(resolved));
			} catch {
				// ignore quota errors
			}
			return resolved;
		});
	};

	return [value, set];
}

const READING_KEY = "moeslem.reading-history";

export interface ReadingRecord {
	surah: number;
	ayah: number;
	readAt: number;
}

export function useReadingHistory() {
	return useStoredState<ReadingRecord[]>(READING_KEY, []);
}

export function useLastRead(): [ReadingRecord | null, (record: ReadingRecord) => void] {
	const [history, setHistory] = useReadingHistory();
	const last = history.length > 0 ? history[0] : null;
	const record = (r: ReadingRecord) =>
		setHistory((prev) => [
			r,
			...prev.filter((p) => !(p.surah === r.surah && p.ayah === r.ayah)),
		].slice(0, 10));
	return [last, record];
}
