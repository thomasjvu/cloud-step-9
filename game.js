// ═══════════════════════════════════════════════════════════════════
// CLOUD STEP 9 — A Cloud9 Minigame
// Entry point: canvas setup, imports, game loop, update, draw
// ═══════════════════════════════════════════════════════════════════

import { GW, GH, GROUND_Y, WHITE, GOLD, C9_LIGHT, MISS_RED, SKY_THEMES } from './modules/constants.js';
import { ASSETS, loadImages } from './modules/assets.js';
import { STATE } from './modules/state.js';
import {
  state, setState, phase, setPhase,
  gameMode, setGameMode, players, setPlayers,
  titleSelection, setTitleSelection,
  keyBindingPhase, setKeyBindingPhase,
  playerKeys, setPlayerKeys,
  globalInputJustPressed, setGlobalInputJustPressed,
  globalInputPressed, setGlobalInputPressed,
  phaseTransitionFlash, setPhaseTransitionFlash,
  bgClouds, setBgClouds,
  titleBounce, setTitleBounce,
  titleClouds, setTitleClouds,
  currentSky, setCurrentSky,
  targetSky, setTargetSky,
  initialsEntry, setInitialsEntry,
  initialsPlayerIndex, setInitialsPlayerIndex,
  initialsQueue, setInitialsQueue,
  showLeaderboardFromTitle, setShowLeaderboardFromTitle,
  idleTimer, setIdleTimer,
  getVW, createPlayerState,
} from './modules/state.js';
import {
  Audio, initAudio, playTone,
  sfxJump, sfxStomp, sfxPerfect, sfxBounce, sfxMiss, sfxCloud9, sfxStart, sfxPhaseUp, sfxSelect,
  musicPlaying, musicBPM, musicBeat, beatPulse, rhythmBonusText, lastStompOnBeat,
  startMusic, stopMusic, updateMusicTempo, getBeatAccuracy,
  setBeatPulse, setRhythmBonusText, setLastStompOnBeat,
} from './modules/audio.js';
import {
  getPhase, getActivationDist, calculateScore,
  getJumpVelocity, getBounceVelocity, getGravity, getFallGravity, getBounceGravity,
} from './modules/physics.js';
import { setCanvasContext as setSpritesCtx } from './modules/sprites.js';
import { setCanvasContext as setRenderingCtx, drawPlayerViewport, drawStrokedText } from './modules/rendering.js';
import { setCanvasContext as setHudCtx, drawHUD } from './modules/hud.js';
import { setCanvasContext as setScreensCtx, drawTitleScreen, drawKeyBindScreen, drawResultsScreen, draw2PResultsScreen } from './modules/screens.js';
import {
  spawnImpactP, spawnStarsP, spawnTrailP, spawnCloud9BurstP,
  spawnRingBurstP, spawnSpeedLinesP, addFloatingTextP,
  initBgClouds, initTitleClouds,
} from './modules/effects.js';
import { generateRunPlatform, generateCloudChain } from './modules/clouds.js';
import { loadLeaderboard, addToLeaderboard, isHighScore } from './modules/leaderboard.js';
import { setupInputHandlers, setStartGameCallback } from './modules/input.js';

// ── Canvas setup ──────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = GW;
canvas.height = GH;

// Set canvas context on all drawing modules
setSpritesCtx(ctx);
setRenderingCtx(ctx);
setHudCtx(ctx);
setScreensCtx(ctx);

// Load images
loadImages();

