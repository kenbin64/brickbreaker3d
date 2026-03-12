// ═══════════════════════════════════════════════════════════════════════════════
// 🔊 BUTTERFLYFX ARCADE AUDIO ENGINE
// Retro synthesized sound effects using Web Audio API
// Pure mathematical waveforms - no samples needed
// ═══════════════════════════════════════════════════════════════════════════════

const ArcadeAudio = (() => {
    'use strict';
    
    // 🎵 Audio context
    let audioContext = null;
    let masterGain = null;
    
    // 🌊 Initialize audio
    const init = () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioContext.destination);
    };
    
    // 🎯 Play tone
    const playTone = (frequency, duration, type = 'square') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
    
    // 💥 Explosion sound
    const explosion = () => {
        const noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = buffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        
        noise.start(audioContext.currentTime);
        noise.stop(audioContext.currentTime + 0.5);
    };
    
    // 🔫 Shoot sound
    const shoot = () => {
        playTone(800, 0.1, 'square');
        setTimeout(() => playTone(400, 0.1, 'square'), 50);
    };
    
    // 🎯 Hit sound
    const hit = () => {
        playTone(200, 0.15, 'sawtooth');
    };
    
    // ⚡ Power-up sound
    const powerup = () => {
        playTone(400, 0.1, 'sine');
        setTimeout(() => playTone(600, 0.1, 'sine'), 100);
        setTimeout(() => playTone(800, 0.2, 'sine'), 200);
    };
    
    // 💀 Death sound
    const death = () => {
        playTone(800, 0.1, 'square');
        setTimeout(() => playTone(600, 0.1, 'square'), 100);
        setTimeout(() => playTone(400, 0.1, 'square'), 200);
        setTimeout(() => playTone(200, 0.3, 'square'), 300);
    };
    
    // 🏆 Victory sound
    const victory = () => {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.3, 'sine'), i * 150);
        });
    };
    
    // 🎵 Blip sound (for UI)
    const blip = () => {
        playTone(1000, 0.05, 'square');
    };
    
    // 🌊 Whoosh sound (for movement)
    const whoosh = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    // 🔇 Set volume
    const setVolume = (volume) => {
        masterGain.gain.value = Math.max(0, Math.min(1, volume));
    };
    
    // 🌊 Export public API
    return {
        init,
        playTone,
        explosion,
        shoot,
        hit,
        powerup,
        death,
        victory,
        blip,
        whoosh,
        setVolume
    };
})();

