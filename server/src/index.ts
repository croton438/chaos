import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import type { ClientToServerEvents, ServerToClientEvents } from "@chaos-club/shared";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";
import { RoomStore } from "./stores/roomStore.js";

const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const allowedOrigins = new Set(
  [clientOrigin, process.env.RENDER_EXTERNAL_URL, "http://localhost:5173"].filter(Boolean),
);
const allowOrigin = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  callback(null, !origin || allowedOrigins.has(origin));
};
const app = express();
const httpServer = createServer(app);
const roomStore = new RoomStore();

app.use(cors({ origin: allowOrigin }));
app.use(express.json());
app.get("/health", (_request, response) => {
  response.json({ status: "ok", rooms: roomStore.list().length });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: allowOrigin, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => registerSocketHandlers(io, socket, roomStore));

const clientDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_request, response) => response.sendFile(resolve(clientDist, "index.html")));
}

httpServer.listen(port, () => {
  console.log(`Chaos Club server listening on http://localhost:${port}`);
});