// ── Game flow ─────────────────────────────────────────────────────
function startGame() {
  const vw = getVW();
  const numPlayers = gameMode === "2P" ? 2 : 1;
  const newPlayers = [];
  for (let i = 0; i < numPlayers; i++) {
    const p = createPlayerState(i);
    p.round = 1;
    p.runPlatform = generateRunPlatform(100, 1);
    const lastRunCloud = p.runPlatform[p.runPlatform.length - 1];
    const chainStartX = lastRunCloud.x + 180;
    p.clouds = generateCloudChain(chainStartX, 1);
    p.currentCloudIdx = 0;
    p.cameraX = 0;
    p.cameraTargetX = 0;
    p.runX = p.runPlatform[0].x;
    p.nimbus.x = p.runX;
    p.nimbus.y = GROUND_Y - 40;
    p.runSpeed = 3 + Math.min(p.round * 0.5, 3);
    p.runAnimTimer = 0;
    p.keyBinding = playerKeys[i].key;
    p.keyLabel = gameMode === "1P" ? "SPACE" : playerKeys[i].label;
    p.state = STATE.RUN_START;
    p.stateTimer = 0;
    newPlayers.push(p);
  }
  setPlayers(newPlayers);
  setState(null);
  setPhase(1);
  setPhaseTransitionFlash(0);
  setInitialsEntry({ active: false, chars: ["A", "A", "A"], pos: 0 });
  setInitialsPlayerIndex(0);
  setInitialsQueue([]);
  setIdleTimer(0);
  setShowLeaderboardFromTitle(false);
  setTargetSky({ ...SKY_THEMES[0] });
  setCurrentSky({ top: SKY_THEMES[0].top, bot: SKY_THEMES[0].bot });
  setBeatPulse(0);
  setRhythmBonusText(0);
  setLastStompOnBeat(false);
  initBgClouds(bgClouds);
  sfxStart();
  startMusic();
}

// Register the startGame callback for input module
setStartGameCallback(startGame);

// ── Update ────────────────────────────────────────────────────────
function update(dt) {
  setTitleBounce(titleBounce + dt * 3);

  if (state === STATE.TITLE) {
    updateTitle(dt);
    setGlobalInputJustPressed(false);
    return;
  }
  if (state === STATE.KEY_BIND) {
    setGlobalInputJustPressed(false);
    return;
  }

  // Shared decay
  if (beatPulse > 0) setBeatPulse(Math.max(0, beatPulse - dt * 8));
  if (rhythmBonusText > 0) setRhythmBonusText(rhythmBonusText - dt);
  if (phaseTransitionFlash > 0) setPhaseTransitionFlash(phaseTransitionFlash - dt * 2);

  // Update each player
  players.forEach((p) => {
    if (
      p.alive ||
      p.state === STATE.MISS_FALL ||
      p.state === STATE.RESULTS ||
      p.state === STATE.RUN_START
    )
      updatePlayer(p, dt);
  });

  // Update shared phase
  const newPhase = getPhase();
  if (newPhase !== phase) {
    setPhase(newPhase);
    const themeIdx = Math.min(newPhase - 1, SKY_THEMES.length - 1);
    setTargetSky({ ...SKY_THEMES[themeIdx] });
    updateMusicTempo();
  }

  // 2P combined results
  if (gameMode === "2P" && players.every((p) => !p.alive)) {
    setIdleTimer(idleTimer + dt);
    if (initialsEntry.active && globalInputJustPressed) {
      if (initialsEntry.pos >= 2) {
        const pl = players[initialsPlayerIndex];
        const name = initialsEntry.chars.join("");
        addToLeaderboard(name, pl.score, pl.combo, pl.round);
        setInitialsEntry({ ...initialsEntry, active: false });
        sfxSelect();
        if (initialsQueue.length > 0) {
          const nextIdx = initialsQueue[0];
          setInitialsQueue(initialsQueue.slice(1));
          setInitialsPlayerIndex(nextIdx);
          setInitialsEntry({ active: true, chars: ["A", "A", "A"], pos: 0 });
        }
      } else {
        setInitialsEntry({ ...initialsEntry, pos: initialsEntry.pos + 1 });
        sfxSelect();
      }
    }
    if (!initialsEntry.active && idleTimer > 1.0 && globalInputJustPressed)
      setState(STATE.TITLE);
    if (idleTimer > 30) setState(STATE.TITLE);
  }

  setGlobalInputJustPressed(false);
}

function updateTitle(dt) {
  titleClouds.forEach((c) => {
    c.x -= c.speed;
    if (c.x + 100 < 0) c.x = GW + 50;
  });
  if (globalInputJustPressed && !showLeaderboardFromTitle) {
    if (titleSelection === 2) {
      setShowLeaderboardFromTitle(true);
      sfxSelect();
    } else if (titleSelection === 1) {
      setGameMode("2P");
      setState(STATE.KEY_BIND);
      setKeyBindingPhase(1);
      sfxSelect();
    } else {
      setGameMode("1P");
      startGame();
    }
  }
  if (globalInputJustPressed && showLeaderboardFromTitle)
    setShowLeaderboardFromTitle(false);
}

