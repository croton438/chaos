import type { GameChoice } from "@chaos-club/shared";
import { CheckCircle2, Eye } from "lucide-react";

interface DecisionButtonsProps {
  choices: GameChoice[];
  locked: boolean;
  pending: boolean;
  onChoose: (choiceId: string) => void;
}

export function DecisionButtons({ choices, locked, pending, onChoose }: DecisionButtonsProps) {
  if (locked) {
    return <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 font-semibold text-emerald-300"><CheckCircle2 size={20} /> Decision locked. Your choice stays secret.</div>;
  }
  if (choices.length === 0) {
    return <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-500"><Eye size={20} /> You are observing this deal.</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {choices.map((choice) => (
        <button key={choice.id} disabled={pending} onClick={() => onChoose(choice.id)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-chaos-violet/60 hover:bg-chaos-violet/10 disabled:opacity-50">
          <span className="font-bold text-white">{choice.label}</span>
          {choice.description && <span className="mt-1 block text-xs leading-5 text-zinc-500">{choice.description}</span>}
        </button>
      ))}
    </div>
  );
}
