// ═══════════════════════════════════════════════════════════════════
// CLOUD BOUNCE — A Cloud9 Minigame
// Single-file, zero-dependency, procedural art, Web Audio
// ═══════════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GW = 960;
const GH = 540;
canvas.width = GW;
canvas.height = GH;

// ── Colors ────────────────────────────────────────────────────────
const C9_BLUE = '#009EE2';
const C9_LIGHT = '#5BC8F5';
const WHITE = '#FFFFFF';
const GOLD = '#FFD700';
const PERFECT_GREEN = '#3DF53D';
const MISS_RED = '#FF4444';

// Sky gradient stops per phase
const SKY_THEMES = [
  { top: '#87CEEB', bot: '#d4efff' },
  { top: '#5B8BA0', bot: '#9ec5d9' },
  { top: '#3D5A6E', bot: '#6e8fa0' },
  { top: '#1A1A3E', bot: '#3d3d6e' },
  { top: '#0D0D1A', bot: '#1a1a3e' },
];

// ── Audio ─────────────────────────────────────────────────────────
let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, dur, type = 'square', vol = 0.12) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol = 0.06) {
  if (!audioCtx) return;
  const bufSize = audioCtx.sampleRate * dur;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
}

function sfxJump() {
  playTone(440, 0.12, 'sine');
  setTimeout(() => playTone(660, 0.1, 'sine'), 60);
}
function sfxStomp() {
  playTone(200, 0.15, 'square', 0.15);
  playNoise(0.08, 0.1);
  setTimeout(() => playTone(300, 0.08, 'square', 0.1), 30);
}
function sfxPerfect() {
  playTone(784, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(988, 0.1, 'sine', 0.15), 80);
  setTimeout(() => playTone(1175, 0.15, 'sine', 0.15), 160);
}
function sfxBounce() {
  playTone(520, 0.08, 'sine');
  setTimeout(() => playTone(780, 0.1, 'sine'), 50);
}
function sfxMiss() {
  playTone(300, 0.2, 'sawtooth', 0.1);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.08), 100);
}
function sfxCloud9() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.15), i * 80));
}
function sfxStart() {
  playTone(440, 0.1, 'sine');
  setTimeout(() => playTone(554, 0.1, 'sine'), 100);
  setTimeout(() => playTone(659, 0.15, 'sine'), 200);
}
function sfxPhaseUp() {
  playTone(400, 0.15, 'square', 0.1);
  setTimeout(() => playTone(600, 0.15, 'square', 0.1), 120);
  setTimeout(() => playTone(800, 0.2, 'square', 0.12), 240);
}
function sfxSelect() {
  playTone(600, 0.08, 'sine', 0.1);
}

// ── Procedural Music System ──────────────────────────────────────
const PENTA_C = [262, 294, 330, 392, 440];
const MELODY_PATTERN = [0, 2, 4, 3, 4, 2, 1, 0, 2, 4, 3, 2, 0, 1, 2, 4];
const BASS_BEATS = [0, 4, 8, 12];

let musicPlaying = false;
let musicBPM = 120;
let musicBeat = 0;
let musicInterval = null;
let musicGainNode = null;
let lastBeatTime = 0;
let beatInterval = 0;
let beatPulse = 0;
let rhythmBonusText = 0;
let lastStompOnBeat = false;

function startMusic() {
  if (!audioCtx || musicPlaying) return;
  musicPlaying = true;
  musicBeat = 0;
  musicBPM = getMusicBPM();
  beatInterval = 60 / musicBPM;
  lastBeatTime = audioCtx.currentTime;
  beatPulse = 0;
  musicGainNode = audioCtx.createGain();
  musicGainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
  musicGainNode.connect(audioCtx.destination);
  const beatMs = 60000 / musicBPM;
  musicInterval = setInterval(() => {
    if (!musicPlaying) return;
    lastBeatTime = audioCtx.currentTime;
    beatPulse = 1;
    playMusicBeat(musicBeat);
    musicBeat = (musicBeat + 1) % 16;
  }, beatMs);
}

function stopMusic() {
  musicPlaying = false;
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  musicGainNode = null;
  beatPulse = 0;
}

function getMusicBPM() {
  if (phase <= 1) return 85;
  if (phase === 2) return 110;
  if (phase === 3) return 145;
  if (phase === 4) return 185;
  if (phase === 5) return 230;
  return Math.min(300, 230 + (phase - 5) * 12);
}

function updateMusicTempo() {
  if (!musicPlaying) return;
  musicBPM = getMusicBPM();
  beatInterval = 60 / musicBPM;
  if (musicInterval) clearInterval(musicInterval);
  const beatMs = 60000 / musicBPM;
  musicInterval = setInterval(() => {
    if (!musicPlaying) return;
    lastBeatTime = audioCtx.currentTime;
    beatPulse = 1;
    playMusicBeat(musicBeat);
    musicBeat = (musicBeat + 1) % 16;
  }, beatMs);
}

function getBeatAccuracy() {
  if (!audioCtx || !musicPlaying || beatInterval <= 0) return 0;
  const now = audioCtx.currentTime;
  const timeSinceBeat = now - lastBeatTime;
  const distToNearest = Math.min(timeSinceBeat % beatInterval, beatInterval - (timeSinceBeat % beatInterval));
  const window = beatInterval * 0.25;
  if (distToNearest <= window) return 1 - (distToNearest / window);
  return 0;
}

function playMusicNote(freq, dur, type, vol, detune = 0) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (detune) osc.detune.setValueAtTime(detune, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(gain);
  if (musicGainNode) { gain.connect(musicGainNode); } else { gain.connect(audioCtx.destination); }
  osc.start(now);
  osc.stop(now + dur);
}

function playMusicBeat(beat) {
  if (!audioCtx) return;
  const beatDur = 60 / musicBPM;
  if (phase >= 2) {
    playNoise(0.04, 0.015 + Math.min(phase - 1, 4) * 0.005);
  } else if (BASS_BEATS.includes(beat)) {
    playNoise(0.03, 0.01);
  }
  if (phase >= 2 && BASS_BEATS.includes(beat)) {
    const kickVol = 0.06 + Math.min(phase - 2, 3) * 0.025;
    playMusicNote(65, 0.12, 'sine', kickVol);
  }
  if (phase >= 2 && BASS_BEATS.includes(beat)) {
    const bassFreq = PENTA_C[0] / 2;
    const bassDur = beatDur * 0.8;
    const bassVol = 0.04 + Math.min(phase - 2, 3) * 0.02;
    playMusicNote(bassFreq, bassDur, 'sine', bassVol);
    if (phase >= 3) playMusicNote(bassFreq * 2, bassDur, 'sine', 0.04);
    if (phase >= 4) playMusicNote(bassFreq, bassDur, 'sawtooth', 0.025);
  }
  const noteIdx = MELODY_PATTERN[beat];
  let melodyFreq = PENTA_C[noteIdx] * 2;
  const melodyDur = beatDur * 0.6;
  const playMelody = phase >= 2 || beat % 2 === 0;
  if (phase >= 4 && (beat === 5 || beat === 13)) melodyFreq = 311;
  if (phase >= 5 && beat % 2 === 1 && Math.random() < 0.3) {
    melodyFreq = PENTA_C[noteIdx] * 2 + (Math.random() < 0.5 ? 15 : -15);
  }
  if (playMelody) {
    const melVol = 0.04 + Math.min(phase - 1, 4) * 0.01;
    playMusicNote(melodyFreq, melodyDur, 'sine', melVol);
  }
  if (phase >= 3) {
    const harmIdx = Math.min(noteIdx + 2, PENTA_C.length - 1);
    const harmFreq = PENTA_C[harmIdx] * 2;
    const detune = (Math.random() - 0.5) * (4 + phase * 2);
    playMusicNote(harmFreq, melodyDur, 'sine', 0.03, detune);
  }
  if (phase >= 5 && beat % 2 === 0) {
    const arpIdx = (noteIdx + 1) % PENTA_C.length;
    setTimeout(() => {
      if (musicPlaying) playMusicNote(PENTA_C[arpIdx] * 2, beatDur * 0.25, 'sine', 0.03);
    }, (beatDur * 1000) / 2);
  }
}

// ── State machine ─────────────────────────────────────────────────
const STATE = {
  TITLE: 0, READY: 1, JUMP_UP: 2, FALL: 3, ACTION_WINDOW: 4,
  STOMP_HIT: 5, BOUNCE_UP: 6, MISS_BOUNCE: 7, MISS_FALL: 8,
  RESULTS: 9, LEADERBOARD: 10, PHASE_CHANGE: 11, KEY_BIND: 12,
};

// Global state (title/keybind only during gameplay)
let state = STATE.TITLE;
let phase = 1;

// ── Game constants ────────────────────────────────────────────────
const GROUND_Y = 420;
const BASE_ACTIVATION_DIST = 280;
const ACTIVATION_DECREASE = 5;
const MIN_ACTIVATION_DIST = 60;

// ── 2-Player Mode Globals ─────────────────────────────────────────
let gameMode = '1P';
let players = [];
let titleSelection = 0;
let keyBindingPhase = 0;
let playerKeys = [
  { key: 'ShiftLeft', label: 'L-SHIFT' },
  { key: 'ShiftRight', label: 'R-SHIFT' }
];
let globalInputJustPressed = false;
let globalInputPressed = false;

function getVW() { return gameMode === '2P' ? 480 : GW; }

