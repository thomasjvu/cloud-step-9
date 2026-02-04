// ═══════════════════════════════════════════════════════════════════
// Physics Module - Difficulty scaling and scoring
// ═══════════════════════════════════════════════════════════════════

import { BASE_ACTIVATION_DIST, MIN_ACTIVATION_DIST } from './constants.js';
import { players, gameMode, phase } from './state.js';

export function getPhase() {
  if (!players.length) return 1;
  if (gameMode === "2P") {
    return Math.max(...players.map((p) => p.round));
  }
  return players[0].round;
}

export function getActivationDist(round) {
  const base = BASE_ACTIVATION_DIST - (round - 1) * 15;
  return Math.max(MIN_ACTIVATION_DIST, base);
}

export function calculateScore(isPerfect, round) {
  const phaseMult = round || phase;
  const accuracyBonus = isPerfect ? 2.0 : 1.0;
  return Math.floor(100 * phaseMult * accuracyBonus);
}

export function getRoundBPM(round) {
  const baseBPM = 180;
  const bpmPerRound = round <= 3 ? 35 : 20;
  return Math.min(300, baseBPM + (round - 1) * bpmPerRound);
}

export function getCloudCount(round) {
  return 4 + Math.min(round, 6);
}

export function getCloudSpacing(round) {
  return Math.max(80, 140 - (round - 1) * 15);
}

export function getJumpVelocity(round) {
  return -(19 - Math.min(round - 1, 6) * 2.5);
}

export function getBounceVelocity(round, combo) {
  const base = 16 - Math.min(round - 1, 6) * 1.5;
  return -(base + Math.min(combo * 0.12, 2));
}

export function getGravity(round) {
  return 0.80 + Math.min(round - 1, 8) * 0.20;
}

export function getFallGravity(round) {
  return 0.55 + Math.min(round - 1, 8) * 0.08;
}

export function getBounceGravity(round) {
  return 0.35 + Math.min(round - 1, 8) * 0.05;
}
