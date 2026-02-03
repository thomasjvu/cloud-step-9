// ═══════════════════════════════════════════════════════════════════
// Clouds Module - Cloud chain and run platform generation
// ═══════════════════════════════════════════════════════════════════

import { GROUND_Y } from './constants.js';
import { gameMode } from './state.js';
import { getCloudCount, getCloudSpacing } from './physics.js';

export function generateRunPlatform(startX, round) {
  const platform = [];
  const count = 12 + Math.min(round, 3);
  const spacing = 50;
  let cx = startX;
  const type = Math.min(round - 1, 4);
  for (let i = 0; i < count; i++) {
    platform.push({
      x: cx,
      y: GROUND_Y,
      scale: 0.9 + Math.random() * 0.2,
      type,
    });
    cx += spacing;
  }
  return platform;
}

export function generateCloudChain(startX, round) {
  const clouds = [];
  const count = getCloudCount(round);
  const spacing = getCloudSpacing(round);
  const type = Math.min(round - 1, 4);
  let cx = startX;
  for (let i = 0; i < count; i++) {
    const yOff = (Math.random() - 0.5) * 40;

    const isBossApproach = i >= count - 3;
    const adjustedSpacing = isBossApproach ? spacing * 0.6 : spacing;
    const heightBonus = isBossApproach ? -30 - (count - i) * 15 : 0;

    clouds.push({
      x: cx,
      y: GROUND_Y + yOff + heightBonus,
      hp: 1,
      maxHp: 1,
      type,
      squish: 0,
      flash: 0,
      isBoss: false,
      scale: 0.8 + Math.random() * 0.3,
      defeated: false,
    });
    cx += adjustedSpacing + Math.random() * 60;
  }
  // Boss cloud
  cx += spacing * 0.25;
  const bossScale = gameMode === "2P" ? 1.8 : 2.5;
  clouds.push({
    x: cx,
    y: GROUND_Y,
    hp: 9,
    maxHp: 9,
    type,
    squish: 0,
    flash: 0,
    isBoss: true,
    scale: bossScale,
    defeated: false,
  });
  return clouds;
}
