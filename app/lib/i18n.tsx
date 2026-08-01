import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

export type Lang = "id" | "en";

const id = {
	appName: "Moozhaf",
	tagline: "Bimbingan ilahi di genggaman Anda",

	"nav.home": "Beranda",
	"nav.quran": "Quran",
	"nav.hadith": "Hadits",
	"nav.prayers": "Jadwal",
	"nav.more": "Lainnya",

	"more.asmaulHusna": "Asmaul Husna",
	"more.azkar": "Azkar",
	"more.settings": "Pengaturan",

	common_search: "Cari…",
	common_searchShortcut: "Ketik untuk mencari",
	common_loading: "Memuat…",
	common_back: "Kembali",
	common_next: "Berikutnya",
	common_previous: "Sebelumnya",
	common_close: "Tutup",
	common_continue: "Lanjutkan",
	common_viewAll: "Lihat Semua",
	common_read: "Baca",
	common_listen: "Dengarkan",
	common_pause: "Jeda",
	common_play: "Putar",
	common_copy: "Salin",
	common_copied: "Tersalin",
	common_share: "Bagikan",
	common_verse: "Ayat",
	common_verses: "Ayat",
	common_notFound: "Tidak ditemukan",
	common_error: "Terjadi kesalahan",

	"home.heroTitle": "Bimbingan Ilahi",
	"home.heroSubtitle": "Jelajahi Al-Qur'an",
	"home.searchPlaceholder": "Cari surah…",
	"home.dailyVerse": "Ayat Hari Ini",
	"home.continueReading": "Lanjutkan Membaca",
	"home.viewHistory": "Lihat Riwayat",
	"home.lastRead": "Terakhir Dibaca",
	"home.recommended": "Direkomendasikan",
	"home.addBookmark": "Tambahkan penanda",
	"home.bookmarks": "Penanda",
	"home.qibla": "Arah Kiblat",
	"home.surahIndex": "Daftar Surah",
	"home.all": "Semua",
	"home.meccan": "Makkiyah",
	"home.medinan": "Madaniyah",
	"home.grid": "Grid",
	"home.list": "Daftar",
	"home.lastReadTime": "2 jam lalu",
	"home.yesterday": "Kemarin",
	"home.listenRecitation": "Dengarkan Murottal",
	"home.continueQuote":
		"Dan tetapilah memberi peringatan, karena sesungguhnya peringatan itu bermanfaat bagi orang-orang yang beriman",
	"home.selectTafsir": "Pilih Tafsir",
	"home.readingHistory": "Riwayat Baca",

	"tafsir.jalalayn": "Al-Jalalayn",
	"tafsir.jalalayn.desc": "Tafsir klasik yang ringkas",
	"tafsir.ibnKathir": "Ibnu Katsir",
	"tafsir.ibnKathir.desc": "Tafsir tradisional berbasis dalil",
	"tafsir.alMuntakhab": "Al-Muntakhab",
	"tafsir.alMuntakhab.desc": "Makna modern yang disederhanakan",
	"tafsir.alMuyassar": "Al-Muyassar",
	"tafsir.alMuyassar.desc": "Ringkas dan mudah dipahami",

	"prayer.today": "Jadwal Hari Ini",
	"prayer.nextPrayer": "Waktu Berikutnya",
	"prayer.timeRemaining": "Sisa Waktu",
	"prayer.qibla": "Arah Kiblat",
	"prayer.fajr": "Subuh",
	"prayer.sunrise": "Terbit",
	"prayer.dhuhr": "Dzuhur",
	"prayer.asr": "Ashar",
	"prayer.maghrib": "Maghrib",
	"prayer.isha": "Isya",
	"prayer.weekly": "Jadwal Mingguan",

	"quran.translation": "Terjemahan",
	"quran.tafsir": "Tafsir",
	"quran.audio": "Audio",
	"quran.bismillah": "Bismillah",
	"quran.reading": "Mode Baca",
	"quran.ayah": "Ayat",
	"quran.revelation": "Wahyu",
	"quran.description": "Deskripsi",
	"quran.info": "Info",
	"quran.ayahImage": "Gambar Ayat",
	"quran.shortTafsir": "Tafsir Ringkas",
	"quran.longTafsir": "Tafsir Lengkap",

	"hadith.title": "Koleksi Hadits",
	"hadith.subtitle": "Hikmah kenabian & bimbingan",
	"hadith.books": "Kitab",
	"hadith.searchPlaceholder": "Cari hadits…",

	"settings.title": "Pengaturan",
	"settings.language": "Bahasa",
	"settings.theme": "Tema",
	"settings.light": "Terang",
	"settings.dark": "Gelap",
	"settings.system": "Sistem",
	"settings.calculationMethod": "Metode Perhitungan",
	"settings.madhab": "Madzhab",
	"settings.location": "Lokasi",
	"settings.fontSize": "Ukuran Teks",
	"settings.about": "Tentang",

	"asmaulHusna.title": "Asmaul Husna",
	"asmaulHusna.subtitle": "99 Nama Allah Yang Maha Indah",
	"asmaulHusna.count": "99 Nama",

	"azkar.title": "Azkar",
	"azkar.subtitle": "Doa & dzikir harian",
	"azkar.count": "Dzikir",
	"azkar.done": "Selesai",
	"azkar.reset": "Ulangi",
} as const;

