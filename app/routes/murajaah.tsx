import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck, CheckCircle2, ListChecks, CalendarDays, Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type MurojaahStats = {
	total_days: number;
	today_done: number;
	today: string;
	list: {
		id: string;
		date: string;
		mode: string;
		ref_number: number;
		note: string | null;
	}[];
};
type HafalanList = { juz_number: number; done: number }[];
type HafalanSurah = { surah_number: number; done: number }[];

export function meta() {
	return [{ title: "Murojaah | Moozhaf" }];
}

export default function Murajaah() {
	const nav = useNavigate();
	const { t } = useI18n();
	const [stats, setStats] = useState<MurojaahStats | null>(null);
	const [hafalanJuz, setHafalanJuz] = useState<HafalanList>([]);
	const [hafalanSurah, setHafalanSurah] = useState<HafalanSurah>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const [sr, jr, ur] = await Promise.all([
					fetch("/api/murojaah"),
					fetch("/api/hafalan/juz"),
					fetch("/api/hafalan/surah"),
				]);
				if (!sr.ok) throw new Error("unauth");
				const d = (await sr.json()) as MurojaahStats;
				const j = (await jr.json()) as { list: HafalanList };
				const u = (await ur.json()) as { list: HafalanSurah };
				if (!alive) return;
				setStats(d);
				setHafalanJuz(j.list || []);
				setHafalanSurah(u.list || []);
			} catch {
				if (alive) nav("/login", { replace: true, state: { from: "/murajaah" } });
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [nav]);

	if (loading) {
		return (
			<div className="mx-auto max-w-3xl p-4">
				<p className="text-center text-muted-foreground">Memuat…</p>
			</div>
		);
	}

	const doneJuz = hafalanJuz.filter((x) => x.done).length;
	const doneSurah = hafalanSurah.filter((x) => x.done).length;

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-4">
			{/* Header */}
			<div className="text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
					<BookOpenCheck className="size-8" />
				</div>
				<h1 className="font-serif text-3xl font-bold">{t("murajaah.title")}</h1>
				<p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("murajaah.tagline")}</p>
			</div>

			{/* Stats grid */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<CalendarDays className="size-4 text-teal" /> {t("murajaah.totalDays")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">{stats?.total_days ?? 0}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<CheckCircle2 className="size-4 text-teal" /> {t("murajaah.todayDone")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">{stats?.today_done ?? 0}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Target className="size-4 text-teal" /> {t("murajaah.progressJuz")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">
							{doneJuz}<span className="text-base font-normal text-muted-foreground">/30</span>
						</p>
					</CardContent>
				</Card>
			</div>

			{/* CTA ke tracker */}
			<Card className="border-teal/30 bg-accent/40">
				<CardContent className="flex flex-col items-center gap-4 p-6 text-center">
					<ListChecks className="size-8 text-teal" />
					<div>
						<p className="text-lg font-semibold">{t("murajaah.trackTitle")}</p>
						<p className="mt-1 text-sm text-muted-foreground">{t("murajaah.trackDesc")}</p>
					</div>
					<Link to="/murajaah/tracker">
						<Button size="lg">{t("murajaah.openTracker")}</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Riwayat singkat hari ini */}
			{stats && stats.list.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("murajaah.today")} · {stats.today}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						{stats.list
							.filter((x) => x.date === stats.today)
							.map((x) => (
								<span
									key={x.id}
									className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal"
								>
									<CheckCircle2 className="size-3" />
									{x.mode === "juz" ? `Juz ${x.ref_number}` : `Surah ${x.ref_number}`}
								</span>
							))}
						{stats.list.filter((x) => x.date === stats.today).length === 0 && (
							<p className="text-sm text-muted-foreground">{t("murajaah.noData")}</p>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
