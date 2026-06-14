import type {
  ClientToServerEvents,
  ServerToClientEvents,
  VoiceCandidatePayload,
  VoiceDescriptionPayload,
} from "@chaos-club/shared";
import type { Server, Socket } from "socket.io";
import type { RoomStore } from "../stores/roomStore.js";

type ChaosServer = Server<ClientToServerEvents, ServerToClientEvents>;
type ChaosSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: ChaosServer, socket: ChaosSocket, roomStore: RoomStore): void {
  const publishLobby = () => io.emit("lobby:rooms", roomStore.list());

  socket.on("lobby:list", () => socket.emit("lobby:rooms", roomStore.list()));

  socket.on("room:create", (payload, ack) => {
    try {
      const room = roomStore.create(payload.roomName, payload.profile, socket.id);
      socket.join(room.code);
      ack({ ok: true, data: room });
      io.to(room.code).emit("room:state", room);
      publishLobby();
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

  socket.on("room:join", (payload, ack) => {
    try {
      const room = roomStore.join(payload.roomCode, payload.profile, socket.id);
      socket.join(room.code);
      ack({ ok: true, data: room });
      io.to(room.code).emit("room:state", room);
      publishLobby();
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

  socket.on("room:leave", () => leaveCurrentRoom(io, socket, roomStore, publishLobby));

  socket.on("player:mic", (enabled) => {
    const room = roomStore.updateMic(socket.id, enabled);
    if (room) io.to(room.code).emit("room:state", room);
  });

  socket.on("player:speaking", (speaking) => {
    const room = roomStore.updateSpeaking(socket.id, speaking);
    if (room) io.to(room.code).emit("room:state", room);
  });

  socket.on("voice:offer", ({ targetSocketId, description }) => {
    const payload: VoiceDescriptionPayload = { fromSocketId: socket.id, description };
    io.to(targetSocketId).emit("voice:offer", payload);
  });

  socket.on("voice:answer", ({ targetSocketId, description }) => {
    const payload: VoiceDescriptionPayload = { fromSocketId: socket.id, description };
    io.to(targetSocketId).emit("voice:answer", payload);
  });

  socket.on("voice:ice-candidate", ({ targetSocketId, candidate }) => {
    const payload: VoiceCandidatePayload = { fromSocketId: socket.id, candidate };
    io.to(targetSocketId).emit("voice:ice-candidate", payload);
  });

  socket.on("disconnect", () => leaveCurrentRoom(io, socket, roomStore, publishLobby));

  // Future realtime modules should be registered here through isolated handlers:
  // registerTaskHandlers, registerPrivateChatHandlers, registerAuctionHandlers, etc.
}

function leaveCurrentRoom(
  io: ChaosServer,
  socket: ChaosSocket,
  roomStore: RoomStore,
  publishLobby: () => void,
): void {
  const currentRoom = roomStore.getBySocket(socket.id);
  if (!currentRoom) return;

  socket.leave(currentRoom.code);
  const result = roomStore.leaveBySocket(socket.id);
  if (result.room) io.to(result.room.code).emit("room:state", result.room);
  publishLobby();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
