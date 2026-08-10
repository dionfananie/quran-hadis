import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "./+types/odoj-history-date";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Detail Riwayat | Moozhaf" }];
}

type Row = { juz_number: number; participant_id: string; name: string; status: string; id: string };

export default function OdojHistoryDate() {
	const { date } = useParams<{ date: string }>();
	const nav = useNavigate();
	const [rows, setRows] = useState<Row[] | null>(null);

	useEffect(() => {
		if (!date) return;
		fetch(`/api/odoj/assignments?date=${date}`)
			.then((res) => {
				if (res.status === 401) {
					nav("/login", { replace: true });
					return null;
				}
				if (!res.ok) return Promise.reject();
				return res.json();
			})
			.then((d) => d && setRows((d as { list: Row[] }).list))
			.catch(() => nav("/login", { replace: true }));
	}, [date, nav]);

	async function toggle(id: string, current: string) {
		try {
			await fetch(`/api/odoj/assignments/${id}/${current === "done" ? "undone" : "done"}`, {
				method: "PUT",
			});
			setRows((prev) =>
				prev
					? prev.map((r) =>
							r.id === id
								? { ...r, status: current === "done" ? "assigned" : "done" }
								: r,
						)
					: prev,
			);
		} catch {}
	}

	if (!date) return null;

	const done = rows?.filter((r) => r.status === "done").length || 0;

	return (
		<div className="mx-auto max-w-2xl p-4">
			<Card>
				<CardHeader className="flex-row items-center justify-between space-y-0">
					<div>
						<CardTitle className="text-xl">{date}</CardTitle>
						<p className="text-sm text-muted-foreground">{rows ? `${done}/${rows.length} selesai` : "…"}</p>
					</div>
					<div className="flex gap-2">
						<Link to="/odoj/history">
							<Button variant="outline" size="sm">← List</Button>
						</Link>
						<Link to={`/odoj/create?date=${date}`}>
							<Button variant="outline" size="sm">Edit Assign</Button>
						</Link>
					</div>
				</CardHeader>
				<CardContent>
					{!rows ? (
						<p className="p-4 text-center text-muted-foreground">Memuat…</p>
					) : rows.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">Tidak ada penugasan pada tanggal ini.</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground">
									<th className="py-2 font-medium">Juz</th>
									<th className="py-2 font-medium">Nama</th>
									<th className="py-2 text-right font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.id} className="border-b last:border-0">
										<td className="py-2 pr-2 font-medium">Juz {r.juz_number}</td>
										<td className="py-2">{r.name}</td>
										<td className="py-2 text-right">
											<Button
												size="sm"
												variant={r.status === "done" ? "default" : "outline"}
												onClick={() => toggle(r.id, r.status)}
											>
												{r.status === "done" ? "✓ Selesai" : "Belum"}
											</Button>
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
