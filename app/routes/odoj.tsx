import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, CalendarDays, CheckCircle2, Target, MessageSquareShare } from "lucide-react";
import type { Route } from "./+types/odoj";

export function meta({}: Route.MetaArgs) {
	return [{ title: "One Day One Juz | Moozhaf" }];
}

export default function OdojLanding() {
	const nav = useNavigate();

	function goCreate() {
		nav("/odoj/create");
	}

	return (
		<div className="mx-auto max-w-3xl space-y-8 p-4">
			{/* Hero */}
			<div className="text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
					<BookOpen className="size-8" />
				</div>
				<h1 className="font-serif text-3xl font-bold">One Day One Juz</h1>
				<p className="mx-auto mt-3 max-w-xl text-muted-foreground">
					Bersama-sama mengkhatamkan Al-Qur'an setiap hari. Admin membagi 30 juz ke para
					peserta, dan setiap peserta menandai selesai setelah membaca juznya. Istiqamah,
					berjamaah, bermanfaat.
				</p>
				<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
					<Button onClick={goCreate} size="lg">Mulai ODOJ</Button>
					<Button onClick={goCreate} size="lg" variant="outline">Buat Group ODOJ</Button>
				</div>
			</div>

			{/* Fitur cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-teal" /> Multi Grup</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Buat & kelola beberapa group ODOJ. Masing-masing punya admin, peserta,
							dan penugasan sendiri yang terisolasasi dengan rapi.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><Target className="size-5 text-teal" /> 30 Juz Setiap Hari</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Assign 30 juz Al-Qur'an penuh ke para peserta tiap tanggal. 1 peserta
							boleh memegang lebih dari satu juz.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="size-5 text-teal" /> Penjadwalan Harian</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Pantau penugasan per tanggal, copy format dari hari sebelumnya, dan lihat
							riwayat perkembangan dari waktu ke waktu.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><MessageSquareShare className="size-5 text-teal" /> Bagikan ke Peserta</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Bagikan link view ke group WA. Peserta cukup klik juznya, baca, lalu tandai
							"Selesai dibaca" — tanpa perlu login.
						</CardDescription>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="size-5 text-teal" /> Pantau Selesai</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>
							Lihat status selesai per juz secara real-time, lengkap dengan rekap berapa
							juz yang sudah dibaca tiap tanggalnya.
						</CardDescription>
					</CardContent>
				</Card>
			</div>

			{/* CTA bawah */}
			<div className="rounded-2xl border bg-accent/40 p-8 text-center">
				<h2 className="text-xl font-semibold">Siap memulai?</h2>
				<p className="mt-1 text-muted-foreground">
					Buat group pertama untuk mulai menugaskan juz hari ini.
				</p>
				<Button onClick={goCreate} size="lg" className="mt-4">Buat Group ODOJ</Button>
			</div>
		</div>
	);
}
