// ═══════════════════════════════════════════════════════════════════
// Rendering Module - Background, drawing helpers, viewport rendering
// ═══════════════════════════════════════════════════════════════════

import { GW, GH, GROUND_Y, C9_BLUE, C9_LIGHT, WHITE, GOLD, PERFECT_GREEN, MISS_RED, BASE_ACTIVATION_DIST } from './constants.js';
import { STATE } from './state.js';
import {
  phase, gameMode, bgClouds, currentSky, targetSky,
  phaseTransitionFlash, setPhaseTransitionFlash, getVW,
} from './state.js';
import { musicPlaying, beatPulse, musicBeat } from './audio.js';
import { getActivationDist } from './physics.js';
import { drawPlayer, drawCloudPuff, drawStormPuff } from './sprites.js';

let ctx = null;

export function setCanvasContext(context) {
  ctx = context;
}

// ── Color helpers ──────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function lerpColor(a, b, t) {
  const ca = hexToRgb(a),
    cb = hexToRgb(b);
  return rgbToHex(
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t,
  );
}

export function drawBackground(dt, vw) {
  currentSky.top = lerpColor(currentSky.top, targetSky.top, dt * 2);
  currentSky.bot = lerpColor(currentSky.bot, targetSky.bot, dt * 2);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, currentSky.top);
  skyGrad.addColorStop(1, currentSky.bot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, vw, GH);
  const bgSpeed = 1 + (phase - 1) * 0.3;
  bgClouds.forEach((c) => {
    c.x -= c.speed * bgSpeed;
    if (c.x + c.w < -50) {
      c.x = GW + 50;
      c.y = 40 + Math.random() * 200;
    }
    ctx.save();
    ctx.globalAlpha = c.opacity;
    ctx.fillStyle = WHITE;
    const cx = c.x,
      cy = c.y,
      w = c.w;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
    ctx.arc(cx - w * 0.2, cy + 2, w * 0.15, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.2, cy + 2, w * 0.15, 0, Math.PI * 2);
    ctx.arc(cx - w * 0.1, cy - w * 0.08, w * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.12, cy - w * 0.06, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y - 20, 0, GH);
  groundGrad.addColorStop(0, "rgba(255,255,255,0.08)");
  groundGrad.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y - 20, vw, GH - GROUND_Y + 20);
  if (phase >= 4 && Math.random() < 0.005) setPhaseTransitionFlash(0.3);
}

