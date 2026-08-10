import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Route } from "./+types/user-profile";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Profil | Moozhaf" }];
}

type User = { id: string; email: string; name?: string | null; avatar_url?: string | null };

export default function UserProfile() {
	const nav = useNavigate();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");
	const fileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetch("/api/auth/me")
			.then((res) => (res.ok ? res.json() : Promise.reject()))
			.then((d) => {
				const u = (d as { user: User }).user;
				setUser(u);
				setName(u.name || "");
				setLoading(false);
			})
			.catch(() => nav("/login", { replace: true, state: { from: "/user-profile" } }));
	}, [nav]);

	// Baca file gambar → kompres → data URL kecil.
	function readAvatar(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const MAX = 256;
				let { width, height } = img;
				if (width > MAX || height > MAX) {
					const r = Math.min(MAX / width, MAX / height);
					width = Math.round(width * r);
					height = Math.round(height * r);
				}
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				ctx.drawImage(img, 0, 0, width, height);
				const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
				setUser((u) => (u ? { ...u, avatar_url: dataUrl } : u));
			};
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	async function save() {
		setSaving(true);
		setMsg("");
		setError("");
		try {
			const res = await fetch("/api/auth/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, avatar_url: user?.avatar_url }),
			});
			const data = (await res.json()) as { user?: User; error?: string };
			if (!res.ok) {
				setError(data?.error || "Gagal menyimpan");
				return;
			}
			setUser(data.user!);
			setName(data.user!.name || "");
			setMsg("Profil berhasil diperbarui");
		} catch {
			setError("Terjadi kesalahan jaringan");
		} finally {
			setSaving(false);
		}
	}

	const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();

	return (
		<div className="mx-auto max-w-md p-4">
			<Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
				← Kembali
			</Link>
			<Card className="mt-4">
				<CardHeader>
					<CardTitle>Profil</CardTitle>
					<CardDescription>Kelola foto dan nama yang tampil di Moozhaf</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{loading ? (
						<p className="text-center text-muted-foreground">Memuat…</p>
					) : (
						<>
							<div className="flex flex-col items-center gap-3">
								<Avatar className="size-20">
									{user?.avatar_url ? (
										<AvatarImage src={user.avatar_url} alt="Avatar" />
									) : (
										<AvatarFallback className="text-2xl">{initials}</AvatarFallback>
									)}
								</Avatar>
								<div className="flex gap-2">
									<Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
										Ganti Gambar
									</Button>
									{user?.avatar_url && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setUser((u) => (u ? { ...u, avatar_url: "" } : u))}
										>
											Hapus
										</Button>
									)}
								</div>
								<input
									ref={fileRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const f = e.target.files?.[0];
										if (f) readAvatar(f);
									}}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" value={user?.email || ""} readOnly className="bg-muted/50" />
							</div>

							<div className="space-y-2">
								<Label htmlFor="name">Nama</Label>
								<Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
							</div>

							{error && <p className="text-sm text-red-600">{error}</p>}
							{msg && <p className="text-sm text-green-600">{msg}</p>}

							<Button onClick={save} disabled={saving} className="w-full">
								{saving ? "Menyimpan…" : "Simpan Perubahan"}
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
