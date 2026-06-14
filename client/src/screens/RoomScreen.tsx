import type { Room, SessionProfile } from "@chaos-club/shared";
import { Copy, Gamepad2, LogOut, Mic, MicOff, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { PlayerCard } from "../components/PlayerCard";
import { RoomChat } from "../components/RoomChat";
import { Shell } from "../components/Shell";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { socket } from "../services/socket";

export function RoomScreen({ initialRoom, profile, onLeave }: { initialRoom: Room; profile: SessionProfile; onLeave: () => void }) {
  const [room, setRoom] = useState(initialRoom);
  const [copied, setCopied] = useState(false);
  const { micEnabled, toggleMic, error, playerVolumes, setPlayerVolume } = useVoiceChat(room);

  useEffect(() => {
    const updateRoom = (nextRoom: Room) => setRoom(nextRoom);
    const closeRoom = () => onLeave();
    socket.on("room:state", updateRoom);
    socket.on("room:closed", closeRoom);
    return () => {
      socket.off("room:state", updateRoom);
      socket.off("room:closed", closeRoom);
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
    <Shell right={<Button variant="danger" onClick={leave}><LogOut size={17} /> Leave Room</Button>}>
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-chaos-cyan"><Radio size={14} /> Live room</div>
          <h1 className="mt-2 text-4xl font-black text-white">{room.name}</h1>
          <button onClick={copyCode} className="mt-3 flex items-center gap-2 font-mono text-sm tracking-[0.25em] text-zinc-400 transition hover:text-white">{room.code} <Copy size={15} /> <span className="font-sans text-xs tracking-normal text-chaos-cyan">{copied ? "Copied" : ""}</span></button>
        </div>
        <Button onClick={() => void toggleMic()} variant={micEnabled ? "primary" : "secondary"} className={micEnabled ? "bg-emerald-500 hover:bg-emerald-400" : ""}>
          {micEnabled ? <Mic size={19} /> : <MicOff size={19} />} {micEnabled ? "Microphone On" : "Enable Microphone"}
        </Button>
      </div>

      {error && <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>}
      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-white">Players</h2><span className="text-sm text-zinc-500">{room.players.length} connected</span></div>
            <div className="grid gap-4 md:grid-cols-2">
              {room.players.map((player) => (
                <PlayerCard
                  key={player.socketId}
                  player={player}
                  isHost={player.id === room.hostId}
                  isCurrentUser={player.id === profile.id}
                  volume={playerVolumes[player.socketId] ?? 1}
                  onVolumeChange={player.id === profile.id ? undefined : (volume) => setPlayerVolume(player.socketId, volume)}
                />
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-chaos-violet/15 p-3 text-chaos-violet"><Gamepad2 size={21} /></div><div><h2 className="font-bold text-white">Game stage</h2><p className="text-xs text-zinc-500">Module slot</p></div></div>
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center"><div><p className="font-semibold text-zinc-300">Game systems will be added here</p><p className="mt-2 text-xs leading-5 text-zinc-600">Tasks, scoring, private chat, auctions, cards and alliances will mount into this area.</p></div></div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <RoomChat profile={profile} />
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={20} /><div><p className="text-sm font-semibold text-emerald-200">Peer-to-peer voice</p><p className="mt-1 text-xs leading-5 text-zinc-500">Socket.io carries signaling only. Audio streams travel directly between peers.</p></div></div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
