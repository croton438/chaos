import type { TaskDefinition } from "../types.js";
import { createHouseBot, labelChoice, selectFairPlayers, toParticipant } from "../types.js";

const choices = [
  { id: "loyalty", label: "LOYALTY", description: "Keep the deal and share the reward." },
  { id: "betrayal", label: "BETRAYAL", description: "Take the larger reward and leave evidence behind." },
];

export const pairedConfrontation: TaskDefinition = {
  id: "paired-confrontation",
  minPlayers: 1,
  create(context) {
    const selected = selectFairPlayers(context, 2);
    const participants = selected.map((player) => toParticipant(player));
    if (participants.length === 1) participants.push(createHouseBot());
    const choicesByPlayer = new Map(participants.map((participant) => [participant.id, choices]));

    return {
      taskId: "paired-confrontation",
      taskName: "Paired Confrontation",
      description: "Two players negotiate, then secretly choose Loyalty or Betrayal. Betrayal pays now but creates Leverage.",
      participants,
      choicesByPlayer,
      privateHints: new Map(),
      metadata: {},
      resolve(decisions) {
        const [first, second] = participants;
        const firstChoice = decisions.get(first!.id) ?? "loyalty";
        const secondChoice = decisions.get(second!.id) ?? "loyalty";
        const bothLoyal = firstChoice === "loyalty" && secondChoice === "loyalty";
        const bothBetray = firstChoice === "betrayal" && secondChoice === "betrayal";
        const leverageGrants = [];
        if (!bothLoyal && !bothBetray) {
          const betrayer = firstChoice === "betrayal" ? first! : second!;
          const victim = firstChoice === "loyalty" ? first! : second!;
          if (!victim.id.startsWith("bot:")) leverageGrants.push({ ownerId: victim.id, targetId: betrayer.id, partnerId: betrayer.id, source: "betrayal" as const });
        }
        const resourceChanges = participants.map((participant) => {
          const choice = decisions.get(participant.id) ?? "loyalty";
          return {
            playerId: participant.id,
            playerName: participant.name,
            influenceDelta: bothLoyal ? 3 : bothBetray ? -1 : choice === "betrayal" ? 6 : -1,
            trustDelta: bothBetray || choice === "betrayal" ? -1 : 0,
            reason: choice === "betrayal" ? "Betrayal" : "Loyalty",
          };
        });
        const outcomeId = bothLoyal ? "mutual-loyalty" : bothBetray ? "mutual-betrayal" : "one-betrayal";
        return {
          result: {
            taskId: "paired-confrontation",
            taskName: "Paired Confrontation",
            outcomeId,
            summary: outcomeId,
            decisions: participants.map((participant) => ({ playerId: participant.id, playerName: participant.name, choiceId: decisions.get(participant.id) ?? "loyalty", choiceLabel: labelChoice(choicesByPlayer, participant.id, decisions.get(participant.id) ?? "loyalty") })),
            resourceChanges,
            leverageEvents: [],
          },
          leverageGrants,
        };
      },
    };
  },
};