const en: Record<keyof typeof id, string> = {
	appName: "Moozhaf",
	tagline: "Divine guidance in your hands",

	"nav.home": "Home",
	"nav.quran": "Quran",
	"nav.hadith": "Hadith",
	"nav.prayers": "Prayers",
	"nav.more": "More",

	"more.asmaulHusna": "Asmaul Husna",
	"more.azkar": "Azkar",
	"more.settings": "Settings",

	common_search: "Search…",
	common_searchShortcut: "Type to search",
	common_loading: "Loading…",
	common_back: "Back",
	common_next: "Next",
	common_previous: "Previous",
	common_close: "Close",
	common_continue: "Continue",
	common_viewAll: "View All",
	common_read: "Read",
	common_listen: "Listen",
	common_pause: "Pause",
	common_play: "Play",
	common_copy: "Copy",
	common_copied: "Copied",
	common_share: "Share",
	common_verse: "Verse",
	common_verses: "Verses",
	common_notFound: "Not found",
	common_error: "Something went wrong",

	"home.heroTitle": "Divine Guidance",
	"home.heroSubtitle": "Explore the Holy Qur'an",
	"home.searchPlaceholder": "Search surahs…",
	"home.dailyVerse": "Verse of the Day",
	"home.continueReading": "Continue Reading",
	"home.viewHistory": "View History",
	"home.lastRead": "Last Read",
	"home.recommended": "Recommended",
	"home.addBookmark": "Add bookmark",
	"home.bookmarks": "Bookmarks",
	"home.qibla": "Qibla Direction",
	"home.surahIndex": "Surah Index",
	"home.all": "All",
	"home.meccan": "Meccan",
	"home.medinan": "Medinan",
	"home.grid": "Grid",
	"home.list": "List",
	"home.lastReadTime": "2 hours ago",
	"home.yesterday": "Yesterday",
	"home.listenRecitation": "Listen Recitation",
	"home.continueQuote":
		"And remind, for indeed, the reminder benefits the believers",
	"home.selectTafsir": "Select Tafsir",
	"home.readingHistory": "Reading History",

	"tafsir.jalalayn": "Al-Jalalayn",
	"tafsir.jalalayn.desc": "Classical concise commentary",
	"tafsir.ibnKathir": "Ibn Kathir",
	"tafsir.ibnKathir.desc": "Traditional evidence-based",
	"tafsir.alMuntakhab": "Al-Muntakhab",
	"tafsir.alMuntakhab.desc": "Modern simplified meanings",
	"tafsir.alMuyassar": "Al-Muyassar",
	"tafsir.alMuyassar.desc": "Easy-to-understand brief",

	"prayer.today": "Today's Schedule",
	"prayer.nextPrayer": "Next Prayer",
	"prayer.timeRemaining": "Time Remaining",
	"prayer.qibla": "Qibla Direction",
	"prayer.fajr": "Fajr",
	"prayer.sunrise": "Sunrise",
	"prayer.dhuhr": "Dhuhr",
	"prayer.asr": "Asr",
	"prayer.maghrib": "Maghrib",
	"prayer.isha": "Isha",
	"prayer.weekly": "Weekly Schedule",

	"quran.translation": "Translation",
	"quran.tafsir": "Tafsir",
	"quran.audio": "Audio",
	"quran.bismillah": "Bismillah",
	"quran.reading": "Reading Mode",
	"quran.ayah": "Ayah",
	"quran.revelation": "Revelation",
	"quran.description": "Description",
	"quran.info": "Info",
	"quran.ayahImage": "Ayah Image",
	"quran.shortTafsir": "Brief Tafsir",
	"quran.longTafsir": "Full Tafsir",

	"hadith.title": "Hadith Collection",
	"hadith.subtitle": "Prophetic wisdom & guidance",
	"hadith.books": "Books",
	"hadith.searchPlaceholder": "Search hadith…",

	"settings.title": "Settings",
	"settings.language": "Language",
	"settings.theme": "Theme",
	"settings.light": "Light",
	"settings.dark": "Dark",
	"settings.system": "System",
	"settings.calculationMethod": "Calculation Method",
	"settings.madhab": "Madhab",
	"settings.location": "Location",
	"settings.fontSize": "Text Size",
	"settings.about": "About",

	"asmaulHusna.title": "Asmaul Husna",
	"asmaulHusna.subtitle": "The 99 Most Beautiful Names of Allah",
	"asmaulHusna.count": "99 Names",

	"azkar.title": "Azkar",
	"azkar.subtitle": "Daily supplications & remembrance",
	"azkar.count": "Dhikr",
	"azkar.done": "Done",
	"azkar.reset": "Repeat",
};

export type TKey = keyof typeof id;

const I18nContext = createContext<{
	lang: Lang;
	setLang: (lang: Lang) => void;
	t: (key: TKey) => string;
} | null>(null);

const STORAGE_KEY = "moeslem.lang";

function getStoredLang(): Lang | null {
	if (typeof window === "undefined") return null;
	const stored = window.localStorage.getItem(STORAGE_KEY);
	return stored === "en" ? "en" : stored === "id" ? "id" : null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
	// Always start with "id" to match SSR output — hydrate, then sync
	const [lang, setLangState] = useState<Lang>("id");

	useEffect(() => {
		const stored = getStoredLang();
		if (stored) setLang(stored);
	}, []);

	const setLang = useCallback((next: Lang) => {
		setLangState(next);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, next);
		}
		if (typeof document !== "undefined") {
			document.documentElement.lang = next === "en" ? "en" : "id";
		}
	}, []);

	const t = useCallback(
		(key: TKey) => {
			const dict = lang === "en" ? en : id;
			return dict[key] ?? key;
		},
		[lang],
	);

	const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18n must be used within I18nProvider");
	return ctx;
}
