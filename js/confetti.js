// Lightweight high-performance Canvas Confetti & Burst Engine

class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308'];
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'confetti-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '9999';
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  // Micro-burst from a specific element (e.g. checkbox click)
  burstAtElement(element, count = 28) {
    this.init();
    const rect = element.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3.5 + Math.random() * 5.5;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        radius: 3 + Math.random() * 3,
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: 0.1 + Math.random() * 0.1,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        shape: Math.random() > 0.4 ? 'circle' : 'rect'
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  // Full-screen triumphant celebration for Triple Win
  celebrateTripleWin() {
    this.init();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Two cannon blasts from left and right corners
    const origins = [
      { x: w * 0.15, y: h * 0.85, angleSpread: [-Math.PI * 0.6, -Math.PI * 0.2] },
      { x: w * 0.85, y: h * 0.85, angleSpread: [-Math.PI * 0.8, -Math.PI * 0.4] },
      { x: w * 0.5, y: h * 0.5, angleSpread: [-Math.PI, Math.PI] }
    ];

    origins.forEach(orig => {
      for (let i = 0; i < 60; i++) {
        const angle = orig.angleSpread[0] + Math.random() * (orig.angleSpread[1] - orig.angleSpread[0]);
        const speed = 7 + Math.random() * 9;
        this.particles.push({
          x: orig.x,
          y: orig.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          width: 7 + Math.random() * 7,
          height: 10 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          life: 1.0,
          decay: 0.008 + Math.random() * 0.012,
          gravity: 0.22,
          shape: 'confetti'
        });
      }
    });

    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.15;
      p.vx *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life);

      if (p.shape === 'confetti') {
        p.rotation += p.rotationSpeed;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      } else if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      if (this.ctx) {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }
  }
}

window.confettiEngine = new ConfettiEngine();
