# Chaos Club

Web-based social voice-chat party game foundation. The current milestone contains identity setup, character creation, in-memory rooms, realtime player state, and peer-to-peer WebRTC voice chat.

The playable MVP now includes an eight-round, server-authoritative game loop with synchronized timers, locked decisions, score resolution, round results, and a final winner. One-player test games use the House Bot; two-player games use the two-player task pool; Guarantor unlocks at three players and Secret Partnership unlocks at four.

The interface defaults to Turkish and can be switched to English with the persistent `TR / EN` control. Once a game starts, the room is replaced by a full-screen game stage. Every round begins with a synchronized 10-second briefing containing the objective, scoring rules, negotiation guidance, participants, and private role information before the 30-second decision phase.

## Stack

- React, TypeScript, Vite
- Tailwind CSS
- Node.js, Express, TypeScript
- Socket.io for room events and WebRTC signaling
- WebRTC for peer-to-peer audio
- npm workspaces for `client`, `server`, and `shared`

## Requirements

- Node.js 20.19+ (Node.js 24 was used for verification)
- npm 10+
- A microphone for voice testing

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The backend runs at `http://localhost:3001`.

Optional environment files:

```bash
copy client\.env.example client\.env
copy server\.env.example server\.env
```

The defaults work without environment files. Environment loading can be added with a deployment platform or a package such as `dotenv`; the current server uses process environment variables directly.

## Render deployment

The production server serves both the built React client and the Socket.io backend, so only one Render Web Service is required.

```text
Build Command: npm ci && npm run build
Start Command: npm start
```

Open the single Render service URL for the app. Render provides `RENDER_EXTERNAL_URL` automatically, so `CLIENT_ORIGIN` and `VITE_SERVER_URL` are not required for this same-origin setup. Remove stale values for those variables unless the client and server are intentionally deployed to different domains.

## Verify

```bash
npm run typecheck
npm run build
npm audit
```

## Local voice test

1. Open the app in two separate browser profiles, or use one normal and one private window.
2. Create a room in the first profile and join its six-character code from the second.
3. Click **Enable Microphone** in each profile and grant browser permission.
4. Use headphones to prevent acoustic feedback when testing on one computer.
5. `localhost` is treated as a secure context by browsers, so microphone access works over local HTTP.

For testing from another physical device, serve the client over HTTPS and configure the backend origin. The included public STUN server is enough for many development networks, but production requires a dedicated STUN/TURN service because peer-to-peer connectivity can fail behind strict NAT or firewalls.

## Game test

1. Create a room and remain as host.
2. Click **Start Game** in the game panel. Starting with one player is supported for development.
3. Submit the available decision. Decisions are locked and hidden until the round resolves.
4. A round ends when all required human decisions are submitted or the 30-second server timer expires.
5. Results remain visible for six seconds, then the next round starts automatically.
6. After eight rounds, the highest score wins; equal top scores produce a tie.

The task pool contains Fake Contract, Shared Vault, The Guarantor, Hostage Points, and Secret Partnership. Game state is held in backend memory and disappears when the backend restarts.

Optional production TURN variables can be set during the client build:

```text
VITE_TURN_URL=turn:your-turn-host:3478
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

## Database decision

A database is intentionally not used in this milestone. Rooms and players are temporary and are discarded whenever the backend restarts, which is appropriate for testing the realtime foundation.

Before persistent accounts, reconnect recovery, moderation, match history, saved characters, or horizontal server scaling are introduced, replace `RoomStore` with repository interfaces backed by PostgreSQL or Supabase. Shared domain types and Socket.io handlers are already separated from storage concerns to make that migration direct.

## Project structure

```text
chaos/
|-- client/
|   |-- src/
|   |   |-- components/       Reusable UI elements
|   |   |-- hooks/            WebRTC voice lifecycle
|   |   |-- screens/          Landing, character, lobby, room
|   |   |-- services/         Typed Socket.io client
|   |   `-- App.tsx           Prototype navigation/session state
|   `-- ...                   Vite, Tailwind, TypeScript config
|-- server/
|   |-- src/
|   |   |-- engines/          Future game engine boundary
|   |   |-- models/           Domain model exports
|   |   |-- socket/           Realtime transport handlers
|   |   |-- stores/           In-memory room state
|   |   `-- index.ts          HTTP and Socket.io bootstrap
|   `-- ...                   TypeScript and environment config
|-- shared/
|   `-- src/index.ts          Shared models and typed socket events
|-- scripts/dev.mjs           Cross-platform workspace dev runner
`-- package.json              Workspace scripts
```

## Extension boundaries

Add task, scoring, private chat, auction, card, alliance, and sabotage logic as isolated modules under `server/src/engines`. Keep game rules independent from Socket.io; handlers should translate realtime events into engine calls. Add matching shared event contracts in `shared/src/index.ts` and mount UI modules in the room's game-stage area.

For Electron later, build the Vite client and load `client/dist` from an Electron main process. Keep server deployment separate for online multiplayer, or start a local server process only for explicitly offline/LAN modes.
