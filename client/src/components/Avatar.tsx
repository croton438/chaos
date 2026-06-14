import type { AvatarId } from "@chaos-club/shared";
import { Bot, ChefHat, CirclePlus, Crown, Glasses, HardHat, Headphones } from "lucide-react";

const sizeClasses = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-36 w-36",
};

const iconSizes = { sm: 20, md: 28, lg: 46 };

function Accessory({ avatar, color, size }: { avatar: AvatarId; color: string; size: "sm" | "md" | "lg" }) {
  const iconSize = iconSizes[size];
  const iconClass = "absolute left-1/2 top-[5%] z-30 -translate-x-1/2 drop-shadow-lg";
  if (avatar === "crown") return <Crown className={iconClass} size={iconSize} fill="#fbbf24" color="#f59e0b" />;
  if (avatar === "headphones" || avatar === "catPhones") return <Headphones className={iconClass} size={iconSize} color={color} />;
  if (avatar === "chef") return <ChefHat className={iconClass} size={iconSize} fill="#f4f4f5" color="#d4d4d8" />;
  if (avatar === "nurse") return <CirclePlus className={iconClass} size={iconSize} fill="#f4f4f5" color="#ef4444" />;
  if (avatar === "miner") return <HardHat className={iconClass} size={iconSize} fill="#eab308" color="#a16207" />;
  if (avatar === "robot") return <Bot className={iconClass} size={iconSize} color="#94a3b8" />;
  if (["goggles", "sunglasses", "glasses"].includes(avatar)) return <Glasses className="absolute left-1/2 top-[43%] z-30 -translate-x-1/2" size={iconSize} color={avatar === "glasses" ? "#27272a" : "#09090b"} />;

  if (["cap", "beanie", "explorer", "topHat", "pirate", "bandana", "ninja", "wizard", "santa"].includes(avatar)) {
    const shape: Record<string, string> = {
      cap: "h-[24%] w-[68%] rounded-t-full rounded-br-lg",
      beanie: "h-[28%] w-[65%] rounded-t-full border-b-4",
      explorer: "h-[20%] w-[78%] rounded-full border-b-4",
      topHat: "h-[38%] w-[58%] rounded-t-md border-b-[6px]",
      pirate: "h-[30%] w-[78%] rounded-t-full border-b-4",
      bandana: "h-[19%] w-[75%] rounded-t-full border-b-4",
      ninja: "h-[33%] w-[74%] rounded-t-2xl",
      wizard: "h-[48%] w-[58%] -skew-x-12 rounded-t-full",
      santa: "h-[39%] w-[68%] -skew-x-12 rounded-t-full border-b-[5px] border-white",
    };
    const colors: Record<string, string> = {
      cap: "#ef4444", beanie: "#65a30d", explorer: "#d97706", topHat: "#18181b",
      pirate: "#27272a", bandana: "#dc2626", ninja: "#18181b", wizard: "#4c1d95", santa: "#dc2626",
    };
    return <div className={`absolute left-1/2 top-[2%] z-20 -translate-x-1/2 border-black/30 ${shape[avatar]}`} style={{ backgroundColor: colors[avatar] }} />;
  }

  if (avatar === "curls" || avatar === "hair") {
    return (
      <div className="absolute left-1/2 top-[12%] z-20 flex w-[70%] -translate-x-1/2 justify-center gap-[2px]">
        {[0, 1, 2, 3].map((item) => <span key={item} className={`${avatar === "curls" ? "rounded-full" : "skew-x-12 rounded-t-full"} h-4 w-5 bg-[#3f2a1d]`} />)}
      </div>
    );
  }
  return null;
}

export function Avatar({ avatar, color, size = "md" }: { avatar: AvatarId; color: string; size?: "sm" | "md" | "lg" }) {
  const safeAvatar = avatar ?? "sprout";
  const isNinja = safeAvatar === "ninja";
  const hasEyePatch = safeAvatar === "eyePatch" || safeAvatar === "pirate";
  return (
    <div className={`relative shrink-0 ${sizeClasses[size]}`} aria-label={`${safeAvatar} box character`}>
      <div className="absolute left-1/2 top-0 z-10 h-[23%] w-[10%] -translate-x-1/2 rounded-full bg-lime-500 rotate-[-28deg]" />
      <div className="absolute left-[50%] top-[2%] z-10 h-[15%] w-[18%] rounded-[100%_0] bg-lime-400 rotate-12" />
      <div
        className={`absolute bottom-[3%] left-1/2 h-[75%] w-[72%] -translate-x-1/2 overflow-visible rounded-[18%_16%_22%_15%] border-2 border-[#8a5b2d] shadow-lg ${safeAvatar === "cracked" ? "after:absolute after:left-1/2 after:top-0 after:h-1/2 after:w-px after:rotate-12 after:bg-[#6b4423]" : ""}`}
        style={{ background: "linear-gradient(135deg, #d9a85f 0%, #c78b3e 55%, #b97932 100%)", boxShadow: `0 0 24px ${color}33` }}
      >
        <div className="absolute inset-y-0 left-[12%] w-px bg-white/10" />
        <div className={`absolute top-[43%] h-[17%] w-[13%] rounded-full bg-zinc-950 ${isNinja ? "left-[24%]" : "left-[22%]"}`} />
        <div className={`absolute top-[43%] h-[17%] w-[13%] rounded-full bg-zinc-950 ${isNinja ? "right-[24%]" : "right-[22%]"}`} />
        {hasEyePatch && <div className="absolute left-[13%] top-[39%] z-20 h-[25%] w-[31%] rounded-full bg-zinc-900 after:absolute after:-right-[130%] after:top-0 after:h-[2px] after:w-[180%] after:-rotate-12 after:bg-zinc-900" />}
        {safeAvatar === "moustache" && <div className="absolute left-1/2 top-[62%] h-[12%] w-[42%] -translate-x-1/2 rounded-b-full bg-[#3f2a1d] before:absolute before:-left-[9%] before:-top-[30%] before:h-full before:w-[58%] before:rotate-12 before:rounded-full before:bg-[#3f2a1d] after:absolute after:-right-[9%] after:-top-[30%] after:h-full after:w-[58%] after:-rotate-12 after:rounded-full after:bg-[#3f2a1d]" />}
        {safeAvatar === "catPhones" && <><div className="absolute -left-[12%] -top-[12%] h-[25%] w-[30%] rotate-[-20deg] bg-pink-400 [clip-path:polygon(50%_0,100%_100%,0_100%)]" /><div className="absolute -right-[12%] -top-[12%] h-[25%] w-[30%] rotate-[20deg] bg-pink-400 [clip-path:polygon(50%_0,100%_100%,0_100%)]" /></>}
      </div>
      <Accessory avatar={safeAvatar} color={color} size={size} />
      <div className="absolute bottom-0 left-1/2 h-[5%] w-[44%] -translate-x-1/2 rounded-full blur-sm" style={{ backgroundColor: `${color}66` }} />
    </div>
  );
}