// ── Player State Factory ──────────────────────────────────────────
function createPlayerState(playerIndex) {
  return {
    index: playerIndex,
    nimbus: { x: 0, y: 0, vy: 0, expression: 'happy', rotation: 0, pose: 'idle', stretchX: 1, stretchY: 1, flipAngle: 0, isFlipping: false },
    enemy: { x: 0, y: 0, squish: 0, flash: 0, type: 0 },
    combo: 0, score: 0, bouncesSincePhase: 0,
    ringProgress: 0, ringActive: false, ringActivationY: 0, ringStompY: 0,
    actionPressed: false, actionResult: '',
    particles: [], floatingTexts: [],
    screenShake: { x: 0, y: 0, intensity: 0 },
    timeSlowdown: 0, cloud9Overlay: 0, cloud9Text: '',
    ringWobble: 0, ringPulsePhase: 0,
    phaseChangeStep: 0, phaseScrollOffset: 0,
    phaseOldEnemyY: 0, phaseNewEnemyY: -100, phaseSpeedLines: [],
    state: STATE.READY, stateTimer: 0,
    inputJustPressed: false, inputPressed: false,
    alive: true, keyBinding: null, keyLabel: '',
  };
}

// ── Shared visual state ───────────────────────────────────────────
let phaseTransitionFlash = 0;
let bgClouds = [];
let titleBounce = 0;
let titleClouds = [];
let currentSky = { top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot };
let targetSky = { top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot };

// Leaderboard
let leaderboard = [];
let initialsEntry = { active: false, chars: ['A','A','A'], pos: 0 };
let initialsPlayerIndex = 0; // which player is currently entering initials in 2P
let initialsQueue = [];      // player indices that still need to enter initials
let showLeaderboardFromTitle = false;
let idleTimer = 0;

// ── Leaderboard persistence ──────────────────────────────────────
function loadLeaderboard() {
  try {
    const data = localStorage.getItem('cloud9_bounce_lb');
    if (data) leaderboard = JSON.parse(data);
  } catch(e) { leaderboard = []; }
}
function saveLeaderboard() {
  try { localStorage.setItem('cloud9_bounce_lb', JSON.stringify(leaderboard)); } catch(e) {}
}
function addToLeaderboard(name, sc, co, ph) {
  leaderboard.push({ name, score: sc, combo: co, phase: ph, timestamp: Date.now() });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  saveLeaderboard();
}
function isHighScore(sc) {
  if (leaderboard.length < 10) return true;
  return sc > leaderboard[leaderboard.length - 1].score;
}

// ── Input handling ────────────────────────────────────────────────
function formatKeyLabel(code) {
  return code.replace('Key', '').replace('Digit', '').replace('ShiftLeft', 'L-SHIFT').replace('ShiftRight', 'R-SHIFT').replace('ControlLeft', 'L-CTRL').replace('ControlRight', 'R-CTRL').replace('AltLeft', 'L-ALT').replace('AltRight', 'R-ALT').replace('Space', 'SPACE').replace('Enter', 'ENTER');
}

document.addEventListener('keydown', (e) => {
  initAudio();

  if (state === STATE.TITLE) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      titleSelection = titleSelection === 0 ? 1 : 0;
      sfxSelect();
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!globalInputPressed) { globalInputPressed = true; globalInputJustPressed = true; }
    }
    if (e.code === 'KeyL') showLeaderboardFromTitle = !showLeaderboardFromTitle;
    return;
  }

  if (state === STATE.KEY_BIND) {
    if (keyBindingPhase === 1) {
      playerKeys[0] = { key: e.code, label: formatKeyLabel(e.code) };
      keyBindingPhase = 2;
      sfxSelect();
    } else if (keyBindingPhase === 2) {
      if (e.code !== playerKeys[0].key) {
        playerKeys[1] = { key: e.code, label: formatKeyLabel(e.code) };
        keyBindingPhase = 0;
        sfxStart();
        startGame();
      }
    }
    return;
  }

  // Gameplay
  if (gameMode === '1P') {
    if (e.code === 'Space' || e.code === 'KeyA' || e.code === 'Enter') {
      e.preventDefault();
      const p = players[0];
      if (p && !p.inputPressed) { p.inputPressed = true; p.inputJustPressed = true; }
    }
    if (players[0] && players[0].state === STATE.RESULTS && initialsEntry.active) handleInitialsKey(e);
  } else {
    players.forEach((p, i) => {
      if (e.code === playerKeys[i].key && !p.inputPressed) {
        e.preventDefault();
        p.inputPressed = true; p.inputJustPressed = true;
      }
    });
    if (players.every(p => !p.alive) && initialsEntry.active) handleInitialsKey(e);
    // Allow space/enter for results navigation in 2P
    if (players.every(p => !p.alive) && (e.code === 'Space' || e.code === 'Enter')) {
      if (!globalInputPressed) { globalInputPressed = true; globalInputJustPressed = true; }
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (gameMode === '1P') {
    if (e.code === 'Space' || e.code === 'KeyA' || e.code === 'Enter') {
      if (players[0]) players[0].inputPressed = false;
    }
  } else {
    players.forEach((p, i) => {
      if (e.code === playerKeys[i].key) p.inputPressed = false;
    });
  }
  if (e.code === 'Space' || e.code === 'Enter') globalInputPressed = false;
});

// Mouse/touch
canvas.addEventListener('mousedown', (e) => {
  initAudio();
  if (state === STATE.TITLE || state === STATE.KEY_BIND) {
    if (!globalInputPressed) { globalInputPressed = true; globalInputJustPressed = true; }
    return;
  }
  if (gameMode === '1P') {
    const p = players[0];
    if (p && !p.inputPressed) { p.inputPressed = true; p.inputJustPressed = true; }
  } else {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * GW;
    const idx = mx < 480 ? 0 : 1;
    const p = players[idx];
    if (p && !p.inputPressed) { p.inputPressed = true; p.inputJustPressed = true; }
  }
});
canvas.addEventListener('mouseup', () => {
  players.forEach(p => { if (p) p.inputPressed = false; });
  globalInputPressed = false;
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); initAudio();
  if (state === STATE.TITLE || state === STATE.KEY_BIND) {
    if (!globalInputPressed) { globalInputPressed = true; globalInputJustPressed = true; }
    return;
  }
  if (gameMode === '1P') {
    const p = players[0];
    if (p && !p.inputPressed) { p.inputPressed = true; p.inputJustPressed = true; }
  } else {
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.changedTouches) {
      const mx = (touch.clientX - rect.left) / rect.width * GW;
      const idx = mx < 480 ? 0 : 1;
      const p = players[idx];
      if (p && !p.inputPressed) { p.inputPressed = true; p.inputJustPressed = true; }
    }
  }
}, { passive: false });
canvas.addEventListener('touchend', () => {
  players.forEach(p => { if (p) p.inputPressed = false; });
  globalInputPressed = false;
});

function handleInitialsKey(e) {
  const p = initialsEntry.pos;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    sfxSelect();
    const c = initialsEntry.chars[p].charCodeAt(0);
    initialsEntry.chars[p] = String.fromCharCode(c >= 90 ? 65 : c + 1);
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    sfxSelect();
    const c = initialsEntry.chars[p].charCodeAt(0);
    initialsEntry.chars[p] = String.fromCharCode(c <= 65 ? 90 : c - 1);
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    if (p < 2) { initialsEntry.pos++; sfxSelect(); }
  } else if (e.code === 'ArrowLeft') {
    if (p > 0) { initialsEntry.pos--; sfxSelect(); }
  }
}

// ── Background clouds ─────────────────────────────────────────────
function initBgClouds() {
  bgClouds = [];
  for (let i = 0; i < 8; i++) {
    bgClouds.push({ x: Math.random() * GW, y: 40 + Math.random() * 200, w: 60 + Math.random() * 120, speed: 0.2 + Math.random() * 0.5, opacity: 0.15 + Math.random() * 0.25 });
  }
}
function initTitleClouds() {
  titleClouds = [];
  for (let i = 0; i < 12; i++) {
    titleClouds.push({ x: Math.random() * GW, y: Math.random() * GH, w: 40 + Math.random() * 100, speed: 0.1 + Math.random() * 0.4, opacity: 0.08 + Math.random() * 0.15 });
  }
}

// ── Particle helpers (per-player) ─────────────────────────────────
function spawnImpactP(p, x, y, count = 10, color = WHITE) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    p.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 1, size: 2 + Math.random() * 4, color, type: 'square' });
  }
}
function spawnStarsP(p, x, y, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    p.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3, life: 1, size: 3 + Math.random() * 5, color: [GOLD, WHITE, '#FFE44D', C9_LIGHT][Math.floor(Math.random() * 4)], type: 'star' });
  }
}
function spawnTrailP(p, x, y) {
  p.particles.push({ x: x + (Math.random() - 0.5) * 14, y: y + Math.random() * 5, vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.8 + 0.3, life: 0.5, size: 2 + Math.random() * 3, color: [C9_LIGHT, C9_BLUE, WHITE][Math.floor(Math.random() * 3)], type: 'star' });
}
function spawnCloud9BurstP(p, x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    p.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.5, size: 4 + Math.random() * 8, color: [C9_BLUE, C9_LIGHT, GOLD, WHITE, PERFECT_GREEN][Math.floor(Math.random() * 5)], type: 'star' });
  }
}
function spawnRingBurstP(p, x, y) {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 / 16) * i;
    const speed = 4 + Math.random() * 2;
    p.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.7, size: 3, color: C9_LIGHT, type: 'circle' });
  }
}
function spawnSpeedLinesP(p, count = 5) {
  const vw = getVW();
  for (let i = 0; i < count; i++) {
    p.phaseSpeedLines.push({ x: Math.random() * vw, y: -20 - Math.random() * 40, len: 30 + Math.random() * 80, speed: 15 + Math.random() * 25, opacity: 0.3 + Math.random() * 0.5, width: 1 + Math.random() * 2 });
  }
}
function addFloatingTextP(p, x, y, text, color = WHITE, size = 28) {
  p.floatingTexts.push({ x, y, text, color, size, life: 1.2, vy: -2.5, scale: 1.5 });
}

