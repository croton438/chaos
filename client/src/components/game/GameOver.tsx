import type { GameState } from "@chaos-club/shared";
import { Crown, RotateCcw } from "lucide-react";
import { Button } from "../Button";

export function GameOver({ game, isHost, onRestart }: { game: GameState; isHost: boolean; onRestart: () => void }) {
  const winners = game.scores.filter((score) => game.winnerIds.includes(score.playerId));
  return (
    <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-black/40 p-8 text-center">
      <Crown className="mx-auto text-amber-300" size={48} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">Game complete</p>
      <h2 className="mt-2 text-4xl font-black text-white">{winners.length > 1 ? "It's a tie" : `${winners[0]?.characterName ?? "Nobody"} wins`}</h2>
      <p className="mt-3 text-zinc-500">Final score: {winners[0]?.points ?? 0}</p>
      {isHost && <Button className="mt-7" onClick={onRestart}><RotateCcw size={18} /> Play Again</Button>}
    </section>
  );
}

