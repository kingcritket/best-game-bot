// Mothlight — all sound is synthesised with WebAudio: no audio files.
// Short blips and sweeps for every action, plus a quiet generative music
// loop (a pentatonic melody over a soft pad) that starts on first input.
// Everything is guarded so the game still runs where audio is unavailable.

const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const BASS = [0, 0, -5, 7, -2, 5];

export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    muted: false,
    musicOn: false,
    musicTimer: null,
    step: 0,

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return false;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.16;
        this.musicGain.connect(this.master);
        return true;
      } catch {
        return false;
      }
    },

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
      }
    },

    tone(freq, dur, type, vol, when = 0, slideTo = null) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },

    pickup(combo) {
      if (!this.ensure()) return;
      const step = Math.min(combo, 14);
      const base = 523 * Math.pow(2, PENTA[step % PENTA.length] / 12);
      this.tone(base, 0.12, 'sine', 0.22);
      this.tone(base * 2, 0.09, 'sine', 0.08);
    },

    bank(count) {
      if (!this.ensure()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, i * 0.055));
      if (count >= 8) this.tone(1318.5, 0.3, 'sine', 0.1, 0.24);
    },

    dash() {
      if (!this.ensure()) return;
      this.tone(880, 0.18, 'sawtooth', 0.07, 0, 180);
      this.tone(220, 0.14, 'sine', 0.12, 0, 90);
    },

    wispPop() {
      if (!this.ensure()) return;
      this.tone(320, 0.2, 'square', 0.09, 0, 60);
      this.tone(660, 0.12, 'sine', 0.1, 0.02, 990);
    },

    hurt() {
      if (!this.ensure()) return;
      this.tone(160, 0.35, 'sawtooth', 0.18, 0, 55);
      this.tone(90, 0.3, 'sine', 0.2, 0, 40);
    },

    powerup() {
      if (!this.ensure()) return;
      [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.14, i * 0.05));
    },

    // Lantern Nova: a bright rising chord as every wisp scatters.
    nova() {
      if (!this.ensure()) return;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.15, i * 0.04));
      this.tone(180, 0.4, 'sine', 0.16, 0, 60);
    },

    // Greed Bonus: a quick golden arpeggio when a big bank lands.
    greed() {
      if (!this.ensure()) return;
      [783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.14, i * 0.05));
    },

    // The Sovereign wakes: a low swell that says something big is here.
    roar() {
      if (!this.ensure()) return;
      this.tone(220, 0.7, 'sawtooth', 0.14, 0, 55);
      this.tone(110, 0.8, 'sine', 0.2, 0, 40);
    },

    // One tick per second in the last ten seconds of a wave.
    tick() {
      if (!this.ensure()) return;
      this.tone(1200, 0.05, 'square', 0.07);
    },

    waveClear() {
      if (!this.ensure()) return;
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        this.tone(f, 0.28, 'triangle', 0.15, i * 0.07),
      );
    },

    win() {
      if (!this.ensure()) return;
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) =>
        this.tone(f, 0.4, 'triangle', 0.16, i * 0.11),
      );
    },

    lose() {
      if (!this.ensure()) return;
      [392, 329.63, 261.63, 196].forEach((f, i) => this.tone(f, 0.42, 'triangle', 0.15, i * 0.16));
    },

    click() {
      if (!this.ensure()) return;
      this.tone(660, 0.07, 'sine', 0.14);
    },

    startMusic() {
      if (!this.ensure() || this.musicOn) return;
      this.musicOn = true;
      this.step = 0;
      this.musicTimer = window.setInterval(() => {
        if (this.muted || !this.ctx) return;
        const s = this.step++;
        const t = this.ctx.currentTime;
        // A soft bass note every two steps, a sparse pentatonic pluck above.
        if (s % 2 === 0) {
          const bass = 110 * Math.pow(2, BASS[(s / 2) % BASS.length | 0] / 12);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = bass;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + 1.5);
        }
        if (s % 3 === 1) {
          const note = 523.25 * Math.pow(2, PENTA[(s * 7) % PENTA.length] / 12);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = note;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + 1.0);
        }
      }, 340);
    },
  };
  return audio;
}
