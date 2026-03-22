/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND ENGINE — Entry Point
 * ═══════════════════════════════════════════════════════════════
 *
 * The Dimensional Ladder:
 *   L0 Void         (Silence)    — Void (−1D)      potential
 *   L1 Physical     (Spark)      — Point (0D)      existence
 *   L2 DataLink     (Mirror)     — Line (1D)       time, flow
 *   L3 Network      (Relation)   — Width (2D)      connectivity
 *   L4 Transport    (Form)       — Volume (3D)     state, depth
 *   L5 Session      (Life)       — Whole (4D)      identity
 *   L6 Presentation (Mind)       — Perception (5D) experience
 *   L7 Application  (Completion) — Completion (6D) purpose
 *
 * Minimal Surface Principle:
 *   z = x·y   (L1, L2, L3, L6)  — linear layers
 *   z = x·y²  (L4, L5, L7)      — compounding layers
 *
 * Usage:
 *   <script src="/engine/index.js"></script>
 *   <script>
 *     SchwarzDiamond.init().then(engine => {
 *       // Raw layer access
 *       engine.application.start('myApp', engine);
 *
 *       // Or use the developer SDK
 *       const sdk = engine.sdk();
 *       sdk.help();
 *       sdk.state.set('score', 100);
 *       sdk.auth.login('user', 'pass');
 *       sdk.repo('players').create({ name: 'Ken' });
 *     });
 *   </script>
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

