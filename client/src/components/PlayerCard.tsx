import type { Player } from "@chaos-club/shared";
import { Crown, Mic, MicOff, Radio, Volume1, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "./Avatar";
import { useLanguage } from "../i18n/LanguageContext";

interface PlayerCardProps {
  player: Player;
  isHost: boolean;
  isCurrentUser: boolean;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function PlayerCard({ player, isHost, isCurrentUser, volume = 1, onVolumeChange }: PlayerCardProps) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;
  const { t } = useLanguage();
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
          <p className="truncate text-sm text-zinc-500">@{player.username}{isCurrentUser ? ` (${t("common.you")})` : ""}</p>
        </div>
        <div className={`rounded-lg p-2 ${player.micEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
          {player.isSpeaking ? <Radio size={18} /> : player.micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </div>
      </div>
      {!isCurrentUser && onVolumeChange && (
        <label className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3">
          <VolumeIcon size={16} className="shrink-0 text-zinc-500" />
          <input
            aria-label={`${player.character.name} volume`}
            className="h-1.5 w-full cursor-pointer accent-chaos-violet"
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
          />
          <span className="w-9 text-right text-xs tabular-nums text-zinc-500">{Math.round(volume * 100)}%</span>
        </label>
      )}
    </article>
  );
}
