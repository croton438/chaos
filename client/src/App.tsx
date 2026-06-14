import type { Character, Room, SessionProfile } from "@chaos-club/shared";
import { useCallback, useState } from "react";
import { CharacterScreen } from "./screens/CharacterScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { RoomScreen } from "./screens/RoomScreen";

type Step = "landing" | "character" | "lobby" | "room";

export function App() {
  const [step, setStep] = useState<Step>("landing");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const enterClub = (nextUsername: string) => {
    setUsername(nextUsername);
    setStep("character");
  };

  const createCharacter = (character: Character) => {
    setProfile({ id: crypto.randomUUID(), username, character });
    setStep("lobby");
  };

  const enterRoom = (nextRoom: Room) => {
    setRoom(nextRoom);
    setStep("room");
  };

  const leaveRoom = useCallback(() => {
    setRoom(null);
    setStep("lobby");
  }, []);

  if (step === "landing") return <LandingScreen onEnter={enterClub} />;
  if (step === "character") return <CharacterScreen username={username} onContinue={createCharacter} />;
  if (step === "room" && room && profile) return <RoomScreen initialRoom={room} profile={profile} onLeave={leaveRoom} />;
  if (profile) return <LobbyScreen profile={profile} onRoomEntered={enterRoom} />;
  return <LandingScreen onEnter={enterClub} />;
}

