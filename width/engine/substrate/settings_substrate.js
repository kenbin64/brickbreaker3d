/**
 * Settings Substrate - Universal game settings management
 * 
 * Manifold-compliant: Settings derive from stored preferences,
 * with sensible defaults when no preference exists.
 * 
 * Follows ButterflyFX pattern: store minimal, derive the rest.
 */

const SettingsSubstrate = (function() {
    'use strict';
    
    // Storage key prefix
    const STORAGE_KEY = 'kensgames_settings';
    
    // Default settings (the generative basis)
    const DEFAULTS = {
        // Audio
        musicEnabled: true,
        musicVolume: 0.5,
        sfxEnabled: true,
        sfxVolume: 0.7,
        
        // Camera
        cameraMode: 'manual',  // 'manual' | 'auto' | 'fixed'
        cameraAngle: 45,       // degrees from horizontal
        cameraDistance: 'medium', // 'close' | 'medium' | 'far'
        
        // Display
        theme: 'default',
        showFPS: false,
        highQuality: true,
        
        // Gameplay
        showHints: true,
        confirmMoves: false,
        autoEndTurn: true,
        
        // Accessibility
        reducedMotion: false,
        highContrast: false,
        largeText: false
    };
    
    // Current settings (materialized from storage + defaults)
    let _settings = null;
    
    // Listeners for setting changes
    const _listeners = new Map();
    
    /**
     * Load settings from storage, merging with defaults
     */
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            _settings = { ...DEFAULTS, ...parsed };
        } catch (e) {
            console.warn('[SettingsSubstrate] Failed to load settings:', e);
            _settings = { ...DEFAULTS };
        }
        return _settings;
    }
    
    /**
     * Save current settings to storage
     */
    function save() {
        try {
            // Only store values that differ from defaults (minimal storage)
            const toStore = {};
            for (const key in _settings) {
                if (_settings[key] !== DEFAULTS[key]) {
                    toStore[key] = _settings[key];
                }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.warn('[SettingsSubstrate] Failed to save settings:', e);
        }
    }
    
    /**
     * Get a setting value
     */
    function get(key) {
        if (!_settings) load();
        return _settings.hasOwnProperty(key) ? _settings[key] : DEFAULTS[key];
    }
    
    /**
     * Set a setting value
     */
    function set(key, value) {
        if (!_settings) load();
        const oldValue = _settings[key];
        _settings[key] = value;
        save();
        
        // Notify listeners
        if (_listeners.has(key)) {
            _listeners.get(key).forEach(fn => fn(value, oldValue, key));
        }
        if (_listeners.has('*')) {
            _listeners.get('*').forEach(fn => fn(value, oldValue, key));
        }
    }
    
    /**
     * Subscribe to setting changes
     */
    function onChange(key, callback) {
        if (!_listeners.has(key)) {
            _listeners.set(key, []);
        }
        _listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const list = _listeners.get(key);
            const idx = list.indexOf(callback);
            if (idx >= 0) list.splice(idx, 1);
        };
    }
    
    /**
     * Get all settings
     */
    function getAll() {
        if (!_settings) load();
        return { ..._settings };
    }
    
    /**
     * Reset to defaults
     */
    function reset() {
        _settings = { ...DEFAULTS };
        save();
    }
    
    // Public API
    return {
        load,
        save,
        get,
        set,
        onChange,
        getAll,
        reset,
        DEFAULTS
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsSubstrate;
}