const SchwarzDiamond = (function () {
    'use strict';

    const VERSION = '2.0.0';
    const PHI = 1.618033988749895;
    let _initialized = false;

    // ── Dimensional Ladder ──────────────────────────────────────
    const DIMENSIONS = [
        { layer: 0, name: 'Void',          genesis: 'Silence',    dim: 'Void (−1D)',      surface: 'z=0'   },
        { layer: 1, name: 'Physical',      genesis: 'Spark',      dim: 'Point (0D)',      surface: 'z=xy'  },
        { layer: 2, name: 'DataLink',      genesis: 'Mirror',     dim: 'Line (1D)',       surface: 'z=xy'  },
        { layer: 3, name: 'Network',       genesis: 'Relation',   dim: 'Width (2D)',      surface: 'z=xy'  },
        { layer: 4, name: 'Transport',     genesis: 'Form',       dim: 'Volume (3D)',     surface: 'z=xy²' },
        { layer: 5, name: 'Session',       genesis: 'Life',       dim: 'Whole (4D)',      surface: 'z=xy²' },
        { layer: 6, name: 'Presentation',  genesis: 'Mind',       dim: 'Perception (5D)', surface: 'z=xy'  },
        { layer: 7, name: 'Application',   genesis: 'Completion', dim: 'Completion (6D)', surface: 'z=xy²' }
    ];

    // The 8 layers (Void + 7 seeds)
    const layers = {
        void:         null,   // L0 — Void (−1D)
        physical:     null,   // L1 — Point (0D)
        datalink:     null,   // L2 — Line (1D)
        network:      null,   // L3 — Width (2D)
        transport:    null,   // L4 — Volume (3D)
        session:      null,   // L5 — Whole (4D)
        presentation: null,   // L6 — Perception (5D)
        application:  null,   // L7 — Completion (6D)
    };

    // Layer load manifest (order matters — bottom up, Void first)
    const MANIFEST = [
        { key: 'void',         file: 'osi/0_void.js',           global: 'VoidSubstrate' },
        { key: 'physical',     file: 'osi/1_physical.js',       global: 'PhysicalSubstrate' },
        { key: 'datalink',     file: 'osi/2_datalink.js',       global: 'DataLinkSubstrate' },
        { key: 'network',      file: 'osi/3_network.js',        global: 'NetworkSubstrate' },
        { key: 'transport',    file: 'osi/4_transport.js',       global: 'TransportSubstrate' },
        { key: 'session',      file: 'osi/5_session.js',        global: 'SessionSubstrate' },
        { key: 'presentation', file: 'osi/6_presentation.js',   global: 'PresentationSubstrate' },
        { key: 'application',  file: 'osi/7_application.js',    global: 'ApplicationManifold' }
    ];

    function _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src*="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`[SchwarzDiamond] Failed to load: ${src}`));
            document.head.appendChild(s);
        });
    }

    function _getBasePath() {
        const scripts = document.getElementsByTagName('script');
        for (const s of scripts) {
            if (s.src && s.src.includes('engine/index.js')) return s.src.replace('index.js', '');
        }
        return '/engine/';
    }

    /**
     * Initialize the diamond — loads all 8 layers bottom-up.
     * Void → Point → Line → Width → Volume → Whole → Perception → Completion
     */
    async function init(opts = {}) {
        if (_initialized) { console.warn('[SchwarzDiamond] Already initialized'); return _public; }

        const base = opts.basePath || _getBasePath();
        console.log(`\n  ◆ OSI SCHWARZ DIAMOND v${VERSION}`);
        console.log('  ◆ Dimensional Ladder: Void → Point → Line → Width → Volume → Whole → Perception → Completion\n');

        for (let i = 0; i < MANIFEST.length; i++) {
            const entry = MANIFEST[i];
            const dim = DIMENSIONS[i];

            if (window[entry.global]) {
                layers[entry.key] = window[entry.global];
                console.log(`  L${dim.layer} ${dim.name.padEnd(13)} ${dim.dim.padEnd(18)} ✓ (pre-loaded)`);
                continue;
            }
            await _loadScript(base + entry.file);
            layers[entry.key] = window[entry.global];
            if (!layers[entry.key]) {
                console.warn(`  L${dim.layer} ${dim.name.padEnd(13)} ⚠ global ${entry.global} not found`);
            } else {
                console.log(`  L${dim.layer} ${dim.name.padEnd(13)} ${dim.dim.padEnd(18)} ✓`);
            }
        }

        // ── CROSS-LAYER WIRING ────────────────────────────────
        // After all layers load, wire them together so data
        // flowing through ANY layer automatically ripples across.
        _wireLayers();

        _initialized = true;
        console.log('\n  ◆ Diamond complete. Void + 7 layers wired. Auto-ingestion active.\n');
        return _public;
    }

    // ═══════════════════════════════════════════════════════════
    //  HELIX WIRING — neighbor-to-neighbor propagation
    //  Each layer only touches its immediate neighbor.
    //  The diamond orchestrator chains them: L1↔L2↔L3↔L4↔L5↔L6↔L7
    //  Data flows UP or DOWN through every intermediate layer.
    // ═══════════════════════════════════════════════════════════

    let _wired = false;

    function _wireLayers() {
        if (_wired) return;
        _wired = true;

        const L2 = layers.datalink;
        const L3 = layers.network;
        const L4 = layers.transport;
        const L5 = layers.session;

        // ── Helix Down: L4 → L3 → L2 ───────────────────────
        // State changes propagate DOWN through each neighbor.
        // L4 fires → L3 logs it (neighbor) → L2 emits wave (neighbor)
        if (L4 && L3 && L2) {
            L4.on('change', (evt) => {
                // L4 → L3: Network layer sees the state change (logs/routes)
                L3.log.trace('L4→L3', `state:${evt.key} changed`);
                // L3 → L2: Network passes to waveform layer (emits)
                L2.emit(`state:${evt.key}`, evt);
                L2.emit('state:*', { ...evt, key: evt.key });
            });
            L4.on('delete', (evt) => {
                L3.log.trace('L4→L3', `state:${evt.key} deleted`);
                L2.emit(`state:${evt.key}`, { ...evt, deleted: true });
                L2.emit('state:*', { ...evt, key: evt.key, deleted: true });
            });
            console.log('  ⚡ Helix: L4→L3→L2 (state changes flow down through neighbors)');
        }

        // ── Helix Down: L5 → L4 → L3 → L2 ──────────────────
        // Session events propagate DOWN through each neighbor.
        // L5 fires → L4 stores context → L3 logs → L2 emits wave
        if (L5 && L4 && L3 && L2) {
            const sessionEvents = ['login', 'logout', 'session:start', 'session:end', 'session:pause', 'session:resume'];
            for (const evt of sessionEvents) {
                if (typeof L5.on === 'function') {
                    L5.on(evt, (data) => {
                        // L5 → L4: Transport stores the session event
                        L4.set(`_session:${evt}`, { ...data, at: Date.now() }, true);
                        // L4 → L3: Network sees it (logs)
                        L3.log.trace('L5→L4→L3', `session:${evt}`);
                        // L3 → L2: Waveform emits it
                        L2.emit(`session:${evt}`, data);
                    });
                }
            }
            console.log('  ⚡ Helix: L5→L4→L3→L2 (session events flow down through neighbors)');
        }

        // ── Helix Up: L3 → L4 (already in L3.connect) ──────
        // L3 inbound data flows UP to its neighbor L4 (state).
        // L4 state change then flows DOWN via Wire 1: L4→L3→L2.
        // Full loop: L3 receives → L4 stores → L3 logs → L2 waves
        console.log('  ⚡ Helix: L3→L4 (inbound data flows up to neighbor state)');

        // ── Register layers on L3 manifold ──────────────────
        // Each layer registers with its nearest neighbor that
        // maintains the registry. L3 (Network) is the manifold.
        if (L3) {
            for (let i = 0; i < MANIFEST.length; i++) {
                const l = layers[MANIFEST[i].key];
                if (l && l.name) {
                    try { L3.register(l, { x: i + 1, y: i + 1 }); } catch (_) {}
                }
            }
            console.log('  ⚡ Helix: All layers registered on L3 manifold');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  INGEST — universal data entry point
    //  Anything you feed in automatically gets:
    //    1. A manifold coordinate (L1 position)
    //    2. A wave emission (L2 signal)
    //    3. State storage (L4 key-value) if keyed
    //    4. Session tracking (L5) if active session
    //  Nothing enters the diamond without touching every layer.
    // ═══════════════════════════════════════════════════════════

    let _ingestCount = 0;

    function _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
        return Math.abs(h) % 10000;
    }

    /**
     * Ingest data into the diamond. Automatically flows through all layers.
     *
     * @param {string} key     — unique identifier for this datum
     * @param {*}      data    — the value to ingest
     * @param {object} [opts]  — options
     * @param {string} [opts.type='data']    — manifold type (data, entity, event, config)
     * @param {boolean} [opts.persist=false] — also persist to L4 storage
     * @param {boolean} [opts.silent=false]  — skip wave emission
     * @param {object}  [opts.meta]          — extra metadata attached to the wave
     * @returns {object} receipt — { key, z, type, timestamp, ingestId }
     */
    function ingest(key, data, opts = {}) {
        if (!_initialized) throw new Error('[SchwarzDiamond] Not initialized. Call init() first.');

        const type = opts.type || 'data';
        const id = ++_ingestCount;
        const timestamp = Date.now();

        // L1 — Manifold coordinate. This datum exists at z = hash(key) × hash(type)
        const x = _hash(key);
        const y = _hash(type);
        const z = x * y;

        // L4 — State. Store it with history tracking.
        if (layers.transport) {
            layers.transport.set(key, data, opts.silent);
        }

        // L2 — Wave. Emit so any observer can see it arrive.
        if (layers.datalink && !opts.silent) {
            layers.datalink.emit(`ingest:${type}`, {
                key, data, z, timestamp, ingestId: id,
                ...(opts.meta || {})
            });
            layers.datalink.emit('ingest:*', {
                key, data, type, z, timestamp, ingestId: id,
                ...(opts.meta || {})
            });
        }

        // L5 — Session log. If there's an active session, record ingestion.
        if (layers.session && typeof layers.session.getActiveSession === 'function') {
            const active = layers.session.getActiveSession();
            if (active) {
                // Session knows about this data now
                if (typeof layers.session._logEvent === 'function') {
                    layers.session._logEvent(active.id, 'ingest', { key, type, z });
                }
            }
        }

        // L4 persistence — if requested, also save to localStorage
        if (opts.persist && layers.transport && typeof layers.transport.save === 'function') {
            layers.transport.save(`ingest:${key}`, [key]);
        }

        return { key, z, type, timestamp, ingestId: id };
    }

    /**
     * Ingest multiple key-value pairs at once.
     * @param {object} entries — { key1: value1, key2: value2, ... }
     * @param {object} [opts]  — same options as ingest()
     * @returns {object[]} receipts
     */
    function ingestAll(entries, opts = {}) {
        return Object.entries(entries).map(([key, data]) => ingest(key, data, opts));
    }

    /**
     * Absorb an external object/module into the diamond.
     * Registers it on the manifold (L3), emits its arrival as a wave (L2),
     * and makes it queryable. Use this for plugins, extensions, game modules.
     *
     * @param {object} module — must have a `name` property
     * @param {object} [opts] — { layer, domain }
     * @returns {object} the L3 node registration
     */
    function absorb(module, opts = {}) {
        if (!_initialized) throw new Error('[SchwarzDiamond] Not initialized. Call init() first.');
        if (!module || !module.name) throw new Error('[SchwarzDiamond] Module must have a name property');

        let node = null;

        // Register on L3 manifold
        if (layers.network) {
            node = layers.network.register(module, {
                layer: opts.layer || 0,
                domain: opts.domain || 'plugin'
            });
        }

        // Emit arrival wave on L2
        if (layers.datalink) {
            layers.datalink.emit('absorb', {
                name: module.name,
                layer: opts.layer || 0,
                domain: opts.domain || 'plugin',
                methods: Object.keys(module).filter(k => typeof module[k] === 'function'),
                timestamp: Date.now()
            });
        }

        console.log(`  ◆ Absorbed: ${module.name} → manifold registered, wave emitted`);
        return node;
    }

    /**
     * Get a layer by name or number (1-7).
     */
    function layer(id) {
        if (typeof id === 'number') {
            const keys = ['void','physical','datalink','network','transport','session','presentation','application'];
            return layers[keys[id]] || null;
        }
        return layers[id] || null;
    }

    /**
     * Get the developer SDK — friendly namespaces hiding the math.
     * Delegates to L7's ApplicationManifold.sdk().
     */
    function sdk() {
        if (!layers.application) throw new Error('[SchwarzDiamond] Not initialized. Call init() first.');
        return layers.application.sdk();
    }

    /**
     * Print the dimensional ladder and available APIs.
     */
    function help() {
        console.log('\n  ╔═══════════════════════════════════════════════════════╗');
        console.log('  ║     OSI SCHWARZ DIAMOND ENGINE v' + VERSION + '               ║');
        console.log('  ╚═══════════════════════════════════════════════════════╝\n');
        console.log('  Dimensional Ladder:');
        DIMENSIONS.forEach(d => {
            const loaded = layers[d.name.toLowerCase()] ? '✓' : '✗';
            console.log(`    L${d.layer} ${d.name.padEnd(13)} ${d.dim.padEnd(18)} ${d.surface}  ${loaded}`);
        });
        console.log('\n  Quick Start:');
        console.log('    SchwarzDiamond.init().then(engine => {');
        console.log('      const sdk = engine.sdk();');
        console.log('      sdk.help();                    // full API guide');
        console.log('      sdk.state.set("score", 100);   // L4 state');
        console.log('      sdk.auth.login("user", "pass"); // L5 auth');
        console.log('      sdk.repo("players").create({}); // L7 CRUD');
        console.log('    });\n');
        console.log('  Methods: init(), sdk(), layer(0-7), help(), stats(), dimensions()');
        console.log('  Data:    ingest(key, data), ingestAll({...}), absorb(module)');
        console.log('  Properties: void, physical, datalink, network, transport, session, presentation, application\n');
    }

    const _public = Object.freeze({
        VERSION, PHI,
        init,
        sdk,
        layer,
        help,
        ingest,
        ingestAll,
        absorb,
        dimensions: () => DIMENSIONS,
        get void()         { return layers.void; },
        get physical()     { return layers.physical; },
        get datalink()     { return layers.datalink; },
        get network()      { return layers.network; },
        get transport()    { return layers.transport; },
        get session()      { return layers.session; },
        get presentation() { return layers.presentation; },
        get application()  { return layers.application; },
        get wave()         { return layers.datalink; },  // Wave IS L2
        isReady: () => _initialized,
        stats: () => {
            const s = {};
            for (let i = 0; i < MANIFEST.length; i++) {
                const key = MANIFEST[i].key;
                const dim = DIMENSIONS[i];
                const v = layers[key];
                s[key] = {
                    layer: dim.layer,
                    dimension: dim.dim,
                    surface: dim.surface,
                    status: v ? (v.stats ? v.stats() : '✓') : '✗'
                };
            }
            return s;
        }
    });

    return _public;
})();

// Expose globally
if (typeof window !== 'undefined') {
    window.SchwarzDiamond = SchwarzDiamond;
    window.KensEngine = SchwarzDiamond; // legacy alias
}
