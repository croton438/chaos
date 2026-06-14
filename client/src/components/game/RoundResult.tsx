import type { RoundResult as RoundResultType } from "@chaos-club/shared";
import { Eye, Gem, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { getChoiceLabel, getOutcomeText, getTaskCopy } from "../../i18n/gameCopy";
import { useLanguage } from "../../i18n/LanguageContext";

export function RoundResult({ result, accountability = false }: { result: RoundResultType; accountability?: boolean }) {
  const { language, t } = useLanguage();
  const taskName = getTaskCopy({ id: result.taskId, name: result.taskName, description: "", participants: [] }, language).name;
  return (
    <section className={`rounded-3xl border p-6 ${accountability ? "border-amber-400/20 bg-amber-400/[0.04]" : "border-chaos-cyan/20 bg-chaos-cyan/[0.04]"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.3em] ${accountability ? "text-amber-300" : "text-chaos-cyan"}`}>{accountability ? t("game.accountability") : t("game.revealed")}</p>
      <h2 className="mt-2 text-3xl font-black text-white">{taskName}</h2>
      <p className="mt-2 max-w-3xl text-zinc-300">{accountability ? (language === "tr" ? "Sözleri sonuçlarla karşılaştırın. Kim borçlandı, kim güven kaybetti ve bu turdan hangi ittifak çıktı?" : "Compare promises with outcomes. Who owes whom, who lost Trust, and what alliance survived?") : getOutcomeText(result, language)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.decisions.map((decision) => (
          <div key={decision.playerId} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 p-3"><Eye size={16} className="text-zinc-600" /><div><p className="text-xs text-zinc-500">{decision.playerName}</p><p className="font-semibold text-white">{getChoiceLabel({ id: decision.choiceId, label: decision.choiceLabel }, language)}</p></div></div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {result.resourceChanges.filter((change) => !change.playerId.startsWith("bot:")).map((change) => (
          <div key={change.playerId} className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
            <div><p className="font-semibold text-white">{change.playerName}</p><p className="text-xs text-zinc-600">{change.reason}</p></div>
            <div className="flex items-center gap-3 text-sm font-black">
              <span className={change.influenceDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>{change.influenceDelta >= 0 ? <TrendingUp className="inline" size={15} /> : <TrendingDown className="inline" size={15} />} {change.influenceDelta >= 0 ? "+" : ""}{change.influenceDelta}</span>
              {change.trustDelta !== 0 && <span className="flex items-center gap-1 text-amber-300"><ShieldCheck size={14} /> {change.trustDelta}</span>}
            </div>
          </div>
        ))}
      </div>
      {result.leverageEvents.length > 0 && <div className="mt-4 space-y-2">{result.leverageEvents.map((event) => <div key={event.cardId} className="flex items-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-3 text-sm text-fuchsia-100"><Gem size={16} /> {event.ownerName} → {event.targetName}</div>)}</div>}
    </section>
  );
}
