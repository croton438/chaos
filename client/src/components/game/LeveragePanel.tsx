import type { LeverageCard } from "@chaos-club/shared";
import { Gem, LockKeyhole, Zap } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export function LeveragePanel({ cards, canPlay, pending, onPlay }: { cards: LeverageCard[]; canPlay: boolean; pending: boolean; onPlay: (cardId: string) => void }) {
  const { language, t } = useLanguage();
  return (
    <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.045] p-4">
      <div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300"><Gem size={15} /> {t("game.leverage")}</p><span className="rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-xs font-bold text-fuchsia-200">{cards.length}</span></div>
      {cards.length === 0 ? <p className="mt-3 text-xs leading-5 text-zinc-600">{language === "tr" ? "Özel Pazar görüşmesinde bir anlaşmayı Koz olarak kaydedebilirsin." : "Record an agreement as Leverage during a private Market meeting."}</p> : <div className="mt-3 space-y-2">{cards.map((card) => (
        <article key={card.id} className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-white">{card.targetName}</p><p className="mt-1 text-[10px] text-zinc-600">{language === "tr" ? `${card.roundNumber}. tur kaydı` : `Recorded in round ${card.roundNumber}`}</p></div><LockKeyhole size={14} className="text-fuchsia-300" /></div>
          {card.note && <p className="mt-2 rounded-lg bg-white/[0.035] p-2 text-xs italic leading-5 text-zinc-400">“{card.note}”</p>}
          {canPlay && <button disabled={pending} onClick={() => onPlay(card.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/25 disabled:opacity-50"><Zap size={13} /> {language === "tr" ? "Kozu Oyna (-1 Güven)" : "Play Leverage (-1 Trust)"}</button>}
        </article>
      ))}</div>}
    </section>
  );
}
