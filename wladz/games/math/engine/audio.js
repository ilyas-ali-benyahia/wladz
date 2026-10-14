// ── audio.js (v4) ─────────────────────────────────────────────────────────────
// Procedural Web Audio API — zero assets required.
// All voices route through one master gain so the game can be muted
// (M key / pause menu) without touching individual sounds.

export class AudioFX {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._muted = false;
  }

  get muted() { return this._muted; }

  setMuted(m) {
    this._muted = m;
    if (this._master) this._master.gain.value = m ? 0 : 1;
  }

  // Lazily create the context on first user gesture; if Web Audio is
  // unavailable the game keeps running silently.
  _ac() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this._ctx = null;
        return null;
      }
      this._master = this._ctx.createGain();
      this._master.gain.value = this._muted ? 0 : 1;
      this._master.connect(this._ctx.destination);
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  _tone({ freq = 440, type = 'sine', gain = 0.35, dur = 0.12, start = 0, freqEnd }) {
    const ac = this._ac();
    if (!ac) return;
    const t  = ac.currentTime + start;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this._master);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  _noise({ gain = 0.3, dur = 0.09, start = 0, freq = 700 }) {
    const ac  = this._ac();
    if (!ac) return;
    const t = ac.currentTime + start;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this._master);
    src.start(t);
  }

  shoot() {
    this._tone({ freq: 1400, freqEnd: 600, type: 'sawtooth', gain: 0.22, dur: 0.08 });
    this._noise({ gain: 0.18, dur: 0.06, start: 0.01, freq: 1200 });
  }

  correct() {
    [0, 0.08, 0.16, 0.24].forEach((s, i) => {
      this._tone({ freq: [523, 659, 784, 1047][i], type: 'sine', gain: 0.32, dur: 0.2, start: s });
    });
  }

  // ⚡ fast-answer sparkle — layered over the correct arpeggio
  bonus() {
    this._tone({ freq: 1568, type: 'sine',  gain: 0.18, dur: 0.14, start: 0.1 });
    this._tone({ freq: 2093, type: 'sine',  gain: 0.14, dur: 0.18, start: 0.18 });
  }

  // SURGE wave klaxon — two urgent low blips
  surge() {
    this._tone({ freq: 196, type: 'square', gain: 0.2, dur: 0.16 });
    this._tone({ freq: 165, type: 'square', gain: 0.2, dur: 0.22, start: 0.2 });
  }

  wrong() {
    this._tone({ freq: 130, type: 'sawtooth', gain: 0.42, dur: 0.28 });
    this._tone({ freq: 105, type: 'square',   gain: 0.28, dur: 0.22, start: 0.04 });
    this._noise({ gain: 0.22, dur: 0.18, start: 0.02, freq: 400 });
  }

  waveStart() {
    [0, 0.09, 0.18].forEach((s, i) => {
      this._tone({ freq: [330, 440, 550][i], type: 'triangle', gain: 0.22, dur: 0.22, start: s });
    });
  }

  gameOver() {
    this._tone({ freq: 220, freqEnd: 55, type: 'sawtooth', gain: 0.45, dur: 1.1 });
    this._tone({ freq: 110, type: 'sine', gain: 0.3, dur: 1.3, start: 0.1 });
    this._noise({ gain: 0.15, dur: 0.8, start: 0.05, freq: 300 });
  }

  ui() {
    this._tone({ freq: 880, type: 'triangle', gain: 0.14, dur: 0.07 });
  }
}