// ── Drawing helpers ───────────────────────────────────────────────
export function drawStrokedText(text, x, y, color, size, strokeColor = "#000", strokeWidth = 4) {
  ctx.font = `${size}px 'Luckiest Guy', Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export function drawStar(x, y, r, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawActionRing(p, x, y) {
  if (!p.ringActive) return;
  const outerR = 45;
  const innerR = 16;
  let progress = p.ringProgress;
  if (phase >= 6) {
    const pulseIntensity = Math.min(0.08, 0.03 + (phase - 6) * 0.008);
    p.ringPulsePhase += 0.15 + (phase - 6) * 0.03;
    progress = p.ringProgress + Math.sin(p.ringPulsePhase) * pulseIntensity;
    progress = Math.max(0, Math.min(1, progress));
  }
  const currentR = outerR - (outerR - innerR) * progress;
  let wobX = 0,
    wobY = 0;
  if (phase >= 5) {
    const wobIntensity = Math.min(8, 3 + (phase - 5) * 0.8);
    p.ringWobble += 0.12 + (phase - 5) * 0.02;
    wobX = Math.sin(p.ringWobble) * wobIntensity;
    wobY = Math.cos(p.ringWobble * 1.3) * wobIntensity;
  }
  const rx = x + wobX;
  const ry = y + wobY;
  ctx.beginPath();
  ctx.arc(rx, ry, innerR + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
  const inPerfect = p.ringProgress >= 0.72 && p.ringProgress <= 0.97;
  const inGood = p.ringProgress >= 0.55 && p.ringProgress <= 1.0;
  let ringColor = C9_LIGHT;
  if (inPerfect) ringColor = PERFECT_GREEN;
  else if (inGood) ringColor = GOLD;
  else if (p.ringProgress > 0.97) ringColor = MISS_RED;
  ctx.beginPath();
  ctx.arc(rx, ry, currentR, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  if (inGood) {
    ctx.beginPath();
    ctx.arc(rx, ry, currentR, 0, Math.PI * 2);
    ctx.strokeStyle = inPerfect
      ? "rgba(61, 245, 61, 0.35)"
      : "rgba(255, 215, 0, 0.25)";
    ctx.lineWidth = 12;
    ctx.stroke();
  }
  const label = gameMode === "1P" ? "SPACE" : p.keyLabel;
  ctx.save();
  ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.01) * 0.3;
  drawStrokedText(label, rx, ry - outerR - 14, WHITE, 13, "#000", 2);
  ctx.restore();
}

function getCurrentCloud(p) {
  return p.clouds[p.currentCloudIdx] || null;
}

export function drawPlayerViewport(p, dt) {
  const vw = getVW();
  ctx.save();
  if (gameMode === "2P") ctx.translate(p.screenShake.x, p.screenShake.y);

  drawBackground(dt, vw);

  const isGameplay = p.state !== STATE.RESULTS && p.state !== STATE.ASCEND;

  if (isGameplay || p.state === STATE.BOSS_DEFEATED) {
    ctx.save();
    ctx.translate(-p.cameraX, 0);

    // Draw run platform clouds
    if (p.runPlatform && p.runPlatform.length > 0) {
      p.runPlatform.forEach((rc) => {
        const screenX = rc.x - p.cameraX;
        if (screenX < -80 || screenX > vw + 80) return;
        drawCloudPuff(rc.x, rc.y, rc.type, 0, 0, rc.scale, false, true);
      });
    }

    // Draw all clouds
    p.clouds.forEach((cloud, i) => {
      const screenX = cloud.x - p.cameraX;
      if (screenX < -100 || screenX > vw + 100) return;
      if (cloud.defeated && !cloud.isBoss) return;

      if (cloud.isBoss) {
        drawStormPuff(
          cloud.x,
          cloud.y,
          cloud.type,
          cloud.squish,
          cloud.flash,
          cloud.scale,
        );
      } else {
        drawCloudPuff(
          cloud.x,
          cloud.y,
          cloud.type,
          cloud.squish,
          cloud.flash,
          cloud.scale,
        );
      }

      // Beat pulse on current target
      if (i === p.currentCloudIdx && musicPlaying && beatPulse > 0) {
        ctx.save();
        const pulseR = 30 * cloud.scale + (1 - beatPulse) * 20;
        ctx.globalAlpha = beatPulse * 0.4;
        ctx.strokeStyle = C9_LIGHT;
        ctx.lineWidth = 2 + beatPulse * 2;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y - 5, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Health bar for boss
      if (cloud.isBoss && cloud.hp < cloud.maxHp) {
        const barW = 120;
        const barH = 10;
        const barX = cloud.x - barW / 2;
        const barY = cloud.y - 65 * cloud.scale;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        const segW = barW / cloud.maxHp;
        for (let si = 0; si < cloud.maxHp; si++) {
          const sx = barX + si * segW;
          ctx.fillStyle =
            si < cloud.hp
              ? cloud.hp <= 1
                ? MISS_RED
                : cloud.hp <= 3
                  ? GOLD
                  : PERFECT_GREEN
              : "rgba(100,100,100,0.4)";
          ctx.fillRect(sx + 1, barY, segW - 2, barH);
        }
      }

      // Boss expression warning
      if (cloud.isBoss && cloud.hp <= 1 && cloud.hp > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.01) * 0.3;
        drawStrokedText(
          "!!",
          cloud.x,
          cloud.y - 50 * cloud.scale,
          MISS_RED,
          18,
          "#000",
          2,
        );
        ctx.restore();
      }
    });

    // Player shadow (world-space)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    const shadowScale = Math.max(0.3, 1 - (GROUND_Y - p.nimbus.y) / 300);
    ctx.beginPath();
    ctx.ellipse(
      p.nimbus.x,
      GROUND_Y + 5,
      18 * shadowScale,
      5 * shadowScale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    // Draw player (world-space)
    const playerScale = 1 + (p.state === STATE.STOMP_HIT ? 0.12 : 0);
    drawPlayer(p.nimbus.x, p.nimbus.y, p.nimbus.expression, p.nimbus.rotation, playerScale, p.nimbus.pose, p.nimbus.stretchX, p.nimbus.stretchY, p.index, p.actionResult);

    // Action ring
    const cloud = getCurrentCloud(p);
    if (p.ringActive && cloud) {
      drawActionRing(p, cloud.x, cloud.y - 35 * cloud.scale, cloud.isPerfect);
    }

    ctx.restore(); // end camera transform

    // Speed lines during fall
    if (p.state === STATE.FALL && p.round >= 4) {
      const nimbusScreenX = p.nimbus.x - p.cameraX;
      const lineCount = Math.min(p.round - 3, 4);
      for (let i = 0; i < lineCount; i++) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.random() * 0.15;
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1;
        const lx = nimbusScreenX + (Math.random() - 0.5) * 120;
        const ly = p.nimbus.y - 30;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(
          lx + (Math.random() - 0.5) * 4,
          ly + 20 + Math.random() * 30,
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // "BOSS!" indicator
    if (cloud && cloud.isBoss && p.state === STATE.BOUNCE_UP) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.008) * 0.3;
      ctx.save();
      ctx.globalAlpha = alpha;
      const bScale = 1 + Math.sin(performance.now() * 0.008) * 0.08;
      ctx.translate(vw / 2, GH / 4);
      ctx.scale(bScale, bScale);
      drawStrokedText(
        "BOSS!",
        0,
        0,
        MISS_RED,
        gameMode === "2P" ? 28 : 40,
        "#500",
        4,
      );
      ctx.restore();
    }
  } else if (p.state === STATE.ASCEND) {
    const prog = Math.min(1, p.stateTimer / 1.5);

    const desatProg = Math.min(1, prog / 0.4);
    const returnProg = prog > 0.8 ? (prog - 0.8) / 0.2 : 0;
    const bwAmount = returnProg > 0 ? 1 - returnProg : desatProg;

    ctx.save();
    ctx.filter = `grayscale(${bwAmount * 100}%) contrast(${100 + bwAmount * 60}%)`;

    drawPlayer(vw / 2, p.nimbus.y, p.nimbus.expression, p.nimbus.rotation, 1, p.nimbus.pose, p.nimbus.stretchX, p.nimbus.stretchY, p.index, '');

    ctx.restore(); // remove filter

    if (bwAmount > 0.2) {
      ctx.save();
      const vigAlpha = (bwAmount - 0.2) * 0.5;
      const vig = ctx.createRadialGradient(
        vw / 2,
        GH / 2,
        vw * 0.2,
        vw / 2,
        GH / 2,
        vw * 0.7,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, GH);
      ctx.restore();
    }

    const textAlpha =
      Math.min(1, p.stateTimer / 0.3) *
      Math.max(0, 1 - (p.stateTimer - 1.0) / 0.5);
    ctx.save();
    ctx.globalAlpha = Math.max(0, textAlpha);
    const textColor = bwAmount > 0.5 ? WHITE : GOLD;
    const strokeColor = bwAmount > 0.5 ? "#000" : "#5C2D00";
    drawStrokedText(
      `ROUND ${p.round + 1}`,
      vw / 2,
      GH / 2,
      textColor,
      gameMode === "2P" ? 32 : 48,
      strokeColor,
      5,
    );
    ctx.restore();
  }

  // Particles (screen-space)
  p.particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    if (pt.type === "star") drawStar(pt.x, pt.y, pt.size);
    else if (pt.type === "circle") {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    } else
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    ctx.restore();
  });

  // Floating texts
  p.floatingTexts.forEach((f) => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, f.life * 2);
    const s = f.scale || 1;
    ctx.translate(f.x, f.y);
    ctx.scale(s, s);
    if (p.combo >= 18 && f.text.includes("x")) {
      const hue = (performance.now() * 0.3) % 360;
      drawStrokedText(f.text, 0, 0, `hsl(${hue}, 100%, 60%)`, f.size);
    } else drawStrokedText(f.text, 0, 0, f.color, f.size);
    ctx.restore();
  });

  // Cloud 9 overlay
  if (p.cloud9Overlay > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.cloud9Overlay * 0.8);
    const c9Scale = 1 + (2 - p.cloud9Overlay) * 0.3;
    ctx.translate(vw / 2, GH / 2 - 40);
    ctx.scale(c9Scale, c9Scale);
    drawStrokedText(
      p.cloud9Text,
      0,
      0,
      GOLD,
      gameMode === "2P" ? 40 : 60,
      "#5C2D00",
      6,
    );
    ctx.restore();
    if (p.cloud9Overlay > 1) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.cloud9Overlay - 1) * 2);
      drawStrokedText(
        `ROUND ${p.round}`,
        vw / 2,
        GH / 2 + 20,
        C9_LIGHT,
        gameMode === "2P" ? 20 : 28,
        "#000",
        3,
      );
      ctx.restore();
    }
  }

  // Screen pulse (higher rounds)
  if (p.round >= 5 && p.state !== STATE.ASCEND) {
    const pulse = Math.sin(performance.now() * 0.003) * 0.015;
    if (pulse > 0) {
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C9_BLUE;
      ctx.fillRect(0, 0, vw, GH);
      ctx.restore();
    }
  }

  // 2P: Game Over overlay
  if (gameMode === "2P" && !p.alive && p.state === STATE.RESULTS) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, vw, GH);
    drawStrokedText("GAME OVER", vw / 2, GH / 2 - 20, MISS_RED, 28, "#500", 3);
    drawStrokedText(
      `Score: ${p.score}`,
      vw / 2,
      GH / 2 + 15,
      GOLD,
      20,
      "#000",
      2,
    );
    drawStrokedText(
      `Round: ${p.round}`,
      vw / 2,
      GH / 2 + 40,
      WHITE,
      16,
      "#000",
      2,
    );
    ctx.restore();
  }

  ctx.restore();
}
