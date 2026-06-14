import type { TaskDefinition } from "../types.js";
import { HOUSE_BOT, labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const choices = [
  { id: "return", label: "Return Hostage", description: "Return the points and share the reward." },
  { id: "steal", label: "Steal Hostage", description: "Keep the hostage points for yourself." },
];

export const hostagePoints: TaskDefinition = {
  id: "hostage-points",
  minPlayers: 1,
  create(context) {
    const selected = selectFairPlayers(context, 2);
    const playerA = selected.length === 1 ? HOUSE_BOT : toParticipant(selected[0]!, "Depositor");
    const playerB = toParticipant(selected[selected.length - 1]!, "Holder");
    const participants = [playerA, playerB];
    const choicesByPlayer = new Map([[playerB.id, choices]]);
    return {
      taskId: "hostage-points",
      taskName: "Hostage Points",
      description: "One player leaves points as hostage. The other decides whether to return or steal.",
      participants,
      choicesByPlayer,
      privateHints: new Map([[playerB.id, "You control the hostage. The final decision is yours."]]),
      metadata: {},
      resolve(decisions) {
        const choice = decisions.get(playerB.id) ?? "return";
        const deltas = choice === "return" ? new Map([[playerA.id, 3], [playerB.id, 3]]) : new Map([[playerA.id, -2], [playerB.id, 6]]);
        return {
          taskId: "hostage-points",
          taskName: "Hostage Points",
          outcomeId: choice === "return" ? "returned" : "stolen",
          summary: choice === "return" ? "The hostage was returned." : "The holder stole the hostage points.",
          decisions: [{ playerId: playerB.id, playerName: playerB.name, choiceId: choice, choiceLabel: labelChoice(choicesByPlayer, playerB.id, choice) }],
          scoreChanges: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, delta: deltas.get(participant.id) ?? 0, reason: "Hostage outcome" })),
        };
      },
    };
  },
};
