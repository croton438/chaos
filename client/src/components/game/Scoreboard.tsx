import type { PlayerStanding } from "@chaos-club/shared";
import { Eye, Gem, ShieldCheck, Trophy } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export function Scoreboard({ standings, currentPlayerId }: { standings: PlayerStanding[]; currentPlayerId: string }) {
  const { language, t } = useLanguage();
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300"><Trophy size={15} /> {t("game.scoreboard")}</div>
      <div className="space-y-2">
        {standings.map((standing, index) => (
          <div key={standing.playerId} className={`rounded-xl px-3 py-3 ${standing.playerId === currentPlayerId ? "border border-chaos-violet/30 bg-chaos-violet/15" : "bg-white/[0.035]"}`}>
            <div className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-black text-zinc-600">{index + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: standing.color, boxShadow: `0 0 10px ${standing.color}` }} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{standing.characterName}</p><p className="truncate text-[10px] text-zinc-600">@{standing.username}</p></div>
              <strong className="text-xl tabular-nums text-white">{standing.influence}</strong>
            </div>
            <div className="mt-2 flex gap-3 pl-8 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-300"><ShieldCheck size={12} /> {standing.trust}/4</span>
              <span className="flex items-center gap-1 text-fuchsia-300"><Gem size={12} /> {standing.leverageCount}</span>
              {standing.trust === 0 && <span className="flex items-center gap-1 text-rose-300"><Eye size={12} /> {language === "tr" ? "Güvensiz" : "Untrusted"}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
