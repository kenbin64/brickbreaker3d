/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND — LAYER 3: NETWORK SUBSTRATE
 * Genesis: RELATION — "Binding creates meaning"
 * Dimension: WIDTH (2D) — the line spreads into a plane
 * ═══════════════════════════════════════════════════════════════
 *
 * The Universal Connector. If it has an address, L3 can reach it.
 *
 * A line (L2) becomes a plane when it SPREADS. One wave reaches
 * another — source × destination = surface. This is WIDTH.
 * The second dimension: space. Now waves have somewhere to GO.
 *
 * L1 is the point (manifold). L2 is the line (waveform).
 * L3 is the plane — it connects this machine to EVERYTHING.
 * URLs, IPs, sockets, files, databases, SSH, UDP, TCP, storage —
 * anything that moves a wave between two points flows through L3.
 *
 * Every connection is the same shape:
 *   connect(address) → channel → send(wave) / receive(wave) → close()
 * Every channel is a manifold coordinate (L1) and every datum
 * flowing through it is a waveform (L2). Nothing enters or
 * leaves without being a wave on a manifold.
 *
 * Built-in adapters: http(s), ws(s), sse, idb, storage, file
 * Custom adapters: adapter('ssh', factory) — plug in anything
 *
 * Dimensional progression:
 *   L1 Point (0D) → L2 Line (1D) → L3 Width (2D) ← YOU ARE HERE
 *   The line gains breadth. Two dimensions: time × space.
 *   z = x·y: source(x) × destination(y) = routed wave(z)
 *
 * OSI Network = IP addressing + routing + packet forwarding
 * Schwarz Diamond Network = universal connector + wave routing
 *   + security + validation + diagnostics.
 *
 * Surface: z = x · y
 *   x = source coordinate (who/where sends the wave)
 *   y = destination coordinate (who/where receives the wave)
 *   z = routed wave binding (local or across the network)
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const NetworkSubstrate = (() => {

    const PHI = 1.618033988749895;
    const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

    // Registry — substrates as nodes on the manifold
    const _nodes = new Map();       // name → {substrate, x, y, z, layer, domain}
    const _routes = new Map();      // routeKey → binding function

    function _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
        return Math.abs(h) % 10000;
    }

    function zxy(x, y) {
        const nx = typeof x === 'string' ? _hash(x) : x;
        const ny = typeof y === 'string' ? _hash(y) : y;
        return nx * ny;
    }

    // ═══════════════════════════════════════════════════════════
    //  SUBSTRATE REGISTRY — nodes on the manifold
    // ═══════════════════════════════════════════════════════════

    function register(substrate, coords = {}) {
        if (!substrate || !substrate.name) throw new Error('[Network L3] Substrate must have a name');

        const x = coords.x || _hash(substrate.name);
        const y = coords.y || (substrate.layer || 1);
        const z = x * y;
        const node = {
            substrate,
            name: substrate.name,
            x, y, z,
            layer:  substrate.layer  || coords.layer  || 0,
            domain: coords.domain || 'general',
            weight: FIB[Math.min((substrate.layer || 1) - 1, FIB.length - 1)],
            registered: Date.now()
        };

        _nodes.set(substrate.name, node);
        console.log(`🌐 [Network L3] Registered: ${substrate.name}  z=${z}  layer=${node.layer}`);
        return node;
    }

    function get(name) {
        const n = _nodes.get(name);
        return n ? n.substrate : null;
    }

    function getNode(name) {
        return _nodes.get(name) || null;
    }

    function findByLayer(layer) {
        return [..._nodes.values()].filter(n => n.layer === layer);
    }

    // ═══════════════════════════════════════════════════════════
    //  ROUTING — z=xy binds source to destination
    // ═══════════════════════════════════════════════════════════

    /** Bind two substrates: output of A feeds into B */
    function bind(nameA, nameB) {
        const a = _nodes.get(nameA), b = _nodes.get(nameB);
        if (!a || !b) throw new Error(`[Network L3] Route fault: ${nameA} → ${nameB}`);

        const routeZ = a.z * b.z;
        const key = `${nameA}→${nameB}`;
        const route = {
            key, z: routeZ,
            execute: (data, methodA, methodB) => {
                const mid = a.substrate[methodA](data);
                return b.substrate[methodB](mid);
            }
        };
        _routes.set(key, route);
        console.log(`🌐 [Network L3] Route: ${key}  z=${routeZ}`);
        return route;
    }

    /** Compose a pipeline through multiple substrates */
    function compose(...names) {
        const nodes = names.map(n => _nodes.get(n)).filter(Boolean);
        return {
            nodes: nodes.map(n => n.name),
            execute: (data, methods) => {
                let result = data;
                nodes.forEach((n, i) => {
                    const method = Array.isArray(methods) ? methods[i] : methods;
                    if (typeof n.substrate[method] === 'function') result = n.substrate[method](result);
                });
                return result;
            }
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  VALIDATION — packet/schema validation (guards the route)
    // ═══════════════════════════════════════════════════════════

    const V = {
        required:  v => v !== null && v !== undefined || 'Required',
        isString:  v => typeof v === 'string' || 'Must be string',
        isNumber:  v => typeof v === 'number' && !isNaN(v) || 'Must be number',
        isArray:   v => Array.isArray(v) || 'Must be array',
        isObject:  v => v !== null && typeof v === 'object' && !Array.isArray(v) || 'Must be object',
        positive:  v => v > 0 || 'Must be positive',
        integer:   v => Number.isInteger(v) || 'Must be integer',
        inRange:   (min, max) => v => (v >= min && v <= max) || `Must be ${min}-${max}`,
        oneOf:     list => v => list.includes(v) || `Must be one of: ${list}`,
        minLen:    n => v => v.length >= n || `Min length ${n}`,
        maxLen:    n => v => v.length <= n || `Max length ${n}`,
        matches:   pat => v => pat.test(v) || 'Invalid format',
        notEmpty:  v => {
            if (v == null) return 'Cannot be empty';
            if (typeof v === 'string' && !v.trim()) return 'Cannot be empty';
            if (Array.isArray(v) && !v.length) return 'Cannot be empty';
            return true;
        }
    };


    /**
     * Validate data against a schema of validators.
     * @param {object} data   - The data object to validate
     * @param {object} schema - { key: validatorFn | [validatorFn, ...] }
     * @returns {{ valid: boolean, errors: object }}
     */
    function validate(data, schema) {
        const errors = {};
        for (const [key, rule] of Object.entries(schema)) {
            const val = data[key];
            const fns = Array.isArray(rule) ? rule : [rule];
            for (const fn of fns) {
                const result = fn(val, data);
                if (result !== true) {
                    errors[key] = typeof result === 'string' ? result : 'Invalid';
                    break;
                }
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    }

    /** Combine validators with AND */
    function allValid(...fns) {
        return (v, e) => { for (const fn of fns) { const r = fn(v, e); if (r !== true) return r; } return true; };
    }

    /** Combine validators with OR */
    function anyValid(...fns) {
        return (v, e) => { for (const fn of fns) { if (fn(v, e) === true) return true; } return 'All validations failed'; };
    }

    // ═══════════════════════════════════════════════════════════
    //  DIAGNOSTICS — logging, tracing, health monitoring
    //  Every wave that flows through L3 can be traced.
    // ═══════════════════════════════════════════════════════════

    const LOG_LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5, OFF: 6 };
    let _logLevel = LOG_LEVELS.INFO;
    const _logBuffer = [];
    const _logMax = 500;
    const _logListeners = [];

    function setLogLevel(level) {
        _logLevel = typeof level === 'string' ? (LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO) : level;
    }

    function _log(level, source, message, data) {
        if (level < _logLevel) return;
        const entry = {
            t: performance.now(),
            level,
            levelName: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level) || 'UNKNOWN',
            source,
            message,
            data: data || null
        };
        _logBuffer.push(entry);
        if (_logBuffer.length > _logMax) _logBuffer.shift();
        for (const fn of _logListeners) { try { fn(entry); } catch (e) { /* don't recurse */ } }
        return entry;
    }

    const log = {
        trace: (src, msg, data) => _log(LOG_LEVELS.TRACE, src, msg, data),
        debug: (src, msg, data) => _log(LOG_LEVELS.DEBUG, src, msg, data),
        info:  (src, msg, data) => _log(LOG_LEVELS.INFO,  src, msg, data),
        warn:  (src, msg, data) => _log(LOG_LEVELS.WARN,  src, msg, data),
        error: (src, msg, data) => _log(LOG_LEVELS.ERROR, src, msg, data),
        fatal: (src, msg, data) => _log(LOG_LEVELS.FATAL, src, msg, data),
    };

    function onLog(fn) { _logListeners.push(fn); }

    function getLogs(filter = {}) {
        let logs = _logBuffer;
        if (filter.level !== undefined) logs = logs.filter(e => e.level >= filter.level);
        if (filter.source) logs = logs.filter(e => e.source === filter.source);
        if (filter.since) logs = logs.filter(e => e.t >= filter.since);
        if (filter.limit) logs = logs.slice(-filter.limit);
        return logs;
    }

    function clearLogs() { _logBuffer.length = 0; }

    /** Health check — probe all registered nodes */
    function health() {
        const report = {};
        for (const [name, node] of _nodes) {
            report[name] = {
                layer: node.layer,
                z: node.z,
                hasStats: typeof node.substrate.stats === 'function',
                stats: typeof node.substrate.stats === 'function' ? node.substrate.stats() : null,
                uptime: Date.now() - node.registered
            };
        }
        return report;
    }

    /** Trace a wave through a route — log each hop */
    function trace(routeKey, data) {
        const route = _routes.get(routeKey);
        if (!route) { log.warn('L3', `Trace failed: route ${routeKey} not found`); return null; }
        log.debug('L3', `Trace: ${routeKey}`, { input: data });
        const t0 = performance.now();
        const result = route.execute(data);
        const dt = performance.now() - t0;
        log.debug('L3', `Trace complete: ${routeKey} (${dt.toFixed(2)}ms)`, { output: result });
        return { routeKey, result, dt };
    }

    // ═══════════════════════════════════════════════════════════
    //  SECURITY — protect the relation between source and dest
    //  Authentication = trust the sender. Encryption = only the
    //  destination can read. Integrity = wave wasn't tampered.
    //  Security guards the ROUTE — it lives at L3 because trust
    //  is a property of the relation, not the wave or the state.
    // ═══════════════════════════════════════════════════════════

    const _keys = new Map();       // keyId → { key, algo, created }
    const _permissions = new Map(); // principal → Set<permission>
    const _guards = new Map();      // routeKey → guard function

    /** Register a key (symmetric or token) for a principal */
    function registerKey(keyId, key, algo = 'aes-256') {
        _keys.set(keyId, { key, algo, created: Date.now() });
        log.info('L3', `Key registered: ${keyId} (${algo})`);
    }

    /** XOR-based obfuscation — lightweight scramble for local use.
     *  For real encryption, the app layer plugs in WebCrypto via guard(). */
    function _xorScramble(data, key) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        const keyStr = typeof key === 'string' ? key : String(key);
        let out = '';
        for (let i = 0; i < str.length; i++) {
            out += String.fromCharCode(str.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length));
        }
        return out;
    }

    function encrypt(data, keyId) {
        const k = _keys.get(keyId);
        if (!k) { log.error('L3', `Encrypt failed: key ${keyId} not found`); return null; }
        return { encrypted: true, keyId, payload: _xorScramble(data, k.key) };
    }

    function decrypt(packet, keyId) {
        const k = _keys.get(keyId || packet.keyId);
        if (!k) { log.error('L3', `Decrypt failed: key ${keyId || packet.keyId} not found`); return null; }
        const raw = _xorScramble(packet.payload, k.key);
        try { return JSON.parse(raw); } catch (_) { return raw; }
    }

    /** Simple hash for integrity checks */
    function hash(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(16).padStart(8, '0');
    }

    /** Sign data — returns { data, hash, keyId } */
    function sign(data, keyId) {
        const k = _keys.get(keyId);
        if (!k) { log.error('L3', `Sign failed: key ${keyId} not found`); return null; }
        const combined = JSON.stringify(data) + k.key;
        return { data, hash: hash(combined), keyId };
    }

    /** Verify a signed packet */
    function verify(packet) {
        const k = _keys.get(packet.keyId);
        if (!k) return false;
        const combined = JSON.stringify(packet.data) + k.key;
        return hash(combined) === packet.hash;
    }

    // ── Permissions (RBAC) ──────────────────────────────────────

    function grant(principal, ...perms) {
        if (!_permissions.has(principal)) _permissions.set(principal, new Set());
        const set = _permissions.get(principal);
        perms.forEach(p => set.add(p));
        log.info('L3', `Granted ${perms.join(', ')} to ${principal}`);
    }

    function revoke(principal, ...perms) {
        const set = _permissions.get(principal);
        if (!set) return;
        perms.forEach(p => set.delete(p));
        if (!set.size) _permissions.delete(principal);
    }

    function can(principal, perm) {
        const set = _permissions.get(principal);
        return set ? (set.has('*') || set.has(perm)) : false;
    }

    /** Guard a route — wave must pass the guard function to traverse */
    function guard(routeKey, fn) {
        _guards.set(routeKey, fn);
        log.info('L3', `Route guarded: ${routeKey}`);
    }

    /** Check if a wave can pass a guarded route */
    function checkGuard(routeKey, context) {
        const fn = _guards.get(routeKey);
        if (!fn) return true; // unguarded routes pass
        try { return !!fn(context); }
        catch (e) { log.error('L3', `Guard error on ${routeKey}`, e); return false; }
    }

    // ═══════════════════════════════════════════════════════════
    //  UNIVERSAL CONNECTOR — if it has an address, L3 can reach it
    //  Every connection is the same shape:
    //    open(address) → channel → send(wave) / receive(wave) → close()
    //  Whether it's a URL, a file, a database, an SSH tunnel,
    //  a UDP port, or an IndexedDB store — it's just a channel.
    //
    //  Every channel IS a manifold coordinate (L1) — it has a
    //  position in the network topology. Every piece of data
    //  flowing through IS a waveform (L2) — it can be observed,
    //  subscribed to, composed, and transformed.
    //
    //  connect() → manifold node + wave emitter + protocol channel
    // ═══════════════════════════════════════════════════════════

    const _connections = new Map();   // id → channel
    const _adapters    = new Map();   // protocol → adapter factory
    let _connId = 0;

    // ── Helix neighbors only: L2 (below) and L4 (above) ──────────
    // L3 does NOT reach down to L1 or up past L4.
    // L2 provides the wave bus. L4 provides state storage.
    let _L2 = null;  // DataLinkSubstrate (Waveform) — neighbor below
    let _L4 = null;  // TransportSubstrate (State)   — neighbor above

    /** Bind immediate neighbors only */
    function _bindLayers() {
        if (!_L2 && typeof DataLinkSubstrate !== 'undefined') _L2 = DataLinkSubstrate;
        if (!_L4 && typeof TransportSubstrate !== 'undefined') _L4 = TransportSubstrate;
    }

    /**
     * Register a connection adapter for a protocol/scheme.
     * Adapter is a factory: (address, handlers, opts) → channel object
     * Channel must implement: { send(data), close(), state, type }
     */
    function adapter(protocol, factory) {
        _adapters.set(protocol, factory);
        log.info('L3', `Adapter registered: ${protocol}://`);
    }

    /**
     * Universal connect — parse the address, find the adapter, open channel.
     *
     * Every channel returned is enriched with:
     *   - Manifold identity: channel is registered as a node in L3's registry
     *   - Wave integration: channel.on(event, fn) for observation (L2 pub/sub)
     *   - channel.emit(event, data) to push waves through the channel
     *   - All inbound data is emitted as waves on 'channel:{id}' topic
     *
     *   connect('ws://server.com/game', { onMessage: ... })
     *   connect('idb://mydb/players')
     *   connect('file://path/to/data.json')
     *   connect('ssh://user@host:22')
     */
    function connect(address, handlers = {}, opts = {}) {
        _bindLayers();

        const protocol = _parseProtocol(address);
        const factory = _adapters.get(protocol);
        if (!factory) { log.error('L3', `No adapter for protocol: ${protocol}://`); return null; }

        const id = `${protocol}_${++_connId}`;
        const waveTopic = `channel:${id}`;

        // Wrap handlers to auto-integrate every inbound message:
        //   → L2 wave emission (observable)
        //   → L4 state storage (if keyed — zero residue)
        const wrappedHandlers = { ...handlers };
        const originalOnMessage = handlers.onMessage;
        wrappedHandlers.onMessage = (data, ch) => {
            // L2 — every inbound datum becomes a wave
            if (_L2) _L2.emit(waveTopic, data);

            // L4 — if data has a key/id, land it in state automatically
            if (_L4 && data && typeof data === 'object') {
                const stateKey = data._key || data.key || data.id;
                if (stateKey) {
                    _L4.set(`${id}:${stateKey}`, data, false);
                }
            }

            if (originalOnMessage) originalOnMessage(data, ch);
        };

        const channel = factory(address, wrappedHandlers, opts);
        channel.id = id;
        channel.address = address;
        channel.protocol = protocol;
        channel.waveTopic = waveTopic;

        // Wave integration — observe this channel's data stream
        channel.on = (fn) => _L2 ? _L2.subscribe(waveTopic, fn) : null;
        channel.off = (fn) => _L2 ? _L2.unsubscribe(waveTopic, fn) : null;

        // Manifold registration — this channel is a coordinate in the network
        const addr = parseAddress(address);
        channel.manifold = {
            protocol, host: addr.host, port: addr.port,
            path: addr.path, origin: addr.origin
        };

        // Wrap close to clean up wave subscriptions and manifold registration
        const originalClose = channel.close;
        channel.close = () => {
            if (_L2) _L2.emit(waveTopic, { _event: 'close', id });
            _connections.delete(id);
            if (originalClose) originalClose();
            log.info('L3', `Disconnected: ${address} (${id})`);
        };

        _connections.set(id, channel);
        log.info('L3', `Connected: ${address} (${id}) — wave topic: ${waveTopic}`);
        return channel;
    }

    function _parseProtocol(address) {
        const match = String(address).match(/^([a-z][a-z0-9+.-]*):\/\//i);
        if (match) return match[1].toLowerCase();
        // shorthand detection
        if (address.startsWith('/') || address.startsWith('./')) return 'file';
        if (address.includes(':')) return 'tcp';
        return 'local';
    }

    // ── ADDRESS UTILITIES ────────────────────────────────────────

    /** Resolve a URL against a base */
    function resolveURL(path, base) {
        try { return new URL(path, base || (typeof location !== 'undefined' ? location.origin : undefined)).href; }
        catch (_) { return path; }
    }

    /** Parse any address into components */
    function parseAddress(address) {
        try {
            const u = new URL(address);
            return {
                protocol: u.protocol.replace(':', ''),
                host: u.hostname, port: u.port ? parseInt(u.port) : null,
                path: u.pathname, query: Object.fromEntries(u.searchParams),
                hash: u.hash.replace('#', ''), user: u.username || null,
                origin: u.origin, full: u.href
            };
        } catch (_) {
            // Not a standard URL — parse manually
            const proto = _parseProtocol(address);
            const rest = address.replace(/^[a-z+.-]+:\/\//i, '');
            const [hostPath, queryHash] = rest.split('?');
            const [pathPart, hashPart] = (queryHash || '').split('#');
            return {
                protocol: proto, host: null, port: null,
                path: hostPath, query: {}, hash: hashPart || null,
                user: null, origin: null, full: address
            };
        }
    }

    // ── BUILT-IN ADAPTERS ────────────────────────────────────────
    // Each adapter: (address, handlers, opts) → channel

    /** HTTP/HTTPS — request/response (stateless wave) */
    adapter('http', (address, handlers, opts) => {
        const channel = {
            type: 'http', state: 'ready',
            send: async (body) => {
                const method = opts.method || (body ? 'POST' : 'GET');
                const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
                const rawBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
                const timeout = opts.timeout || 30000;
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);
                try {
                    const res = await fetch(address, { method, headers, body: rawBody, signal: controller.signal });
                    clearTimeout(timer);
                    const ct = res.headers.get('content-type') || '';
                    const data = ct.includes('json') ? await res.json() : await res.text();
                    const result = { ok: res.ok, status: res.status, data, headers: Object.fromEntries(res.headers) };
                    if (handlers.onMessage) handlers.onMessage(result, channel);
                    return result;
                } catch (e) {
                    clearTimeout(timer);
                    if (handlers.onError) handlers.onError(e, channel);
                    return { ok: false, status: 0, data: null, error: e.message };
                }
            },
            close: () => { channel.state = 'closed'; }
        };
        return channel;
    });
    adapter('https', _adapters.get('http')); // same adapter

    /** Convenience HTTP methods (use without connect()) */
    const http = {
        get:    (url, opts) => connect(`http://${url.replace(/^https?:\/\//, '')}`, {}, opts)?.send(),
        post:   (url, body, opts) => connect(`http://${url.replace(/^https?:\/\//, '')}`, {}, opts)?.send(body),
        request: async (url, opts = {}) => {
            const method = opts.method || 'GET';
            const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
            const body = opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), opts.timeout || 30000);
            try {
                const res = await fetch(url, { method, headers, body, signal: controller.signal });
                clearTimeout(timer);
                const ct = res.headers.get('content-type') || '';
                const data = ct.includes('json') ? await res.json() : await res.text();
                return { ok: res.ok, status: res.status, data };
            } catch (e) { clearTimeout(timer); return { ok: false, status: 0, error: e.message }; }
        }
    };

    /** WebSocket — persistent bidirectional wave channel */
    adapter('ws', (address, handlers) => {
        if (typeof WebSocket === 'undefined') { log.error('L3', 'WebSocket not available'); return { type: 'websocket', state: 'unavailable', send: () => {}, close: () => {} }; }
        const ws = new WebSocket(address);
        const channel = { type: 'websocket', state: 'connecting', queue: [] };
        ws.onopen = () => {
            channel.state = 'open';
            log.info('L3', `WebSocket open: ${address}`);
            while (channel.queue.length) ws.send(channel.queue.shift());
            if (handlers.onOpen) handlers.onOpen(channel);
        };
        ws.onmessage = (e) => {
            let data = e.data;
            try { data = JSON.parse(data); } catch (_) {}
            if (handlers.onMessage) handlers.onMessage(data, channel);
        };
        ws.onerror = (e) => { channel.state = 'error'; log.error('L3', `WebSocket error`, e); if (handlers.onError) handlers.onError(e, channel); };
        ws.onclose = (e) => { channel.state = 'closed'; _connections.delete(channel.id); log.info('L3', `WebSocket closed (${e.code})`); if (handlers.onClose) handlers.onClose(e, channel); };
        channel.send = (data) => {
            const msg = typeof data === 'string' ? data : JSON.stringify(data);
            if (ws.readyState === WebSocket.OPEN) ws.send(msg); else channel.queue.push(msg);
        };
        channel.close = (code = 1000) => ws.close(code);
        return channel;
    });
    adapter('wss', _adapters.get('ws')); // secure websocket

    /** SSE — server-sent events (one-way stream) */
    adapter('sse', (address, handlers) => {
        if (typeof EventSource === 'undefined') { log.error('L3', 'EventSource not available'); return { type: 'sse', state: 'unavailable', send: () => {}, close: () => {} }; }
        const es = new EventSource(address.replace(/^sse:\/\//, 'https://'));
        const channel = { type: 'sse', state: 'connecting', send: () => log.warn('L3', 'SSE is read-only') };
        es.onopen = () => { channel.state = 'open'; if (handlers.onOpen) handlers.onOpen(channel); };
        es.onmessage = (e) => { let d = e.data; try { d = JSON.parse(d); } catch (_) {} if (handlers.onMessage) handlers.onMessage(d, channel); };
        es.onerror = () => { channel.state = 'error'; if (handlers.onError) handlers.onError(null, channel); };
        channel.close = () => { es.close(); channel.state = 'closed'; _connections.delete(channel.id); };
        return channel;
    });

    /** IndexedDB — local database wave store */
    adapter('idb', (address, handlers) => {
        // address format: idb://dbname/storename
        const parts = address.replace('idb://', '').split('/');
        const dbName = parts[0], storeName = parts[1] || 'default';
        let db = null;
        const channel = { type: 'idb', state: 'connecting', db: dbName, store: storeName };

        if (typeof indexedDB !== 'undefined') {
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = (e) => { e.target.result.createObjectStore(storeName, { keyPath: 'id' }); };
            req.onsuccess = (e) => { db = e.target.result; channel.state = 'open'; if (handlers.onOpen) handlers.onOpen(channel); };
            req.onerror = (e) => { channel.state = 'error'; if (handlers.onError) handlers.onError(e, channel); };
        }

        channel.send = async (data) => {
            if (!db) return;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                tx.objectStore(storeName).put(data);
                tx.oncomplete = () => resolve(data);
                tx.onerror = (e) => reject(e);
            });
        };
        channel.query = async (key) => {
            if (!db) return null;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const req = key ? tx.objectStore(storeName).get(key) : tx.objectStore(storeName).getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e);
            });
        };
        channel.remove = async (key) => {
            if (!db) return;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                tx.objectStore(storeName).delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e);
            });
        };
        channel.close = () => { if (db) db.close(); channel.state = 'closed'; _connections.delete(channel.id); };
        return channel;
    });

    /** localStorage / sessionStorage — key/value wave store */
    adapter('storage', (address, handlers) => {
        // address: storage://local/prefix  or  storage://session/prefix
        const parts = address.replace('storage://', '').split('/');
        const store = parts[0] === 'session' ? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
                                              : (typeof localStorage  !== 'undefined' ? localStorage  : null);
        const prefix = parts.slice(1).join('/') || '';
        const channel = { type: 'storage', state: store ? 'open' : 'unavailable', prefix };
        channel.send = (data) => {
            if (!store) return;
            const key = prefix ? `${prefix}.${data.key || data.id || 'data'}` : (data.key || data.id || 'data');
            store.setItem(key, JSON.stringify(data));
            return data;
        };
        channel.query = (key) => {
            if (!store) return null;
            const full = prefix ? `${prefix}.${key}` : key;
            const raw = store.getItem(full);
            try { return raw ? JSON.parse(raw) : null; } catch (_) { return raw; }
        };
        channel.remove = (key) => { if (store) store.removeItem(prefix ? `${prefix}.${key}` : key); };
        channel.keys = () => {
            if (!store) return [];
            const all = [];
            for (let i = 0; i < store.length; i++) {
                const k = store.key(i);
                if (!prefix || k.startsWith(prefix)) all.push(k);
            }
            return all;
        };
        channel.close = () => { channel.state = 'closed'; _connections.delete(channel.id); };
        return channel;
    });

    /** File — FileSystem Access API (browser) or generic file handle */
    adapter('file', (address, handlers) => {
        const path = address.replace('file://', '');
        const channel = { type: 'file', state: 'ready', path };
        channel.send = async (data) => {
            // Write: needs a file handle from showSaveFilePicker or granted handle
            if (channel._handle) {
                const writable = await channel._handle.createWritable();
                await writable.write(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
                await writable.close();
                return true;
            }
            log.warn('L3', 'File write requires a handle — use channel.pickSave() first');
            return false;
        };
        channel.query = async () => {
            if (channel._handle) {
                const file = await channel._handle.getFile();
                const text = await file.text();
                try { return JSON.parse(text); } catch (_) { return text; }
            }
            return null;
        };
        channel.pickOpen = async (types) => {
            if (typeof showOpenFilePicker === 'undefined') { log.error('L3', 'FileSystem API not available'); return null; }
            const [handle] = await showOpenFilePicker({ types });
            channel._handle = handle;
            channel.state = 'open';
            return handle;
        };
        channel.pickSave = async (suggestedName, types) => {
            if (typeof showSaveFilePicker === 'undefined') { log.error('L3', 'FileSystem API not available'); return null; }
            const handle = await showSaveFilePicker({ suggestedName, types });
            channel._handle = handle;
            channel.state = 'open';
            return handle;
        };
        channel.close = () => { channel._handle = null; channel.state = 'closed'; _connections.delete(channel.id); };
        return channel;
    });

    // ── CONNECTION MANAGEMENT ────────────────────────────────────

    /** Close all connections */
    function disconnectAll() {
        for (const [, conn] of _connections) {
            try { conn.close(); } catch (_) {}
        }
        _connections.clear();
        log.info('L3', 'All connections closed');
    }

    /** Get a connection by id */
    function getConnection(id) { return _connections.get(id) || null; }

    /** Find connections by type */
    function findConnections(type) {
        return [..._connections.values()].filter(c => c.type === type);
    }

    // ── Public surface ──────────────────────────────────────────
    return Object.freeze({
        name:    'Network Substrate',
        layer:   3,
        genesis: 'Relation',
        surface: 'z=xy',
        PHI, FIB,
        zxy,
        // Registry
        register, get, getNode, findByLayer,
        // Routing
        bind, compose,
        // Universal Connector
        adapter, connect, parseAddress, resolveURL,
        http, disconnectAll, getConnection, findConnections,
        // Validation
        validate, V, allValid, anyValid,
        // Diagnostics
        log, onLog, getLogs, clearLogs, setLogLevel, LOG_LEVELS,
        health, trace,
        // Security
        registerKey, encrypt, decrypt, hash, sign, verify,
        grant, revoke, can, guard, checkGuard,
        // Introspection
        nodes: () => [..._nodes.keys()],
        routes: () => [..._routes.keys()],
        adapters: () => [..._adapters.keys()],
        connections: () => [..._connections.entries()].map(([id, c]) => ({
            id, type: c.type, protocol: c.protocol, address: c.address, state: c.state
        })),
        stats: () => ({
            nodes: _nodes.size, routes: _routes.size,
            adapters: _adapters.size, connections: _connections.size,
            logs: _logBuffer.length, logLevel: _logLevel,
            keys: _keys.size, permissions: _permissions.size,
            guards: _guards.size
        }),

        // ── Russian Doll — L3 wraps L2 ──────────────────────
        below: () => { _bindLayers(); return _L2; }
    });
})();

if (typeof window !== 'undefined') window.NetworkSubstrate = NetworkSubstrate;
if (typeof module !== 'undefined') module.exports = NetworkSubstrate;
