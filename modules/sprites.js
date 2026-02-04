// ═══════════════════════════════════════════════════════════════════
// Sprites Module - Character and cloud sprite rendering
// ═══════════════════════════════════════════════════════════════════

import { ASSETS } from './assets.js';

let ctx = null;

export function setCanvasContext(context) {
  ctx = context;
}

export function drawPlayer(x, y, expression, rot, scale, pose, stretchX, stretchY, playerIndex = 0, actionResult = '') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale * stretchX, scale * stretchY);

  const drawW = 100;
  const drawH = 150;

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

  // Disable interpolation to prevent sub-pixel bleed
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  if (actionResult === 'perfect' && pose === 'bounce' && ASSETS.spinFrames.length > 0) {
      // Use pre-cleaned spin frames (alpha-thresholded, cropped, no ghosts)
      const spinDuration = 500;
      const spinFrame = Math.floor((time % spinDuration) / (spinDuration / 5));
      const frame = ASSETS.spinFrames[spinFrame];
      const spinSize = 100;
      ctx.drawImage(frame, 0, 0, frame.width, frame.height,
          -spinSize / 2, -spinSize / 2, spinSize, spinSize);
  } else {
      // Shadow
      ctx.save();
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 70, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ctx.restore();

      if (ASSETS.charFrames.length > 0 && ASSETS.charFrames[row]) {
          // Use pre-extracted frame canvas (no fractional boundary bleed)
          const frame = ASSETS.charFrames[row][col];
          ctx.drawImage(frame, 0, 0, frame.width, frame.height,
              -drawW / 2, -drawH / 2 - 20, drawW, drawH);
      } else {
          // Fallback: raw spritesheet (before frames are prepared)
          const cols = 5, rows = 3, pad = 12;
          const sx = Math.floor(col * 1024 / cols) + pad;
          const sy = Math.floor(row * 1024 / rows) + pad;
          const sx2 = Math.floor((col + 1) * 1024 / cols) - pad;
          const sy2 = Math.floor((row + 1) * 1024 / rows) - pad;
          ctx.drawImage(ASSETS.char, sx, sy, sx2 - sx, sy2 - sy,
              -drawW / 2, -drawH / 2 - 20, drawW, drawH);
      }
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
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
