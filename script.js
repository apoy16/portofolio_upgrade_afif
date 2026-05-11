/* ════════════════════════════════════
   TECH CANVAS ANIMATED BACKGROUND
   Circuit board + data flow animation
════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('techCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, nodes = [], connections = [], packets = [], scanLine = 0;

  const ACCENT = '#00d4ff';
  const ACCENT_DIM = 'rgba(0,212,255,';

  /* ── Resize ── */
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildCircuit();
  }

  /* ── Build circuit nodes ── */
  function buildCircuit() {
    nodes = [];
    connections = [];
    packets = [];

    const cols = Math.floor(W / 80);
    const rows = Math.floor(H / 80);
    const spacingX = W / cols;
    const spacingY = H / rows;

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (Math.random() < 0.65) {
          const jitter = 18;
          nodes.push({
            x: c * spacingX + (Math.random() - 0.5) * jitter,
            y: r * spacingY + (Math.random() - 0.5) * jitter,
            size: Math.random() > 0.85 ? 3.5 : Math.random() > 0.6 ? 2 : 1.2,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.02,
            bright: Math.random() > 0.8,
          });
        }
      }
    }

    /* Connect nearby nodes like a circuit board (orthogonal preference) */
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const nearby = nodes
        .map((b, j) => ({ j, dist: Math.hypot(b.x - a.x, b.y - a.y) }))
        .filter(({ j, dist }) => j !== i && dist < 130)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      nearby.forEach(({ j }) => {
        const key = [Math.min(i, j), Math.max(i, j)].join('-');
        if (!connections.find(c => c.key === key)) {
          connections.push({
            key, a: i, b: j,
            opacity: 0.08 + Math.random() * 0.12,
            active: false,
            activeDuration: 0,
          });
        }
      });
    }

    /* Seed some data packets */
    for (let i = 0; i < 12; i++) spawnPacket();
  }

  function spawnPacket() {
    if (connections.length === 0) return;
    const conn = connections[Math.floor(Math.random() * connections.length)];
    packets.push({
      conn,
      t: 0,
      speed: 0.004 + Math.random() * 0.006,
      size: 1.5 + Math.random() * 1.5,
      color: Math.random() > 0.3 ? ACCENT : '#0066ff',
    });
  }

  /* ── Draw ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Deep background gradient */
    const bg = ctx.createRadialGradient(W * 0.4, H * 0.3, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
    bg.addColorStop(0, 'rgba(0,30,50,0.4)');
    bg.addColorStop(0.5, 'rgba(0,15,28,0.3)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Grid overlay (very subtle) */
    ctx.strokeStyle = 'rgba(0,212,255,0.025)';
    ctx.lineWidth = 0.5;
    const gSpacing = 50;
    for (let x = 0; x < W; x += gSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* Connections */
    connections.forEach(conn => {
      const a = nodes[conn.a], b = nodes[conn.b];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);

      /* Orthogonal style: go horizontal then vertical */
      if (Math.abs(b.x - a.x) > Math.abs(b.y - a.y)) {
        ctx.lineTo(b.x, a.y);
        ctx.lineTo(b.x, b.y);
      } else {
        ctx.lineTo(a.x, b.y);
        ctx.lineTo(b.x, b.y);
      }

      ctx.strokeStyle = ACCENT_DIM + conn.opacity + ')';
      ctx.lineWidth = conn.active ? 1.2 : 0.6;
      ctx.stroke();
    });

    /* Data packets */
    packets.forEach(pkt => {
      const a = nodes[pkt.conn.a], b = nodes[pkt.conn.b];
      const t = pkt.t;

      let px, py;
      if (Math.abs(b.x - a.x) > Math.abs(b.y - a.y)) {
        if (t < 0.5) {
          px = a.x + (b.x - a.x) * t * 2;
          py = a.y;
        } else {
          px = b.x;
          py = a.y + (b.y - a.y) * (t - 0.5) * 2;
        }
      } else {
        if (t < 0.5) {
          px = a.x;
          py = a.y + (b.y - a.y) * t * 2;
        } else {
          px = a.x + (b.x - a.x) * (t - 0.5) * 2;
          py = b.y;
        }
      }

      /* Glow trail */
      const grad = ctx.createRadialGradient(px, py, 0, px, py, pkt.size * 4);
      grad.addColorStop(0, pkt.color.replace(')', ', 0.8)').replace('rgb', 'rgba').replace('#00d4ff', 'rgba(0,212,255,0.8)').replace('#0066ff', 'rgba(0,102,255,0.8)'));
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(px, py, pkt.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
      ctx.fillStyle = pkt.color === ACCENT ? 'rgba(0,212,255,0.95)' : 'rgba(0,102,255,0.95)';
      ctx.fill();
    });

    /* Nodes */
    nodes.forEach(node => {
      node.pulse += node.pulseSpeed;
      const glow = (Math.sin(node.pulse) + 1) * 0.5;
      const alpha = node.bright ? 0.5 + glow * 0.5 : 0.15 + glow * 0.15;

      /* Outer glow */
      const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 5);
      g.addColorStop(0, ACCENT_DIM + alpha * 0.4 + ')');
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * 5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      /* Core */
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT_DIM + alpha + ')';
      ctx.fill();
    });

    /* Horizontal scan line */
    scanLine = (scanLine + 0.4) % H;
    const scanGrad = ctx.createLinearGradient(0, scanLine - 40, 0, scanLine + 40);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.5, 'rgba(0,212,255,0.04)');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanLine - 40, W, 80);
  }

  /* ── Update ── */
  function update() {
    packets.forEach(pkt => {
      pkt.t += pkt.speed;
    });

    /* Remove finished packets and spawn new */
    for (let i = packets.length - 1; i >= 0; i--) {
      if (packets[i].t >= 1) {
        packets.splice(i, 1);
        spawnPacket();
      }
    }

    /* Randomly activate connections */
    connections.forEach(conn => {
      if (conn.active) {
        conn.activeDuration--;
        if (conn.activeDuration <= 0) conn.active = false;
      } else if (Math.random() < 0.001) {
        conn.active = true;
        conn.activeDuration = 20 + Math.random() * 40;
      }
    });
  }

  /* ── Loop ── */
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();


