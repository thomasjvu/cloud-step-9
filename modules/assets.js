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
};

export function loadImages() {
  ASSETS.girl.src = "sprites/girl-spritesheet-final.png";
  ASSETS.boy.src = "sprites/boy-spritesheet-final.png";
  ASSETS.girlSpin.src = "sprites/girl_spin_clean.png";
  ASSETS.boySpin.src = "sprites/boy_spin_clean.png";
  ASSETS.cloud.src = "sprites/cloud_spritesheet.png";
  ASSETS.rainCloud.src = "sprites/rain_cloud_perfect.png";
  ASSETS.thunderCloud.src = "sprites/thunder_cloud_perfect.png";
  ASSETS.cloudNoFace.src = "sprites/cloud_no_face.png";
}