// ── Scoring ───────────────────────────────────────────────────────
function getPhase() {
  if (!players.length) return 1;
  if (gameMode === '2P') {
    const totalCombo = players.reduce((sum, p) => sum + p.combo, 0);
    return Math.floor(totalCombo / 9) + 1;
  }
  return Math.floor(players[0].combo / 9) + 1;
}
function getActivationDist(combo) {
  return Math.max(MIN_ACTIVATION_DIST, BASE_ACTIVATION_DIST - combo * ACTIVATION_DECREASE);
}
function calculateScore(isPerfect) {
  const phaseMult = phase;
  const accuracyBonus = isPerfect ? 2.0 : 1.0;
  return Math.floor(100 * phaseMult * accuracyBonus);
}

// ── Procedural drawing: Player ────────────────────────────────────
function drawPlayer(x, y, expression = 'happy', rot = 0, scale = 1, pose = 'idle', stretchX = 1, stretchY = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale * stretchX, scale * stretchY);
  const P = 3;
  const ox = -7 * P;
  const oy = -22 * P;
  function px(gx, gy, gw, gh, color) {
    ctx.fillStyle = color;
    ctx.fillRect(ox + gx * P, oy + gy * P, gw * P, gh * P);
  }
  const SKIN = '#FFD5A8';
  const HAIR = '#2a1a0a';
  const JERSEY = C9_BLUE;
  const SHORTS = '#005a8c';
  const SHOE = '#EEEEEE';
  const EYE = '#222';

  px(4, 0, 6, 1, HAIR); px(3, 1, 8, 2, HAIR); px(3, 2, 1, 1, HAIR); px(10, 2, 1, 1, HAIR);
  if (pose === 'jump_up') { px(3, 0, 1, 1, HAIR); px(11, 0, 1, 1, HAIR); px(4, -1, 6, 1, HAIR); }
  px(3, 3, 8, 6, SKIN); px(2, 4, 1, 2, SKIN); px(11, 4, 1, 2, SKIN);
  if (expression === 'happy') {
    px(4, 5, 2, 2, EYE); px(8, 5, 2, 2, EYE); px(5, 5, 1, 1, '#666'); px(9, 5, 1, 1, '#666');
    px(5, 7, 1, 1, '#cc6644'); px(8, 7, 1, 1, '#cc6644'); px(6, 8, 2, 1, '#cc6644');
  } else if (expression === 'determined') {
    px(4, 5, 2, 2, EYE); px(8, 5, 2, 2, EYE);
    px(3, 4, 1, 1, EYE); px(4, 3, 2, 1, EYE); px(10, 4, 1, 1, EYE); px(8, 3, 2, 1, EYE);
    px(5, 8, 4, 1, '#cc6644');
  } else if (expression === 'sad') {
    px(4, 6, 2, 1, '#555'); px(8, 6, 2, 1, '#555');
    px(4, 4, 1, 1, '#555'); px(5, 3, 1, 1, '#555'); px(9, 4, 1, 1, '#555'); px(8, 3, 1, 1, '#555');
    px(6, 7, 2, 1, '#aa7766'); px(5, 8, 1, 1, '#aa7766'); px(8, 8, 1, 1, '#aa7766');
  } else if (expression === 'excited') {
    px(4, 5, 2, 2, EYE); px(8, 5, 2, 2, EYE); px(5, 5, 1, 1, WHITE); px(9, 5, 1, 1, WHITE);
    px(4, 8, 1, 1, '#cc6644'); px(5, 8, 4, 1, '#cc6644'); px(9, 8, 1, 1, '#cc6644'); px(5, 7, 4, 1, '#ffaaaa');
    px(3, 7, 1, 1, '#ffaaaa'); px(10, 7, 1, 1, '#ffaaaa');
  }
  if (expression === 'happy' || expression === 'determined') { px(3, 7, 1, 1, '#ffccaa'); px(10, 7, 1, 1, '#ffccaa'); }
  px(6, 9, 2, 1, SKIN);
  px(2, 10, 10, 5, JERSEY); px(5, 10, 4, 1, WHITE); px(2, 10, 1, 2, '#007ac0'); px(11, 10, 1, 2, '#007ac0');
  px(6, 11, 2, 1, WHITE); px(5, 11, 1, 2, WHITE); px(8, 11, 1, 2, WHITE); px(6, 12, 2, 1, WHITE); px(8, 13, 1, 1, WHITE); px(6, 14, 2, 1, WHITE); px(5, 14, 1, 1, WHITE);
  if (pose === 'jump_up') { px(1, 7, 2, 3, SKIN); px(11, 7, 2, 3, SKIN); px(1, 6, 2, 1, SKIN); px(11, 6, 2, 1, SKIN); }
  else if (pose === 'fall') { px(-1, 10, 2, 2, SKIN); px(13, 10, 2, 2, SKIN); px(-2, 9, 2, 1, SKIN); px(14, 9, 2, 1, SKIN); }
  else if (pose === 'stomp') { px(1, 14, 2, 3, SKIN); px(11, 14, 2, 3, SKIN); px(1, 17, 2, 1, SKIN); px(11, 17, 2, 1, SKIN); }
  else if (pose === 'bounce') { px(-1, 9, 2, 2, SKIN); px(13, 9, 2, 2, SKIN); px(-2, 8, 2, 1, SKIN); px(14, 8, 2, 1, SKIN); }
  else { px(0, 11, 2, 3, SKIN); px(12, 11, 2, 3, SKIN); px(0, 14, 2, 1, SKIN); px(12, 14, 2, 1, SKIN); }
  px(3, 15, 4, 2, SHORTS); px(7, 15, 4, 2, SHORTS);
  if (pose === 'jump_up') { px(4, 16, 2, 2, SKIN); px(8, 16, 2, 2, SKIN); px(3, 18, 3, 2, SHOE); px(8, 18, 3, 2, SHOE); px(3, 18, 3, 1, C9_LIGHT); px(8, 18, 3, 1, C9_LIGHT); }
  else if (pose === 'fall') { px(5, 17, 2, 2, SKIN); px(7, 17, 2, 2, SKIN); px(4, 19, 3, 2, SHOE); px(7, 19, 3, 2, SHOE); px(4, 19, 3, 1, C9_LIGHT); px(7, 19, 3, 1, C9_LIGHT); }
  else if (pose === 'stomp') { px(3, 17, 2, 2, SKIN); px(9, 17, 2, 2, SKIN); px(2, 19, 3, 2, SHOE); px(9, 19, 3, 2, SHOE); px(2, 19, 3, 1, C9_LIGHT); px(9, 19, 3, 1, C9_LIGHT); }
  else if (pose === 'bounce') { px(5, 17, 2, 2, SKIN); px(7, 17, 2, 2, SKIN); px(4, 19, 3, 2, SHOE); px(7, 19, 3, 2, SHOE); px(4, 19, 3, 1, C9_LIGHT); px(7, 19, 3, 1, C9_LIGHT); }
  else { px(4, 17, 2, 2, SKIN); px(8, 17, 2, 2, SKIN); px(3, 19, 3, 2, SHOE); px(8, 19, 3, 2, SHOE); px(3, 19, 3, 1, C9_LIGHT); px(8, 19, 3, 1, C9_LIGHT); }
  ctx.shadowColor = 'rgba(0, 158, 226, 0.0)';
  const glowGrad = ctx.createRadialGradient(0, -10 * P, 5, 0, -10 * P, 40);
  glowGrad.addColorStop(0, 'rgba(0, 158, 226, 0.12)'); glowGrad.addColorStop(1, 'rgba(0, 158, 226, 0)');
  ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(0, -10 * P, 40, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Procedural drawing: Storm Puff (enemy) ────────────────────────
function drawStormPuff(x, y, type = 0, squish = 0, flash = 0) {
  ctx.save(); ctx.translate(x, y);
  const squishScale = 1 - squish * 0.25;
  ctx.scale(1 + squish * 0.15, squishScale);
  const colors = [
    { body: '#b8b8c8', dark: '#8888a0', eye: '#555' },
    { body: '#707088', dark: '#505068', eye: '#ffcc00' },
    { body: '#6a4c93', dark: '#4a2c73', eye: '#ff44ff' },
    { body: '#2a2a3a', dark: '#1a1a2a', eye: '#ff4444' },
    { body: '#1a0a2e', dark: '#0a0018', eye: '#ff0000' },
  ];
  const c = colors[Math.min(type, colors.length - 1)];
  if (flash > 0.3) ctx.fillStyle = WHITE; else ctx.fillStyle = c.body;
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 20, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (flash <= 0.3) ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.arc(0, -5, 25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-20, -2, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -2, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-10, -20, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -18, 15, 0, Math.PI * 2); ctx.fill();
  if (flash <= 0.3) ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.ellipse(0, 10, 30, 10, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = c.eye;
  ctx.beginPath(); ctx.arc(-10, -6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c.eye; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-16, -14); ctx.lineTo(-6, -12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -14); ctx.lineTo(6, -12); ctx.stroke();
  ctx.strokeStyle = c.eye; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 6, 7, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
  if (type >= 1) {
    ctx.strokeStyle = c.eye; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-12, 4); ctx.lineTo(-8, 2); ctx.lineTo(-10, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(12, 4); ctx.lineTo(8, 2); ctx.lineTo(10, 8); ctx.stroke();
  }
  if (type >= 2) {
    ctx.save(); ctx.globalAlpha = 0.2 + Math.sin(performance.now() * 0.005) * 0.1;
    const auraGrad = ctx.createRadialGradient(0, -5, 20, 0, -5, 50);
    auraGrad.addColorStop(0, 'rgba(106, 76, 147, 0.3)'); auraGrad.addColorStop(1, 'rgba(106, 76, 147, 0)');
    ctx.fillStyle = auraGrad; ctx.beginPath(); ctx.arc(0, -5, 50, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (type >= 3) {
    ctx.strokeStyle = '#ffff44'; ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.01) * 0.3;
    for (let i = 0; i < 3; i++) {
      const angle = (performance.now() * 0.002 + i * 2.1) % (Math.PI * 2);
      const bx = Math.cos(angle) * 35; const by = Math.sin(angle) * 25 - 5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by + 8); ctx.lineTo(bx - 2, by + 6); ctx.lineTo(bx + 2, by + 14); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ── Background rendering ──────────────────────────────────────────
function hexToRgb(hex) { const r = parseInt(hex.slice(1,3),16); const g = parseInt(hex.slice(3,5),16); const b = parseInt(hex.slice(5,7),16); return [r,g,b]; }
function rgbToHex(r,g,b) { return '#' + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join(''); }
function lerpColor(a,b,t) { const ca = hexToRgb(a), cb = hexToRgb(b); return rgbToHex(ca[0]+(cb[0]-ca[0])*t, ca[1]+(cb[1]-ca[1])*t, ca[2]+(cb[2]-ca[2])*t); }

function drawBackground(dt, vw) {
  currentSky.top = lerpColor(currentSky.top, targetSky.top, dt * 2);
  currentSky.bot = lerpColor(currentSky.bot, targetSky.bot, dt * 2);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, currentSky.top); skyGrad.addColorStop(1, currentSky.bot);
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, vw, GH);
  const cloudSpeedMult = 1 + (phase - 1) * 0.3;
  bgClouds.forEach(c => {
    c.x -= c.speed * cloudSpeedMult;
    if (c.x + c.w < -50) { c.x = GW + 50; c.y = 40 + Math.random() * 200; }
    ctx.save(); ctx.globalAlpha = c.opacity; ctx.fillStyle = WHITE;
    const cx = c.x, cy = c.y, w = c.w;
    ctx.beginPath();
    ctx.arc(cx, cy, w*0.2, 0, Math.PI*2); ctx.arc(cx-w*0.2, cy+2, w*0.15, 0, Math.PI*2);
    ctx.arc(cx+w*0.2, cy+2, w*0.15, 0, Math.PI*2); ctx.arc(cx-w*0.1, cy-w*0.08, w*0.12, 0, Math.PI*2);
    ctx.arc(cx+w*0.12, cy-w*0.06, w*0.11, 0, Math.PI*2); ctx.fill(); ctx.restore();
  });
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 20, 0, GH);
  groundGrad.addColorStop(0, 'rgba(255,255,255,0.08)'); groundGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = groundGrad; ctx.fillRect(0, GROUND_Y - 20, vw, GH - GROUND_Y + 20);
  if (phase >= 4 && Math.random() < 0.005) phaseTransitionFlash = 0.3;
}

// ── Drawing helpers ───────────────────────────────────────────────
function drawStrokedText(text, x, y, color, size, strokeColor = '#000', strokeWidth = 4) {
  ctx.font = `${size}px 'Luckiest Guy', Impact, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = strokeWidth; ctx.strokeStyle = strokeColor; ctx.fillStyle = color;
  ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
}
function drawStar(x, y, r, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath(); ctx.fill();
}

function drawActionRing(p, x, y) {
  if (!p.ringActive) return;
  const outerR = 45; const innerR = 16;
  let progress = p.ringProgress;
  if (phase >= 6) {
    const pulseIntensity = Math.min(0.08, 0.03 + (phase - 6) * 0.008);
    p.ringPulsePhase += 0.15 + (phase - 6) * 0.03;
    progress = p.ringProgress + Math.sin(p.ringPulsePhase) * pulseIntensity;
    progress = Math.max(0, Math.min(1, progress));
  }
  const currentR = outerR - (outerR - innerR) * progress;
  let wobX = 0, wobY = 0;
  if (phase >= 5) {
    const wobIntensity = Math.min(8, 3 + (phase - 5) * 0.8);
    p.ringWobble += 0.12 + (phase - 5) * 0.02;
    wobX = Math.sin(p.ringWobble) * wobIntensity; wobY = Math.cos(p.ringWobble * 1.3) * wobIntensity;
  }
  const rx = x + wobX; const ry = y + wobY;
  ctx.beginPath(); ctx.arc(rx, ry, innerR + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  const inPerfect = p.ringProgress >= 0.72 && p.ringProgress <= 0.97;
  const inGood = p.ringProgress >= 0.55 && p.ringProgress <= 1.0;
  let ringColor = C9_LIGHT;
  if (inPerfect) ringColor = PERFECT_GREEN;
  else if (inGood) ringColor = GOLD;
  else if (p.ringProgress > 0.97) ringColor = MISS_RED;
  ctx.beginPath(); ctx.arc(rx, ry, currentR, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor; ctx.lineWidth = 4; ctx.stroke();
  if (inGood) {
    ctx.beginPath(); ctx.arc(rx, ry, currentR, 0, Math.PI * 2);
    ctx.strokeStyle = inPerfect ? 'rgba(61, 245, 61, 0.35)' : 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 12; ctx.stroke();
  }
  const label = (gameMode === '1P') ? 'SPACE' : p.keyLabel;
  ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.01) * 0.3;
  drawStrokedText(label, rx, ry - outerR - 14, WHITE, 13, '#000', 2); ctx.restore();
}

// ── Game flow ─────────────────────────────────────────────────────
function startGame() {
  const vw = getVW();
  const numPlayers = gameMode === '2P' ? 2 : 1;
  players = [];
  for (let i = 0; i < numPlayers; i++) {
    const p = createPlayerState(i);
    p.nimbus.x = vw / 2; p.nimbus.y = GROUND_Y - 40;
    p.enemy.x = vw / 2; p.enemy.y = GROUND_Y;
    p.keyBinding = playerKeys[i].key;
    p.keyLabel = gameMode === '1P' ? 'SPACE' : playerKeys[i].label;
    players.push(p);
  }
  state = null;
  phase = 1;
  phaseTransitionFlash = 0;
  initialsEntry = { active: false, chars: ['A','A','A'], pos: 0 };
  initialsPlayerIndex = 0; initialsQueue = [];
  idleTimer = 0;
  showLeaderboardFromTitle = false;
  targetSky = { ...SKY_THEMES[0] };
  currentSky = { top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot };
  beatPulse = 0; rhythmBonusText = 0; lastStompOnBeat = false;
  initBgClouds();
  sfxStart();
  startMusic();
}

// ── Update ────────────────────────────────────────────────────────
function update(dt) {
  titleBounce += dt * 3;

  if (state === STATE.TITLE) {
    updateTitle(dt);
    globalInputJustPressed = false;
    return;
  }
  if (state === STATE.KEY_BIND) {
    globalInputJustPressed = false;
    return;
  }

  // Shared decay
  if (beatPulse > 0) beatPulse = Math.max(0, beatPulse - dt * 8);
  if (rhythmBonusText > 0) rhythmBonusText -= dt;
  if (phaseTransitionFlash > 0) phaseTransitionFlash -= dt * 2;

  // Update each player
  players.forEach(p => {
    if (p.alive || p.state === STATE.MISS_FALL || p.state === STATE.RESULTS) updatePlayer(p, dt);
  });

  // Update shared phase
  const newPhase = getPhase();
  if (newPhase !== phase) {
    phase = newPhase;
    const themeIdx = Math.min(phase - 1, SKY_THEMES.length - 1);
    targetSky = { ...SKY_THEMES[themeIdx] };
    players.forEach(p => { p.enemy.type = Math.min(phase - 1, 4); });
    updateMusicTempo();
    sfxPhaseUp();
  }

  // 2P combined results
  if (gameMode === '2P' && players.every(p => !p.alive)) {
    idleTimer += dt;
    if (initialsEntry.active && globalInputJustPressed) {
      if (initialsEntry.pos >= 2) {
        const pl = players[initialsPlayerIndex];
        const name = initialsEntry.chars.join('');
        addToLeaderboard(name, pl.score, pl.combo, phase);
        initialsEntry.active = false; sfxSelect();
        // Check if another player needs to enter
        if (initialsQueue.length > 0) {
          initialsPlayerIndex = initialsQueue.shift();
          initialsEntry.active = true; initialsEntry.chars = ['A','A','A']; initialsEntry.pos = 0;
        }
      } else { initialsEntry.pos++; sfxSelect(); }
    }
    if (!initialsEntry.active && idleTimer > 1.0 && globalInputJustPressed) state = STATE.TITLE;
    if (idleTimer > 30) state = STATE.TITLE;
  }

  globalInputJustPressed = false;
}

function updateTitle(dt) {
  titleClouds.forEach(c => { c.x -= c.speed; if (c.x + 100 < 0) c.x = GW + 50; });
  if (globalInputJustPressed && !showLeaderboardFromTitle) {
    if (titleSelection === 0) { gameMode = '1P'; startGame(); }
    else { gameMode = '2P'; state = STATE.KEY_BIND; keyBindingPhase = 1; }
  }
  if (globalInputJustPressed && showLeaderboardFromTitle) showLeaderboardFromTitle = false;
}

function updatePlayer(p, dt) {
  let effectiveDt = dt;
  if (p.timeSlowdown > 0) { p.timeSlowdown -= dt; effectiveDt = dt * 0.3; }
  p.stateTimer += effectiveDt;

  p.particles = p.particles.filter(pt => {
    pt.x += pt.vx * (p.timeSlowdown > 0 ? 0.3 : 1);
    pt.y += pt.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
    pt.vy += 0.12; pt.life -= dt * 1.8; return pt.life > 0;
  });
  p.floatingTexts = p.floatingTexts.filter(f => {
    f.y += f.vy; f.vy *= 0.97; f.life -= dt * 0.9;
    if (f.scale > 1) f.scale -= dt * 4; if (f.scale < 1) f.scale = 1;
    return f.life > 0;
  });
  if (p.screenShake.intensity > 0) {
    p.screenShake.intensity *= 0.85;
    p.screenShake.x = (Math.random() - 0.5) * p.screenShake.intensity;
    p.screenShake.y = (Math.random() - 0.5) * p.screenShake.intensity;
    if (p.screenShake.intensity < 0.3) { p.screenShake.x = 0; p.screenShake.y = 0; p.screenShake.intensity = 0; }
  }
  if (p.cloud9Overlay > 0) p.cloud9Overlay -= dt * 0.6;
  if (p.enemy.squish > 0) p.enemy.squish *= 0.9;
  if (p.enemy.flash > 0) p.enemy.flash -= dt * 4;

  const vw = getVW();

  switch (p.state) {
    case STATE.READY: {
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'idle';
      const readyProg = Math.min(1, p.stateTimer / 0.3);
      p.nimbus.stretchX = 1 + readyProg * 0.15; p.nimbus.stretchY = 1 - readyProg * 0.12;
      if (p.stateTimer > 0.3) { p.state = STATE.JUMP_UP; p.stateTimer = 0; p.nimbus.vy = -14; sfxJump(); }
      break;
    }
    case STATE.JUMP_UP: {
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'jump_up';
      const jumpSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(jumpSpeed * 0.012, 0.12);
      p.nimbus.stretchY = 1 + Math.min(jumpSpeed * 0.015, 0.15);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += 0.5;
      if (Math.random() < 0.4) spawnTrailP(p, p.nimbus.x, p.nimbus.y + 15);
      if (p.nimbus.vy >= 0) { p.state = STATE.FALL; p.stateTimer = 0; }
      break;
    }
    case STATE.FALL: {
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'fall';
      const fallSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(fallSpeed * 0.01, 0.1);
      p.nimbus.stretchY = 1 + Math.min(fallSpeed * 0.013, 0.13);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += 0.55;
      const stompY = p.enemy.y - 55;
      const actDist = getActivationDist(p.combo);
      if (!p.ringActive && p.nimbus.y > stompY - actDist) {
        p.ringActive = true; p.ringProgress = 0; p.ringActivationY = p.nimbus.y;
        p.ringStompY = stompY; p.actionPressed = false; p.actionResult = ''; p.ringPulsePhase = 0;
      }
      if (p.ringActive) {
        p.ringProgress = Math.max(0, Math.min(1, (p.nimbus.y - p.ringActivationY) / (p.ringStompY - p.ringActivationY)));
        if (p.inputJustPressed && !p.actionPressed) {
          p.actionPressed = true;
          const acc = p.ringProgress;
          const extraPhases = Math.max(0, phase - 5);
          const perfectLow = Math.min(0.88, 0.72 + extraPhases * 0.02);
          const goodLow = Math.min(0.75, 0.55 + extraPhases * 0.015);
          if (acc >= perfectLow && acc <= 0.97) p.actionResult = 'perfect';
          else if (acc >= goodLow && acc <= 1.0) p.actionResult = 'good';
          else p.actionResult = 'miss';
        }
        if (p.ringProgress >= 1 && !p.actionPressed) { p.actionResult = 'miss'; p.actionPressed = true; }
      }
      if (p.nimbus.y >= stompY) {
        p.nimbus.y = stompY; p.ringActive = false;
        if (p.actionResult === 'perfect' || p.actionResult === 'good') p.state = STATE.STOMP_HIT;
        else p.state = STATE.MISS_BOUNCE;
        p.stateTimer = 0;
      }
      break;
    }
    case STATE.STOMP_HIT: {
      const isPerfect = p.actionResult === 'perfect';
      let points = calculateScore(isPerfect);
      const rhythmAcc = getBeatAccuracy();
      lastStompOnBeat = rhythmAcc > 0;
      if (lastStompOnBeat) {
        const rhythmMult = 1 + rhythmAcc * 0.5;
        points = Math.floor(points * rhythmMult);
        rhythmBonusText = 1.2;
        playTone(1047, 0.08, 'sine', 0.1);
        setTimeout(() => playTone(1319, 0.06, 'sine', 0.08), 40);
      }
      p.score += points; p.combo++; p.bouncesSincePhase++;
      p.enemy.squish = 1; p.enemy.flash = 1;
      p.screenShake.intensity = isPerfect ? 12 : 8;
      sfxStomp();
      spawnImpactP(p, p.enemy.x, p.enemy.y - 20, isPerfect ? 15 : 8);
      spawnStarsP(p, p.enemy.x, p.enemy.y - 40, isPerfect ? 10 : 5);
      spawnRingBurstP(p, p.enemy.x, p.enemy.y - 30);
      addFloatingTextP(p, p.enemy.x + (Math.random() - 0.5) * 30, p.enemy.y - 70, `+${points}`, GOLD, 30);
      if (isPerfect) {
        addFloatingTextP(p, p.enemy.x + 50, p.enemy.y - 95, 'PERFECT!', PERFECT_GREEN, 26);
        sfxPerfect(); p.timeSlowdown = 0.15;
      } else {
        addFloatingTextP(p, p.enemy.x + 40, p.enemy.y - 90, 'GOOD!', C9_LIGHT, 22);
      }
      if (lastStompOnBeat) addFloatingTextP(p, p.enemy.x - 60, p.enemy.y - 130, 'RHYTHM!', '#FF88FF', 20);
      if (p.combo > 1) addFloatingTextP(p, p.enemy.x - 55, p.enemy.y - 105, `${p.combo}x`, WHITE, 20);

      // Cloud 9 bonus
      if (p.combo % 9 === 0 && p.combo > 0) {
        p.score += 900;
        addFloatingTextP(p, vw / 2, GH / 2 - 60, '+900 CLOUD 9!', GOLD, 36);
        sfxCloud9();
        spawnCloud9BurstP(p, vw / 2, GH / 2);
        p.cloud9Overlay = 2.0; p.cloud9Text = 'CLOUD 9!';
        phaseTransitionFlash = 0.5;

        // In 2P skip cinematic phase change, just update visuals
        if (gameMode === '2P') {
          // Phase is updated globally in update()
        } else {
          // 1P: cinematic phase change
          const newPhase = getPhase();
          if (newPhase !== phase) {
            phase = newPhase;
            const themeIdx = Math.min(phase - 1, SKY_THEMES.length - 1);
            targetSky = { ...SKY_THEMES[themeIdx] };
            p.enemy.type = Math.min(phase - 1, 4);
            sfxPhaseUp(); updateMusicTempo();
            p.state = STATE.PHASE_CHANGE; p.stateTimer = 0;
            p.phaseChangeStep = 0; p.phaseScrollOffset = 0;
            p.phaseOldEnemyY = p.enemy.y; p.phaseNewEnemyY = -100; p.phaseSpeedLines = [];
            p.nimbus.vy = 0; p.nimbus.expression = 'excited';
            break;
          }
        }
      }
      p.nimbus.expression = 'happy'; p.nimbus.pose = 'stomp';
      p.nimbus.stretchX = 1.2; p.nimbus.stretchY = 0.75;
      p.state = STATE.BOUNCE_UP; p.stateTimer = 0;
      p.nimbus.vy = -10 - Math.min(p.combo * 0.15, 3);
      if (isPerfect && lastStompOnBeat) { p.nimbus.isFlipping = true; p.nimbus.flipAngle = 0; }
      else { p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0; }
      sfxBounce();
      break;
    }
    case STATE.PHASE_CHANGE: {
      p.nimbus.expression = 'excited'; p.nimbus.pose = 'jump_up';
      p.nimbus.stretchX = 1; p.nimbus.stretchY = 1;
      p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0; p.nimbus.rotation = 0;
      const ENEMY_Y = p.enemy.y > 100 ? GROUND_Y : GROUND_Y;
      if (p.phaseChangeStep === 0) {
        const sinkProgress = Math.min(1, p.stateTimer / 0.5);
        const stompY = p.phaseOldEnemyY - 55;
        p.nimbus.y = stompY + sinkProgress * 55;
        p.enemy.squish = sinkProgress * 0.6;
        p.phaseOldEnemyY = GROUND_Y + sinkProgress * 300;
        p.enemy.y = p.phaseOldEnemyY;
        if (sinkProgress > 0.3 && Math.random() < 0.5) spawnImpactP(p, p.nimbus.x, p.nimbus.y, 2, C9_LIGHT);
        phaseTransitionFlash = Math.min(0.6, sinkProgress * 0.6);
        if (p.stateTimer >= 0.5) { p.phaseChangeStep = 1; p.stateTimer = 0; p.nimbus.y = GH + 50; sfxPhaseUp(); }
      } else if (p.phaseChangeStep === 1) {
        const launchProgress = Math.min(1, p.stateTimer / 0.7);
        const easeOut = 1 - Math.pow(1 - launchProgress, 3);
        spawnSpeedLinesP(p, 3);
        p.phaseSpeedLines = p.phaseSpeedLines.filter(l => { l.y += l.speed; return l.y < GH + 100; });
        p.phaseScrollOffset = easeOut * 400;
        p.nimbus.y = GH + 50 - easeOut * (GH + 50 - (GROUND_Y - 120));
        p.nimbus.rotation = 0;
        phaseTransitionFlash = 0.6 * (1 - launchProgress);
        if (p.stateTimer >= 0.7) { p.phaseChangeStep = 2; p.stateTimer = 0; p.phaseNewEnemyY = -80; p.phaseSpeedLines = []; }
      } else if (p.phaseChangeStep === 2) {
        const arriveProgress = Math.min(1, p.stateTimer / 0.6);
        const easeOut = 1 - Math.pow(1 - arriveProgress, 2);
        p.phaseNewEnemyY = -80 + easeOut * (GROUND_Y + 80);
        p.enemy.y = p.phaseNewEnemyY; p.enemy.squish = (1 - arriveProgress) * 0.3;
        p.nimbus.y = (GROUND_Y - 120) + easeOut * (GROUND_Y - 55 - (GROUND_Y - 120));
        p.phaseScrollOffset = 400 * (1 - easeOut);
        if (p.stateTimer >= 0.6) {
          p.enemy.y = GROUND_Y; p.enemy.squish = 0;
          p.nimbus.y = GROUND_Y - 110; p.nimbus.vy = -12;
          p.nimbus.expression = 'happy'; p.ringActive = false; p.ringProgress = 0;
          p.actionPressed = false; p.actionResult = ''; p.phaseScrollOffset = 0; p.phaseSpeedLines = [];
          p.state = STATE.BOUNCE_UP; p.stateTimer = 0; sfxBounce();
        }
      }
      break;
    }
    case STATE.BOUNCE_UP: {
      p.nimbus.expression = p.combo >= 18 ? 'excited' : 'happy';
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += 0.45;
      if (Math.random() < 0.3) spawnTrailP(p, p.nimbus.x, p.nimbus.y + 15);
      if (p.nimbus.isFlipping) {
        p.nimbus.pose = 'bounce'; p.nimbus.flipAngle += 0.06;
        const tiltProgress = Math.min(1, p.nimbus.flipAngle / 1.2);
        const tiltEase = Math.sin(tiltProgress * Math.PI);
        p.nimbus.rotation = tiltEase * 0.5;
        if (Math.random() < 0.3) {
          p.particles.push({ x: p.nimbus.x + (Math.random()-0.5)*16, y: p.nimbus.y + (Math.random()-0.5)*16, vx: (Math.random()-0.5)*0.8, vy: -0.5 - Math.random()*0.5, life: 0.5, size: 1.5 + Math.random()*2, color: '#FF88FF', type: 'star' });
        }
        if (p.nimbus.flipAngle >= 1.2) { p.nimbus.flipAngle = 0; p.nimbus.rotation = 0; p.nimbus.isFlipping = false; }
      } else { p.nimbus.pose = 'bounce'; p.nimbus.rotation = 0; }
      const bounceSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(bounceSpeed * 0.008, 0.08);
      p.nimbus.stretchY = 1 + Math.min(bounceSpeed * 0.01, 0.1);
      if (p.nimbus.vy >= 0) {
        p.state = STATE.FALL; p.stateTimer = 0;
        p.nimbus.rotation = 0; p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0;
        p.ringActive = false; p.ringProgress = 0; p.actionPressed = false; p.actionResult = '';
      }
      break;
    }
    case STATE.MISS_BOUNCE: {
      p.nimbus.expression = 'sad'; p.nimbus.pose = 'idle';
      p.nimbus.stretchX = 1; p.nimbus.stretchY = 1;
      p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0;
      if (gameMode === '1P') stopMusic();
      sfxMiss();
      addFloatingTextP(p, p.enemy.x, p.enemy.y - 80, 'MISS!', MISS_RED, 32);
      p.enemy.squish = 0.3; p.screenShake.intensity = 5;
      p.nimbus.vy = -6; p.state = STATE.MISS_FALL; p.stateTimer = 0;
      p.alive = false;
      break;
    }
    case STATE.MISS_FALL: {
      p.nimbus.expression = 'sad';
      p.nimbus.y += p.nimbus.vy; p.nimbus.vy += 0.6; p.nimbus.rotation += 0.08;
      if (p.nimbus.y >= GROUND_Y - 20) {
        p.nimbus.y = GROUND_Y - 20; p.nimbus.rotation = 0;
        p.state = STATE.RESULTS; p.stateTimer = 0;
        if (gameMode === '1P') {
          idleTimer = 0;
          if (p.score > 0 && isHighScore(p.score)) {
            initialsEntry.active = true; initialsEntry.chars = ['A','A','A']; initialsEntry.pos = 0;
          }
        } else {
          // 2P: check if both dead
          if (players.every(pl => !pl.alive)) {
            idleTimer = 0;
            stopMusic();
            // Build queue of players who qualify for leaderboard (winner first)
            const sorted = [...players].sort((a, b) => b.score - a.score);
            initialsQueue = sorted.filter(pl => pl.score > 0 && isHighScore(pl.score)).map(pl => pl.index);
            if (initialsQueue.length > 0) {
              initialsPlayerIndex = initialsQueue.shift();
              initialsEntry.active = true; initialsEntry.chars = ['A','A','A']; initialsEntry.pos = 0;
            }
          }
        }
      }
      break;
    }
    case STATE.RESULTS: {
      if (gameMode === '1P') {
        idleTimer += dt; p.nimbus.expression = 'sad';
        if (initialsEntry.active && p.inputJustPressed) {
          if (initialsEntry.pos >= 2) {
            const name = initialsEntry.chars.join('');
            addToLeaderboard(name, p.score, p.combo, phase);
            initialsEntry.active = false; sfxSelect();
          } else { initialsEntry.pos++; sfxSelect(); }
        }
        if (!initialsEntry.active && p.stateTimer > 1.0 && p.inputJustPressed) { state = STATE.TITLE; p.stateTimer = 0; }
        if (idleTimer > 30) { state = STATE.TITLE; p.stateTimer = 0; }
      }
      // 2P results handled in main update
      break;
    }
  }
  p.inputJustPressed = false;
}

// ── Draw ──────────────────────────────────────────────────────────
function draw(dt) {
  ctx.save();

  if (state === STATE.TITLE) {
    drawTitleScreen();
  } else if (state === STATE.KEY_BIND) {
    drawKeyBindScreen();
  } else {
    if (gameMode === '2P') {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 480, GH); ctx.clip();
      drawPlayerViewport(players[0], dt);
      ctx.restore();
      ctx.strokeStyle = WHITE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(480, 0); ctx.lineTo(480, GH); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(480, 0, 480, GH); ctx.clip();
      ctx.translate(480, 0);
      drawPlayerViewport(players[1], dt);
      ctx.restore();
      if (players.every(p => !p.alive)) draw2PResultsScreen();
    } else {
      const p = players[0];
      if (p) {
        ctx.translate(p.screenShake.x, p.screenShake.y);
        drawPlayerViewport(p, dt);
        if (p.state === STATE.RESULTS) drawResultsScreen(p);
      }
    }
  }

  if (phaseTransitionFlash > 0) {
    ctx.save(); ctx.globalAlpha = phaseTransitionFlash; ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, GW, GH); ctx.restore();
  }
  ctx.restore();
}

function drawPlayerViewport(p, dt) {
  const vw = getVW();
  ctx.save();
  if (gameMode === '2P') ctx.translate(p.screenShake.x, p.screenShake.y);

  drawBackground(dt, vw);

  // Draw enemy
  drawStormPuff(p.enemy.x, p.enemy.y, p.enemy.type, p.enemy.squish, p.enemy.flash);

  // Beat pulse ring
  if (musicPlaying && beatPulse > 0 && p.state !== STATE.PHASE_CHANGE) {
    ctx.save();
    const pulseR = 40 + (1 - beatPulse) * 25;
    ctx.globalAlpha = beatPulse * 0.4; ctx.strokeStyle = C9_LIGHT;
    ctx.lineWidth = 2 + beatPulse * 2;
    ctx.beginPath(); ctx.arc(p.enemy.x, p.enemy.y - 5, pulseR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Player shadow
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  const shadowScale = Math.max(0.3, 1 - (GROUND_Y - p.nimbus.y) / 300);
  ctx.beginPath(); ctx.ellipse(p.nimbus.x, GROUND_Y + 5, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  // Draw player
  const playerScale = 1 + (p.state === STATE.STOMP_HIT ? 0.12 : 0);
  drawPlayer(p.nimbus.x, p.nimbus.y, p.nimbus.expression, p.nimbus.rotation, playerScale, p.nimbus.pose, p.nimbus.stretchX, p.nimbus.stretchY);

  // Action ring
  if (p.ringActive) drawActionRing(p, p.enemy.x, p.enemy.y - 35);

  // Particles
  p.particles.forEach(pt => {
    ctx.save(); ctx.globalAlpha = Math.max(0, pt.life); ctx.fillStyle = pt.color;
    if (pt.type === 'star') drawStar(pt.x, pt.y, pt.size);
    else if (pt.type === 'circle') { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
    ctx.restore();
  });

  // Floating texts
  p.floatingTexts.forEach(f => {
    ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 2);
    const s = f.scale || 1; ctx.translate(f.x, f.y); ctx.scale(s, s);
    if (p.combo >= 18 && f.text.includes('x')) {
      const hue = (performance.now() * 0.3) % 360;
      drawStrokedText(f.text, 0, 0, `hsl(${hue}, 100%, 60%)`, f.size);
    } else drawStrokedText(f.text, 0, 0, f.color, f.size);
    ctx.restore();
  });

  // Cloud 9 overlay
  if (p.cloud9Overlay > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, p.cloud9Overlay * 0.8);
    const c9Scale = 1 + (2 - p.cloud9Overlay) * 0.3;
    ctx.translate(vw / 2, GH / 2 - 40); ctx.scale(c9Scale, c9Scale);
    drawStrokedText(p.cloud9Text, 0, 0, GOLD, gameMode === '2P' ? 40 : 60, '#5C2D00', 6);
    ctx.restore();
    if (p.cloud9Overlay > 1) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (p.cloud9Overlay - 1) * 2);
      drawStrokedText(`PHASE ${phase}`, vw / 2, GH / 2 + 20, C9_LIGHT, gameMode === '2P' ? 20 : 28, '#000', 3);
      ctx.restore();
    }
  }

  // HUD
  drawHUD(p, vw);

  // Phase change overlay
  if (p.state === STATE.PHASE_CHANGE) {
    if (p.phaseChangeStep === 1) {
      ctx.save();
      p.phaseSpeedLines.forEach(l => {
        ctx.globalAlpha = l.opacity; ctx.strokeStyle = WHITE; ctx.lineWidth = l.width;
        ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.len); ctx.stroke();
      });
      ctx.restore();
    }
    if (p.phaseChangeStep >= 1) {
      const textAlpha = p.phaseChangeStep === 1 ? Math.min(1, p.stateTimer / 0.3) : Math.max(0, 1 - p.stateTimer / 0.4);
      ctx.save(); ctx.globalAlpha = textAlpha;
      const c9Scale = 1 + Math.sin(performance.now() * 0.008) * 0.05;
      ctx.translate(vw / 2, GH / 2 - 40); ctx.scale(c9Scale, c9Scale);
      drawStrokedText('CLOUD 9!', 0, 0, GOLD, gameMode === '2P' ? 36 : 56, '#5C2D00', 6);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = textAlpha * 0.9;
      drawStrokedText(`PHASE ${phase}`, vw / 2, GH / 2 + 20, C9_LIGHT, gameMode === '2P' ? 22 : 30, '#000', 3);
      ctx.restore();
    }
  }

  // Speed lines during fall (phase 4+)
  if (p.state === STATE.FALL && phase >= 4) {
    const lineCount = Math.min(phase - 3, 4);
    for (let i = 0; i < lineCount; i++) {
      ctx.save(); ctx.globalAlpha = 0.15 + Math.random() * 0.15; ctx.strokeStyle = WHITE; ctx.lineWidth = 1;
      const lx = p.nimbus.x + (Math.random()-0.5)*120; const ly = p.nimbus.y - 30;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (Math.random()-0.5)*4, ly + 20 + Math.random()*30); ctx.stroke(); ctx.restore();
    }
  }

  // Screen pulse (phase 5+)
  if (phase >= 5 && p.state !== STATE.PHASE_CHANGE) {
    const pulse = Math.sin(performance.now() * 0.003) * 0.015;
    if (pulse > 0) { ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = C9_BLUE; ctx.fillRect(0, 0, vw, GH); ctx.restore(); }
  }

  // 2P: Game Over overlay on dead player's half
  if (gameMode === '2P' && !p.alive && p.state === STATE.RESULTS) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, vw, GH);
    drawStrokedText('GAME OVER', vw / 2, GH / 2 - 20, MISS_RED, 28, '#500', 3);
    drawStrokedText(`Score: ${p.score}`, vw / 2, GH / 2 + 15, GOLD, 20, '#000', 2);
    drawStrokedText(`Combo: ${p.combo}x`, vw / 2, GH / 2 + 40, WHITE, 16, '#000', 2);
    ctx.restore();
  }

  ctx.restore();
}

function drawHUD(p, vw) {
  if (p.state === STATE.RESULTS || p.state === STATE.READY) return;
  const fontSize = gameMode === '2P' ? 24 : 32;
  drawStrokedText(`${p.score}`, vw / 2, 35, WHITE, fontSize, '#000', 3);

  if (p.combo > 0) {
    const hudX = 65; const hudY = 45;
    const comboScale = 1 + Math.max(0, (1 - p.stateTimer * 5)) * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath();
    ctx.roundRect(hudX - 45, hudY - 22, 90, 44, 10); ctx.fill();
    ctx.strokeStyle = C9_BLUE; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(hudX, hudY - 6); ctx.scale(comboScale, comboScale);
    if (p.combo >= 18) { const hue = (performance.now() * 0.5) % 360; drawStrokedText(`${p.combo}`, 0, 0, `hsl(${hue}, 100%, 65%)`, 26, '#000', 3); }
    else drawStrokedText(`${p.combo}`, 0, 0, GOLD, 26, '#000', 3);
    ctx.restore();
    drawStrokedText('COMBO', hudX, hudY + 14, WHITE, 10, '#000', 2);
  }

  const phaseX = vw - 65; const phaseY = 45;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath();
  ctx.roundRect(phaseX - 45, phaseY - 22, 90, 44, 10); ctx.fill();
  ctx.strokeStyle = phase >= 3 ? '#ff66ff' : C9_LIGHT; ctx.lineWidth = 2; ctx.stroke();
  drawStrokedText(`${phase}`, phaseX, phaseY - 6, phase >= 4 ? MISS_RED : C9_LIGHT, 26, '#000', 3);
  drawStrokedText('PHASE', phaseX, phaseY + 14, WHITE, 10, '#000', 2);

  if (p.ringActive) {
    const barW = 100; const barH = 6;
    const barX = vw / 2 - barW / 2; const barY = 65;
    const windowPct = getActivationDist(p.combo) / BASE_ACTIVATION_DIST;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    const gradient = ctx.createLinearGradient(barX, 0, barX + barW * windowPct, 0);
    gradient.addColorStop(0, PERFECT_GREEN); gradient.addColorStop(0.5, GOLD); gradient.addColorStop(1, MISS_RED);
    ctx.fillStyle = gradient; ctx.fillRect(barX, barY, barW * windowPct, barH);
    drawStrokedText('TIMING', vw / 2, barY + 18, WHITE, 10, '#000', 2);
  }

  if (musicPlaying) {
    const dotY = GH - 22; const dotSpacing = 18;
    const startX = vw / 2 - dotSpacing * 1.5;
    const currentQuarter = musicBeat % 4;
    for (let i = 0; i < 4; i++) {
      const dx = startX + i * dotSpacing; const isActive = i === currentQuarter;
      const r = isActive ? 5 + beatPulse * 3 : 3;
      const alpha = isActive ? 0.6 + beatPulse * 0.4 : 0.25;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = isActive ? '#FF88FF' : WHITE;
      ctx.beginPath(); ctx.arc(dx, dotY, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  // Player label in 2P
  if (gameMode === '2P') {
    ctx.save(); ctx.globalAlpha = 0.5;
    drawStrokedText(`P${p.index + 1}`, vw / 2, GH - 8, C9_LIGHT, 12, '#000', 2);
    ctx.restore();
  }
}

function drawResultsScreen(p) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, GW, GH);
  const centerY = GH / 2 - 30;
  ctx.fillStyle = 'rgba(10, 10, 40, 0.9)'; ctx.strokeStyle = C9_BLUE; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(GW / 2 - 200, centerY - 110, 400, 260, 16); ctx.fill(); ctx.stroke();
  drawStrokedText('GAME OVER', GW / 2, centerY - 80, MISS_RED, 36, '#500', 4);
  drawStrokedText(`Score: ${p.score}`, GW / 2, centerY - 35, GOLD, 28, '#000', 3);
  drawStrokedText(`Combo: ${p.combo}`, GW / 2, centerY, WHITE, 22, '#000', 3);
  drawStrokedText(`Phase: ${phase}`, GW / 2, centerY + 30, C9_LIGHT, 22, '#000', 3);
  let rating = 'Try Again!'; let ratingColor = '#AAA';
  if (p.combo >= 36) { rating = 'STORM MASTER!'; ratingColor = '#ff44ff'; }
  else if (p.combo >= 27) { rating = 'THUNDERCLOUD!'; ratingColor = MISS_RED; }
  else if (p.combo >= 18) { rating = 'CLOUD LEGEND!'; ratingColor = GOLD; }
  else if (p.combo >= 9) { rating = 'CLOUD 9!'; ratingColor = PERFECT_GREEN; }
  else if (p.combo >= 5) { rating = 'Nice Bounce!'; ratingColor = C9_LIGHT; }
  else if (p.combo >= 2) { rating = 'Getting There!'; ratingColor = '#FFA500'; }
  drawStrokedText(rating, GW / 2, centerY + 65, ratingColor, 24, '#000', 3);

  if (initialsEntry.active) {
    drawStrokedText('ENTER YOUR INITIALS', GW / 2, centerY + 100, WHITE, 16, '#000', 2);
    const initY = centerY + 130;
    for (let i = 0; i < 3; i++) {
      const ix = GW / 2 + (i - 1) * 35;
      const isActive = i === initialsEntry.pos;
      const charColor = isActive ? GOLD : WHITE; const charSize = isActive ? 30 : 24;
      if (isActive) {
        ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
        drawStrokedText('\u25B2', ix, initY - 22, C9_LIGHT, 14, '#000', 2);
        drawStrokedText('\u25BC', ix, initY + 22, C9_LIGHT, 14, '#000', 2);
        ctx.restore();
      }
      drawStrokedText(initialsEntry.chars[i], ix, initY, charColor, charSize, '#000', 3);
      if (isActive) { ctx.fillStyle = GOLD; ctx.fillRect(ix - 12, initY + 14, 24, 3); }
    }
    drawStrokedText('\u2191\u2193 Change  \u2192/SPACE Confirm', GW / 2, initY + 45, '#888', 11, '#000', 2);
  } else {
    if (leaderboard.length > 0) {
      const lbY = centerY + 105;
      drawStrokedText('TOP SCORES', GW / 2, lbY, C9_LIGHT, 14, '#000', 2);
      const showCount = Math.min(3, leaderboard.length);
      for (let i = 0; i < showCount; i++) {
        const entry = leaderboard[i]; const ey = lbY + 20 + i * 18;
        const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : '\uD83E\uDD49';
        ctx.font = `14px 'Luckiest Guy', Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = WHITE;
        ctx.fillText(`${medal} ${entry.name} - ${entry.score}`, GW / 2, ey);
      }
    }
    if (p.stateTimer > 1.0) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
      ctx.save(); ctx.globalAlpha = alpha;
      drawStrokedText('Press SPACE to continue', GW / 2, centerY + 175, WHITE, 16, '#000', 2);
      ctx.restore();
    }
  }
}

