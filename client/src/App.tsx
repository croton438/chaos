import type { Character, Room, SessionProfile } from "@chaos-club/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { CharacterScreen } from "./screens/CharacterScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { RoomScreen } from "./screens/RoomScreen";
import { socket } from "./services/socket";

type Step = "landing" | "character" | "lobby" | "room";
const PROFILE_KEY = "chaos-club:profile";
const ROOM_CODE_KEY = "chaos-club:room-code";

function readStoredProfile(): SessionProfile | null {
  try {
    const value = localStorage.getItem(PROFILE_KEY);
    return value ? JSON.parse(value) as SessionProfile : null;
  } catch {
    localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

export function App() {
  const storedProfile = useRef(readStoredProfile()).current;
  const [step, setStep] = useState<Step>(storedProfile ? "lobby" : "landing");
  const [username, setUsername] = useState(storedProfile?.username ?? "");
  const [profile, setProfile] = useState<SessionProfile | null>(storedProfile);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const roomCode = localStorage.getItem(ROOM_CODE_KEY);
    if (!profile || !roomCode) return;

    let timeoutId: number | undefined;
    const restoreRoom = () => {
      timeoutId = window.setTimeout(() => {
        localStorage.removeItem(ROOM_CODE_KEY);
        setStep("lobby");
      }, 15_000);

      socket.emit("room:join", { roomCode, profile }, (response) => {
        window.clearTimeout(timeoutId);
        if (response.ok) {
          setRoom(response.data);
          setStep("room");
        } else {
          localStorage.removeItem(ROOM_CODE_KEY);
          setStep("lobby");
        }
      });
    };

    if (socket.connected) restoreRoom();
    else socket.once("connect", restoreRoom);

    return () => {
      socket.off("connect", restoreRoom);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [profile]);

  const enterClub = (nextUsername: string) => {
    setUsername(nextUsername);
    setStep("character");
  };

  const createCharacter = (character: Character) => {
    const nextProfile = { id: crypto.randomUUID(), username, character };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setStep("lobby");
  };

  const enterRoom = (nextRoom: Room) => {
    localStorage.setItem(ROOM_CODE_KEY, nextRoom.code);
    setRoom(nextRoom);
    setStep("room");
  };

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(ROOM_CODE_KEY);
    setRoom(null);
    setStep("lobby");
  }, []);

  if (step === "landing") return <LandingScreen onEnter={enterClub} />;
  if (step === "character") return <CharacterScreen username={username} onContinue={createCharacter} />;
  if (step === "room" && room && profile) return <RoomScreen initialRoom={room} profile={profile} onLeave={leaveRoom} />;
  if (profile) return <LobbyScreen profile={profile} onRoomEntered={enterRoom} />;
  return <LandingScreen onEnter={enterClub} />;
}
