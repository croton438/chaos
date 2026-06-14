import { randomUUID } from "node:crypto";
import type {
  AbilityId,
  GameState,
  LeverageCard,
  LeverageEvent,
  PlayerStanding,
  Room,
  RoundResult,
} from "@chaos-club/shared";
import { taskDefinitions } from "./tasks/index.js";
import type { InternalRound, LeverageGrant } from "./types.js";
import { randomChoice } from "./types.js";

const AGENDA_DURATION_MS = Number(process.env.GAME_AGENDA_DURATION_MS ?? 15_000);
const MARKET_DURATION_MS = Number(process.env.GAME_MARKET_DURATION_MS ?? 45_000);
const DECISION_DURATION_MS = Number(process.env.GAME_DECISION_DURATION_MS ?? 30_000);
const REVEAL_DURATION_MS = Number(process.env.GAME_REVEAL_DURATION_MS ?? 15_000);
const ACCOUNTABILITY_DURATION_MS = Number(process.env.GAME_ACCOUNTABILITY_DURATION_MS ?? 20_000);
const FINAL_REVEAL_DURATION_MS = Number(process.env.GAME_FINAL_REVEAL_DURATION_MS ?? 45_000);

interface PlayerResources extends PlayerStanding {
  ability: AbilityId;
  leverage: LeverageCard[];
}

interface PendingMeeting {
  id: string;
  requesterId: string;
  participantIds: string[];
  acceptedIds: Set<string>;
}

interface ActiveMeeting {
  id: string;
  participantIds: string[];
  listenerId: string | null;
}

interface InternalGame {
  roomCode: string;
  status: Exclude<GameState["status"], "finished"> | "finished";
  roundNumber: number;
  maxRounds: number;
  resources: Map<string, PlayerResources>;
  selectionCounts: Map<string, number>;
  currentRound: InternalRound | null;
  decisions: Map<string, string>;
  phaseEndsAt: number | null;
  result: RoundResult | null;
  winnerIds: string[];
  timer: ReturnType<typeof setTimeout> | null;
  pendingMeeting: PendingMeeting | null;
  activeMeeting: ActiveMeeting | null;
  leverageCreators: Set<string>;
  leverageEvents: LeverageEvent[];
}