function draw2PResultsScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, GW, GH);
  const p1 = players[0], p2 = players[1];
  const winner = p1.score >= p2.score ? 0 : 1;

  drawStrokedText('GAME OVER', GW / 2, 60, MISS_RED, 40, '#500', 5);

  // P1 stats (left)
  const lx = GW / 4; const rx = GW * 3 / 4;
  const p1Color = winner === 0 ? GOLD : WHITE;
  const p2Color = winner === 1 ? GOLD : WHITE;

  if (winner === 0) drawStrokedText('WINNER!', lx, 105, GOLD, 22, '#5C2D00', 3);
  drawStrokedText('P1', lx, 130, C9_LIGHT, 28, '#000', 3);
  drawStrokedText(`${p1.score}`, lx, 165, p1Color, 32, '#000', 3);
  drawStrokedText(`Combo: ${p1.combo}x`, lx, 200, WHITE, 18, '#000', 2);

  if (winner === 1) drawStrokedText('WINNER!', rx, 105, GOLD, 22, '#5C2D00', 3);
  drawStrokedText('P2', rx, 130, C9_LIGHT, 28, '#000', 3);
  drawStrokedText(`${p2.score}`, rx, 165, p2Color, 32, '#000', 3);
  drawStrokedText(`Combo: ${p2.combo}x`, rx, 200, WHITE, 18, '#000', 2);

  drawStrokedText(`Phase: ${phase}`, GW / 2, 240, C9_LIGHT, 20, '#000', 2);

  // VS divider
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(GW/2, 100); ctx.lineTo(GW/2, 220); ctx.stroke();
  drawStrokedText('VS', GW/2, 160, '#888', 16, '#000', 2);

  // Initials
  if (initialsEntry.active) {
    drawStrokedText(`P${initialsPlayerIndex + 1} - ENTER INITIALS`, GW / 2, 280, WHITE, 16, '#000', 2);
    const initY = 310;
    for (let i = 0; i < 3; i++) {
      const ix = GW / 2 + (i - 1) * 35;
      const isActive = i === initialsEntry.pos;
      const charColor = isActive ? GOLD : WHITE; const charSize = isActive ? 30 : 24;
      if (isActive) {
        ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
        drawStrokedText('\u25B2', ix, initY - 22, C9_LIGHT, 14, '#000', 2);
        drawStrokedText('\u25BC', ix, initY + 22, C9_LIGHT, 14, '#000', 2);
        ctx.restore();
      }
      drawStrokedText(initialsEntry.chars[i], ix, initY, charColor, charSize, '#000', 3);
      if (isActive) { ctx.fillStyle = GOLD; ctx.fillRect(ix - 12, initY + 14, 24, 3); }
    }
    drawStrokedText('\u2191\u2193 Change  \u2192/SPACE Confirm', GW / 2, initY + 45, '#888', 11, '#000', 2);
  } else {
    if (idleTimer > 1.0) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
      ctx.save(); ctx.globalAlpha = alpha;
      drawStrokedText('Press SPACE to continue', GW / 2, 320, WHITE, 18, '#000', 2);
      ctx.restore();
    }
  }
}

