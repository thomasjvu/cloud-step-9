// ═══════════════════════════════════════════════════════════════════
// Assets Module - Image asset loading
// ═══════════════════════════════════════════════════════════════════

export const ASSETS = {
  girl: new Image(),
  boy: new Image(),
  girlSpin: new Image(),
  boySpin: new Image(),
  cloud: new Image(),
  rainCloud: new Image(),
  thunderCloud: new Image(),
  cloudNoFace: new Image(),
  // Pre-cleaned spin frames (populated after images load)
  girlSpinFrames: [],
  boySpinFrames: [],
  // Pre-extracted character frames [row][col] (populated after images load)
  girlFrames: [],
  boyFrames: [],
};

// Extract a single frame from a spritesheet into its own canvas,
// with optional alpha thresholding to remove semi-transparent artifacts.
function extractFrame(img, sx, sy, sw, sh, threshold) {
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const cx = c.getContext('2d');
  cx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  if (threshold) {
    const id = cx.getImageData(0, 0, sw, sh);
    const d = id.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = d[i] < 128 ? 0 : 255;
    }
    cx.putImageData(id, 0, 0);
  }
  return c;
}

function prepareSpinFrames(img) {
  const frames = [];
  const fw = 256; // 1280 / 5
  for (let i = 0; i < 5; i++) {
    frames.push(extractFrame(img, i * fw, 0, fw, 256, true));
  }
  return frames;
}

function prepareCharacterFrames(img) {
  const cols = 5;
  const rows = 3;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const sx = Math.floor(c * 1024 / cols);
      const sy = Math.floor(r * 1024 / rows);
      const sx2 = Math.floor((c + 1) * 1024 / cols);
      const sy2 = Math.floor((r + 1) * 1024 / rows);
      grid[r][c] = extractFrame(img, sx, sy, sx2 - sx, sy2 - sy, false);
    }
  }
  return grid;
}

export function loadImages() {
  ASSETS.girl.src = "sprites/girl-spritesheet-final.png";
  ASSETS.boy.src = "sprites/boy-spritesheet-final.png";
  ASSETS.girlSpin.src = "sprites/girl_spin_clean.png";
  ASSETS.boySpin.src = "sprites/boy_spin_clean.png";
  ASSETS.cloud.src = "sprites/cloud_spritesheet.png";
  ASSETS.rainCloud.src = "sprites/rain_cloud_perfect.png";
  ASSETS.thunderCloud.src = "sprites/thunder_cloud_perfect.png";
  ASSETS.cloudNoFace.src = "sprites/cloud_no_face.png";

  // Pre-process spin sprites: threshold alpha to remove transparency artifacts
  ASSETS.girlSpin.onload = () => {
    ASSETS.girlSpinFrames = prepareSpinFrames(ASSETS.girlSpin);
  };
  ASSETS.boySpin.onload = () => {
    ASSETS.boySpinFrames = prepareSpinFrames(ASSETS.boySpin);
  };
  // Pre-extract character frames to individual canvases to eliminate
  // interpolation bleed from fractional pixel boundaries (1024/5 = 204.8)
  ASSETS.girl.onload = () => {
    ASSETS.girlFrames = prepareCharacterFrames(ASSETS.girl);
  };
  ASSETS.boy.onload = () => {
    ASSETS.boyFrames = prepareCharacterFrames(ASSETS.boy);
  };
}