/* ════════════════════════════════════
   TYPEWRITER EFFECT
════════════════════════════════════ */
(function () {
  const el = document.getElementById('typewriter');
  const phrases = [
    'IT Enthusiast',
    'Web Developer',
    'Keamanan Digital',
    'Mahasiswa SI UNIKMA',
    'Hardware Enthusiast',
  ];
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
      setTimeout(tick, 80 + Math.random() * 40);
    } else {
      el.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 45);
    }
  }
  setTimeout(tick, 800);
})();


/* ════════════════════════════════════
   ACTIVE NAV ON SCROLL
════════════════════════════════════ */
(function () {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = ['home', 'about', 'projects', 'contact'];

  function onScroll() {
    let current = 'home';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 200) current = id;
    });

    navItems.forEach(item => {
      const href = item.getAttribute('href').replace('#', '');
      item.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ════════════════════════════════════
   CONTACT FORM
════════════════════════════════════ */
(function () {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      success.classList.add('show');
      form.reset();
      setTimeout(() => success.classList.remove('show'), 5000);
    });
  }
})();


/* ════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════ */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: none; }
  `;
  document.head.appendChild(style);

  const targets = [
    ...document.querySelectorAll('.about-grid, .project-card, .contact-card, .contact-form, .stat-box, .skill-item'),
  ];
  targets.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => obs.observe(el));
})();


// Mouse Parallax Futuristic Scene
const scene = document.querySelector('.isometric-scene');
document.addEventListener('mousemove', (e) => {
  if(!scene) return;
  const x = (window.innerWidth / 2 - e.clientX) / 40;
  const y = (window.innerHeight / 2 - e.clientY) / 40;
  scene.style.transform = `translate(${x}px, ${y}px)`;
});

// Dynamic glow effect
const cards = document.querySelectorAll('.project-card, .skill-card');
cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0,212,255,0.18), rgba(10,21,32,0.9) 40%)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '';
  });
});
