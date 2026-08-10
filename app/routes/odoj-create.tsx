import { useEffect, useMemo, useState } from "react";
import * as Toast from "radix-ui/toast";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Plus, X, Check, Users, Calendar, Share2, Star, ChevronDown, Trash2, Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Route } from "./+types/odoj-create";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Buat ODOJ | Moozhaf" }];
}

// ── Types & helpers ─────────────────────────────────────────────
type Group = { id: string; name: string; token: string };
type Participant = { id: string; name: string };
type Assignment = { id: string; juz_number: number; participant_id: string; name: string; status: string };

const JUZ_NAMES: Record<number, string> = {
	1: "Alif Lam Mim", 2: "Sayaqul", 3: "Tilka'r-Rusul", 4: "Lan Tana Lu", 5: "Wal Muhsanat",
	6: "La Yuhibbullah", 7: "Wa Iza Sami'u", 8: "Wa Law Annana", 9: "Qalal Mala", 10: "Wa A'lamu",
	11: "Ya'tadhirun", 12: "Wa Ma Min Dabbah", 13: "Wa Ma Ubarri'u", 14: "Rubama", 15: "Subhanalladhi",
	16: "Qal Alam", 17: "Iqtaraba", 18: "Qad Aflaha", 19: "Wa Qalallathina", 20: "Amman Khalaqa",
	21: "Utlu Ma Uhiya", 22: "Wa Man Yaqnut", 23: "Wa Mali", 24: "Faman Azlamu", 25: "Ilayhi Yuraddu",
	26: "Ha Mim", 27: "Qala Fama Khatbukum", 28: "Qad Sami Allah", 29: "Tabaraka'lladhi", 30: "Amma Yatasa'alun",
};

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

function shortDate(s: string) {
	if (!s) return "";
	const d = new Date(s + "T00:00:00");
	return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function isTodayStr(s: string) { return s === todayStr(); }
function isPastStr(s: string) { return s < todayStr(); }

// Progress ring (SVG, theme Moozhaf via currentColor)
function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
	const r = (size - 8) / 2;
	const circ = 2 * Math.PI * r;
	const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
	return (
		<svg width={size} height={size} className="rotate-[-90deg] text-teal dark:text-primary">
			<circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" className="stroke-muted" />
			<circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" strokeLinecap="round"
				strokeDasharray={circ} strokeDashoffset={offset} className="stroke-current transition-all duration-700" />
		</svg>
	);
}

// ── Main page ──────────────────────────────────────────────────────
export default function OdojCreate() {
	const nav = useNavigate();
	const { t } = useI18n();
	const [searchParams] = useSearchParams();
	const urlDate = searchParams.get("date") || "";
	const initDate = /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? urlDate : todayStr();

	const [authChecked, setAuthChecked] = useState(false);
	const [group, setGroup] = useState<Group | null>(null);
	const [groupLoading, setGroupLoading] = useState(true);

	// auth guard
	useEffect(() => {
		api<{ user?: { id: string } | null } | { error?: string }>("/api/auth/me")
			.then((d) => {
				if (d && "error" in d) {
					nav("/login", { replace: true, state: { from: "/odoj/create" } });
				} else {
					setAuthChecked(true);
				}
			})
			.catch(() => nav("/login", { replace: true, state: { from: "/odoj/create" } }));
	}, [nav]);

	function loadGroup() {
		setGroupLoading(true);
		api<{ group: Group | null }>("/api/odoj/groups/me")
			.then((d) => setGroup(d.group))
			.catch(() => setGroup(null))
			.finally(() => setGroupLoading(false));
	}
	useEffect(() => {
		if (authChecked) loadGroup();
	}, [authChecked]);

	if (!authChecked) return <div className="p-10 text-center text-muted-foreground">{t("odoj.loading")}</div>;
	if (groupLoading) return <div className="p-10 text-center text-muted-foreground">{t("odoj.loadingGroup")}</div>;

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-4">
			{group ? (
				<AdminDashboard group={group} onGroupRefresh={loadGroup} initDate={initDate} />
			) : (
				<GroupSetup onCreated={loadGroup} />
			)}
		</div>
	);
}

