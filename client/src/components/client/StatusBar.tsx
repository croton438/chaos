import { Activity, Radio, ShieldCheck, Wifi } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export function StatusBar({ connected, roomCode }: { connected: boolean; roomCode?: string }) {
  const { language } = useLanguage();
  return (
    <footer className="client-status-bar">
      <div className="flex min-w-0 items-center gap-4">
        <span className={`flex items-center gap-2 ${connected ? "text-emerald-300" : "text-amber-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "animate-pulse bg-amber-300"}`} />{connected ? (language === "tr" ? "CLUB NETWORK ONLINE" : "CLUB NETWORK ONLINE") : (language === "tr" ? "SUNUCUYA BAĞLANIYOR" : "CONNECTING TO SERVER")}</span>
        <span className="hidden items-center gap-1.5 text-zinc-600 md:flex"><Activity size={11} /> PING -- MS</span>
        {roomCode && <span className="hidden items-center gap-1.5 font-mono text-chaos-cyan md:flex"><Radio size={11} /> ROOM {roomCode}</span>}
      </div>
      <div className="flex items-center gap-4 text-zinc-600"><span className="hidden items-center gap-1.5 sm:flex"><ShieldCheck size={11} /> P2P VOICE READY</span><span className="flex items-center gap-1.5"><Wifi size={11} /> BUILD 0.1.0</span></div>
    </footer>
  );
}
