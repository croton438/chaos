import type { GameState, Room, SessionProfile } from "@chaos-club/shared";
import { Clock3, Play, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { socket } from "../../services/socket";
import { Button } from "../Button";
import { DecisionButtons } from "./DecisionButtons";
import { GameOver } from "./GameOver";
import { RoundResult } from "./RoundResult";
import { Scoreboard } from "./Scoreboard";
import { TaskCard } from "./TaskCard";

export function GamePanel({ room, profile }: { room: Room; profile: SessionProfile }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHost = room.hostId === profile.id;

  useEffect(() => {
    const updateGame = (state: GameState) => setGame(state);
    socket.on("game:state", updateGame);
    socket.emit("game:state-request");
    return () => { socket.off("game:state", updateGame); };
  }, []);

  useEffect(() => {
    if (!game || game.status === "finished") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [game]);

  const startGame = () => {
    setPending(true); setError(null);
    socket.emit("game:start", (response) => {
      setPending(false);
      if (response.ok) setGame(response.data);
      else setError(response.error);
    });
  };

  const submitDecision = (choiceId: string) => {
    setPending(true); setError(null);
    socket.emit("game:decision", choiceId, (response) => {
      setPending(false);
      if (response.ok) setGame(response.data);
      else setError(response.error);
    });
  };

  if (!game) {
    return (
      <section className="glass-panel rounded-3xl p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-chaos-violet/15 text-chaos-violet"><Play size={26} /></div>
        <h2 className="mt-4 text-2xl font-black text-white">The table is ready</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">Eight rounds of deals, betrayal and temporary alliances. Solo games use the House Bot for testing.</p>
        <div className="mt-5 flex justify-center gap-4 text-xs text-zinc-500"><span className="flex items-center gap-2"><Users size={15} /> {room.players.length}/8 players</span><span className="flex items-center gap-2"><Clock3 size={15} /> 30 sec rounds</span></div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        {isHost ? <Button className="mt-6" disabled={pending} onClick={startGame}><Play size={18} /> {pending ? "Starting..." : "Start Game"}</Button> : <p className="mt-6 text-sm text-zinc-600">Waiting for the host to start.</p>}
      </section>
    );
  }

  const targetTime = game.status === "playing" ? game.roundEndsAt : game.nextRoundAt;
  const secondsLeft = targetTime ? Math.max(0, Math.ceil((targetTime - now) / 1000)) : 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-chaos-violet">Chaos game</p><p className="mt-1 font-black text-white">Round {game.roundNumber} / {game.maxRounds}</p></div>
        {game.status !== "finished" && <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xl font-black ${secondsLeft <= 5 ? "bg-rose-500/15 text-rose-300" : "bg-chaos-cyan/10 text-chaos-cyan"}`}><Clock3 size={19} /> {secondsLeft}s</div>}
      </div>
      {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          {game.status === "finished" ? <GameOver game={game} isHost={isHost} onRestart={startGame} /> : game.status === "round_result" && game.result ? <RoundResult result={game.result} /> : game.task ? <><TaskCard task={game.task} /><DecisionButtons choices={game.availableChoices} locked={game.decisionLocked} pending={pending} onChoose={submitDecision} /></> : null}
        </div>
        <Scoreboard scores={game.scores} currentPlayerId={profile.id} />
      </div>
    </section>
  );
}

