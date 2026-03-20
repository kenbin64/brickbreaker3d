// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 BUTTERFLYFX ARCADE CONTROLS
// Unified input handling for keyboard, mouse, touch, and gamepad
// Dimensional addressing - no if-statements for input checking
// ═══════════════════════════════════════════════════════════════════════════════

const ArcadeControls = (() => {
    'use strict';
    
    // 🌊 Input state manifold - all possible inputs exist as potential
    const inputState = {
        keys: {},
        mouse: { x: 0, y: 0, buttons: {} },
        touch: { x: 0, y: 0, active: false },
        gamepad: { axes: [0, 0, 0, 0], buttons: {} }
    };
    
    // 📍 Key mapping manifold
    const keyMap = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        KeyA: 'left',
        KeyD: 'right',
        KeyW: 'up',
        KeyS: 'down',
        Space: 'fire',
        Enter: 'start',
        Escape: 'pause'
    };
    
    // 🎯 Initialize controls
    const init = () => {
        // Keyboard observers
        window.addEventListener('keydown', (e) => {
            const action = keyMap[e.code];
            action && (inputState.keys[action] = true);
        });
        
        window.addEventListener('keyup', (e) => {
            const action = keyMap[e.code];
            action && (inputState.keys[action] = false);
        });
        
        // Mouse observers
        window.addEventListener('mousemove', (e) => {
            inputState.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            inputState.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('mousedown', (e) => {
            inputState.mouse.buttons[e.button] = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            inputState.mouse.buttons[e.button] = false;
        });
        
        // Touch observers
        window.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            inputState.touch.x = (touch.clientX / window.innerWidth) * 2 - 1;
            inputState.touch.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            inputState.touch.active = true;
        });
        
        window.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            inputState.touch.x = (touch.clientX / window.innerWidth) * 2 - 1;
            inputState.touch.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('touchend', () => {
            inputState.touch.active = false;
        });
    };
    
    // 🌊 Query input state (dimensional addressing)
    const isPressed = (action) => inputState.keys[action] ?? false;
    
    const getMousePosition = () => ({
        x: inputState.mouse.x,
        y: inputState.mouse.y
    });
    
    const getTouchPosition = () => ({
        x: inputState.touch.x,
        y: inputState.touch.y,
        active: inputState.touch.active
    });
    
    const isMouseDown = (button = 0) => inputState.mouse.buttons[button] ?? false;
    
    // 🎮 Get movement vector (for paddle/ship control)
    const getMovementVector = () => {
        const x = (isPressed('right') ? 1 : 0) - (isPressed('left') ? 1 : 0);
        const y = (isPressed('up') ? 1 : 0) - (isPressed('down') ? 1 : 0);
        
        return { x, y };
    };
    
    // 🔫 Check fire button
    const isFiring = () => {
        return isPressed('fire') || isMouseDown(0) || inputState.touch.active;
    };
    
    // ⏸️ Check pause
    const isPaused = () => isPressed('pause');
    
    // 🌊 Export public API
    return {
        init,
        isPressed,
        getMousePosition,
        getTouchPosition,
        isMouseDown,
        getMovementVector,
        isFiring,
        isPaused,
        inputState
    };
})();

