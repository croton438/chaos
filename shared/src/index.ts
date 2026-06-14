export const AVATAR_OPTIONS = [
  "sprout", "curls", "moustache", "hair", "cap", "beanie", "explorer", "topHat",
  "crown", "goggles", "pirate", "eyePatch", "bandana", "ninja", "wizard",
  "headphones", "catPhones", "sunglasses", "glasses", "chef", "nurse", "miner",
  "santa", "robot", "cracked",
] as const;
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

export type GameStatus = "agenda" | "market" | "decision" | "reveal" | "accountability" | "final_reveal" | "finished";
export type AbilityId = "ear" | "disinformant" | "notary" | "vault" | "detective";

export interface PlayerStanding {
  playerId: string;
  username: string;
  characterName: string;
  color: string;
  influence: number;
  trust: number;
  leverageCount: number;
}

export interface GameParticipant {
  id: string;
  name: string;
  color: string;
  avatar: AvatarId;
  isBot: boolean;
  role?: string;
}

export interface GameChoice {
  id: string;
  label: string;
  description?: string;
}

export interface PublicTask {
  id: string;
  name: string;
  description: string;
  participants: GameParticipant[];
  privateHint?: string;
}

export interface RoundDecisionReveal {
  playerId: string;
  playerName: string;
  choiceId: string;
  choiceLabel: string;
}

export interface RoundScoreChange {
  playerId: string;
  playerName: string;
  influenceDelta: number;
  trustDelta: number;
  reason: string;
}

export interface LeverageCard {
  id: string;
  targetPlayerId: string;
  targetName: string;
  partnerPlayerId: string;
  partnerName: string;
  roundNumber: number;
  note: string;
  source: "meeting" | "betrayal" | "coalition";
}

export interface LeverageEvent {
  cardId: string;
  ownerId: string;
  ownerName: string;
  targetPlayerId: string;
  targetName: string;
}

export interface PrivateMeetingSummary {
  id: string;
  participantIds: string[];
  participantNames: string[];
  listenerPresent: boolean;
}

export interface MeetingInvitation {
  requestId: string;
  requesterId: string;
  requesterName: string;
  participantIds: string[];
  participantNames: string[];
}

export interface RoundResult {
  taskId: string;
  taskName: string;
  outcomeId: string;
  summary: string;
  decisions: RoundDecisionReveal[];
  resourceChanges: RoundScoreChange[];
  leverageEvents: LeverageEvent[];
}

export interface GameState {
  roomCode: string;
  status: GameStatus;
  roundNumber: number;
  maxRounds: number;
  phaseEndsAt: number | null;
  task: PublicTask | null;
  standings: PlayerStanding[];
  lockedPlayerIds: string[];
  availableChoices: GameChoice[];
  decisionLocked: boolean;
  result: RoundResult | null;
  winnerIds: string[];
  myAbility: AbilityId;
  myLeverage: LeverageCard[];
  activeMeeting: PrivateMeetingSummary | null;
  meetingInvitation: MeetingInvitation | null;
  meetingRequestPending: boolean;
  voiceGroupPlayerIds: string[];
  isFinalRound: boolean;
  leverageEvents: LeverageEvent[];
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
  "game:state": (state: GameState) => void;
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
  "game:start": (ack: Ack<GameState>) => void;
  "game:state-request": () => void;
  "game:decision": (choiceId: string, ack: Ack<GameState>) => void;
  "game:meeting-request": (targetPlayerIds: string[], ack: Ack<GameState>) => void;
  "game:meeting-respond": (requestId: string, accepted: boolean, ack: Ack<GameState>) => void;
  "game:meeting-leave": (ack: Ack<GameState>) => void;
  "game:leverage-create": (payload: CreateLeveragePayload, ack: Ack<GameState>) => void;
  "game:leverage-play": (cardId: string, ack: Ack<GameState>) => void;
  "player:mic": (enabled: boolean) => void;
  "player:speaking": (speaking: boolean) => void;
  "voice:offer": (payload: OutgoingVoiceDescription) => void;
  "voice:answer": (payload: OutgoingVoiceDescription) => void;
  "voice:ice-candidate": (payload: OutgoingVoiceCandidate) => void;
}

export interface CreateLeveragePayload {
  targetPlayerId: string;
  note: string;
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
