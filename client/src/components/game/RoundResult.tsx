import type { RoundResult as RoundResultType } from "@chaos-club/shared";
import { ArrowUp, ArrowDown, Eye } from "lucide-react";
import { getChoiceLabel, getOutcomeText, getTaskCopy } from "../../i18n/gameCopy";
import { useLanguage } from "../../i18n/LanguageContext";

export function RoundResult({ result }: { result: RoundResultType }) {
  const { language, t } = useLanguage();
  const taskName = getTaskCopy({ id: result.taskId, name: result.taskName, description: "", participants: [] }, language).name;
  return (
    <section className="rounded-3xl border border-chaos-cyan/20 bg-chaos-cyan/[0.04] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-chaos-cyan">{t("game.revealed")}</p>
      <h2 className="mt-2 text-3xl font-black text-white">{taskName}</h2>
      <p className="mt-2 text-zinc-400">{getOutcomeText(result, language)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {result.decisions.map((decision) => (
          <div key={decision.playerId} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 p-3"><Eye size={16} className="text-zinc-600" /><div><p className="text-xs text-zinc-500">{decision.playerName}</p><p className="font-semibold text-white">{getChoiceLabel({ id: decision.choiceId, label: decision.choiceLabel }, language)}</p></div></div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {result.scoreChanges.filter((change) => !change.playerId.startsWith("bot:")).map((change) => (
          <div key={change.playerId} className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
            <div><p className="font-semibold text-white">{change.playerName}</p><p className="text-xs text-zinc-600">{language === "tr" ? "Tur puanı" : change.reason}</p></div>
            <span className={`flex items-center gap-1 text-lg font-black ${change.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{change.delta >= 0 ? <ArrowUp size={17} /> : <ArrowDown size={17} />}{change.delta >= 0 ? "+" : ""}{change.delta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
