import type { GameState, PlayerScore, Room, RoundResult } from "@chaos-club/shared";
import { taskDefinitions } from "./tasks/index.js";
import type { InternalRound } from "./types.js";
import { randomChoice } from "./types.js";

const ROUND_DURATION_MS = Number(process.env.GAME_ROUND_DURATION_MS ?? 30_000);
const INTRO_DURATION_MS = Number(process.env.GAME_INTRO_DURATION_MS ?? 10_000);
const RESULT_DURATION_MS = Number(process.env.GAME_RESULT_DURATION_MS ?? 6_000);
const MAX_ROUNDS = 8;

interface InternalGame {
  roomCode: string;
  status: "round_intro" | "playing" | "round_result" | "finished";
  roundNumber: number;
  maxRounds: number;
  scores: Map<string, PlayerScore>;
  selectionCounts: Map<string, number>;
  currentRound: InternalRound | null;
  decisions: Map<string, string>;
  introEndsAt: number | null;
  roundEndsAt: number | null;
  nextRoundAt: number | null;
  result: RoundResult | null;
  winnerIds: string[];
  timer: ReturnType<typeof setTimeout> | null;
}

export class GameManager {
  private readonly games = new Map<string, InternalGame>();

  constructor(
    private readonly getRoom: (roomCode: string) => Room | undefined,
    private readonly publish: (roomCode: string) => void,
  ) {}

  start(room: Room, actorPlayerId: string): GameState {
    if (room.hostId !== actorPlayerId) throw new Error("Only the room host can start the game.");
    if (room.players.length > 8) throw new Error("Chaos Club supports at most 8 players.");
    const existing = this.games.get(room.code);
    if (existing && existing.status !== "finished") throw new Error("A game is already running.");

    const scores = new Map(room.players.map((player) => [player.id, {
      playerId: player.id,
      username: player.username,
      characterName: player.character.name,
      color: player.character.color,
      points: 0,
    }]));
    const game: InternalGame = {
      roomCode: room.code,
      status: "round_intro",
      roundNumber: 0,
      maxRounds: MAX_ROUNDS,
      scores,
      selectionCounts: new Map(),
      currentRound: null,
      decisions: new Map(),
      introEndsAt: null,
      roundEndsAt: null,
      nextRoundAt: null,
      result: null,
      winnerIds: [],
      timer: null,
    };
    this.games.set(room.code, game);
    this.startNextRound(game);
    return this.getState(room.code, actorPlayerId)!;
  }

  submitDecision(roomCode: string, playerId: string, choiceId: string): GameState {
    const game = this.games.get(roomCode);
    if (!game || game.status !== "playing" || !game.currentRound) throw new Error("There is no active round.");
    if (game.decisions.has(playerId)) throw new Error("Your decision is already locked.");
    const choices = game.currentRound.choicesByPlayer.get(playerId);
    if (!choices) throw new Error("You are observing this task.");
    if (!choices.some((choice) => choice.id === choiceId)) throw new Error("Invalid decision.");

    game.decisions.set(playerId, choiceId);
    if (this.allHumanDecisionsLocked(game)) this.resolveRound(game);
    else this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  getState(roomCode: string, playerId: string): GameState | null {
    const game = this.games.get(roomCode);
    if (!game) return null;
    const round = game.currentRound;
    return {
      roomCode,
      status: game.status,
      roundNumber: game.roundNumber,
      maxRounds: game.maxRounds,
      introEndsAt: game.introEndsAt,
      roundEndsAt: game.roundEndsAt,
      nextRoundAt: game.nextRoundAt,
      task: round ? {
        id: round.taskId,
        name: round.taskName,
        description: round.description,
        participants: round.participants,
        privateHint: round.privateHints.get(playerId),
      } : null,
      scores: [...game.scores.values()].sort((a, b) => b.points - a.points),
      lockedPlayerIds: [...game.decisions.keys()].filter((id) => !id.startsWith("bot:")),
      availableChoices: game.status === "playing" ? (round?.choicesByPlayer.get(playerId) ?? []) : [],
      decisionLocked: game.decisions.has(playerId),
      result: game.result,
      winnerIds: game.winnerIds,
    };
  }

  hasGame(roomCode: string): boolean {
    return this.games.has(roomCode);
  }

  hasActiveGame(roomCode: string): boolean {
    const game = this.games.get(roomCode);
    return Boolean(game && game.status !== "finished");
  }

  remove(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (game?.timer) clearTimeout(game.timer);
    this.games.delete(roomCode);
  }

  private startNextRound(game: InternalGame): void {
    const room = this.getRoom(game.roomCode);
    if (!room || room.players.length === 0) {
      this.remove(game.roomCode);
      return;
    }
    game.roundNumber += 1;
    game.status = "round_intro";
    game.result = null;
    game.nextRoundAt = null;
    game.decisions.clear();
    const availableTasks = taskDefinitions.filter((task) => room.players.length >= task.minPlayers);
    const definition = availableTasks[Math.floor(Math.random() * availableTasks.length)]!;
    game.currentRound = definition.create({ players: room.players, selectionCounts: game.selectionCounts });

    game.introEndsAt = Date.now() + INTRO_DURATION_MS;
    game.roundEndsAt = null;
    game.timer = setTimeout(() => this.beginDecisionPhase(game), INTRO_DURATION_MS);
    this.publish(game.roomCode);
  }

  private beginDecisionPhase(game: InternalGame): void {
    if (game.status !== "round_intro" || !game.currentRound) return;
    game.status = "playing";
    game.introEndsAt = null;
    for (const [participantId, choices] of game.currentRound.choicesByPlayer) {
      if (participantId.startsWith("bot:")) game.decisions.set(participantId, randomChoice(choices));
    }
    game.roundEndsAt = Date.now() + ROUND_DURATION_MS;
    game.timer = setTimeout(() => this.resolveRound(game), ROUND_DURATION_MS);
    this.publish(game.roomCode);
  }

  private resolveRound(game: InternalGame): void {
    if (game.status !== "playing" || !game.currentRound) return;
    if (game.timer) clearTimeout(game.timer);
    for (const [playerId, choices] of game.currentRound.choicesByPlayer) {
      if (!game.decisions.has(playerId)) game.decisions.set(playerId, choices[0]!.id);
    }
    game.result = game.currentRound.resolve(game.decisions);
    for (const change of game.result.scoreChanges) {
      const score = game.scores.get(change.playerId);
      if (score) score.points += change.delta;
    }
    game.roundEndsAt = null;
    game.introEndsAt = null;

    if (game.roundNumber >= game.maxRounds) {
      game.status = "finished";
      const highestScore = Math.max(...[...game.scores.values()].map((score) => score.points));
      game.winnerIds = [...game.scores.values()].filter((score) => score.points === highestScore).map((score) => score.playerId);
      game.nextRoundAt = null;
      game.timer = null;
    } else {
      game.status = "round_result";
      game.nextRoundAt = Date.now() + RESULT_DURATION_MS;
      game.timer = setTimeout(() => this.startNextRound(game), RESULT_DURATION_MS);
    }
    this.publish(game.roomCode);
  }

  private allHumanDecisionsLocked(game: InternalGame): boolean {
    if (!game.currentRound) return false;
    return [...game.currentRound.choicesByPlayer.keys()]
      .filter((id) => !id.startsWith("bot:"))
      .every((id) => game.decisions.has(id));
  }
}
