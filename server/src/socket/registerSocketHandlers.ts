import type {
  ClientToServerEvents,
  ServerToClientEvents,
  VoiceCandidatePayload,
  VoiceDescriptionPayload,
} from "@chaos-club/shared";
import type { Server, Socket } from "socket.io";
import type { RoomStore } from "../stores/roomStore.js";
import type { GameManager } from "../game/GameManager.js";

type ChaosServer = Server<ClientToServerEvents, ServerToClientEvents>;
type ChaosSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: ChaosServer, socket: ChaosSocket, roomStore: RoomStore, gameManager: GameManager): void {
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
      const existingRoom = roomStore.getByCode(payload.roomCode);
      const isReconnect = existingRoom?.players.some((player) => player.id === payload.profile.id);
      if (gameManager.hasActiveGame(payload.roomCode.trim().toUpperCase()) && !isReconnect) {
        throw new Error("A game is already running in this room.");
      }
      const room = roomStore.join(payload.roomCode, payload.profile, socket.id);
      socket.join(room.code);
      ack({ ok: true, data: room });
      io.to(room.code).emit("room:state", room);
      publishLobby();
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

  socket.on("room:leave", () => leaveCurrentRoom(io, socket, roomStore, gameManager, publishLobby));

  socket.on("room:chat-list", () => {
    socket.emit("room:chat-history", roomStore.getChatHistory(socket.id));
  });

  socket.on("room:chat-send", (content, ack) => {
    try {
      const message = roomStore.addChatMessage(socket.id, content);
      ack({ ok: true, data: message });
      io.to(message.roomCode).emit("room:chat-message", message);
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

  socket.on("game:start", (ack) => {
    try {
      const room = roomStore.getBySocket(socket.id);
      const player = room?.players.find((candidate) => candidate.socketId === socket.id);
      if (!room || !player) throw new Error("You must be in a room to start a game.");
      ack({ ok: true, data: gameManager.start(room, player.id) });
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

  socket.on("game:state-request", () => {
    const room = roomStore.getBySocket(socket.id);
    const player = room?.players.find((candidate) => candidate.socketId === socket.id);
    if (!room || !player) return;
    const state = gameManager.getState(room.code, player.id);
    if (state) socket.emit("game:state", state);
  });

  socket.on("game:decision", (choiceId, ack) => {
    try {
      const room = roomStore.getBySocket(socket.id);
      const player = room?.players.find((candidate) => candidate.socketId === socket.id);
      if (!room || !player) throw new Error("You must be in a room to submit a decision.");
      ack({ ok: true, data: gameManager.submitDecision(room.code, player.id, choiceId) });
    } catch (error) {
      ack({ ok: false, error: getErrorMessage(error) });
    }
  });

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

  socket.on("disconnect", () => leaveCurrentRoom(io, socket, roomStore, gameManager, publishLobby));

  // Future realtime modules should be registered here through isolated handlers:
  // registerTaskHandlers, registerPrivateChatHandlers, registerAuctionHandlers, etc.
}

function leaveCurrentRoom(
  io: ChaosServer,
  socket: ChaosSocket,
  roomStore: RoomStore,
  gameManager: GameManager,
  publishLobby: () => void,
): void {
  const currentRoom = roomStore.getBySocket(socket.id);
  if (!currentRoom) return;

  socket.leave(currentRoom.code);
  const result = roomStore.leaveBySocket(socket.id);
  if (result.room) io.to(result.room.code).emit("room:state", result.room);
  if (result.closedCode) gameManager.remove(result.closedCode);
  publishLobby();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
