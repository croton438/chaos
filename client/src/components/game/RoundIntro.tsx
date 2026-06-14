import type { PublicTask } from "@chaos-club/shared";
import { BookOpen, Lightbulb, Scale, Target } from "lucide-react";
import { getTaskCopy } from "../../i18n/gameCopy";
import { useLanguage } from "../../i18n/LanguageContext";
import { TaskCard } from "./TaskCard";

export function RoundIntro({ task }: { task: PublicTask }) {
  const { language, t } = useLanguage();
  const copy = getTaskCopy(task, language);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-chaos-cyan/25 bg-gradient-to-r from-chaos-cyan/10 via-chaos-violet/10 to-transparent p-6">
        <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-chaos-cyan/15 text-chaos-cyan"><BookOpen size={24} /></div><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-chaos-cyan">{t("game.intro")}</p><p className="mt-1 text-sm text-zinc-400">{t("game.introWait")}</p></div></div>
      </div>
      <TaskCard task={task} detailed />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/30 p-5"><h3 className="flex items-center gap-2 font-bold text-white"><Target size={18} className="text-chaos-violet" /> {language === "tr" ? "Amacın" : "Your objective"}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{copy.objective}</p></section>
        <section className="rounded-2xl border border-white/10 bg-black/30 p-5"><h3 className="flex items-center gap-2 font-bold text-white"><Lightbulb size={18} className="text-amber-300" /> {language === "tr" ? "Pazarlık ipucu" : "Negotiation tip"}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{copy.negotiationTip}</p></section>
      </div>
      <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <h3 className="flex items-center gap-2 font-bold text-white"><Scale size={18} className="text-emerald-400" /> {language === "tr" ? "Nüfuz ve Güven kuralları" : "Influence and Trust rules"}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{copy.rules.map((rule, index) => <div key={rule} className="flex gap-3 rounded-xl bg-white/[0.035] p-3 text-sm leading-5 text-zinc-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-chaos-violet/15 text-xs font-black text-chaos-violet">{index + 1}</span>{rule}</div>)}</div>
      </section>
    </div>
  );
}
