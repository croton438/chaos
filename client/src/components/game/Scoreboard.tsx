import type { PlayerScore } from "@chaos-club/shared";
import { Trophy } from "lucide-react";

export function Scoreboard({ scores, currentPlayerId }: { scores: PlayerScore[]; currentPlayerId: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300"><Trophy size={15} /> Scoreboard</div>
      <div className="space-y-2">
        {scores.map((score, index) => (
          <div key={score.playerId} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${score.playerId === currentPlayerId ? "bg-chaos-violet/15" : "bg-white/[0.03]"}`}>
            <span className="w-5 text-center text-xs font-black text-zinc-600">{index + 1}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: score.color, boxShadow: `0 0 10px ${score.color}` }} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{score.characterName}</p><p className="truncate text-[10px] text-zinc-600">@{score.username}</p></div>
            <strong className="text-lg tabular-nums text-white">{score.points}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

