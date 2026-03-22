/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND — LAYER 7: APPLICATION MANIFOLD
 * Genesis: COMPLETION — "Intent becomes action"
 * Dimension: COMPLETION (6D) — the perceived becomes willed
 * ═══════════════════════════════════════════════════════════════
 *
 * The developer's layer. Where the engine becomes a tool.
 *
 * Everything below this layer is infrastructure. L7 is where a
 * developer says "I want to build X" and the engine responds
 * with familiar patterns:
 *
 *   Controller  — define REST endpoints and route handlers
 *   Service     — business logic containers with dependency injection
 *   Repository  — data access abstraction (CRUD over L4 state)
 *   App         — application lifecycle (define, start, stop)
 *   Helpers     — utilities that hide the math
 *
 * SELF-DOCUMENTING: Every object has .help() and .api() methods.
 * Call engine.help() in the console to see everything available.
 *
 * Dimensional progression:
 *   L1 Point → L2 Line → L3 Width → L4 Volume → L5 Whole
 *   → L6 Perception → L7 Completion (6D) ← HERE
 *   z = x·y²: rules(x) × state²(y) = application(z)
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const ApplicationManifold = (() => {

    const PHI = 1.618033988749895;
    function zxy2(x, y) { return x * y * y; }

    // ─── Russian Doll — L7 only touches L6 (its neighbor) ─────
    // All deeper layers are reached by unwrapping: L6.below() = L5,
    // L5.below() = L4, L4.below() = L3, L3.below() = L2, L2.below() = L1.
    // Each doll wraps the one inside it. Strict helix compliance.
    let _L6, _L5, _L4, _L3, _L2;
    let _unwrapped = false;

    function _layers() {
        if (_unwrapped) return;
        // Only reach for our immediate neighbor
        if (!_L6 && typeof PresentationSubstrate !== 'undefined') _L6 = PresentationSubstrate;
        if (!_L6) return;

        // Unwrap the Russian doll — each layer opens the one inside it
        _L5 = _L6.below ? _L6.below() : null;                    // L6 → L5
        _L4 = _L5 && _L5.below ? _L5.below() : null;             // L5 → L4
        _L3 = _L4 && _L4.below ? _L4.below() : null;             // L4 → L3
        _L2 = _L3 && _L3.below ? _L3.below() : null;             // L3 → L2
        // L2.below() = L1 (available if needed, but L7 doesn't use L1 directly)
        _unwrapped = true;
    }

    function _log(...args) {
        _layers();
        // Log through the doll chain: L7 → L6 → L5 → L4 → L3 (which has logging)
        if (_L3 && _L3.log) _L3.log.info('L7', ...args);
        else console.log('[App L7]', ...args);
    }

    // ═══════════════════════════════════════════════════════════
    //  APPLICATION LIFECYCLE — define, start, stop
    // ═══════════════════════════════════════════════════════════

    const _apps = new Map();
    let _active = null;

    /**
     * Define an application.
     * @param {string} name  - Unique app id ('fasttrack', 'dashboard', etc.)
     * @param {object} def   - Application definition:
     *   phases:     string[]        — lifecycle phases ['setup','play','end']
     *   rules:      object          — { validateMove(move,state)→bool, checkWin(state)→winner|null }
     *   entities:   object          — entity type defs { peg: {...}, card: {...} }
     *   onInit:     fn(engine)      — called on start, receives SDK
     *   onPhase:    fn(phase,state) — called on phase transitions
     *   onEvent:    fn(evt,state)   — receives L2 events
     *   onRender:   fn(t,scene,cam) — per-frame render hook
     *   onDestroy:  fn()            — cleanup
     * @returns {object} The registered app definition
     */
    function define(name, def) {
        if (_apps.has(name)) _log(`Redefining app: ${name}`);
        const app = {
            name,
            phases:    def.phases    || ['setup', 'play', 'end'],
            rules:     def.rules     || {},
            entities:  def.entities  || {},
            onInit:    def.onInit    || (() => {}),
            onPhase:   def.onPhase   || (() => {}),
            onEvent:   def.onEvent   || (() => {}),
            onRender:  def.onRender  || (() => {}),
            onDestroy: def.onDestroy || (() => {}),
            state:     { phase: null, turn: 0, players: [], entities: new Map(), custom: {} },
            meta:      def.meta      || {}
        };
        _apps.set(name, app);
        return app;
    }

    function start(name, engine) {
        const app = _apps.get(name);
        if (!app) throw new Error(`Unknown application: ${name}. Registered: ${[..._apps.keys()].join(', ')}`);
        if (_active) stop();
        _active = app;
        app.state.phase = app.phases[0];
        app.state.turn = 0;
        app.onInit(engine || sdk());
        app.onPhase(app.state.phase, app.state);
        _log(`Started: ${name} → phase: ${app.state.phase}`);
        return app.state;
    }

    function stop() {
        if (!_active) return;
        _active.onDestroy();
        _log(`Stopped: ${_active.name}`);
        _active = null;
    }

    function nextPhase() {
        if (!_active) return null;
        const idx = _active.phases.indexOf(_active.state.phase);
        const next = _active.phases[(idx + 1) % _active.phases.length];
        _active.state.phase = next;
        _active.onPhase(next, _active.state);
        return next;
    }

    function setPhase(phase) {
        if (!_active) return;
        _active.state.phase = phase;
        _active.onPhase(phase, _active.state);
    }

    // Rules
    function validateMove(move) {
        if (!_active || !_active.rules.validateMove) return true;
        return _active.rules.validateMove(move, _active.state);
    }
    function checkWin() {
        if (!_active || !_active.rules.checkWin) return null;
        return _active.rules.checkWin(_active.state);
    }

    // Entities
    function addEntity(id, type, data) {
        if (!_active) return null;
        const entity = { id, type, ...data, alive: true };
        _active.state.entities.set(id, entity);
        return entity;
    }
    function getEntity(id)           { return _active ? _active.state.entities.get(id) : null; }
    function removeEntity(id)        { if (_active) _active.state.entities.delete(id); }
    function getEntitiesByType(type) { return _active ? [..._active.state.entities.values()].filter(e => e.type === type) : []; }

    // Event bridge
    function handleEvent(evt)              { if (_active) _active.onEvent(evt, _active.state); }
    function renderFrame(t, scene, camera) { if (_active) _active.onRender(t, scene, camera, _active.state); }

    // ═══════════════════════════════════════════════════════════
    //  CONTROLLER — REST-style route handlers
    //  Familiar pattern: define endpoints, handle requests
    // ═══════════════════════════════════════════════════════════

    const _controllers = new Map();

    /**
     * Define a controller with REST-style routes.
     * @example
     *   controller('users', {
     *     'GET /':        (req) => repo('users').findAll(),
     *     'GET /:id':     (req) => repo('users').findById(req.params.id),
     *     'POST /':       (req) => repo('users').create(req.body),
     *     'PUT /:id':     (req) => repo('users').update(req.params.id, req.body),
     *     'DELETE /:id':  (req) => repo('users').remove(req.params.id),
     *   });
     */
    function controller(name, routes) {
        const ctrl = { name, routes: {}, middleware: [] };
        for (const [pattern, handler] of Object.entries(routes)) {
            ctrl.routes[pattern] = handler;
        }
        _controllers.set(name, ctrl);
        _log(`Controller registered: ${name} (${Object.keys(routes).length} routes)`);
        return ctrl;
    }

    /**
     * Dispatch a request to a controller.
     * @param {string} method  - 'GET', 'POST', 'PUT', 'DELETE'
     * @param {string} path    - '/users/123'
     * @param {object} body    - Request body (for POST/PUT)
     * @returns {*} Response from the matched handler
     */
    function dispatch(method, path, body = null) {
        const parts = path.split('/').filter(Boolean);
        const ctrlName = parts[0];
        const ctrl = _controllers.get(ctrlName);
        if (!ctrl) return { status: 404, error: `No controller: ${ctrlName}` };

        const subPath = '/' + parts.slice(1).join('/');
        const params = {};

        // Match route
        for (const [pattern, handler] of Object.entries(ctrl.routes)) {
            const [routeMethod, routePath] = pattern.split(' ');
            if (routeMethod !== method) continue;

            const routeParts = routePath.split('/').filter(Boolean);
            const pathParts = subPath.split('/').filter(Boolean);

            if (routeParts.length === 0 && pathParts.length === 0) {
                return _safeCall(handler, { params, body, method, path });
            }
            if (routeParts.length !== pathParts.length) continue;

            let match = true;
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false; break;
                }
            }
            if (match) return _safeCall(handler, { params, body, method, path });
        }

        return { status: 404, error: `No route: ${method} ${path}` };
    }

    function _safeCall(handler, req) {
        try { return { status: 200, data: handler(req) }; }
        catch (e) { return { status: 500, error: e.message }; }
    }

    // ═══════════════════════════════════════════════════════════
    //  SERVICE — business logic containers
    //  Dependency injection via the engine reference
    // ═══════════════════════════════════════════════════════════

    const _services = new Map();

    /**
     * Define a service — a named container of business logic.
     * The factory receives the SDK so it can access any layer.
     * @example
     *   service('scoring', (engine) => ({
     *     calculateScore: (hits, time) => hits * 100 - time * 2,
     *     getHighScores:  () => engine.state.get('highScores') || [],
     *     saveScore:      (score) => {
     *       const scores = engine.state.get('highScores') || [];
     *       scores.push(score);
     *       engine.state.set('highScores', scores);
     *     }
     *   }));
     *
     *   // Later:
     *   engine.service('scoring').calculateScore(42, 120);
     */
    function service(name, factory) {
        if (typeof factory === 'function') {
            _services.set(name, { factory, instance: null });
            _log(`Service registered: ${name}`);
        } else if (typeof factory === 'undefined') {
            // Getter mode — return the service instance
            const svc = _services.get(name);
            if (!svc) return null;
            if (!svc.instance) svc.instance = svc.factory(sdk());
            return svc.instance;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  REPOSITORY — data access pattern over L4 state
    //  CRUD abstraction: create, findById, findAll, update, remove
    // ═══════════════════════════════════════════════════════════

    const _repos = new Map();

    /**
     * Create or get a repository for a data collection.
     * @example
     *   const users = engine.repo('users');
     *   users.create({ name: 'Ken', role: 'admin' });
     *   users.findAll();                        // → [{ id, name, role, ... }]
     *   users.findById('u_abc123');              // → { id, name, role, ... }
     *   users.find(u => u.role === 'admin');     // → [{ id, name, role, ... }]
     *   users.update('u_abc123', { role: 'mod' });
     *   users.remove('u_abc123');
     */
    function repo(name) {
        if (_repos.has(name)) return _repos.get(name);
        _layers();

        let _nextId = 1;

        const repository = {
            name,

            /** Create a new record. Returns the record with generated id. */
            create(data) {
                const id = `${name}_${Date.now().toString(36)}_${(_nextId++).toString(36)}`;
                const record = { id, ...data, _created: Date.now(), _updated: Date.now() };
                const all = _getCollection();
                all[id] = record;
                _setCollection(all);
                return record;
            },

            /** Find a single record by id. */
            findById(id) {
                return _getCollection()[id] || null;
            },

            /** Return all records as an array. */
            findAll() {
                return Object.values(_getCollection());
            },

            /** Find records matching a predicate function. */
            find(predicate) {
                return Object.values(_getCollection()).filter(predicate);
            },

            /** Find the first record matching a predicate. */
            findOne(predicate) {
                return Object.values(_getCollection()).find(predicate) || null;
            },

            /** Update a record by id with partial data. */
            update(id, data) {
                const all = _getCollection();
                if (!all[id]) return null;
                all[id] = { ...all[id], ...data, _updated: Date.now() };
                _setCollection(all);
                return all[id];
            },

            /** Remove a record by id. Returns the removed record. */
            remove(id) {
                const all = _getCollection();
                const record = all[id];
                if (!record) return null;
                delete all[id];
                _setCollection(all);
                return record;
            },

            /** Count records, optionally matching a predicate. */
            count(predicate) {
                const all = Object.values(_getCollection());
                return predicate ? all.filter(predicate).length : all.length;
            },

            /** Remove all records. */
            clear() { _setCollection({}); },

            /** Subscribe to changes on this collection. */
            onChange(fn) {
                if (_L4) return _L4.on(`change:repo:${name}`, fn);
            }
        };

        function _getCollection() {
            if (_L4) return _L4.get(`repo:${name}`) || {};
            return {};
        }
        function _setCollection(data) {
            if (_L4) _L4.set(`repo:${name}`, data);
        }

        _repos.set(name, repository);
        return repository;
    }

    // ═══════════════════════════════════════════════════════════
    //  HELPER FUNCTIONS — developer utilities
    // ═══════════════════════════════════════════════════════════

    const helpers = {
        /** Generate a unique id with optional prefix */
        uid: (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,

        /** Deep clone an object (structuredClone or JSON fallback) */
        clone: (obj) => typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)),

        /** Deep merge objects (right wins) */
        merge: (...objects) => objects.reduce((acc, obj) => {
            for (const key of Object.keys(obj)) {
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && acc[key] && typeof acc[key] === 'object') {
                    acc[key] = helpers.merge(acc[key], obj[key]);
                } else { acc[key] = obj[key]; }
            }
            return acc;
        }, {}),

        /** Clamp a number between min and max */
        clamp: (val, min, max) => Math.max(min, Math.min(max, val)),

        /** Linear interpolation */
        lerp: (a, b, t) => a + (b - a) * t,

        /** Map a value from one range to another */
        mapRange: (val, inMin, inMax, outMin, outMax) => outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin),

        /** Random integer between min and max (inclusive) */
        randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

        /** Pick a random element from an array */
        pick: (arr) => arr[Math.floor(Math.random() * arr.length)],

        /** Shuffle an array (Fisher-Yates) */
        shuffle: (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },

        /** Debounce a function */
        debounce: (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; },

        /** Throttle a function */
        throttle: (fn, ms) => { let last = 0; return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } }; },

        /** Format time in seconds to mm:ss or hh:mm:ss */
        formatTime: (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
        },

        /** Wait for ms milliseconds (async) */
        sleep: (ms) => new Promise(r => setTimeout(r, ms)),

        /** Retry a function up to n times with delay */
        retry: async (fn, attempts = 3, delayMs = 1000) => {
            for (let i = 0; i < attempts; i++) {
                try { return await fn(); } catch (e) {
                    if (i === attempts - 1) throw e;
                    await helpers.sleep(delayMs * (i + 1));
                }
            }
        },

        /** PHI — the golden ratio */
        PHI,

        /** Common easing functions */
        ease: {
            linear:    t => t,
            easeIn:    t => t * t,
            easeOut:   t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            bounce:    t => {
                const n1 = 7.5625, d1 = 2.75;
                if (t < 1/d1)       return n1 * t * t;
                if (t < 2/d1)       return n1 * (t -= 1.5/d1) * t + 0.75;
                if (t < 2.5/d1)     return n1 * (t -= 2.25/d1) * t + 0.9375;
                return n1 * (t -= 2.625/d1) * t + 0.984375;
            },
            elastic:   t => t === 0 || t === 1 ? t : -Math.pow(2, 10*(t-1)) * Math.sin((t-1.1)*5*Math.PI),
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  SELF-DOCUMENTING — .help() and .api() on everything
    // ═══════════════════════════════════════════════════════════

    const _apiDocs = {
        // App lifecycle
        define:      { sig: 'define(name, definition)', desc: 'Register an application with lifecycle hooks' },
        start:       { sig: 'start(name, engine?)', desc: 'Start a registered application' },
        stop:        { sig: 'stop()', desc: 'Stop the active application and run cleanup' },
        nextPhase:   { sig: 'nextPhase()', desc: 'Advance to the next phase in the app lifecycle' },
        setPhase:    { sig: 'setPhase(phase)', desc: 'Jump to a specific phase' },
        // Rules
        validateMove: { sig: 'validateMove(move)', desc: 'Validate a move against app rules' },
        checkWin:     { sig: 'checkWin()', desc: 'Check for a win condition' },
        // Entities
        addEntity:       { sig: 'addEntity(id, type, data)', desc: 'Add an entity to the active app' },
        getEntity:       { sig: 'getEntity(id)', desc: 'Get an entity by id' },
        removeEntity:    { sig: 'removeEntity(id)', desc: 'Remove an entity by id' },
        getEntitiesByType: { sig: 'getEntitiesByType(type)', desc: 'Get all entities of a type' },
        // Controller
        controller: { sig: 'controller(name, { "METHOD /path": handler })', desc: 'Define a REST-style controller with route handlers' },
        dispatch:   { sig: 'dispatch(method, path, body?)', desc: 'Dispatch a request to a controller' },
        // Service
        service:    { sig: 'service(name, factory?) — define with factory, get without', desc: 'Define or retrieve a named service' },
        // Repository
        repo:       { sig: 'repo(name)', desc: 'Get a CRUD repository: .create(), .findAll(), .findById(), .update(), .remove()' },
        // Helpers
        helpers:    { sig: 'helpers.*', desc: 'Utilities: uid, clone, merge, clamp, lerp, randInt, pick, shuffle, debounce, throttle, sleep, retry, ease.*' },
        // SDK
        sdk:        { sig: 'sdk()', desc: 'Get the full developer SDK with friendly namespaces' },
        // Ingestion
        ingest:     { sig: 'ingest(key, data, opts?)', desc: 'Feed data into the diamond — auto-gets manifold coordinate (L1), wave emission (L2), state storage (L4), session tracking (L5)' },
        ingestAll:  { sig: 'ingestAll({k1:v1, ...}, opts?)', desc: 'Ingest multiple key-value pairs at once' },
        absorb:     { sig: 'absorb(module, opts?)', desc: 'Register an external module/plugin — auto-registers on manifold, emits arrival wave' },
    };

    /**
     * Print help to the console — a developer's first stop.
     * @param {string} [topic] - Optional topic to get detailed help on
     */
    function help(topic) {
        if (topic && _apiDocs[topic]) {
            const d = _apiDocs[topic];
            console.log(`\n  ${d.sig}\n  ${d.desc}\n`);
            return d;
        }
        console.log('\n  ╔═══════════════════════════════════════════════════════╗');
        console.log('  ║     OSI SCHWARZ DIAMOND — Developer SDK              ║');
        console.log('  ╚═══════════════════════════════════════════════════════╝\n');
        console.log('  Quick Start:');
        console.log('    const engine = SchwarzDiamond.sdk();');
        console.log('    engine.state.set("score", 100);');
        console.log('    engine.http.get("/api/data");');
        console.log('    engine.auth.login("user", "pass");');
        console.log('    engine.on("click", "#btn", handler);');
        console.log('    engine.repo("users").create({ name: "Ken" });\n');
        console.log('  Namespaces:');
        console.log('    engine.state    — get/set/watch state (L4)');
        console.log('    engine.events   — pub/sub, DOM events (L2)');
        console.log('    engine.http     — HTTP requests (L3)');
        console.log('    engine.ws       — WebSocket connections (L3)');
        console.log('    engine.auth     — login/logout/register (L5)');
        console.log('    engine.session  — session lifecycle (L5)');
        console.log('    engine.cache    — TTL cache (L5)');
        console.log('    engine.settings — user preferences (L5)');
        console.log('    engine.log      — logging (L3)');
        console.log('    engine.helpers  — utilities (uid, clone, lerp, etc.)');
        console.log('    engine.repo(n)  — CRUD repository');
        console.log('    engine.service(n) — business logic services\n');
        console.log('  For details: engine.help("repo"), engine.help("controller"), etc.');
        console.log('  Full API list: engine.api()\n');
        return _apiDocs;
    }

    /**
     * Return the full API surface as a structured object.
     */
    function api() {
        const surface = {};
        for (const [key, doc] of Object.entries(_apiDocs)) {
            surface[key] = `${doc.sig} — ${doc.desc}`;
        }
        return surface;
    }

    // ═══════════════════════════════════════════════════════════
    //  SDK — the developer-friendly facade
    //  Remaps all 7 layers into familiar namespaces
    // ═══════════════════════════════════════════════════════════

    let _sdk = null;

    /**
     * Get the complete developer SDK.
     * Maps engine internals to clean, familiar namespaces.
     * This is what you hand to application code.
     *
     * @returns {object} The SDK object with all namespaces
     */
    function sdk() {
        if (_sdk) return _sdk;
        _layers();

        _sdk = {
            // ── State (L4) ─────────────────────────────
            state: {
                get:      (key, def)    => _L4 ? _L4.get(key, def) : undefined,
                set:      (key, val)    => _L4 ? _L4.set(key, val) : undefined,
                has:      (key)         => _L4 ? _L4.has(key) : false,
                del:      (key)         => _L4 ? _L4.del(key) : false,
                clear:    ()            => _L4 ? _L4.clear() : undefined,
                getAll:   ()            => _L4 ? _L4.getAll() : {},
                watch:    (key, fn)     => _L4 ? _L4.watch(key, fn) : undefined,
                computed: (key, deps, fn) => _L4 ? _L4.computed(key, deps, fn) : undefined,
                snapshot: ()            => _L4 ? _L4.snapshot() : {},
                restore:  (snap)        => _L4 ? _L4.restore(snap) : undefined,
                history:  ()            => _L4 ? _L4.history() : [],
                transaction: (fn)       => _L4 ? _L4.transaction(fn) : undefined,
                save:     (key)         => _L4 ? _L4.save(key) : undefined,
                load:     (key)         => _L4 ? _L4.load(key) : undefined,
                help:     () => console.log('state: get/set/has/del/clear/getAll/watch/computed/snapshot/restore/history/transaction/save/load')
            },

            // ── Events (L2) ───────────────────────────
            events: {
                on:        (...a)   => _L2 ? _L2.on(...a) : undefined,
                off:       (...a)   => _L2 ? _L2.off(...a) : undefined,
                emit:      (ch, d)  => _L2 ? _L2.emit(ch, d) : undefined,
                subscribe: (ch, fn) => _L2 ? _L2.subscribe(ch, fn) : undefined,
                once:      (ch, fn) => _L2 ? _L2.once(ch, fn) : undefined,
                waitFor:   (ch)     => _L2 ? _L2.waitFor(ch) : Promise.resolve(),
                delegate:  (...a)   => _L2 ? _L2.delegate(...a) : undefined,
                debounce:  (...a)   => _L2 ? _L2.debounce(...a) : undefined,
                throttle:  (...a)   => _L2 ? _L2.throttle(...a) : undefined,
                help:      () => console.log('events: on/off/emit/subscribe/once/waitFor/delegate/debounce/throttle')
            },

            // ── HTTP (L3) ─────────────────────────────
            http: _L3 ? {
                get:    (url, opts)    => _L3.http.get(url, opts),
                post:   (url, b, opts) => _L3.http.post(url, b, opts),
                put:    (url, b, opts) => _L3.http.put(url, b, opts),
                patch:  (url, b, opts) => _L3.http.patch(url, b, opts),
                delete: (url, opts)    => _L3.http.delete(url, opts),
                request: (...a)        => _L3.request(...a),
                help:   () => console.log('http: get/post/put/patch/delete/request — all return Promises')
            } : { help: () => console.log('http: L3 Network not loaded') },

            // ── WebSocket (L3) ────────────────────────
            ws: {
                connect: (...a) => _L3 ? _L3.connect(...a) : null,
                help:    () => console.log('ws: connect(url, handlers) — returns { send, close, on }')
            },

            // ── Auth (L5) ─────────────────────────────
            auth: {
                register:    (...a) => _L5 ? _L5.register(...a) : null,
                login:       (...a) => _L5 ? _L5.login(...a) : null,
                logout:      ()     => _L5 ? _L5.logout() : undefined,
                verifyToken: (t)    => _L5 ? _L5.verifyToken(t) : false,
                identity:    ()     => _L5 ? _L5.getIdentity() : null,
                help:        () => console.log('auth: register/login/logout/verifyToken/identity')
            },

            // ── Session (L5) ──────────────────────────
            session: {
                create:    (...a) => _L5 ? _L5.createSession(...a) : null,
                start:     (sid)  => _L5 ? _L5.startSession(sid) : null,
                pause:     (sid)  => _L5 ? _L5.pauseSession(sid) : null,
                resume:    (sid)  => _L5 ? _L5.resumeSession(sid) : null,
                end:       (sid)  => _L5 ? _L5.endSession(sid) : null,
                get:       (sid)  => _L5 ? _L5.getSession(sid) : null,
                active:    ()     => _L5 ? _L5.getActiveSession() : null,
                duration:  (sid)  => _L5 ? _L5.sessionDuration(sid) : 0,
                setPhase:  (...a) => _L5 ? _L5.setPhase(...a) : undefined,
                nextRound: (sid)  => _L5 ? _L5.nextRound(sid) : 0,
                log:       (sid)  => _L5 ? _L5.getSessionLog(sid) : [],
                saveGame:  (...a) => _L5 ? _L5.saveGame(...a) : false,
                loadGame:  (...a) => _L5 ? _L5.loadGame(...a) : null,
                listSaves: ()     => _L5 ? _L5.listSaves() : [],
                help:      () => console.log('session: create/start/pause/resume/end/get/active/duration/setPhase/nextRound/log/saveGame/loadGame')
            },

            // ── Cache (L5) ────────────────────────────
            cache: {
                get:   (k)       => _L5 ? _L5.getCache(k) : undefined,
                set:   (k, v, t) => _L5 ? _L5.setCache(k, v, t) : undefined,
                has:   (k)       => _L5 ? _L5.hasCache(k) : false,
                del:   (k)       => _L5 ? _L5.delCache(k) : false,
                clear: ()        => _L5 ? _L5.clearCache() : undefined,
                stats: ()        => _L5 ? _L5.cacheStats() : {},
                help:  () => console.log('cache: get/set/has/del/clear/stats — TTL-based with LRU eviction')
            },

            // ── Settings (L5) ─────────────────────────
            settings: {
                get:      (k)       => _L5 ? _L5.getSetting(k) : undefined,
                set:      (k, v)    => _L5 ? _L5.setSetting(k, v) : undefined,
                getAll:   ()        => _L5 ? _L5.getAllSettings() : {},
                onChange:  (k, fn)   => _L5 ? _L5.onSettingChange(k, fn) : undefined,
                reset:    ()        => _L5 ? _L5.resetSettings() : undefined,
                defaults: ()        => _L5 ? _L5.defaults() : {},
                help:     () => console.log('settings: get/set/getAll/onChange/reset/defaults')
            },

            // ── Logging (L3) ──────────────────────────
            log: _L3 ? {
                trace: (...a) => _L3.log.trace(...a),
                debug: (...a) => _L3.log.debug(...a),
                info:  (...a) => _L3.log.info(...a),
                warn:  (...a) => _L3.log.warn(...a),
                error: (...a) => _L3.log.error(...a),
                fatal: (...a) => _L3.log.fatal(...a),
                setLevel: (l) => _L3.setLogLevel(l),
                getLogs:  ()  => _L3.getLogs(),
                help:  () => console.log('log: trace/debug/info/warn/error/fatal/setLevel/getLogs')
            } : console,

            // ── Validation (L3) ───────────────────────
            validate: _L3 ? _L3.validate : (data, schema) => ({ valid: true }),
            V: _L3 ? _L3.V : {},

            // ── Developer patterns ────────────────────
            controller,
            dispatch,
            service,
            repo,
            helpers,

            // ── App lifecycle ─────────────────────────
            app: {
                define, start, stop,
                nextPhase, setPhase,
                validateMove, checkWin,
                addEntity, getEntity, removeEntity, getEntitiesByType,
                active:      () => _active,
                activeState: () => _active ? _active.state : null,
                help:        () => console.log('app: define/start/stop/nextPhase/setPhase/validateMove/checkWin/addEntity/getEntity/removeEntity/getEntitiesByType')
            },

            // ── Shorthand aliases ─────────────────────
            on:   (...a) => _L2 ? _L2.on(...a) : undefined,
            emit: (...a) => _L2 ? _L2.emit(...a) : undefined,

            // ── Data ingestion ─────────────────────────
            // Delegates to SchwarzDiamond.ingest/absorb — auto-flows through all layers
            ingest:    (...a) => typeof SchwarzDiamond !== 'undefined' ? SchwarzDiamond.ingest(...a) : undefined,
            ingestAll: (...a) => typeof SchwarzDiamond !== 'undefined' ? SchwarzDiamond.ingestAll(...a) : undefined,
            absorb:    (...a) => typeof SchwarzDiamond !== 'undefined' ? SchwarzDiamond.absorb(...a) : undefined,

            // ── Introspection ─────────────────────────
            help,
            api,
            version: '2.0.0',

            // ── Raw layer access via Russian Doll unwrapping ───
            layers: {
                physical:     () => { _layers(); return _L2 && _L2.below ? _L2.below() : null; },  // L2→L1
                datalink:     () => { _layers(); return _L2; },                                      // L3→L2
                network:      () => { _layers(); return _L3; },                                      // L4→L3
                transport:    () => { _layers(); return _L4; },                                      // L5→L4
                session:      () => { _layers(); return _L5; },                                      // L6→L5
                presentation: () => { _layers(); return _L6; },                                      // L7→L6
                application:  () => surface,
                help:         () => console.log('layers: Access via Russian Doll — each layer wraps the one below it')
            }
        };

        return _sdk;
    }

    // ── Public surface ──────────────────────────────────────────
    const surface = Object.freeze({
        name:      'Application Manifold',
        layer:     7,
        dimension: 'Completion (6D)',
        genesis:   'Completion',
        surface:   'z=xy²',
        PHI, zxy2,

        // App lifecycle
        define, start, stop,
        nextPhase, setPhase,
        validateMove, checkWin,

        // Entities
        addEntity, getEntity, removeEntity, getEntitiesByType,

        // Event bridge
        handleEvent, renderFrame,

        // Developer patterns
        controller, dispatch,
        service, repo,
        helpers,

        // Self-documenting
        help, api, sdk,

        // Registry
        getApp: name => _apps.get(name),
        listApps: () => [..._apps.keys()],
        active: () => _active,
        activeState: () => _active ? _active.state : null,
        controllers: () => [..._controllers.keys()],
        services: () => [..._services.keys()],
        repos: () => [..._repos.keys()],

        // Introspection
        stats: () => ({
            registered: _apps.size,
            active: _active ? _active.name : null,
            entities: _active ? _active.state.entities.size : 0,
            phase: _active ? _active.state.phase : null,
            controllers: _controllers.size,
            services: _services.size,
            repos: _repos.size
        }),

        // ── Russian Doll — L7 wraps L6 (the outermost shell) ─
        below: () => { _layers(); return _L6; }
    });

    return surface;
})();

if (typeof window !== 'undefined') window.ApplicationManifold = ApplicationManifold;
if (typeof module !== 'undefined') module.exports = ApplicationManifold;
