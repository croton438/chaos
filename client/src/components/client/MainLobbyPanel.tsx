import type { RoomSummary, SessionProfile } from "@chaos-club/shared";
import { Crown, DoorOpen, Fingerprint, LogIn, Radio, ScanLine, Sparkles, Users } from "lucide-react";
import type { FormEvent } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { RoomCard } from "./RoomCard";

interface MainLobbyPanelProps {
  profile: SessionProfile;
  rooms: RoomSummary[];
  roomName: string;
  roomCode: string;
  connected: boolean;
  pending: boolean;
  error: string | null;
  onRoomNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
  onCreate: (event: FormEvent) => void;
  onJoin: (event: FormEvent) => void;
}

export function MainLobbyPanel({ profile, rooms, roomName, roomCode, connected, pending, error, onRoomNameChange, onRoomCodeChange, onCreate, onJoin }: MainLobbyPanelProps) {
  const { language } = useLanguage();
  const tr = language === "tr";
  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-5 2xl:px-9 2xl:py-7">
      <header className="shrink-0 border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.38em] text-chaos-violet"><ScanLine size={13} /> {tr ? "Çevrimiçi Sosyal Güç Oyunu" : "Online Social Power Game"}</div>
        <div className="mt-2 flex items-end justify-between gap-4"><div><h1 className="client-title text-3xl font-black uppercase text-white 2xl:text-4xl">Chaos Club Lobby</h1><p className="mt-1 text-sm font-medium tracking-wide text-zinc-500">{tr ? "Güvenme. Pazarlık yap. Yalan söyle. Kazan." : "Trust no one. Negotiate. Lie. Win."}</p></div><div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-black/30 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600 lg:flex"><Fingerprint size={14} className="text-chaos-cyan" /> ID {profile.id.slice(0, 8)}</div></div>
      </header>

      {error && <div className="mt-3 shrink-0 rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-200">{error}</div>}

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[minmax(17rem,.82fr)_minmax(20rem,1.18fr)] gap-4">
        <section className="game-panel flex min-h-0 flex-col overflow-hidden p-4 2xl:p-5">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-chaos-violet/15 text-chaos-violet shadow-[0_0_20px_rgba(139,92,246,.18)]"><Crown size={19} /></div><div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-chaos-violet">{tr ? "Yeni Masa" : "New Table"}</p><h2 className="text-base font-black uppercase text-white">{tr ? "Kaos Odası Kur" : "Create Chaos Room"}</h2></div></div>
          <form onSubmit={onCreate} className="mt-4 flex flex-1 flex-col">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">{tr ? "Oda Çağrı Adı" : "Room Callsign"}</label>
            <div className="relative mt-2"><input className="game-field pr-11" value={roomName} onChange={(event) => onRoomNameChange(event.target.value)} maxLength={32} placeholder={tr ? `${profile.username} yeraltı masası` : `${profile.username}'s underground table`} /><Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-chaos-violet/50" size={17} /></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600"><div className="rounded-lg border border-white/[0.06] bg-black/30 p-2.5"><span className="block text-zinc-300">1–8</span>{tr ? "Oyuncu" : "Players"}</div><div className="rounded-lg border border-white/[0.06] bg-black/30 p-2.5"><span className="block text-emerald-300">P2P</span>{tr ? "Ses Kanalı" : "Voice Channel"}</div></div>
            <button className="client-primary-button mt-auto" disabled={pending || !connected} type="submit"><DoorOpen size={20} /><span>{pending ? (tr ? "ODA HAZIRLANIYOR..." : "PREPARING ROOM...") : (tr ? "ODA OLUŞTUR" : "CREATE ROOM")}</span><span className="ml-auto text-[9px] opacity-50">ENTER</span></button>
          </form>

          <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.06]" /><span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-700">{tr ? "veya" : "or"}</span><span className="h-px flex-1 bg-white/[0.06]" /></div>

          <form onSubmit={onJoin}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-chaos-cyan"><LogIn size={15} /> {tr ? "Oda Koduyla Sız" : "Infiltrate by Code"}</div>
            <div className="mt-3 flex gap-2"><input className="game-field min-w-0 flex-1 uppercase tracking-[0.35em]" value={roomCode} onChange={(event) => onRoomCodeChange(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" /><button className="grid w-12 shrink-0 place-items-center rounded-lg border border-chaos-cyan/25 bg-chaos-cyan/10 text-chaos-cyan transition hover:border-chaos-cyan/60 hover:bg-chaos-cyan/20 disabled:opacity-30" disabled={pending || !connected || roomCode.length < 6} type="submit"><Radio size={19} /></button></div>
          </form>
        </section>

        <section className="game-panel flex min-h-0 flex-col overflow-hidden p-4 2xl:p-5">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] pb-3"><div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-chaos-cyan">{tr ? "Canlı Ağ Taraması" : "Live Network Scan"}</p><h2 className="mt-1 text-base font-black uppercase text-white">{tr ? "Canlı Kaos Odaları" : "Live Chaos Rooms"}</h2></div><span className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-black/30 px-3 py-1.5 text-[10px] font-bold text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> {rooms.length} LIVE</span></div>
          <div className="client-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {rooms.length === 0 ? <div className="relative grid h-full min-h-52 place-items-center overflow-hidden rounded-xl border border-dashed border-white/[0.08] bg-black/20 text-center"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.08),transparent_55%)]" /><div className="relative"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/[0.07] bg-black/40 text-zinc-700"><Users size={28} /></div><p className="mt-4 text-sm font-black uppercase tracking-[0.12em] text-zinc-400">{tr ? "Aktif kaos odası yok" : "No active chaos rooms"}</p><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-zinc-700">{tr ? "Kulüp sessiz. İlk masayı kur ve karanlık ağı uyandır." : "The club is quiet. Open the first table and wake the underground network."}</p><div className="mt-4 flex justify-center gap-1">{[0, 1, 2].map((item) => <span key={item} className="h-1 w-6 rounded-full bg-chaos-violet/20" />)}</div></div></div> : rooms.map((room) => <RoomCard key={room.id} room={room} selected={room.code === roomCode} onSelect={() => onRoomCodeChange(room.code)} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
