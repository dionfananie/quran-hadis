import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "./+types/register";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Daftar | Moozhaf" }];
}

export default function Register() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const nav = useNavigate();

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		if (password.length < 8) {
			setError("Password minimal 8 karakter");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setError(data?.error || "Gagal daftar");
				return;
			}
			nav("/odoj", { replace: true });
		} catch {
			setError("Terjadi kesalahan jaringan");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-[70vh] items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Daftar</CardTitle>
					<CardDescription>
						Buat akun untuk mengelola One Day One Juz
					</CardDescription>
				</CardHeader>
				<form onSubmit={submit}>
					<CardContent className="space-y-4">
						<Button
							type="button"
							variant="outline"
							className="w-full"
							onClick={() => {
								window.location.href = "/api/auth/google";
							}}
						>
							Daftar dengan Google
						</Button>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span className="h-px flex-1 bg-border" />
							atau
							<span className="h-px flex-1 bg-border" />
						</div>
						{error && (
							<p className="rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">{error}</p>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
							<p className="text-xs text-muted-foreground">Minimal 8 karakter</p>
						</div>
					</CardContent>
					<CardFooter className="flex-col gap-2">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Memuat…" : "Daftar"}
						</Button>
						<p className="text-center text-sm text-muted-foreground">
							Sudah punya akun?{" "}
							<Link to="/login" className="text-primary hover:underline">
								Masuk
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
