import { AudioLines } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-chaos-violet/40 bg-chaos-violet/15 text-chaos-violet shadow-neon">
        <AudioLines size={24} />
      </div>
      <div>
        <div className={`${compact ? "text-lg" : "text-2xl"} font-black uppercase tracking-[0.22em] text-white`}>
          Chaos
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-chaos-cyan">Club</div>
      </div>
    </div>
  );
}

