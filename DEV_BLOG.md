# Building Cloud Step 9

A browser-based rhythm platformer where you stomp on kawaii clouds to the beat of procedurally generated EDM.

---

## What It Is

Cloud Step 9 combines rhythm game mechanics with platforming. Stomp on clouds when the timing ring aligns perfectly to score points. The music is generated in real-time using Web Audio API, and scores sync across devices via a live leaderboard.

---

## Key Features

**Timing Ring Mechanic**  
Each cloud has a pulsing ring that contracts to the beat. Stomp at the right moment for perfect/good/miss ratings.

**Procedural EDM**  
The soundtrack is synthesized on the fly using Web Audio API—synth pads, basslines, drums—with tempo that scales as difficulty increases.

**Character Sprites**  
Chibi-style characters with idle, run, jump, and spin animations. Kawaii clouds with expressive faces (happy, grumpy, boss thunder clouds).

**2-Player Split-Screen**  
Local co-op where each player has their own stomp key and score. Perfect for events and parties.

**Network Leaderboard**  
Real-time score syncing via Server-Sent Events. Display the leaderboard on a second screen while players compete. Scores persist to JSON.

---

## Technical Stack

- Vanilla JavaScript with modular ES6 architecture
- Web Audio API for all sound synthesis (no external libraries)
- Express.js server for leaderboard API
- HTML5 Canvas for rendering
- SSE for live score updates

**Module Structure:**

```
modules/
├── audio.js         # Web Audio synth + sequencer
├── physics.js       # Gravity, velocity, difficulty
├── sprites.js       # Character rendering
├── clouds.js        # Cloud generation
├── leaderboard.js   # Score persistence + SSE
└── ...13 modules total
```

---

## Development Challenges

**Timing Precision:** Syncing the rhythm ring to both music beat and input required tight coordination between audio and physics systems.

**Dynamic Difficulty:** Balanced gravity, cloud spacing, and timing windows to scale difficulty without feeling unfair.

**Performance:** Optimized particle rendering and sprite extraction to maintain 60 FPS.

---

## Play It

```bash
npm install
npm start
```

Share the LAN address for multiplayer or display the leaderboard on another device.

---

**Built with vanilla JS and Web Audio API.**  
_License: MIT_
