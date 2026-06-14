import type { Room, RoomSummary, SessionProfile } from "@chaos-club/shared";
import { useEffect, useState, type FormEvent } from "react";
import { GameShell } from "../components/client/GameShell";
import { MainLobbyPanel } from "../components/client/MainLobbyPanel";
import { VoicePanel } from "../components/client/VoicePanel";
import { socket } from "../services/socket";

export function LobbyScreen({ profile, onRoomEntered }: { profile: SessionProfile; onRoomEntered: (room: Room) => void }) {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const updateRooms = (nextRooms: RoomSummary[]) => setRooms(nextRooms);
    const onConnect = () => {
      setConnected(true);
      setError(null);
      socket.emit("lobby:list");
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => {
      setConnected(false);
      setPending(false);
      setError("Cannot reach the game server. It may be waking up; wait a moment and try again.");
    };
    socket.on("lobby:rooms", updateRooms);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    if (socket.connected) socket.emit("lobby:list");
    return () => {
      socket.off("lobby:rooms", updateRooms);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const beginRequest = (): number | null => {
    if (!socket.connected) {
      setError("Not connected to the game server yet. Wait for the server status to turn online.");
      return null;
    }
    setPending(true);
    setError(null);
    return window.setTimeout(() => {
      setPending(false);
      setError("The server did not respond in time. Try again after it finishes waking up.");
    }, 15_000);
  };

  const createRoom = (event: FormEvent) => {
    event.preventDefault();
    const timeoutId = beginRequest();
    if (timeoutId === null) return;
    socket.emit("room:create", { roomName, profile }, (response) => {
      window.clearTimeout(timeoutId);
      setPending(false);
      if (response.ok) onRoomEntered(response.data);
      else setError(response.error);
    });
  };

  const joinRoom = (event: FormEvent) => {
    event.preventDefault();
    const timeoutId = beginRequest();
    if (timeoutId === null) return;
    socket.emit("room:join", { roomCode, profile }, (response) => {
      window.clearTimeout(timeoutId);
      setPending(false);
      if (response.ok) onRoomEntered(response.data);
      else setError(response.error);
    });
  };

  return (
    <GameShell
      profile={profile}
      connected={connected}
      activeMenu="lobby"
      socialPanel={<VoicePanel profile={profile} connected={connected} />}
    >
      <MainLobbyPanel
        profile={profile}
        rooms={rooms}
        roomName={roomName}
        roomCode={roomCode}
        connected={connected}
        pending={pending}
        error={error}
        onRoomNameChange={setRoomName}
        onRoomCodeChange={setRoomCode}
        onCreate={createRoom}
        onJoin={joinRoom}
      />
    </GameShell>
  );
}
