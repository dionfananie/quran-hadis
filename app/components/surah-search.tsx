import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { surahIndex } from "@/lib/data/quran";
import { useI18n } from "@/lib/i18n";

export function SurahSearch({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t, lang } = useI18n();
	const navigate = useNavigate();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, onOpenChange]);

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title={t("home.searchPlaceholder")}
			description={t("common_searchShortcut")}
		>
			<CommandInput placeholder={t("home.searchPlaceholder")} autoFocus />
			<CommandList>
				<CommandEmpty>{t("common_notFound")}</CommandEmpty>
				<CommandGroup heading={t("nav.quran")}>
					{surahIndex.map((s) => (
						<CommandItem
							key={s.number}
							value={`${s.number} ${s.name} ${s.translation} ${s.arabic ?? ""}`}
							onSelect={() => {
								onOpenChange(false);
								navigate(`/quran/${s.number}`);
							}}
						>
							<span className="font-serif text-xs font-semibold text-primary">{s.number}</span>
							<span className="flex-1 truncate">{lang === "id" ? s.translation : s.name}</span>
							{s.arabic && <span className="font-arabic text-lg text-primary">{s.arabic}</span>}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
