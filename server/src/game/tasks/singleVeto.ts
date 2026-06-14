import type { TaskDefinition } from "../types.js";
import { createHouseBot, labelChoice, toParticipant } from "../types.js";

const choices = [
  { id: "yes", label: "YES", description: "Approve the shared influence pool." },
  { id: "no", label: "NO", description: "Secretly veto the pool for a personal reward." },
];

export const singleVeto: TaskDefinition = {
  id: "single-veto",
  minPlayers: 1,
  create(context) {
    const participants = context.players.map((player) => toParticipant(player));
    if (participants.length === 1) participants.push(createHouseBot());
    const choicesByPlayer = new Map(participants.map((participant) => [participant.id, choices]));
    const pool = participants.length * 2;

    return {
      taskId: "single-veto",
      taskName: "Single Veto",
      description: `A pool of ${pool} Influence is waiting. One NO steals a private reward; two NO votes burn everyone.`,
      participants,
      choicesByPlayer,
      privateHints: new Map(),
      metadata: { pool },
      resolve(decisions) {
        const vetoes = participants.filter((participant) => decisions.get(participant.id) === "no");
        const resourceChanges = participants.map((participant) => {
          const vetoed = vetoes.some((vetoer) => vetoer.id === participant.id);
          return {
            playerId: participant.id,
            playerName: participant.name,
            influenceDelta: vetoes.length === 0 ? Math.floor(pool / participants.length) : vetoes.length === 1 && vetoed ? 2 : 0,
            trustDelta: vetoes.length >= 2 && vetoed ? -1 : 0,
            reason: vetoes.length === 0 ? "Shared pool" : vetoed ? "Veto" : "Pool blocked",
          };
        });
        const outcomeId = vetoes.length === 0 ? "veto-approved" : vetoes.length === 1 ? "single-veto" : "multiple-veto";
        return {
          result: {
            taskId: "single-veto",
            taskName: "Single Veto",
            outcomeId,
            summary: outcomeId,
            decisions: participants.map((participant) => ({
              playerId: participant.id,
              playerName: participant.name,
              choiceId: decisions.get(participant.id) ?? "yes",
              choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? "yes"),
            })),
            resourceChanges,
            leverageEvents: [],
          },
          leverageGrants: [],
        };
      },
    };
  },
};
