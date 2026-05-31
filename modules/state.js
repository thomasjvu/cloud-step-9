// ═══════════════════════════════════════════════════════════════════
// State Module - Game state machine and global mutable state
// ═══════════════════════════════════════════════════════════════════

import { SKY_THEMES } from './constants.js';

export const STATE = {
  TITLE: 0,
  KEY_BIND: 1,
  RUN_START: 2,
  READY: 3,
  JUMP_UP: 4,
  FALL: 5,
  STOMP_HIT: 6,
  BOUNCE_UP: 7,
  MISS: 8,
  MISS_FALL: 9,
  BOSS_DEFEATED: 10,
  ASCEND: 11,
  RESULTS: 12,
  CHAR_SELECT: 13,
};

// ── Mutable global state ──────────────────────────────────────────
export let state = STATE.TITLE;
export let phase = 1;

// Character Selection State
export let charSelectStage = 0;
export let p1Char = 0;
export let p2Char = 1;

// 2-Player Mode Globals
export let gameMode = "1P";
export let players = [];
export let titleSelection = 0;
export let keyBindingPhase = 0;
export let playerKeys = [
  { key: "ShiftLeft", label: "L-SHIFT" },
  { key: "ShiftRight", label: "R-SHIFT" },
];
export let globalInputJustPressed = false;
export let globalInputPressed = false;

// Shared visual state
export let phaseTransitionFlash = 0;
export let bgClouds = [];
export let titleBounce = 0;
export let titleClouds = [];
export let currentSky = { top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot };
export let targetSky = { top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot };

// Leaderboard
export let leaderboard = [];
export let initialsEntry = { active: false, chars: ["A", "A", "A"], pos: 0 };
export let initialsPlayerIndex = 0;
export let initialsQueue = [];
export let showLeaderboardFromTitle = false;
export let idleTimer = 0;

// ── Setters ───────────────────────────────────────────────────────
export function setState(v) { state = v; }
export function setPhase(v) { phase = v; }
export function setCharSelectStage(v) { charSelectStage = v; }
export function setP1Char(v) { p1Char = v; }
export function setP2Char(v) { p2Char = v; }
export function setGameMode(v) { gameMode = v; }
export function setPlayers(v) { players = v; }
export function setTitleSelection(v) { titleSelection = v; }
export function setKeyBindingPhase(v) { keyBindingPhase = v; }
export function setPlayerKeys(v) { playerKeys = v; }
export function setGlobalInputJustPressed(v) { globalInputJustPressed = v; }
export function setGlobalInputPressed(v) { globalInputPressed = v; }
export function setPhaseTransitionFlash(v) { phaseTransitionFlash = v; }
export function setBgClouds(v) { bgClouds = v; }
export function setTitleBounce(v) { titleBounce = v; }
export function setTitleClouds(v) { titleClouds = v; }
export function setCurrentSky(v) { currentSky = v; }
export function setTargetSky(v) { targetSky = v; }
export function setLeaderboard(v) { leaderboard = v; }
export function setInitialsEntry(v) { initialsEntry = v; }
export function setInitialsPlayerIndex(v) { initialsPlayerIndex = v; }
export function setInitialsQueue(v) { initialsQueue = v; }
export function setShowLeaderboardFromTitle(v) { showLeaderboardFromTitle = v; }
export function setIdleTimer(v) { idleTimer = v; }

// ── Helpers ───────────────────────────────────────────────────────
export function getVW() {
  return gameMode === "2P" ? 480 : 960;
}

export function createPlayerState(playerIndex) {
  return {
    index: playerIndex,
    nimbus: {
      x: 0,
      y: 0,
      vy: 0,
      vx: 0,
      expression: "happy",
      rotation: 0,
      pose: "idle",
      stretchX: 1,
      stretchY: 1,
      flipAngle: 0,
      isFlipping: false,
    },
    clouds: [],
    currentCloudIdx: 0,
    cameraX: 0,
    cameraTargetX: 0,
    combo: 0,
    score: 0,
    round: 1,
    bossHits: 0,
    runPlatform: [],
    runX: 0,
    runSpeed: 0,
    runAnimTimer: 0,
    ringProgress: 0,
    ringActive: false,
    ringActivationY: 0,
    ringStompY: 0,
    actionPressed: false,
    actionResult: "",
    ringWobble: 0,
    ringPulsePhase: 0,
    particles: [],
    floatingTexts: [],
    screenShake: { x: 0, y: 0, intensity: 0 },
    timeSlowdown: 0,
    cloud9Overlay: 0,
    cloud9Text: "",
    state: STATE.READY,
    stateTimer: 0,
    inputJustPressed: false,
    inputPressed: false,
    alive: true,
    keyBinding: null,
    keyLabel: "",
  };
}
