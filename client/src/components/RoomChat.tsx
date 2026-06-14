import type { ChatMessage, SessionProfile } from "@chaos-club/shared";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { socket } from "../services/socket";
import { useLanguage } from "../i18n/LanguageContext";

export function RoomChat({ profile, compact = false }: { profile: SessionProfile; compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const receiveHistory = (history: ChatMessage[]) => setMessages(history);
    const receiveMessage = (message: ChatMessage) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message].slice(-100));
    };
    socket.on("room:chat-history", receiveHistory);
    socket.on("room:chat-message", receiveMessage);
    socket.emit("room:chat-list");
    return () => {
      socket.off("room:chat-history", receiveHistory);
      socket.off("room:chat-message", receiveMessage);
    };
  }, []);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!message || pending) return;
    setPending(true);
    setError(null);
    socket.emit("room:chat-send", message, (response) => {
      setPending(false);
      if (response.ok) setContent("");
      else setError(response.error);
    });
  };

  return (
    <section className={`glass-panel flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 ${compact ? "h-[22rem] xl:h-[calc(100vh-28rem)] xl:min-h-[18rem]" : "h-[32rem] xl:h-[calc(100vh-11rem)] xl:max-h-[46rem] xl:min-h-[34rem]"}`}>
      <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="rounded-xl bg-chaos-cyan/10 p-2.5 text-chaos-cyan"><MessageSquare size={19} /></div>
        <div><h2 className="font-bold text-white">{t("chat.title")}</h2><p className="text-xs text-zinc-500">{t("chat.description")}</p></div>
      </div>

      <div ref={messageListRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2">
        {messages.length === 0 && (
          <div className="grid h-56 place-items-center text-center">
            <div><MessageSquare className="mx-auto mb-3 text-zinc-700" size={30} /><p className="text-sm text-zinc-500">{t("chat.empty")}</p></div>
          </div>
        )}
        {messages.map((message) => {
          const isOwn = message.playerId === profile.id;
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${isOwn ? "bg-chaos-violet text-white" : "border border-white/5 bg-white/[0.04] text-zinc-200"}`}>
                <div className="mb-1 flex items-center gap-2 text-[11px]">
                  <span className={isOwn ? "text-violet-100" : "font-semibold"} style={isOwn ? undefined : { color: message.color }}>{message.characterName}</span>
                  <span className={isOwn ? "text-violet-200/70" : "text-zinc-600"}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="break-words text-sm leading-5">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
      <form onSubmit={submit} className="mt-4 flex gap-2 border-t border-white/5 pt-4">
        <input className="field min-w-0" maxLength={500} value={content} onChange={(event) => setContent(event.target.value)} placeholder={t("chat.placeholder")} />
        <button aria-label="Send message" disabled={!content.trim() || pending} className="grid w-12 shrink-0 place-items-center rounded-xl bg-chaos-violet text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40" type="submit"><Send size={18} /></button>
      </form>
    </section>
  );
}
