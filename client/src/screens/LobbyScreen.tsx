import type { Room, RoomSummary, SessionProfile } from "@chaos-club/shared";
import { DoorOpen, LogIn, Plus, Radio, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Shell } from "../components/Shell";
import { socket } from "../services/socket";

export function LobbyScreen({ profile, onRoomEntered }: { profile: SessionProfile; onRoomEntered: (room: Room) => void }) {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const updateRooms = (nextRooms: RoomSummary[]) => setRooms(nextRooms);
    socket.on("lobby:rooms", updateRooms);
    socket.emit("lobby:list");
    return () => { socket.off("lobby:rooms", updateRooms); };
  }, []);

  const createRoom = (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    socket.emit("room:create", { roomName, profile }, (response) => {
      setPending(false);
      if (response.ok) onRoomEntered(response.data);
      else setError(response.error);
    });
  };

  const joinRoom = (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    socket.emit("room:join", { roomCode, profile }, (response) => {
      setPending(false);
      if (response.ok) onRoomEntered(response.data);
      else setError(response.error);
    });
  };

  return (
    <Shell right={<div className="flex items-center gap-3"><Avatar avatar={profile.character.avatar} color={profile.character.color} size="sm" /><div className="hidden text-right sm:block"><p className="text-sm font-bold text-white">{profile.character.name}</p><p className="text-xs text-zinc-500">@{profile.username}</p></div></div>}>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-chaos-violet">Club lobby</p>
        <h1 className="mt-2 text-4xl font-black text-white">Find your room.</h1>
        <p className="mt-2 text-zinc-500">Create a private space or enter an existing room code.</p>
      </div>

      {error && <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <form onSubmit={createRoom} className="glass-panel rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-chaos-violet/15 p-3 text-chaos-violet"><Plus size={21} /></div><div><h2 className="font-bold text-white">Create room</h2><p className="text-xs text-zinc-500">You become the room host</p></div></div>
            <input className="field" value={roomName} onChange={(event) => setRoomName(event.target.value)} maxLength={32} placeholder={`${profile.username}'s Room`} />
            <Button className="mt-3 w-full" disabled={pending} type="submit"><DoorOpen size={18} /> Create Room</Button>
          </form>
          <form onSubmit={joinRoom} className="glass-panel rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-chaos-cyan/10 p-3 text-chaos-cyan"><LogIn size={21} /></div><div><h2 className="font-bold text-white">Join by code</h2><p className="text-xs text-zinc-500">Codes contain six characters</p></div></div>
            <input className="field uppercase tracking-[0.35em]" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
            <Button className="mt-3 w-full" variant="secondary" disabled={pending || roomCode.length < 6} type="submit"><Radio size={18} /> Join Room</Button>
          </form>
        </div>

        <section className="glass-panel rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-white">Active rooms</h2><p className="text-xs text-zinc-500">Live from this server instance</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">{rooms.length} online</span></div>
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 text-center"><div><Users className="mx-auto mb-3 text-zinc-700" size={34} /><p className="font-medium text-zinc-400">No active rooms yet</p><p className="mt-1 text-xs text-zinc-600">Create the first room on this server.</p></div></div>
            ) : rooms.map((room) => (
              <button key={room.id} onClick={() => setRoomCode(room.code)} className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-4 text-left transition hover:border-chaos-violet/30 hover:bg-chaos-violet/5">
                <div><p className="font-bold text-white">{room.name}</p><p className="mt-1 font-mono text-xs tracking-widest text-chaos-cyan">{room.code}</p></div>
                <span className="flex items-center gap-2 text-sm text-zinc-500"><Users size={15} /> {room.playerCount}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