// ── Setup group ────────────────────────────────────────────────────
function GroupSetup({ onCreated }: { onCreated: () => void }) {
	const { t } = useI18n();
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function create() {
		if (!name.trim()) { setError("Nama group wajib"); return; }
		setLoading(true);
		try {
			await api("/api/odoj/groups", { method: "POST", body: JSON.stringify({ name }) });
			onCreated();
		} catch (e) { setError((e as Error).message); }
		finally { setLoading(false); }
	}

	return (
		<div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
			<h1 className="font-serif text-2xl font-bold text-teal dark:text-primary">{t("odoj.createGroupTitle")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">{t("odoj.createGroupDesc")}</p>
			{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder={t("odoj.groupNamePlaceholder")}
				className="mt-4 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
				onKeyDown={(e) => e.key === "Enter" && create()}
			/>
			<button
				onClick={create}
				disabled={loading}
				className="mt-4 w-full rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-primary dark:text-primary-foreground"
			>
				{loading ? t("odoj.created") : t("odoj.createBtn")}
			</button>
		</div>
	);
}

// ── Admin dashboard (revamp Figma flow) ─────────────────────────────
function AdminDashboard({ group, onGroupRefresh, initDate }: { group: Group; onGroupRefresh: () => void; initDate: string }) {
	const { t } = useI18n();
	const [date, setDate] = useState(initDate);
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [assign, setAssign] = useState<Assignment[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [newName, setNewName] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(true);
	const nav = useNavigate();

	function loadAll() {
		setLoading(true);
		Promise.all([
			api<{ list: Participant[] }>("/api/odoj/participants"),
			api<{ list: Assignment[] }>(`/api/odoj/assignments?date=${date}`),
		])
			.then(([p, a]) => { setParticipants(p.list); setAssign(a.list); })
			.catch(() => {})
			.finally(() => setLoading(false));
	}
	useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [date, group.id]);

	async function addParticipant() {
		if (!newName.trim()) return;
		try {
			const r = await api<{ participant: Participant }>("/api/odoj/participants", { method: "POST", body: JSON.stringify({ name: newName }) });
			setParticipants((prev) => [...prev, r.participant]);
			setNewName("");
		} catch {}
	}
	async function removeParticipant(id: string) {
		try {
			await api(`/api/odoj/participants/${id}`, { method: "DELETE" });
			setParticipants((prev) => prev.filter((p) => p.id !== id));
			if (selected === id) setSelected(null);
			loadAll();
		} catch {}
	}
	async function setAssignment(juz: number, pid: string) {
		try {
			await api("/api/odoj/assignments", { method: "PUT", body: JSON.stringify({ date, juz_number: juz, participant_id: pid }) });
			loadAll();
		} catch {}
	}
	async function toggleDone(id: string, current: string) {
		try {
			await api(`/api/odoj/assignments/${id}/${current === "done" ? "undone" : "done"}`, { method: "PUT" });
			loadAll();
		} catch {}
	}
	const copyGroupLink = () => {
		const url = `${window.location.origin}/odoj/view?group=${group.token}&date=${date}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// aggregate
	const juzMap = new Map<number, Assignment>();
	for (const a of assign) juzMap.set(a.juz_number, a);
	const done = assign.filter((a) => a.status === "done");
	const doneJuz = Array.from(new Set(done.map((a) => a.juz_number))).length;
	const totalAssigned = juzMap.size;
	const pct = Math.round((doneJuz / 30) * 100);
	const activeReader = participants.find((p) => p.id === selected);

	const legend = [
		{ cls: "bg-card border border-border", label: "Belum ditetapkan" },
		{ cls: "bg-secondary border border-border", label: "Ditetapkan" },
		{ cls: "bg-amber-100 border border-amber-300", label: "Hari ini" },
		{ cls: "bg-teal dark:bg-primary", label: "Selesai" },
		{ cls: "bg-teal/20 border border-teal", label: "Juz peserta terpilih" },
	];

	return (
		<>
			{/* Header / progress */}
			<div className="rounded-2xl border bg-card p-5">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-gold-surface text-teal dark:text-primary">
							<Moon className="size-5" />
						</div>
						<div>
							<h1 className="font-serif text-xl font-bold text-teal dark:text-primary">One Day One Juz</h1>
							<p className="text-xs text-muted-foreground">Admin: {group.name}</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="hidden text-right sm:block">
							<div className="text-sm font-semibold">{doneJuz}/30 {t("odoj.doneLabel")}</div>
							<div className="text-xs text-muted-foreground">{totalAssigned} {t("odoj.assignTitle").split(" ")[0].toLowerCase()} · {participants.length} peserta</div>
						</div>
						<ProgressRing pct={pct} />
						<div className="flex gap-2">
							<Link to="/odoj/history"><button className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">{t("odoj.history")}</button></Link>
							<button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); nav("/login"); }} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">{t("odoj.logout")}</button>
						</div>
					</div>
				</div>
			</div>

			{/* Share link banner */}
			<div className="rounded-2xl border bg-card p-4">
				<p className="text-sm font-semibold">{t("odoj.linkShare")} <span className="font-normal text-teal dark:text-primary">{t("odoj.linkShareDesc")}</span></p>
				<div className="mt-3 flex items-center gap-2">
					<input readOnly value={`${window.location.origin}/odoj/view?group=${group.token}&date=${date}`}
						className="flex-1 truncate rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs" onFocus={(e) => e.target.select()} />
					<button onClick={copyGroupLink} className="flex flex-shrink-0 items-center gap-2 rounded-lg border-2 border-teal px-3 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-white dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground">
						{copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
						<span className="hidden sm:inline">{copied ? "Tersalin!" : t("odoj.shareGroupLink")}</span>
					</button>
				</div>
			</div>

			<div className="grid lg:grid-cols-[1fr_320px] gap-6">
				{/* Left: juz grid */}
				<div>
					{activeReader && (
						<div className="mb-3 flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm">
							<Star className="size-4 text-teal dark:text-primary" />
							<span>Klik kartu juz untuk tetapkan ke <strong>{activeReader.name}</strong></span>
							<button onClick={() => setSelected(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
						</div>
					)}
					<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
						{Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
							const a = juzMap.get(n);
							const doneJ = a?.status === "done";
							const assignedToSelected = a?.participant_id === selected;
							// tanggal target: Moozhaf pakai date per assign; tampilkan done secara visual
							return (
								<button
									key={n}
									onClick={() => selected && setAssignment(n, selected ? (a?.participant_id === selected ? "" : selected) : "")}
									className={[
										"relative rounded-lg border p-2.5 text-left transition-all",
										selected ? "cursor-pointer hover:scale-[1.02]" : "cursor-default",
										doneJ ? "bg-teal border-teal dark:bg-primary dark:border-primary"
											: assignedToSelected ? "bg-teal/15 border-teal"
											: a ? "bg-secondary border-border"
											: "bg-card border-border",
									].join(" ")}
								>
									<div className="mb-0.5 flex items-start justify-between">
										<span className={`text-[9px] font-semibold tracking-widest ${doneJ ? "text-white/90" : "text-foreground/70"}`}>JUZ</span>
										{doneJ && <Check className="size-3 text-white" />}
									</div>
									<div className={`font-serif text-lg font-bold leading-none ${doneJ ? "text-white" : assignedToSelected ? "text-teal dark:text-primary" : "text-foreground"}`}>{n}</div>
									<div className={`mt-0.5 truncate text-[9px] leading-tight ${doneJ ? "text-white/90" : "text-foreground/80"}`}>{JUZ_NAMES[n]}</div>
									{a && (
										<div className="mt-1 flex flex-wrap gap-0.5">
											<span className={[
												"rounded px-1 py-0.5 text-[9px] font-semibold",
												doneJ ? "bg-white text-teal dark:bg-primary-foreground dark:text-primary"
													: assignedToSelected ? "bg-teal text-white dark:bg-primary dark:text-primary-foreground"
													: "bg-teal text-white dark:bg-primary dark:text-primary-foreground",
											].join(" ")}>{a.name}</span>
										</div>
									)}
								</button>
							);
						})}
					</div>
					<p className="mt-2 text-xs text-muted-foreground">Pilih peserta di kanan, lalu klik kartu juz untuk tetapkan.</p>
				</div>

				{/* Right: settings + participants */}
				<div className="space-y-4">
					{/* Date */}
					<div className="rounded-xl border bg-card p-4">
						<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Calendar className="size-4 text-muted-foreground" /> {t("odoj.date")}</h2>
						<DatePicker value={date} onChange={setDate} />
					</div>

					{/* Add participant */}
					<div className="rounded-xl border bg-card p-4">
						<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-muted-foreground" /> {t("odoj.manageParticipants")}</h2>
						<div className="flex gap-2">
							<input
								value={newName} onChange={(e) => setNewName(e.target.value)}
								placeholder={t("odoj.participantPlaceholder")}
								onKeyDown={(e) => e.key === "Enter" && addParticipant()}
								className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
							/>
							<button onClick={addParticipant} className="rounded-lg bg-teal px-3 py-2 text-white disabled:opacity-40 dark:bg-primary" disabled={!newName.trim()}><Plus className="size-4" /></button>
						</div>
					</div>

					{/* Participants list */}
					<div className="overflow-hidden rounded-xl border bg-card">
						<div className="flex items-center justify-between border-b px-4 py-3">
							<h2 className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-muted-foreground" /> {t("odoj.manageParticipants")} <span className="text-xs font-normal text-muted-foreground">({participants.length})</span></h2>
						</div>
						{participants.length === 0 ? (
							<div className="px-4 py-8 text-center">
								<p className="text-sm text-muted-foreground">{t("odoj.noParticipants")}</p>
							</div>
						) : (
							<ul className="divide-y">
								{participants.map((p) => {
									const pAssign = assign.filter((a) => a.participant_id === p.id);
									const doneCount = pAssign.filter((a) => a.status === "done").length;
									const isSel = selected === p.id;
									const isExp = expanded === p.id;
									return (
										<li key={p.id} className={isSel ? "bg-teal/5" : ""}>
											<div className="flex items-center gap-2 px-4 py-3">
												<button onClick={() => setSelected(isSel ? null : p.id)} className="min-w-0 flex-1 text-left">
													<div className="flex items-center gap-2">
														<div className={`size-2 flex-shrink-0 rounded-full ${isSel ? "bg-teal dark:bg-primary" : "bg-muted-foreground/30"}`} />
														<span className="truncate text-sm font-medium">{p.name}</span>
													</div>
													<div className="ml-4 text-xs text-muted-foreground">{pAssign.length === 0 ? "Belum ada juz" : `${doneCount}/${pAssign.length} ${t("odoj.doneLabel")}`}</div>
												</button>
												<div className="flex flex-shrink-0 items-center gap-1">
													<button onClick={() => setExpanded(isExp ? null : p.id)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><ChevronDown className={`size-4 transition-transform ${isExp ? "rotate-180" : ""}`} /></button>
													<button onClick={() => removeParticipant(p.id)} className="rounded p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="size-4" /></button>
												</div>
											</div>
											{isExp && (
												<div className="px-4 pb-3">
													<div className="flex flex-wrap gap-1">
														{pAssign.length === 0 ? <span className="text-xs italic text-muted-foreground">Belum ditetapkan</span>
															: pAssign.sort((a, b) => a.juz_number - b.juz_number).map((a) => (
																<button key={a.id} onClick={() => toggleDone(a.id, a.status)} title="Klik toggle selesai"
																	className={`rounded px-1.5 py-0.5 text-xs font-medium ${a.status === "done" ? "bg-teal text-white dark:bg-primary" : "bg-secondary"}`}>
																	Juz {a.juz_number}{a.status === "done" ? " ✓" : ""}
																</button>
															))}
													</div>
												</div>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>

					{/* Legend */}
					<div className="rounded-xl border bg-card p-4">
						<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Petunjuk</p>
						<div className="space-y-1.5">
							{legend.map((l) => (
								<div key={l.label} className="flex items-center gap-2">
									<div className={`size-4 flex-shrink-0 rounded ${l.cls}`} />
									<span className="text-xs text-muted-foreground">{l.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

// ── Date picker custom (popup kalender tailwind) ─────────────────────
function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const [open, setOpen] = useState(false);
	const [view, setView] = useState(() => {
		const d = value ? new Date(value + "T00:00:00") : new Date();
		return new Date(d.getFullYear(), d.getMonth(), 1);
	});

	const days = (() => {
		const yr = view.getFullYear();
		const mo = view.getMonth();
		const first = new Date(yr, mo, 1).getDay();
		const dim = new Date(yr, mo + 1, 0).getDate();
		const cells: (Date | null)[] = [];
		for (let i = 0; i < first; i++) cells.push(null);
		for (let d = 1; d <= dim; d++) cells.push(new Date(yr, mo, d));
		return cells;
	})();

	const pick = (d: Date) => {
		onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
		setOpen(false);
	};
	const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
	const monthLabel = view.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
	const sel = value ? new Date(value + "T00:00:00").toDateString() : "";

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex w-full items-center justify-between rounded-lg border bg-transparent px-3 py-2 text-sm"
			>
				<span>{value ? fmt(new Date(value + "T00:00:00")) : "Pilih tanggal"}</span>
				<Calendar className="size-4 text-muted-foreground" />
			</button>
			{open && (
				<div className="absolute left-0 z-40 mt-1 w-full min-w-[260px] rounded-lg border bg-popover p-3 shadow-xl">
					<div className="mb-2 flex items-center justify-between">
						<button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="rounded px-2 py-1 text-sm hover:bg-secondary">‹</button>
						<span className="text-sm font-medium">{monthLabel}</span>
						<button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="rounded px-2 py-1 text-sm hover:bg-secondary">›</button>
					</div>
					<div className="grid grid-cols-7 gap-1 text-center text-xs">
						{["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (
							<div key={i} className="py-1 font-medium text-muted-foreground">{d}</div>
						))}
						{days.map((d, i) =>
							d ? (
								<button
									key={i} type="button" onClick={() => pick(d)}
									className={`rounded py-1 hover:bg-secondary ${sel === d.toDateString() ? "bg-teal text-white dark:bg-primary dark:text-primary-foreground" : ""}`}
								>
									{d.getDate()}
								</button>
							) : <div key={i} />
						)}
					</div>
				</div>
			)}
		</div>
	);
}
