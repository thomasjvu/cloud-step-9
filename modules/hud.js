// ═══════════════════════════════════════════════════════════════════
// HUD Module - Heads-up display rendering
// ═══════════════════════════════════════════════════════════════════

import { GH, C9_BLUE, C9_LIGHT, WHITE, GOLD, PERFECT_GREEN, MISS_RED, BASE_ACTIVATION_DIST } from './constants.js';
import { STATE } from './state.js';
import { phase, gameMode } from './state.js';
import { musicPlaying, beatPulse, musicBeat } from './audio.js';
import { getActivationDist } from './physics.js';
import { drawStrokedText } from './rendering.js';

let ctx = null;

export function setCanvasContext(context) {
  ctx = context;
}

export function drawHUD(p, vw) {
  if (p.state === STATE.RESULTS) return;
  if (p.state === STATE.RUN_START) {
    const fontSize = gameMode === "2P" ? 24 : 32;
    drawStrokedText(`${p.score}`, vw / 2, 35, WHITE, fontSize, "#000", 3);
    if (p.stateTimer < 1.5) {
      const goAlpha =
        Math.min(1, p.stateTimer / 0.2) *
        Math.max(0, 1 - (p.stateTimer - 1.0) / 0.5);
      const goScale = 1 + Math.sin(p.stateTimer * 6) * 0.1;
      ctx.save();
      ctx.globalAlpha = goAlpha;
      ctx.translate(vw / 2, GH / 2 - 40);
      ctx.scale(goScale, goScale);
      drawStrokedText(
        p.round > 1 ? `ROUND ${p.round}` : "GO!",
        0,
        0,
        GOLD,
        gameMode === "2P" ? 36 : 48,
        "#5C2D00",
        5,
      );
      ctx.restore();
    }
    return;
  }
  const fontSize = gameMode === "2P" ? 24 : 32;
  drawStrokedText(`${p.score}`, vw / 2, 35, WHITE, fontSize, "#000", 3);

  // Combo
  if (p.combo > 0) {
    const hudX = 65;
    const hudY = 45;
    const comboScale = 1 + Math.max(0, 1 - p.stateTimer * 5) * 0.3;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(hudX - 45, hudY - 22, 90, 44, 10);
    ctx.fill();
    ctx.strokeStyle = C9_BLUE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(hudX, hudY - 6);
    ctx.scale(comboScale, comboScale);
    if (p.combo >= 18) {
      const hue = (performance.now() * 0.5) % 360;
      drawStrokedText(
        `${p.combo}`,
        0,
        0,
        `hsl(${hue}, 100%, 65%)`,
        26,
        "#000",
        3,
      );
    } else drawStrokedText(`${p.combo}`, 0, 0, GOLD, 26, "#000", 3);
    ctx.restore();
    drawStrokedText("COMBO", hudX, hudY + 14, WHITE, 10, "#000", 2);
  }

  // Round indicator
  const phaseX = vw - 65;
  const phaseY = 45;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(phaseX - 45, phaseY - 22, 90, 44, 10);
  ctx.fill();
  ctx.strokeStyle = p.round >= 3 ? "#ff66ff" : C9_LIGHT;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawStrokedText(
    `${p.round}`,
    phaseX,
    phaseY - 6,
    p.round >= 4 ? MISS_RED : C9_LIGHT,
    26,
    "#000",
    3,
  );
  drawStrokedText("ROUND", phaseX, phaseY + 14, WHITE, 10, "#000", 2);

  // Cloud progress
  const totalClouds = p.clouds.length;
  const stompedClouds = p.currentCloudIdx;
  if (
    totalClouds > 0 &&
    p.state !== STATE.ASCEND &&
    p.state !== STATE.BOSS_DEFEATED
  ) {
    const progBarW = vw - 140;
    const progBarH = 4;
    const progBarX = 70;
    const progBarY = 72;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(progBarX, progBarY, progBarW, progBarH);
    const pct = stompedClouds / totalClouds;
    const gradBar = ctx.createLinearGradient(
      progBarX,
      0,
      progBarX + progBarW * pct,
      0,
    );
    gradBar.addColorStop(0, C9_LIGHT);
    gradBar.addColorStop(1, GOLD);
    ctx.fillStyle = gradBar;
    ctx.fillRect(progBarX, progBarY, progBarW * pct, progBarH);
    ctx.fillStyle = MISS_RED;
    ctx.fillRect(progBarX + progBarW - 3, progBarY - 2, 6, progBarH + 4);
  }

  // Timing bar during stomp
  if (p.ringActive) {
    const barW = 100;
    const barH = 6;
    const barX = vw / 2 - barW / 2;
    const barY = 82;
    const windowPct = getActivationDist(p.round) / BASE_ACTIVATION_DIST;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    const gradient = ctx.createLinearGradient(
      barX,
      0,
      barX + barW * windowPct,
      0,
    );
    gradient.addColorStop(0, PERFECT_GREEN);
    gradient.addColorStop(0.5, GOLD);
    gradient.addColorStop(1, MISS_RED);
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barW * windowPct, barH);
    drawStrokedText("TIMING", vw / 2, barY + 18, WHITE, 10, "#000", 2);
  }

  // Beat dots
  if (musicPlaying) {
    const dotY = GH - 22;
    const dotSpacing = 18;
    const startX = vw / 2 - dotSpacing * 1.5;
    const currentQuarter = musicBeat % 4;
    for (let i = 0; i < 4; i++) {
      const dx = startX + i * dotSpacing;
      const isActive = i === currentQuarter;
      const r = isActive ? 5 + beatPulse * 3 : 3;
      const alpha = isActive ? 0.6 + beatPulse * 0.4 : 0.25;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isActive ? "#FF88FF" : WHITE;
      ctx.beginPath();
      ctx.arc(dx, dotY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Player label in 2P
  if (gameMode === "2P") {
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawStrokedText(`P${p.index + 1}`, vw / 2, GH - 8, C9_LIGHT, 12, "#000", 2);
    ctx.restore();
  }
}
