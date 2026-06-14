import type { GameStatus } from "@chaos-club/shared";
import { useLanguage } from "../../i18n/LanguageContext";

const phases: Exclude<GameStatus, "final_reveal" | "finished">[] = ["agenda", "market", "decision", "reveal", "accountability"];

export function PhaseTrack({ status }: { status: GameStatus }) {
  const { language } = useLanguage();
  const labels = language === "tr" ? ["Gündem", "Pazar", "Karar", "İfşa", "Hesap"] : ["Agenda", "Market", "Decision", "Reveal", "Account"];
  const activeIndex = phases.indexOf(status as (typeof phases)[number]);
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      {labels.map((label, index) => <div key={label} className={`border-r border-white/5 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider last:border-0 ${index === activeIndex ? "bg-chaos-violet/20 text-white" : index < activeIndex ? "text-chaos-cyan" : "text-zinc-700"}`}>{index + 1}. {label}</div>)}
    </div>
  );
}