function drawTitleScreen() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, '#5BC8F5'); skyGrad.addColorStop(1, '#87CEEB');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, GW, GH);
  titleClouds.forEach(c => {
    ctx.save(); ctx.globalAlpha = c.opacity; ctx.fillStyle = WHITE;
    const cx = c.x, cy = c.y, w = c.w;
    ctx.beginPath(); ctx.arc(cx, cy, w*0.2, 0, Math.PI*2);
    ctx.arc(cx-w*0.2, cy+2, w*0.15, 0, Math.PI*2);
    ctx.arc(cx+w*0.2, cy+2, w*0.15, 0, Math.PI*2);
    ctx.arc(cx-w*0.1, cy-w*0.08, w*0.12, 0, Math.PI*2);
    ctx.fill(); ctx.restore();
  });

  if (showLeaderboardFromTitle) { drawLeaderboardScreen(); return; }

  const bounceY = 210 + Math.sin(titleBounce) * 12;
  drawPlayer(GW / 2 - 70, bounceY, 'excited', 0, 2.5);
  drawStormPuff(GW / 2 + 80, bounceY + 10, 0, 0, 0);

  const titleY = bounceY + 75;
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = C9_BLUE;
  ctx.beginPath(); ctx.arc(GW / 2, bounceY - 20, 120, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  drawStrokedText('CLOUD BOUNCE', GW / 2, titleY, GOLD, 52, '#5C2D00', 6);
  drawStrokedText('A Cloud9 Minigame', GW / 2, titleY + 40, C9_LIGHT, 22, '#003366', 3);

  // Mode selection
  const selY = titleY + 90;
  const opts = ['1 PLAYER', '2 PLAYERS'];
  for (let i = 0; i < 2; i++) {
    const ox = GW / 2 + (i === 0 ? -90 : 90);
    const selected = titleSelection === i;
    if (selected) {
      ctx.fillStyle = 'rgba(0, 158, 226, 0.3)'; ctx.beginPath();
      ctx.roundRect(ox - 70, selY - 18, 140, 36, 8); ctx.fill();
      ctx.strokeStyle = C9_BLUE; ctx.lineWidth = 2; ctx.stroke();
    }
    drawStrokedText(opts[i], ox, selY, selected ? WHITE : '#aaa', selected ? 22 : 18, '#000', 3);
  }
  ctx.save(); ctx.globalAlpha = 0.5;
  drawStrokedText('\u2190 \u2192 to select   SPACE to start', GW / 2, selY + 30, '#ccc', 13, '#000', 2);
  ctx.restore();

  drawStrokedText('Stomp the Storm Puffs!', GW / 2, GH - 70, WHITE, 16, '#000', 2);
  drawStrokedText('One miss and it\'s game over!', GW / 2, GH - 45, '#ffcccc', 14, '#000', 2);
  ctx.save(); ctx.globalAlpha = 0.6;
  drawStrokedText('Press L for Leaderboard', GW / 2, GH - 20, '#aaa', 12, '#000', 2);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.4;
  drawStrokedText('\u2601 CLOUD9', 70, 25, C9_BLUE, 16, '#000', 2);
  ctx.restore();
}

