import type { TaskDefinition } from "../types.js";
import { HOUSE_BOT, labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const choices = [
  { id: "real", label: "Real Sign", description: "Honor the contract." },
  { id: "fake", label: "Fake Sign", description: "Betray the other signer." },
];

export const fakeContract: TaskDefinition = {
  id: "fake-contract",
  minPlayers: 1,
  create(context) {
    const selected = selectFairPlayers(context, 2);
    const participants = selected.map((player) => toParticipant(player));
    if (participants.length === 1) participants.push(HOUSE_BOT);
    const choicesByPlayer = new Map(participants.map((participant) => [participant.id, choices]));

    return {
      taskId: "fake-contract",
      taskName: "Fake Contract",
      description: "You both have a contract. Real trust pays well, but betrayal pays better.",
      participants,
      choicesByPlayer,
      privateHints: new Map(),
      metadata: {},
      resolve(decisions) {
        const [a, b] = participants;
        const aChoice = decisions.get(a!.id) ?? "real";
        const bChoice = decisions.get(b!.id) ?? "real";
        const deltas = new Map<string, number>();
        if (aChoice === "real" && bChoice === "real") {
          deltas.set(a!.id, 5); deltas.set(b!.id, 5);
        } else if (aChoice === "fake" && bChoice === "fake") {
          deltas.set(a!.id, -2); deltas.set(b!.id, -2);
        } else {
          deltas.set(a!.id, aChoice === "fake" ? 8 : 0);
          deltas.set(b!.id, bChoice === "fake" ? 8 : 0);
        }
        return {
          taskId: "fake-contract",
          taskName: "Fake Contract",
          outcomeId: aChoice === bChoice ? (aChoice === "real" ? "mutual-trust" : "mutual-betrayal") : "betrayal",
          summary: aChoice === bChoice ? "Both sides revealed the same intention." : "The contract ended in betrayal.",
          decisions: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, choiceId: decisions.get(participant.id) ?? "real", choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? "real") })),
          scoreChanges: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, delta: deltas.get(participant.id) ?? 0, reason: "Contract outcome" })),
        };
      },
    };
  },
};
