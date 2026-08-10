import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { Route } from "./+types/odoj-view";

export function meta({}: Route.MetaArgs) {
	return [{ title: "View ODOJ | Moozhaf" }];
}

type ViewRow = { juz_number: number; participant_name: string; token: string; status: string };

type ViewData = { date: string; group_name: string; admin_name?: string | null; list: ViewRow[] };

export default function OdojView() {
	const { t } = useI18n();
	const [params] = useSearchParams();
	const [data, setData] = useState<ViewData | null>(null);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);

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

	if (loading) return <div className="p-12 text-center text-muted-foreground">Memuat…</div>;

	if (error || !data) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-4">
				<Card>
					<CardContent className="p-6 text-center">
						<p className="text-lg font-semibold">Link tidak valid</p>
						<p className="text-sm text-muted-foreground">Belum ada penugasan untuk tanggal ini, atau link salah.</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const done = data.list.filter((r) => r.status === "done").length;

	return (
		<div className="mx-auto max-w-3xl p-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-xl">{data.group_name}</CardTitle>
					{data.admin_name && (
						<p className="text-sm font-medium text-foreground/80">
							{t("odoj.viewAdmin")}: {data.admin_name}
						</p>
					)}
					<p className="text-sm text-muted-foreground">
						{data.date}
					</p>
					<Badge variant="secondary" className="w-fit">{done}/{data.list.length} selesai</Badge>
				</CardHeader>
				<CardContent>
					{data.list.length === 0 ? (
						<p className="text-center text-muted-foreground">Belum ada penugasan untuk tanggal ini.</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground">
									<th className="py-2 pr-2 font-medium">Juz</th>
									<th className="py-2 pr-2 font-medium">Nama</th>
									<th className="py-2 font-medium text-right">Status</th>
								</tr>
							</thead>
							<tbody>
								{data.list.map((row) => (
									<tr key={row.token} className="border-b last:border-0">
										<td className="py-2 pr-2 font-medium">Juz {row.juz_number}</td>
										<td className="py-2 pr-2">{row.participant_name}</td>
										<td className="py-2 text-right">
											{row.status === "done" ? (
												<Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">✓ Selesai</Badge>
											) : (
												<Link to={`/juz/${row.juz_number}?odoj_token=${row.token}`}>
													<Button size="sm" variant="outline">Baca Juz Ini</Button>
												</Link>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
