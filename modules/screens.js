// ═══════════════════════════════════════════════════════════════════
// Screens Module - Title, results, key-bind, leaderboard screens
// ═══════════════════════════════════════════════════════════════════

import { GW, GH, C9_BLUE, C9_LIGHT, WHITE, GOLD, PERFECT_GREEN, MISS_RED } from './constants.js';
import { STATE } from './state.js';
import {
  gameMode, titleSelection, titleBounce, titleClouds,
  keyBindingPhase, playerKeys, showLeaderboardFromTitle,
  initialsEntry, initialsPlayerIndex, idleTimer, leaderboard, players,
} from './state.js';
import { drawStrokedText } from './rendering.js';
import { drawPlayer, drawStormPuff } from './sprites.js';

let ctx = null;

export function setCanvasContext(context) {
  ctx = context;
}

export function drawTitleScreen() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, "#5BC8F5");
  skyGrad.addColorStop(1, "#87CEEB");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GW, GH);
  titleClouds.forEach((c) => {
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
    ctx.fill();
    ctx.restore();
  });

  if (showLeaderboardFromTitle) {
    drawLeaderboardScreen();
    return;
  }

  const bounceY = 210 + Math.sin(titleBounce) * 12;
  const animTime = performance.now();
  const isArmsUp = Math.floor(animTime / 600) % 2 === 0;
  const titlePose = isArmsUp ? 'jump_up' : 'idle';

  drawPlayer(
    GW / 2 - 50,
    bounceY,
    "excited",
    0,
    1.8,
    titlePose,
    1.0,
    1.0,
    0,
    ''
  );
  drawStormPuff(GW / 2 + 80, bounceY + 10, 0, 0, 0);

  const titleY = bounceY + 75;
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = C9_BLUE;
  ctx.beginPath();
  ctx.arc(GW / 2, bounceY - 20, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawStrokedText("CLOUD STEP 9", GW / 2, titleY, GOLD, 52, "#5C2D00", 6);
  drawStrokedText(
    "A Cloud9 Minigame",
    GW / 2,
    titleY + 40,
    C9_LIGHT,
    22,
    "#003366",
    3,
  );

  // Mode selection
  const selY = titleY + 90;
  const opts = ["1 PLAYER", "2 PLAYERS", "LEADERBOARD"];

  for (let i = 0; i < 3; i++) {
    const ox = GW / 2 + (i - 1) * 150;
    const selected = titleSelection === i;
    if (selected) {
      ctx.fillStyle = "rgba(0, 158, 226, 0.3)";
      ctx.beginPath();
      ctx.roundRect(ox - 70, selY - 18, 140, 36, 8);
      ctx.fill();
      ctx.strokeStyle = C9_BLUE;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawStrokedText(
      opts[i],
      ox,
      selY,
      selected ? WHITE : "#aaa",
      selected ? 20 : 16,
      "#000",
      3,
    );
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawStrokedText(
    "\u2190 \u2192 to select   SPACE to start",
    GW / 2,
    selY + 30,
    "#ccc",
    13,
    "#000",
    2,
  );
  ctx.restore();

  drawStrokedText(
    "Bounce through clouds to the Boss!",
    GW / 2,
    GH - 70,
    WHITE,
    16,
    "#000",
    2,
  );
  drawStrokedText(
    "One miss and it's game over!",
    GW / 2,
    GH - 45,
    "#ffcccc",
    14,
    "#000",
    2,
  );
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.4;
  drawStrokedText("\u2601 CLOUD9", 70, 25, C9_BLUE, 16, "#000", 2);
  ctx.restore();
}

export function drawKeyBindScreen() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GH);
  skyGrad.addColorStop(0, "#5BC8F5");
  skyGrad.addColorStop(1, "#87CEEB");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GW, GH);

  drawStrokedText("KEY BINDING", GW / 2, 120, GOLD, 40, "#5C2D00", 5);

  if (keyBindingPhase === 1) {
    drawStrokedText("PLAYER 1", GW / 2, 240, C9_LIGHT, 30, "#000", 3);
    const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawStrokedText("Press your key...", GW / 2, 290, WHITE, 22, "#000", 3);
    ctx.restore();
  } else if (keyBindingPhase === 2) {
    drawStrokedText(
      "PLAYER 1: " + playerKeys[0].label,
      GW / 2,
      220,
      PERFECT_GREEN,
      24,
      "#000",
      3,
    );
    drawStrokedText("PLAYER 2", GW / 2, 310, C9_LIGHT, 30, "#000", 3);
    const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawStrokedText("Press your key...", GW / 2, 360, WHITE, 22, "#000", 3);
    ctx.restore();
  }

  drawStrokedText(
    "Each player needs a unique key",
    GW / 2,
    GH - 50,
    "#aaa",
    14,
    "#000",
    2,
  );
}

