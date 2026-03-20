// ═══════════════════════════════════════════════════════════════════════════════
// 🦋 BUTTERFLYFX 3D ARCADE ENGINE
// Shared THREE.js engine for all arcade games
// No if-statements, no iterations - pure dimensional manifestation
// ═══════════════════════════════════════════════════════════════════════════════

const ArcadeEngine3D = (() => {
    'use strict';
    
    // 🌊 Dimensional constants
    const PHI = 1.618033988749895; // Golden ratio
    const NEON_COLORS = {
        cyan: 0x00ffff,
        magenta: 0xff00ff,
        yellow: 0xffff00,
        green: 0x00ff00,
        orange: 0xff8800,
        red: 0xff0000,
        blue: 0x0088ff,
        white: 0xffffff
    };
    
    // 🎮 Create base scene
    const createScene = (config = {}) => {
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 50, 500);
        
        return scene;
    };
    
    // 📷 Create camera
    const createCamera = (config = {}) => {
        const camera = new THREE.PerspectiveCamera(
            config.fov ?? 75,
            window.innerWidth / window.innerHeight,
            config.near ?? 0.1,
            config.far ?? 1000
        );
        
        camera.position.set(
            config.x ?? 0,
            config.y ?? 0,
            config.z ?? 50
        );
        
        return camera;
    };
    
    // 🎨 Create renderer
    const createRenderer = (canvas) => {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        return renderer;
    };
    
    // ✨ Create neon wireframe material
    const createNeonMaterial = (color, opacity = 1) => {
        return new THREE.MeshBasicMaterial({
            color: NEON_COLORS[color] ?? color,
            wireframe: true,
            transparent: opacity < 1,
            opacity
        });
    };
    
    // 🔮 Create glowing material
    const createGlowMaterial = (color, opacity = 0.3) => {
        return new THREE.MeshBasicMaterial({
            color: NEON_COLORS[color] ?? color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide
        });
    };
    
    // 📦 Create wireframe box
    const createBox = (width, height, depth, color) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = createNeonMaterial(color);
        return new THREE.Mesh(geometry, material);
    };
    
    // ⚪ Create wireframe sphere
    const createSphere = (radius, color, segments = 16) => {
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const material = createNeonMaterial(color);
        return new THREE.Mesh(geometry, material);
    };
    
    // 🔺 Create wireframe pyramid
    const createPyramid = (size, color) => {
        const geometry = new THREE.ConeGeometry(size, size * 1.5, 4);
        const material = createNeonMaterial(color);
        return new THREE.Mesh(geometry, material);
    };
    
    // 🌌 Create starfield background
    const createStarfield = (count = 1000) => {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        Array.from({ length: count }, () => {
            positions.push(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
        });
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Points(geometry, material);
    };
    
    // 📐 Create grid floor
    const createGrid = (size = 100, divisions = 20, color = 'cyan') => {
        const grid = new THREE.GridHelper(size, divisions, NEON_COLORS[color], NEON_COLORS[color]);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        return grid;
    };
    
    // 🎯 Handle window resize
    const handleResize = (camera, renderer) => {
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };
    
    // 🌊 Export public API
    return {
        createScene,
        createCamera,
        createRenderer,
        createNeonMaterial,
        createGlowMaterial,
        createBox,
        createSphere,
        createPyramid,
        createStarfield,
        createGrid,
        handleResize,
        NEON_COLORS,
        PHI
    };
})();

