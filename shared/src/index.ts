export const AVATAR_OPTIONS = ["mask", "eye", "crown", "flame"] as const;
export const COLOR_OPTIONS = ["#8b5cf6", "#22d3ee", "#f43f5e", "#84cc16", "#f59e0b", "#ec4899"] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number];

export interface Character {
  name: string;
  avatar: AvatarId;
  color: string;
}

export interface Player {
  id: string;
  socketId: string;
  username: string;
  character: Character;
  micEnabled: boolean;
  isSpeaking: boolean;
  joinedAt: number;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  createdAt: number;
}

export interface Room extends Omit<RoomSummary, "playerCount"> {
  hostId: string;
  players: Player[];
}

export interface ChatMessage {
  id: string;
  roomCode: string;
  playerId: string;
  username: string;
  characterName: string;
  color: string;
  content: string;
  createdAt: number;
}

export interface SessionProfile {
  id: string;
  username: string;
  character: Character;
}

export type Ack<T = void> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

export interface ServerToClientEvents {
  "lobby:rooms": (rooms: RoomSummary[]) => void;
  "room:state": (room: Room) => void;
  "room:closed": (message: string) => void;
  "room:chat-history": (messages: ChatMessage[]) => void;
  "room:chat-message": (message: ChatMessage) => void;
  "voice:offer": (payload: VoiceDescriptionPayload) => void;
  "voice:answer": (payload: VoiceDescriptionPayload) => void;
  "voice:ice-candidate": (payload: VoiceCandidatePayload) => void;
}

export interface ClientToServerEvents {
  "lobby:list": () => void;
  "room:create": (payload: CreateRoomPayload, ack: Ack<Room>) => void;
  "room:join": (payload: JoinRoomPayload, ack: Ack<Room>) => void;
  "room:leave": () => void;
  "room:chat-list": () => void;
  "room:chat-send": (content: string, ack: Ack<ChatMessage>) => void;
  "player:mic": (enabled: boolean) => void;
  "player:speaking": (speaking: boolean) => void;
  "voice:offer": (payload: OutgoingVoiceDescription) => void;
  "voice:answer": (payload: OutgoingVoiceDescription) => void;
  "voice:ice-candidate": (payload: OutgoingVoiceCandidate) => void;
}

export interface CreateRoomPayload {
  roomName: string;
  profile: SessionProfile;
}

export interface JoinRoomPayload {
  roomCode: string;
  profile: SessionProfile;
}

export interface OutgoingVoiceDescription {
  targetSocketId: string;
  description: RTCSessionDescriptionInit;
}

export interface VoiceDescriptionPayload {
  fromSocketId: string;
  description: RTCSessionDescriptionInit;
}

export interface OutgoingVoiceCandidate {
  targetSocketId: string;
  candidate: RTCIceCandidateInit;
}

export interface VoiceCandidatePayload {
  fromSocketId: string;
  candidate: RTCIceCandidateInit;
}
