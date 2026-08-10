import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "./+types/odoj-history";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Riwayat ODOJ | Moozhaf" }];
}

type HistoryRow = { date: string; done: number; assigned: number };

export default function OdojHistory() {
	const nav = useNavigate();
	const [rows, setRows] = useState<HistoryRow[] | null>(null);
	const [authErr, setAuthErr] = useState(false);

	useEffect(() => {
		// auth guard via api (redirect to login if 401)
		fetch("/api/odoj/history")
			.then((res) => {
				if (res.status === 401) {
					setAuthErr(true);
					return null;
				}
				if (!res.ok) return Promise.reject();
				return res.json();
			})
			.then((d) => d && setRows((d as { list: HistoryRow[] }).list))
			.catch(() => nav("/login", { replace: true }));
	}, [nav]);

	if (authErr) {
		nav("/login", { replace: true });
		return null;
	}

	return (
		<div className="mx-auto max-w-2xl p-4">
			<Card>
				<CardHeader className="flex-row items-center justify-between space-y-0">
					<CardTitle className="text-xl">Riwayat ODOJ</CardTitle>
					<Link to="/odoj">
						<Button variant="outline" size="sm">← Assign</Button>
					</Link>
				</CardHeader>
				<CardContent>
					{!rows ? (
						<div className="p-4 text-center text-muted-foreground">Memuat…</div>
					) : rows.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">Belum ada riwayat penugasan.</p>
					) : (
						<ul className="divide-y">
							{rows.map((r) => (
								<li key={r.date} className="flex items-center justify-between py-3">
									<div>
										<p className="font-medium">{r.date}</p>
										<p className="text-sm text-muted-foreground">
											{r.assigned}/30 terisi · {r.done}/30 selesai
										</p>
									</div>
									<Link to={`/odoj/history/${r.date}`}>
										<Button variant="ghost" size="sm">Detail →</Button>
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
