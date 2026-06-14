import type { ClientToServerEvents, ServerToClientEvents } from "@chaos-club/shared";
import { io, type Socket } from "socket.io-client";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001",
  { autoConnect: true },
);

