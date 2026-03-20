/**
 * Render Substrate - Minimal Three.js wrapper
 * 
 * Schwarz Diamond principle: minimal API surface, maximum rendering capability.
 * Wraps Three.js setup and common operations in ~100 lines.
 */

const RenderSubstrate = (function() {
    'use strict';
    
    let _renderer = null;
    let _scene = null;
    let _camera = null;
    let _canvas = null;
    
    // ================================
    // INITIALIZATION
    // ================================
    
    function init(canvas, options = {}) {
        if (typeof THREE === 'undefined') {
            throw new Error('[RenderSubstrate] THREE.js not loaded');
        }
        
        _canvas = canvas;
        
        // Renderer
        _renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: options.antialias !== false,
            alpha: options.alpha || false
        });
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        if (options.shadows) {
            _renderer.shadowMap.enabled = true;
            _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Scene
        _scene = new THREE.Scene();
        _scene.background = new THREE.Color(options.background || 0x000000);
        
        // Camera
        const aspect = window.innerWidth / window.innerHeight;
        _camera = new THREE.PerspectiveCamera(
            options.fov || 60,
            aspect,
            options.near || 0.1,
            options.far || 1000
        );
        _camera.position.set(0, 0, options.cameraZ || 30);
        
        // Handle resize
        window.addEventListener('resize', onResize);
        
        return { renderer: _renderer, scene: _scene, camera: _camera };
    }
    
    function onResize() {
        if (!_camera || !_renderer) return;
        _camera.aspect = window.innerWidth / window.innerHeight;
        _camera.updateProjectionMatrix();
        _renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // ================================
    // PRIMITIVES (Saddle Units)
    // ================================
    
    function createBox(width, height, depth, color, options = {}) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = createMaterial(color, options);
        const mesh = new THREE.Mesh(geometry, material);
        if (options.shadows !== false) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    }
    
    function createSphere(radius, color, options = {}) {
        const segments = options.segments || 32;
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const material = createMaterial(color, options);
        const mesh = new THREE.Mesh(geometry, material);
        if (options.shadows !== false) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    }
    
    function createCylinder(radiusTop, radiusBottom, height, color, options = {}) {
        const segments = options.segments || 32;
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
        const material = createMaterial(color, options);
        const mesh = new THREE.Mesh(geometry, material);
        if (options.shadows !== false) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    }
    
    function createPlane(width, height, color, options = {}) {
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = createMaterial(color, options);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        return mesh;
    }
    
    function createMaterial(color, options = {}) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness: options.metalness || 0,
            roughness: options.roughness || 0.5,
            transparent: options.transparent || false,
            opacity: options.opacity || 1,
            emissive: options.emissive || 0x000000,
            emissiveIntensity: options.emissiveIntensity || 0,
            side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide
        });
    }
    
    // ================================
    // LIGHTS
    // ================================
    
    function addAmbient(color = 0x404040, intensity = 0.5) {
        const light = new THREE.AmbientLight(color, intensity);
        _scene.add(light);
        return light;
    }
    
    function addDirectional(color = 0xffffff, intensity = 1, position = [10, 20, 10]) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(...position);
        light.castShadow = true;
        _scene.add(light);
        return light;
    }
    
    function addPoint(color = 0xffffff, intensity = 1, position = [0, 10, 0]) {
        const light = new THREE.PointLight(color, intensity, 50);
        light.position.set(...position);
        _scene.add(light);
        return light;
    }
    
    // ================================
    // RENDER LOOP
    // ================================
    
    function render() {
        if (_renderer && _scene && _camera) {
            _renderer.render(_scene, _camera);
        }
    }
    
    // ================================
    // SCENE MANAGEMENT
    // ================================
    
    function add(object) { _scene.add(object); }
    function remove(object) { _scene.remove(object); }
    function getScene() { return _scene; }
    function getCamera() { return _camera; }
    
    // Public API — minimal surface
    return {
        init, render,
        createBox, createSphere, createCylinder, createPlane, createMaterial,
        addAmbient, addDirectional, addPoint,
        add, remove, getScene, getCamera
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderSubstrate;
}

