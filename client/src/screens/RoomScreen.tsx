import type { Room, SessionProfile } from "@chaos-club/shared";
import { Copy, LogOut, Radio, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { GameShell } from "../components/client/GameShell";
import { VoicePanel } from "../components/client/VoicePanel";
import { PlayerCard } from "../components/PlayerCard";
import { RoomChat } from "../components/RoomChat";
import { GamePanel } from "../components/game/GamePanel";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { localizeRuntimeMessage, useLanguage } from "../i18n/LanguageContext";
import { socket } from "../services/socket";

export function RoomScreen({ initialRoom, profile, onLeave }: { initialRoom: Room; profile: SessionProfile; onLeave: () => void }) {
  const [room, setRoom] = useState(initialRoom);
  const [copied, setCopied] = useState(false);
  const [, setGameActive] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const [voiceGroupPlayerIds, setVoiceGroupPlayerIds] = useState<string[] | undefined>();
  const { micEnabled, toggleMic, error, playerVolumes, setPlayerVolume } = useVoiceChat(room, voiceGroupPlayerIds);
  const { language, t } = useLanguage();

  useEffect(() => {
    const updateRoom = (nextRoom: Room) => setRoom(nextRoom);
    const closeRoom = () => onLeave();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("room:state", updateRoom);
    socket.on("room:closed", closeRoom);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("room:state", updateRoom);
      socket.off("room:closed", closeRoom);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [onLeave]);

  const leave = () => {
    socket.emit("room:leave");
    onLeave();
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <GameShell
      profile={profile}
      connected={connected}
      activeMenu="private"
      roomName={room.name}
      roomCode={room.code}
      socialPanel={
        <VoicePanel
          profile={profile}
          players={room.players}
          hostId={room.hostId}
          micEnabled={micEnabled}
          onToggleMic={() => void toggleMic()}
          connected={connected}
          log={<RoomChat profile={profile} embedded />}
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col px-6 py-5 2xl:px-9 2xl:py-7">
        <header className="flex shrink-0 items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.34em] text-chaos-cyan"><Radio size={13} /> {t("room.live")}</div><h1 className="client-title mt-2 text-3xl font-black uppercase text-white 2xl:text-4xl">{room.name}</h1><button onClick={copyCode} className="mt-1.5 flex items-center gap-2 font-mono text-xs tracking-[0.28em] text-zinc-500 transition hover:text-chaos-cyan">{room.code} <Copy size={13} /> <span className="font-sans text-[9px] tracking-normal text-chaos-cyan">{copied ? t("common.copied") : ""}</span></button></div>
          <Button variant="danger" onClick={leave} className="rounded-lg py-2.5 text-xs uppercase tracking-wider"><LogOut size={15} /> {t("common.leave")}</Button>
        </header>

        {error && <div className="mt-3 shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">{localizeRuntimeMessage(error, language)}</div>}

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
          <section className="game-panel flex min-h-0 flex-1 flex-col overflow-hidden p-4 2xl:p-5">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] pb-3"><div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-chaos-violet">{language === "tr" ? "Kaos Masası" : "Chaos Table"}</p><h2 className="mt-1 text-base font-black uppercase text-white">{language === "tr" ? "Oyuncu Kadrosu" : "Player Roster"}</h2></div><span className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-zinc-400"><Users size={13} /> {room.players.length}/8</span></div>
            <div className="client-scroll mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pr-1 2xl:grid-cols-3">
              {room.players.map((player) => <PlayerCard key={player.socketId} player={player} isHost={player.id === room.hostId} isCurrentUser={player.id === profile.id} volume={playerVolumes[player.socketId] ?? 1} onVolumeChange={player.id === profile.id ? undefined : (volume) => setPlayerVolume(player.socketId, volume)} />)}
              {Array.from({ length: Math.max(0, Math.min(3, 8 - room.players.length)) }).map((_, index) => <div key={index} className="grid min-h-28 place-items-center rounded-xl border border-dashed border-white/[0.06] bg-black/15 text-center"><div><div className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-white/[0.06] text-zinc-800"><Users size={14} /></div><p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-zinc-700">{language === "tr" ? "Boş Koltuk" : "Empty Seat"}</p></div></div>)}
            </div>
          </section>

          <div className="shrink-0">
            <GamePanel room={room} profile={profile} micEnabled={micEnabled} voiceError={error} playerVolumes={playerVolumes} onToggleMic={() => void toggleMic()} onVolumeChange={setPlayerVolume} onLeave={leave} onActiveChange={setGameActive} onVoiceGroupChange={setVoiceGroupPlayerIds} />
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.035] px-4 py-2 text-[10px] text-zinc-600"><ShieldCheck size={14} className="text-emerald-400" /><span>{t("room.voiceDescription")}</span></div>
        </div>
      </div>
    </GameShell>
  );
}
