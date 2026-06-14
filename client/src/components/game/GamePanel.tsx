import type { GameState, Room, SessionProfile } from "@chaos-club/shared";
import { Clock3, Gem, LogOut, Mic, MicOff, Music2, Play, Radio, Users, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useGameMusic } from "../../hooks/useGameMusic";
import { localizeRuntimeMessage, useLanguage } from "../../i18n/LanguageContext";
import { socket } from "../../services/socket";
import { Brand } from "../Brand";
import { Button } from "../Button";
import { LanguageToggle } from "../LanguageToggle";
import { PlayerCard } from "../PlayerCard";
import { RoomChat } from "../RoomChat";
import { AbilityCard } from "./AbilityCard";
import { DecisionButtons } from "./DecisionButtons";
import { GameOver } from "./GameOver";
import { LeveragePanel } from "./LeveragePanel";
import { MarketPanel } from "./MarketPanel";
import { PhaseTrack } from "./PhaseTrack";
import { RoundIntro } from "./RoundIntro";
import { RoundResult } from "./RoundResult";
import { Scoreboard } from "./Scoreboard";
import { TaskCard } from "./TaskCard";

interface GamePanelProps {
  room: Room;
  profile: SessionProfile;
  micEnabled: boolean;
  voiceError: string | null;
  playerVolumes: Record<string, number>;
  onToggleMic: () => void;
  onVolumeChange: (socketId: string, volume: number) => void;
  onLeave: () => void;
  onActiveChange: (active: boolean) => void;
  onVoiceGroupChange: (playerIds: string[] | undefined) => void;
}

