import type { RoomSummary } from "@chaos-club/shared";
import { Radio, Users } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export function RoomCard({ room, selected, onSelect }: { room: RoomSummary; selected: boolean; onSelect: () => void }) {
  const { language } = useLanguage();
  return (
    <button onClick={onSelect} className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border p-3.5 text-left transition duration-200 ${selected ? "border-chaos-violet/60 bg-chaos-violet/10 shadow-[0_0_24px_rgba(139,92,246,.12)]" : "border-white/[0.07] bg-black/30 hover:-translate-y-0.5 hover:border-chaos-cyan/30 hover:bg-white/[0.035]"}`}>
      <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-chaos-violet to-chaos-cyan opacity-0 transition group-hover:opacity-100" />
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-chaos-cyan/15 bg-chaos-cyan/[0.07] text-chaos-cyan"><Radio size={19} /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-black uppercase tracking-wide text-white">{room.name}</p><p className="mt-1 font-mono text-[10px] tracking-[0.24em] text-chaos-cyan">{room.code}</p></div>
      <div className="text-right"><span className="flex items-center justify-end gap-1.5 text-sm font-bold text-zinc-300"><Users size={14} /> {room.playerCount}/8</span><p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-emerald-400">{language === "tr" ? "Katılıma Açık" : "Open"}</p></div>
    </button>
  );
}
