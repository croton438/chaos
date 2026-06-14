import { Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1 text-xs font-bold">
      <Languages size={15} className="mx-1 text-zinc-500" />
      {(["tr", "en"] as const).map((option) => (
        <button key={option} onClick={() => setLanguage(option)} className={`rounded-lg px-2.5 py-1.5 uppercase transition ${language === option ? "bg-chaos-violet text-white" : "text-zinc-500 hover:text-white"}`}>{option}</button>
      ))}
    </div>
  );
}

