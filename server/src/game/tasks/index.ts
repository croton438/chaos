import type { TaskDefinition } from "../types.js";
import { fakeContract } from "./fakeContract.js";
import { guarantor } from "./guarantor.js";
import { hostagePoints } from "./hostagePoints.js";
import { secretPartners } from "./secretPartners.js";
import { sharedVault } from "./sharedVault.js";

export const taskDefinitions: TaskDefinition[] = [
  fakeContract,
  sharedVault,
  hostagePoints,
  guarantor,
  secretPartners,
];

