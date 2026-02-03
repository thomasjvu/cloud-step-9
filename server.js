const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const LB_FILE = path.join(__dirname, 'leaderboard.json');

// ── In-memory leaderboard ────────────────────────────────
let leaderboard = [];

function loadFromDisk() {
  try {
    if (fs.existsSync(LB_FILE)) {
      leaderboard = JSON.parse(fs.readFileSync(LB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load leaderboard.json:', e.message);
    leaderboard = [];
  }
}

function saveToDisk() {
  try {
    fs.writeFileSync(LB_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (e) {
    console.error('Failed to save leaderboard.json:', e.message);
  }
}

loadFromDisk();

// ── SSE clients ──────────────────────────────────────────
const sseClients = new Set();

function broadcastSSE() {
  const data = JSON.stringify(leaderboard);
  for (const res of sseClients) {
    res.write(`data: ${data}\n\n`);
  }
}

// ── Middleware ────────────────────────────────────────────
app.use(express.json());

// ── API routes (before static so /api paths aren't caught) ──
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score, combo, phase } = req.body;
  if (typeof name !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'name (string) and score (number) are required' });
  }
  leaderboard.push({
    name: name.slice(0, 10),
    score,
    combo: combo || 0,
    phase: phase || 1,
    timestamp: Date.now(),
  });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  saveToDisk();
  broadcastSSE();
  res.json({ ok: true, leaderboard });
});

app.get('/api/leaderboard/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  // Send current state immediately
  res.write(`data: ${JSON.stringify(leaderboard)}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ── Static files ─────────────────────────────────────────
app.use(express.static(__dirname));

// ── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Cloud Step 9 running at http://localhost:${PORT}`);

  // Show LAN addresses
  const interfaces = os.networkInterfaces();
  for (const [iface, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`  LAN: http://${addr.address}:${PORT}`);
      }
    }
  }
  console.log(`\nLeaderboard display: /leaderboard.html`);
});
