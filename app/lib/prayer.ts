import {
	CalculationMethod,
	type CalculationParameters,
	Coordinates,
	Madhab,
	PrayerTimes,
	Qibla,
} from "adhan";

export interface Coords {
	latitude: number;
	longitude: number;
}

export type CalculationMethodKey =
	| "muslim-world-league"
	| "egyptian"
	| "karachi"
	| "umm-al-qura"
	| "dubai"
	| "moonsighting-committee"
	| "north-america"
	| "kuwait"
	| "qatar"
	| "singapore"
	| "tehran"
	| "turkey"
	| "other";

export type MadhabKey = "shafi" | "hanafi";

export interface City extends Coords {
	id: string;
	nameId: string;
	nameEn: string;
}

export const DEFAULT_CITY: City = {
	id: "jakarta",
	nameId: "Jakarta",
	nameEn: "Jakarta",
	latitude: -6.2088,
	longitude: 106.8456,
};

export const CITIES: City[] = [
	DEFAULT_CITY,
	{ id: "makkah", nameId: "Makkah", nameEn: "Mecca", latitude: 21.3891, longitude: 39.8579 },
	{ id: "madinah", nameId: "Madinah", nameEn: "Medina", latitude: 24.4672, longitude: 39.6111 },
	{ id: "surabaya", nameId: "Surabaya", nameEn: "Surabaya", latitude: -7.2575, longitude: 112.7521 },
	{ id: "bandung", nameId: "Bandung", nameEn: "Bandung", latitude: -6.9175, longitude: 107.6191 },
	{ id: "medan", nameId: "Medan", nameEn: "Medan", latitude: 3.5952, longitude: 98.6722 },
	{ id: "semarang", nameId: "Semarang", nameEn: "Semarang", latitude: -6.9667, longitude: 110.4167 },
	{ id: "makassar", nameId: "Makassar", nameEn: "Makassar", latitude: -5.1477, longitude: 119.4327 },
	{ id: "yogyakarta", nameId: "Yogyakarta", nameEn: "Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
];

export function getCalculationMethod(key: CalculationMethodKey): CalculationParameters {
	switch (key) {
		case "egyptian":
			return CalculationMethod.Egyptian();
		case "karachi":
			return CalculationMethod.Karachi();
		case "umm-al-qura":
			return CalculationMethod.UmmAlQura();
		case "dubai":
			return CalculationMethod.Dubai();
		case "moonsighting-committee":
			return CalculationMethod.MoonsightingCommittee();
		case "north-america":
			return CalculationMethod.NorthAmerica();
		case "kuwait":
			return CalculationMethod.Kuwait();
		case "qatar":
			return CalculationMethod.Qatar();
		case "singapore":
			return CalculationMethod.Singapore();
		case "tehran":
			return CalculationMethod.Tehran();
		case "turkey":
			return CalculationMethod.Turkey();
		case "other":
			return CalculationMethod.Other();
		default:
			return CalculationMethod.MuslimWorldLeague();
	}
}

export function getPrayerTimes(
	coords: Coords,
	date: Date,
	methodKey: CalculationMethodKey = "muslim-world-league",
	madhab: MadhabKey = "shafi",
): PrayerTimes {
	const params = getCalculationMethod(methodKey);
	params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
	return new PrayerTimes(
		new Coordinates(coords.latitude, coords.longitude),
		date,
		params,
	);
}

export function getQiblaDirection(coords: Coords): number {
	return Qibla(new Coordinates(coords.latitude, coords.longitude));
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}
