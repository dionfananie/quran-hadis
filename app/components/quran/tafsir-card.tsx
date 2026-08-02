import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, type TKey } from "@/lib/i18n";
import type { AyahTafsir } from "@/lib/data/types";
import { useStoredState } from "@/lib/hooks";

type TafsirId = "kemenag" | "quraish" | "jalalayn";

type TafsirEntry =
	| { id: "kemenag"; short: string; long: string }
	| { id: "quraish"; text: string }
	| { id: "jalalayn"; text: string };

const TAFSIR_LABEL: Record<TafsirId, TKey> = {
	kemenag: "tafsir.kemenag",
	quraish: "tafsir.quraish",
	jalalayn: "tafsir.jalalayn",
};

const STORAGE_KEY = "moeslem.tafsir";

function buildEntries(tafsir: AyahTafsir): TafsirEntry[] {
	const entries: TafsirEntry[] = [];
	if (tafsir.kemenag) entries.push({ id: "kemenag", ...tafsir.kemenag });
	if (tafsir.quraish) entries.push({ id: "quraish", text: tafsir.quraish });
	if (tafsir.jalalayn) entries.push({ id: "jalalayn", text: tafsir.jalalayn });
	return entries;
}

export function TafsirCard({ tafsir }: { tafsir: AyahTafsir }) {
	const { t } = useI18n();
	const [stored, setStored] = useStoredState<TafsirId>(STORAGE_KEY, "kemenag");

	const entries = buildEntries(tafsir);
	if (entries.length === 0) return null;

	const active = entries.some((e) => e.id === stored) ? stored : entries[0].id;

	const select = (value: string) => {
		const entry = entries.find((e) => e.id === value);
		if (entry) setStored(entry.id);
	};

	return (
		<div className="rounded-2xl border border-gold-border bg-card p-6">
			<h2 className="mb-3 font-serif text-xl font-semibold text-teal">{t("quran.tafsir")}</h2>
			<Tabs value={active} onValueChange={select}>
				<TabsList aria-label={t("quran.tafsir")} className="mb-5 h-11 w-full bg-muted">
					{entries.map((e) => (
						<TabsTrigger
							key={e.id}
							value={e.id}
							className="text-[13px] font-medium text-muted-foreground hover:bg-surface-high/70 hover:text-foreground focus-visible:ring-gold/50 focus-visible:outline-gold data-[state=active]:bg-teal data-[state=active]:text-white data-[state=active]:shadow-sm"
						>
							{t(TAFSIR_LABEL[e.id])}
						</TabsTrigger>
					))}
				</TabsList>
				{entries.map((e) =>
					e.id === "kemenag" ? (
						<TabsContent key={e.id} value={e.id} className="space-y-4">
							<div>
								<h3 className="mb-2 font-serif text-sm font-semibold text-gold">{t("quran.shortTafsir")}</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">{e.short}</p>
							</div>
							<div className="border-t border-gold-border/60 pt-4">
								<h3 className="mb-2 font-serif text-sm font-semibold text-gold">{t("quran.longTafsir")}</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">{e.long}</p>
							</div>
						</TabsContent>
					) : (
						<TabsContent key={e.id} value={e.id}>
							<p className="text-sm leading-relaxed text-muted-foreground">{e.text}</p>
						</TabsContent>
					),
				)}
			</Tabs>
		</div>
	);
}
