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

  const time = performance.now();

  // Disable interpolation to prevent sub-pixel bleed
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  if (actionResult === 'perfect' && pose === 'bounce' && ASSETS.spinFrames.length > 0) {
      // Use pre-cleaned spin frames
      const spinDuration = 500;
      const spinFrame = Math.floor((time % spinDuration) / (spinDuration / 5));
      const frame = ASSETS.spinFrames[spinFrame];
      const spinSize = 115;
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

      let frame = null;
      // Select frame based on pose
      if (pose === 'run' && ASSETS.runFrames.length > 0) {
          const runFrame = Math.floor(time / 100) % ASSETS.runFrames.length;
          frame = ASSETS.runFrames[runFrame];
      } else if ((pose === 'jump_up' || pose === 'bounce') && ASSETS.jumpFrames.length > 0) {
          frame = ASSETS.jumpFrames[2]; // Mid-air pose
      } else if (pose === 'fall' && ASSETS.jumpFrames.length > 0) {
          frame = ASSETS.jumpFrames[3]; // Falling pose
      } else if ((pose === 'stomp' || pose === 'landing') && ASSETS.jumpFrames.length > 0) {
          frame = ASSETS.jumpFrames[4]; // Landing pose
      } else if (ASSETS.idleFrames.length > 0) {
          // Default to idle
          const idleFrame = Math.floor(time / 200) % ASSETS.idleFrames.length;
          frame = ASSETS.idleFrames[idleFrame];
      }

      if (frame) {
          // New consolidated drawing logic for 256x256 frames
          // We draw them into a square destination rect to preserve aspect ratio
          const charSize = 145; 
          ctx.drawImage(frame, 0, 0, frame.width, frame.height,
              -charSize / 2, -charSize / 2 - 20, charSize, charSize);
      } else {
          // Fallback if assets not loaded (should generally not happen if preloaded)
          // Draw a placeholder or just nothing
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
