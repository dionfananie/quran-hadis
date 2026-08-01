import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CITIES, DEFAULT_CITY, formatTime, getPrayerTimes } from "@/lib/prayer";
import { useMounted, useStoredState } from "@/lib/hooks";
import { useI18n, type TKey } from "@/lib/i18n";

const ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof ORDER)[number];

const LABEL_KEY: Record<PrayerKey, TKey> = {
	fajr: "prayer.fajr",
	sunrise: "prayer.sunrise",
	dhuhr: "prayer.dhuhr",
	asr: "prayer.asr",
	maghrib: "prayer.maghrib",
	isha: "prayer.isha",
};

export function PrayerMarquee() {
	const { t } = useI18n();
	const mounted = useMounted();
	const [cityId] = useStoredState<string>("moeslem.city", DEFAULT_CITY.id);

	const items = useMemo(() => {
		if (!mounted) return null;
		const city = CITIES.find((c) => c.id === cityId) ?? DEFAULT_CITY;
		const pt = getPrayerTimes(city, new Date());
		return ORDER.map((key) => ({
			key,
			label: t(LABEL_KEY[key]),
			time: formatTime(pt[key]),
		}));
	}, [mounted, cityId, t]);

	if (!items) {
		return <Skeleton className="h-12 w-full rounded-2xl" />;
	}

	return (
		<div
			className="overflow-hidden border-y border-gold-border bg-gold-surface/50 dark:bg-gold-surface/20"
			aria-hidden="true"
		>
			<div className="flex w-max animate-marquee gap-12 px-4 py-4">
				{[...items, ...items].map((item, i) => (
					<div key={`${item.key}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
						<span className="inline-block size-1.5 rounded-full bg-gold" />
						<span className="text-xs font-medium uppercase tracking-[0.05em] text-teal">
							{item.label}
						</span>
						<span className="font-serif text-sm font-semibold tabular-nums">{item.time}</span>
					</div>
				))}
			</div>
		</div>
	);
}
