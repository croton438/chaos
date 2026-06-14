import type { SessionProfile } from "@chaos-club/shared";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

interface GameShellProps {
  profile: SessionProfile;
  connected: boolean;
  activeMenu?: string;
  roomName?: string;
  roomCode?: string;
  children: ReactNode;
  socialPanel: ReactNode;
}

export function GameShell({ profile, connected, activeMenu, roomName, roomCode, children, socialPanel }: GameShellProps) {
  return (
    <main className="game-client-shell">
      <div className="client-atmosphere" aria-hidden="true"><div className="client-sigil">CC</div></div>
      <div className="relative z-10 grid min-h-0 grid-cols-[13.75rem_minmax(0,1fr)_20.5rem] max-[1180px]:grid-cols-[5rem_minmax(0,1fr)_19rem]">
        <Sidebar profile={profile} active={activeMenu} roomName={roomName} />
        <section className="min-h-0 min-w-0 overflow-hidden border-x border-white/[0.055]">{children}</section>
        <aside className="min-h-0 min-w-0 overflow-hidden bg-[#08080c]/80 backdrop-blur-xl">{socialPanel}</aside>
      </div>
      <StatusBar connected={connected} roomCode={roomCode} />
    </main>
  );
}
