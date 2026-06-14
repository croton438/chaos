import type { Player } from "@chaos-club/shared";
import { Crown, Mic, MicOff, Radio, ShieldCheck, Volume1, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { Avatar } from "./Avatar";

interface PlayerCardProps {
  player: Player;
  isHost: boolean;
  isCurrentUser: boolean;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function PlayerCard({ player, isHost, isCurrentUser, volume = 1, onVolumeChange }: PlayerCardProps) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;
  const { language, t } = useLanguage();
  return (
    <article className={`group relative overflow-hidden rounded-xl border bg-black/30 p-3 transition duration-200 ${player.isSpeaking ? "border-chaos-cyan/60 shadow-[0_0_24px_rgba(34,211,238,.13)]" : "border-white/[0.07] hover:border-chaos-violet/30 hover:bg-white/[0.025]"}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-chaos-violet/80 to-transparent opacity-60" />
      <div className="flex items-center gap-3">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 shadow-inner"><Avatar avatar={player.character.avatar} color={player.character.color} size="sm" /><span className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0e] ${player.micEnabled ? "bg-emerald-400" : "bg-zinc-600"}`} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="truncate text-sm font-black uppercase tracking-wide text-white">{player.character.name}</h3>{isHost && <Crown size={13} className="shrink-0 text-amber-300" />}</div>
          <p className="truncate text-[10px] text-zinc-600">@{player.username}{isCurrentUser ? ` · ${t("common.you")}` : ""}</p>
          <div className="mt-2 flex items-center gap-2"><span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-400"><ShieldCheck size={10} /> READY</span>{isHost && <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/70">HOST</span>}</div>
        </div>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${player.isSpeaking ? "border-chaos-cyan/30 bg-chaos-cyan/10 text-chaos-cyan" : player.micEnabled ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/[0.06] bg-white/[0.025] text-zinc-700"}`}>{player.isSpeaking ? <Radio size={16} /> : player.micEnabled ? <Mic size={16} /> : <MicOff size={16} />}</div>
      </div>
      {!isCurrentUser && onVolumeChange && <label className="mt-3 flex items-center gap-2 border-t border-white/[0.05] pt-2.5"><VolumeIcon size={13} className="shrink-0 text-zinc-600" /><input aria-label={`${player.character.name} volume`} className="h-1 w-full cursor-pointer accent-chaos-violet" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={(event) => onVolumeChange(Number(event.target.value) / 100)} /><span className="w-8 text-right font-mono text-[9px] text-zinc-600">{Math.round(volume * 100)}%</span></label>}
      <span className="sr-only">{language === "tr" ? "Oyuncu hazır" : "Player ready"}</span>
    </article>
  );
}
