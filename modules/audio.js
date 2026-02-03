// ═══════════════════════════════════════════════════════════════════
// Audio Module - Web Audio API music and sound effects
// ═══════════════════════════════════════════════════════════════════

import { phase } from './state.js';

// ── Cloud9 EDM Synth Engine ──────────────────────────────────────
const Audio = {
  ctx: null,
  master: null,
  compressor: null,
  init: function() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  },

  playKick: function(time) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.12);
  },

  playSnare: function(time) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.1;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(t);
  },

  playHiHat: function(time, open = false) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(open ? 3000 : 4000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.15 : 0.03));

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + (open ? 0.15 : 0.03));
  },

  playBass: function(freq, time, len) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 1.05, t + 0.05);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 4, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.25);
  },

  playBell: function(time) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    const freq1 = 800;
    const freq2 = 540;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "triangle";
    osc2.type = "triangle";
    osc1.frequency.value = freq1;
    osc2.frequency.value = freq2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.master);

    osc1.start(t); osc2.start(t);
    osc1.stop(t + 0.1); osc2.stop(t + 0.1);
  },

  playSuperSaw: function(freq, time, len) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + len);
    gain.connect(this.master);

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * 2, t);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 6;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gain);
    lfo.start(t);
    osc.start(t);
    lfo.stop(t + len);
    osc.stop(t + len);
  }
};

// Compatibility shim for old sfx calls
function initAudio() { Audio.init(); }
function playTone(f,d,t,v) {
  if(!Audio.ctx) return;
  const o = Audio.ctx.createOscillator();
  const g = Audio.ctx.createGain();
  o.type = t || "sine";
  o.frequency.setValueAtTime(f, Audio.ctx.currentTime);
  g.gain.setValueAtTime(v||0.1, Audio.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, Audio.ctx.currentTime + d);
  o.connect(g); g.connect(Audio.master); o.start(); o.stop(Audio.ctx.currentTime+d);
}

// SFX Wrappers
function sfxJump() { playTone(440, 0.1, "sine", 0.3); playTone(880, 0.15, "sine", 0.2); }
function sfxStomp() { Audio.playKick(); playTone(200, 0.1, "square", 0.2); }
function sfxPerfect() { Audio.playSuperSaw(880, Audio.ctx.currentTime, 0.3); Audio.playSuperSaw(1100, Audio.ctx.currentTime+0.1, 0.4); }
function sfxBounce() { Audio.playBass(220, Audio.ctx.currentTime, 0.3); }
function sfxMiss() { playTone(150, 0.4, "sawtooth", 0.3); playTone(100, 0.4, "sawtooth", 0.3); }
function sfxCloud9() {
  [523,659,784,1047,1319].forEach((f,i) => setTimeout(()=>Audio.playSuperSaw(f,Audio.ctx.currentTime, 0.4), i*100));
}
function sfxStart() { Audio.playSuperSaw(440, Audio.ctx.currentTime, 0.5); }
function sfxPhaseUp() {
    if(!Audio.ctx) return;
    const o = Audio.ctx.createOscillator();
    const g = Audio.ctx.createGain();
    o.frequency.setValueAtTime(220, Audio.ctx.currentTime);
    o.frequency.linearRampToValueAtTime(880, Audio.ctx.currentTime+1.0);
    g.gain.value = 0.2;
    g.gain.linearRampToValueAtTime(0, Audio.ctx.currentTime+1.0);
    o.connect(g); g.connect(Audio.master); o.start(); o.stop(Audio.ctx.currentTime+1);
}
function sfxSelect() { playTone(880, 0.05, "triangle", 0.1); }


// ── EDM Sequencer (Happy Hardcore / Chibi) ─────────────────────
const PENTA_C = [261.63, 293.66, 329.63, 392.00, 440.00];
const MELODY_PATTERN = [0, 2, 4, 2, 4, 3, 2, 1, 0, 2, 4, 3, 2, 0, 1, 0];

export let musicPlaying = false;
export let musicBPM = 180;
export let musicBeat = 0;
let nextNoteTime = 0;
let musicTimerID = null;
export let lastStompOnBeat = false;
export let beatPulse = 0;
export let rhythmBonusText = 0;

function startMusic() {
  if (!Audio.ctx || musicPlaying) return;
  Audio.ctx.resume();
  musicPlaying = true;
  musicBeat = 0;
  nextNoteTime = Audio.ctx.currentTime + 0.1;
  scheduler();
}

function stopMusic() {
  musicPlaying = false;
  clearTimeout(musicTimerID);
}

function scheduler() {
  if (!musicPlaying) return;
  while (nextNoteTime < Audio.ctx.currentTime + 0.1) {
    scheduleBeat(musicBeat, nextNoteTime);
    nextNoteTime += (60.0 / musicBPM) / 4;
    musicBeat = (musicBeat + 1) % 64;
  }
  musicTimerID = setTimeout(scheduler, 25);
}

function scheduleBeat(beat16, time) {
    const step = beat16 % 16;

    const isKick = (step % 4 === 0);
    const isSnare = (step % 8 === 4);

    if (isKick) beatPulse = 1;
    if (isKick) Audio.playKick(time);
    if (isSnare) Audio.playSnare(time);

    if (step % 4 === 2) {
        Audio.playBass(PENTA_C[0] / 2, time, 0.2);
    }

    if (step % 2 !== 0) {
        Audio.playHiHat(time, false);
    }
    if (step === 3 || step === 11) {
        Audio.playHiHat(time, true);
    }

    if (step === 0 && (beat16 % 32 === 0 || beat16 % 32 === 16)) {
        Audio.playBell(time);
    }

    if (step % 2 === 0) {
        const noteIdx = MELODY_PATTERN[Math.floor(beat16/2)%16];
        const freq = PENTA_C[noteIdx] * (phase >= 3 ? 2 : 1);

        if (phase >= 1) Audio.playSuperSaw(freq, time, 0.15);
    }
}

function getMusicBPM() {
  return Math.min(220, 180 + (phase - 1) * 10);
}
function updateMusicTempo() {
  musicBPM = getMusicBPM();
}

function getBeatAccuracy() {
    if (!Audio.ctx || !musicPlaying) return 0;
    return 0;
}

// Exports
export { Audio };
export { initAudio, playTone };
export { sfxJump, sfxStomp, sfxPerfect, sfxBounce, sfxMiss, sfxCloud9, sfxStart, sfxPhaseUp, sfxSelect };
export { startMusic, stopMusic, getMusicBPM, updateMusicTempo, getBeatAccuracy };

export function setBeatPulse(val) { beatPulse = val; }
export function setRhythmBonusText(val) { rhythmBonusText = val; }
export function setLastStompOnBeat(val) { lastStompOnBeat = val; }
