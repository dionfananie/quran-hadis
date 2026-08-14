import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, CalendarDays, CheckCircle2, Target, MessageSquareShare } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Route } from "./+types/odoj";

export function meta({}: Route.MetaArgs) {
	return [{ title: "One Day One Juz | Moozhaf" }];
}

export default function OdojLanding() {
	const nav = useNavigate();
	const { t } = useI18n();

	function goCreate() {
		nav("/odoj/create");
	}

	// ODOJ perorangan: ambil group user sendiri (token), buka view-nya.
	// Kalau belum punya group, arahkan buat group dulu.
	async function goPersonal() {
		try {
			const res = await fetch("/api/odoj/groups/me");
			const data = (await res.json()) as { group?: { token: string } | null };
			if (!data.group || !data.group.token) {
				nav("/odoj/create");
				return;
			}
			const today = new Date().toISOString().slice(0, 10);
			nav(`/odoj/view?group=${encodeURIComponent(data.group.token)}&date=${encodeURIComponent(today)}`);
		} catch {
			nav("/odoj/create");
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-8 p-4">
			{/* Hero */}
			<div className="text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
					<BookOpen className="size-8" />
				</div>
				<h1 className="font-serif text-3xl font-bold">{t("odoj.title")}</h1>
				<p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("odoj.hero")}</p>
				<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
					<Button onClick={goCreate} size="lg">{t("odoj.ctaStart")}</Button>
					<Button onClick={goCreate} size="lg" variant="outline">{t("odoj.ctaCreateGroup")}</Button>
					<Button onClick={goPersonal} size="lg" variant="secondary">{t("odoj.myOdoj")}</Button>
				</div>
			</div>

			{/* Fitur cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-teal" /> {t("odoj.featMultiGroup")}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{t("odoj.featMultiGroupDesc")}</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><Target className="size-5 text-teal" /> {t("odoj.feat30")}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{t("odoj.feat30Desc")}</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="size-5 text-teal" /> {t("odoj.featSchedule")}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{t("odoj.featScheduleDesc")}</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><MessageSquareShare className="size-5 text-teal" /> {t("odoj.featShare")}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{t("odoj.featShareDesc")}</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="size-5 text-teal" /> {t("odoj.featTrack")}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{t("odoj.featTrackDesc")}</CardDescription>
					</CardContent>
				</Card>
			</div>

			{/* CTA bawah */}
			<div className="rounded-2xl border bg-accent/40 p-8 text-center">
				<h2 className="text-xl font-semibold">{t("odoj.ready")}</h2>
				<p className="mt-1 text-muted-foreground">{t("odoj.readyDesc")}</p>
				<Button onClick={goCreate} size="lg" className="mt-4">{t("odoj.ctaCreateGroup")}</Button>
			</div>
		</div>
	);
}
