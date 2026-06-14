import type { Player } from "@chaos-club/shared";
import { Crown, Mic, MicOff, Radio } from "lucide-react";
import { Avatar } from "./Avatar";

export function PlayerCard({ player, isHost, isCurrentUser }: { player: Player; isHost: boolean; isCurrentUser: boolean }) {
  return (
    <article className={`glass-panel relative overflow-hidden rounded-2xl p-4 ${player.isSpeaking ? "ring-2 ring-chaos-cyan/70 shadow-cyan" : ""}`}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ backgroundColor: player.character.color }} />
      <div className="flex items-center gap-4">
        <Avatar avatar={player.character.avatar} color={player.character.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-white">{player.character.name}</h3>
            {isHost && <Crown size={14} className="text-amber-400" />}
          </div>
          <p className="truncate text-sm text-zinc-500">@{player.username}{isCurrentUser ? " (you)" : ""}</p>
        </div>
        <div className={`rounded-lg p-2 ${player.micEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
          {player.isSpeaking ? <Radio size={18} /> : player.micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </div>
      </div>
    </article>
  );
}

