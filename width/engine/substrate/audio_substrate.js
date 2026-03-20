/**
 * Audio Substrate - Universal audio management
 * 
 * Handles music and sound effects with settings integration.
 * Manifold-compliant: audio state derives from settings substrate.
 */

const AudioSubstrate = (function() {
    'use strict';
    
    // Audio context (lazy initialization)
    let _audioContext = null;
    let _masterGain = null;
    let _musicGain = null;
    let _sfxGain = null;
    
    // Currently playing music
    let _currentMusic = null;
    let _musicSource = null;
    
    // Loaded audio buffers (cache)
    const _buffers = new Map();
    
    // Sound effect pool for concurrent playback
    const _sfxPool = [];
    const MAX_CONCURRENT_SFX = 8;
    
    /**
     * Initialize audio context (must be called after user interaction)
     */
    function init() {
        if (_audioContext) return;
        
        try {
            _audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            _masterGain = _audioContext.createGain();
            _musicGain = _audioContext.createGain();
            _sfxGain = _audioContext.createGain();
            
            // Connect: source -> category gain -> master -> destination
            _musicGain.connect(_masterGain);
            _sfxGain.connect(_masterGain);
            _masterGain.connect(_audioContext.destination);
            
            // Apply settings
            applySettings();
            
            // Listen for setting changes
            if (typeof SettingsSubstrate !== 'undefined') {
                SettingsSubstrate.onChange('musicEnabled', applySettings);
                SettingsSubstrate.onChange('musicVolume', applySettings);
                SettingsSubstrate.onChange('sfxEnabled', applySettings);
                SettingsSubstrate.onChange('sfxVolume', applySettings);
            }
            
            console.log('[AudioSubstrate] Initialized');
        } catch (e) {
            console.warn('[AudioSubstrate] Failed to initialize:', e);
        }
    }
    
    /**
     * Apply current settings to gain nodes
     */
    function applySettings() {
        if (!_audioContext) return;
        
        const settings = typeof SettingsSubstrate !== 'undefined' 
            ? SettingsSubstrate.getAll() 
            : { musicEnabled: true, musicVolume: 0.5, sfxEnabled: true, sfxVolume: 0.7 };
        
        _musicGain.gain.value = settings.musicEnabled ? settings.musicVolume : 0;
        _sfxGain.gain.value = settings.sfxEnabled ? settings.sfxVolume : 0;
    }
    
    /**
     * Load an audio file
     */
    async function loadAudio(url) {
        if (_buffers.has(url)) return _buffers.get(url);
        if (!_audioContext) init();
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await _audioContext.decodeAudioData(arrayBuffer);
            _buffers.set(url, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.warn('[AudioSubstrate] Failed to load:', url, e);
            return null;
        }
    }
    
    /**
     * Play music (loops by default)
     */
    async function playMusic(url, loop = true) {
        if (!_audioContext) init();
        
        // Stop current music
        stopMusic();
        
        const buffer = await loadAudio(url);
        if (!buffer) return;
        
        _musicSource = _audioContext.createBufferSource();
        _musicSource.buffer = buffer;
        _musicSource.loop = loop;
        _musicSource.connect(_musicGain);
        _musicSource.start();
        _currentMusic = url;
    }
    
    /**
     * Stop current music
     */
    function stopMusic() {
        if (_musicSource) {
            try {
                _musicSource.stop();
            } catch (e) {}
            _musicSource = null;
        }
        _currentMusic = null;
    }
    
    /**
     * Play a sound effect
     */
    async function playSFX(url, volume = 1.0) {
        if (!_audioContext) init();
        
        const buffer = await loadAudio(url);
        if (!buffer) return;
        
        const source = _audioContext.createBufferSource();
        const gainNode = _audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(_sfxGain);
        source.start();
        
        // Clean up when done
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
        };
    }
    
    /**
     * Toggle music on/off
     */
    function toggleMusic() {
        if (typeof SettingsSubstrate !== 'undefined') {
            SettingsSubstrate.set('musicEnabled', !SettingsSubstrate.get('musicEnabled'));
        }
    }
    
    /**
     * Toggle SFX on/off
     */
    function toggleSFX() {
        if (typeof SettingsSubstrate !== 'undefined') {
            SettingsSubstrate.set('sfxEnabled', !SettingsSubstrate.get('sfxEnabled'));
        }
    }
    
    // Public API
    return {
        init,
        loadAudio,
        playMusic,
        stopMusic,
        playSFX,
        toggleMusic,
        toggleSFX,
        applySettings
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSubstrate;
}

