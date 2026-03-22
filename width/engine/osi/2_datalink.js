/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND — LAYER 2: DATALINK SUBSTRATE (WAVEFORM)
 * Genesis: MIRROR — "Reflection creates awareness"
 * Dimension: LINE (1D) — the point extends through time
 * ═══════════════════════════════════════════════════════════════
 *
 * The waveform. Everything is a wave.
 *
 * A point (L1) becomes a line when it MOVES. Movement is time.
 * A wave is a line — f(t) — a value that flows through time.
 * Light is a wave. Sound is a wave. Color is frequency.
 * Motion is phase. Input is a continuous signal. Events are
 * wave peaks. Animation is a wave evaluated at NOW.
 *
 * The datalink extracts data from the manifold (L1) — and all
 * data flows as waves. Observation, events, input, animation —
 * these are all wave phenomena on the manifold surface.
 *
 * Dimensional progression:
 *   L1 Point (0D) → L2 Line (1D) ← YOU ARE HERE
 *   The point gains direction. A single dimension: time.
 *   Every signal is a 1D function: f(t) → value
 *
 * OSI DataLink = raw bits → organized frames
 * Schwarz Diamond DataLink = raw manifold → observed waveforms
 *   Observation replaces polling. Waves replace discrete packets.
 *   Every signal is a wave. Every channel is a frequency.
 *   z = x·y: waveform(x) × time(y) = observed value(z)
 *
 * Surface: z = x · y
 *   x = waveform / signal / shape
 *   y = time / channel / phase
 *   z = observed value at NOW
 *
 * Absorbs: ObservationSubstrate + EventSubstrate + JoystickSubstrate + Wave
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const DataLinkSubstrate = (() => {

    const _channels = new Map();   // channel → [{id, handler, priority}]
    const _dom = new Map();        // id → {el, event, handler, options}
    let _nextId = 1;

    function _id(prefix) { return `${prefix}_${_nextId++}`; }

    // ── z = x · y ──────────────────────────────────────────────
    function zxy(signal, channel) {
        return typeof signal === 'string' ? `${signal}@${channel}` : signal * channel;
    }

    // ═══════════════════════════════════════════════════════════
    //  OBSERVATION — replace all polling with frame-level watch
    // ═══════════════════════════════════════════════════════════

    /** Observe when a potential manifests (replaces setInterval) */
    function when(potential, onManifest) {
        const check = () => {
            const v = potential();
            v !== null && v !== undefined ? onManifest(v) : requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
    }

    /** Delayed manifestation (replaces setTimeout) */
    function after(fn, delay) {
        return new Promise(resolve => {
            const t0 = performance.now();
            const tick = () =>
                performance.now() - t0 >= delay ? resolve(fn()) : requestAnimationFrame(tick);
            requestAnimationFrame(tick);
        });
    }

    /** Observe DOM mutation — element appearing */
    function dom(selector, onManifest) {
        const obs = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) onManifest(el);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        const existing = document.querySelector(selector);
        if (existing) onManifest(existing);
        return obs;
    }

    /** Wait until condition becomes true */
    function until(condition, onTrue) {
        const check = () => condition() ? onTrue() : requestAnimationFrame(check);
        requestAnimationFrame(check);
    }

    /** Observe multiple, resolve when ALL manifest */
    function all(potentials, onAll) {
        const results = new Array(potentials.length);
        let n = 0;
        potentials.forEach((p, i) => {
            when(p, v => { results[i] = v; if (++n === potentials.length) onAll(results); });
        });
    }

    /** Observable value — reactive primitive */
    function createPotential(initial) {
        let val = initial;
        const obs = [];
        return {
            get()        { return val; },
            set(v)       { val = v; obs.forEach(fn => fn(v)); },
            observe(fn)  { obs.push(fn); fn(val); }
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  EVENT FRAMING — pub/sub + DOM event management
    // ═══════════════════════════════════════════════════════════

    /** Subscribe to a channel (custom event bus) */
    function subscribe(channel, handler, priority = 0) {
        if (!_channels.has(channel)) _channels.set(channel, []);
        const id = _id('sub');
        _channels.get(channel).push({ id, handler, priority });
        _channels.get(channel).sort((a, b) => b.priority - a.priority);
        return id;
    }

    /** Unsubscribe by id */
    function unsubscribe(id) {
        for (const [ch, subs] of _channels) {
            const i = subs.findIndex(s => s.id === id);
            if (i !== -1) { subs.splice(i, 1); if (!subs.length) _channels.delete(ch); return true; }
        }
        return false;
    }

    /** Emit signal on channel — the z=xy moment */
    function emit(channel, data) {
        const subs = _channels.get(channel);
        if (!subs) return 0;
        let n = 0;
        for (const s of subs) { try { s.handler(data); n++; } catch (e) { console.error(`[DataLink L2] Frame error on ${channel}:`, e); } }
        return n;
    }

    /** Subscribe once then auto-remove */
    function once(channel, handler, priority = 0) {
        const id = subscribe(channel, data => { handler(data); unsubscribe(id); }, priority);
        return id;
    }

    /** Wait for a channel emission (Promise) */
    function waitFor(channel, timeout = 0) {
        return new Promise((resolve, reject) => {
            let timer = null;
            const id = once(channel, resolve);
            if (timeout > 0) timer = setTimeout(() => { unsubscribe(id); reject(new Error(`Timeout: ${channel}`)); }, timeout);
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  DOM EVENT BINDING — attach/detach with tracking
    // ═══════════════════════════════════════════════════════════

    /** Attach DOM event listener (tracked for cleanup) */
    function on(element, event, handler, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) { console.warn('[DataLink L2] Element not found:', element); return null; }
        const id = _id('dom');
        _dom.set(id, { el, event, handler, options });
        el.addEventListener(event, handler, options);
        return id;
    }

    /** Detach DOM event listener by id */
    function off(id) {
        const d = _dom.get(id);
        if (!d) return false;
        d.el.removeEventListener(d.event, d.handler, d.options);
        _dom.delete(id);
        return true;
    }

    /** Event delegation */
    function delegate(parent, selector, event, handler) {
        return on(parent, event, e => {
            const target = e.target.closest(selector);
            if (target) handler.call(target, e);
        });
    }

    /** Debounce */
    function debounce(fn, delay = 300) {
        let t = null;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    }

    /** Throttle */
    function throttle(fn, limit = 300) {
        let go = true;
        return (...args) => { if (go) { fn(...args); go = false; setTimeout(() => go = true, limit); } };
    }

    /** Clear all DOM listeners */
    function clearAll() {
        for (const id of _dom.keys()) off(id);
    }

    // ═══════════════════════════════════════════════════════════
    //  INPUT — joystick, touch, pointer (signal→channel on z=xy)
    // ═══════════════════════════════════════════════════════════

    const _inputs = new Map();  // name → input state

    function createInput(name, opts = {}) {
        const input = {
            name,
            active: false,
            x: 0, y: 0,                      // normalized -1 to 1
            deadzone: opts.deadzone || 0.1,
            maxRadius: opts.maxRadius || 50,   // pixels (for touch)
            startX: 0, startY: 0,
            _onMove: null, _onRelease: null,
            _domIds: []
        };
        _inputs.set(name, input);
        return input;
    }

    /** Bind a DOM element as a touch/mouse input zone */
    function bindInputZone(name, element) {
        const input = _inputs.get(name);
        if (!input) return;

        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        const onStart = (e) => {
            e.preventDefault();
            input.active = true;
            const rect = el.getBoundingClientRect();
            input.startX = rect.left + rect.width / 2;
            input.startY = rect.top + rect.height / 2;
            _processInputMove(input, e);
        };

        const onMove = (e) => {
            if (!input.active) return;
            e.preventDefault();
            _processInputMove(input, e);
        };

        const onEnd = () => {
            if (!input.active) return;
            input.active = false;
            input.x = 0; input.y = 0;
            if (input._onRelease) input._onRelease();
            emit(`input:${name}:release`, { name });
        };

        input._domIds.push(on(el, 'mousedown', onStart));
        input._domIds.push(on(el, 'touchstart', onStart, { passive: false }));
        input._domIds.push(on(window, 'mousemove', onMove));
        input._domIds.push(on(window, 'touchmove', onMove, { passive: false }));
        input._domIds.push(on(window, 'mouseup', onEnd));
        input._domIds.push(on(window, 'touchend', onEnd));
    }

    function _processInputMove(input, e) {
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - input.startX;
        const dy = touch.clientY - input.startY;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), input.maxRadius);
        const angle = Math.atan2(dy, dx);

        input.x = (Math.cos(angle) * dist) / input.maxRadius;
        input.y = (Math.sin(angle) * dist) / input.maxRadius;

        if (Math.abs(input.x) < input.deadzone) input.x = 0;
        if (Math.abs(input.y) < input.deadzone) input.y = 0;

        if (input._onMove) input._onMove(input.x, input.y);
        emit(`input:${name}:move`, { name: input.name, x: input.x, y: input.y });
    }

    /** Register keyboard keys as digital input */
    function bindKeys(name, keyMap) {
        const input = _inputs.get(name) || createInput(name);
        const pressed = new Set();

        on(window, 'keydown', e => {
            if (keyMap[e.key] !== undefined) { pressed.add(e.key); _updateKeyInput(input, pressed, keyMap); }
        });
        on(window, 'keyup', e => {
            if (keyMap[e.key] !== undefined) { pressed.delete(e.key); _updateKeyInput(input, pressed, keyMap); }
        });
    }

    function _updateKeyInput(input, pressed, keyMap) {
        input.x = 0; input.y = 0;
        for (const key of pressed) {
            const dir = keyMap[key];
            if (dir === 'left')  input.x = -1;
            if (dir === 'right') input.x = 1;
            if (dir === 'up')    input.y = -1;
            if (dir === 'down')  input.y = 1;
        }
        input.active = input.x !== 0 || input.y !== 0;
        if (input._onMove) input._onMove(input.x, input.y);
        emit(`input:${input.name}:move`, { name: input.name, x: input.x, y: input.y });
    }

    function getInput(name) { return _inputs.get(name) || null; }

    function destroyInput(name) {
        const input = _inputs.get(name);
        if (!input) return;
        input._domIds.forEach(id => off(id));
        _inputs.delete(name);
    }

    // ═══════════════════════════════════════════════════════════
    //  WAVEFORMS — pure functions of phase (0..1 repeating)
    //  Everything is a wave. f(t) → value. No state. No cleanup.
    // ═══════════════════════════════════════════════════════════

    const TAU = Math.PI * 2;
    const PHI = 1.618033988749895;

    const waveforms = {
        sine:     p => Math.sin(p * TAU),
        cosine:   p => Math.cos(p * TAU),
        triangle: p => 1 - 4 * Math.abs(Math.round(p) - p),
        saw:      p => 2 * (p - Math.floor(p + 0.5)),
        square:   p => (p % 1) < 0.5 ? 1 : -1,
        pulse:    (p, w = 0.25) => (p % 1) < w ? 1 : 0,
        noise:    () => Math.random() * 2 - 1,
        arc:      p => Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI),
        ease:     p => { const t = Math.min(Math.max(p, 0), 1); return t * t * (3 - 2 * t); },
        decay:    (p, rate = 3) => Math.exp(-rate * Math.max(p, 0)),
        elastic:  p => { const t = Math.min(Math.max(p, 0), 1); return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * TAU / 0.3) + 1; },
        bounce:   p => {
            const t = Math.min(Math.max(p, 0), 1);
            if (t < 1/2.75) return 7.5625 * t * t;
            if (t < 2/2.75) { const u = t - 1.5/2.75; return 7.5625 * u * u + 0.75; }
            if (t < 2.5/2.75) { const u = t - 2.25/2.75; return 7.5625 * u * u + 0.9375; }
            const u = t - 2.625/2.75; return 7.5625 * u * u + 0.984375;
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  WAVE CONSTRUCTORS — create a wave function from shape
    // ═══════════════════════════════════════════════════════════

    function wave(form = 'sine', opts = {}) {
        const fn   = typeof form === 'function' ? form : (waveforms[form] || waveforms.sine);
        const freq = opts.freq   ?? 1;
        const amp  = opts.amp    ?? 1;
        const ph   = opts.phase  ?? 0;
        const off  = opts.offset ?? 0;
        const t0   = opts.t0     ?? 0;
        const dur  = opts.duration ?? Infinity;

        return function _wave(t) {
            const local = t - t0;
            if (local < 0 || local > dur) return off;
            const phase = (local * freq + ph);
            return off + amp * fn(dur === Infinity ? phase : local / dur);
        };
    }

    function oneshot(form, duration, opts = {}) {
        const fn = typeof form === 'function' ? form : (waveforms[form] || waveforms.ease);
        const amp  = opts.amp ?? 1;
        const off  = opts.offset ?? 0;
        const t0   = opts.t0 ?? 0;
        const from = opts.from ?? 0;
        const to   = opts.to ?? 1;

        return function _wave(t) {
            const local = t - t0;
            if (local <= 0) return off + amp * from;
            if (local >= duration) return off + amp * to;
            const p = local / duration;
            const shaped = fn(p);
            return off + amp * (from + (to - from) * shaped);
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  WAVE COMBINATORS — compose waves like water merging
    // ═══════════════════════════════════════════════════════════

    function waveAdd(...waves)       { return t => waves.reduce((s, w) => s + w(t), 0); }
    function waveMul(...waves)       { return t => waves.reduce((s, w) => s * w(t), 1); }
    function waveModulate(carrier, mod) { return t => carrier(t + mod(t)); }
    function waveBlend(a, b, mix)    { return t => { const m = mix(t); return a(t) * (1 - m) + b(t) * m; }; }
    function waveSequence(waves, segDur) {
        return t => {
            const total = waves.length * segDur;
            const local = ((t % total) + total) % total;
            const idx = Math.min(Math.floor(local / segDur), waves.length - 1);
            return waves[idx](local - idx * segDur);
        };
    }
    function waveClamp(w, lo = 0, hi = 1) { return t => Math.max(lo, Math.min(hi, w(t))); }
    function waveMap(w, lo, hi) { return t => lo + (hi - lo) * (w(t) + 1) * 0.5; }

    // ═══════════════════════════════════════════════════════════
    //  FLOW — bind waves to properties, evaluate at NOW
    //  The river. Throw waves in, bind to properties, tick(now).
    // ═══════════════════════════════════════════════════════════

    const _flows = new Map();
    let _flowId = 0;

    function flow(name) {
        const id = ++_flowId;
        const bindings = [];
        let active = true;
        let birthTime = null;

        const handle = {
            id, name: name || `flow_${id}`,
            bind(obj, prop, w) { bindings.push({ obj, prop, wave: w }); return handle; },
            bindFn(setter, w) { bindings.push({ setter, wave: w }); return handle; },
            bind3(vec, xw, yw, zw) {
                if (xw) bindings.push({ obj: vec, prop: 'x', wave: xw });
                if (yw) bindings.push({ obj: vec, prop: 'y', wave: yw });
                if (zw) bindings.push({ obj: vec, prop: 'z', wave: zw });
                return handle;
            },
            bindColor(color, rw, gw, bw) {
                if (rw) bindings.push({ obj: color, prop: 'r', wave: rw });
                if (gw) bindings.push({ obj: color, prop: 'g', wave: gw });
                if (bw) bindings.push({ obj: color, prop: 'b', wave: bw });
                return handle;
            },
            update(t) {
                if (!active) return;
                if (birthTime === null) birthTime = t;
                const local = t - birthTime;
                for (const b of bindings) {
                    const val = b.wave(local);
                    if (b.setter) b.setter(val);
                    else b.obj[b.prop] = val;
                }
            },
            pause()  { active = false; return handle; },
            resume() { active = true;  return handle; },
            stop()   { active = false; _flows.delete(id); return handle; },
            isActive: () => active
        };

        _flows.set(id, handle);
        return handle;
    }

    /** Global tick — slide the NOW cursor across every wave */
    function tick(now) {
        for (const [, f] of _flows) {
            if (f.isActive()) f.update(now);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  WAVE PRESETS — common patterns ready to use
    // ═══════════════════════════════════════════════════════════

    const presets = {
        bob:        (amp = 1.5, freq = 0.4)           => wave('sine', { freq, amp }),
        pulse:      (lo = 0.3, hi = 1.0, freq = 0.6)  => waveMap(wave('sine', { freq }), lo, hi),
        transition: (from, to, duration, easing = 'ease') => oneshot(easing, duration, { from, to }),
        hop:        (height = 8, duration = 0.4)       => oneshot('arc', duration, { from: 0, to: 0, amp: height }),
        spring:     (target = 1, freq = 3, damping = 4) => wave(p => 1 - Math.exp(-damping * p) * Math.cos(TAU * freq * p), { freq: 1, amp: target }),
        spin:       (speed = 1)                        => wave('saw', { freq: speed, amp: Math.PI }),
        fadeOut:     (duration = 1)                     => oneshot('decay', duration, { from: 1, to: 0 }),
        bounceIn:   (duration = 0.6)                   => oneshot('bounce', duration, { from: 0, to: 1 }),
        breathe:    (lo = 0.85, hi = 1.15, freq = 0.25) => waveMap(wave('sine', { freq }), lo, hi),
    };

    // ── Public surface ──────────────────────────────────────────
    return Object.freeze({
        name:    'DataLink Substrate (Waveform)',
        layer:   2,
        genesis: 'Mirror',
        surface: 'z=xy',
        zxy, TAU, PHI,
        // Observation
        when, after, dom, until, all, createPotential,
        // Pub/Sub
        subscribe, unsubscribe, emit, once, waitFor,
        // DOM Events
        on, off, delegate, debounce, throttle, clearAll,
        // Input
        createInput, bindInputZone, bindKeys, getInput, destroyInput,
        // Waveforms
        waveforms,
        // Wave constructors
        wave, oneshot,
        // Wave combinators
        add: waveAdd, mul: waveMul, modulate: waveModulate,
        blend: waveBlend, sequence: waveSequence,
        clamp: waveClamp, map: waveMap,
        // Flow engine
        flow, tick,
        activeFlows: () => _flows.size,
        killAll: () => { _flows.forEach(f => f.stop()); },
        // Presets
        presets,
        // Stats
        stats: () => ({
            channels: _channels.size, domListeners: _dom.size,
            inputs: _inputs.size, flows: _flows.size
        }),

        // ── Russian Doll — L2 wraps L1 ──────────────────────
        below: () => typeof PhysicalSubstrate !== 'undefined' ? PhysicalSubstrate : null
    });
})();

if (typeof window !== 'undefined') {
    window.DataLinkSubstrate = DataLinkSubstrate;
    window.Wave = DataLinkSubstrate;  // backward compat — Wave IS the DataLink
}
if (typeof module !== 'undefined') module.exports = DataLinkSubstrate;
