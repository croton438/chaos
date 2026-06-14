import { randomUUID } from "node:crypto";
import type { ChatMessage, Player, Room, RoomSummary, SessionProfile } from "@chaos-club/shared";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class RoomStore {
  private readonly rooms = new Map<string, Room>();
  private readonly socketRoomIndex = new Map<string, string>();
  private readonly chatHistory = new Map<string, ChatMessage[]>();

  list(): RoomSummary[] {
    return [...this.rooms.values()]
      .map(({ id, code, name, players, createdAt }) => ({
        id,
        code,
        name,
        playerCount: players.length,
        createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  create(roomName: string, profile: SessionProfile, socketId: string): Room {
    this.leaveBySocket(socketId);

    const player = this.createPlayer(profile, socketId);
    const room: Room = {
      id: randomUUID(),
      code: this.createUniqueCode(),
      name: roomName.trim() || `${profile.username}'s Room`,
      hostId: profile.id,
      players: [player],
      createdAt: Date.now(),
    };

    this.rooms.set(room.code, room);
    this.chatHistory.set(room.code, []);
    this.socketRoomIndex.set(socketId, room.code);
    return room;
  }

  join(roomCode: string, profile: SessionProfile, socketId: string): Room {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      throw new Error("Room not found. Check the code and try again.");
    }

    this.leaveBySocket(socketId);

    const existingProfileIndex = room.players.findIndex((player) => player.id === profile.id);
    if (existingProfileIndex >= 0) {
      room.players.splice(existingProfileIndex, 1);
    }

    room.players.push(this.createPlayer(profile, socketId));
    this.socketRoomIndex.set(socketId, code);
    return room;
  }

  getBySocket(socketId: string): Room | undefined {
    const code = this.socketRoomIndex.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  updateMic(socketId: string, micEnabled: boolean): Room | undefined {
    const room = this.getBySocket(socketId);
    const player = room?.players.find((candidate) => candidate.socketId === socketId);
    if (player) {
      player.micEnabled = micEnabled;
      if (!micEnabled) player.isSpeaking = false;
    }
    return room;
  }

  updateSpeaking(socketId: string, isSpeaking: boolean): Room | undefined {
    const room = this.getBySocket(socketId);
    const player = room?.players.find((candidate) => candidate.socketId === socketId);
    if (player) player.isSpeaking = player.micEnabled && isSpeaking;
    return room;
  }

  getChatHistory(socketId: string): ChatMessage[] {
    const room = this.getBySocket(socketId);
    return room ? [...(this.chatHistory.get(room.code) ?? [])] : [];
  }

  addChatMessage(socketId: string, rawContent: string): ChatMessage {
    const room = this.getBySocket(socketId);
    const player = room?.players.find((candidate) => candidate.socketId === socketId);
    if (!room || !player) throw new Error("You must be in a room to send messages.");

    const content = rawContent.trim().replace(/\s+/g, " ");
    if (!content) throw new Error("Message cannot be empty.");
    if (content.length > 500) throw new Error("Message cannot exceed 500 characters.");

    const message: ChatMessage = {
      id: randomUUID(),
      roomCode: room.code,
      playerId: player.id,
      username: player.username,
      characterName: player.character.name,
      color: player.character.color,
      content,
      createdAt: Date.now(),
    };
    const history = this.chatHistory.get(room.code) ?? [];
    history.push(message);
    if (history.length > 100) history.splice(0, history.length - 100);
    this.chatHistory.set(room.code, history);
    return message;
  }

  leaveBySocket(socketId: string): { room?: Room; closedCode?: string } {
    const code = this.socketRoomIndex.get(socketId);
    if (!code) return {};

    this.socketRoomIndex.delete(socketId);
    const room = this.rooms.get(code);
    if (!room) return {};

    room.players = room.players.filter((player) => player.socketId !== socketId);
    if (room.players.length === 0) {
      this.rooms.delete(code);
      this.chatHistory.delete(code);
      return { closedCode: code };
    }

    if (!room.players.some((player) => player.id === room.hostId)) {
      room.hostId = room.players[0]!.id;
    }

    return { room };
  }

  private createPlayer(profile: SessionProfile, socketId: string): Player {
    return {
      ...profile,
      socketId,
      micEnabled: false,
      isSpeaking: false,
      joinedAt: Date.now(),
    };
  }

  private createUniqueCode(): string {
    let code = "";
    do {
      code = Array.from({ length: 6 }, () =>
        ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length)),
      ).join("");
    } while (this.rooms.has(code));
    return code;
  }
}
