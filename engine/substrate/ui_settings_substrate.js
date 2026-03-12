/**
 * UI Settings Substrate - Settings panel UI component
 * 
 * Creates a consistent settings interface for all games.
 * Can be used in wizard (setup) or in-game (pause menu).
 */

const UISettingsSubstrate = (function() {
    'use strict';
    
    let _container = null;
    let _isOpen = false;
    
    const STYLES = `
        .settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 30, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 24px;
            min-width: 320px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .settings-panel h2 {
            margin: 0 0 20px 0;
            font-size: 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            padding-bottom: 12px;
        }
        .settings-section {
            margin-bottom: 20px;
        }
        .settings-section h3 {
            font-size: 0.9rem;
            text-transform: uppercase;
            color: rgba(255,255,255,0.6);
            margin: 0 0 12px 0;
        }
        .settings-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        .settings-row label {
            flex: 1;
        }
        .settings-toggle {
            width: 48px;
            height: 26px;
            background: rgba(255,255,255,0.2);
            border-radius: 13px;
            position: relative;
            cursor: pointer;
            transition: background 0.2s;
        }
        .settings-toggle.active {
            background: #4CAF50;
        }
        .settings-toggle::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .settings-toggle.active::after {
            transform: translateX(22px);
        }
        .settings-select {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
        }
        .settings-slider {
            width: 100px;
            cursor: pointer;
        }
        .settings-close {
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0.7;
        }
        .settings-close:hover {
            opacity: 1;
        }
        .settings-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
        }
    `;
    
    /**
     * Inject styles into document
     */
    function injectStyles() {
        if (document.getElementById('settings-substrate-styles')) return;
        const style = document.createElement('style');
        style.id = 'settings-substrate-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }
    
    /**
     * Create a toggle switch
     */
    function createToggle(settingKey, label) {
        const value = SettingsSubstrate.get(settingKey);
        const row = document.createElement('div');
        row.className = 'settings-row';
        row.innerHTML = `
            <label>${label}</label>
            <div class="settings-toggle ${value ? 'active' : ''}" data-key="${settingKey}"></div>
        `;
        row.querySelector('.settings-toggle').addEventListener('click', (e) => {
            const toggle = e.target;
            const newValue = !toggle.classList.contains('active');
            toggle.classList.toggle('active', newValue);
            SettingsSubstrate.set(settingKey, newValue);
        });
        return row;
    }
    
    /**
     * Create a select dropdown
     */
    function createSelect(settingKey, label, options) {
        const value = SettingsSubstrate.get(settingKey);
        const row = document.createElement('div');
        row.className = 'settings-row';
        
        const optionsHtml = options.map(opt => 
            `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');
        
        row.innerHTML = `
            <label>${label}</label>
            <select class="settings-select" data-key="${settingKey}">${optionsHtml}</select>
        `;
        row.querySelector('select').addEventListener('change', (e) => {
            SettingsSubstrate.set(settingKey, e.target.value);
        });
        return row;
    }
    
    /**
     * Create a slider
     */
    function createSlider(settingKey, label, min = 0, max = 1, step = 0.1) {
        const value = SettingsSubstrate.get(settingKey);
        const row = document.createElement('div');
        row.className = 'settings-row';
        row.innerHTML = `
            <label>${label}</label>
            <input type="range" class="settings-slider" min="${min}" max="${max}" 
                   step="${step}" value="${value}" data-key="${settingKey}">
        `;
        row.querySelector('input').addEventListener('input', (e) => {
            SettingsSubstrate.set(settingKey, parseFloat(e.target.value));
        });
        return row;
    }

    /**
     * Open settings panel
     */
    function open(options = {}) {
        if (_isOpen) return;

        injectStyles();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.addEventListener('click', close);

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        panel.innerHTML = `
            <button class="settings-close">&times;</button>
            <h2>⚙️ Settings</h2>
        `;
        panel.querySelector('.settings-close').addEventListener('click', close);

        // Audio section
        const audioSection = document.createElement('div');
        audioSection.className = 'settings-section';
        audioSection.innerHTML = '<h3>🔊 Audio</h3>';
        audioSection.appendChild(createToggle('musicEnabled', 'Music'));
        audioSection.appendChild(createSlider('musicVolume', 'Music Volume'));
        audioSection.appendChild(createToggle('sfxEnabled', 'Sound Effects'));
        audioSection.appendChild(createSlider('sfxVolume', 'SFX Volume'));
        panel.appendChild(audioSection);

        // Camera section
        const cameraSection = document.createElement('div');
        cameraSection.className = 'settings-section';
        cameraSection.innerHTML = '<h3>🎥 Camera</h3>';
        cameraSection.appendChild(createSelect('cameraMode', 'Camera Mode', [
            { value: 'manual', label: 'Manual (Default)' },
            { value: 'auto', label: 'Auto-Follow' },
            { value: 'fixed', label: 'Fixed' }
        ]));
        cameraSection.appendChild(createSelect('cameraDistance', 'Zoom Level', [
            { value: 'close', label: 'Close' },
            { value: 'medium', label: 'Medium' },
            { value: 'far', label: 'Far' }
        ]));
        panel.appendChild(cameraSection);

        // Gameplay section (optional)
        if (!options.hideGameplay) {
            const gameSection = document.createElement('div');
            gameSection.className = 'settings-section';
            gameSection.innerHTML = '<h3>🎮 Gameplay</h3>';
            gameSection.appendChild(createToggle('showHints', 'Show Hints'));
            gameSection.appendChild(createToggle('confirmMoves', 'Confirm Moves'));
            panel.appendChild(gameSection);
        }

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        _container = { overlay, panel };
        _isOpen = true;
    }

    /**
     * Close settings panel
     */
    function close() {
        if (!_isOpen || !_container) return;

        _container.overlay.remove();
        _container.panel.remove();
        _container = null;
        _isOpen = false;
    }

    /**
     * Toggle settings panel
     */
    function toggle(options) {
        if (_isOpen) {
            close();
        } else {
            open(options);
        }
    }

    /**
     * Check if panel is open
     */
    function isOpen() {
        return _isOpen;
    }

    // Public API
    return {
        injectStyles,
        createToggle,
        createSelect,
        createSlider,
        open,
        close,
        toggle,
        isOpen
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UISettingsSubstrate;
}

