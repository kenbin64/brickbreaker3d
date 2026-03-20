/* ═══════════════════════════════════════════════════════════════════
   KEN'S GAMES — 80s ARCADE MANIFOLD BEHAVIOR v2.0
   ═══════════════════════════════════════════════════════════════════
   z = x · y — every interaction is a manifold surface.
   SVG faces: vector shapes that grow without losing quality.
   Enveloping parallax: multi-depth layers respond to scroll + mouse.
   80s Arcade: neon grid, CRT flicker, synthwave atmosphere.
   ═══════════════════════════════════════════════════════════════════ */

;(function () {
  'use strict';

  const PHI   = 1.618033988749895;
  const PHI_I = 0.618033988749895;
  const TAU   = Math.PI * 2;
  const FIB   = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987];

  /* ─── Neon palette ─── */
  const NEON = [
    '#ff2d95',  /* pink   */
    '#00d4ff',  /* blue   */
    '#b24dff',  /* purple */
    '#39ff14',  /* green  */
    '#ffe600',  /* yellow */
    '#ff6b00',  /* orange */
    '#ff073a',  /* red    */
  ];

  /* ─────────────────────────────────────────────────
     SVG FACE FACTORY — Vector shapes, infinite scale
     ───────────────────────────────────────────────── */

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  /* Create a complete SVG element with viewBox centered at 0,0 */
  function createSVG(size, content, color) {
    const svg = svgEl('svg', {
      viewBox: `-${size} -${size} ${size * 2} ${size * 2}`,
      width: '100%', height: '100%',
    });
    svg.style.filter = `drop-shadow(0 0 8px ${color}44) drop-shadow(0 0 21px ${color}22)`;
    svg.appendChild(content);
    return svg;
  }

  /* Shape 1: Icosahedron wireframe — 12 vertices projected */
  function svgIcosahedron(color, phase) {
    const g = svgEl('g', {});
    const t = (1 + Math.sqrt(5)) / 2;
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ];
    const edges = [
      [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
      [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],
      [7,8],[7,10],[8,9],[10,11],
    ];
    const s = 22;
    const ca = Math.cos(phase), sa = Math.sin(phase);
    const proj = verts.map(([x, y, z]) => {
      const ry = x * ca - z * sa;
      const rz = x * sa + z * ca;
      return [ry * s, y * s];
    });
    edges.forEach(([a, b]) => {
      g.appendChild(svgEl('line', {
        x1: proj[a][0], y1: proj[a][1],
        x2: proj[b][0], y2: proj[b][1],
        stroke: color, 'stroke-width': 1.5, opacity: 0.6,
      }));
    });
    return createSVG(60, g, color);
  }

  /* Shape 2: Pyramid — 4-face tetrahedron */
  function svgPyramid(color, phase) {
    const g = svgEl('g', {});
    const ca = Math.cos(phase), sa = Math.sin(phase);
    const apex = [0, -35];
    const s = 28;
    const baseVerts = [0, 1, 2].map(i => {
      const a = (i * TAU / 3) + phase * 0.5;
      return [Math.cos(a) * s, 18 + Math.sin(a) * s * 0.35];
    });
    /* Base triangle */
    const basePts = baseVerts.map(p => p.join(',')).join(' ');
    g.appendChild(svgEl('polygon', {
      points: basePts, fill: 'none', stroke: color,
      'stroke-width': 1.5, opacity: 0.5,
    }));
    /* Edges to apex */
    baseVerts.forEach(v => {
      g.appendChild(svgEl('line', {
        x1: apex[0], y1: apex[1], x2: v[0], y2: v[1],
        stroke: color, 'stroke-width': 1.5, opacity: 0.7,
      }));
    });
    /* Face fill */
    g.appendChild(svgEl('polygon', {
      points: `${apex.join(',')  } ${baseVerts[0].join(',')} ${baseVerts[1].join(',')}`,
      fill: color, opacity: 0.06,
    }));
    return createSVG(50, g, color);
  }

  /* Shape 3: Cube wireframe with perspective */
  function svgCube(color, phase) {
    const g = svgEl('g', {});
    const s = 22;
    const ca = Math.cos(phase), sa = Math.sin(phase);
    const cb = Math.cos(phase * PHI_I), sb = Math.sin(phase * PHI_I);
    const raw = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
    ];
    const proj = raw.map(([x,y,z]) => {
      let rx = x*ca - z*sa, rz = x*sa + z*ca;
      let ry = y*cb - rz*sb; rz = y*sb + rz*cb;
      return [rx*s, ry*s];
    });
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    edges.forEach(([a,b]) => {
      g.appendChild(svgEl('line', {
        x1:proj[a][0], y1:proj[a][1], x2:proj[b][0], y2:proj[b][1],
        stroke: color, 'stroke-width': 1.5, opacity: 0.55,
      }));
    });
    /* One face filled */
    const face = [0,1,2,3].map(i => proj[i].join(',')).join(' ');
    g.appendChild(svgEl('polygon', { points: face, fill: color, opacity: 0.05 }));
    return createSVG(50, g, color);
  }

  /* Shape 4: Diamond (octahedron) */
  function svgDiamond(color, phase) {
    const g = svgEl('g', {});
    const ca = Math.cos(phase), sa = Math.sin(phase);
    const s = 30;
    const verts = [[0,-1,0],[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
    const proj = verts.map(([x,y,z]) => {
      const rx = x*ca - z*sa;
      return [rx * s, y * s];
    });
    const faces = [[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,2,4],[1,4,3],[1,3,5],[1,5,2]];
    faces.forEach((f, i) => {
      const pts = f.map(v => proj[v].join(',')).join(' ');
      g.appendChild(svgEl('polygon', {
        points: pts, fill: color, stroke: color,
        'stroke-width': 1, opacity: (i < 4) ? 0.06 : 0.03,
      }));
    });
    return createSVG(50, g, color);
  }

  /* Shape 5: Star — 5-pointed */
  function svgStar(color, phase) {
    const g = svgEl('g', {});
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0) ? 32 : 14;
      const a = (i * TAU / 10) - Math.PI / 2 + phase * 0.3;
      pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
    }
    g.appendChild(svgEl('polygon', {
      points: pts.join(' '), fill: color, stroke: color,
      'stroke-width': 1, opacity: 0.08, 'fill-opacity': 0.06,
    }));
    g.appendChild(svgEl('polygon', {
      points: pts.join(' '), fill: 'none', stroke: color,
      'stroke-width': 1.5, opacity: 0.6,
    }));
    return createSVG(50, g, color);
  }

  /* Shape 6: Hexagonal prism */
  function svgHexPrism(color, phase) {
    const g = svgEl('g', {});
    const r = 25, h = 18;
    const top = [], bot = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU / 6) + phase * 0.4;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.5;
      top.push([x, y - h]);
      bot.push([x, y + h * 0.3]);
    }
    /* Top face */
    g.appendChild(svgEl('polygon', {
      points: top.map(p => p.join(',')).join(' '),
      fill: color, stroke: color, 'stroke-width': 1.5,
      opacity: 0.08, 'fill-opacity': 0.06,
    }));
    /* Bottom face */
    g.appendChild(svgEl('polygon', {
      points: bot.map(p => p.join(',')).join(' '),
      fill: 'none', stroke: color, 'stroke-width': 1, opacity: 0.3,
    }));
    /* Vertical edges */
    for (let i = 0; i < 6; i++) {
      g.appendChild(svgEl('line', {
        x1: top[i][0], y1: top[i][1], x2: bot[i][0], y2: bot[i][1],
        stroke: color, 'stroke-width': 1, opacity: 0.4,
      }));
    }
    return createSVG(50, g, color);
  }

  /* Shape 7: Torus ring (circle of circles) */
  function svgRing(color, phase) {
    const g = svgEl('g', {});
    const R = 28, segments = 13;
    for (let i = 0; i < segments; i++) {
      const a = (i * TAU / segments) + phase * 0.3;
      const cx = Math.cos(a) * R;
      const cy = Math.sin(a) * R * 0.45;
      const r  = 5 + Math.sin(a + phase) * 2;
      g.appendChild(svgEl('circle', {
        cx, cy, r,
        fill: 'none', stroke: color, 'stroke-width': 1.2,
        opacity: 0.3 + Math.cos(a) * 0.3,
      }));
    }
    return createSVG(55, g, color);
  }

  const SHAPE_BUILDERS = [
    svgIcosahedron, svgPyramid, svgCube, svgDiamond,
    svgStar, svgHexPrism, svgRing,
  ];


  /* ─────────────────────────────────────────────────
     PARALLAX ENGINE — Enveloping multi-depth layers
     ───────────────────────────────────────────────── */

  let mouseX = 0.5, mouseY = 0.5;                /* 0→1 normalized */
  let scrollY = 0;
  const SHAPES = [];                              /* live shape refs */

  function spawnSVGFaces() {
    const layers = document.querySelectorAll('.parallax-layer');
    if (!layers.length) return;

    const COUNTS = { back: 8, mid: 7, front: 6 };  /* 21 total = Fibonacci */
    const depthNames = ['back', 'mid', 'front'];

    layers.forEach(layer => {
      const depth   = layer.dataset.depth;
      const count   = COUNTS[depth] || 5;
      const dIdx    = depthNames.indexOf(depth);

      for (let i = 0; i < count; i++) {
        const shapeIdx = (i + dIdx * 3) % SHAPE_BUILDERS.length;
        const color    = NEON[(i + dIdx * 2) % NEON.length];
        const phase    = (i * PHI * TAU) % TAU;

        /* Size: φ-scaled, larger in back */
        const baseSize = 34 + (2 - dIdx) * 21;
        const size     = baseSize + Math.sin(i * PHI) * 13;

        /* Position: golden-ratio distributed */
        const x = ((i * PHI_I * 100) % 95) + 2;
        const y = ((i * PHI * 80 + dIdx * 30) % 180) + 5;

        const wrapper = document.createElement('div');
        wrapper.className = 'svg-face';
        wrapper.style.width  = size + 'px';
        wrapper.style.height = size + 'px';
        wrapper.style.left   = x + '%';
        wrapper.style.top    = y + '%';

        const svg = SHAPE_BUILDERS[shapeIdx](color, phase);
        wrapper.appendChild(svg);
        layer.appendChild(wrapper);

        SHAPES.push({
          el: wrapper, svg, depth: dIdx, color,
          baseX: x, baseY: y, phase,
          builder: SHAPE_BUILDERS[shapeIdx],
          size, speed: 0.3 + dIdx * 0.4,
        });
      }
    });

    /* Fade in with Fibonacci stagger */
    SHAPES.forEach((s, i) => {
      const delay = FIB[Math.min(i, FIB.length - 1)] * 8;
      setTimeout(() => s.el.classList.add('visible'), delay);
    });
  }

  /* Refresh SVG faces with new phase (rotation) — keeps them vector-crisp */
  function updateFaces(time) {
    SHAPES.forEach(s => {
      const newPhase = s.phase + time * 0.0003 * (1 + s.depth * 0.3);
      /* Only rebuild SVG every ~200ms for perf */
      if (Math.floor(time / 200) !== Math.floor((time - 16) / 200)) {
        const newSvg = s.builder(s.color, newPhase);
        s.el.replaceChild(newSvg, s.el.firstChild);
        s.svg = newSvg;
      }
    });
  }

  /* Enveloping parallax: shapes drift with mouse + scroll */
  function updateParallax() {
    const cx = (mouseX - 0.5) * 2;  /* -1 → +1 */
    const cy = (mouseY - 0.5) * 2;

    SHAPES.forEach(s => {
      const depthFactor = (3 - s.depth) * 13;    /* deeper = more movement */
      const scrollFactor = (3 - s.depth) * 0.03; /* deeper = slower scroll */
      const dx = cx * depthFactor;
      const dy = cy * depthFactor + scrollY * scrollFactor;
      s.el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    /* Move the envelope layers themselves for deep parallax */
    document.querySelectorAll('.parallax-layer').forEach(layer => {
      const d = layer.dataset.depth;
      const factor = d === 'back' ? 0.04 : d === 'mid' ? 0.02 : 0.01;
      const mx = cx * factor * 100;
      const my = cy * factor * 100;
      const baseZ = d === 'back' ? -300 : d === 'mid' ? -150 : -50;
      const baseS = d === 'back' ? 1.3 : d === 'mid' ? 1.15 : 1.05;
      layer.style.transform = `translateZ(${baseZ}px) scale(${baseS}) translate(${mx}px, ${my}px)`;
    });
  }


  /* ─────────────────────────────────────────────────
     STARFIELD — φ-distributed neon dots
     ───────────────────────────────────────────────── */

  function initStarfield(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    const STAR_COUNT = 233;
    const stars = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function seedStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const fi = (i * PHI_I) % 1;
        stars.push({
          x: fi * W,
          y: ((i * PHI) % 1) * H,
          r: 0.3 + Math.random() * 1.5,
          a: Math.random(),
          speed: 0.05 + Math.random() * 0.15,
          color: NEON[i % NEON.length],
          twinkleOffset: i * PHI,
        });
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 * s.speed + s.twinkleOffset));
        ctx.globalAlpha = s.a * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
        /* Glow */
        if (s.r > 0.8) {
          ctx.globalAlpha = s.a * twinkle * 0.15;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, TAU);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    resize();
    seedStars();
    window.addEventListener('resize', () => { resize(); seedStars(); });
    return draw;
  }


  /* ─────────────────────────────────────────────────
     NEON GRID FLOOR — 80s Tron-style perspective
     ───────────────────────────────────────────────── */

  function initArcadeFloor(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function draw(time) {
      ctx.clearRect(0, 0, W, H);

      /* Floor only in bottom portion */
      const floorTop = H * 0.65;
      const horizon  = H * 0.45;

      /* Perspective grid lines */
      ctx.save();

      /* Horizontal lines — receding into distance */
      const lineCount = 21;
      for (let i = 0; i < lineCount; i++) {
        const t = i / lineCount;
        const y = horizon + (floorTop - horizon + H * 0.6) * Math.pow(t, 1.8);
        if (y < floorTop - 5) continue;
        const alpha = 0.05 + t * 0.15;
        const scrollOffset = (time * 0.0002 * (1 + t * 0.5)) % 1;
        const yOff = y + scrollOffset * (H * 0.04);

        ctx.strokeStyle = `rgba(178, 77, 255, ${alpha})`;
        ctx.lineWidth = 0.5 + t;
        ctx.beginPath();
        ctx.moveTo(0, yOff);
        ctx.lineTo(W, yOff);
        ctx.stroke();
      }

      /* Vertical lines — converging to vanishing point */
      const vanishX = W / 2 + (mouseX - 0.5) * 60;
      const vertCount = 13;
      for (let i = -vertCount; i <= vertCount; i++) {
        const alpha = 0.03 + (1 - Math.abs(i) / vertCount) * 0.12;
        const baseX = W / 2 + i * (W / (vertCount * 1.5));
        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizon);
        ctx.lineTo(baseX, H + 50);
        ctx.stroke();
      }

      /* Horizon glow */
      const hGrad = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 80);
      hGrad.addColorStop(0, 'transparent');
      hGrad.addColorStop(0.4, 'rgba(255, 45, 149, 0.06)');
      hGrad.addColorStop(0.6, 'rgba(178, 77, 255, 0.04)');
      hGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, horizon - 30, W, 110);

      ctx.restore();
    }

    resize();
    window.addEventListener('resize', resize);
    return draw;
  }


  /* ─────────────────────────────────────────────────
     CARD TILT — 3D mouse-reactive neon glow
     ───────────────────────────────────────────────── */

  function initCardTilt() {
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.style.setProperty('--rx', ((y - 0.5) * -8) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 8) + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }


  /* ─────────────────────────────────────────────────
     NAV — Hamburger drawer + scroll opacity
     ───────────────────────────────────────────────── */

  function initNav() {
    const burger  = document.querySelector('.burger');
    const drawer  = document.querySelector('.drawer');
    const overlay = document.querySelector('.overlay');
    const close   = document.querySelector('.drawer-close');

    if (!burger || !drawer) return;

    function open()  { drawer.classList.add('open'); overlay.classList.add('visible'); }
    function shut()  { drawer.classList.remove('open'); overlay.classList.remove('visible'); }

    burger.addEventListener('click', open);
    close?.addEventListener('click', shut);
    overlay?.addEventListener('click', shut);

    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
  }


  /* ─────────────────────────────────────────────────
     SCROLL REVEAL — Fibonacci stagger
     ───────────────────────────────────────────────── */

  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -55px 0px' });

    items.forEach((el, i) => {
      /* Fibonacci stagger */
      const fib = FIB[Math.min(i, FIB.length - 1)];
      el.style.transitionDelay = (fib * 13) + 'ms';
      obs.observe(el);
    });
  }


  /* ─────────────────────────────────────────────────
     CRT FLICKER — Subtle screen distortion
     ───────────────────────────────────────────────── */

  function initCRTFlicker() {
    const overlay = document.querySelector('.crt-overlay');
    if (!overlay) return;

    setInterval(() => {
      if (Math.random() < 0.05) { /* 5% chance per interval */
        overlay.style.opacity = 0.6 + Math.random() * 0.4;
        setTimeout(() => { overlay.style.opacity = 1; }, 50 + Math.random() * 80);
      }
    }, 377);
  }


  /* ─────────────────────────────────────────────────
     MOUSE TRACKER — Global mouse for parallax + floor
     ───────────────────────────────────────────────── */

  function initMouse() {
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    });
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    }, { passive: true });
  }


  /* ─────────────────────────────────────────────────
     ARCADE SYNTH — Structured 80s song engine
     Verse → Chorus → Verse → Chorus → Hook → Resolution
     4/4 time · 130 BPM · A minor key
     Web Audio API · zero audio files
     ───────────────────────────────────────────────── */

  const ArcadeSynth = (() => {
    let ctx = null;
    let master = null;
    let compressor = null;
    let playing = false;
    let loopTimer = null;

    /* ── Musical constants ── */
    const BPM = 130;
    const BEAT = 60 / BPM;              /* quarter note duration */
    const BAR  = BEAT * 4;              /* 4/4 time: 4 beats per bar */
    const EIGHTH = BEAT / 2;
    const SIXTEENTH = BEAT / 4;

    /* A minor scale frequencies — 3 octaves */
    /* A  B  C  D  E  F  G  */
    const NOTE = {
      /* Octave 2 (bass) */
      A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83,
      E3: 164.81, F3: 174.61, G3: 196.00,
      /* Octave 3 (mid) */
      A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66,
      E4: 329.63, F4: 349.23, G4: 392.00,
      /* Octave 4 (lead) */
      A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33,
      E5: 659.26, F5: 698.46, G5: 783.99,
      /* Octave 5 (sparkle) */
      A5: 880.00, C6: 1046.50, E6: 1318.51,
    };
    const R = 0; /* rest */

    /* ── Chord progressions (Am key) ── */
    /* Verse:  Am → F → C → G   (i → VI → III → VII) */
    /* Chorus: F → G → Am → Am  (VI → VII → i → i)   */
    /* Hook:   F → G → C → Am   (VI → VII → III → i)  */
    const CHORDS = {
      Am: [NOTE.A2, NOTE.C3, NOTE.E3],
      F:  [NOTE.F3, NOTE.A3, NOTE.C4],
      C:  [NOTE.C3, NOTE.E3, NOTE.G3],
      G:  [NOTE.G3, NOTE.B3, NOTE.D4],
      Dm: [NOTE.D3, NOTE.F3, NOTE.A3],
    };

    const VERSE_PROG   = ['Am', 'F',  'C',  'G'];
    const CHORUS_PROG  = ['F',  'G',  'Am', 'Am'];
    const HOOK_PROG    = ['F',  'G',  'C',  'Am'];
    const RESOLVE_PROG = ['Dm', 'G',  'Am', 'Am'];

    /* ── Melody patterns (scale degrees, 0=A, R=rest) ── */
    /* Each entry: [noteFreq, durationInBeats] */

    const VERSE_MELODY = [
      /* Bar 1: pickup into the phrase */
      [NOTE.E4, 1], [NOTE.E4, 0.5], [NOTE.D4, 0.5], [NOTE.C4, 1], [R, 1],
      /* Bar 2: answering phrase */
      [NOTE.D4, 0.5], [NOTE.E4, 0.5], [NOTE.F4, 1], [NOTE.E4, 1.5], [R, 0.5],
      /* Bar 3: tension up */
      [NOTE.G4, 1], [NOTE.A4, 0.5], [NOTE.G4, 0.5], [NOTE.E4, 1], [NOTE.D4, 1],
      /* Bar 4: resolve down */
      [NOTE.C4, 1], [NOTE.D4, 0.5], [NOTE.C4, 0.5], [NOTE.A3, 2],
    ];

    const CHORUS_MELODY = [
      /* Bar 1: big jump — the HOOK phrase */
      [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.E5, 1.5], [R, 0.5],
      /* Bar 2: step down */
      [NOTE.D5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 1], [NOTE.G4, 1], [R, 0.5], [NOTE.G4, 0.5],
      /* Bar 3: repeat hook high */
      [NOTE.A4, 1], [NOTE.C5, 1], [NOTE.E5, 1], [NOTE.D5, 1],
      /* Bar 4: resolution to root */
      [NOTE.C5, 0.5], [NOTE.B4, 0.5], [NOTE.A4, 3],
    ];

    const HOOK_MELODY = [
      /* Bar 1: catchy syncopated riff */
      [NOTE.E5, 0.5], [NOTE.E5, 0.5], [R, 0.25], [NOTE.D5, 0.75], [NOTE.C5, 1], [R, 1],
      /* Bar 2: answer */
      [NOTE.D5, 0.5], [NOTE.E5, 0.5], [NOTE.G5, 1.5], [R, 0.5], [NOTE.E5, 1],
      /* Bar 3: climb */
      [NOTE.A4, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5], [NOTE.G5, 0.5], [NOTE.A5, 2],
      /* Bar 4: dramatic resolve */
      [NOTE.G5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 1], [NOTE.A4, 2],
    ];

    const RESOLVE_MELODY = [
      /* Bar 1: gentle descent */
      [NOTE.E5, 1.5], [NOTE.D5, 0.5], [NOTE.C5, 1], [NOTE.A4, 1],
      /* Bar 2: sigh */
      [NOTE.B4, 1], [NOTE.A4, 1], [NOTE.G4, 2],
      /* Bar 3: echo */
      [NOTE.A4, 0.5], [R, 0.5], [NOTE.A4, 0.5], [R, 0.5], [NOTE.E4, 2],
      /* Bar 4: final rest on root */
      [NOTE.A3, 2], [R, 2],
    ];

    /* ── Bass patterns per chord (beats) ── */
    const VERSE_BASS = [
      /* root, 8th root, 5th walk, root */
      [0, 1], [0, 0.5], [R, 0.5], [2, 1], [0, 1],
    ];
    const CHORUS_BASS = [
      /* driving 8ths — root root 5th root */
      [0, 0.5], [0, 0.5], [2, 0.5], [0, 0.5], [0, 0.5], [2, 0.5], [0, 0.5], [R, 0.5],
    ];

    /* ── Arp patterns (chord tone indices, per bar) ── */
    const ARP_UP    = [0, 1, 2, 1, 0, 1, 2, 1];
    const ARP_DOWN  = [2, 1, 0, 1, 2, 1, 0, 1];
    const ARP_HOOK  = [0, 2, 1, 2, 0, 2, 1, 0];

    /* ── Drum patterns (16 steps per bar) ── */
    /*  K=kick  S=snare  H=closed-hat  O=open-hat  .=rest */
    const DRUM_VERSE  = 'K.H.S.H.K.HOK.S.';
    const DRUM_CHORUS = 'K.H.S.HOK.H.S.HO';
    const DRUM_HOOK   = 'KKH.S.H.KKH.S.HO';
    const DRUM_FILL   = 'K.SSS.SSK.SKS.KS';

    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      /* Compressor for glue */
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.connect(ctx.destination);

      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(compressor);
    }

    /* ── Sound generators ── */

    function playNote(freq, type, duration, startTime, vol, detune) {
      if (freq === 0) return; /* rest */
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.value = freq;
      if (detune) osc.detune.value = detune;

      filter.type = 'lowpass';
      filter.frequency.value = Math.min(freq * 4, 6000);
      filter.Q.value = 1.2;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      const t = startTime;
      const v = vol || 0.15;
      const attack = Math.min(0.015, duration * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(v, t + attack);
      gain.gain.setValueAtTime(v * 0.9, t + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.start(t);
      osc.stop(t + duration + 0.05);
    }

    /* Chorus effect — dual detuned oscillators */
    function playLead(freq, duration, startTime, vol) {
      if (freq === 0) return;
      playNote(freq, 'sawtooth', duration, startTime, vol * 0.6, 6);
      playNote(freq * 1.003, 'sawtooth', duration, startTime, vol * 0.4, -6);
    }

    /* Pad — soft sustained chord tones */
    function playPad(freq, duration, startTime, vol) {
      if (freq === 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      const t = startTime;
      const v = vol || 0.04;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(v, t + duration * 0.15);
      gain.gain.setValueAtTime(v * 0.8, t + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0, t + duration);

      osc.start(t);
      osc.stop(t + duration + 0.1);
    }

    function kick(time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain); gain.connect(master);
      osc.start(time); osc.stop(time + 0.22);
    }

    function snare(time) {
      const bufSize = ctx.sampleRate * 0.08;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource(); ns.buffer = buf;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 3500;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.18, time);
      ng.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      ns.connect(nf); nf.connect(ng); ng.connect(master);
      ns.start(time); ns.stop(time + 0.12);

      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(70, time + 0.06);
      og.gain.setValueAtTime(0.2, time);
      og.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(og); og.connect(master);
      osc.start(time); osc.stop(time + 0.1);
    }

    function hihat(time, open) {
      const len = open ? 0.08 : 0.03;
      const bufSize = ctx.sampleRate * len;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource(); ns.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass';
      f.frequency.value = open ? 6000 : 9000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(open ? 0.10 : 0.06, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + len);
      ns.connect(f); f.connect(g); g.connect(master);
      ns.start(time); ns.stop(time + len + 0.01);
    }

    /* ── Section schedulers ── */

    /* Schedule drums for N bars */
    function scheduleDrums(t0, bars, pattern) {
      for (let bar = 0; bar < bars; bar++) {
        const pat = (bar === bars - 1 && bars > 3) ? DRUM_FILL : pattern;
        for (let s = 0; s < 16; s++) {
          const t = t0 + bar * BAR + s * SIXTEENTH;
          const ch = pat[s];
          if (ch === 'K') kick(t);
          else if (ch === 'S') snare(t);
          else if (ch === 'H') hihat(t, false);
          else if (ch === 'O') hihat(t, true);
        }
      }
    }

    /* Schedule bass for N bars with chord progression */
    function scheduleBass(t0, bars, chordProg, pattern) {
      for (let bar = 0; bar < bars; bar++) {
        const chord = CHORDS[chordProg[bar % chordProg.length]];
        let t = t0 + bar * BAR;
        for (const [idx, dur] of pattern) {
          if (idx !== R) {
            const freq = chord[idx % chord.length];
            playNote(freq, 'square', dur * BEAT * 0.9, t, 0.15);
          }
          t += dur * BEAT;
        }
      }
    }

    /* Schedule melody for 4 bars */
    function scheduleMelody(t0, melody, vol) {
      let t = t0;
      for (const [freq, dur] of melody) {
        playLead(freq, dur * BEAT * 0.85, t, vol || 0.10);
        t += dur * BEAT;
      }
    }

    /* Schedule arpeggiator for N bars */
    function scheduleArp(t0, bars, chordProg, pattern, vol) {
      for (let bar = 0; bar < bars; bar++) {
        const chord = CHORDS[chordProg[bar % chordProg.length]];
        for (let i = 0; i < pattern.length; i++) {
          const t = t0 + bar * BAR + i * EIGHTH;
          const freq = chord[pattern[i] % chord.length] * 2; /* octave up */
          playNote(freq, 'square', EIGHTH * 0.7, t, vol || 0.04);
        }
      }
    }

    /* Schedule pad (sustained chord) for N bars */
    function schedulePad(t0, bars, chordProg) {
      for (let bar = 0; bar < bars; bar++) {
        const chord = CHORDS[chordProg[bar % chordProg.length]];
        chord.forEach(freq => {
          playPad(freq * 2, BAR * 0.95, t0 + bar * BAR, 0.03);
        });
      }
    }

    /* ── Song structure ── */
    /*  Intro (4) → Verse (4) → Chorus (4) → Verse2 (4) →
        Chorus (4) → Hook (4) → Resolution (4) → [loop] = 28 bars */

    function scheduleSong() {
      if (!playing) return;

      const t0 = ctx.currentTime + 0.1;
      let t = t0;

      /* ── INTRO: 4 bars — drums build + arp only ── */
      scheduleDrums(t, 2, 'K...H...K...H...');  /* sparse first 2 bars */
      scheduleDrums(t + 2 * BAR, 2, DRUM_VERSE); /* full pattern bars 3-4 */
      scheduleArp(t, 4, VERSE_PROG, ARP_UP, 0.03);
      schedulePad(t, 4, VERSE_PROG);
      t += 4 * BAR;

      /* ── VERSE 1: 4 bars — melody enters ── */
      scheduleDrums(t, 4, DRUM_VERSE);
      scheduleBass(t, 4, VERSE_PROG, VERSE_BASS);
      scheduleMelody(t, VERSE_MELODY, 0.10);
      scheduleArp(t, 4, VERSE_PROG, ARP_UP, 0.025);
      schedulePad(t, 4, VERSE_PROG);
      t += 4 * BAR;

      /* ── CHORUS 1: 4 bars — energy up, driving bass ── */
      scheduleDrums(t, 4, DRUM_CHORUS);
      scheduleBass(t, 4, CHORUS_PROG, CHORUS_BASS);
      scheduleMelody(t, CHORUS_MELODY, 0.13);
      scheduleArp(t, 4, CHORUS_PROG, ARP_DOWN, 0.04);
      schedulePad(t, 4, CHORUS_PROG);
      t += 4 * BAR;

      /* ── VERSE 2: 4 bars — melody with variation ── */
      scheduleDrums(t, 4, DRUM_VERSE);
      scheduleBass(t, 4, VERSE_PROG, VERSE_BASS);
      /* Vary melody: transpose some notes up */
      const verse2 = VERSE_MELODY.map(([f, d]) =>
        [f === R ? R : f * (1 + (Math.random() > 0.7 ? 0.5 : 0)), d]
      );
      scheduleMelody(t, verse2, 0.09);
      scheduleArp(t, 4, VERSE_PROG, ARP_DOWN, 0.03);
      schedulePad(t, 4, VERSE_PROG);
      t += 4 * BAR;

      /* ── CHORUS 2: 4 bars — bigger ── */
      scheduleDrums(t, 4, DRUM_CHORUS);
      scheduleBass(t, 4, CHORUS_PROG, CHORUS_BASS);
      scheduleMelody(t, CHORUS_MELODY, 0.15);
      scheduleArp(t, 4, CHORUS_PROG, ARP_HOOK, 0.05);
      schedulePad(t, 4, CHORUS_PROG);
      t += 4 * BAR;

      /* ── HOOK: 4 bars — catchy peak, maximum energy ── */
      scheduleDrums(t, 4, DRUM_HOOK);
      scheduleBass(t, 4, HOOK_PROG, CHORUS_BASS);
      scheduleMelody(t, HOOK_MELODY, 0.16);
      scheduleArp(t, 4, HOOK_PROG, ARP_HOOK, 0.055);
      schedulePad(t, 4, HOOK_PROG);
      t += 4 * BAR;

      /* ── RESOLUTION: 4 bars — wind down, resolve to Am ── */
      scheduleDrums(t, 4, DRUM_VERSE);
      scheduleBass(t, 4, RESOLVE_PROG, VERSE_BASS);
      scheduleMelody(t, RESOLVE_MELODY, 0.08);
      schedulePad(t, 4, RESOLVE_PROG);
      t += 4 * BAR;

      /* Total: 28 bars. Schedule next cycle before this ends. */
      const totalDuration = 28 * BAR; /* ~51.7 seconds at 130bpm */
      loopTimer = setTimeout(scheduleSong, (totalDuration - 2) * 1000);
    }

    function start() {
      if (playing) return;
      if (!ctx) init();
      if (ctx.state === 'suspended') ctx.resume();
      playing = true;
      scheduleSong();
    }

    function stop() {
      playing = false;
      if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    }

    function toggle() {
      if (playing) stop(); else start();
      return playing;
    }

    function isPlaying() { return playing; }

    return { start, stop, toggle, isPlaying };
  })();


  /* ─────────────────────────────────────────────────
     MUSIC TOGGLE — Wired to DOM button
     ───────────────────────────────────────────────── */

  function initMusicToggle() {
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const on = ArcadeSynth.toggle();
      btn.classList.toggle('music-on', on);
      btn.classList.toggle('music-off', !on);
      btn.setAttribute('aria-label', on ? 'Mute arcade music' : 'Play arcade music');
      btn.querySelector('.music-icon').textContent = on ? '🔊' : '🔇';
      btn.querySelector('.music-label').textContent = on ? 'MUSIC ON' : 'MUSIC OFF';
    });
  }


  /* ─────────────────────────────────────────────────
     ANIMATION LOOP — z = x·y manifold surface
     ───────────────────────────────────────────────── */

  function boot() {
    const starCanvas  = document.getElementById('starfield');
    const floorCanvas = document.getElementById('arcade-scene');

    let drawStars = null;
    let drawFloor = null;

    if (starCanvas)  drawStars = initStarfield(starCanvas);
    if (floorCanvas) drawFloor = initArcadeFloor(floorCanvas);

    spawnSVGFaces();
    initCardTilt();
    initNav();
    initScrollReveal();
    initCRTFlicker();
    initMouse();
    initMusicToggle();

    function loop(time) {
      if (drawStars) drawStars(time);
      if (drawFloor) drawFloor(time);
      updateParallax();
      updateFaces(time);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ─── Ignite ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
