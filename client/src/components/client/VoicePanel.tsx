import type { Player, SessionProfile } from "@chaos-club/shared";
import { Crown, Headphones, LockKeyhole, Mic, MicOff, Radio, Signal, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { Avatar } from "../Avatar";

interface VoicePanelProps {
  profile: SessionProfile;
  players?: Player[];
  hostId?: string;
  micEnabled?: boolean;
  onToggleMic?: () => void;
  connected: boolean;
  log?: ReactNode;
}

export function VoicePanel({ profile, players = [], hostId, micEnabled = false, onToggleMic, connected, log }: VoicePanelProps) {
  const { language } = useLanguage();
  const tr = language === "tr";
  const displayPlayers = players.length > 0 ? players : [{ id: profile.id, socketId: "preview", username: profile.username, character: profile.character, micEnabled: false, isSpeaking: false, joinedAt: 0 }];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.28em] text-chaos-cyan">Social Channel</p><h2 className="mt-1 text-sm font-black uppercase text-white">{tr ? "Kulüp İletişimi" : "Club Comms"}</h2></div><span className={`grid h-9 w-9 place-items-center rounded-lg border ${connected ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}`}><Signal size={17} /></span></header>

      <div className="client-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section>
          <div className="mb-2 flex items-center justify-between"><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600"><Headphones size={13} /> {tr ? "Ses Kanalı" : "Voice Channel"}</p><span className="text-[9px] font-bold text-zinc-700">{displayPlayers.length}/8</span></div>
          <div className="space-y-2">{displayPlayers.map((player) => {
            const isHost = player.id === hostId;
            return <div key={player.id} className={`relative flex items-center gap-3 rounded-xl border p-2.5 transition ${player.isSpeaking ? "border-chaos-cyan/45 bg-chaos-cyan/[0.07] shadow-[0_0_18px_rgba(34,211,238,.1)]" : "border-white/[0.06] bg-black/25"}`}><Avatar avatar={player.character.avatar} color={player.character.color} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-bold text-white">{player.character.name}</p>{isHost && <Crown size={11} className="text-amber-300" />}</div><p className="truncate text-[10px] text-zinc-600">@{player.username}</p><span className="mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-400"><span className="h-1 w-1 rounded-full bg-emerald-400" /> READY</span></div><div className={`grid h-8 w-8 place-items-center rounded-lg ${player.micEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.035] text-zinc-700"}`}>{player.isSpeaking ? <Radio size={15} /> : player.micEnabled ? <Mic size={15} /> : <MicOff size={15} />}</div></div>;
          })}</div>
          {onToggleMic && <button onClick={onToggleMic} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${micEnabled ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15" : "border-white/[0.08] bg-white/[0.035] text-zinc-400 hover:border-chaos-violet/30 hover:text-white"}`}>{micEnabled ? <Mic size={15} /> : <MicOff size={15} />}{micEnabled ? (tr ? "Mikrofon Açık" : "Microphone On") : (tr ? "Mikrofonu Aç" : "Enable Microphone")}</button>}
        </section>

        <section className="mt-5 border-t border-white/[0.06] pt-4"><div className="mb-2 flex items-center justify-between"><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600"><LockKeyhole size={13} /> {tr ? "Özel Görüşmeler" : "Private Meetings"}</p><span className="text-[8px] text-zinc-700">0 ACTIVE</span></div><div className="rounded-xl border border-dashed border-white/[0.07] bg-black/20 px-3 py-4 text-center"><LockKeyhole className="mx-auto text-zinc-800" size={20} /><p className="mt-2 text-[10px] font-semibold text-zinc-600">{tr ? "Oyun sırasında gizli kanallar burada görünür." : "Secret channels appear here during the game."}</p></div></section>

        {log ?? <section className="mt-5 border-t border-white/[0.06] pt-4"><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600"><Volume2 size={13} /> {tr ? "Kulüp Günlüğü" : "Club Log"}</p><div className="mt-2 space-y-2 font-mono text-[9px] leading-4 text-zinc-700"><p><span className="text-emerald-500/70">[SYSTEM]</span> {tr ? "Ses altyapısı hazır." : "Voice infrastructure ready."}</p><p><span className="text-chaos-cyan/70">[NETWORK]</span> {connected ? (tr ? "Sunucu bağlantısı kararlı." : "Server connection stable.") : (tr ? "Sunucu yanıtı bekleniyor." : "Waiting for server response.")}</p><p><span className="text-chaos-violet/70">[CLUB]</span> {tr ? "Bir kaos odasına katıl." : "Join a chaos room."}</p></div></section>}
      </div>
    </div>
  );
}
