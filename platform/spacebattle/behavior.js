/* ═══════════════════════════════════════════════════════════
   SPACE BATTLE — Dimensional Behavior (Manifold Game Engine)
   Ken's Arcade · https://kensgames.com/spacebattle/
   ButterflyFX Substrate Programming
   80s wireframe vector arcade · Web Audio synth music
   ═══════════════════════════════════════════════════════════ */

(function SpaceBattleManifold() {
  'use strict';

  /* ── Dimensional Constants ── */
  const PHI   = 1.618033988749895;
  const TAU   = Math.PI * 2;
  const DEG   = Math.PI / 180;
  const SQRT2 = Math.SQRT2;

  /* ── Game Config ── */
  const CFG = {
    // World
    worldRadius:   8000,
    starCount:     2000,
    nebulaCount:   40,

    // Player ship
    maxSpeed:      600,
    accel:         280,
    decel:         200,
    bankSpeed:     2.0,
    pitchSpeed:    1.5,
    rollDamping:   0.92,

    // Weapons
    laserSpeed:    2000,
    laserRange:    3000,
    laserCooldown: 0.12,
    laserDamage:   8,
    lockOnTime:    1.5,     // seconds to lock
    lockOnAngle:   12,      // degrees

    // Enemies
    enemySpeed:      250,
    enemyFireRate:    1.8,  // seconds between shots
    enemyLaserSpeed: 1200,
    enemyDamage:     12,
    enemyHealth:     40,
    enemyDetectRange: 2500,

    // Allies
    allySpeed:     220,
    allyFireRate:   2.2,
    allyHealth:     50,

    // Countermeasures
    maxCountermeasures: 5,
    cmCooldown:     3.0,

    // Combat
    playerHealth:  100,
    playerShield:  100,
    shieldRegen:   3,      // per second
    warnDistance:   800,
    dangerDistance: 400,

    // Waves
    baseEnemies:    4,
    enemiesPerWave: 2,
    maxWave:        99,
  };


  /* ═══════════════════════════════════════════════
     STATE — Single source of truth
     ═══════════════════════════════════════════════ */
  const state = {
    running:    false,
    paused:     false,
    gameOver:   false,

    // Player
    pos:        { x: 0, y: 0, z: 0 },
    vel:        { x: 0, y: 0, z: 0 },
    rot:        { pitch: 0, yaw: 0, roll: 0 },
    speed:      0,
    throttle:   0.3,
    health:     CFG.playerHealth,
    shield:     CFG.playerShield,
    energy:     100,

    // Weapons
    laserHeat:    0,
    lockTarget:   null,
    lockProgress: 0,
    firing:       false,

    // Countermeasures
    countermeasures: CFG.maxCountermeasures,
    cmCooldownTimer: 0,

    // Score
    score:   0,
    kills:   0,
    wave:    1,

    // Entities
    enemies:    [],
    allies:     [],
    lasers:     [],
    explosions: [],
    particles:  [],

    // Input
    keys:  {},
    mouse: { x: 0, y: 0, dx: 0, dy: 0 },

    // Time
    time:      0,
    deltaTime: 0,
    lastFrame: 0,

    // Alert
    alertLevel: 0,  // 0=none, 1=warn, 2=danger, 3=critical

    // Music
    musicPlaying: false,
  };


  /* ═══════════════════════════════════════════════
     CANVAS & RENDERING CONTEXT
     ═══════════════════════════════════════════════ */
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, CX, CY;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    CX = W / 2;
    CY = H / 2;
  }
  window.addEventListener('resize', resize);
  resize();


  /* ═══════════════════════════════════════════════
     3D MATH — Minimal projection engine
     ═══════════════════════════════════════════════ */
  const FOV = 90 * DEG;
  const NEAR = 1;
  const FAR  = CFG.worldRadius * 2;

  function project(wx, wy, wz) {
    // Transform world to camera space
    const dx = wx - state.pos.x;
    const dy = wy - state.pos.y;
    const dz = wz - state.pos.z;

    const cp = Math.cos(state.rot.pitch), sp = Math.sin(state.rot.pitch);
    const cy = Math.cos(state.rot.yaw),   sy = Math.sin(state.rot.yaw);
    const cr = Math.cos(state.rot.roll),   sr = Math.sin(state.rot.roll);

    // Yaw rotation
    let x1 =  cy * dx + sy * dz;
    let z1 = -sy * dx + cy * dz;
    let y1 = dy;

    // Pitch rotation
    let x2 = x1;
    let y2 = cp * y1 - sp * z1;
    let z2 = sp * y1 + cp * z1;

    // Roll rotation
    let x3 = cr * x2 - sr * y2;
    let y3 = sr * x2 + cr * y2;
    let z3 = z2;

    if (z3 < NEAR) return null;

    const fovFactor = (H / 2) / Math.tan(FOV / 2);
    const sx = CX + (x3 / z3) * fovFactor;
    const sy2 = CY - (y3 / z3) * fovFactor;
    const scale = fovFactor / z3;

    return { x: sx, y: sy2, z: z3, scale: scale };
  }


  /* ═══════════════════════════════════════════════
     STARFIELD — 80s vector points
     ═══════════════════════════════════════════════ */
  const stars = [];
  function initStars() {
    for (let i = 0; i < CFG.starCount; i++) {
      const r = 3000 + Math.random() * CFG.worldRadius;
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        brightness: 0.3 + Math.random() * 0.7,
        size: 0.5 + Math.random() * 1.5,
      });
    }
  }

  function renderStars() {
    for (const s of stars) {
      const p = project(s.x, s.y, s.z);
      if (!p || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const alpha = s.brightness * Math.min(1, 0.3 + Math.sin(state.time * 2 + s.x) * 0.15);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      const sz = Math.max(0.5, s.size * p.scale * 0.3);
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
  }


  /* ═══════════════════════════════════════════════
     NEBULA — Background color clouds
     ═══════════════════════════════════════════════ */
  const nebulae = [];
  function initNebulae() {
    const colors = ['rgba(50,0,80,', 'rgba(0,30,60,', 'rgba(80,0,30,', 'rgba(0,50,40,'];
    for (let i = 0; i < CFG.nebulaCount; i++) {
      const r = 5000 + Math.random() * 3000;
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      nebulae.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        radius: 800 + Math.random() * 2000,
        color: colors[i % colors.length],
        opacity: 0.03 + Math.random() * 0.06,
      });
    }
  }

  function renderNebulae() {
    for (const n of nebulae) {
      const p = project(n.x, n.y, n.z);
      if (!p || p.z > 7000) continue;
      const r = n.radius * p.scale;
      if (r < 10) continue;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, n.color + n.opacity + ')');
      grad.addColorStop(1, n.color + '0)');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }
  }


  /* ═══════════════════════════════════════════════
     SHIP WIREFRAME MODELS — 80s vector style
     ═══════════════════════════════════════════════ */

  // Player's ship cockpit struts (rendered as overlay lines)
  function renderCockpit() {
    ctx.strokeStyle = 'rgba(0,255,136,0.12)';
    ctx.lineWidth = 1;

    // Left strut
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(CX - 200, CY + 100);
    ctx.stroke();

    // Right strut
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(CX + 200, CY + 100);
    ctx.stroke();

    // Bottom console outline
    ctx.strokeStyle = 'rgba(0,255,136,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, H - 30);
    ctx.quadraticCurveTo(CX, H - 60, W, H - 30);
    ctx.stroke();
  }

  // Wireframe ship model for enemies/allies
  function drawWireframeShip(p, size, color, heading, type) {
    if (!p) return;
    const s = size * p.scale * 30;
    if (s < 2) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const angle = heading || 0;
    ctx.rotate(angle);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.3;

    if (type === 'enemy') {
      // Enemy: angular, aggressive shape (like TIE-ish hexagonal wings)
      ctx.beginPath();
      // Nose
      ctx.moveTo(0, -s);
      // Right wing
      ctx.lineTo(s * 0.3, -s * 0.3);
      ctx.lineTo(s * 0.9, -s * 0.7);
      ctx.lineTo(s * 0.9, s * 0.7);
      ctx.lineTo(s * 0.3, s * 0.3);
      // Tail
      ctx.lineTo(0, s * 0.5);
      // Left wing
      ctx.lineTo(-s * 0.3, s * 0.3);
      ctx.lineTo(-s * 0.9, s * 0.7);
      ctx.lineTo(-s * 0.9, -s * 0.7);
      ctx.lineTo(-s * 0.3, -s * 0.3);
      ctx.closePath();
      ctx.stroke();

      // Center cockpit
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.15, 0, TAU);
      ctx.stroke();

    } else if (type === 'ally') {
      // Ally: sleek, Viper-ish swept wings
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.2, -s * 0.2);
      ctx.lineTo(s * 0.8, s * 0.2);
      ctx.lineTo(s * 0.7, s * 0.5);
      ctx.lineTo(s * 0.15, s * 0.3);
      ctx.lineTo(0, s * 0.6);
      ctx.lineTo(-s * 0.15, s * 0.3);
      ctx.lineTo(-s * 0.7, s * 0.5);
      ctx.lineTo(-s * 0.8, s * 0.2);
      ctx.lineTo(-s * 0.2, -s * 0.2);
      ctx.closePath();
      ctx.stroke();

      // Engine glow
      ctx.fillStyle = 'rgba(0,150,255,0.4)';
      ctx.fillRect(-s * 0.1, s * 0.4, s * 0.2, s * 0.15);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }


  /* ═══════════════════════════════════════════════
     ENTITY SYSTEM — Enemies & Allies
     ═══════════════════════════════════════════════ */

  function vec3dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function vec3len(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  function vec3normalize(v) {
    const l = vec3len(v);
    if (l < 0.0001) return { x: 0, y: 0, z: 1 };
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  function spawnEnemy() {
    const angle = Math.random() * TAU;
    const elev = (Math.random() - 0.5) * 1.5;
    const dist = 1500 + Math.random() * 1500;

    // Forward vector of player
    const sy = Math.sin(state.rot.yaw), cy = Math.cos(state.rot.yaw);
    const sp = Math.sin(state.rot.pitch), cp = Math.cos(state.rot.pitch);
    const fwd = { x: sy * cp, y: -sp, z: cy * cp };

    return {
      type: 'enemy',
      pos: {
        x: state.pos.x + Math.cos(angle) * dist + fwd.x * 800,
        y: state.pos.y + Math.sin(elev) * 600,
        z: state.pos.z + Math.sin(angle) * dist + fwd.z * 800,
      },
      vel:       { x: 0, y: 0, z: 0 },
      health:    CFG.enemyHealth,
      maxHealth: CFG.enemyHealth,
      fireTimer: CFG.enemyFireRate * Math.random(),
      behavior:  Math.random() < 0.4 ? 'aggressive' : 'flanker',
      alive:     true,
      size:      0.8 + Math.random() * 0.5,
      evadeTimer: 0,
      lockingPlayer: false,
      lockProgress: 0,
    };
  }

  function spawnAlly() {
    const angle = Math.random() * TAU;
    const dist = 400 + Math.random() * 600;
    return {
      type: 'ally',
      pos: {
        x: state.pos.x + Math.cos(angle) * dist,
        y: state.pos.y + (Math.random() - 0.5) * 200,
        z: state.pos.z + Math.sin(angle) * dist,
      },
      vel:       { x: 0, y: 0, z: 0 },
      health:    CFG.allyHealth,
      maxHealth: CFG.allyHealth,
      fireTimer: CFG.allyFireRate * Math.random(),
      target:    null,
      alive:     true,
      size:      1.0,
    };
  }

  function spawnWave() {
    const enemyCount = CFG.baseEnemies + (state.wave - 1) * CFG.enemiesPerWave;
    for (let i = 0; i < enemyCount; i++) {
      state.enemies.push(spawnEnemy());
    }
    // Add 1-2 allies per wave
    const allyCount = Math.min(3, 1 + Math.floor(state.wave / 3));
    while (state.allies.length < allyCount) {
      state.allies.push(spawnAlly());
    }
  }


  /* ═══════════════════════════════════════════════
     LASER SYSTEM
     ═══════════════════════════════════════════════ */
  function fireLaser(origin, dir, speed, damage, owner, color) {
    state.lasers.push({
      pos:    { ...origin },
      vel:    { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed },
      damage: damage,
      owner:  owner,    // 'player', 'enemy', 'ally'
      color:  color || '#33ff33',
      life:   CFG.laserRange / speed,
      age:    0,
    });
  }

  function playerShoot() {
    if (state.laserHeat > 0) return;
    state.laserHeat = CFG.laserCooldown;

    const sy = Math.sin(state.rot.yaw), cy = Math.cos(state.rot.yaw);
    const sp = Math.sin(state.rot.pitch), cp = Math.cos(state.rot.pitch);
    const dir = { x: sy * cp, y: -sp, z: cy * cp };

    const origin = {
      x: state.pos.x + dir.x * 20,
      y: state.pos.y + dir.y * 20,
      z: state.pos.z + dir.z * 20,
    };

    // Dual lasers (offset left/right)
    const right = { x: cy, y: 0, z: -sy };
    for (const side of [-1, 1]) {
      const o = {
        x: origin.x + right.x * side * 8,
        y: origin.y,
        z: origin.z + right.z * side * 8,
      };
      fireLaser(o, dir, CFG.laserSpeed, CFG.laserDamage, 'player', '#33ff33');
    }

    playSound('laser');
  }


  /* ═══════════════════════════════════════════════
     EXPLOSIONS & PARTICLES
     ═══════════════════════════════════════════════ */
  function createExplosion(pos, size, color) {
    const count = 15 + Math.floor(size * 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const elev = (Math.random() - 0.5) * Math.PI;
      const speed = 50 + Math.random() * 200 * size;
      state.particles.push({
        pos: { ...pos },
        vel: {
          x: Math.cos(angle) * Math.cos(elev) * speed,
          y: Math.sin(elev) * speed,
          z: Math.sin(angle) * Math.cos(elev) * speed,
        },
        life: 0.5 + Math.random() * 1.0,
        age: 0,
        color: color || '#ff8800',
        size: 1 + Math.random() * 3,
      });
    }
    state.explosions.push({
      pos: { ...pos },
      size: size,
      age: 0,
      life: 0.8,
    });
    playSound('explode');
  }


  /* ═══════════════════════════════════════════════
     COUNTERMEASURES — Flares
     ═══════════════════════════════════════════════ */
  function deployCountermeasure() {
    if (state.countermeasures <= 0 || state.cmCooldownTimer > 0) return;
    state.countermeasures--;
    state.cmCooldownTimer = CFG.cmCooldown;

    // Spawn flare particles behind player
    const sy = Math.sin(state.rot.yaw), cy = Math.cos(state.rot.yaw);
    const sp = Math.sin(state.rot.pitch), cp = Math.cos(state.rot.pitch);
    const back = { x: -sy * cp, y: sp, z: -cy * cp };

    const flarePos = {
      x: state.pos.x + back.x * 40,
      y: state.pos.y + back.y * 40,
      z: state.pos.z + back.z * 40,
    };

    // Flare distracts enemy lasers
    for (const laser of state.lasers) {
      if (laser.owner === 'enemy') {
        const d = vec3dist(laser.pos, flarePos);
        if (d < 300) {
          // Redirect laser toward flare
          const toFlare = vec3normalize({
            x: flarePos.x - laser.pos.x,
            y: flarePos.y - laser.pos.y,
            z: flarePos.z - laser.pos.z,
          });
          const s = vec3len(laser.vel);
          laser.vel.x = toFlare.x * s;
          laser.vel.y = toFlare.y * s;
          laser.vel.z = toFlare.z * s;
        }
      }
    }

    // Also break enemy lock-ons
    for (const e of state.enemies) {
      if (e.lockingPlayer) {
        e.lockingPlayer = false;
        e.lockProgress = 0;
      }
    }

    createExplosion(flarePos, 2, '#ffff00');
    playSound('countermeasure');

    updateCMDisplay();
  }


  /* ═══════════════════════════════════════════════
     UPDATE LOOP
     ═══════════════════════════════════════════════ */
  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;

    state.time += dt;
    state.deltaTime = dt;

    updatePlayer(dt);
    updateEnemies(dt);
    updateAllies(dt);
    updateLasers(dt);
    updateParticles(dt);
    updateAlerts(dt);
    updateLockOn(dt);
    checkWaveComplete();

    // Shield regen
    if (state.shield < CFG.playerShield) {
      state.shield = Math.min(CFG.playerShield, state.shield + CFG.shieldRegen * dt);
    }

    // Cooldowns
    if (state.laserHeat > 0) state.laserHeat -= dt;
    if (state.cmCooldownTimer > 0) state.cmCooldownTimer -= dt;

    // Continuous fire
    if (state.firing) playerShoot();
  }

  function updatePlayer(dt) {
    const k = state.keys;

    // Throttle
    if (k['KeyW'] || k['ArrowUp'])    state.throttle = Math.min(1, state.throttle + dt * 0.8);
    if (k['KeyS'] || k['ArrowDown'])  state.throttle = Math.max(0, state.throttle - dt * 0.8);

    // Yaw (mouse + A/D)
    let yawInput = state.mouse.dx * 0.003;
    if (k['KeyA'] || k['ArrowLeft'])  yawInput -= CFG.bankSpeed * dt;
    if (k['KeyD'] || k['ArrowRight']) yawInput += CFG.bankSpeed * dt;
    state.rot.yaw += yawInput;

    // Pitch (mouse)
    state.rot.pitch += state.mouse.dy * 0.003;
    state.rot.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, state.rot.pitch));

    // Roll (Q/E)
    if (k['KeyQ']) state.rot.roll -= 2.5 * dt;
    if (k['KeyE']) state.rot.roll += 2.5 * dt;
    state.rot.roll *= CFG.rollDamping;

    // Speed
    const targetSpeed = state.throttle * CFG.maxSpeed;
    if (state.speed < targetSpeed) {
      state.speed = Math.min(targetSpeed, state.speed + CFG.accel * dt);
    } else {
      state.speed = Math.max(targetSpeed, state.speed - CFG.decel * dt);
    }

    // Forward vector
    const sy = Math.sin(state.rot.yaw), cy = Math.cos(state.rot.yaw);
    const sp = Math.sin(state.rot.pitch), cp = Math.cos(state.rot.pitch);
    const fwd = { x: sy * cp, y: -sp, z: cy * cp };

    state.vel.x = fwd.x * state.speed;
    state.vel.y = fwd.y * state.speed;
    state.vel.z = fwd.z * state.speed;

    state.pos.x += state.vel.x * dt;
    state.pos.y += state.vel.y * dt;
    state.pos.z += state.vel.z * dt;

    state.mouse.dx = 0;
    state.mouse.dy = 0;
  }

  function updateEnemies(dt) {
    for (const e of state.enemies) {
      if (!e.alive) continue;

      const dist = vec3dist(e.pos, state.pos);
      const toPlayer = vec3normalize({
        x: state.pos.x - e.pos.x,
        y: state.pos.y - e.pos.y,
        z: state.pos.z - e.pos.z,
      });

      // Movement behavior
      let moveDir;
      if (e.behavior === 'aggressive') {
        // Head straight at player
        moveDir = toPlayer;
        if (dist < 200) {
          // Break off when too close
          moveDir = { x: -toPlayer.x + (Math.random() - 0.5), y: toPlayer.y, z: -toPlayer.z + (Math.random() - 0.5) };
          moveDir = vec3normalize(moveDir);
        }
      } else {
        // Flanker: orbit around player
        const orbitAngle = state.time * 0.5 + e.pos.x * 0.01;
        const orbitDist = 600 + Math.sin(state.time * 0.3) * 200;
        const target = {
          x: state.pos.x + Math.cos(orbitAngle) * orbitDist,
          y: state.pos.y + Math.sin(state.time * 0.4) * 150,
          z: state.pos.z + Math.sin(orbitAngle) * orbitDist,
        };
        moveDir = vec3normalize({
          x: target.x - e.pos.x,
          y: target.y - e.pos.y,
          z: target.z - e.pos.z,
        });
      }

      const spd = CFG.enemySpeed * (e.behavior === 'aggressive' ? 1.2 : 1.0);
      e.vel.x += moveDir.x * spd * dt * 2;
      e.vel.y += moveDir.y * spd * dt * 2;
      e.vel.z += moveDir.z * spd * dt * 2;

      // Dampen velocity
      const vlen = vec3len(e.vel);
      if (vlen > spd) {
        const scale = spd / vlen;
        e.vel.x *= scale;
        e.vel.y *= scale;
        e.vel.z *= scale;
      }

      e.pos.x += e.vel.x * dt;
      e.pos.y += e.vel.y * dt;
      e.pos.z += e.vel.z * dt;

      // Firing at player
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && dist < CFG.enemyDetectRange) {
        e.fireTimer = CFG.enemyFireRate * (0.8 + Math.random() * 0.4);

        // Enemy lock-on mechanic
        if (dist < CFG.warnDistance) {
          e.lockingPlayer = true;
          e.lockProgress = Math.min(1, e.lockProgress + dt * 2);
        }

        // Fire at player with slight inaccuracy
        const inaccuracy = 0.05 + (dist / CFG.enemyDetectRange) * 0.1;
        const aimDir = {
          x: toPlayer.x + (Math.random() - 0.5) * inaccuracy,
          y: toPlayer.y + (Math.random() - 0.5) * inaccuracy,
          z: toPlayer.z + (Math.random() - 0.5) * inaccuracy,
        };
        const aimNorm = vec3normalize(aimDir);
        fireLaser(
          { x: e.pos.x + aimNorm.x * 15, y: e.pos.y, z: e.pos.z + aimNorm.z * 15 },
          aimNorm, CFG.enemyLaserSpeed, CFG.enemyDamage, 'enemy', '#ff3333'
        );
        playSound('enemyLaser');
      } else {
        e.lockingPlayer = false;
        e.lockProgress = Math.max(0, e.lockProgress - dt);
      }
    }
  }

  function updateAllies(dt) {
    for (const a of state.allies) {
      if (!a.alive) continue;

      // Find nearest enemy to engage
      let nearestEnemy = null;
      let nearestDist = Infinity;
      for (const e of state.enemies) {
        if (!e.alive) continue;
        const d = vec3dist(a.pos, e.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }

      if (nearestEnemy) {
        // Chase enemy
        const toTarget = vec3normalize({
          x: nearestEnemy.pos.x - a.pos.x,
          y: nearestEnemy.pos.y - a.pos.y,
          z: nearestEnemy.pos.z - a.pos.z,
        });

        a.vel.x += toTarget.x * CFG.allySpeed * dt * 2;
        a.vel.y += toTarget.y * CFG.allySpeed * dt * 2;
        a.vel.z += toTarget.z * CFG.allySpeed * dt * 2;

        const vlen = vec3len(a.vel);
        if (vlen > CFG.allySpeed) {
          const s = CFG.allySpeed / vlen;
          a.vel.x *= s; a.vel.y *= s; a.vel.z *= s;
        }

        // Fire at enemy
        a.fireTimer -= dt;
        if (a.fireTimer <= 0 && nearestDist < 1500) {
          a.fireTimer = CFG.allyFireRate;
          fireLaser(a.pos, toTarget, CFG.laserSpeed * 0.8, CFG.laserDamage * 0.8, 'ally', '#4488ff');
        }
      } else {
        // Follow player loosely
        const toPlayer = vec3normalize({
          x: state.pos.x - a.pos.x + (Math.random() - 0.5) * 200,
          y: state.pos.y - a.pos.y,
          z: state.pos.z - a.pos.z + (Math.random() - 0.5) * 200,
        });
        a.vel.x += toPlayer.x * CFG.allySpeed * dt;
        a.vel.y += toPlayer.y * CFG.allySpeed * dt;
        a.vel.z += toPlayer.z * CFG.allySpeed * dt;

        const vlen = vec3len(a.vel);
        if (vlen > CFG.allySpeed * 0.5) {
          const s = (CFG.allySpeed * 0.5) / vlen;
          a.vel.x *= s; a.vel.y *= s; a.vel.z *= s;
        }
      }

      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt;
      a.pos.z += a.vel.z * dt;
    }
  }

  function updateLasers(dt) {
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const l = state.lasers[i];
      l.age += dt;
      if (l.age >= l.life) {
        state.lasers.splice(i, 1);
        continue;
      }

      l.pos.x += l.vel.x * dt;
      l.pos.y += l.vel.y * dt;
      l.pos.z += l.vel.z * dt;

      // Collision detection
      const hitRadius = 20;

      if (l.owner === 'player' || l.owner === 'ally') {
        for (const e of state.enemies) {
          if (!e.alive) continue;
          const d = vec3dist(l.pos, e.pos);
          if (d < hitRadius * e.size) {
            e.health -= l.damage;
            if (e.health <= 0) {
              e.alive = false;
              state.kills++;
              state.score += 100 * state.wave;
              createExplosion(e.pos, e.size * 1.5, '#ff4400');
            } else {
              createExplosion(l.pos, 0.3, '#ffaa00');
            }
            state.lasers.splice(i, 1);
            break;
          }
        }
      }

      if (l.owner === 'enemy') {
        // Check hit on player
        const dp = vec3dist(l.pos, state.pos);
        if (dp < 25) {
          applyDamageToPlayer(l.damage);
          state.lasers.splice(i, 1);
          continue;
        }

        // Check hit on allies
        for (const a of state.allies) {
          if (!a.alive) continue;
          const da = vec3dist(l.pos, a.pos);
          if (da < hitRadius) {
            a.health -= l.damage;
            if (a.health <= 0) {
              a.alive = false;
              createExplosion(a.pos, 1.0, '#4488ff');
            }
            state.lasers.splice(i, 1);
            break;
          }
        }
      }

      // Player lasers can accidentally hit allies (friendly fire)
      if (l.owner === 'player') {
        for (const a of state.allies) {
          if (!a.alive) continue;
          const da = vec3dist(l.pos, a.pos);
          if (da < hitRadius) {
            a.health -= l.damage;
            if (a.health <= 0) {
              a.alive = false;
              createExplosion(a.pos, 1.0, '#4488ff');
              state.score -= 200; // Penalty for friendly fire
              showAlert('FRIENDLY FIRE!', 1500);
            }
            state.lasers.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        state.particles.splice(i, 1);
        continue;
      }
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt;
      p.vel.x *= 0.98;
      p.vel.y *= 0.98;
      p.vel.z *= 0.98;
    }

    for (let i = state.explosions.length - 1; i >= 0; i--) {
      state.explosions[i].age += dt;
      if (state.explosions[i].age >= state.explosions[i].life) {
        state.explosions.splice(i, 1);
      }
    }
  }

  function applyDamageToPlayer(damage) {
    // Shield absorbs first
    if (state.shield > 0) {
      const absorbed = Math.min(state.shield, damage);
      state.shield -= absorbed;
      damage -= absorbed;
    }
    state.health -= damage;

    // Visual feedback
    const dmgFlash = document.querySelector('.damage-flash');
    if (dmgFlash) {
      dmgFlash.classList.add('hit');
      setTimeout(() => dmgFlash.classList.remove('hit'), 150);
    }

    playSound('hit');

    if (state.health <= 0) {
      state.health = 0;
      gameOver();
    }

    updateHUD();
  }


  /* ═══════════════════════════════════════════════
     LOCK-ON SYSTEM
     ═══════════════════════════════════════════════ */
  function updateLockOn(dt) {
    const sy = Math.sin(state.rot.yaw), cy = Math.cos(state.rot.yaw);
    const sp = Math.sin(state.rot.pitch), cp = Math.cos(state.rot.pitch);
    const fwd = vec3normalize({ x: sy * cp, y: -sp, z: cy * cp });

    let bestTarget = null;
    let bestAngle = CFG.lockOnAngle * DEG;

    for (const e of state.enemies) {
      if (!e.alive) continue;
      const toE = vec3normalize({
        x: e.pos.x - state.pos.x,
        y: e.pos.y - state.pos.y,
        z: e.pos.z - state.pos.z,
      });
      const dot = fwd.x * toE.x + fwd.y * toE.y + fwd.z * toE.z;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      if (angle < bestAngle) {
        bestAngle = angle;
        bestTarget = e;
      }
    }

    if (bestTarget && bestTarget === state.lockTarget) {
      state.lockProgress = Math.min(1, state.lockProgress + dt / CFG.lockOnTime);
    } else {
      state.lockTarget = bestTarget;
      state.lockProgress = bestTarget ? 0.1 : 0;
    }

    // Update crosshair
    const ch = document.querySelector('.crosshair');
    if (ch) {
      if (state.lockProgress >= 1) {
        ch.classList.add('locked');
      } else {
        ch.classList.remove('locked');
      }
    }
  }


  /* ═══════════════════════════════════════════════
     ALERT SYSTEM
     ═══════════════════════════════════════════════ */
  function updateAlerts(dt) {
    let closestEnemyDist = Infinity;
    let enemyLocking = false;

    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = vec3dist(e.pos, state.pos);
      if (d < closestEnemyDist) closestEnemyDist = d;
      if (e.lockingPlayer) enemyLocking = true;
    }

    // Check for incoming lasers
    let closestLaser = Infinity;
    for (const l of state.lasers) {
      if (l.owner !== 'enemy') continue;
      const d = vec3dist(l.pos, state.pos);
      if (d < closestLaser) closestLaser = d;
    }

    // Determine alert level
    let newLevel = 0;
    if (closestEnemyDist < CFG.warnDistance || closestLaser < 500) newLevel = 1;
    if (closestEnemyDist < CFG.dangerDistance || closestLaser < 200) newLevel = 2;
    if (enemyLocking || closestLaser < 100) newLevel = 3;

    if (newLevel !== state.alertLevel) {
      state.alertLevel = newLevel;

      const warning = document.querySelector('.warning-overlay');
      const lockWarn = document.querySelector('.lock-warning');
      const evasive = document.querySelector('.evasive-indicator');

      if (warning) warning.classList.toggle('active', newLevel >= 2);
      if (lockWarn) {
        lockWarn.classList.toggle('visible', newLevel >= 3);
        lockWarn.textContent = newLevel >= 3 ? '⚠ MISSILE LOCK — DEPLOY COUNTERMEASURES [C]' : '';
      }
      if (evasive) {
        evasive.classList.toggle('visible', newLevel >= 2);
        evasive.textContent = newLevel >= 2 ? 'TAKE EVASIVE ACTION' : '';
      }

      if (newLevel >= 2) playSound('alarm');
    }
  }

  function checkWaveComplete() {
    const alive = state.enemies.filter(e => e.alive).length;
    if (alive === 0 && state.enemies.length > 0) {
      state.wave++;
      state.score += 500 * state.wave;

      // Bonus countermeasures
      state.countermeasures = Math.min(CFG.maxCountermeasures, state.countermeasures + 1);
      updateCMDisplay();

      showAlert('WAVE ' + state.wave, 2000);

      // Clear dead
      state.enemies = [];
      state.allies = state.allies.filter(a => a.alive);

      // Short delay before next wave
      setTimeout(() => {
        if (state.running && !state.gameOver) spawnWave();
      }, 2500);
    }
  }

  let alertTimeout = null;
  function showAlert(text, duration) {
    const el = document.querySelector('.alert-text');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => el.classList.remove('visible'), duration || 2000);
  }


  /* ═══════════════════════════════════════════════
     RENDER LOOP
     ═══════════════════════════════════════════════ */
  function render() {
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);

    renderNebulae();
    renderStars();
    renderGridFloor();
    renderEntities();
    renderLasers();
    renderParticles();
    renderExplosions();
    renderCockpit();
    renderRadar();
    updateHUD();
  }

  function renderGridFloor() {
    // 80s grid floor
    const gridY = -300;
    const gridSize = 200;
    const gridCount = 30;
    ctx.strokeStyle = 'rgba(0,255,136,0.08)';
    ctx.lineWidth = 1;

    for (let i = -gridCount; i <= gridCount; i++) {
      // Lines along X
      const p1 = project(
        state.pos.x + i * gridSize - (state.pos.x % gridSize),
        gridY,
        state.pos.z - gridCount * gridSize
      );
      const p2 = project(
        state.pos.x + i * gridSize - (state.pos.x % gridSize),
        gridY,
        state.pos.z + gridCount * gridSize
      );
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Lines along Z
      const p3 = project(
        state.pos.x - gridCount * gridSize,
        gridY,
        state.pos.z + i * gridSize - (state.pos.z % gridSize)
      );
      const p4 = project(
        state.pos.x + gridCount * gridSize,
        gridY,
        state.pos.z + i * gridSize - (state.pos.z % gridSize)
      );
      if (p3 && p4) {
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }
    }
  }

  function renderEntities() {
    // Render enemies
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const p = project(e.pos.x, e.pos.y, e.pos.z);
      if (!p) continue;

      const heading = Math.atan2(
        e.vel.x - state.vel.x,
        e.vel.z - state.vel.z
      );
      drawWireframeShip(p, e.size, '#ff3333', heading, 'enemy');

      // Health bar above enemy
      if (p.z < 1500) {
        const barW = 30 * p.scale * e.size * 20;
        const barH = 3;
        const hpPct = e.health / e.maxHealth;
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(p.x - barW / 2, p.y - e.size * p.scale * 35, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#33ff33' : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
        ctx.fillRect(p.x - barW / 2, p.y - e.size * p.scale * 35, barW * hpPct, barH);
      }

      // Target bracket if locked
      if (e === state.lockTarget && state.lockProgress > 0) {
        const bSize = 25 * p.scale * e.size * 20;
        const prog = state.lockProgress;
        ctx.strokeStyle = prog >= 1 ? '#ff3333' : `rgba(255,170,0,${0.5 + prog * 0.5})`;
        ctx.lineWidth = 1.5;

        const corners = [
          [p.x - bSize, p.y - bSize, 1, 0, 0, 1],
          [p.x + bSize, p.y - bSize, -1, 0, 0, 1],
          [p.x - bSize, p.y + bSize, 1, 0, 0, -1],
          [p.x + bSize, p.y + bSize, -1, 0, 0, -1],
        ];
        const len = bSize * 0.3 * (0.5 + prog * 0.5);
        for (const [cx, cy, dx, _, __, dy] of corners) {
          ctx.beginPath();
          ctx.moveTo(cx + dx * len, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + dy * len);
          ctx.stroke();
        }

        // Distance readout
        const dist = Math.round(vec3dist(e.pos, state.pos));
        ctx.fillStyle = prog >= 1 ? '#ff3333' : '#ffaa00';
        ctx.font = '10px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dist + 'm', p.x, p.y + bSize + 14);

        if (prog >= 1) {
          ctx.fillText('LOCKED', p.x, p.y - bSize - 8);
        }
      }
    }

    // Render allies
    for (const a of state.allies) {
      if (!a.alive) continue;
      const p = project(a.pos.x, a.pos.y, a.pos.z);
      if (!p) continue;

      const heading = Math.atan2(a.vel.x, a.vel.z);
      drawWireframeShip(p, a.size, '#4488ff', heading, 'ally');

      // Ally marker
      if (p.z < 1500) {
        ctx.fillStyle = '#4488ff';
        ctx.font = '8px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ALLY', p.x, p.y - a.size * p.scale * 35);
      }
    }
  }

  function renderLasers() {
    for (const l of state.lasers) {
      const p = project(l.pos.x, l.pos.y, l.pos.z);
      if (!p) continue;

      const len = 40 * p.scale;
      const dir = vec3normalize(l.vel);

      const p2 = project(
        l.pos.x - dir.x * 30,
        l.pos.y - dir.y * 30,
        l.pos.z - dir.z * 30
      );

      ctx.strokeStyle = l.color;
      ctx.lineWidth = Math.max(1, 2 * p.scale);
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 8;

      if (p2) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - dir.x * len, p.y + dir.y * len);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
  }

  function renderParticles() {
    for (const p of state.particles) {
      const proj = project(p.pos.x, p.pos.y, p.pos.z);
      if (!proj) continue;

      const alpha = 1 - (p.age / p.life);
      const sz = p.size * proj.scale * 5;
      ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      // Handle hex colors
      if (p.color.startsWith('#')) {
        const r = parseInt(p.color.slice(1, 3), 16);
        const g = parseInt(p.color.slice(3, 5), 16);
        const b = parseInt(p.color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      }
      ctx.fillRect(proj.x - sz / 2, proj.y - sz / 2, sz, sz);
    }
  }

  function renderExplosions() {
    for (const ex of state.explosions) {
      const proj = project(ex.pos.x, ex.pos.y, ex.pos.z);
      if (!proj) continue;

      const progress = ex.age / ex.life;
      const radius = ex.size * 60 * proj.scale * (0.3 + progress * 0.7);
      const alpha = 1 - progress;

      // Expanding ring
      ctx.strokeStyle = `rgba(255,136,0,${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, TAU);
      ctx.stroke();

      // Inner glow
      if (alpha > 0.3) {
        const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, radius * 0.6);
        grad.addColorStop(0, `rgba(255,255,200,${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255,100,0,0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
  }


  /* ═══════════════════════════════════════════════
     RADAR SYSTEM
     ═══════════════════════════════════════════════ */
  const radarCanvas = document.querySelector('.radar-canvas');
  let radarCtx;

  function initRadar() {
    if (radarCanvas) {
      radarCtx = radarCanvas.getContext('2d');
    }
  }

  function renderRadar() {
    if (!radarCtx) return;

    const rc = radarCtx;
    const rW = radarCanvas.width = radarCanvas.offsetWidth * 2;
    const rH = radarCanvas.height = radarCanvas.offsetHeight * 2;
    const rCX = rW / 2, rCY = rH / 2;
    const rRadius = rW / 2 - 4;
    const radarRange = 2500;

    rc.clearRect(0, 0, rW, rH);

    // Player heading vector
    const py = state.rot.yaw;

    // Draw enemy blips
    let enemyCount = 0;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      enemyCount++;

      // Relative position
      const dx = e.pos.x - state.pos.x;
      const dz = e.pos.z - state.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Rotate by player yaw so forward is up
      const angle = Math.atan2(dx, dz) - py;
      const normDist = Math.min(1, dist / radarRange);

      const bx = rCX + Math.sin(angle) * normDist * rRadius;
      const by = rCY - Math.cos(angle) * normDist * rRadius;

      // Blip with pulse
      const pulse = Math.sin(state.time * 5) * 0.3 + 0.7;
      rc.fillStyle = `rgba(255,51,51,${pulse})`;
      rc.beginPath();
      rc.arc(bx, by, 4, 0, TAU);
      rc.fill();

      // Direction indicator for close enemies
      if (normDist < 0.5) {
        rc.strokeStyle = 'rgba(255,51,51,0.4)';
        rc.lineWidth = 1;
        rc.beginPath();
        rc.moveTo(rCX, rCY);
        rc.lineTo(bx, by);
        rc.stroke();
      }
    }

    // Draw ally blips
    for (const a of state.allies) {
      if (!a.alive) continue;

      const dx = a.pos.x - state.pos.x;
      const dz = a.pos.z - state.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz) - py;
      const normDist = Math.min(1, dist / radarRange);

      const bx = rCX + Math.sin(angle) * normDist * rRadius;
      const by = rCY - Math.cos(angle) * normDist * rRadius;

      rc.fillStyle = 'rgba(68,136,255,0.8)';
      rc.beginPath();
      rc.arc(bx, by, 3, 0, TAU);
      rc.fill();
    }

    // Forward indicator
    rc.strokeStyle = 'rgba(0,255,136,0.3)';
    rc.lineWidth = 1;
    rc.beginPath();
    rc.moveTo(rCX, rCY);
    rc.lineTo(rCX, rCY - rRadius * 0.3);
    rc.stroke();

    // Update count
    const countEl = document.querySelector('.radar-count');
    if (countEl) {
      const allyCount = state.allies.filter(a => a.alive).length;
      countEl.textContent = `HOSTILE: ${enemyCount}  |  ALLY: ${allyCount}`;
    }
  }


  /* ═══════════════════════════════════════════════
     HUD UPDATE
     ═══════════════════════════════════════════════ */
  function updateHUD() {
    // Bars
    setBar('.bar-fill.health', state.health / CFG.playerHealth);
    setBar('.bar-fill.shield', state.shield / CFG.playerShield);
    setBar('.bar-fill.energy', state.energy / 100);

    // Throttle
    const tFill = document.querySelector('.throttle-fill');
    if (tFill) tFill.style.height = (state.throttle * 100) + '%';

    // Speed
    const speedEl = document.querySelector('.speed-readout');
    if (speedEl) speedEl.textContent = Math.round(state.speed) + ' M/S';

    // Score
    const scoreEl = document.querySelector('.hud-score');
    if (scoreEl) scoreEl.textContent = state.score.toString().padStart(8, '0');

    // Wave
    const waveEl = document.querySelector('.wave-number');
    if (waveEl) waveEl.textContent = 'WAVE ' + state.wave;

    const killsEl = document.querySelector('.kills-count');
    if (killsEl) killsEl.textContent = state.kills + ' KILLS';
  }

  function setBar(selector, pct) {
    const el = document.querySelector(selector);
    if (el) el.style.width = Math.max(0, Math.min(100, pct * 100)) + '%';
  }

  function updateCMDisplay() {
    const pips = document.querySelectorAll('.cm-pip');
    pips.forEach((pip, i) => {
      pip.classList.toggle('used', i >= state.countermeasures);
    });
  }


  /* ═══════════════════════════════════════════════
     GAME FLOW
     ═══════════════════════════════════════════════ */
  function startGame() {
    state.running = true;
    state.gameOver = false;
    state.health = CFG.playerHealth;
    state.shield = CFG.playerShield;
    state.energy = 100;
    state.score = 0;
    state.kills = 0;
    state.wave = 1;
    state.pos = { x: 0, y: 0, z: 0 };
    state.vel = { x: 0, y: 0, z: 0 };
    state.rot = { pitch: 0, yaw: 0, roll: 0 };
    state.speed = 0;
    state.throttle = 0.3;
    state.enemies = [];
    state.allies = [];
    state.lasers = [];
    state.explosions = [];
    state.particles = [];
    state.countermeasures = CFG.maxCountermeasures;
    state.cmCooldownTimer = 0;
    state.lockTarget = null;
    state.lockProgress = 0;
    state.alertLevel = 0;

    updateCMDisplay();

    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');
    const gameOverScreen = document.getElementById('gameover-screen');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');

    // Lock pointer
    canvas.requestPointerLock();

    spawnWave();
    showAlert('WAVE 1', 2000);

    // Start music
    if (!state.musicPlaying) {
      startMusic();
    }
  }

  function gameOver() {
    state.gameOver = true;
    state.running = false;

    createExplosion(state.pos, 3, '#ff8800');

    document.exitPointerLock();

    const screen = document.getElementById('gameover-screen');
    if (screen) {
      screen.classList.remove('hidden');
      screen.querySelector('.screen-stat-value.score').textContent = state.score;
      screen.querySelector('.screen-stat-value.waves').textContent = state.wave;
      screen.querySelector('.screen-stat-value.kills-final').textContent = state.kills;
    }
  }


  /* ═══════════════════════════════════════════════
     INPUT HANDLING
     ═══════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    state.keys[e.code] = true;

    if (e.code === 'KeyC') deployCountermeasure();
    if (e.code === 'Space') state.firing = true;
    if (e.code === 'Escape') {
      if (state.running) {
        state.paused = !state.paused;
        if (state.paused) {
          showAlert('PAUSED', 99999);
          document.exitPointerLock();
        } else {
          document.querySelector('.alert-text')?.classList.remove('visible');
          canvas.requestPointerLock();
        }
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    state.keys[e.code] = false;
    if (e.code === 'Space') state.firing = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      state.mouse.dx += e.movementX;
      state.mouse.dy += e.movementY;
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) state.firing = true;
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) state.firing = false;
  });


  /* ═══════════════════════════════════════════════
     SOUND — Web Audio API (80s synth effects)
     ═══════════════════════════════════════════════ */
  let audioCtx;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ac = ensureAudio();
      const now = ac.currentTime;

      if (type === 'laser') {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }

      else if (type === 'enemyLaser') {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }

      else if (type === 'explode') {
        const bufSize = ac.sampleRate * 0.4;
        const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
        }
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        src.connect(filter).connect(gain).connect(ac.destination);
        src.start(now);
      }

      else if (type === 'hit') {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      else if (type === 'alarm') {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.15);
        osc.frequency.setValueAtTime(440, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      else if (type === 'countermeasure') {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (_) { /* audio not available */ }
  }


  /* ═══════════════════════════════════════════════
     MUSIC ENGINE — 80s Space Battle Synth Score
     Verse → Chorus → Hook → Resolution structure
     4/4 time, BPM 128
     ═══════════════════════════════════════════════ */
  let musicNodes = [];
  let musicInterval = null;

  function startMusic() {
    const ac = ensureAudio();
    state.musicPlaying = true;

    const BPM = 128;
    const beatLen = 60 / BPM;
    const barLen = beatLen * 4;

    // Song structure: 16-bar loop
    //  Bars 1-4:  Verse (building tension)
    //  Bars 5-8:  Chorus (full energy)
    //  Bars 9-10: Hook (iconic riff)
    //  Bars 11-12: Bridge (breakdown)
    //  Bars 13-16: Resolution (release + rebuild)
    const songLength = barLen * 16;
    let songPos = 0;

    // Master output chain
    const masterGain = ac.createGain();
    masterGain.gain.value = 0.18;
    const compressor = ac.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    masterGain.connect(compressor).connect(ac.destination);
    musicNodes.push(masterGain, compressor);

    // Create a reverb/delay for space atmosphere
    const delay = ac.createDelay(0.5);
    delay.delayTime.value = beatLen * 0.75;
    const delayFeedback = ac.createGain();
    delayFeedback.gain.value = 0.25;
    const delayFilter = ac.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2000;
    delay.connect(delayFeedback).connect(delayFilter).connect(delay);
    delay.connect(masterGain);
    musicNodes.push(delay, delayFeedback, delayFilter);

    // Note frequencies (C minor scale — dramatic space feel)
    const NOTE = {
      C2: 65.41, D2: 73.42, Eb2: 77.78, F2: 87.31, G2: 98.00, Ab2: 103.83, Bb2: 116.54,
      C3: 130.81, D3: 146.83, Eb3: 155.56, F3: 174.61, G3: 196.00, Ab3: 207.65, Bb3: 233.08,
      C4: 261.63, D4: 293.66, Eb4: 311.13, F4: 349.23, G4: 392.00, Ab4: 415.30, Bb4: 466.16,
      C5: 523.25, D5: 587.33, Eb5: 622.25, G5: 783.99,
    };

    // ── DRUM MACHINE ──
    function scheduleDrums(startTime, barIndex, inSong) {
      const section = getSection(barIndex);

      for (let beat = 0; beat < 4; beat++) {
        const t = startTime + beat * beatLen;

        // Kick on 1 and 3 (always)
        if (beat === 0 || beat === 2) {
          scheduleKick(t);
        }

        // Snare on 2 and 4
        if (beat === 1 || beat === 3) {
          scheduleSnare(t, section === 'chorus' ? 0.15 : 0.1);
        }

        // Hi-hat — 8th notes in verse, 16th in chorus
        if (section === 'chorus' || section === 'hook') {
          for (let sub = 0; sub < 4; sub++) {
            scheduleHihat(t + sub * beatLen / 4, sub % 2 === 0 ? 0.06 : 0.03);
          }
        } else {
          scheduleHihat(t, 0.05);
          scheduleHihat(t + beatLen / 2, 0.03);
        }
      }

      // Fill on last bar of section
      if (barIndex % 4 === 3) {
        for (let i = 0; i < 8; i++) {
          scheduleSnare(startTime + 3 * beatLen + i * beatLen / 8, 0.08);
        }
      }
    }

    function scheduleKick(t) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    function scheduleSnare(t, vol) {
      const bufSize = ac.sampleRate * 0.1;
      const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
      }
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      src.connect(filter).connect(gain).connect(masterGain);
      src.start(t);
    }

    function scheduleHihat(t, vol) {
      const bufSize = ac.sampleRate * 0.03;
      const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
      }
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      src.connect(filter).connect(gain).connect(masterGain);
      src.start(t);
    }

    // ── BASSLINE ──
    function scheduleBass(startTime, barIndex) {
      const section = getSection(barIndex);
      const localBar = barIndex % 4;

      // Bass patterns per section
      const patterns = {
        verse: [
          [NOTE.C2, NOTE.C2, NOTE.Eb2, NOTE.G2],
          [NOTE.Ab2, NOTE.Ab2, NOTE.Bb2, NOTE.C3],
          [NOTE.F2, NOTE.F2, NOTE.Ab2, NOTE.Bb2],
          [NOTE.G2, NOTE.G2, NOTE.Bb2, NOTE.C3],
        ],
        chorus: [
          [NOTE.C3, NOTE.C3, NOTE.Eb3, NOTE.G3],
          [NOTE.Ab2, NOTE.Bb2, NOTE.C3, NOTE.Eb3],
          [NOTE.F2, NOTE.Ab2, NOTE.F2, NOTE.Ab2],
          [NOTE.G2, NOTE.Bb2, NOTE.G2, NOTE.D3],
        ],
        hook: [
          [NOTE.C3, NOTE.G2, NOTE.C3, NOTE.Eb3],
          [NOTE.F3, NOTE.Eb3, NOTE.C3, NOTE.G2],
        ],
        bridge: [
          [NOTE.Ab2, NOTE.Ab2, NOTE.Bb2, NOTE.Bb2],
          [NOTE.Eb2, NOTE.Eb2, NOTE.F2, NOTE.G2],
        ],
        resolution: [
          [NOTE.C2, NOTE.Eb2, NOTE.G2, NOTE.C3],
          [NOTE.Ab2, NOTE.Bb2, NOTE.C3, NOTE.G2],
          [NOTE.F2, NOTE.G2, NOTE.Ab2, NOTE.Bb2],
          [NOTE.G2, NOTE.Ab2, NOTE.Bb2, NOTE.C3],
        ],
      };

      const pattern = patterns[section][localBar % patterns[section].length];

      for (let beat = 0; beat < 4; beat++) {
        const t = startTime + beat * beatLen;
        const freq = pattern[beat];

        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(section === 'chorus' ? 600 : 400, t);

        const vol = section === 'bridge' ? 0.08 : 0.12;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.setValueAtTime(vol * 0.8, t + beatLen * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 0.95);

        osc.connect(filter).connect(gain).connect(masterGain);
        osc.start(t);
        osc.stop(t + beatLen);
      }
    }

    // ── LEAD MELODY ──
    function scheduleLead(startTime, barIndex) {
      const section = getSection(barIndex);
      const localBar = barIndex % 4;

      if (section === 'bridge') return; // Sparse in bridge

      // Melody patterns — space battle heroic theme
      const melodies = {
        verse: [
          // Building phrases
          [{ n: NOTE.G4, d: 1 }, { n: NOTE.Eb4, d: 1 }, { n: NOTE.F4, d: 1 }, { n: NOTE.G4, d: 1 }],
          [{ n: NOTE.Ab4, d: 1.5 }, { n: NOTE.G4, d: 0.5 }, { n: NOTE.F4, d: 1 }, { n: NOTE.Eb4, d: 1 }],
          [{ n: NOTE.C4, d: 1 }, { n: NOTE.Eb4, d: 1 }, { n: NOTE.G4, d: 2 }],
          [{ n: NOTE.Ab4, d: 1 }, { n: NOTE.G4, d: 1 }, { n: NOTE.F4, d: 1 }, { n: NOTE.Eb4, d: 1 }],
        ],
        chorus: [
          // Big heroic melody
          [{ n: NOTE.C5, d: 1 }, { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.Ab4, d: 0.5 }, { n: NOTE.G4, d: 2 }],
          [{ n: NOTE.Ab4, d: 1 }, { n: NOTE.Bb4, d: 1 }, { n: NOTE.C5, d: 2 }],
          [{ n: NOTE.Eb5, d: 1 }, { n: NOTE.D5, d: 1 }, { n: NOTE.C5, d: 1 }, { n: NOTE.Bb4, d: 1 }],
          [{ n: NOTE.C5, d: 2 }, { n: NOTE.G4, d: 2 }],
        ],
        hook: [
          // THE iconic riff
          [{ n: NOTE.C5, d: 0.5 }, { n: NOTE.Eb5, d: 0.5 }, { n: NOTE.G5, d: 0.5 }, { n: NOTE.Eb5, d: 0.5 },
           { n: NOTE.C5, d: 0.5 }, { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.Ab4, d: 0.5 }, { n: NOTE.G4, d: 0.5 }],
          [{ n: NOTE.Ab4, d: 0.5 }, { n: NOTE.Bb4, d: 0.5 }, { n: NOTE.C5, d: 1 },
           { n: NOTE.G4, d: 1 }, { n: NOTE.C5, d: 1 }],
        ],
        resolution: [
          [{ n: NOTE.C5, d: 2 }, { n: NOTE.G4, d: 2 }],
          [{ n: NOTE.Ab4, d: 1 }, { n: NOTE.Bb4, d: 1 }, { n: NOTE.C5, d: 2 }],
          [{ n: NOTE.Eb4, d: 1 }, { n: NOTE.F4, d: 1 }, { n: NOTE.G4, d: 2 }],
          [{ n: NOTE.G4, d: 1 }, { n: NOTE.Ab4, d: 1 }, { n: NOTE.Bb4, d: 1 }, { n: NOTE.C5, d: 1 }],
        ],
      };

      const melody = melodies[section][localBar % melodies[section].length];
      let pos = 0;

      for (const note of melody) {
        const t = startTime + pos * beatLen;
        const dur = note.d * beatLen;

        const osc = ac.createOscillator();
        const osc2 = ac.createOscillator(); // Detuned for richness
        const gain = ac.createGain();

        osc.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.n, t);
        osc2.frequency.setValueAtTime(note.n * 1.005, t); // Slight detune

        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.exponentialRampToValueAtTime(1000, t + dur * 0.9);

        const vol = section === 'chorus' || section === 'hook' ? 0.07 : 0.05;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.02);
        gain.gain.setValueAtTime(vol * 0.8, t + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay); // Feed reverb

        osc.start(t);
        osc.stop(t + dur);
        osc2.start(t);
        osc2.stop(t + dur);

        pos += note.d;
      }
    }

    // ── ARPEGGIATOR (space atmosphere) ──
    function scheduleArp(startTime, barIndex) {
      const section = getSection(barIndex);
      if (section === 'resolution' && barIndex % 4 > 1) return;

      // Arpeggio chords per section
      const chords = {
        verse:      [NOTE.C4, NOTE.Eb4, NOTE.G4],
        chorus:     [NOTE.C4, NOTE.Eb4, NOTE.G4, NOTE.Bb4],
        hook:       [NOTE.C4, NOTE.Eb4, NOTE.G4, NOTE.C5],
        bridge:     [NOTE.Ab3, NOTE.C4, NOTE.Eb4],
        resolution: [NOTE.C4, NOTE.G4, NOTE.C5],
      };

      const chord = chords[section];
      const stepLen = beatLen / (section === 'hook' ? 4 : 2);
      const steps = Math.floor(barLen / stepLen);

      for (let i = 0; i < steps; i++) {
        const t = startTime + i * stepLen;
        const freq = chord[i % chord.length];

        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const vol = section === 'bridge' ? 0.02 : 0.035;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepLen * 0.8);

        osc.connect(gain).connect(delay); // Into reverb for spacey feel
        osc.start(t);
        osc.stop(t + stepLen);
      }
    }

    // ── Section mapper ──
    function getSection(barIndex) {
      const b = barIndex % 16;
      if (b < 4) return 'verse';
      if (b < 8) return 'chorus';
      if (b < 10) return 'hook';
      if (b < 12) return 'bridge';
      return 'resolution';
    }

    // ── Scheduler ──
    let barCounter = 0;
    let nextBarTime = ac.currentTime + 0.1;

    function scheduleAhead() {
      const lookahead = 2.0; // Schedule 2 seconds ahead
      while (nextBarTime < ac.currentTime + lookahead) {
        scheduleDrums(nextBarTime, barCounter);
        scheduleBass(nextBarTime, barCounter);
        scheduleLead(nextBarTime, barCounter);
        scheduleArp(nextBarTime, barCounter);
        nextBarTime += barLen;
        barCounter++;
      }
    }

    musicInterval = setInterval(scheduleAhead, 100);
    scheduleAhead();

    // Update toggle button
    const btn = document.querySelector('.music-toggle');
    if (btn) btn.textContent = '♫ MUSIC ON';
  }

  function stopMusic() {
    state.musicPlaying = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
    const btn = document.querySelector('.music-toggle');
    if (btn) btn.textContent = '♫ MUSIC OFF';
  }


  /* ═══════════════════════════════════════════════
     MAIN LOOP
     ═══════════════════════════════════════════════ */
  function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - state.lastFrame) / 1000);
    state.lastFrame = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }


  /* ═══════════════════════════════════════════════
     INITIALIZATION
     ═══════════════════════════════════════════════ */
  function init() {
    initStars();
    initNebulae();
    initRadar();

    // Start button
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => startGame());
    }

    // Restart button
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => startGame());
    }

    // Music toggle
    const musicBtn = document.querySelector('.music-toggle');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => {
        if (state.musicPlaying) {
          stopMusic();
        } else {
          startMusic();
        }
      });
    }

    // Begin render loop (shows starfield even on title screen)
    state.lastFrame = performance.now();
    requestAnimationFrame(gameLoop);

    console.log('[SpaceBattle] Dimensional substrate initialized — φ =', PHI);
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
