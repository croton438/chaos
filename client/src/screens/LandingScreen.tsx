import { ArrowRight, Users, Waves } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Brand } from "../components/Brand";
import { Button } from "../components/Button";

export function LandingScreen({ onEnter }: { onEnter: (username: string) => void }) {
  const [username, setUsername] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = username.trim();
    if (value) onEnter(value);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-10">
      <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-chaos-violet/10" />
      <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-chaos-cyan/10" />
      <section className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center"><Brand /></div>
        <div className="glass-panel rounded-3xl p-7 sm:p-9">
          <div className="mb-7 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-chaos-violet">Private rooms. Open chaos.</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Enter the club</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Create your identity, join a room, and test the voice layer.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Username</span>
              <input className="field" maxLength={24} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="night_operator" autoFocus />
            </label>
            <Button className="w-full" disabled={!username.trim()} type="submit">Enter Club <ArrowRight size={18} /></Button>
          </form>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/5 pt-6 text-xs text-zinc-500">
            <span className="flex items-center gap-2"><Users size={15} className="text-chaos-violet" /> Live rooms</span>
            <span className="flex items-center gap-2"><Waves size={15} className="text-chaos-cyan" /> WebRTC voice</span>
          </div>
        </div>
      </section>
    </main>
  );
}

