// ═══════════════════════════════════════════════════════════════════
// Effects Module - Particles, floating text, background clouds
// ═══════════════════════════════════════════════════════════════════

import { GW, GH, C9_BLUE, C9_LIGHT, WHITE, GOLD, PERFECT_GREEN } from './constants.js';

export function spawnImpactP(p, x, y, count = 10, color = WHITE) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    p.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      size: 2 + Math.random() * 4,
      color,
      type: "square",
    });
  }
}

export function spawnStarsP(p, x, y, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    p.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      size: 3 + Math.random() * 5,
      color: [GOLD, WHITE, "#FFE44D", C9_LIGHT][Math.floor(Math.random() * 4)],
      type: "star",
    });
  }
}

export function spawnTrailP(p, x, y) {
  p.particles.push({
    x: x + (Math.random() - 0.5) * 14,
    y: y + Math.random() * 5,
    vx: (Math.random() - 0.5) * 0.8,
    vy: Math.random() * 0.8 + 0.3,
    life: 0.5,
    size: 2 + Math.random() * 3,
    color: [C9_LIGHT, C9_BLUE, WHITE][Math.floor(Math.random() * 3)],
    type: "star",
  });
}

export function spawnCloud9BurstP(p, x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    p.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5,
      size: 4 + Math.random() * 8,
      color: [C9_BLUE, C9_LIGHT, GOLD, WHITE, PERFECT_GREEN][
        Math.floor(Math.random() * 5)
      ],
      type: "star",
    });
  }
}

export function spawnRingBurstP(p, x, y) {
  for (let i = 0; i < 16; i++) {
    const angle = ((Math.PI * 2) / 16) * i;
    const speed = 4 + Math.random() * 2;
    p.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.7,
      size: 3,
      color: C9_LIGHT,
      type: "circle",
    });
  }
}

export function addFloatingTextP(p, x, y, text, color = WHITE, size = 28) {
  p.floatingTexts.push({
    x,
    y,
    text,
    color,
    size,
    life: 1.2,
    vy: -2.5,
    scale: 1.5,
  });
}

export function initBgClouds(bgClouds) {
  bgClouds.length = 0;
  for (let i = 0; i < 8; i++) {
    bgClouds.push({
      x: Math.random() * GW,
      y: 40 + Math.random() * 200,
      w: 60 + Math.random() * 120,
      speed: 0.6 + Math.random() * 1.2,
      opacity: 0.15 + Math.random() * 0.25,
    });
  }
}

export function initTitleClouds(titleClouds) {
  titleClouds.length = 0;
  for (let i = 0; i < 12; i++) {
    titleClouds.push({
      x: Math.random() * GW,
      y: Math.random() * GH,
      w: 40 + Math.random() * 100,
      speed: 0.1 + Math.random() * 0.4,
      opacity: 0.08 + Math.random() * 0.15,
    });
  }
}
