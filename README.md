# Cloud Step 9

A Cloud9-themed rhythm platformer minigame. Bounce through clouds, stomp bosses, and chase high scores — all in the browser.

## Quick Start

```bash
npm install
npm start
```

The server prints your LAN address on startup — share that URL with players.

- Game: `http://<your-ip>:3000`
- Leaderboard display: `http://<your-ip>:3000/leaderboard.html`

## Controls

- **1 Player** — Space / A / Enter / click / tap to stomp
- **2 Player** — Each player binds a key, then split-screen co-op
- **Arrow keys** — Navigate menus, enter leaderboard initials

## Live Leaderboard

For events and booths: open `leaderboard.html` on a second screen (phone, tablet, TV — any device on the same network). Scores sync across all devices in real time via server-sent events.

Scores persist in `leaderboard.json` so they survive server restarts.

### Offline / No Server

You can still open `index.html` directly in a browser without running the server. Scores fall back to `localStorage` (per-browser only).

## Project Structure

```
cloud-step-9/
├── index.html              # Game page
├── leaderboard.html        # Live leaderboard display
├── game.js                 # Entry point: game loop, update, draw
├── style.css               # Game canvas styles
├── server.js               # Express server with leaderboard API + SSE
├── package.json            # npm config
├── modules/
│   ├── constants.js        # Dimensions, colors, sky themes
│   ├── assets.js           # Sprite image loading + frame extraction
│   ├── audio.js            # Web Audio synth engine, SFX, EDM sequencer
│   ├── state.js            # Game state machine, mutable globals
│   ├── physics.js          # Gravity, velocity, scoring, difficulty scaling
│   ├── input.js            # Keyboard, mouse, touch handlers
│   ├── clouds.js           # Cloud chain and runway generation
│   ├── sprites.js          # Player and cloud sprite rendering
│   ├── effects.js          # Particles, floating text, background clouds
│   ├── rendering.js        # Background, viewport, visual helpers
│   ├── hud.js              # Heads-up display
│   ├── screens.js          # Title, results, key-bind, leaderboard screens
│   └── leaderboard.js      # Score persistence + network sync
└── sprites/                # Sprite sheets and character art
```

## Features

- Procedural EDM soundtrack that scales tempo with difficulty
- Timing-ring stomp mechanic with perfect/good/miss accuracy
- Boss clouds with 9 HP at the end of each round
- Progressive difficulty: tighter timing, faster gravity, more clouds
- 2-player split-screen mode
- Network-shared leaderboard with real-time updates (SSE)
- Persistent scores via `leaderboard.json`
- Offline fallback to localStorage

## License

[MIT](LICENSE)
