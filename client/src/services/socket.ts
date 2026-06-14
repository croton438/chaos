import type { ClientToServerEvents, ServerToClientEvents } from "@chaos-club/shared";
import { io, type Socket } from "socket.io-client";

const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();
const serverUrl = configuredServerUrl || (import.meta.env.DEV ? "http://localhost:3001" : undefined);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  serverUrl,
  {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 15_000,
  },
);