export function drawResultsScreen(p) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, GW, GH);
  const centerY = GH / 2 - 30;
  ctx.fillStyle = "rgba(10, 10, 40, 0.9)";
  ctx.strokeStyle = C9_BLUE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(GW / 2 - 200, centerY - 110, 400, 260, 16);
  ctx.fill();
  ctx.stroke();
  drawStrokedText("GAME OVER", GW / 2, centerY - 80, MISS_RED, 36, "#500", 4);
  drawStrokedText(
    `Score: ${p.score}`,
    GW / 2,
    centerY - 35,
    GOLD,
    28,
    "#000",
    3,
  );
  drawStrokedText(`Round: ${p.round}`, GW / 2, centerY, WHITE, 22, "#000", 3);
  drawStrokedText(
    `Combo: ${p.combo}`,
    GW / 2,
    centerY + 30,
    C9_LIGHT,
    22,
    "#000",
    3,
  );
  let rating = "Try Again!";
  let ratingColor = "#AAA";
  if (p.round >= 5) {
    rating = "STORM MASTER!";
    ratingColor = "#ff44ff";
  } else if (p.round >= 4) {
    rating = "THUNDERCLOUD!";
    ratingColor = MISS_RED;
  } else if (p.round >= 3) {
    rating = "CLOUD LEGEND!";
    ratingColor = GOLD;
  } else if (p.round >= 2) {
    rating = "CLOUD 9!";
    ratingColor = PERFECT_GREEN;
  } else if (p.combo >= 5) {
    rating = "Nice Bounce!";
    ratingColor = C9_LIGHT;
  } else if (p.combo >= 2) {
    rating = "Getting There!";
    ratingColor = "#FFA500";
  }
  drawStrokedText(rating, GW / 2, centerY + 65, ratingColor, 24, "#000", 3);

  if (initialsEntry.active) {
    drawStrokedText(
      "ENTER YOUR INITIALS",
      GW / 2,
      centerY + 100,
      WHITE,
      16,
      "#000",
      2,
    );
    const initY = centerY + 130;
    for (let i = 0; i < 3; i++) {
      const ix = GW / 2 + (i - 1) * 35;
      const isActive = i === initialsEntry.pos;
      const charColor = isActive ? GOLD : WHITE;
      const charSize = isActive ? 30 : 24;
      if (isActive) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
        drawStrokedText("\u25B2", ix, initY - 22, C9_LIGHT, 14, "#000", 2);
        drawStrokedText("\u25BC", ix, initY + 22, C9_LIGHT, 14, "#000", 2);
        ctx.restore();
      }
      drawStrokedText(
        initialsEntry.chars[i],
        ix,
        initY,
        charColor,
        charSize,
        "#000",
        3,
      );
      if (isActive) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(ix - 12, initY + 14, 24, 3);
      }
    }
    drawStrokedText(
      "\u2191\u2193 Change  \u2192/SPACE Confirm",
      GW / 2,
      initY + 45,
      "#888",
      11,
      "#000",
      2,
    );
  } else {
    if (p.stateTimer > 1.0) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      drawStrokedText(
        "Press SPACE to continue",
        GW / 2,
        centerY + 120,
        WHITE,
        16,
        "#000",
        2,
      );
      ctx.restore();
    }
  }
}

