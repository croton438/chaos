import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import type { ClientToServerEvents, ServerToClientEvents } from "@chaos-club/shared";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";
import { RoomStore } from "./stores/roomStore.js";

const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const app = express();
const httpServer = createServer(app);
const roomStore = new RoomStore();

app.use(cors({ origin: clientOrigin }));
app.use(express.json());
app.get("/health", (_request, response) => {
  response.json({ status: "ok", rooms: roomStore.list().length });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: clientOrigin, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => registerSocketHandlers(io, socket, roomStore));

httpServer.listen(port, () => {
  console.log(`Chaos Club server listening on http://localhost:${port}`);
});

