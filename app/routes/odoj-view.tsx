import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
	CheckCircle2,
	Circle,
	BookOpen,
	Users,
	CalendarDays,
	User,
	Award,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/odoj-view";

export function meta({}: Route.MetaArgs) {
	return [{ title: "View ODOJ | Moozhaf" }];
}

type ViewRow = { juz_number: number; participant_name: string; token: string; status: string };

type ViewData = { date: string; group_name: string; admin_name?: string | null; list: ViewRow[] };

type Tab = "all" | "pending" | "done";

const ALL_JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

export default function OdojView() {
	const { t } = useI18n();
	const [params] = useSearchParams();
	const [data, setData] = useState<ViewData | null>(null);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<Tab>("all");

	const groupToken = params.get("group");
	const date = params.get("date") || "";

	useEffect(() => {
		if (!groupToken || !date) {
			setError(true);
			setLoading(false);
			return;
		}
		fetch(`/api/odoj/view?group=${encodeURIComponent(groupToken)}&date=${encodeURIComponent(date)}`)
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((d) => {
				setData(d as ViewData | null);
				setLoading(false);
			})
			.catch(() => {
				setError(true);
				setLoading(false);
			});
	}, [groupToken, date]);

	if (loading) return <div className="p-12 text-center text-muted-foreground">{t("odoj.loading")}</div>;

	if (error || !data) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-4">
				<Card>
					<CardContent className="p-6 text-center">
						<p className="text-lg font-semibold">Link tidak valid</p>
						<p className="text-sm text-muted-foreground">
							Belum ada penugasan untuk tanggal ini, atau link salah.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const rows = data.list;
	const done = rows.filter((r) => r.status === "done").length;
	const pending = rows.length - done;
	const percent = rows.length > 0 ? Math.round((done / rows.length) * 100) : 0;

	// Peta juz 1-30: assigned = ada nama, done = selesai
	const byJuz = new Map(rows.map((r) => [r.juz_number, r]));
	const juzDone = ALL_JUZ.filter((n) => byJuz.get(n)?.status === "done").length;

	const filtered =
		tab === "all" ? rows : tab === "done" ? rows.filter((r) => r.status === "done") : rows.filter((r) => r.status !== "done");

	return (
		<div className="mx-auto max-w-3xl px-4 py-6">
			{/* Top header bar */}
			<header className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground flex items-center justify-between shadow-sm">
				<div className="flex items-center gap-3">
					<BookOpen className="size-5 opacity-90" />
					<span className="font-serif text-lg font-bold">One Day One Juz</span>
				</div>
				<div className="text-xs font-mono opacity-80">{data.date}</div>
			</header>

			<div className="mt-6 space-y-6">
				{/* Group Info */}
				<section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
					<div className="border-b flex items-center gap-2 bg-primary/5 px-5 py-3">
						<Users className="size-4 text-primary" />
						<h2 className="text-sm font-semibold text-primary">
							Info Group
						</h2>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-5 px-5 py-5">
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
								<Users className="size-4 text-primary" />
							</div>
							<div className="min-w-0">
								<p className="mb-0.5 text-xs font-medium text-muted-foreground">
									Nama Group
								</p>
								<p className="text-sm font-semibold leading-snug">{data.group_name}</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
								<CalendarDays className="size-4 text-primary" />
							</div>
							<div className="min-w-0">
								<p className="mb-0.5 text-xs font-medium text-muted-foreground">
									Tanggal
								</p>
								<p className="text-sm font-semibold leading-snug">{data.date}</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
								<User className="size-4 text-primary" />
							</div>
							<div className="min-w-0">
								<p className="mb-0.5 text-xs font-medium text-muted-foreground">
									{t("odoj.viewAdmin")}
								</p>
								<p className="text-sm font-semibold leading-snug">
									{data.admin_name || "—"}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Accomplishment summary */}
				<section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
					<div className="border-b flex items-center gap-2 bg-primary/5 px-5 py-3">
						<Award className="size-4 text-primary" />
						<h2 className="text-sm font-semibold text-primary">
							Rekap Kemajuan
						</h2>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 divide-x divide-border border-b">
						<div className="px-5 py-5 text-center">
							<p className="font-serif text-3xl font-bold text-primary">{data.list.length}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Juz ditugaskan
							</p>
						</div>
						<div className="px-5 py-5 text-center">
							<p className="font-serif text-3xl font-bold text-green">{done}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Selesai dibaca
							</p>
						</div>
						<div className="px-5 py-5 text-center">
							<p className="font-serif text-3xl font-bold text-accent">{pending}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Belum selesai
							</p>
						</div>
					</div>

					{/* Progress */}
					<div className="px-5 py-5">
						<div className="mb-2 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<TrendingUp className="size-3.5 text-primary" />
								<span className="text-xs font-medium text-muted-foreground">
									Progres Keseluruhan
								</span>
							</div>
							<span className="text-sm font-bold text-primary">{percent}%</span>
						</div>
						<Progress value={percent} />

						{/* Juz completion map */}
						<div className="mt-5">
							<p className="mb-3 text-xs text-muted-foreground">
								Peta Juz 1–30
							</p>
							<div className="grid grid-cols-10 gap-1.5">
								{ALL_JUZ.map((n) => {
									const row = byJuz.get(n);
									const isDone = row?.status === "done";
									const isAssigned = !!row;
									return (
										<div
											key={n}
											title={
												row
													? `Juz ${n} — ${row.participant_name}${isDone ? " ✓" : ""}`
													: `Juz ${n} — belum ditugaskan`
											}
											className={cn(
												"aspect-square flex items-center justify-center rounded-md font-serif text-[11px] font-semibold select-none transition-transform hover:scale-110 cursor-default",
												isDone && "bg-primary text-primary-foreground",
												!isDone && isAssigned && "bg-primary/15 text-primary",
												!isAssigned && "bg-muted text-muted-foreground/50",
											)}
										>
											{n}
										</div>
									);
								})}
							</div>
							<div className="mt-3 flex items-center gap-4">
								<div className="flex items-center gap-1.5">
									<div className="size-3 rounded-sm bg-primary" />
									<span className="text-xs text-muted-foreground">Selesai</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="size-3 rounded-sm bg-primary/15 border border-primary/30" />
									<span className="text-xs text-muted-foreground">Ditugaskan</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="size-3 rounded-sm bg-muted border border-border" />
									<span className="text-xs text-muted-foreground">Kosong</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Reader list */}
				<section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
					<div className="border-b flex items-center justify-between gap-2 bg-primary/5 px-5 py-3">
						<div className="flex items-center gap-2">
							<BookOpen className="size-4 text-primary" />
							<h2 className="text-sm font-semibold text-primary">
								Daftar Penugasan
							</h2>
						</div>
						<div className="flex items-center gap-1 rounded-lg bg-muted p-1">
							{(["all", "pending", "done"] as const).map((key) => (
								<button
									key={key}
									onClick={() => setTab(key)}
									className={cn(
										"px-3 py-1 text-xs font-medium capitalize rounded-md transition-colors",
										tab === key
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{key}
								</button>
							))}
						</div>
					</div>

					<ul className="divide-y divide-border">
						{filtered.map((row) => (
							<li key={row.token} className="flex items-center gap-4 px-5 py-4">
								{/* Juz badge */}
								<div
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-xl font-serif text-sm font-bold",
										row.status === "done"
											? "bg-primary text-primary-foreground"
											: "bg-primary/15 text-primary",
									)}
								>
									{row.juz_number}
								</div>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">
										{row.participant_name}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Juz {row.juz_number}
									</p>
								</div>

								{/* Status badge */}
								<span
									className={cn(
										"hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
										row.status === "done"
											? "bg-primary/15 text-primary"
											: "bg-accent text-accent-foreground",
									)}
								>
									{row.status === "done" ? "Selesai" : "Belum selesai"}
								</span>

								{/* Action */}
								{row.status === "done" ? (
									<Badge className="bg-green text-white">
										<CheckCircle2 className="size-3.5" /> Selesai
									</Badge>
								) : (
									<Link to={`/quran/juz/${row.juz_number}?odoj_token=${row.token}`}>
										<Button size="sm" variant="outline">
											<Circle className="size-3.5" /> Baca Juz Ini
										</Button>
									</Link>
								)}
							</li>
						))}
					</ul>

					{filtered.length === 0 && (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Tidak ada penugasan pada kategori ini.
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
