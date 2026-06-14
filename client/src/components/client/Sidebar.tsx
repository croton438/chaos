import type { SessionProfile } from "@chaos-club/shared";
import { BookOpen, Boxes, Clock3, DoorOpen, LockKeyhole, Settings, Shield, Swords } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { Avatar } from "../Avatar";
import { Brand } from "../Brand";
import { LanguageToggle } from "../LanguageToggle";

const menuItems = [
  { id: "lobby", icon: DoorOpen, tr: "Lobi", en: "Lobby" },
  { id: "private", icon: LockKeyhole, tr: "Özel Oda", en: "Private Room" },
  { id: "collection", icon: Boxes, tr: "Koleksiyon", en: "Collection" },
  { id: "history", icon: Clock3, tr: "Maç Geçmişi", en: "Match History" },
  { id: "settings", icon: Settings, tr: "Ayarlar", en: "Settings" },
] as const;

export function Sidebar({ profile, active = "lobby", roomName }: { profile: SessionProfile; active?: string; roomName?: string }) {
  const { language } = useLanguage();
  return (
    <aside className="client-sidebar">
      <div className="px-5 pb-5 pt-6"><Brand /></div>
      <div className="mx-4 border-y border-white/[0.07] py-4">
        <div className="relative flex items-center gap-3 rounded-xl bg-white/[0.025] p-3">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-chaos-violet/10 to-transparent" />
          <div className="relative"><Avatar avatar={profile.character.avatar} color={profile.character.color} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#09090d] bg-emerald-400 shadow-[0_0_8px_#34d399]" /></div>
          <div className="relative min-w-0 flex-1"><p className="truncate text-sm font-black uppercase tracking-wide text-white">{profile.character.name}</p><p className="truncate text-[11px] text-zinc-500">@{profile.username}</p><div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300"><Shield size={11} /> {language === "tr" ? "Üye · Seviye 01" : "Member · Level 01"}</div></div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 px-3 py-5">
        <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">{language === "tr" ? "Kulüp Menüsü" : "Club Menu"}</p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const selected = item.id === active;
            return <button key={item.id} type="button" className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] transition ${selected ? "bg-chaos-violet/15 text-white" : "text-zinc-600 hover:bg-white/[0.035] hover:text-zinc-300"}`}><span className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${selected ? "bg-chaos-violet shadow-[0_0_12px_#8b5cf6]" : "bg-transparent"}`} /><Icon size={17} className={selected ? "text-chaos-violet" : "transition group-hover:text-chaos-cyan"} />{language === "tr" ? item.tr : item.en}{item.id !== "lobby" && item.id !== "private" && <span className="ml-auto text-[8px] text-zinc-700">SOON</span>}</button>;
          })}
        </div>
      </nav>
      <div className="mx-4 mb-4 rounded-xl border border-white/[0.06] bg-black/30 p-3">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600"><Swords size={12} /> {roomName ? (language === "tr" ? "Aktif Masa" : "Active Table") : (language === "tr" ? "Eşleşme" : "Matchmaking")}</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div>
        <p className="mt-2 truncate text-xs font-semibold text-zinc-300">{roomName ?? (language === "tr" ? "Bir oda seçilmedi" : "No room selected")}</p>
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3"><div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-zinc-700"><BookOpen size={12} /> CODEX</div><LanguageToggle /></div>
    </aside>
  );
}
