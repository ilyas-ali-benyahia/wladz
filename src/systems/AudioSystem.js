export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.isInitialized = false;
    this.musicInterval = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.isInitialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn('WebAudio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    } else if (!muted && !this.musicInterval) {
      this.startAmbientMusic();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  // --- Sound Effects Synthesizers ---

  playTone(freq, duration = 0.2, type = 'sine', decay = true) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playFootstep() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.08);
  }

  playJump() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.16);
  }

  playTrashCollect() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sweet two-tone bell
    [523.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(this.volume * 0.35, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.25);
    });
  }

  playPlantTree() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Rich harmonic chime
    [293.66, 369.99, 440.00].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(this.volume * 0.3, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.35);
    });
  }

  playWaterTree() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Bubbling water trickle
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = 600 + Math.random() * 500;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(this.volume * 0.18, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    }
  }

  playCorrectAnswer() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Major Arpeggio: C5 -> E5 -> G5 -> C6
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(this.volume * 0.38, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }

  playWrongAnswer() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    [260, 220].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(this.volume * 0.16, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.22);
    });
  }

  playMissionComplete() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Joyful celebration fanfare
    const notes = [
      { f: 440.00, t: 0.0 },
      { f: 554.37, t: 0.12 },
      { f: 659.25, t: 0.24 },
      { f: 880.00, t: 0.38 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(this.volume * 0.4, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + 0.6);
    });
  }

  playClick() {
    this.playTone(880, 0.05, 'sine');
  }

  playPoliceSiren() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Two-tone European/Algerian police wail
    [700, 950].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);

      gain.gain.setValueAtTime(this.volume * 0.15, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.22);
    });
  }

  playFireSiren() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Deep two-tone civil protection horn
    [450, 600].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.28);

      gain.gain.setValueAtTime(this.volume * 0.2, now + idx * 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.28 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.28);
      osc.stop(now + idx * 0.28 + 0.28);
    });
  }

  playCrosswalkBeep() {
    this.playTone(1200, 0.08, 'sine');
  }

  startAmbientMusic() {
    if (this.musicInterval) return;

    // Gentle soothing oriental/pentatonic background tones
    const scale = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
    let noteIdx = 0;

    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() > 0.45) return; // pleasant gentle pacing

      const freq = scale[Math.floor(Math.random() * scale.length)];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.05, now + 0.5); // Very soft
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.8);

      noteIdx++;
    }, 1800);
  }
}

export const audio = new AudioSystem();
