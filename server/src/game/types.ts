import type {
  GameChoice,
  GameParticipant,
  LeverageCard,
  Player,
  RoundResult,
} from "@chaos-club/shared";

export interface TaskContext {
  players: Player[];
  selectionCounts: Map<string, number>;
}

export interface InternalRound {
  taskId: string;
  taskName: string;
  description: string;
  participants: GameParticipant[];
  choicesByPlayer: Map<string, GameChoice[]>;
  privateHints: Map<string, string>;
  metadata: Record<string, unknown>;
  resolve: (decisions: Map<string, string>) => TaskResolution;
}

export interface LeverageGrant {
  ownerId: string;
  targetId: string;
  partnerId: string;
  source: LeverageCard["source"];
}

export interface TaskResolution {
  result: RoundResult;
  leverageGrants: LeverageGrant[];
}

export interface TaskDefinition {
  id: string;
  minPlayers: number;
  create: (context: TaskContext) => InternalRound;
}

export const HOUSE_BOT: GameParticipant = {
  id: "bot:house",
  name: "House Bot",
  color: "#f59e0b",
  avatar: "robot",
  isBot: true,
  role: "The House",
};

export function createHouseBot(index = 0): GameParticipant {
  return {
    ...HOUSE_BOT,
    id: `bot:house:${index}`,
    name: index === 0 ? "House Bot" : `House Bot ${index + 1}`,
  };
}

export function toParticipant(player: Player, role?: string): GameParticipant {
  return {
    id: player.id,
    name: player.character.name,
    color: player.character.color,
    avatar: player.character.avatar,
    isBot: false,
    role,
  };
}

export function selectFairPlayers(context: TaskContext, count: number): Player[] {
  const shuffled = [...context.players]
    .map((player) => ({ player, random: Math.random() }))
    .sort((a, b) => {
      const countDifference = (context.selectionCounts.get(a.player.id) ?? 0) - (context.selectionCounts.get(b.player.id) ?? 0);
      return countDifference || a.random - b.random;
    })
    .slice(0, Math.min(count, context.players.length))
    .map(({ player }) => player);

  for (const player of shuffled) {
    context.selectionCounts.set(player.id, (context.selectionCounts.get(player.id) ?? 0) + 1);
  }
  return shuffled;
}

export function labelChoice(choicesByPlayer: Map<string, GameChoice[]>, playerId: string, choiceId: string): string {
  return choicesByPlayer.get(playerId)?.find((choice) => choice.id === choiceId)?.label ?? choiceId;
}

export function randomChoice(choices: GameChoice[]): string {
  return choices[Math.floor(Math.random() * choices.length)]!.id;
}