export function GamePanel({ room, profile, micEnabled, voiceError, playerVolumes, onToggleMic, onVolumeChange, onLeave, onActiveChange, onVoiceGroupChange }: GamePanelProps) {
  const [game, setGame] = useState<GameState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const isHost = room.hostId === profile.id;
  const isGameActive = Boolean(game);
  const gameMusic = useGameMusic(Boolean(game && game.status !== "finished"));

  useEffect(() => {
    const updateGame = (state: GameState) => setGame(state);
    socket.on("game:state", updateGame);
    socket.emit("game:state-request");
    return () => {
      socket.off("game:state", updateGame);
    };
  }, []);

  useEffect(() => {
    onActiveChange(isGameActive);
    return () => onActiveChange(false);
  }, [isGameActive, onActiveChange]);

  useEffect(() => {
    onVoiceGroupChange(game?.voiceGroupPlayerIds);
    return () => onVoiceGroupChange(undefined);
  }, [game?.voiceGroupPlayerIds, onVoiceGroupChange]);

  useEffect(() => {
    if (!game || game.status === "finished") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [game]);

  const runAction = (emit: (done: (response: { ok: true; data: GameState } | { ok: false; error: string }) => void) => void) => {
    setPending(true);
    setError(null);
    emit((response) => {
      setPending(false);
      if (response.ok) setGame(response.data);
      else setError(response.error);
    });
  };

  const startGame = () => runAction((done) => socket.emit("game:start", done));
  const submitDecision = (choiceId: string) => runAction((done) => socket.emit("game:decision", choiceId, done));
  const requestMeeting = (targetIds: string[]) => runAction((done) => socket.emit("game:meeting-request", targetIds, done));
  const respondMeeting = (requestId: string, accepted: boolean) => runAction((done) => socket.emit("game:meeting-respond", requestId, accepted, done));
  const leaveMeeting = () => runAction((done) => socket.emit("game:meeting-leave", done));
  const createLeverage = (targetPlayerId: string, note: string) => runAction((done) => socket.emit("game:leverage-create", { targetPlayerId, note }, done));
  const playLeverage = (cardId: string) => runAction((done) => socket.emit("game:leverage-play", cardId, done));

  if (!game) {
    return (
      <section className="glass-panel rounded-3xl p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-chaos-violet/15 text-chaos-violet"><Play size={26} /></div>
        <h2 className="mt-4 text-2xl font-black text-white">{t("game.ready")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t("game.readyDescription")}</p>
        <div className="mt-5 flex justify-center gap-4 text-xs text-zinc-500"><span className="flex items-center gap-2"><Users size={15} /> {room.players.length}/8</span><span className="flex items-center gap-2"><Clock3 size={15} /> {t("game.roundTime")}</span></div>
        {error && <p className="mt-4 text-sm text-rose-300">{localizeRuntimeMessage(error, language)}</p>}
        {isHost ? <Button className="mt-6" disabled={pending} onClick={startGame}><Play size={18} /> {pending ? t("game.starting") : t("game.start")}</Button> : <p className="mt-6 text-sm text-zinc-600">{t("game.waitHost")}</p>}
      </section>
    );
  }

  const secondsLeft = game.phaseEndsAt ? Math.max(0, Math.ceil((game.phaseEndsAt - now) / 1000)) : 0;
  const phaseLabels = language === "tr"
    ? { agenda: "Gündem Açılışı", market: "Pazar", decision: "Gizli Karar", reveal: "İfşa", accountability: "Hesap Sorma", final_reveal: "Final İfşa Turu", finished: "Oyun Bitti" }
    : { agenda: "Agenda Opening", market: "Market", decision: "Secret Decision", reveal: "Reveal", accountability: "Accountability", final_reveal: "Final Reveal", finished: "Game Complete" };
  const canPlayLeverage = game.status === "reveal" || game.status === "final_reveal";

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-chaos-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(139,92,246,0.2),transparent_35rem),radial-gradient(circle_at_92%_82%,rgba(34,211,238,0.13),transparent_32rem)]" />
      <div className="relative mx-auto min-h-screen max-w-[1900px] px-4 py-4 sm:px-7">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Brand compact />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-bold uppercase tracking-[0.22em] text-chaos-violet">{phaseLabels[game.status]}</p><p className="text-sm font-semibold text-white">{game.status === "final_reveal" ? t("game.finalReveal") : `${t("game.round")} ${game.roundNumber}/${game.maxRounds}`}</p></div>
            {game.status !== "finished" && <div className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-black ${secondsLeft <= 5 ? "bg-rose-500/15 text-rose-300" : "bg-chaos-cyan/10 text-chaos-cyan"}`}><Clock3 size={18} /> {secondsLeft}s</div>}
            <LanguageToggle />
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5 lg:flex"><Music2 size={15} className="text-chaos-violet" /><input aria-label={t("game.music")} className="h-1 w-20 cursor-pointer accent-chaos-violet" type="range" min="0" max="100" value={Math.round(gameMusic.volume * 100)} onChange={(event) => gameMusic.setVolume(Number(event.target.value) / 100)} /><button aria-label={t("game.music")} onClick={gameMusic.toggleMuted} className="p-1 text-zinc-400 hover:text-white">{gameMusic.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button></div>
            <Button onClick={onToggleMic} variant={micEnabled ? "primary" : "secondary"} className={micEnabled ? "bg-emerald-500 hover:bg-emerald-400" : ""}>{micEnabled ? <Mic size={18} /> : <MicOff size={18} />}<span className="hidden md:inline">{micEnabled ? t("room.micOn") : t("room.enableMic")}</span></Button>
            <Button variant="danger" onClick={onLeave}><LogOut size={17} /><span className="hidden lg:inline">{t("common.leave")}</span></Button>
          </div>
        </header>

        {(error || voiceError || gameMusic.blocked) && <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{gameMusic.blocked ? t("game.musicBlocked") : localizeRuntimeMessage(error ?? voiceError, language)}</div>}
        {game.status !== "finished" && game.status !== "final_reveal" && <div className="mt-4"><PhaseTrack status={game.status} /></div>}

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <section className="space-y-5">
            {game.status === "finished" && <GameOver game={game} isHost={isHost} onRestart={startGame} />}
            {game.status === "agenda" && game.task && <RoundIntro task={game.task} />}
            {game.status === "market" && game.task && <><TaskCard task={game.task} /><MarketPanel game={game} room={room} profile={profile} pending={pending} onRequest={requestMeeting} onRespond={respondMeeting} onLeave={leaveMeeting} onCreateLeverage={createLeverage} /></>}
            {game.status === "decision" && game.task && <><TaskCard task={game.task} /><DecisionButtons choices={game.availableChoices} locked={game.decisionLocked} pending={pending} onChoose={submitDecision} /></>}
            {game.status === "reveal" && game.result && <RoundResult result={game.result} />}
            {game.status === "accountability" && game.result && <RoundResult result={game.result} accountability />}
            {game.status === "final_reveal" && <section className="relative overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/15 via-chaos-violet/10 to-black/40 p-8 text-center shadow-neon"><Gem className="mx-auto text-fuchsia-300" size={48} /><p className="mt-4 text-xs font-bold uppercase tracking-[0.35em] text-fuchsia-300">{t("game.finalReveal")}</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">{language === "tr" ? "Sakladığın bilgi şimdi silaha dönüşüyor." : "The information you saved becomes a weapon now."}</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-400">{language === "tr" ? "Elindeki Kozları oyna. Her kart hedefinden 2 Nüfuz düşürür, sana 1 Nüfuz kazandırır ve 1 Güven taşına mal olur." : "Play your Leverage. Each card removes 2 Influence from its target, grants you 1 Influence, and costs 1 Trust."}</p></section>}

            {game.status !== "finished" && <section className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-chaos-cyan"><Radio size={15} /> {t("game.voice")}</div><div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{room.players.map((player) => <PlayerCard key={player.socketId} player={player} isHost={player.id === room.hostId} isCurrentUser={player.id === profile.id} volume={playerVolumes[player.socketId] ?? 1} onVolumeChange={player.id === profile.id ? undefined : (volume) => onVolumeChange(player.socketId, volume)} />)}</div></section>}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <Scoreboard standings={game.standings} currentPlayerId={profile.id} />
            <AbilityCard ability={game.myAbility} />
            <LeveragePanel cards={game.myLeverage} canPlay={canPlayLeverage} pending={pending} onPlay={playLeverage} />
            <RoomChat profile={profile} compact />
          </aside>
        </div>
      </div>
    </main>
  );
}
