// High-performance Web Audio API synthesizer for zero-latency sound effects & ambient noise

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientNode = null;
    this.ambientGain = null;
    this.currentAmbientType = null;
    
    // Load preference
    const saved = localStorage.getItem('three_wins_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem('three_wins_sound_enabled', this.enabled);
    if (!this.enabled && this.ambientNode) {
      this.stopAmbient();
    }
    return this.enabled;
  }

  // Tactile pop / tick on click
  playPop() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    
    // Quick pitch drop for a subtle tactile click
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Harmonic chime for completing a single Win
  playWinChime(winIndex = 0) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Frequencies tailored to win number (rising triumph: C5, E5, G5)
    const baseFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    const freq = baseFreqs[winIndex % baseFreqs.length] || 587.33;

    const now = this.ctx.currentTime;
    
    // Dual oscillator for rich warmth
    [freq, freq * 2].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);

      const initialVolume = i === 0 ? 0.22 : 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(initialVolume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    });
  }

  // Grand triumph fanfare for completing all 3 wins (Triple Win)
  playTripleWinFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Major chord arpeggio: C5 -> E5 -> G5 -> C6 shimmer
    const notes = [
      { f: 523.25, time: 0, dur: 0.8 },
      { f: 659.25, time: 0.12, dur: 0.8 },
      { f: 783.99, time: 0.24, dur: 0.9 },
      { f: 1046.50, time: 0.38, dur: 1.4 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(0.24, now + n.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // Timer complete chime
  playTimerBell() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  // Ambient focus noise generator (rain, brown noise)
  startAmbient(type = 'rain') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopAmbient();
    this.currentAmbientType = type;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        // Rain approximation
        const b0 = 0.05 * white;
        output[i] = b0 * 2.0;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    if (type === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 350;
    } else {
      filter.type = 'bandpass';
      filter.frequency.value = 850;
      filter.Q.value = 0.9;
    }

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    whiteNoise.start(0);
    this.ambientNode = whiteNoise;
  }

  stopAmbient() {
    if (this.ambientNode) {
      try {
        this.ambientNode.stop();
        this.ambientNode.disconnect();
      } catch (e) {}
      this.ambientNode = null;
    }
    this.currentAmbientType = null;
  }
}

window.soundEngine = new SoundEngine();
