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
  return getRoundBPM(phase);
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
  TITLE: 0, KEY_BIND: 1,
  RUN_START: 2,
  READY: 3, JUMP_UP: 4, FALL: 5,
  STOMP_HIT: 6, BOUNCE_UP: 7,
  MISS: 8, MISS_FALL: 9,
  BOSS_DEFEATED: 10, ASCEND: 11,
  RESULTS: 12,
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
    nimbus: { x: 0, y: 0, vy: 0, vx: 0, expression: 'happy', rotation: 0, pose: 'idle', stretchX: 1, stretchY: 1, flipAngle: 0, isFlipping: false },
    // Cloud targets: array of { x, y, hp, maxHp, type, squish, flash, isBoss, scale, defeated }
    clouds: [], currentCloudIdx: 0,
    cameraX: 0, cameraTargetX: 0,
    combo: 0, score: 0, round: 1, bossHits: 0,
    // Running start
    runPlatform: [], runX: 0, runSpeed: 0, runAnimTimer: 0,
    // Stomp timing ring
    ringProgress: 0, ringActive: false, ringActivationY: 0, ringStompY: 0,
    actionPressed: false, actionResult: '',
    ringWobble: 0, ringPulsePhase: 0,
    // Particles / effects
    particles: [], floatingTexts: [],
    screenShake: { x: 0, y: 0, intensity: 0 },
    timeSlowdown: 0, cloud9Overlay: 0, cloud9Text: '',
    phaseSpeedLines: [],
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
    return Math.max(...players.map(p => p.round));
  }
  return players[0].round;
}
function getActivationDist(round) {
  const base = BASE_ACTIVATION_DIST - (round - 1) * 15;
  return Math.max(MIN_ACTIVATION_DIST, base);
}
function calculateScore(isPerfect, round) {
  const phaseMult = round || phase;
  const accuracyBonus = isPerfect ? 2.0 : 1.0;
  return Math.floor(100 * phaseMult * accuracyBonus);
}
function getRoundBPM(round) {
  if (round <= 1) return 85;
  if (round === 2) return 110;
  if (round === 3) return 145;
  if (round === 4) return 185;
  if (round === 5) return 230;
  return Math.min(300, 230 + (round - 5) * 12);
}
function getCloudCount(round) {
  return 4 + Math.min(round, 6);
}
function getCloudSpacing(round) {
  return Math.max(100, 180 - (round - 1) * 10);
}
// Jump velocity and gravity scale with round — big floaty jumps early, tighter later
function getJumpVelocity(round) {
  return -(18 - Math.min(round - 1, 6) * 0.8); // -18 at round 1, ~-13.2 at round 7+
}
function getBounceVelocity(round, combo) {
  const base = 14 - Math.min(round - 1, 6) * 0.6; // 14 at round 1, ~10.4 at round 7+
  return -(base + Math.min(combo * 0.12, 2));
}
function getGravity(round) {
  return 0.35 + Math.min(round - 1, 8) * 0.04; // 0.35 at round 1, 0.67 at round 9+
}
function getFallGravity(round) {
  return 0.40 + Math.min(round - 1, 8) * 0.04; // slightly heavier on the way down
}
function getBounceGravity(round) {
  return 0.30 + Math.min(round - 1, 8) * 0.035; // lighter bounce for more hang time
}

// ── Run platform generation (runway before stomp chain) ─────────
function generateRunPlatform(startX, round) {
  // Creates a series of connected flat clouds the player runs across
  const platform = [];
  const count = 4 + Math.min(round, 3); // more clouds at higher rounds
  const spacing = 50; // tight spacing — feels like a continuous path
  let cx = startX;
  const type = Math.min(round - 1, 4);
  for (let i = 0; i < count; i++) {
    platform.push({
      x: cx, y: GROUND_Y, scale: 0.9 + Math.random() * 0.2, type,
    });
    cx += spacing;
  }
  return platform;
}

