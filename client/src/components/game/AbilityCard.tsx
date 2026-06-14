import type { AbilityId } from "@chaos-club/shared";
import { Fingerprint } from "lucide-react";
import { abilityCopy } from "../../i18n/gameCopy";
import { useLanguage } from "../../i18n/LanguageContext";

export function AbilityCard({ ability }: { ability: AbilityId }) {
  const { language, t } = useLanguage();
  const copy = abilityCopy[language][ability];
  return (
    <section className="rounded-2xl border border-chaos-violet/25 bg-chaos-violet/[0.07] p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-chaos-violet"><Fingerprint size={14} /> {t("game.ability")}</p>
      <h3 className="mt-2 text-lg font-black text-white">{copy.name}</h3>
      <p className="mt-2 text-xs leading-5 text-zinc-400">{copy.description}</p>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">{language === "tr" ? "Bu bilgi yalnızca sana görünür" : "Only you can see this"}</p>
    </section>
  );
}
