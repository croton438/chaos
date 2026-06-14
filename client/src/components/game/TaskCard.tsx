import type { PublicTask } from "@chaos-club/shared";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Avatar } from "../Avatar";

export function TaskCard({ task }: { task: PublicTask }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-chaos-violet/25 bg-gradient-to-br from-chaos-violet/15 via-black/35 to-chaos-cyan/5 p-6 shadow-neon">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-chaos-violet/10 blur-3xl" />
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-chaos-cyan"><Sparkles size={14} /> Active deal</p>
        <h2 className="mt-2 text-3xl font-black text-white">{task.name}</h2>
        <p className="mt-3 max-w-2xl leading-7 text-zinc-300">{task.description}</p>
        {task.privateHint && (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            <LockKeyhole className="mt-0.5 shrink-0 text-amber-400" size={17} /> {task.privateHint}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-4">
          {task.participants.map((participant) => (
            <div key={participant.id} className="flex min-w-40 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <Avatar avatar={participant.avatar} color={participant.color} size="sm" />
              <div className="min-w-0"><p className="truncate font-bold text-white">{participant.name}</p><p className="text-xs text-zinc-500">{participant.role ?? (participant.isBot ? "House Bot" : "Player")}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