const abilities: AbilityId[] = ["ear", "disinformant", "notary", "vault", "detective"];

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

    const shuffledAbilities = [...abilities].sort(() => Math.random() - 0.5);
    const resources = new Map(room.players.map((player, index) => [player.id, {
      playerId: player.id,
      username: player.username,
      characterName: player.character.name,
      color: player.character.color,
      influence: 10,
      trust: 4,
      leverageCount: 0,
      ability: shuffledAbilities[index % shuffledAbilities.length]!,
      leverage: [],
    }]));

    const game: InternalGame = {
      roomCode: room.code,
      status: "agenda",
      roundNumber: 0,
      maxRounds: room.players.length <= 5 ? 6 : 8,
      resources,
      selectionCounts: new Map(),
      currentRound: null,
      decisions: new Map(),
      phaseEndsAt: null,
      result: null,
      winnerIds: [],
      timer: null,
      pendingMeeting: null,
      activeMeeting: null,
      leverageCreators: new Set(),
      leverageEvents: [],
    };
    this.games.set(room.code, game);
    this.startNextRound(game);
    return this.getState(room.code, actorPlayerId)!;
  }

  submitDecision(roomCode: string, playerId: string, choiceId: string): GameState {
    const game = this.requireGame(roomCode);
    if (game.status !== "decision" || !game.currentRound) throw new Error("There is no active decision phase.");
    if (game.decisions.has(playerId)) throw new Error("Your decision is already locked.");
    const choices = game.currentRound.choicesByPlayer.get(playerId);
    if (!choices) throw new Error("You are observing this task.");
    if (!choices.some((choice) => choice.id === choiceId)) throw new Error("Invalid decision.");

    game.decisions.set(playerId, choiceId);
    if (this.allHumanDecisionsLocked(game)) this.resolveRound(game);
    else this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  requestMeeting(roomCode: string, playerId: string, targetPlayerIds: string[]): GameState {
    const game = this.requireGame(roomCode);
    const room = this.requireRoom(roomCode);
    if (game.status !== "market") throw new Error("Private meetings are only available during the Market phase.");
    if (game.activeMeeting || game.pendingMeeting) throw new Error("Another private meeting is active or waiting for a response.");
    const uniqueTargets = [...new Set(targetPlayerIds)].filter((id) => id !== playerId);
    if (uniqueTargets.length < 1 || uniqueTargets.length > 2) throw new Error("Invite one or two players to a private meeting.");
    if (uniqueTargets.some((id) => !room.players.some((player) => player.id === id))) throw new Error("A selected player is no longer in the room.");
    game.pendingMeeting = {
      id: randomUUID(),
      requesterId: playerId,
      participantIds: [playerId, ...uniqueTargets],
      acceptedIds: new Set([playerId]),
    };
    this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  respondToMeeting(roomCode: string, playerId: string, requestId: string, accepted: boolean): GameState {
    const game = this.requireGame(roomCode);
    const request = game.pendingMeeting;
    if (game.status !== "market" || !request || request.id !== requestId || !request.participantIds.includes(playerId)) {
      throw new Error("This meeting invitation is no longer available.");
    }
    if (!accepted) {
      game.pendingMeeting = null;
    } else {
      request.acceptedIds.add(playerId);
      if (request.participantIds.every((id) => request.acceptedIds.has(id))) {
        game.activeMeeting = { id: request.id, participantIds: request.participantIds, listenerId: null };
        game.pendingMeeting = null;
      }
    }
    this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  leaveMeeting(roomCode: string, playerId: string): GameState {
    const game = this.requireGame(roomCode);
    if (game.activeMeeting?.participantIds.includes(playerId) || game.activeMeeting?.listenerId === playerId) {
      game.activeMeeting = null;
    } else if (game.pendingMeeting?.participantIds.includes(playerId)) {
      game.pendingMeeting = null;
    } else {
      throw new Error("You are not in a private meeting.");
    }
    this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  createLeverage(roomCode: string, playerId: string, targetPlayerId: string, note: string): GameState {
    const game = this.requireGame(roomCode);
    const meeting = game.activeMeeting;
    if (game.status !== "market" || !meeting?.participantIds.includes(playerId)) throw new Error("Create Leverage while you are in a private Market meeting.");
    if (!meeting.participantIds.includes(targetPlayerId) || targetPlayerId === playerId) throw new Error("Choose another participant in the private meeting.");
    if (game.leverageCreators.has(playerId)) throw new Error("You already recorded Leverage this round.");
    const owner = game.resources.get(playerId)!;
    const targetName = this.getPlayerName(game, targetPlayerId);
    owner.leverage.push({
      id: randomUUID(),
      targetPlayerId,
      targetName,
      partnerPlayerId: targetPlayerId,
      partnerName: targetName,
      roundNumber: game.roundNumber,
      note: note.trim().slice(0, 140),
      source: "meeting",
    });
    owner.leverageCount = owner.leverage.length;
    game.leverageCreators.add(playerId);
    this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  playLeverage(roomCode: string, playerId: string, cardId: string): GameState {
    const game = this.requireGame(roomCode);
    if (game.status !== "reveal" && game.status !== "final_reveal") throw new Error("Leverage can only be played during a Reveal phase.");
    const owner = game.resources.get(playerId);
    const cardIndex = owner?.leverage.findIndex((card) => card.id === cardId) ?? -1;
    if (!owner || cardIndex < 0) throw new Error("Leverage card not found.");
    if (owner.trust < 1) throw new Error("Playing Leverage costs one Trust stone.");
    const card = owner.leverage[cardIndex]!;
    const target = game.resources.get(card.targetPlayerId);
    if (!target) throw new Error("The target is no longer available.");

    owner.leverage.splice(cardIndex, 1);
    owner.leverageCount = owner.leverage.length;
    owner.trust -= 1;
    owner.influence += 1;
    target.influence -= 2;
    const event = { cardId: card.id, ownerId: playerId, ownerName: owner.characterName, targetPlayerId: target.playerId, targetName: target.characterName };
    game.leverageEvents.push(event);
    if (game.result) game.result.leverageEvents.push(event);
    this.publish(roomCode);
    return this.getState(roomCode, playerId)!;
  }

  getState(roomCode: string, playerId: string): GameState | null {
    const game = this.games.get(roomCode);
    const room = this.getRoom(roomCode);
    const viewer = game?.resources.get(playerId);
    if (!game || !room || !viewer) return null;
    const round = game.currentRound;
    const activeMeeting = game.activeMeeting;
    const meetingParticipants = activeMeeting?.participantIds ?? [];
    const listenerId = activeMeeting?.listenerId;
    const viewerInMeeting = meetingParticipants.includes(playerId) || listenerId === playerId;
    const voiceGroupPlayerIds = activeMeeting
      ? viewerInMeeting
        ? [...meetingParticipants, ...(listenerId ? [listenerId] : [])]
        : room.players.map((player) => player.id).filter((id) => !meetingParticipants.includes(id) && id !== listenerId)
      : room.players.map((player) => player.id);
    const invitation = game.pendingMeeting?.participantIds.includes(playerId)
      && game.pendingMeeting.requesterId !== playerId
      && !game.pendingMeeting.acceptedIds.has(playerId)
      ? {
          requestId: game.pendingMeeting.id,
          requesterId: game.pendingMeeting.requesterId,
          requesterName: this.getPlayerName(game, game.pendingMeeting.requesterId),
          participantIds: game.pendingMeeting.participantIds,
          participantNames: game.pendingMeeting.participantIds.map((id) => this.getPlayerName(game, id)),
        }
      : null;

    return {
      roomCode,
      status: game.status,
      roundNumber: game.roundNumber,
      maxRounds: game.maxRounds,
      phaseEndsAt: game.phaseEndsAt,
      task: round ? {
        id: round.taskId,
        name: round.taskName,
        description: round.description,
        participants: round.participants,
        privateHint: round.privateHints.get(playerId),
      } : null,
      standings: [...game.resources.values()].map(({ ability: _ability, leverage: _leverage, ...standing }) => standing).sort((a, b) => b.influence - a.influence || b.trust - a.trust),
      lockedPlayerIds: [...game.decisions.keys()].filter((id) => !id.startsWith("bot:")),
      availableChoices: game.status === "decision" ? (round?.choicesByPlayer.get(playerId) ?? []) : [],
      decisionLocked: game.decisions.has(playerId),
      result: game.result,
      winnerIds: game.winnerIds,
      myAbility: viewer.ability,
      myLeverage: viewer.leverage,
      activeMeeting: activeMeeting ? {
        id: activeMeeting.id,
        participantIds: activeMeeting.participantIds,
        participantNames: activeMeeting.participantIds.map((id) => this.getPlayerName(game, id)),
        listenerPresent: Boolean(activeMeeting.listenerId),
      } : null,
      meetingInvitation: invitation,
      meetingRequestPending: Boolean(game.pendingMeeting?.participantIds.includes(playerId)),
      voiceGroupPlayerIds,
      isFinalRound: game.status === "final_reveal" || game.roundNumber === game.maxRounds,
      leverageEvents: game.leverageEvents,
    };
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
    if (!room || room.players.length === 0) return this.remove(game.roomCode);
    game.roundNumber += 1;
    game.status = "agenda";
    game.result = null;
    game.decisions.clear();
    game.pendingMeeting = null;
    game.activeMeeting = null;
    game.leverageCreators.clear();
    const definition = taskDefinitions[(game.roundNumber - 1) % taskDefinitions.length]!;
    game.currentRound = definition.create({ players: room.players, selectionCounts: game.selectionCounts });
    this.schedule(game, AGENDA_DURATION_MS, () => this.beginMarket(game));
  }

  private beginMarket(game: InternalGame): void {
    if (game.status !== "agenda") return;
    game.status = "market";
    this.schedule(game, MARKET_DURATION_MS, () => this.beginDecision(game));
  }

  private beginDecision(game: InternalGame): void {
    if (game.status !== "market" || !game.currentRound) return;
    game.status = "decision";
    game.pendingMeeting = null;
    game.activeMeeting = null;
    for (const [participantId, choices] of game.currentRound.choicesByPlayer) {
      if (participantId.startsWith("bot:")) game.decisions.set(participantId, randomChoice(choices));
    }
    this.schedule(game, DECISION_DURATION_MS, () => this.resolveRound(game));
  }

  private resolveRound(game: InternalGame): void {
    if (game.status !== "decision" || !game.currentRound) return;
    if (game.timer) clearTimeout(game.timer);
    for (const [playerId, choices] of game.currentRound.choicesByPlayer) {
      if (!game.decisions.has(playerId)) game.decisions.set(playerId, choices[0]!.id);
    }
    const resolution = game.currentRound.resolve(game.decisions);
    game.result = resolution.result;
    for (const change of resolution.result.resourceChanges) {
      const resources = game.resources.get(change.playerId);
      if (!resources) continue;
      resources.influence += change.influenceDelta;
      resources.trust = Math.max(0, Math.min(4, resources.trust + change.trustDelta));
    }
    for (const grant of resolution.leverageGrants) this.grantLeverage(game, grant);
    game.status = "reveal";
    this.schedule(game, REVEAL_DURATION_MS, () => this.beginAccountability(game));
  }

  private beginAccountability(game: InternalGame): void {
    if (game.status !== "reveal") return;
    game.status = "accountability";
    this.schedule(game, ACCOUNTABILITY_DURATION_MS, () => {
      if (game.roundNumber >= game.maxRounds) this.beginFinalReveal(game);
      else this.startNextRound(game);
    });
  }

  private beginFinalReveal(game: InternalGame): void {
    game.status = "final_reveal";
    game.currentRound = null;
    game.result = null;
    game.pendingMeeting = null;
    game.activeMeeting = null;
    this.schedule(game, FINAL_REVEAL_DURATION_MS, () => this.finish(game));
  }

  private finish(game: InternalGame): void {
    game.status = "finished";
    game.phaseEndsAt = null;
    game.timer = null;
    const highestInfluence = Math.max(...[...game.resources.values()].map((player) => player.influence));
    game.winnerIds = [...game.resources.values()].filter((player) => player.influence === highestInfluence).map((player) => player.playerId);
    this.publish(game.roomCode);
  }

  private schedule(game: InternalGame, duration: number, callback: () => void): void {
    if (game.timer) clearTimeout(game.timer);
    game.phaseEndsAt = Date.now() + duration;
    game.timer = setTimeout(callback, duration);
    this.publish(game.roomCode);
  }

  private grantLeverage(game: InternalGame, grant: LeverageGrant): void {
    const owner = game.resources.get(grant.ownerId);
    const target = game.resources.get(grant.targetId);
    if (!owner || !target) return;
    owner.leverage.push({
      id: randomUUID(),
      targetPlayerId: target.playerId,
      targetName: target.characterName,
      partnerPlayerId: grant.partnerId,
      partnerName: this.getPlayerName(game, grant.partnerId),
      roundNumber: game.roundNumber,
      note: "",
      source: grant.source,
    });
    owner.leverageCount = owner.leverage.length;
  }

  private allHumanDecisionsLocked(game: InternalGame): boolean {
    if (!game.currentRound) return false;
    return [...game.currentRound.choicesByPlayer.keys()].filter((id) => !id.startsWith("bot:")).every((id) => game.decisions.has(id));
  }

  private requireGame(roomCode: string): InternalGame {
    const game = this.games.get(roomCode);
    if (!game) throw new Error("There is no active game.");
    return game;
  }

  private requireRoom(roomCode: string): Room {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found.");
    return room;
  }

  private getPlayerName(game: InternalGame, playerId: string): string {
    return game.resources.get(playerId)?.characterName ?? (playerId.startsWith("bot:") ? "House Bot" : "Unknown");
  }
}
