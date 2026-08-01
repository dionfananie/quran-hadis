import { useEffect, useMemo, useState } from "react";
import { Navigation } from "lucide-react";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { CITIES, DEFAULT_CITY, getQiblaDirection, type Coords } from "@/lib/prayer";
import { useI18n } from "@/lib/i18n";
import { useMounted, useStoredState } from "@/lib/hooks";

export function QiblaCard() {
	const { t } = useI18n();
	const mounted = useMounted();
	const [geo, setGeo] = useState<Coords | null>(null);
	const [cityId] = useStoredState<string>("moeslem.city", DEFAULT_CITY.id);

	useEffect(() => {
		if (!mounted) return;
		if (!("geolocation" in navigator)) return;
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				setGeo({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
			() => {},
			{ timeout: 5000 },
		);
	}, [mounted]);

	const qibla = useMemo(() => {
		if (!mounted) return null;
		const coords = geo ?? CITIES.find((c) => c.id === cityId) ?? DEFAULT_CITY;
		return Math.round(getQiblaDirection(coords));
	}, [mounted, geo, cityId]);

	if (qibla === null) {
		return <Skeleton className="h-28 w-full rounded-2xl" />;
	}

	return (
		<Link
			to="/prayer-times"
			className="group flex flex-col items-center justify-center gap-1 rounded-2xl bg-surface-low p-5 text-center transition-colors hover:bg-surface dark:bg-surface"
		>
			<span className="flex size-12 items-center justify-center rounded-full bg-card text-gold shadow-[0_8px_40px_rgba(26,28,25,0.04)]">
				<Navigation
					className="size-6 transition-transform duration-700 group-hover:rotate-90"
					style={{ transform: `rotate(${qibla}deg)` }}
					strokeWidth={1.75}
				/>
			</span>
			<p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
				{t("home.qibla")}
			</p>
			<p className="font-serif text-xl font-semibold tabular-nums">{qibla}°</p>
		</Link>
	);
}