function getCurrentCloud(p) {
  return p.clouds[p.currentCloudIdx] || null;
}

function updatePlayer(p, dt) {
  let effectiveDt = dt;
  if (p.timeSlowdown > 0) {
    p.timeSlowdown -= dt;
    effectiveDt = dt * 0.3;
  }
  p.stateTimer += effectiveDt;

  p.particles = p.particles.filter((pt) => {
    pt.x += pt.vx * (p.timeSlowdown > 0 ? 0.3 : 1);
    pt.y += pt.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
    pt.vy += 0.12;
    pt.life -= dt * 1.8;
    return pt.life > 0;
  });
  p.floatingTexts = p.floatingTexts.filter((f) => {
    f.y += f.vy;
    f.vy *= 0.97;
    f.life -= dt * 0.9;
    if (f.scale > 1) f.scale -= dt * 4;
    if (f.scale < 1) f.scale = 1;
    return f.life > 0;
  });
  if (p.screenShake.intensity > 0) {
    p.screenShake.intensity *= 0.85;
    p.screenShake.x = (Math.random() - 0.5) * p.screenShake.intensity;
    p.screenShake.y = (Math.random() - 0.5) * p.screenShake.intensity;
    if (p.screenShake.intensity < 0.3) {
      p.screenShake.x = 0;
      p.screenShake.y = 0;
      p.screenShake.intensity = 0;
    }
  }
  if (p.cloud9Overlay > 0) p.cloud9Overlay -= dt * 0.6;

  p.clouds.forEach((c) => {
    if (c.squish > 0) c.squish *= 0.9;
    if (c.flash > 0) c.flash -= dt * 4;
  });

  const vw = getVW();
  const cloud = getCurrentCloud(p);

  if (cloud) {
    p.cameraTargetX = cloud.x - vw / 2;
  }
  p.cameraX += (p.cameraTargetX - p.cameraX) * Math.min(1, dt * 5);

  switch (p.state) {
    case STATE.RUN_START: {
      p.nimbus.expression = "happy";
      p.nimbus.pose = "run";
      p.runAnimTimer += effectiveDt;
      p.runX += p.runSpeed;
      p.nimbus.x = p.runX;
      p.nimbus.y = GROUND_Y - 40;
      p.nimbus.y += Math.sin(p.runAnimTimer * 12) * 2;
      p.nimbus.stretchX = 1;
      p.nimbus.stretchY = 1;
      p.cameraTargetX = p.nimbus.x - vw * 0.35;
      p.cameraX += (p.cameraTargetX - p.cameraX) * Math.min(1, effectiveDt * 4);
      if (Math.random() < 0.25)
        spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 20);
      const lastRunCloud = p.runPlatform[p.runPlatform.length - 1];
      if (lastRunCloud && p.runX >= lastRunCloud.x + 40) {
        p.state = STATE.JUMP_UP;
        p.stateTimer = 0;
        p.nimbus.vy = getJumpVelocity(p.round);
        p.nimbus.expression = "determined";
        sfxJump();
      }
      break;
    }
    case STATE.READY: {
      if (!cloud) break;
      p.nimbus.expression = "determined";
      p.nimbus.pose = "idle";
      p.nimbus.x = cloud.x;
      const readyProg = Math.min(1, p.stateTimer / 0.3);
      p.nimbus.stretchX = 1 + readyProg * 0.15;
      p.nimbus.stretchY = 1 - readyProg * 0.12;
      if (p.stateTimer > 0.3) {
        p.state = STATE.JUMP_UP;
        p.stateTimer = 0;
        p.nimbus.vy = getJumpVelocity(p.round);
        sfxJump();
      }
      break;
    }
    case STATE.JUMP_UP: {
      if (!cloud) break;
      p.nimbus.expression = "determined";
      p.nimbus.pose = "jump_up";
      const dx = cloud.x - p.nimbus.x;
      p.nimbus.x += dx * 0.04;
      const jumpSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(jumpSpeed * 0.012, 0.12);
      p.nimbus.stretchY = 1 + Math.min(jumpSpeed * 0.015, 0.15);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getGravity(p.round);
      if (Math.random() < 0.4)
        spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 15);
      if (p.nimbus.vy >= 0) {
        p.state = STATE.FALL;
        p.stateTimer = 0;
      }
      break;
    }
    case STATE.FALL: {
      if (!cloud) break;
      p.nimbus.expression = "determined";
      p.nimbus.pose = "fall";
      const dx = cloud.x - p.nimbus.x;
      p.nimbus.x += dx * 0.06;
      const fallSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(fallSpeed * 0.01, 0.1);
      p.nimbus.stretchY = 1 + Math.min(fallSpeed * 0.013, 0.13);
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getFallGravity(p.round);
      const stompY = cloud.y - 55 * cloud.scale;
      const actDist = getActivationDist(p.round);
      if (!p.ringActive && p.nimbus.y > stompY - actDist) {
        p.ringActive = true;
        p.ringProgress = 0;
        p.ringActivationY = p.nimbus.y;
        p.ringStompY = stompY;
        p.actionPressed = false;
        p.actionResult = "";
        p.ringPulsePhase = 0;
      }
      if (p.ringActive) {
        p.ringProgress = Math.max(
          0,
          Math.min(
            1,
            (p.nimbus.y - p.ringActivationY) /
              (p.ringStompY - p.ringActivationY),
          ),
        );
        if (p.inputJustPressed && !p.actionPressed) {
          p.actionPressed = true;
          const acc = p.ringProgress;
          const extraPhases = Math.max(0, p.round - 5);
          const perfectLow = Math.min(0.88, 0.72 + extraPhases * 0.02);
          const goodLow = Math.min(0.75, 0.55 + extraPhases * 0.015);
          if (acc >= perfectLow && acc <= 0.97) p.actionResult = "perfect";
          else if (acc >= goodLow && acc <= 1.0) p.actionResult = "good";
          else p.actionResult = "miss";
        }
        if (p.ringProgress >= 1 && !p.actionPressed) {
          p.actionResult = "miss";
          p.actionPressed = true;
        }
      }
      if (p.nimbus.y >= stompY) {
        p.nimbus.y = stompY;
        p.ringActive = false;
        if (p.actionResult === "perfect" || p.actionResult === "good")
          p.state = STATE.STOMP_HIT;
        else p.state = STATE.MISS;
        p.stateTimer = 0;
      }
      break;
    }
    case STATE.STOMP_HIT: {
      if (!cloud) break;
      const isPerfect = p.actionResult === "perfect";
      let points = calculateScore(isPerfect, p.round);
      const rhythmAcc = getBeatAccuracy();
      setLastStompOnBeat(rhythmAcc > 0);
      if (lastStompOnBeat) {
        const rhythmMult = 1 + rhythmAcc * 0.5;
        points = Math.floor(points * rhythmMult);
        setRhythmBonusText(1.2);
        playTone(1047, 0.08, "sine", 0.1);
        setTimeout(() => playTone(1319, 0.06, "sine", 0.08), 40);
      }
      p.score += points;
      p.combo++;
      cloud.hp--;
      cloud.squish = 1;
      cloud.flash = 1;
      p.screenShake.intensity = isPerfect ? 12 : 8;
      sfxStomp();
      const drawX = cloud.x - p.cameraX;
      spawnImpactP(p, drawX, cloud.y - 20, isPerfect ? 15 : 8);
      spawnStarsP(p, drawX, cloud.y - 40, isPerfect ? 10 : 5);
      spawnRingBurstP(p, drawX, cloud.y - 30);
      addFloatingTextP(
        p,
        drawX + (Math.random() - 0.5) * 30,
        cloud.y - 70,
        `+${points}`,
        GOLD,
        30,
      );
      if (isPerfect) {
        addFloatingTextP(
          p,
          drawX + 50,
          cloud.y - 95,
          "PERFECT!",
          "#3DF53D",
          26,
        );
        sfxPerfect();
        p.timeSlowdown = 0.15;
        if (cloud) cloud.isPerfect = true;
      } else {
        addFloatingTextP(p, drawX + 40, cloud.y - 90, "GOOD!", C9_LIGHT, 22);
      }
      if (lastStompOnBeat)
        addFloatingTextP(
          p,
          drawX - 60,
          cloud.y - 130,
          "RHYTHM!",
          "#FF88FF",
          20,
        );
      if (p.combo > 1)
        addFloatingTextP(
          p,
          drawX - 55,
          cloud.y - 105,
          `${p.combo}x`,
          WHITE,
          20,
        );

      if (cloud.hp <= 0) {
        cloud.defeated = true;
        if (cloud.isBoss) {
          p.bossHits = cloud.maxHp;
          p.score += 900;
          addFloatingTextP(p, vw / 2, GH / 2 - 60, "+900 CLOUD 9!", GOLD, 36);
          sfxCloud9();
          spawnCloud9BurstP(p, vw / 2, GH / 2);
          p.cloud9Overlay = 2.0;
          p.cloud9Text = "CLOUD 9!";
          setPhaseTransitionFlash(0.5);
          p.state = STATE.BOSS_DEFEATED;
          p.stateTimer = 0;
          break;
        }
        p.currentCloudIdx++;
      }

      p.nimbus.expression = "happy";
      p.nimbus.pose = "stomp";
      p.nimbus.stretchX = 1.2;
      p.nimbus.stretchY = 0.75;
      p.state = STATE.BOUNCE_UP;
      p.stateTimer = 0;
      const baseVelocity = getBounceVelocity(p.round, p.combo);
      p.nimbus.vy = cloud.isBoss ? baseVelocity * 0.7 : baseVelocity;
      if (isPerfect && lastStompOnBeat) {
        p.nimbus.isFlipping = true;
        p.nimbus.flipAngle = 0;
      } else {
        p.nimbus.isFlipping = false;
        p.nimbus.flipAngle = 0;
      }
      sfxBounce();
      break;
    }
    case STATE.BOUNCE_UP: {
      p.nimbus.expression = p.combo >= 18 ? "excited" : "happy";
      const nextCloud = getCurrentCloud(p);
      if (nextCloud) {
        const dx = nextCloud.x - p.nimbus.x;
        p.nimbus.x += dx * 0.03;
      }
      p.nimbus.y += p.nimbus.vy * (p.timeSlowdown > 0 ? 0.3 : 1);
      p.nimbus.vy += getBounceGravity(p.round);
      if (Math.random() < 0.3)
        spawnTrailP(p, p.nimbus.x - p.cameraX, p.nimbus.y + 15);
      if (p.nimbus.isFlipping) {
        p.nimbus.pose = "bounce";
        p.nimbus.flipAngle += 0.06;
        const tiltProgress = Math.min(1, p.nimbus.flipAngle / 1.2);
        const tiltEase = Math.sin(tiltProgress * Math.PI);
        p.nimbus.rotation = tiltEase * 0.5;
        if (Math.random() < 0.3) {
          p.particles.push({
            x: p.nimbus.x - p.cameraX + (Math.random() - 0.5) * 16,
            y: p.nimbus.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.5 - Math.random() * 0.5,
            life: 0.5,
            size: 1.5 + Math.random() * 2,
            color: "#FF88FF",
            type: "star",
          });
        }
        if (p.nimbus.flipAngle >= 1.2) {
          p.nimbus.flipAngle = 0;
          p.nimbus.rotation = 0;
          p.nimbus.isFlipping = false;
        }
      } else {
        p.nimbus.pose = "bounce";
        p.nimbus.rotation = 0;
      }
      const bounceSpeed = Math.abs(p.nimbus.vy);
      p.nimbus.stretchX = 1 - Math.min(bounceSpeed * 0.008, 0.08);
      p.nimbus.stretchY = 1 + Math.min(bounceSpeed * 0.01, 0.1);
      if (p.nimbus.vy >= 0) {
        p.state = STATE.FALL;
        p.stateTimer = 0;
        p.nimbus.rotation = 0;
        p.nimbus.isFlipping = false;
        p.nimbus.flipAngle = 0;
        p.ringActive = false;
        p.ringProgress = 0;
        p.actionPressed = false;
        p.actionResult = "";
      }
      break;
    }
    case STATE.MISS: {
      if (!cloud) break;
      p.nimbus.expression = "sad";
      p.nimbus.pose = "idle";
      p.nimbus.stretchX = 1;
      p.nimbus.stretchY = 1;
      p.nimbus.isFlipping = false;
      p.nimbus.flipAngle = 0;
      if (gameMode === "1P") stopMusic();
      sfxMiss();
      const missDrawX = cloud.x - p.cameraX;
      addFloatingTextP(p, missDrawX, cloud.y - 80, "MISS!", MISS_RED, 32);
      cloud.squish = 0.3;
      p.screenShake.intensity = 5;
      p.nimbus.vy = -6;
      p.state = STATE.MISS_FALL;
      p.stateTimer = 0;
      p.alive = false;
      break;
    }
    case STATE.MISS_FALL: {
      p.nimbus.expression = "sad";
      p.nimbus.y += p.nimbus.vy;
      p.nimbus.vy += 0.6;
      p.nimbus.rotation += 0.08;
      if (p.nimbus.y >= GH + 50) {
        p.nimbus.rotation = 0;
        p.state = STATE.RESULTS;
        p.stateTimer = 0;
        if (gameMode === "1P") {
          setIdleTimer(0);
          if (p.score > 0 && isHighScore(p.score)) {
            setInitialsEntry({ active: true, chars: ["A", "A", "A"], pos: 0 });
          }
        } else {
          if (players.every((pl) => !pl.alive)) {
            setIdleTimer(0);
            stopMusic();
            const sorted = [...players].sort((a, b) => b.score - a.score);
            const queue = sorted
              .filter((pl) => pl.score > 0 && isHighScore(pl.score))
              .map((pl) => pl.index);
            setInitialsQueue(queue);
            if (queue.length > 0) {
              setInitialsPlayerIndex(queue[0]);
              setInitialsQueue(queue.slice(1));
              setInitialsEntry({ active: true, chars: ["A", "A", "A"], pos: 0 });
            }
          }
        }
      }
      break;
    }

    case STATE.BOSS_DEFEATED: {
      const bossCloud = p.clouds[p.clouds.length - 1];
      p.nimbus.expression = "excited";
      p.nimbus.pose = "bounce";
      const prog = Math.min(1, p.stateTimer / 2.0);
      if (bossCloud) {
        bossCloud.isBoss = false;
        bossCloud.type = 0;
        bossCloud.x = p.cameraX + vw / 2;
        bossCloud.y = GROUND_Y - 20;
        bossCloud.squish = Math.sin(prog * Math.PI) * 0.3;
        bossCloud.defeated = false;
      }
      p.nimbus.y = GROUND_Y - 80 - prog * 200;
      p.nimbus.vy = -12;

      if (p.stateTimer >= 2.0) {
        p.state = STATE.ASCEND;
        p.stateTimer = 0;
        p.phaseSpeedLines = [];
        sfxPhaseUp();
      }
      break;
    }
    case STATE.ASCEND: {
      p.nimbus.expression = "excited";
      p.nimbus.pose = "jump_up";
      const prog = Math.min(1, p.stateTimer / 1.5);

      const lineCount = prog < 0.4 ? 8 : prog < 0.8 ? 15 : 5;
      spawnSpeedLinesP(p, lineCount);

      const easeOut = 1 - Math.pow(1 - prog, 3);
      p.phaseSpeedLines = p.phaseSpeedLines.filter((l) => {
        l.y += l.speed;
        return l.y < GH + 100;
      });
      p.nimbus.y = GROUND_Y - 80 - easeOut * (GH + 100);
      if (prog < 0.1 || prog > 0.9)
        setPhaseTransitionFlash(
          0.3 * (prog < 0.1 ? 1 - prog * 10 : (prog - 0.9) * 10));
      if (p.stateTimer >= 1.5) {
        p.round++;
        setPhase(getPhase());
        const themeIdx = Math.min(phase - 1, SKY_THEMES.length - 1);
        setTargetSky({ ...SKY_THEMES[themeIdx] });
        updateMusicTempo();
        const newCamBase = p.cameraX + vw * 0.35;
        p.runPlatform = generateRunPlatform(newCamBase, p.round);
        const lastRC = p.runPlatform[p.runPlatform.length - 1];
        p.clouds = generateCloudChain(lastRC.x + 180, p.round);
        p.currentCloudIdx = 0;
        p.bossHits = 0;
        p.runX = p.runPlatform[0].x;
        p.runSpeed = 3 + Math.min(p.round * 0.5, 3);
        p.runAnimTimer = 0;
        p.nimbus.x = p.runX;
        p.nimbus.y = GROUND_Y - 40;
        p.nimbus.vy = 0;
        p.nimbus.rotation = 0;
        p.nimbus.isFlipping = false;
        p.nimbus.flipAngle = 0;
        p.phaseSpeedLines = [];
        p.ringActive = false;
        p.ringProgress = 0;
        p.actionPressed = false;
        p.actionResult = "";
        p.state = STATE.RUN_START;
        p.stateTimer = 0;
      }
      break;
    }

    case STATE.RESULTS: {
      if (gameMode === "1P") {
        setIdleTimer(idleTimer + dt);
        p.nimbus.expression = "sad";
        if (initialsEntry.active && p.inputJustPressed) {
          if (initialsEntry.pos >= 2) {
            const name = initialsEntry.chars.join("");
            addToLeaderboard(name, p.score, p.combo, p.round);
            setInitialsEntry({ ...initialsEntry, active: false });
            sfxSelect();
          } else {
            setInitialsEntry({ ...initialsEntry, pos: initialsEntry.pos + 1 });
            sfxSelect();
          }
        }
        if (!initialsEntry.active && p.stateTimer > 1.0 && p.inputJustPressed) {
          setState(STATE.TITLE);
          p.stateTimer = 0;
        }
        if (idleTimer > 30) {
          setState(STATE.TITLE);
          p.stateTimer = 0;
        }
      }
      break;
    }
  }
  p.inputJustPressed = false;
}

