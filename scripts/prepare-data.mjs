import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const CHUNK_SIZE = 250;

const readRaw = (name) =>
	JSON.parse(readFileSync(join(ROOT, "data", "raw", name), "utf8"));

const writeOut = (rel, data) => {
	const p = join(ROOT, rel);
	mkdirSync(dirname(p), { recursive: true });
	writeFileSync(p, JSON.stringify(data));
	console.log(`${rel.padEnd(52)} ${(readFileSync(p).length / 1024).toFixed(0).padStart(6)} KB`);
};

const HADITH_BOOKS = [
	{ id: "bukhari", nameId: "Shahih Bukhari", nameEn: "Sahih al-Bukhari" },
	{ id: "muslim", nameId: "Shahih Muslim", nameEn: "Sahih Muslim" },
	{ id: "tirmidzi", nameId: "Sunan Tirmidzi", nameEn: "Jami' at-Tirmidhi" },
	{ id: "nasai", nameId: "Sunan Nasai", nameEn: "Sunan an-Nasa'i" },
	{ id: "abu-daud", nameId: "Sunan Abu Daud", nameEn: "Sunan Abi Dawud" },
	{ id: "ibnu-majah", nameId: "Sunan Ibnu Majah", nameEn: "Sunan Ibn Majah" },
	{ id: "ahmad", nameId: "Musnad Ahmad", nameEn: "Musnad Ahmad" },
	{ id: "darimi", nameId: "Sunan Darimi", nameEn: "Sunan ad-Darimi" },
	{ id: "malik", nameId: "Muwaththa Malik", nameEn: "Muwatta Malik" },
];

// Curated daily verses as [surahNumber, ayahInSurah] — extracted verbatim from quran.json.
const DAILY_VERSE_PICKS = [
	[1, 5],
	[2, 152],
	[2, 186],
	[13, 28],
	[16, 128],
	[20, 14],
	[55, 13],
	[65, 3],
	[94, 5],
	[94, 6],
	[103, 1],
];

// Arabic names for the 114 surahs (index 0 = surah 1).
const SURAH_ARABIC_NAMES = [
	"الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف",
	"الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
	"النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون",
	"النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
	"لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر",
	"غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد",
	"الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
	"الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة",
	"المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة",
	"المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان",
	"المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين",
	"الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
	"الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة",
	"الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل",
	"قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص",
	"الفلق", "الناس",
];

console.log("=== Quran ===");
const quran = readRaw("quran.json");

const surahIndex = quran.map((s) => ({
	number: s.number,
	name: s.name,
	arabic: SURAH_ARABIC_NAMES[s.number - 1] ?? null,
	translation: s.translation,
	revelation: s.revelation,
	numberOfAyahs: s.numberOfAyahs,
	audio: s.audio ?? null,
	bismillah: s.bismillah
		? { arab: s.bismillah.arab, translation: s.bismillah.translation }
		: null,
}));
writeOut("app/data/surah-index.json", surahIndex);

for (const s of quran) {
	writeOut(`public/data/quran/${s.number}.json`, s);
}

const daily = DAILY_VERSE_PICKS.map(([surah, ayah]) => {
	const s = quran.find((x) => x.number === surah);
	const a = s?.ayahs.find((x) => x.number.inSurah === ayah);
	return a
		? {
				surah,
				ayah,
				arab: a.arab,
				translation: a.translation,
				audio: a.audio.alafasy,
			}
		: null;
}).filter(Boolean);
writeOut("app/data/daily.json", daily);

console.log("\n=== Hadith ===");
const books = HADITH_BOOKS.map((b) => {
	const hadiths = readRaw(`${b.id}.json`);
	const chunks = [];
	for (let i = 0; i < hadiths.length; i += CHUNK_SIZE) {
		const slice = hadiths.slice(i, i + CHUNK_SIZE);
		const start = slice[0].number;
		const end = slice[slice.length - 1].number;
		writeOut(`public/data/hadith/${b.id}/${start}-${end}.json`, slice);
		chunks.push({ start, end, file: `${b.id}/${start}-${end}.json` });
	}
	return {
		id: b.id,
		nameId: b.nameId,
		nameEn: b.nameEn,
		total: hadiths.length,
		chunks,
	};
});
writeOut("app/data/hadith-books.json", books);

console.log("\nDone.");
