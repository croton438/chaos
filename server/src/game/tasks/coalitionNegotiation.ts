import type { TaskDefinition } from "../types.js";
import { createHouseBot, labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const choices = [
  { id: "plan-a", label: "PLAN A", description: "Back the first division plan." },
  { id: "plan-b", label: "PLAN B", description: "Back the second division plan." },
  { id: "plan-c", label: "PLAN C", description: "Back the third division plan." },
];

export const coalitionNegotiation: TaskDefinition = {
  id: "coalition-negotiation",
  minPlayers: 1,
  create(context) {
    const participants = selectFairPlayers(context, Math.min(5, Math.max(3, context.players.length))).map((player) => toParticipant(player));
    while (participants.length < 3) participants.push(createHouseBot(participants.length - context.players.length));
    const choicesByPlayer = new Map(participants.map((participant) => [participant.id, choices]));

    return {
      taskId: "coalition-negotiation",
      taskName: "Coalition Negotiation",
      description: "Agree on one division plan. A lone dissenter profits briefly; a fractured coalition loses everything.",
      participants,
      choicesByPlayer,
      privateHints: new Map(),
      metadata: {},
      resolve(decisions) {
        const groups = new Map<string, typeof participants>();
        for (const participant of participants) {
          const choice = decisions.get(participant.id) ?? "plan-a";
          groups.set(choice, [...(groups.get(choice) ?? []), participant]);
        }
        const allAgree = groups.size === 1;
        const loneGroup = [...groups.values()].find((group) => group.length === 1);
        const loneDissenter = groups.size === 2 ? loneGroup?.[0] : undefined;
        const majority = loneDissenter ? participants.filter((participant) => participant.id !== loneDissenter.id) : [];
        const leverageGrants = loneDissenter && !loneDissenter.id.startsWith("bot:")
          ? majority.filter((participant) => !participant.id.startsWith("bot:")).map((participant) => ({ ownerId: participant.id, targetId: loneDissenter.id, partnerId: loneDissenter.id, source: "coalition" as const }))
          : [];
        const outcomeId = allAgree ? "coalition-agreement" : loneDissenter ? "coalition-dissenter" : "coalition-collapse";
        return {
          result: {
            taskId: "coalition-negotiation",
            taskName: "Coalition Negotiation",
            outcomeId,
            summary: outcomeId,
            decisions: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, choiceId: decisions.get(participant.id) ?? "plan-a", choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? "plan-a") })),
            resourceChanges: participants.map((participant) => ({
              playerId: participant.id,
              playerName: participant.name,
              influenceDelta: allAgree ? 4 : loneDissenter?.id === participant.id ? 2 : loneDissenter ? 1 : 0,
              trustDelta: loneDissenter?.id === participant.id ? -1 : 0,
              reason: allAgree ? "Coalition agreement" : loneDissenter?.id === participant.id ? "Lone dissent" : "Coalition outcome",
            })),
            leverageEvents: [],
          },
          leverageGrants,
        };
      },
    };
  },
};
