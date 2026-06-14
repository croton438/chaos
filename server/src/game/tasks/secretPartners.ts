import type { GameChoice } from "@chaos-club/shared";
import type { TaskDefinition } from "../types.js";
import { labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const signalChoices: GameChoice[] = [
  { id: "signal:a", label: "Signal A" },
  { id: "signal:b", label: "Signal B" },
  { id: "signal:c", label: "Signal C" },
];

export const secretPartners: TaskDefinition = {
  id: "secret-partners",
  minPlayers: 4,
  create(context) {
    const [partnerA, partnerB] = selectFairPlayers(context, 2);
    const participants = context.players.map((player) => toParticipant(player));
    const partnerIds = [partnerA!.id, partnerB!.id];
    const pairChoices: GameChoice[] = [];
    for (let a = 0; a < context.players.length; a += 1) {
      for (let b = a + 1; b < context.players.length; b += 1) {
        pairChoices.push({
          id: `guess:${context.players[a]!.id}:${context.players[b]!.id}`,
          label: `${context.players[a]!.character.name} + ${context.players[b]!.character.name}`,
        });
      }
    }
    const choicesByPlayer = new Map<string, GameChoice[]>();
    const privateHints = new Map<string, string>();
    for (const player of context.players) {
      const isPartner = partnerIds.includes(player.id);
      choicesByPlayer.set(player.id, isPartner ? signalChoices : pairChoices);
      if (isPartner) {
        const teammate = player.id === partnerA!.id ? partnerB! : partnerA!;
        privateHints.set(player.id, `Your secret partner is ${teammate.character.name}. Match the same signal.`);
      }
    }
    return {
      taskId: "secret-partners",
      taskName: "Secret Partnership",
      description: "Two secret partners must coordinate without exposing themselves.",
      participants,
      choicesByPlayer,
      privateHints,
      metadata: { partnerIds },
      resolve(decisions) {
        const deltas = new Map<string, number>();
        const matched = decisions.get(partnerA!.id) === decisions.get(partnerB!.id);
        deltas.set(partnerA!.id, matched ? 5 : 0);
        deltas.set(partnerB!.id, matched ? 5 : 0);
        const sortedPartners = [...partnerIds].sort().join(":");
        for (const player of context.players.filter((candidate) => !partnerIds.includes(candidate.id))) {
          const guess = (decisions.get(player.id) ?? "").replace("guess:", "").split(":").sort().join(":");
          deltas.set(player.id, guess === sortedPartners ? 4 : -1);
        }
        return {
          taskId: "secret-partners",
          taskName: "Secret Partnership",
          outcomeId: matched ? "signals-matched" : "signals-missed",
          summary: matched ? `${partnerA!.character.name} and ${partnerB!.character.name} matched their signals.` : "The secret partners failed to match signals.",
          decisions: context.players.map((player) => ({ playerId: player.id, playerName: player.character.name, choiceId: decisions.get(player.id) ?? choicesByPlayer.get(player.id)![0]!.id, choiceLabel: labelChoice(choicesByPlayer, player.id, decisions.get(player.id) ?? choicesByPlayer.get(player.id)![0]!.id) })),
          scoreChanges: context.players.map((player) => ({ playerId: player.id, playerName: player.character.name, delta: deltas.get(player.id) ?? 0, reason: partnerIds.includes(player.id) ? "Secret signal" : "Partner guess" })),
        };
      },
    };
  },
};
