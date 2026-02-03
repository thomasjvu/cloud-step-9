// ═══════════════════════════════════════════════════════════════════
// Sprites Module - Character and cloud sprite rendering
// ═══════════════════════════════════════════════════════════════════

import { ASSETS } from './assets.js';
import { players } from './state.js';

let ctx = null;

export function setCanvasContext(context) {
  ctx = context;
}

export function drawPlayer(x, y, expression, rot, scale, pose, stretchX, stretchY, playerIndex = 0, actionResult = '', charType = -1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale * stretchX, scale * stretchY);

  let isBoy = false;
  if (charType !== -1) {
     isBoy = (charType === 1);
  } else {
     if (players[playerIndex]) {
        isBoy = (players[playerIndex].charType === 1);
     } else {
        isBoy = (playerIndex === 1);
     }
  }

  const sheet = isBoy ? ASSETS.boy : ASSETS.girl;
  const spinSheet = isBoy ? ASSETS.boySpin : ASSETS.girlSpin;

  const frameW = 1024 / 5;
  const frameH = 1024 / 3;
  const drawW = 100;
  const drawH = 150;

  const padX = 2;
  const padY = 2;

  let row = 0;
  let col = 0;
  const time = performance.now();

  if (pose === 'run') {
    row = 1;
    const runFrame = Math.floor(time / 100) % 5;
    col = runFrame;
  } else if (pose === 'jump_up' || pose === 'bounce') {
    row = 2;
    col = 1;
  } else if (pose === 'fall') {
    row = 2;
    col = 1;
  } else if (pose === 'stomp' || pose === 'landing') {
    row = 2;
    col = 2;
  } else {
    row = 0;
    const idleFrame = Math.floor(time / 200) % 5;
    col = idleFrame;
  }

  if (actionResult === 'perfect' && pose === 'bounce') {
      const spinFrameCount = 5;
      const spinFrameW = 1280 / spinFrameCount; // 256
      const spinDuration = 500;
      const spinFrame = Math.floor((time % spinDuration) / (spinDuration / spinFrameCount));

      const sPadX = 2;

      ctx.drawImage(
          spinSheet,
          spinFrame * spinFrameW + sPadX,
          0,
          spinFrameW - sPadX * 2,
          256,
          -drawW / 1.5,
          -drawH / 1.5,
          140,
          140
      );
  } else {
      ctx.save();
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 70, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ctx.restore();

      ctx.drawImage(
          sheet,
          col * frameW + padX,
          row * frameH + padY,
          frameW - padX * 2,
          frameH - padY * 2,
          -drawW / 2,
          -drawH / 2 - 20,
          drawW,
          drawH
      );
  }
  ctx.restore();
}

export function drawCloudPuff(x, y, type = 0, squish = 0, flash = 0, scale = 1, isPerfect = false, noFaceNoShadow = false) {
  ctx.save();
  ctx.translate(x, y);
  const squishScale = 1 - squish * 0.25;
  ctx.scale((1 + squish * 0.15) * scale, squishScale * scale);

  const frameW = 512;
  const frameH = 512;
  const drawSize = 120;

  let source = ASSETS.cloud;
  let sx = 0; let sy = 0;

  if (noFaceNoShadow) {
    source = ASSETS.cloudNoFace;
    sx = 0; sy = 0;
  } else if (type < 2) {
     source = ASSETS.cloud;
     sy = 0;
     sx = (squish > 0.1) ? 512 : 0;
  } else if (type === 2) {
     if (isPerfect) {
        source = ASSETS.rainCloud;
        sx = 0; sy = 0;
     } else {
        source = ASSETS.cloud;
        sy = 512; sx = 0;
     }
  } else {
     if (isPerfect) {
        source = ASSETS.thunderCloud;
        sx = 0; sy = 0;
     } else {
        source = ASSETS.cloud;
        sy = 512; sx = 512;
     }
  }

  if (!noFaceNoShadow) {
    ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 25, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  if (flash > 0.3) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'white';
  }

  ctx.drawImage(source, sx, sy, frameW, frameH, -drawSize/2, -drawSize/2 - 10, drawSize, drawSize);

  ctx.restore();
}

export function drawStormPuff(x, y, type = 0, squish = 0, flash = 0, scale = 1, isPerfect = false) {
  drawCloudPuff(x, y, 3, squish, flash, scale, isPerfect);
}
