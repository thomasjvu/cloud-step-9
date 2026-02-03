// ═══════════════════════════════════════════════════════════════════
// Assets Module - Image asset loading
// ═══════════════════════════════════════════════════════════════════

export const ASSETS = {
  char: new Image(),
  charSpin: new Image(),
  cloud: new Image(),
  rainCloud: new Image(),
  thunderCloud: new Image(),
  cloudNoFace: new Image(),
  // Pre-cleaned spin frames (populated after image loads)
  spinFrames: [],
  // Pre-extracted character frames [row][col] (populated after image loads)
  charFrames: [],
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
  const pad = 20; // crop edges to exclude ghost artifacts
  for (let i = 0; i < 5; i++) {
    frames.push(extractFrame(img, i * fw + pad, pad, fw - pad * 2, 256 - pad * 2, true));
  }
  return frames;
}

function prepareCharacterFrames(img) {
  const cols = 5;
  const rows = 3;
  const pad = 6; // trim edges to avoid cross-cell bleed
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const sx = Math.floor(c * 1024 / cols) + pad;
      const sy = Math.floor(r * 1024 / rows) + pad;
      const sx2 = Math.floor((c + 1) * 1024 / cols) - pad;
      const sy2 = Math.floor((r + 1) * 1024 / rows) - pad;
      grid[r][c] = extractFrame(img, sx, sy, sx2 - sx, sy2 - sy, false);
    }
  }
  return grid;
}

export function loadImages() {
  // Attach onload BEFORE setting src so cached images still trigger
  ASSETS.char.onload = () => {
    ASSETS.charFrames = prepareCharacterFrames(ASSETS.char);
  };
  ASSETS.charSpin.onload = () => {
    ASSETS.spinFrames = prepareSpinFrames(ASSETS.charSpin);
  };

  ASSETS.char.src = "sprites/spritesheet.png";
  ASSETS.charSpin.src = "sprites/spin.png";
  ASSETS.cloud.src = "sprites/cloud_spritesheet.png";
  ASSETS.rainCloud.src = "sprites/rain_cloud_perfect.png";
  ASSETS.thunderCloud.src = "sprites/thunder_cloud_perfect.png";
  ASSETS.cloudNoFace.src = "sprites/cloud_no_face.png";
}
