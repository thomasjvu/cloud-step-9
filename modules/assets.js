// ═══════════════════════════════════════════════════════════════════
// Assets Module - Image asset loading
// ═══════════════════════════════════════════════════════════════════

export const ASSETS = {
  // Separate sprite sheets (1x5 strips)
  charIdle: new Image(),
  charRun: new Image(),
  charJump: new Image(),
  charSpin: new Image(),
  
  cloud: new Image(),
  rainCloud: new Image(),
  thunderCloud: new Image(),
  cloudNoFace: new Image(),
  
  // Pre-processed frame arrays
  idleFrames: [],
  runFrames: [],
  jumpFrames: [],
  spinFrames: [],
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

function prepareStripFrames(img) {
  const frames = [];
  const fw = 256; // Standard frame width for all new assets (1280 total width)
  const pad = 10; // crop edges slightly to ensure cleanness
  for (let i = 0; i < 5; i++) {
    // We maintain the 256x256 aspect ratio for the frame canvas
    frames.push(extractFrame(img, i * fw + pad, pad, fw - pad * 2, 256 - pad * 2, true));
  }
  return frames;
}

export function loadImages() {
  ASSETS.charIdle.onload = () => { ASSETS.idleFrames = prepareStripFrames(ASSETS.charIdle); };
  ASSETS.charRun.onload = () => { ASSETS.runFrames = prepareStripFrames(ASSETS.charRun); };
  ASSETS.charJump.onload = () => { ASSETS.jumpFrames = prepareStripFrames(ASSETS.charJump); };
  ASSETS.charSpin.onload = () => { ASSETS.spinFrames = prepareStripFrames(ASSETS.charSpin); };

  ASSETS.charIdle.src = "sprites/idle.png";
  ASSETS.charRun.src = "sprites/run.png";
  ASSETS.charJump.src = "sprites/jump.png";
  ASSETS.charSpin.src = "sprites/spin.png";
  
  ASSETS.cloud.src = "sprites/cloud_spritesheet.png";
  ASSETS.rainCloud.src = "sprites/rain_cloud_perfect.png";
  ASSETS.thunderCloud.src = "sprites/thunder_cloud_perfect.png";
  ASSETS.cloudNoFace.src = "sprites/cloud_no_face.png";
}
