import { Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-black/40 p-0.5 text-[9px] font-black tracking-wider">
      <Languages size={12} className="mx-1 text-zinc-600" />
      {(["tr", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLanguage(option)} className={`rounded-md px-1.5 py-1 uppercase transition ${language === option ? "bg-chaos-violet text-white shadow-[0_0_10px_rgba(139,92,246,.25)]" : "text-zinc-600 hover:text-white"}`}>{option}</button>
      ))}
    </div>
  );
}
