import type { TaskDefinition } from "../types.js";
import { coalitionNegotiation } from "./coalitionNegotiation.js";
import { pairedConfrontation } from "./pairedConfrontation.js";
import { singleVeto } from "./singleVeto.js";

export const taskDefinitions: TaskDefinition[] = [
  singleVeto,
  pairedConfrontation,
  coalitionNegotiation,
];
