import { AVATAR_OPTIONS, COLOR_OPTIONS, type AvatarId, type Character } from "@chaos-club/shared";
import { ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Shell } from "../components/Shell";
import { useLanguage } from "../i18n/LanguageContext";

const avatarLabels: Record<"tr" | "en", Record<AvatarId, string>> = {
  tr: { sprout: "Klasik", curls: "Kıvırcık", moustache: "Bıyık", hair: "Dağınık", cap: "Şapka", beanie: "Bere", explorer: "Kaşif", topHat: "Silindir", crown: "Taç", goggles: "Gözlük", pirate: "Korsan", eyePatch: "Göz Bandı", bandana: "Bandana", ninja: "Ninja", wizard: "Büyücü", headphones: "Kulaklık", catPhones: "Kedi", sunglasses: "Güneşlik", glasses: "Gözlük", chef: "Şef", nurse: "Sağlıkçı", miner: "Madenci", santa: "Noel", robot: "Robot", cracked: "Çatlak" },
  en: { sprout: "Classic", curls: "Curls", moustache: "Moustache", hair: "Messy Hair", cap: "Cap", beanie: "Beanie", explorer: "Explorer", topHat: "Top Hat", crown: "Crown", goggles: "Goggles", pirate: "Pirate", eyePatch: "Eye Patch", bandana: "Bandana", ninja: "Ninja", wizard: "Wizard", headphones: "Headphones", catPhones: "Cat Phones", sunglasses: "Shades", glasses: "Glasses", chef: "Chef", nurse: "Medic", miner: "Miner", santa: "Santa", robot: "Robot", cracked: "Cracked" },
};

export function CharacterScreen({ username, onContinue }: { username: string; onContinue: (character: Character) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("sprout");
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const { language, t } = useLanguage();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) onContinue({ name: name.trim(), avatar, color });
  };

  return (
    <Shell right={<span className="text-sm text-zinc-500">{t("character.signed")} <strong className="text-zinc-300">@{username}</strong></span>}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="glass-panel flex min-h-96 flex-col items-center justify-center rounded-3xl p-8 text-center lg:sticky lg:top-8">
          <Avatar avatar={avatar} color={color} size="lg" />
          <h2 className="mt-5 text-2xl font-black text-white">{name.trim() || t("character.unnamed")}</h2>
          <p className="mt-1 text-sm text-zinc-500">@{username}</p>
          <div className="mt-6 h-1 w-16 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />
        </section>

        <form onSubmit={submit} className="glass-panel rounded-3xl p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-chaos-cyan">{t("character.setup")}</p>
          <h1 className="mt-2 text-3xl font-black text-white">{t("character.title")}</h1>
          <label className="mt-7 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">{t("character.name")}</span>
            <input className="field" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder={language === "tr" ? "Kışkırtıcı" : "The Instigator"} autoFocus />
          </label>
          <fieldset className="mt-6">
            <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{t("character.avatar")}</legend>
            <div className="grid max-h-[25rem] grid-cols-3 gap-2 overflow-y-auto pr-2 sm:grid-cols-4 md:grid-cols-5">
              {AVATAR_OPTIONS.map((option) => (
                <button type="button" key={option} title={avatarLabels[language][option]} onClick={() => setAvatar(option)} className={`grid place-items-center rounded-2xl border p-2 transition ${avatar === option ? "border-chaos-violet bg-chaos-violet/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                  <Avatar avatar={option} color={color} size="sm" />
                  <span className="mt-1 w-full truncate text-[10px] text-zinc-500">{avatarLabels[language][option]}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{t("character.color")}</legend>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((option) => (
                <button type="button" aria-label={`Select ${option}`} key={option} onClick={() => setColor(option)} className="grid h-10 w-10 place-items-center rounded-full border-2 transition" style={{ backgroundColor: option, borderColor: color === option ? "white" : "transparent" }}>
                  {color === option && <Check size={17} className="text-black" />}
                </button>
              ))}
            </div>
          </fieldset>
          <Button className="mt-8 w-full" type="submit" disabled={!name.trim()}>{t("character.continue")} <ArrowRight size={18} /></Button>
        </form>
      </div>
    </Shell>
  );
}