function drawKeyBindScreen() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, '#5BC8F5'); skyGrad.addColorStop(1, '#87CEEB');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, GW, GH);

  drawStrokedText('KEY BINDING', GW / 2, 120, GOLD, 40, '#5C2D00', 5);

  if (keyBindingPhase === 1) {
    drawStrokedText('PLAYER 1', GW / 2, 240, C9_LIGHT, 30, '#000', 3);
    const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
    ctx.save(); ctx.globalAlpha = alpha;
    drawStrokedText('Press your key...', GW / 2, 290, WHITE, 22, '#000', 3);
    ctx.restore();
  } else if (keyBindingPhase === 2) {
    drawStrokedText('PLAYER 1: ' + playerKeys[0].label, GW / 2, 220, PERFECT_GREEN, 24, '#000', 3);
    drawStrokedText('PLAYER 2', GW / 2, 310, C9_LIGHT, 30, '#000', 3);
    const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
    ctx.save(); ctx.globalAlpha = alpha;
    drawStrokedText('Press your key...', GW / 2, 360, WHITE, 22, '#000', 3);
    ctx.restore();
  }

  drawStrokedText('Each player needs a unique key', GW / 2, GH - 50, '#aaa', 14, '#000', 2);
}

function drawLeaderboardScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, GW, GH);
  drawStrokedText('LEADERBOARD', GW / 2, 60, GOLD, 40, '#5C2D00', 5);
  if (leaderboard.length === 0) {
    drawStrokedText('No scores yet!', GW / 2, GH / 2, '#888', 24, '#000', 3);
    drawStrokedText('Be the first to play!', GW / 2, GH / 2 + 35, '#666', 18, '#000', 2);
  } else {
    const hdrY = 105;
    ctx.font = `14px 'Luckiest Guy', Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = C9_LIGHT;
    ctx.fillText('RANK', 120, hdrY); ctx.fillText('NAME', 250, hdrY);
    ctx.fillText('SCORE', 420, hdrY); ctx.fillText('COMBO', 560, hdrY); ctx.fillText('PHASE', 700, hdrY);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, hdrY + 10); ctx.lineTo(GW - 80, hdrY + 10); ctx.stroke();
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i]; const ey = hdrY + 35 + i * 35;
      const rowColor = i === 0 ? GOLD : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : WHITE;
      drawStrokedText(`${i+1}`, 120, ey, rowColor, 20, '#000', 2);
      drawStrokedText(entry.name, 250, ey, rowColor, 20, '#000', 2);
      drawStrokedText(`${entry.score}`, 420, ey, rowColor, 20, '#000', 2);
      drawStrokedText(`${entry.combo}x`, 560, ey, rowColor, 20, '#000', 2);
      drawStrokedText(`${entry.phase}`, 700, ey, rowColor, 20, '#000', 2);
    }
  }
  const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
  ctx.save(); ctx.globalAlpha = alpha;
  drawStrokedText('Press SPACE to return', GW / 2, GH - 40, WHITE, 18, '#000', 2);
  ctx.restore();
}

// ── Resize ────────────────────────────────────────────────────────
function resize() {
  const aspect = GW / GH;
  const winAspect = window.innerWidth / window.innerHeight;
  let w, h;
  if (winAspect > aspect) { h = window.innerHeight; w = h * aspect; }
  else { w = window.innerWidth; h = w / aspect; }
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
}
window.addEventListener('resize', resize);

// ── Game loop ─────────────────────────────────────────────────────
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  update(dt); draw(dt);
  requestAnimationFrame(gameLoop);
}

// ── Init ──────────────────────────────────────────────────────────
loadLeaderboard();
initBgClouds();
initTitleClouds();
resize();
requestAnimationFrame(gameLoop);
