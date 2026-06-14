import type { AvatarId } from "@chaos-club/shared";
import { Crown, Eye, Flame, VenetianMask } from "lucide-react";

const icons = {
  mask: VenetianMask,
  eye: Eye,
  crown: Crown,
  flame: Flame,
};

export function Avatar({ avatar, color, size = "md" }: { avatar: AvatarId; color: string; size?: "sm" | "md" | "lg" }) {
  const Icon = icons[avatar];
  const sizes = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-24 w-24" };
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl border ${sizes[size]}`}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}18`, boxShadow: `0 0 24px ${color}22` }}
    >
      <Icon size={size === "lg" ? 42 : size === "md" ? 26 : 20} />
    </div>
  );
}

