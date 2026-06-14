import type { TaskDefinition } from "../types.js";
import { labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const dealChoices = [
  { id: "keep", label: "Keep Promise" },
  { id: "break", label: "Break Promise" },
];

export const guarantor: TaskDefinition = {
  id: "guarantor",
  minPlayers: 3,
  create(context) {
    const [playerA, playerB, guarantorPlayer] = selectFairPlayers(context, 3);
    const participants = [toParticipant(playerA!, "Player A"), toParticipant(playerB!, "Player B"), toParticipant(guarantorPlayer!, "Guarantor")];
    const guarantorChoices = [
      { id: `trust:${playerA!.id}`, label: `Trust ${playerA!.character.name}` },
      { id: `trust:${playerB!.id}`, label: `Trust ${playerB!.character.name}` },
    ];
    const choicesByPlayer = new Map([
      [playerA!.id, dealChoices],
      [playerB!.id, dealChoices],
      [guarantorPlayer!.id, guarantorChoices],
    ]);
    return {
      taskId: "guarantor",
      taskName: "The Guarantor",
      description: "Two players make a promise. One player must decide who deserves trust.",
      participants,
      choicesByPlayer,
      privateHints: new Map([[guarantorPlayer!.id, "Watch the deal and predict which player will be more honest."]]),
      metadata: {},
      resolve(decisions) {
        const aChoice = decisions.get(playerA!.id) ?? "keep";
        const bChoice = decisions.get(playerB!.id) ?? "keep";
        const deltas = new Map<string, number>();
        if (aChoice === "keep" && bChoice === "keep") {
          deltas.set(playerA!.id, 4); deltas.set(playerB!.id, 4); deltas.set(guarantorPlayer!.id, 0);
        } else if (aChoice === "break" && bChoice === "break") {
          deltas.set(playerA!.id, -1); deltas.set(playerB!.id, -1); deltas.set(guarantorPlayer!.id, 0);
        } else {
          const honestId = aChoice === "keep" ? playerA!.id : playerB!.id;
          deltas.set(playerA!.id, aChoice === "break" ? 7 : 0);
          deltas.set(playerB!.id, bChoice === "break" ? 7 : 0);
          deltas.set(guarantorPlayer!.id, decisions.get(guarantorPlayer!.id) === `trust:${honestId}` ? 3 : -2);
        }
        return {
          taskId: "guarantor",
          taskName: "The Guarantor",
          outcomeId: aChoice === bChoice ? (aChoice === "keep" ? "both-kept" : "both-broke") : "mixed-promise",
          summary: aChoice === bChoice ? "The guarantor had no honest side to distinguish." : "One promise held while the other broke.",
          decisions: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, choiceId: decisions.get(participant.id) ?? choicesByPlayer.get(participant.id)![0]!.id, choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? choicesByPlayer.get(participant.id)![0]!.id) })),
          scoreChanges: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, delta: deltas.get(participant.id) ?? 0, reason: participant.id === guarantorPlayer!.id ? "Trust prediction" : "Promise outcome" })),
        };
      },
    };
  },
};