// ── Draw ──────────────────────────────────────────────────────────
function draw(dt) {
  ctx.save();

  if (state === STATE.TITLE) {
    drawTitleScreen();
  } else if (state === STATE.KEY_BIND) {
    drawKeyBindScreen();
  } else {
    if (gameMode === "2P") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 480, GH);
      ctx.clip();
      drawPlayerViewport(players[0], dt);
      drawHUD(players[0], 480);
      ctx.restore();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(480, 0);
      ctx.lineTo(480, GH);
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(480, 0, 480, GH);
      ctx.clip();
      ctx.translate(480, 0);
      drawPlayerViewport(players[1], dt);
      drawHUD(players[1], 480);
      ctx.restore();
      if (players.every((p) => !p.alive)) draw2PResultsScreen();
    } else {
      const p = players[0];
      if (p) {
        ctx.translate(p.screenShake.x, p.screenShake.y);
        drawPlayerViewport(p, dt);
        drawHUD(p, GW);
        if (p.state === STATE.RESULTS) drawResultsScreen(p);
      }
    }
  }

  if (phaseTransitionFlash > 0) {
    ctx.save();
    ctx.globalAlpha = phaseTransitionFlash;
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
  }
  ctx.restore();
}

// ── Resize ────────────────────────────────────────────────────────
function resize() {
  const aspect = GW / GH;
  const winAspect = window.innerWidth / window.innerHeight;
  let w, h;
  if (winAspect > aspect) {
    h = window.innerHeight;
    w = h * aspect;
  } else {
    w = window.innerWidth;
    h = w / aspect;
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}
window.addEventListener("resize", resize);

// ── Game loop ─────────────────────────────────────────────────────
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  update(dt);
  draw(dt);
  requestAnimationFrame(gameLoop);
}

// ── Init ──────────────────────────────────────────────────────────
setupInputHandlers(canvas);
loadLeaderboard();
initBgClouds(bgClouds);
initTitleClouds(titleClouds);
resize();
requestAnimationFrame(gameLoop);
