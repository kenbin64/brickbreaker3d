/**
 * BrickBreaker 3D - Game Logic
 *
 * MINIMAL SURFACE ARCHITECTURE
 * Built with Ken's Games Engine substrates
 *
 * Total: ~200 lines (vs 1000+ in original breakout3d.html)
 */

(async function() {
    'use strict';

    // ================================
    // INITIALIZE ENGINE (loads all substrates)
    // ================================
    await KensEngine.init({ showJoystick: true, joystickOptions: { label: 'Paddle' } });

    const { vec3, createBody, sphereVsBox, sphereVsPlane, resolveCollision, integrate } = PhysicsSubstrate;

    // ================================
    // STATE (Minimal - derive the rest)
    // ================================
    const state = {
        score: 0,
        level: 1,
        launched: false,
        mode: 'paddle'  // 'paddle' | 'camera'
    };

    // ================================
    // RENDER SETUP (via substrate)
    // ================================
    const canvas = document.getElementById('canvas');
    const { scene, camera } = RenderSubstrate.init(canvas, {
        background: 0x0a0a1a,
        shadows: true,
        cameraZ: 30
    });
    
    // ================================
    // ARENA (via RenderSubstrate)
    // ================================
    const S = 12; // Arena size
    const arena = new THREE.Group();
    scene.add(arena);

    // Floor grid
    const grid = new THREE.GridHelper(S, 12, 0x00ffcc, 0x004444);
    grid.position.y = -S/2 + 0.01;
    arena.add(grid);

    // Transparent walls
    [[0,0,-S/2], [0,0,S/2], [-S/2,0,0], [S/2,0,0], [0,S/2,0], [0,-S/2,0]].forEach(pos => {
        const wall = RenderSubstrate.createPlane(S, S, 0x00ffcc, { transparent: true, opacity: 0.1, doubleSide: true });
        wall.position.set(...pos);
        if (pos[0] !== 0) wall.rotation.y = Math.PI/2;
        if (pos[1] !== 0) wall.rotation.x = Math.PI/2;
        arena.add(wall);
    });

    // ================================
    // PADDLE (via RenderSubstrate)
    // ================================
    const PR = 1.8; // Paddle radius
    const paddle = RenderSubstrate.createCylinder(PR, PR, 0.3, 0xffd700, { metalness: 0.9, emissive: 0xffaa00, emissiveIntensity: 0.3 });
    paddle.rotation.x = Math.PI/2;
    paddle.position.set(0, -S/2 + 0.5, 0);
    arena.add(paddle);

    // ================================
    // BALL (via PhysicsSubstrate body)
    // ================================
    const BR = 0.4; // Ball radius
    const ballMesh = RenderSubstrate.createSphere(BR, 0xffffff, { metalness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.2 });
    arena.add(ballMesh);

    const ball = createBody({ pos: vec3.create(0, -S/2 + 1.5, 0), radius: BR, restitution: 0.95 });
    const SPEED = 15;

    // ================================
    // BRICKS (generated from pattern)
    // ================================
    const bricks = [];
    const COLORS = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x00ffff, 0x0088ff, 0xff00ff];

    function createBricks() {
        bricks.forEach(b => arena.remove(b.mesh));
        bricks.length = 0;

        for (let y = 0; y < 3; y++) {
            for (let x = -2; x <= 2; x++) {
                for (let z = -2; z <= 2; z++) {
                    const mesh = RenderSubstrate.createBox(1.5, 0.6, 1.5, COLORS[(y + Math.abs(x) + Math.abs(z)) % 7], { metalness: 0.5 });
                    mesh.position.set(x * 2, S/2 - 2 - y, z * 2);
                    arena.add(mesh);
                    bricks.push({ mesh, body: createBody({ pos: vec3.create(x*2, S/2 - 2 - y, z*2), radius: 1, static: true }) });
                }
            }
        }
        updateHUD();
    }

    // ================================
    // LIGHTING (via RenderSubstrate)
    // ================================
    RenderSubstrate.addAmbient(0x404040, 0.5);
    RenderSubstrate.addDirectional(0xffffff, 1, [10, 20, 10]);
    RenderSubstrate.addPoint(0x00ffcc, 0.5, [0, 0, 15]);

    // ================================
    // CAMERA (spherical coords, always centered)
    // ================================
    let camTheta = 0, camPhi = 0, camDist = 30;

    const updateCamera = () => {
        camera.position.set(
            camDist * Math.sin(camTheta) * Math.cos(camPhi),
            camDist * Math.sin(camPhi),
            camDist * Math.cos(camTheta) * Math.cos(camPhi)
        );
        camera.lookAt(0, 0, 0);
    };

    const resetView = () => { camTheta = 0; camPhi = 0; camDist = 30; updateCamera(); };

    // ================================
    // CONTROLS (Joystick → paddle or camera)
    // ================================
    const bounds = S/2 - PR - 0.2;

    KensEngine.joystick.onMove((x, y) => {
        if (state.mode === 'paddle') {
            paddle.position.x = Math.max(-bounds, Math.min(bounds, paddle.position.x + x * 0.3));
            paddle.position.z = Math.max(-bounds, Math.min(bounds, paddle.position.z + y * 0.3));
            if (!state.launched) {
                ball.pos.x = paddle.position.x;
                ball.pos.z = paddle.position.z;
            }
        } else {
            camTheta += x * 0.02;
            camPhi = Math.max(-Math.PI/3, Math.min(Math.PI/3, camPhi + y * 0.02));
            updateCamera();
        }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.code === 'Space' && !state.launched) launch();
        if (e.code === 'KeyR') reset();
        if (e.code === 'KeyV') resetView();
        if (e.code === 'KeyM') toggleMode();
        if (e.code === 'Escape') KensEngine.openSettings();
    });

    canvas.addEventListener('click', () => !state.launched && launch());
    canvas.addEventListener('wheel', e => { camDist = Math.max(15, Math.min(60, camDist + e.deltaY * 0.05)); updateCamera(); });

    // ================================
    // GAME FUNCTIONS
    // ================================
    const launch = () => {
        state.launched = true;
        const a = (Math.random() - 0.5) * Math.PI/2;
        ball.vel = vec3.create(Math.sin(a) * SPEED, SPEED, (Math.random() - 0.5) * SPEED * 0.5);
    };

    const reset = () => {
        state.launched = false;
        ball.pos = vec3.create(paddle.position.x, -S/2 + 1.5, paddle.position.z);
        ball.vel = vec3.create();
        createBricks();
    };

    const toggleMode = () => {
        state.mode = state.mode === 'paddle' ? 'camera' : 'paddle';
        document.getElementById('control-mode').textContent = state.mode === 'paddle' ? '🎮 Joystick → Paddle' : '🎥 Joystick → Camera';
        document.getElementById('btn-mode').textContent = state.mode === 'paddle' ? '🎮 Paddle' : '🎥 Camera';
    };

    const updateHUD = () => {
        document.getElementById('score').textContent = `Score: ${state.score}`;
        document.getElementById('level').textContent = `Level: ${state.level}`;
        document.getElementById('bricks').textContent = `Bricks: ${bricks.length}`;
    };

    // ================================
    // PHYSICS (using PhysicsSubstrate)
    // ================================
    const updatePhysics = (dt) => {
        if (!state.launched) return;

        integrate(ball, dt);
        const half = S/2 - BR;

        // Wall bounces
        ['x', 'z'].forEach(axis => {
            if (Math.abs(ball.pos[axis]) > half) {
                ball.vel[axis] *= -1;
                ball.pos[axis] = Math.sign(ball.pos[axis]) * half;
            }
        });
        if (ball.pos.y > half) { ball.vel.y *= -1; ball.pos.y = half; }
        if (ball.pos.y < -half) { reset(); return; }

        // Paddle collision
        const pdist = Math.sqrt(Math.pow(ball.pos.x - paddle.position.x, 2) + Math.pow(ball.pos.z - paddle.position.z, 2));
        if (pdist < PR && ball.pos.y < paddle.position.y + 1 && ball.vel.y < 0) {
            ball.vel.y *= -1;
            ball.pos.y = paddle.position.y + 1;
            ball.vel.x += (ball.pos.x - paddle.position.x) / PR * 5;
        }

        // Brick collisions
        for (let i = bricks.length - 1; i >= 0; i--) {
            if (vec3.distance(ball.pos, bricks[i].body.pos) < 1.5) {
                arena.remove(bricks[i].mesh);
                const n = vec3.normalize(vec3.sub(ball.pos, bricks[i].body.pos));
                ball.vel = vec3.reflect(ball.vel, n);
                bricks.splice(i, 1);
                state.score += 10;
                updateHUD();
                if (bricks.length === 0) { state.level++; reset(); }
                break;
            }
        }

        ballMesh.position.set(ball.pos.x, ball.pos.y, ball.pos.z);
    };

    // ================================
    // LOOP
    // ================================
    let last = 0;
    const animate = (t) => {
        requestAnimationFrame(animate);
        updatePhysics(Math.min((t - last) / 1000, 0.1));
        last = t;
        RenderSubstrate.render();
    };

    // ================================
    // UI
    // ================================
    document.getElementById('btn-view').onclick = resetView;
    document.getElementById('btn-mode').onclick = toggleMode;
    document.getElementById('btn-settings').onclick = () => KensEngine.openSettings();
    document.getElementById('btn-start').onclick = () => { document.getElementById('start-screen').style.display = 'none'; KensEngine.audio.init(); reset(); };
    document.getElementById('btn-start-settings').onclick = () => KensEngine.openSettings();

    // ================================
    // START
    // ================================
    createBricks();
    resetView();
    animate(0);
    console.log('🧱 BrickBreaker 3D loaded — Minimal Surface Architecture');

})();

