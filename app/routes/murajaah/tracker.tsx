import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getSurahIndex } from "@/lib/data/quran";
import juzData from "@/data/juz.json";

type Mode = "juz" | "surah";
type JuzMeta = { juz: number; start: { surah: number; ayah: number }; end: { surah: number; ayah: number } };

export function meta() {
	return [{ title: "Tracker Hafalan | Moozhaf" }];
}

export default function Tracker() {
	const nav = useNavigate();
	const { t } = useI18n();
	const [mode, setMode] = useState<Mode>("juz");
	const [doneJuz, setDoneJuz] = useState<Record<number, boolean>>({});
	const [doneSurah, setDoneSurah] = useState<Record<number, boolean>>({});
	const [todayDoneJuz, setTodayDoneJuz] = useState<Set<number>>(new Set());
	const [todayDoneSurah, setTodayDoneSurah] = useState<Set<number>>(new Set());
	const [loading, setLoading] = useState(true);

	const surahIndex = useMemo(() => getSurahIndex(), []);
	const juzList = useMemo<JuzMeta[]>(() => juzData as JuzMeta[], []);

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const [jr, ur, mr] = await Promise.all([
					fetch("/api/hafalan/juz"),
					fetch("/api/hafalan/surah"),
					fetch("/api/murojaah"),
				]);
				if (!jr.ok || !ur.ok || !mr.ok) throw new Error("unauth");
				const jl = (await jr.json()) as { list: { juz_number: number; done: number }[] };
				const ul = (await ur.json()) as { list: { surah_number: number; done: number }[] };
				const md = (await mr.json()) as { today: string; list: { date: string; mode: Mode; ref_number: number }[] };
				if (!alive) return;
				setDoneJuz(Object.fromEntries(jl.list.map((x) => [x.juz_number, !!x.done])));
				setDoneSurah(Object.fromEntries(ul.list.map((x) => [x.surah_number, !!x.done])));
				const todayDone = md.list.filter((x) => x.date === md.today);
				setTodayDoneJuz(new Set(todayDone.filter((x) => x.mode === "juz").map((x) => x.ref_number)));
				setTodayDoneSurah(new Set(todayDone.filter((x) => x.mode === "surah").map((x) => x.ref_number)));
			} catch {
				if (alive) nav("/login", { replace: true, state: { from: "/murajaah/tracker" } });
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [nav]);

	// Centang hafalan (persisten) via API.
	async function toggleHafalan(m: Mode, n: number) {
		if (m === "juz") {
			const next = !doneJuz[n];
			setDoneJuz((s) => ({ ...s, [n]: next }));
			await fetch(`/api/hafalan/juz/${n}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ done: next }),
			});
		} else {
			const next = !doneSurah[n];
			setDoneSurah((s) => ({ ...s, [n]: next }));
			await fetch(`/api/hafalan/surah/${n}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ done: next }),
			});
		}
	}

	// Centang murajaah hari ini via API (toggle).
	async function toggleMurajaah(m: Mode, n: number) {
		const res = await fetch("/api/murojaah", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ mode: m, ref_number: n }),
		});
		const data = (await res.json()) as { checked?: boolean };
		const checked = !!data.checked;
		if (m === "juz") {
			setTodayDoneJuz((s) => {
				const n2 = new Set(s);
				if (checked) n2.add(n);
				else n2.delete(n);
				return n2;
			});
		} else {
			setTodayDoneSurah((s) => {
				const n2 = new Set(s);
				if (checked) n2.add(n);
				else n2.delete(n);
				return n2;
			});
		}
	}

	if (loading) {
		return (
			<div className="mx-auto max-w-3xl p-4">
				<p className="text-center text-muted-foreground">Memuat…</p>
			</div>
		);
	}

	const doneCount = mode === "juz" ? Object.values(doneJuz).filter(Boolean).length : Object.values(doneSurah).filter(Boolean).length;
	const total = mode === "juz" ? 30 : 114;

	return (
		<div className="mx-auto max-w-3xl p-4">
			<Link to="/murajaah" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
				<ArrowLeft className="size-4" /> {t("murajaah.title")}
			</Link>

			<div className="mt-2 flex items-center justify-between gap-3">
				<h1 className="font-serif text-2xl font-bold">{t("murajaah.trackTitle")}</h1>
				<div className="inline-flex rounded-lg border p-1">
					<button
						onClick={() => setMode("juz")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === "juz" ? "bg-teal text-white dark:bg-teal" : "text-muted-foreground"}`}
					>
						{t("murajaah.modeJuz")}
					</button>
					<button
						onClick={() => setMode("surah")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === "surah" ? "bg-teal text-white dark:bg-teal" : "text-muted-foreground"}`}
					>
						{t("murajaah.modeSurah")}
					</button>
				</div>
			</div>
			<p className="mt-1 text-sm text-muted-foreground">{t("murajaah.trackDesc")}</p>
			<p className="mt-2 text-sm">
				<span className="font-semibold text-teal">{doneCount}/{total}</span>{" "}
				<span className="text-muted-foreground">{t("murajaah.done")}</span>
			</p>

			<div className="mt-4 space-y-2">
				{mode === "juz"
					? juzList.map((j) => {
							const memorized = doneJuz[j.juz];
							const today = todayDoneJuz.has(j.juz);
							return (
								<Row
									key={j.juz}
									label={`Juz ${j.juz}`}
									sub={today ? t("murajaah.today") : ""}
									checked={memorized}
									onMemorize={() => toggleHafalan("juz", j.juz)}
									onToday={() => toggleMurajaah("juz", j.juz)}
									todayChecked={today}
									todayLabel={t("murajaah.today")}
									href={`/quran/juz/${j.juz}`}
								/>
							);
					  })
					: surahIndex.map((s) => {
							const memorized = doneSurah[s.number];
							const today = todayDoneSurah.has(s.number);
							return (
								<Row
									key={s.number}
									label={`${s.number}. ${s.name}`}
									sub={s.translation}
									checked={memorized}
									onMemorize={() => toggleHafalan("surah", s.number)}
									onToday={() => toggleMurajaah("surah", s.number)}
									todayChecked={today}
									todayLabel={t("murajaah.today")}
									href={`/quran/${s.number}`}
								/>
							);
					  })}
			</div>
		</div>
	);
}

function Row({
	label,
	sub,
	checked,
	onMemorize,
	onToday,
	todayChecked,
	todayLabel,
	href,
}: {
	label: string;
	sub?: string;
	checked: boolean;
	onMemorize: () => void;
	onToday: () => void;
	todayChecked: boolean;
	todayLabel: string;
	href: string;
}) {
	return (
		<Card className="p-0">
			<CardContent className="flex items-center gap-3 p-3">
				<button
					onClick={onMemorize}
					aria-label={`Toggle ${label}`}
					className={`flex size-7 shrink-0 items-center justify-center rounded-md border transition ${
						checked ? "border-teal bg-teal text-white" : "border-border"
					}`}
				>
					{checked && <Check className="size-4" />}
				</button>
				<Link to={href} className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{label}</p>
					{sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
				</Link>
				<Button
					variant={todayChecked ? "secondary" : "outline"}
					size="sm"
					onClick={(e) => {
						e.preventDefault();
						onToday();
					}}
				>
					{todayChecked ? "✓" : ""} {todayLabel}
				</Button>
			</CardContent>
		</Card>
	);
}
