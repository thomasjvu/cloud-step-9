// ═══════════════════════════════════════════════════════════════════
// Input Module - Keyboard, mouse, and touch event handlers
// ═══════════════════════════════════════════════════════════════════

import { GW, GH } from './constants.js';
import { STATE } from './state.js';
import {
  state, gameMode, players, playerKeys, titleSelection,
  keyBindingPhase, globalInputPressed, globalInputJustPressed,
  showLeaderboardFromTitle, initialsEntry, initialsPlayerIndex,
  setTitleSelection, setKeyBindingPhase, setGlobalInputPressed,
  setGlobalInputJustPressed, setShowLeaderboardFromTitle,
  setPlayerKeys,
} from './state.js';
import { initAudio, sfxSelect, sfxStart } from './audio.js';

let _startGameCallback = null;
let _handleInitialsKeyCallback = null;

export function setStartGameCallback(fn) { _startGameCallback = fn; }

export function formatKeyLabel(code) {
  return code
    .replace("Key", "")
    .replace("Digit", "")
    .replace("ShiftLeft", "L-SHIFT")
    .replace("ShiftRight", "R-SHIFT")
    .replace("ControlLeft", "L-CTRL")
    .replace("ControlRight", "R-CTRL")
    .replace("AltLeft", "L-ALT")
    .replace("AltRight", "R-ALT")
    .replace("Space", "SPACE")
    .replace("Enter", "ENTER");
}

export function handleInitialsKey(e) {
  const p = initialsEntry.pos;
  if (e.code === "ArrowUp" || e.code === "KeyW") {
    sfxSelect();
    const c = initialsEntry.chars[p].charCodeAt(0);
    initialsEntry.chars[p] = String.fromCharCode(c >= 90 ? 65 : c + 1);
  } else if (e.code === "ArrowDown" || e.code === "KeyS") {
    sfxSelect();
    const c = initialsEntry.chars[p].charCodeAt(0);
    initialsEntry.chars[p] = String.fromCharCode(c <= 65 ? 90 : c - 1);
  } else if (e.code === "ArrowRight" || e.code === "KeyD") {
    if (p < 2) {
      initialsEntry.pos++;
      sfxSelect();
    }
  } else if (e.code === "ArrowLeft") {
    if (p > 0) {
      initialsEntry.pos--;
      sfxSelect();
    }
  }
}

export function setupInputHandlers(canvas) {
  document.addEventListener("keydown", (e) => {
    initAudio();

    if (state === STATE.TITLE) {
      if (e.code === "ArrowLeft") {
        setTitleSelection((titleSelection - 1 + 3) % 3);
        sfxSelect();
      }
      if (e.code === "ArrowRight") {
        setTitleSelection((titleSelection + 1) % 3);
        sfxSelect();
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!globalInputPressed) {
          setGlobalInputPressed(true);
          setGlobalInputJustPressed(true);
        }
      }
      if (e.code === "KeyL") setShowLeaderboardFromTitle(!showLeaderboardFromTitle);
      return;
    }

    if (state === STATE.KEY_BIND) {
      if (keyBindingPhase === 1) {
        const newKeys = [...playerKeys];
        newKeys[0] = { key: e.code, label: formatKeyLabel(e.code) };
        setPlayerKeys(newKeys);
        setKeyBindingPhase(2);
        sfxSelect();
      } else if (keyBindingPhase === 2) {
        if (e.code !== playerKeys[0].key) {
          const newKeys = [...playerKeys];
          newKeys[1] = { key: e.code, label: formatKeyLabel(e.code) };
          setPlayerKeys(newKeys);
          setKeyBindingPhase(0);
          sfxStart();
          if (_startGameCallback) _startGameCallback();
        }
      }
      return;
    }

    // Gameplay
    if (gameMode === "1P") {
      if (e.code === "Space" || e.code === "KeyA" || e.code === "Enter") {
        e.preventDefault();
        const p = players[0];
        if (p && !p.inputPressed) {
          p.inputPressed = true;
          p.inputJustPressed = true;
        }
      }
      if (
        players[0] &&
        players[0].state === STATE.RESULTS &&
        initialsEntry.active
      )
        handleInitialsKey(e);
    } else {
      players.forEach((p, i) => {
        if (e.code === playerKeys[i].key && !p.inputPressed) {
          e.preventDefault();
          p.inputPressed = true;
          p.inputJustPressed = true;
        }
      });
      if (players.every((p) => !p.alive) && initialsEntry.active)
        handleInitialsKey(e);
      if (
        players.every((p) => !p.alive) &&
        (e.code === "Space" || e.code === "Enter")
      ) {
        if (!globalInputPressed) {
          setGlobalInputPressed(true);
          setGlobalInputJustPressed(true);
        }
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (gameMode === "1P") {
      if (e.code === "Space" || e.code === "KeyA" || e.code === "Enter") {
        if (players[0]) players[0].inputPressed = false;
      }
    } else {
      players.forEach((p, i) => {
        if (e.code === playerKeys[i].key) p.inputPressed = false;
      });
    }
    if (e.code === "Space" || e.code === "Enter") setGlobalInputPressed(false);
  });

  // Mouse/touch
  canvas.addEventListener("mousedown", (e) => {
    initAudio();
    if (state === STATE.TITLE || state === STATE.KEY_BIND) {
      if (!globalInputPressed) {
        setGlobalInputPressed(true);
        setGlobalInputJustPressed(true);
      }
      return;
    }
    if (gameMode === "1P") {
      const p = players[0];
      if (p && !p.inputPressed) {
        p.inputPressed = true;
        p.inputJustPressed = true;
      }
    } else {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * GW;
      const idx = mx < 480 ? 0 : 1;
      const p = players[idx];
      if (p && !p.inputPressed) {
        p.inputPressed = true;
        p.inputJustPressed = true;
      }
    }
  });
  canvas.addEventListener("mouseup", () => {
    players.forEach((p) => {
      if (p) p.inputPressed = false;
    });
    setGlobalInputPressed(false);
  });
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      initAudio();
      if (state === STATE.TITLE || state === STATE.KEY_BIND) {
        if (!globalInputPressed) {
          setGlobalInputPressed(true);
          setGlobalInputJustPressed(true);
        }
        return;
      }
      if (gameMode === "1P") {
        const p = players[0];
        if (p && !p.inputPressed) {
          p.inputPressed = true;
          p.inputJustPressed = true;
        }
      } else {
        const rect = canvas.getBoundingClientRect();
        for (const touch of e.changedTouches) {
          const mx = ((touch.clientX - rect.left) / rect.width) * GW;
          const idx = mx < 480 ? 0 : 1;
          const p = players[idx];
          if (p && !p.inputPressed) {
            p.inputPressed = true;
            p.inputJustPressed = true;
          }
        }
      }
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => {
    players.forEach((p) => {
      if (p) p.inputPressed = false;
    });
    setGlobalInputPressed(false);
  });
}
