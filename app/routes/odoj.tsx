import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Route } from "./+types/odoj";

export function meta({}: Route.MetaArgs) {
	return [{ title: "One Day One Juz | Moozhaf" }];
}

type Group = { id: string; name: string; token: string } | null;
type Participant = { id: string; name: string };
type Assignment = { juz_number: number; participant_id: string; name: string; status: string; id: string };

// helper api
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		headers: { "Content-Type": "application/json" },
		...opts,
	});
	if (!res.ok) {
		const d = (await res.json().catch(() => ({}))) as { error?: string };
		throw new Error(d.error || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

function todayStr() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type FetchState<T> = { data: T | null; loading: boolean; error: string };

export default function OdojAdmin() {
	const nav = useNavigate();
	const [auth, setAuth] = useState<FetchState<{ user?: { id: string; email: string } | null }>>({
		data: null,
		loading: true,
		error: "",
	});
	const [group, setGroup] = useState<FetchState<{ group: Group }>>({ data: null, loading: true, error: "" });

	// auth check on mount
	useEffect(() => {
		api<{ ok?: boolean; user?: { id: string; email: string } | null } | { error?: string }>("/api/auth/me")
			.then((d) => {
				if (d && "error" in d) {
					nav("/login", { replace: true, state: { from: "/odoj" } });
				} else {
					setAuth({ data: d as { user?: { id: string; email: string } | null }, loading: false, error: "" });
				}
			})
			.catch(() => nav("/login", { replace: true, state: { from: "/odoj" } }));
	}, [nav]);

	// check group
	function loadGroup() {
		setGroup({ data: null, loading: true, error: "" });
		api<{ group: Group }>("/api/odoj/groups/me")
			.then((d) => setGroup({ data: d, loading: false, error: "" }))
			.catch((e) => setGroup({ data: null, loading: false, error: (e as Error).message }));
	}
	useEffect(() => {
		if (auth.data && auth.data.user) loadGroup();
	}, [auth.data]);

	if (auth.loading || auth.error) return <div className="p-8 text-center">Memuat…</div>;
	if (!auth.data?.user) return <div className="p-8 text-center">Redirecting…</div>;

	// belum punya group → setup
	const hasGroup = group.data?.group;

	return (
		<div className="mx-auto max-w-4xl space-y-6 p-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">One Day One Juz</h1>
					<p className="text-sm text-muted-foreground">
						Admin: {auth.data.user.email}
					</p>
				</div>
				<div className="flex gap-2">
					<Link to="/odoj/history">
						<Button variant="outline">Riwayat</Button>
					</Link>
					<Button
						variant="ghost"
						onClick={async () => {
							await fetch("/api/auth/logout", { method: "POST" });
							nav("/login");
						}}
					>
						Keluar
					</Button>
				</div>
			</div>

			{group.loading ? (
				<div className="p-6 text-center text-muted-foreground">Memuat group…</div>
			) : hasGroup ? (
				<Dashboard group={hasGroup} onGroupRefresh={loadGroup} />
			) : (
				<GroupSetup onCreated={loadGroup} />
			)}
		</div>
	);
}

// ── Setup group (belum punya) ───────────────────────────────
function GroupSetup({ onCreated }: { onCreated: () => void }) {
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function create() {
		if (!name.trim()) {
			setError("Nama group wajib");
			return;
		}
		setLoading(true);
		try {
			await api("/api/odoj/groups", { method: "POST", body: JSON.stringify({ name }) });
			onCreated();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Buat Group ODOJ</CardTitle>
				<CardDescription>Buat group untuk mulai menugaskan juz ke peserta</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && <p className="text-sm text-red-600">{error}</p>}
				<div className="space-y-2">
					<Label htmlFor="gname">Nama Group</Label>
					<Input id="gname" placeholder="contoh: Group Tahfidz Masjid" value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<Button onClick={create} disabled={loading}>{loading ? "Membuat…" : "Buat Group"}</Button>
			</CardContent>
		</Card>
	);
}

// ── Main dashboard (assign + kelola nama + share) ───────────
function Dashboard({ group, onGroupRefresh }: { group: NonNullable<Group>; onGroupRefresh: () => void }) {
	const [date, setDate] = useState(todayStr());
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [assign, setAssign] = useState<Assignment[]>([]);
	const [newName, setNewName] = useState("");
	const [loading, setLoading] = useState(true);

	function loadAll() {
		setLoading(true);
		Promise.all([
			api<{ list: Participant[] }>("/api/odoj/participants"),
			api<{ date: string; list: Assignment[] }>(`/api/odoj/assignments?date=${date}`),
		])
			.then(([p, a]) => {
				setParticipants(p.list);
				setAssign(a.list);
			})
			.catch((e) => alert((e as Error).message))
			.finally(() => setLoading(false));
	}

	useEffect(() => {
		loadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [date]);

	async function addParticipant() {
		if (!newName.trim()) return;
		try {
			const r = await api<{ participant: Participant }>("/api/odoj/participants", {
				method: "POST",
				body: JSON.stringify({ name: newName }),
			});
			setParticipants((prev) => [...prev, r.participant]);
			setNewName("");
		} catch (e) {
			alert((e as Error).message);
		}
	}

	async function removeParticipant(id: string) {
		try {
			await api(`/api/odoj/participants/${id}`, { method: "DELETE" });
			setParticipants((prev) => prev.filter((p) => p.id !== id));
		} catch (e) {
			alert((e as Error).message);
		}
	}

	async function setAssignment(juz: number, pid: string) {
		try {
			await api("/api/odoj/assignments", {
				method: "PUT",
				body: JSON.stringify({ date, juz_number: juz, participant_id: pid }),
			});
			loadAll();
		} catch (e) {
			alert((e as Error).message);
		}
	}

	async function toggleDone(assignId: string, current: string) {
		try {
			const action = current === "done" ? "undone" : "done";
			await api(`/api/odoj/assignments/${assignId}/${action}`, { method: "PUT" });
			loadAll();
		} catch (e) {
			alert((e as Error).message);
		}
	}

	// map juz -> assignment
	const assignMap = new Map<number, Assignment>();
	for (const a of assign) assignMap.set(a.juz_number, a);

	const doneCount = assign.filter((a) => a.status === "done").length;
	const linkView = group.token
		? `${window.location.origin}/odoj/view?group=${group.token}&date=${date}`
		: "";

	return (
		<div className="space-y-6">
			{/* Share link + date */}
			<Card>
				<CardContent className="space-y-3 pt-6">
					<div className="flex flex-wrap items-end gap-3">
						<div className="space-y-2">
							<Label>Tanggal</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
						</div>
						<Badge variant="secondary">{doneCount}/{assign.length} selesai</Badge>
					</div>
					{linkView && (
						<div className="flex gap-2">
							<Input readOnly value={linkView} className="flex-1 font-mono text-xs" />
							<Button variant="outline" onClick={() => { navigator.clipboard.writeText(linkView); alert("Link view disalin"); }}>
								Salin Link View
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Kelola nama */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Kelola Nama Peserta</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex gap-2">
						<Input placeholder="Nama peserta" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addParticipant()} />
						<Button onClick={addParticipant}>Tambah</Button>
					</div>
					<div className="flex flex-wrap gap-2">
						{participants.map((p) => (
							<Badge key={p.id} variant="secondary" className="gap-2 py-1">
								{p.name}
								<button className="text-muted-foreground hover:text-red-500" onClick={() => removeParticipant(p.id)} title="Hapus">
									×
								</button>
							</Badge>
						))}
						{participants.length === 0 && <span className="text-sm text-muted-foreground">Belum ada peserta</span>}
					</div>
				</CardContent>
			</Card>

			{/* Assign 30 juz */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Assign Juz 1–30</CardTitle>
					<CardDescription>Pilih peserta utk tiap juz. Kosong = belum di-assign.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{loading ? (
						<div className="p-4 text-center text-muted-foreground">Memuat…</div>
					) : (
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
							{Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
								const a = assignMap.get(juz);
								return (
									<div key={juz} className={`rounded-lg border p-2 ${a ? "border-green-300 dark:border-green-700" : "border-red-300 dark:border-red-800"}`}>
										<div className="mb-1 flex items-center justify-between">
											<span className="text-sm font-semibold">Juz {juz}</span>
											{a && (
												<button
													className={`text-xs ${a.status === "done" ? "text-green-600" : "text-muted-foreground"}`}
													onClick={() => toggleDone(a.id, a.status)}
												>
													{a.status === "done" ? "✓" : "○"}
												</button>
											)}
										</div>
										<select
											className="w-full rounded border bg-transparent text-sm"
											value={a?.participant_id || ""}
											onChange={(e) => setAssignment(juz, e.target.value)}
										>
											<option value="">— kosong —</option>
											{participants.map((p) => (
												<option key={p.id} value={p.id}>{p.name}</option>
											))}
										</select>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