export function draw2PResultsScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, GW, GH);
  const p1 = players[0],
    p2 = players[1];
  const winner = p1.score >= p2.score ? 0 : 1;

  drawStrokedText("GAME OVER", GW / 2, 60, MISS_RED, 40, "#500", 5);

  const lx = GW / 4;
  const rx = (GW * 3) / 4;

  if (winner === 0) drawStrokedText("WINNER!", lx, 105, GOLD, 22, "#5C2D00", 3);
  drawStrokedText("P1", lx, 130, C9_LIGHT, 28, "#000", 3);
  drawStrokedText(`${p1.score}`, lx, 165, winner === 0 ? GOLD : WHITE, 32, "#000", 3);
  drawStrokedText(`Round: ${p1.round}`, lx, 200, WHITE, 18, "#000", 2);

  if (winner === 1) drawStrokedText("WINNER!", rx, 105, GOLD, 22, "#5C2D00", 3);
  drawStrokedText("P2", rx, 130, C9_LIGHT, 28, "#000", 3);
  drawStrokedText(`${p2.score}`, rx, 165, winner === 1 ? GOLD : WHITE, 32, "#000", 3);
  drawStrokedText(`Round: ${p2.round}`, rx, 200, WHITE, 18, "#000", 2);

  drawStrokedText(
    `Best Round: ${Math.max(p1.round, p2.round)}`,
    GW / 2,
    240,
    C9_LIGHT,
    20,
    "#000",
    2,
  );

  // VS divider
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(GW / 2, 100);
  ctx.lineTo(GW / 2, 220);
  ctx.stroke();
  drawStrokedText("VS", GW / 2, 160, "#888", 16, "#000", 2);

  // Initials
  if (initialsEntry.active) {
    drawStrokedText(
      `P${initialsPlayerIndex + 1} - ENTER INITIALS`,
      GW / 2,
      280,
      WHITE,
      16,
      "#000",
      2,
    );
    const initY = 310;
    for (let i = 0; i < 3; i++) {
      const ix = GW / 2 + (i - 1) * 35;
      const isActive = i === initialsEntry.pos;
      const charColor = isActive ? GOLD : WHITE;
      const charSize = isActive ? 30 : 24;
      if (isActive) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
        drawStrokedText("\u25B2", ix, initY - 22, C9_LIGHT, 14, "#000", 2);
        drawStrokedText("\u25BC", ix, initY + 22, C9_LIGHT, 14, "#000", 2);
        ctx.restore();
      }
      drawStrokedText(
        initialsEntry.chars[i],
        ix,
        initY,
        charColor,
        charSize,
        "#000",
        3,
      );
      if (isActive) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(ix - 12, initY + 14, 24, 3);
      }
    }
    drawStrokedText(
      "\u2191\u2193 Change  \u2192/SPACE Confirm",
      GW / 2,
      initY + 45,
      "#888",
      11,
      "#000",
      2,
    );
  } else {
    if (idleTimer > 1.0) {
      const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      drawStrokedText(
        "Press SPACE to continue",
        GW / 2,
        320,
        WHITE,
        18,
        "#000",
        2,
      );
      ctx.restore();
    }
  }
}

export function drawLeaderboardScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, GW, GH);
  drawStrokedText("LEADERBOARD", GW / 2, 60, GOLD, 40, "#5C2D00", 5);
  if (leaderboard.length === 0) {
    drawStrokedText("No scores yet!", GW / 2, GH / 2, "#888", 24, "#000", 3);
    drawStrokedText(
      "Be the first to play!",
      GW / 2,
      GH / 2 + 35,
      "#666",
      18,
      "#000",
      2,
    );
  } else {
    const hdrY = 105;
    ctx.font = `14px 'Luckiest Guy', Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = C9_LIGHT;
    ctx.fillText("RANK", 120, hdrY);
    ctx.fillText("NAME", 250, hdrY);
    ctx.fillText("SCORE", 420, hdrY);
    ctx.fillText("COMBO", 560, hdrY);
    ctx.fillText("ROUND", 700, hdrY);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, hdrY + 10);
    ctx.lineTo(GW - 80, hdrY + 10);
    ctx.stroke();
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const ey = hdrY + 35 + i * 35;
      const rowColor =
        i === 0 ? GOLD : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : WHITE;
      drawStrokedText(`${i + 1}`, 120, ey, rowColor, 20, "#000", 2);
      drawStrokedText(entry.name, 250, ey, rowColor, 20, "#000", 2);
      drawStrokedText(`${entry.score}`, 420, ey, rowColor, 20, "#000", 2);
      drawStrokedText(`${entry.combo}x`, 560, ey, rowColor, 20, "#000", 2);
      drawStrokedText(`${entry.phase}`, 700, ey, rowColor, 20, "#000", 2);
    }
  }
  const alpha = 0.5 + Math.sin(performance.now() * 0.004) * 0.5;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawStrokedText(
    "Press SPACE to return",
    GW / 2,
    GH - 40,
    WHITE,
    18,
    "#000",
    2,
  );
  ctx.restore();
}