// ── Cloud chain generation ───────────────────────────────────────
function generateCloudChain(startX, round) {
  const clouds = [];
  const count = getCloudCount(round);
  const spacing = getCloudSpacing(round);
  const type = Math.min(round - 1, 4);
  let cx = startX;
  // Platform clouds (1 HP each, no face)
  for (let i = 0; i < count; i++) {
    const yOff = (Math.random() - 0.5) * 40;
    clouds.push({
      x: cx, y: GROUND_Y + yOff, hp: 1, maxHp: 1,
      type, squish: 0, flash: 0,
      isBoss: false, scale: 0.8 + Math.random() * 0.3, defeated: false,
    });
    cx += spacing + Math.random() * 60;
  }
  // Boss cloud (9 HP, with face, bigger)
  cx += spacing * 0.5;
  const bossScale = gameMode === '2P' ? 1.8 : 2.5;
  clouds.push({
    x: cx, y: GROUND_Y, hp: 9, maxHp: 9,
    type, squish: 0, flash: 0,
    isBoss: true, scale: bossScale, defeated: false,
  });
  return clouds;
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
  else if (pose === 'run') {
    // Running arms: one forward, one back (alternating based on runFrame encoded in rotation)
    const runFrame = Math.floor(performance.now() / 120) % 2;
    if (runFrame === 0) { px(-1, 10, 2, 3, SKIN); px(13, 8, 2, 3, SKIN); } else { px(-1, 8, 2, 3, SKIN); px(13, 10, 2, 3, SKIN); }
  }
  else { px(0, 11, 2, 3, SKIN); px(12, 11, 2, 3, SKIN); px(0, 14, 2, 1, SKIN); px(12, 14, 2, 1, SKIN); }
  px(3, 15, 4, 2, SHORTS); px(7, 15, 4, 2, SHORTS);
  if (pose === 'jump_up') { px(4, 16, 2, 2, SKIN); px(8, 16, 2, 2, SKIN); px(3, 18, 3, 2, SHOE); px(8, 18, 3, 2, SHOE); px(3, 18, 3, 1, C9_LIGHT); px(8, 18, 3, 1, C9_LIGHT); }
  else if (pose === 'fall') { px(5, 17, 2, 2, SKIN); px(7, 17, 2, 2, SKIN); px(4, 19, 3, 2, SHOE); px(7, 19, 3, 2, SHOE); px(4, 19, 3, 1, C9_LIGHT); px(7, 19, 3, 1, C9_LIGHT); }
  else if (pose === 'stomp') { px(3, 17, 2, 2, SKIN); px(9, 17, 2, 2, SKIN); px(2, 19, 3, 2, SHOE); px(9, 19, 3, 2, SHOE); px(2, 19, 3, 1, C9_LIGHT); px(9, 19, 3, 1, C9_LIGHT); }
  else if (pose === 'bounce') { px(5, 17, 2, 2, SKIN); px(7, 17, 2, 2, SKIN); px(4, 19, 3, 2, SHOE); px(7, 19, 3, 2, SHOE); px(4, 19, 3, 1, C9_LIGHT); px(7, 19, 3, 1, C9_LIGHT); }
  else if (pose === 'run') {
    const runFrame = Math.floor(performance.now() / 120) % 2;
    if (runFrame === 0) {
      px(2, 17, 2, 2, SKIN); px(10, 17, 2, 2, SKIN);
      px(1, 19, 3, 2, SHOE); px(10, 19, 3, 2, SHOE);
      px(1, 19, 3, 1, C9_LIGHT); px(10, 19, 3, 1, C9_LIGHT);
    } else {
      px(5, 17, 2, 2, SKIN); px(7, 17, 2, 2, SKIN);
      px(5, 19, 3, 2, SHOE); px(6, 19, 3, 2, SHOE);
      px(5, 19, 3, 1, C9_LIGHT); px(6, 19, 3, 1, C9_LIGHT);
    }
  }
  else { px(4, 17, 2, 2, SKIN); px(8, 17, 2, 2, SKIN); px(3, 19, 3, 2, SHOE); px(8, 19, 3, 2, SHOE); px(3, 19, 3, 1, C9_LIGHT); px(8, 19, 3, 1, C9_LIGHT); }
  ctx.shadowColor = 'rgba(0, 158, 226, 0.0)';
  const glowGrad = ctx.createRadialGradient(0, -10 * P, 5, 0, -10 * P, 40);
  glowGrad.addColorStop(0, 'rgba(0, 158, 226, 0.12)'); glowGrad.addColorStop(1, 'rgba(0, 158, 226, 0)');
  ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(0, -10 * P, 40, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Procedural drawing: Cloud Puff (no face — same shape as Storm Puff) ──
function drawCloudPuff(x, y, type = 0, squish = 0, flash = 0, scale = 1) {
  ctx.save(); ctx.translate(x, y);
  const squishScale = 1 - squish * 0.25;
  ctx.scale((1 + squish * 0.15) * scale, squishScale * scale);
  const colors = [
    { body: '#d8d8e8', dark: '#a8a8c0' },
    { body: '#a0a0b8', dark: '#7878a0' },
    { body: '#9a7cc3', dark: '#7a5ca3' },
    { body: '#5a5a7a', dark: '#3a3a5a' },
    { body: '#3a2a5e', dark: '#2a1a3e' },
  ];
  const c = colors[Math.min(type, colors.length - 1)];
  if (flash > 0.3) ctx.fillStyle = WHITE; else ctx.fillStyle = c.body;
  // Shadow
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, 20, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // Cloud body — same circles as Storm Puff
  if (flash <= 0.3) ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.arc(0, -5, 25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-20, -2, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -2, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-10, -20, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -18, 15, 0, Math.PI * 2); ctx.fill();
  // Bottom
  if (flash <= 0.3) ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.ellipse(0, 10, 30, 10, 0, 0, Math.PI); ctx.fill();
  // No face! Just a subtle sheen
  ctx.save(); ctx.globalAlpha = 0.12;
  const sheen = ctx.createRadialGradient(-5, -15, 5, -5, -15, 25);
  sheen.addColorStop(0, WHITE); sheen.addColorStop(1, 'transparent');
  ctx.fillStyle = sheen; ctx.beginPath(); ctx.arc(-5, -15, 25, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ── Procedural drawing: Storm Puff (enemy / boss) ─────────────────
function drawStormPuff(x, y, type = 0, squish = 0, flash = 0, scale = 1) {
  ctx.save(); ctx.translate(x, y);
  const squishScale = 1 - squish * 0.25;
  ctx.scale((1 + squish * 0.15) * scale, squishScale * scale);
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
    p.round = 1;
    // Generate run platform first, then stomp chain starts after it
    p.runPlatform = generateRunPlatform(100, 1);
    const lastRunCloud = p.runPlatform[p.runPlatform.length - 1];
    const chainStartX = lastRunCloud.x + 180; // gap between runway and first stomp target
    p.clouds = generateCloudChain(chainStartX, 1);
    p.currentCloudIdx = 0;
    p.cameraX = 0;
    p.cameraTargetX = 0;
    // Position player on first run platform cloud
    p.runX = p.runPlatform[0].x;
    p.nimbus.x = p.runX;
    p.nimbus.y = GROUND_Y - 40;
    p.runSpeed = 3 + Math.min(p.round * 0.5, 3);
    p.runAnimTimer = 0;
    p.keyBinding = playerKeys[i].key;
    p.keyLabel = gameMode === '1P' ? 'SPACE' : playerKeys[i].label;
    p.state = STATE.RUN_START;
    p.stateTimer = 0;
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
    if (p.alive || p.state === STATE.MISS_FALL || p.state === STATE.RESULTS || p.state === STATE.RUN_START) updatePlayer(p, dt);
  });

  // Update shared phase
  const newPhase = getPhase();
  if (newPhase !== phase) {
    phase = newPhase;
    const themeIdx = Math.min(phase - 1, SKY_THEMES.length - 1);
    targetSky = { ...SKY_THEMES[themeIdx] };
    updateMusicTempo();
  }

  // 2P combined results
  if (gameMode === '2P' && players.every(p => !p.alive)) {
    idleTimer += dt;
    if (initialsEntry.active && globalInputJustPressed) {
      if (initialsEntry.pos >= 2) {
        const pl = players[initialsPlayerIndex];
        const name = initialsEntry.chars.join('');
        addToLeaderboard(name, pl.score, pl.combo, pl.round);
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

function getCurrentCloud(p) {
  return p.clouds[p.currentCloudIdx] || null;
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

  // Update all cloud squish/flash
  p.clouds.forEach(c => {
    if (c.squish > 0) c.squish *= 0.9;
    if (c.flash > 0) c.flash -= dt * 4;
  });

  const vw = getVW();
  const cloud = getCurrentCloud(p);

  // Smooth camera pan toward current target
  if (cloud) {
    p.cameraTargetX = cloud.x - vw / 2;
  }
  p.cameraX += (p.cameraTargetX - p.cameraX) * Math.min(1, dt * 5);

  switch (p.state) {
    case STATE.RUN_START: {
      p.nimbus.expression = 'happy'; p.nimbus.pose = 'run';
      p.runAnimTimer += effectiveDt;
      // Auto-run right
      p.runX += p.runSpeed;
      p.nimbus.x = p.runX;
      p.nimbus.y = GROUND_Y - 40;
      // Subtle bob while running
      p.nimbus.y += Math.sin(p.runAnimTimer * 12) * 2;
      p.nimbus.stretchX = 1; p.nimbus.stretchY = 1;
      // Camera follows runner
      p.cameraTargetX = p.nimbus.x - vw * 0.35;
      p.cameraX += (p.cameraTargetX - p.cameraX) * Math.min(1, effectiveDt * 4);
      // Spawn subtle trail
      if (Math.random() < 0.25) spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 20);
      // Check if we've reached the end of the run platform → launch into first stomp
      const lastRunCloud = p.runPlatform[p.runPlatform.length - 1];
      if (lastRunCloud && p.runX >= lastRunCloud.x + 40) {
        // Jump off the runway edge toward first stomp cloud
        p.state = STATE.JUMP_UP; p.stateTimer = 0;
        p.nimbus.vy = getJumpVelocity(p.round);
        p.nimbus.expression = 'determined';
        sfxJump();
      }
      break;
    }
    case STATE.READY: {
      if (!cloud) break;
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'idle';
      p.nimbus.x = cloud.x;
      const readyProg = Math.min(1, p.stateTimer / 0.3);
      p.nimbus.stretchX = 1 + readyProg * 0.15; p.nimbus.stretchY = 1 - readyProg * 0.12;
      if (p.stateTimer > 0.3) {
        p.state = STATE.JUMP_UP; p.stateTimer = 0;
        p.nimbus.vy = getJumpVelocity(p.round);
        sfxJump();
      }
      break;
    }
    case STATE.JUMP_UP: {
      if (!cloud) break;
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'jump_up';
      // Arc toward the target cloud X
      const dx = cloud.x - p.nimbus.x;
      p.nimbus.x += dx * 0.04;
      const jumpSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(jumpSpeed * 0.012, 0.12);
      p.nimbus.stretchY = 1 + Math.min(jumpSpeed * 0.015, 0.15);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getGravity(p.round);
      if (Math.random() < 0.4) spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 15);
      if (p.nimbus.vy >= 0) { p.state = STATE.FALL; p.stateTimer = 0; }
      break;
    }
    case STATE.FALL: {
      if (!cloud) break;
      p.nimbus.expression = 'determined'; p.nimbus.pose = 'fall';
      // Arc toward target cloud X
      const dx = cloud.x - p.nimbus.x;
      p.nimbus.x += dx * 0.06;
      const fallSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(fallSpeed * 0.01, 0.1);
      p.nimbus.stretchY = 1 + Math.min(fallSpeed * 0.013, 0.13);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getFallGravity(p.round);
      const stompY = cloud.y - 55 * cloud.scale;
      const actDist = getActivationDist(p.round);
      if (!p.ringActive && p.nimbus.y > stompY - actDist) {
        p.ringActive = true; p.ringProgress = 0; p.ringActivationY = p.nimbus.y;
        p.ringStompY = stompY; p.actionPressed = false; p.actionResult = ''; p.ringPulsePhase = 0;
      }
      if (p.ringActive) {
        p.ringProgress = Math.max(0, Math.min(1, (p.nimbus.y - p.ringActivationY) / (p.ringStompY - p.ringActivationY)));
        if (p.inputJustPressed && !p.actionPressed) {
          p.actionPressed = true;
          const acc = p.ringProgress;
          const extraPhases = Math.max(0, p.round - 5);
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
        else p.state = STATE.MISS;
        p.stateTimer = 0;
      }
      break;
    }
    case STATE.STOMP_HIT: {
      if (!cloud) break;
      const isPerfect = p.actionResult === 'perfect';
      let points = calculateScore(isPerfect, p.round);
      const rhythmAcc = getBeatAccuracy();
      lastStompOnBeat = rhythmAcc > 0;
      if (lastStompOnBeat) {
        const rhythmMult = 1 + rhythmAcc * 0.5;
        points = Math.floor(points * rhythmMult);
        rhythmBonusText = 1.2;
        playTone(1047, 0.08, 'sine', 0.1);
        setTimeout(() => playTone(1319, 0.06, 'sine', 0.08), 40);
      }
      p.score += points; p.combo++;
      cloud.hp--;
      cloud.squish = 1; cloud.flash = 1;
      p.screenShake.intensity = isPerfect ? 12 : 8;
      sfxStomp();
      const drawX = cloud.x - p.cameraX;
      spawnImpactP(p, drawX, cloud.y - 20, isPerfect ? 15 : 8);
      spawnStarsP(p, drawX, cloud.y - 40, isPerfect ? 10 : 5);
      spawnRingBurstP(p, drawX, cloud.y - 30);
      addFloatingTextP(p, drawX + (Math.random() - 0.5) * 30, cloud.y - 70, `+${points}`, GOLD, 30);
      if (isPerfect) {
        addFloatingTextP(p, drawX + 50, cloud.y - 95, 'PERFECT!', PERFECT_GREEN, 26);
        sfxPerfect(); p.timeSlowdown = 0.15;
      } else {
        addFloatingTextP(p, drawX + 40, cloud.y - 90, 'GOOD!', C9_LIGHT, 22);
      }
      if (lastStompOnBeat) addFloatingTextP(p, drawX - 60, cloud.y - 130, 'RHYTHM!', '#FF88FF', 20);
      if (p.combo > 1) addFloatingTextP(p, drawX - 55, cloud.y - 105, `${p.combo}x`, WHITE, 20);

      // Cloud destroyed?
      if (cloud.hp <= 0) {
        cloud.defeated = true;
        if (cloud.isBoss) {
          // Boss defeated!
          p.bossHits = cloud.maxHp;
          p.score += 900;
          addFloatingTextP(p, vw / 2, GH / 2 - 60, '+900 CLOUD 9!', GOLD, 36);
          sfxCloud9();
          spawnCloud9BurstP(p, vw / 2, GH / 2);
          p.cloud9Overlay = 2.0; p.cloud9Text = 'CLOUD 9!';
          phaseTransitionFlash = 0.5;
          p.state = STATE.BOSS_DEFEATED; p.stateTimer = 0;
          break;
        }
        // Advance to next cloud
        p.currentCloudIdx++;
      }

      // Bounce up toward next cloud
      p.nimbus.expression = 'happy'; p.nimbus.pose = 'stomp';
      p.nimbus.stretchX = 1.2; p.nimbus.stretchY = 0.75;
      p.state = STATE.BOUNCE_UP; p.stateTimer = 0;
      p.nimbus.vy = getBounceVelocity(p.round, p.combo);
      if (isPerfect && lastStompOnBeat) { p.nimbus.isFlipping = true; p.nimbus.flipAngle = 0; }
      else { p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0; }
      sfxBounce();
      break;
    }
    case STATE.BOUNCE_UP: {
      p.nimbus.expression = p.combo >= 18 ? 'excited' : 'happy';
      // Drift toward next cloud target
      const nextCloud = getCurrentCloud(p);
      if (nextCloud) {
        const dx = nextCloud.x - p.nimbus.x;
        p.nimbus.x += dx * 0.03;
      }
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getBounceGravity(p.round);
      if (Math.random() < 0.3) spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 15);
      if (p.nimbus.isFlipping) {
        p.nimbus.pose = 'bounce'; p.nimbus.flipAngle += 0.06;
        const tiltProgress = Math.min(1, p.nimbus.flipAngle / 1.2);
        const tiltEase = Math.sin(tiltProgress * Math.PI);
        p.nimbus.rotation = tiltEase * 0.5;
        if (Math.random() < 0.3) {
          p.particles.push({ x: p.nimbus.x - p.cameraX + (Math.random()-0.5)*16, y: p.nimbus.y + (Math.random()-0.5)*16, vx: (Math.random()-0.5)*0.8, vy: -0.5 - Math.random()*0.5, life: 0.5, size: 1.5 + Math.random()*2, color: '#FF88FF', type: 'star' });
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
    case STATE.MISS: {
      if (!cloud) break;
      p.nimbus.expression = 'sad'; p.nimbus.pose = 'idle';
      p.nimbus.stretchX = 1; p.nimbus.stretchY = 1;
      p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0;
      if (gameMode === '1P') stopMusic();
      sfxMiss();
      const missDrawX = cloud.x - p.cameraX;
      addFloatingTextP(p, missDrawX, cloud.y - 80, 'MISS!', MISS_RED, 32);
      cloud.squish = 0.3; p.screenShake.intensity = 5;
      p.nimbus.vy = -6; p.state = STATE.MISS_FALL; p.stateTimer = 0;
      p.alive = false;
      break;
    }
    case STATE.MISS_FALL: {
      p.nimbus.expression = 'sad';
      p.nimbus.y += p.nimbus.vy; p.nimbus.vy += 0.6; p.nimbus.rotation += 0.08;
      if (p.nimbus.y >= GH + 50) {
        p.nimbus.rotation = 0;
        p.state = STATE.RESULTS; p.stateTimer = 0;
        if (gameMode === '1P') {
          idleTimer = 0;
          if (p.score > 0 && isHighScore(p.score)) {
            initialsEntry.active = true; initialsEntry.chars = ['A','A','A']; initialsEntry.pos = 0;
          }
        } else {
          if (players.every(pl => !pl.alive)) {
            idleTimer = 0;
            stopMusic();
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

    // ── BOSS DEFEATED + ASCEND ─────────────────────────────────
    case STATE.BOSS_DEFEATED: {
      const bossCloud = p.clouds[p.clouds.length - 1];
      p.nimbus.expression = 'excited'; p.nimbus.pose = 'bounce';
      const prog = Math.min(1, p.stateTimer / 2.0);
      if (bossCloud) {
        bossCloud.y = GROUND_Y + prog * 200;
        bossCloud.squish = prog * 0.5;
      }
      p.nimbus.y = GROUND_Y - 80 - Math.sin(prog * Math.PI) * 60;
      if (prog < 0.5 && Math.random() < 0.4) spawnStarsP(p, vw / 2, GH / 2, 2);
      if (p.stateTimer >= 2.0) {
        p.state = STATE.ASCEND; p.stateTimer = 0;
        p.phaseSpeedLines = [];
        sfxPhaseUp();
      }
      break;
    }
    case STATE.ASCEND: {
      p.nimbus.expression = 'excited'; p.nimbus.pose = 'jump_up';
      const prog = Math.min(1, p.stateTimer / 1.5);
      const easeOut = 1 - Math.pow(1 - prog, 3);
      // More speed lines for dramatic B&W effect
      const lineCount = prog < 0.4 ? 3 : prog < 0.8 ? 5 : 2;
      spawnSpeedLinesP(p, lineCount);
      p.phaseSpeedLines = p.phaseSpeedLines.filter(l => { l.y += l.speed; return l.y < GH + 100; });
      p.nimbus.y = GROUND_Y - 80 - easeOut * (GH + 100);
      // Subtle flash only at very start and end, not during B&W peak
      if (prog < 0.1 || prog > 0.9) phaseTransitionFlash = 0.3 * (prog < 0.1 ? 1 - prog * 10 : (prog - 0.9) * 10);
      if (p.stateTimer >= 1.5) {
        // Start new round
        p.round++;
        phase = getPhase();
        const themeIdx = Math.min(phase - 1, SKY_THEMES.length - 1);
        targetSky = { ...SKY_THEMES[themeIdx] };
        updateMusicTempo();
        // Generate new run platform + cloud chain
        const newCamBase = p.cameraX + vw * 0.35;
        p.runPlatform = generateRunPlatform(newCamBase, p.round);
        const lastRC = p.runPlatform[p.runPlatform.length - 1];
        p.clouds = generateCloudChain(lastRC.x + 180, p.round);
        p.currentCloudIdx = 0;
        p.bossHits = 0;
        p.runX = p.runPlatform[0].x;
        p.runSpeed = 3 + Math.min(p.round * 0.5, 3);
        p.runAnimTimer = 0;
        p.nimbus.x = p.runX;
        p.nimbus.y = GROUND_Y - 40;
        p.nimbus.vy = 0; p.nimbus.rotation = 0;
        p.nimbus.isFlipping = false; p.nimbus.flipAngle = 0;
        p.phaseSpeedLines = [];
        p.ringActive = false; p.ringProgress = 0;
        p.actionPressed = false; p.actionResult = '';
        p.state = STATE.RUN_START; p.stateTimer = 0;
      }
      break;
    }

    case STATE.RESULTS: {
      if (gameMode === '1P') {
        idleTimer += dt; p.nimbus.expression = 'sad';
        if (initialsEntry.active && p.inputJustPressed) {
          if (initialsEntry.pos >= 2) {
            const name = initialsEntry.chars.join('');
            addToLeaderboard(name, p.score, p.combo, p.round);
            initialsEntry.active = false; sfxSelect();
          } else { initialsEntry.pos++; sfxSelect(); }
        }
        if (!initialsEntry.active && p.stateTimer > 1.0 && p.inputJustPressed) { state = STATE.TITLE; p.stateTimer = 0; }
        if (idleTimer > 30) { state = STATE.TITLE; p.stateTimer = 0; }
      }
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

  const isGameplay = p.state !== STATE.RESULTS && p.state !== STATE.ASCEND;

  if (isGameplay || p.state === STATE.BOSS_DEFEATED) {
    // ── World-space: draw all clouds with camera ──
    ctx.save();
    ctx.translate(-p.cameraX, 0);

    // Draw run platform clouds (runway, no face, no HP)
    if (p.runPlatform && p.runPlatform.length > 0) {
      p.runPlatform.forEach(rc => {
        const screenX = rc.x - p.cameraX;
        if (screenX < -80 || screenX > vw + 80) return;
        drawCloudPuff(rc.x, rc.y, rc.type, 0, 0, rc.scale);
      });
    }

    // Draw all clouds
    p.clouds.forEach((cloud, i) => {
      const screenX = cloud.x - p.cameraX;
      if (screenX < -100 || screenX > vw + 100) return;
      if (cloud.defeated && !cloud.isBoss) return; // skip destroyed platform clouds

      if (cloud.isBoss) {
        // Boss: Storm Puff with face
        drawStormPuff(cloud.x, cloud.y, cloud.type, cloud.squish, cloud.flash, cloud.scale);
      } else {
        // Platform cloud: same shape, no face
        drawCloudPuff(cloud.x, cloud.y, cloud.type, cloud.squish, cloud.flash, cloud.scale);
      }

      // Beat pulse on current target
      if (i === p.currentCloudIdx && musicPlaying && beatPulse > 0) {
        ctx.save();
        const pulseR = 30 * cloud.scale + (1 - beatPulse) * 20;
        ctx.globalAlpha = beatPulse * 0.4; ctx.strokeStyle = C9_LIGHT;
        ctx.lineWidth = 2 + beatPulse * 2;
        ctx.beginPath(); ctx.arc(cloud.x, cloud.y - 5, pulseR, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // Health bar for boss (multi-HP)
      if (cloud.isBoss && cloud.hp < cloud.maxHp) {
        const barW = 120; const barH = 10;
        const barX = cloud.x - barW / 2;
        const barY = cloud.y - 65 * cloud.scale;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        const segW = barW / cloud.maxHp;
        for (let si = 0; si < cloud.maxHp; si++) {
          const sx = barX + si * segW;
          ctx.fillStyle = si < cloud.hp ? (cloud.hp <= 1 ? MISS_RED : cloud.hp <= 3 ? GOLD : PERFECT_GREEN) : 'rgba(100,100,100,0.4)';
          ctx.fillRect(sx + 1, barY, segW - 2, barH);
        }
      }

      // Boss expression warning
      if (cloud.isBoss && cloud.hp <= 1 && cloud.hp > 0) {
        ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.01) * 0.3;
        drawStrokedText('!!', cloud.x, cloud.y - 50 * cloud.scale, MISS_RED, 18, '#000', 2);
        ctx.restore();
      }
    });

    // Player shadow (world-space)
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
    const shadowScale = Math.max(0.3, 1 - (GROUND_Y - p.nimbus.y) / 300);
    ctx.beginPath(); ctx.ellipse(p.nimbus.x, GROUND_Y + 5, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // Draw player (world-space)
    const playerScale = 1 + (p.state === STATE.STOMP_HIT ? 0.12 : 0);
    drawPlayer(p.nimbus.x, p.nimbus.y, p.nimbus.expression, p.nimbus.rotation, playerScale, p.nimbus.pose, p.nimbus.stretchX, p.nimbus.stretchY);

    // Action ring (world-space, on current cloud)
    const cloud = getCurrentCloud(p);
    if (p.ringActive && cloud) {
      drawActionRing(p, cloud.x, cloud.y - 35 * cloud.scale);
    }

    ctx.restore(); // end camera transform

    // Speed lines during fall (higher rounds, screen-space)
    if (p.state === STATE.FALL && p.round >= 4) {
      const nimbusScreenX = p.nimbus.x - p.cameraX;
      const lineCount = Math.min(p.round - 3, 4);
      for (let i = 0; i < lineCount; i++) {
        ctx.save(); ctx.globalAlpha = 0.15 + Math.random() * 0.15; ctx.strokeStyle = WHITE; ctx.lineWidth = 1;
        const lx = nimbusScreenX + (Math.random()-0.5)*120; const ly = p.nimbus.y - 30;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (Math.random()-0.5)*4, ly + 20 + Math.random()*30); ctx.stroke(); ctx.restore();
      }
    }

    // "BOSS!" indicator when approaching boss cloud
    if (cloud && cloud.isBoss && p.state === STATE.BOUNCE_UP) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.008) * 0.3;
      ctx.save(); ctx.globalAlpha = alpha;
      const bScale = 1 + Math.sin(performance.now() * 0.008) * 0.08;
      ctx.translate(vw / 2, GH / 4); ctx.scale(bScale, bScale);
      drawStrokedText('BOSS!', 0, 0, MISS_RED, gameMode === '2P' ? 28 : 40, '#500', 4);
      ctx.restore();
    }

  } else if (p.state === STATE.ASCEND) {
    // ── Black & White Line-Art Ascension Effect ──
    const prog = Math.min(1, p.stateTimer / 1.5);

    // Phase 1 (0-0.4): desaturate to B&W
    // Phase 2 (0.4-0.8): full B&W with bold line-art outlines
    // Phase 3 (0.8-1.0): flash back to color

    const desatProg = Math.min(1, prog / 0.4); // 0→1 over first 40%
    const returnProg = prog > 0.8 ? (prog - 0.8) / 0.2 : 0; // 0→1 in last 20%
    const bwAmount = returnProg > 0 ? 1 - returnProg : desatProg;

    // Apply grayscale filter to canvas
    ctx.save();
    ctx.filter = `grayscale(${bwAmount * 100}%) contrast(${100 + bwAmount * 60}%)`;

    // Speed lines — thicker, more dramatic in B&W
    ctx.save();
    p.phaseSpeedLines.forEach(l => {
      const lineAlpha = l.opacity * (1 + bwAmount * 0.8);
      ctx.globalAlpha = Math.min(1, lineAlpha);
      ctx.strokeStyle = bwAmount > 0.5 ? '#000' : WHITE;
      ctx.lineWidth = l.width * (1 + bwAmount * 2);
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.len); ctx.stroke();
    });
    ctx.restore();

    // Draw player ascending
    drawPlayer(vw / 2, p.nimbus.y, p.nimbus.expression, p.nimbus.rotation, 1, p.nimbus.pose, p.nimbus.stretchX, p.nimbus.stretchY);

    ctx.restore(); // remove filter

    // Line-art overlay: bold outlines radiating from center during peak B&W
    if (bwAmount > 0.3) {
      const lineArtAlpha = Math.min(1, (bwAmount - 0.3) / 0.4);
      ctx.save();
      ctx.globalAlpha = lineArtAlpha * 0.6;

      // Radial burst lines from player position
      const cx = vw / 2; const cy = p.nimbus.y;
      const burstCount = 24;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 / burstCount) * i + prog * 2;
        const innerR = 30 + Math.sin(prog * 8 + i) * 10;
        const outerR = 150 + prog * 200 + Math.sin(prog * 6 + i * 0.7) * 40;
        ctx.strokeStyle = i % 2 === 0 ? '#000' : '#fff';
        ctx.lineWidth = 1.5 + Math.sin(prog * 10 + i) * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }

      // Concentric rings (line-art style)
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const radius = 60 + r * 80 + prog * 100;
        ctx.strokeStyle = r % 2 === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.restore();
    }

    // Cross-hatch / sketch texture overlay at peak B&W
    if (bwAmount > 0.6) {
      const hatchAlpha = (bwAmount - 0.6) / 0.4 * 0.12;
      ctx.save(); ctx.globalAlpha = hatchAlpha;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 40; i++) {
        const hx = Math.random() * vw; const hy = Math.random() * GH;
        const hLen = 15 + Math.random() * 25;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + hLen * 0.7, hy + hLen); ctx.stroke();
      }
      // Opposite diagonal hatching
      for (let i = 0; i < 20; i++) {
        const hx = Math.random() * vw; const hy = Math.random() * GH;
        const hLen = 10 + Math.random() * 20;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - hLen * 0.7, hy + hLen); ctx.stroke();
      }
      ctx.restore();
    }

    // Vignette darkening at edges during B&W phase
    if (bwAmount > 0.2) {
      ctx.save();
      const vigAlpha = (bwAmount - 0.2) * 0.5;
      const vig = ctx.createRadialGradient(vw / 2, GH / 2, vw * 0.2, vw / 2, GH / 2, vw * 0.7);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
      ctx.fillStyle = vig; ctx.fillRect(0, 0, vw, GH);
      ctx.restore();
    }

    // Ascend text — white on black during B&W, gold normally
    const textAlpha = Math.min(1, p.stateTimer / 0.3) * Math.max(0, 1 - (p.stateTimer - 1.0) / 0.5);
    ctx.save(); ctx.globalAlpha = Math.max(0, textAlpha);
    const textColor = bwAmount > 0.5 ? WHITE : GOLD;
    const strokeColor = bwAmount > 0.5 ? '#000' : '#5C2D00';
    drawStrokedText(`ROUND ${p.round + 1}`, vw / 2, GH / 2, textColor, gameMode === '2P' ? 32 : 48, strokeColor, 5);
    ctx.restore();
  }

  // Particles (screen-space)
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
      drawStrokedText(`ROUND ${p.round}`, vw / 2, GH / 2 + 20, C9_LIGHT, gameMode === '2P' ? 20 : 28, '#000', 3);
      ctx.restore();
    }
  }

  // HUD
  drawHUD(p, vw);

  // Screen pulse (higher rounds)
  if (p.round >= 5 && p.state !== STATE.ASCEND) {
    const pulse = Math.sin(performance.now() * 0.003) * 0.015;
    if (pulse > 0) { ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = C9_BLUE; ctx.fillRect(0, 0, vw, GH); ctx.restore(); }
  }

  // 2P: Game Over overlay
  if (gameMode === '2P' && !p.alive && p.state === STATE.RESULTS) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, vw, GH);
    drawStrokedText('GAME OVER', vw / 2, GH / 2 - 20, MISS_RED, 28, '#500', 3);
    drawStrokedText(`Score: ${p.score}`, vw / 2, GH / 2 + 15, GOLD, 20, '#000', 2);
    drawStrokedText(`Round: ${p.round}`, vw / 2, GH / 2 + 40, WHITE, 16, '#000', 2);
    ctx.restore();
  }

  ctx.restore();
}

function drawHUD(p, vw) {
  if (p.state === STATE.RESULTS) return;
  // During run start, show minimal HUD with "GO!" text
  if (p.state === STATE.RUN_START) {
    const fontSize = gameMode === '2P' ? 24 : 32;
    drawStrokedText(`${p.score}`, vw / 2, 35, WHITE, fontSize, '#000', 3);
    // "GO!" text that fades in and pulses
    if (p.stateTimer < 1.5) {
      const goAlpha = Math.min(1, p.stateTimer / 0.2) * Math.max(0, 1 - (p.stateTimer - 1.0) / 0.5);
      const goScale = 1 + Math.sin(p.stateTimer * 6) * 0.1;
      ctx.save(); ctx.globalAlpha = goAlpha;
      ctx.translate(vw / 2, GH / 2 - 40); ctx.scale(goScale, goScale);
      drawStrokedText(p.round > 1 ? `ROUND ${p.round}` : 'GO!', 0, 0, GOLD, gameMode === '2P' ? 36 : 48, '#5C2D00', 5);
      ctx.restore();
    }
    return;
  }
  const fontSize = gameMode === '2P' ? 24 : 32;
  drawStrokedText(`${p.score}`, vw / 2, 35, WHITE, fontSize, '#000', 3);

  // Combo
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

  // Round indicator
  const phaseX = vw - 65; const phaseY = 45;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath();
  ctx.roundRect(phaseX - 45, phaseY - 22, 90, 44, 10); ctx.fill();
  ctx.strokeStyle = p.round >= 3 ? '#ff66ff' : C9_LIGHT; ctx.lineWidth = 2; ctx.stroke();
  drawStrokedText(`${p.round}`, phaseX, phaseY - 6, p.round >= 4 ? MISS_RED : C9_LIGHT, 26, '#000', 3);
  drawStrokedText('ROUND', phaseX, phaseY + 14, WHITE, 10, '#000', 2);

  // Cloud progress (how many clouds stomped this round)
  const totalClouds = p.clouds.length;
  const stompedClouds = p.currentCloudIdx;
  if (totalClouds > 0 && p.state !== STATE.ASCEND && p.state !== STATE.BOSS_DEFEATED) {
    const progBarW = vw - 140; const progBarH = 4;
    const progBarX = 70; const progBarY = 72;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(progBarX, progBarY, progBarW, progBarH);
    const pct = stompedClouds / totalClouds;
    const gradBar = ctx.createLinearGradient(progBarX, 0, progBarX + progBarW * pct, 0);
    gradBar.addColorStop(0, C9_LIGHT); gradBar.addColorStop(1, GOLD);
    ctx.fillStyle = gradBar; ctx.fillRect(progBarX, progBarY, progBarW * pct, progBarH);
    // Boss marker at end
    ctx.fillStyle = MISS_RED; ctx.fillRect(progBarX + progBarW - 3, progBarY - 2, 6, progBarH + 4);
  }

  // Timing bar during stomp
  if (p.ringActive) {
    const barW = 100; const barH = 6;
    const barX = vw / 2 - barW / 2; const barY = 82;
    const windowPct = getActivationDist(p.round) / BASE_ACTIVATION_DIST;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    const gradient = ctx.createLinearGradient(barX, 0, barX + barW * windowPct, 0);
    gradient.addColorStop(0, PERFECT_GREEN); gradient.addColorStop(0.5, GOLD); gradient.addColorStop(1, MISS_RED);
    ctx.fillStyle = gradient; ctx.fillRect(barX, barY, barW * windowPct, barH);
    drawStrokedText('TIMING', vw / 2, barY + 18, WHITE, 10, '#000', 2);
  }

  // Beat dots
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
  drawStrokedText(`Round: ${p.round}`, GW / 2, centerY, WHITE, 22, '#000', 3);
  drawStrokedText(`Combo: ${p.combo}`, GW / 2, centerY + 30, C9_LIGHT, 22, '#000', 3);
  let rating = 'Try Again!'; let ratingColor = '#AAA';
  if (p.round >= 5) { rating = 'STORM MASTER!'; ratingColor = '#ff44ff'; }
  else if (p.round >= 4) { rating = 'THUNDERCLOUD!'; ratingColor = MISS_RED; }
  else if (p.round >= 3) { rating = 'CLOUD LEGEND!'; ratingColor = GOLD; }
  else if (p.round >= 2) { rating = 'CLOUD 9!'; ratingColor = PERFECT_GREEN; }
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
  drawStrokedText(`Round: ${p1.round}`, lx, 200, WHITE, 18, '#000', 2);

  if (winner === 1) drawStrokedText('WINNER!', rx, 105, GOLD, 22, '#5C2D00', 3);
  drawStrokedText('P2', rx, 130, C9_LIGHT, 28, '#000', 3);
  drawStrokedText(`${p2.score}`, rx, 165, p2Color, 32, '#000', 3);
  drawStrokedText(`Round: ${p2.round}`, rx, 200, WHITE, 18, '#000', 2);

  drawStrokedText(`Best Round: ${Math.max(p1.round, p2.round)}`, GW / 2, 240, C9_LIGHT, 20, '#000', 2);

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

  drawStrokedText('Bounce through clouds to the Boss!', GW / 2, GH - 70, WHITE, 16, '#000', 2);
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
    ctx.fillText('SCORE', 420, hdrY); ctx.fillText('COMBO', 560, hdrY); ctx.fillText('ROUND', 700, hdrY);
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
