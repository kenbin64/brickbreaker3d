/**
 * Camera Substrate - Universal camera management for 3D games
 * 
 * Modes:
 * - manual: User controls camera with mouse/touch (DEFAULT)
 * - auto: Camera follows action automatically
 * - fixed: Static camera position
 * 
 * Manifold-compliant: camera state derives from settings + scene context.
 */

const CameraSubstrate = (function() {
    'use strict';
    
    // Three.js camera reference
    let _camera = null;
    let _controls = null;
    let _scene = null;
    
    // Camera state
    let _mode = 'manual';
    let _target = null;
    let _autoTransitioning = false;
    
    // Default positions
    const POSITIONS = {
        close: 15,
        medium: 25,
        far: 40
    };
    
    const DEFAULT_ANGLE = 45; // degrees from horizontal
    
    /**
     * Initialize camera substrate
     */
    function init(camera, controls, scene) {
        _camera = camera;
        _controls = controls;
        _scene = scene;
        
        // Apply settings
        if (typeof SettingsSubstrate !== 'undefined') {
            _mode = SettingsSubstrate.get('cameraMode') || 'manual';
            
            SettingsSubstrate.onChange('cameraMode', (newMode) => {
                setMode(newMode);
            });
        }
        
        applyMode();
        console.log('[CameraSubstrate] Initialized, mode:', _mode);
    }
    
    /**
     * Set camera mode
     */
    function setMode(mode) {
        if (!['manual', 'auto', 'fixed'].includes(mode)) {
            console.warn('[CameraSubstrate] Invalid mode:', mode);
            return;
        }
        
        _mode = mode;
        
        if (typeof SettingsSubstrate !== 'undefined') {
            SettingsSubstrate.set('cameraMode', mode);
        }
        
        applyMode();
    }
    
    /**
     * Apply current mode settings
     */
    function applyMode() {
        if (!_controls) return;
        
        switch (_mode) {
            case 'manual':
                _controls.enabled = true;
                _controls.enableRotate = true;
                _controls.enableZoom = true;
                _controls.enablePan = true;
                _controls.autoRotate = false;
                break;
                
            case 'auto':
                _controls.enabled = true;
                _controls.enableRotate = false;
                _controls.enableZoom = true;
                _controls.enablePan = false;
                _controls.autoRotate = false;
                break;
                
            case 'fixed':
                _controls.enabled = false;
                break;
        }
    }
    
    /**
     * Set camera to default angled view
     */
    function setDefaultView() {
        if (!_camera) return;
        
        const settings = typeof SettingsSubstrate !== 'undefined' 
            ? SettingsSubstrate.getAll() 
            : { cameraAngle: DEFAULT_ANGLE, cameraDistance: 'medium' };
        
        const distance = POSITIONS[settings.cameraDistance] || POSITIONS.medium;
        const angleRad = (settings.cameraAngle || DEFAULT_ANGLE) * Math.PI / 180;
        
        // Calculate position: distance at angle from horizontal
        const y = distance * Math.sin(angleRad);
        const horizontalDist = distance * Math.cos(angleRad);
        
        _camera.position.set(0, y, horizontalDist);
        _camera.lookAt(0, 0, 0);
        
        if (_controls) {
            _controls.target.set(0, 0, 0);
            _controls.update();
        }
    }
    
    /**
     * Look at a target position (for auto mode)
     */
    function lookAt(x, y, z) {
        if (_mode !== 'auto' || !_camera) return;
        
        _target = { x, y, z };
    }
    
    /**
     * Update camera (call in animation loop)
     */
    function update(deltaTime) {
        if (_mode === 'auto' && _target && !_autoTransitioning) {
            // Smooth follow
            const current = _controls ? _controls.target : _camera.position;
            current.x += (_target.x - current.x) * 0.05;
            current.y += (_target.y - current.y) * 0.05;
            current.z += (_target.z - current.z) * 0.05;
            
            if (_controls) _controls.update();
        }
    }
    
    /**
     * Get current mode
     */
    function getMode() {
        return _mode;
    }
    
    /**
     * Cycle through modes
     */
    function cycleMode() {
        const modes = ['manual', 'auto', 'fixed'];
        const idx = modes.indexOf(_mode);
        setMode(modes[(idx + 1) % modes.length]);
        return _mode;
    }
    
    // Public API
    return {
        init,
        setMode,
        getMode,
        cycleMode,
        setDefaultView,
        lookAt,
        update,
        MODES: ['manual', 'auto', 'fixed']
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraSubstrate;
}

