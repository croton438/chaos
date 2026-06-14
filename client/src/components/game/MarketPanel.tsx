import type { GameState, Room, SessionProfile } from "@chaos-club/shared";
import { Check, DoorOpen, Gem, LockKeyhole, PhoneOff, Users, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

interface MarketPanelProps {
  game: GameState;
  room: Room;
  profile: SessionProfile;
  pending: boolean;
  onRequest: (targetIds: string[]) => void;
  onRespond: (requestId: string, accepted: boolean) => void;
  onLeave: () => void;
  onCreateLeverage: (targetPlayerId: string, note: string) => void;
}

export function MarketPanel({ game, room, profile, pending, onRequest, onRespond, onLeave, onCreateLeverage }: MarketPanelProps) {
  const { language } = useLanguage();
  const [selected, setSelected] = useState<string[]>([]);
  const [targetId, setTargetId] = useState("");
  const [note, setNote] = useState("");
  const meeting = game.activeMeeting;
  const inMeeting = meeting?.participantIds.includes(profile.id) ?? false;
  const meetingTargets = room.players.filter((player) => meeting?.participantIds.includes(player.id) && player.id !== profile.id);
  const availablePlayers = room.players.filter((player) => player.id !== profile.id);

  const toggleTarget = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);
  const recordLeverage = () => {
    if (!targetId) return;
    onCreateLeverage(targetId, note);
    setNote("");
  };

  if (game.meetingInvitation) {
    return <section className="rounded-3xl border border-chaos-cyan/25 bg-chaos-cyan/[0.06] p-6 text-center"><LockKeyhole className="mx-auto text-chaos-cyan" size={34} /><h2 className="mt-3 text-2xl font-black text-white">{language === "tr" ? "Özel görüşme daveti" : "Private meeting invitation"}</h2><p className="mt-2 text-zinc-400">{game.meetingInvitation.requesterName} · {game.meetingInvitation.participantNames.join(", ")}</p><div className="mt-5 flex justify-center gap-3"><button disabled={pending} onClick={() => onRespond(game.meetingInvitation!.requestId, true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black"><Check size={18} /> {language === "tr" ? "Kabul Et" : "Accept"}</button><button disabled={pending} onClick={() => onRespond(game.meetingInvitation!.requestId, false)} className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-5 py-3 font-bold text-rose-200"><X size={18} /> {language === "tr" ? "Reddet" : "Decline"}</button></div></section>;
  }

  if (meeting) {
    return <section className="rounded-3xl border border-chaos-violet/25 bg-gradient-to-br from-chaos-violet/12 to-black/30 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-chaos-violet"><DoorOpen size={16} /> {language === "tr" ? "Özel oda aktif" : "Private room active"}</p><h2 className="mt-2 text-2xl font-black text-white">{meeting.participantNames.join(" + ")}</h2><p className="mt-2 text-sm text-zinc-500">{inMeeting ? (language === "tr" ? "Yalnız bu odadaki kişileri duyuyorsun." : "You can only hear people in this room.") : (language === "tr" ? "Görüşmenin içeriği gizli. Açık kanalda konuşmaya devam edebilirsin." : "The content is private. You can keep talking in the public channel.")}</p></div>{inMeeting && <button disabled={pending} onClick={onLeave} className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-200"><PhoneOff size={16} /> {language === "tr" ? "Görüşmeyi Bitir" : "End Meeting"}</button>}</div>
      {inMeeting && <div className="mt-6 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.055] p-4"><p className="flex items-center gap-2 text-sm font-bold text-fuchsia-200"><Gem size={17} /> {language === "tr" ? "Koz Kaydı Oluştur" : "Record Leverage"}</p><p className="mt-1 text-xs text-zinc-500">{language === "tr" ? "Kartın varlığı kaydedilir; notunu yalnızca sen görürsün. Turda bir kez." : "The card's existence is recorded; only you see its note. Once per round."}</p><div className="mt-3 grid gap-3 md:grid-cols-[12rem_1fr_auto]"><select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white"><option value="">{language === "tr" ? "Kişi seç" : "Choose player"}</option>{meetingTargets.map((player) => <option key={player.id} value={player.id}>{player.character.name}</option>)}</select><input maxLength={140} value={note} onChange={(event) => setNote(event.target.value)} placeholder={language === "tr" ? "Gizli not (isteğe bağlı)" : "Private note (optional)"} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/50" /><button disabled={!targetId || pending} onClick={recordLeverage} className="rounded-xl bg-fuchsia-500 px-4 py-3 text-sm font-black text-white disabled:opacity-40">{language === "tr" ? "Kaydet" : "Record"}</button></div></div>}
    </section>;
  }

  if (game.meetingRequestPending) return <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center"><Users className="mx-auto animate-pulse text-chaos-violet" size={32} /><h2 className="mt-3 text-xl font-black text-white">{language === "tr" ? "Davet yanıtı bekleniyor" : "Waiting for invitation responses"}</h2><p className="mt-2 text-sm text-zinc-500">{language === "tr" ? "Tüm davetliler kabul ederse özel ses odası açılacak." : "The private voice room opens when every invitee accepts."}</p></section>;

  return <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-chaos-cyan"><Users size={16} /> {language === "tr" ? "Pazar açık" : "Market open"}</p><h2 className="mt-2 text-2xl font-black text-white">{language === "tr" ? "Özel görüşme kur" : "Start a private meeting"}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{language === "tr" ? "Bir veya iki oyuncu seç. Aynı anda yalnızca bir özel oda çalışır; kimlerin görüştüğünü herkes görür." : "Choose one or two players. Only one private room can run at a time, and its participants are public."}</p>{availablePlayers.length === 0 ? <p className="mt-5 rounded-xl bg-white/[0.03] p-4 text-sm text-zinc-500">{language === "tr" ? "Tek kişilik testte açık kanalda stratejini belirle. Görevlerde Kasa Botu devreye girer." : "In solo testing, plan in the public channel. The House Bot joins tasks."}</p> : <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{availablePlayers.map((player) => <button key={player.id} onClick={() => toggleTarget(player.id)} className={`rounded-xl border p-3 text-left transition ${selected.includes(player.id) ? "border-chaos-violet bg-chaos-violet/15" : "border-white/10 bg-black/25 hover:border-white/20"}`}><p className="font-bold text-white">{player.character.name}</p><p className="text-xs text-zinc-600">@{player.username}</p></button>)}</div><button disabled={selected.length === 0 || pending} onClick={() => onRequest(selected)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-chaos-violet px-5 py-3 font-black text-white disabled:opacity-40"><LockKeyhole size={17} /> {language === "tr" ? "Görüşme Daveti Gönder" : "Send Meeting Invitation"}</button></>}</section>;
}
