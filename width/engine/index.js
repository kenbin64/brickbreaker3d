/**
 * Ken's Games Engine - Entry Point
 * 
 * Loads all substrates and manifolds, providing a unified game engine API.
 * Built on ButterflyFX manifold principles.
 * 
 * Usage:
 *   <script src="/engine/index.js"></script>
 *   <script>
 *     KensEngine.init().then(() => {
 *       // Engine ready
 *     });
 *   </script>
 */

const KensEngine = (function() {
    'use strict';
    
    const VERSION = '1.0.0';
    let _initialized = false;
    
    // Substrate registry
    const substrates = {
        settings: null,
        audio: null,
        camera: null,
        joystick: null,
        uiSettings: null
    };
    
    /**
     * Load a substrate script dynamically
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Get the engine base path
     */
    function getBasePath() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src.includes('engine/index.js')) {
                return script.src.replace('index.js', '');
            }
        }
        return '/engine/';
    }
    
    /**
     * Initialize the engine
     */
    async function init(options = {}) {
        if (_initialized) {
            console.warn('[KensEngine] Already initialized');
            return;
        }
        
        const basePath = getBasePath();
        console.log('[KensEngine] Initializing from', basePath);
        
        try {
            // Load substrates in order (settings first as others depend on it)
            await loadScript(basePath + 'substrate/settings_substrate.js');
            substrates.settings = window.SettingsSubstrate;
            substrates.settings.load();
            
            // Load remaining substrates in parallel
            await Promise.all([
                loadScript(basePath + 'substrate/audio_substrate.js'),
                loadScript(basePath + 'substrate/camera_substrate.js'),
                loadScript(basePath + 'substrate/joystick_substrate.js'),
                loadScript(basePath + 'substrate/ui_settings_substrate.js')
            ]);
            
            substrates.audio = window.AudioSubstrate;
            substrates.camera = window.CameraSubstrate;
            substrates.joystick = window.JoystickSubstrate;
            substrates.uiSettings = window.UISettingsSubstrate;
            
            _initialized = true;
            console.log('[KensEngine] Initialized successfully');
            
            // Apply any startup options
            if (options.showJoystick) {
                substrates.joystick.create(options.joystickOptions || {});
            }
            
            return substrates;
            
        } catch (error) {
            console.error('[KensEngine] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Open settings panel
     */
    function openSettings(options) {
        if (substrates.uiSettings) {
            substrates.uiSettings.open(options);
        }
    }
    
    /**
     * Get a substrate by name
     */
    function getSubstrate(name) {
        return substrates[name] || null;
    }
    
    /**
     * Check if engine is initialized
     */
    function isReady() {
        return _initialized;
    }
    
    // Public API
    return {
        VERSION,
        init,
        openSettings,
        getSubstrate,
        isReady,
        
        // Direct access to substrates (after init)
        get settings() { return substrates.settings; },
        get audio() { return substrates.audio; },
        get camera() { return substrates.camera; },
        get joystick() { return substrates.joystick; },
        get ui() { return substrates.uiSettings; }
    };
})();

// Auto-expose globally
window.KensEngine = KensEngine;

