import type { TaskDefinition } from "../types.js";
import { HOUSE_BOT, labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const choices = [
  { id: "open", label: "Open Vault", description: "Cooperate and split the vault." },
  { id: "run", label: "Run Away", description: "Attempt to take the better payout." },
];

export const sharedVault: TaskDefinition = {
  id: "shared-vault",
  minPlayers: 1,
  create(context) {
    const selected = selectFairPlayers(context, 2);
    const participants = selected.map((player) => toParticipant(player));
    if (participants.length === 1) participants.push(HOUSE_BOT);
    const choicesByPlayer = new Map(participants.map((participant) => [participant.id, choices]));
    return {
      taskId: "shared-vault",
      taskName: "Shared Vault",
      description: "There is a shared vault. Open it together or escape with the chance of stealing more.",
      participants,
      choicesByPlayer,
      privateHints: new Map(),
      metadata: {},
      resolve(decisions) {
        const [a, b] = participants;
        const aChoice = decisions.get(a!.id) ?? "open";
        const bChoice = decisions.get(b!.id) ?? "open";
        const deltas = new Map<string, number>();
        if (aChoice === "open" && bChoice === "open") {
          deltas.set(a!.id, 4); deltas.set(b!.id, 4);
        } else if (aChoice === "run" && bChoice === "run") {
          deltas.set(a!.id, 1); deltas.set(b!.id, 1);
        } else {
          deltas.set(a!.id, aChoice === "run" ? 7 : 0);
          deltas.set(b!.id, bChoice === "run" ? 7 : 0);
        }
        return {
          taskId: "shared-vault",
          taskName: "Shared Vault",
          outcomeId: aChoice === bChoice ? (aChoice === "open" ? "mutual-open" : "mutual-run") : "one-ran",
          summary: aChoice === bChoice ? "Both players made the same move." : "One player escaped with the advantage.",
          decisions: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, choiceId: decisions.get(participant.id) ?? "open", choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? "open") })),
          scoreChanges: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, delta: deltas.get(participant.id) ?? 0, reason: "Vault outcome" })),
        };
      },
    };
  },
};
