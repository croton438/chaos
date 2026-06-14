import type { GameState } from "@chaos-club/shared";
import { Crown, RotateCcw } from "lucide-react";
import { Button } from "../Button";
import { useLanguage } from "../../i18n/LanguageContext";

export function GameOver({ game, isHost, onRestart }: { game: GameState; isHost: boolean; onRestart: () => void }) {
  const { t } = useLanguage();
  const winners = game.scores.filter((score) => game.winnerIds.includes(score.playerId));
  return (
    <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-black/40 p-8 text-center">
      <Crown className="mx-auto text-amber-300" size={48} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">{t("game.complete")}</p>
      <h2 className="mt-2 text-4xl font-black text-white">{winners.length > 1 ? t("game.tie") : t("game.wins", { name: winners[0]?.characterName ?? "-" })}</h2>
      <p className="mt-3 text-zinc-500">{t("game.finalScore", { score: winners[0]?.points ?? 0 })}</p>
      {isHost && <Button className="mt-7" onClick={onRestart}><RotateCcw size={18} /> {t("game.playAgain")}</Button>}
    </section>
  );
}
