import { randomUUID } from "node:crypto";
import type { Player, Room, RoomSummary, SessionProfile } from "@chaos-club/shared";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class RoomStore {
  private readonly rooms = new Map<string, Room>();
  private readonly socketRoomIndex = new Map<string, string>();

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

  leaveBySocket(socketId: string): { room?: Room; closedCode?: string } {
    const code = this.socketRoomIndex.get(socketId);
    if (!code) return {};

    this.socketRoomIndex.delete(socketId);
    const room = this.rooms.get(code);
    if (!room) return {};

    room.players = room.players.filter((player) => player.socketId !== socketId);
    if (room.players.length === 0) {
      this.rooms.delete(code);
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

