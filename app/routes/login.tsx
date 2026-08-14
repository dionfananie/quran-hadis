import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Masuk | Moozhaf" }];
}

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const nav = useNavigate();
	const location = useLocation();
	const from = (location.state as { from?: string } | null)?.from || "/";

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = (await res.json()) as { error?: string };
			if (!res.ok) {
				setError(data?.error || "Gagal masuk");
				return;
			}
			nav(from, { replace: true });
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
					<CardTitle>Masuk</CardTitle>
					<CardDescription>
						Masuk untuk mengelola One Day One Juz
					</CardDescription>
				</CardHeader>
				<form onSubmit={submit}>
					<CardContent className="space-y-4">
						<Button
							type="button"
							variant="outline"
							className="w-full"
							onClick={() => {
								window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(from)}`;
							}}
						>
							Login dengan Google
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
							<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
						</div>
					</CardContent>
					<CardFooter className="flex-col gap-2">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Memuat…" : "Masuk"}
						</Button>
						<p className="text-center text-sm text-muted-foreground">
							Belum punya akun?{" "}
							<Link to="/register" className="text-primary hover:underline">
								Daftar
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
