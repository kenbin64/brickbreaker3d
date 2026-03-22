/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND — LAYER 5: SESSION SUBSTRATE
 * Genesis: LIFE — "Continuity across time"
 * Dimension: WHOLE (4D) — the volume persists through time
 * ═══════════════════════════════════════════════════════════════
 *
 * The living session. Everything about the user's time here.
 *
 * A volume (L4) becomes whole when it PERSISTS. Persistence is
 * the fourth dimension — the volume endures across time, across
 * sessions, across disconnects. It has IDENTITY. It is ALIVE.
 *
 * L5 is the boundary of a user's experience. It knows:
 *   - WHO (identity, login, auth, profiles)
 *   - WHEN (session start/end, duration, timestamps)
 *   - WHAT (game state context, phase, round, progress)
 *   - HOW LONG (timing, duration tracking, idle detection)
 *   - WHAT HAPPENED (session log — narrative of this visit)
 *   - WHAT TO REMEMBER (cache, preferences, save/load)
 *   - WHO ELSE (presence, multiplayer roster)
 *
 * L5 DELEGATES to lower layers:
 *   - L3 for crypto (password hashing, tokens, encryption)
 *   - L3 for connections (WebSocket handles, HTTP channels)
 *   - L3 for logging infrastructure (log.info/warn/error)
 *   - L4 for raw state (key-value store, history, snapshots)
 *
 * L5 OWNS the session-aware wrapper around both:
 *   "This state belongs to THIS user in THIS session"
 *
 * Dimensional progression:
 *   L1 Point → L2 Line → L3 Width → L4 Volume → L5 Whole (4D) ← HERE
 *   The volume gains continuity. Four dimensions:
 *   time × space × state × identity.
 *   z = x·y²: identity(x) × context²(y) = living session(z)
 *   The square on y: sessions require establish + maintain.
 *
 * Surface: z = x · y²
 *   x = identity (who)
 *   y = context (where/when)
 *   z = living session
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const SessionSubstrate = (() => {

    const PHI = 1.618033988749895;

    // z = x · y²
    function zxy2(x, y) { return x * y * y; }

    // ── Helix neighbor: L4 (below) only ───────────────────────────
    // L5 does NOT reach past L4 to L3. Crypto and logging are self-contained.
    // L5's upper neighbor is L6 (Presentation), referenced only if needed.
    let _L4 = null;  // TransportSubstrate (raw state) — neighbor below

    function _layers() {
        if (!_L4 && typeof TransportSubstrate !== 'undefined') _L4 = TransportSubstrate;
    }

    function _log(level, ...args) {
        // Self-contained logging — no reaching down to L3
        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[Session L5]', ...args);
    }

    function _genId(prefix = 'u') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

    // ═══════════════════════════════════════════════════════════
    //  IDENTITY — who is the observer?
    // ═══════════════════════════════════════════════════════════

    let _identity = null;
    const _profiles = new Map();

    function createIdentity(username, opts = {}) {
        const id = _genId('u');
        const profile = {
            id, username,
            displayName: opts.displayName || username,
            avatarId:     opts.avatarId || 'default',
            createdAt:    Date.now(),
            stats:        opts.stats || {}
        };
        _profiles.set(id, profile);
        _persistProfiles();
        _log('info', `Identity created: ${username} (${id})`);
        return profile;
    }

    function setIdentity(profile) { _identity = profile; _persistIdentity(); }
    function getIdentity()        { return _identity; }
    function getProfile(id)       { return _profiles.get(id) || null; }

    // ═══════════════════════════════════════════════════════════
    //  AUTH — login, passwords, tokens (delegates crypto to L3)
    //  L5 owns the FLOW. L3 owns the CRYPTO.
    // ═══════════════════════════════════════════════════════════

    const _credentials = new Map();  // userId → { hash, salt, tokens[] }

    /** Register credentials — L3 hashes the password, L5 stores the result */
    function register(username, password, opts = {}) {
        _layers();
        const profile = createIdentity(username, opts);
        const salt = _genId('salt');
        const hash = _simpleHash(password + salt);  // Self-contained — no reaching to L3
        _credentials.set(profile.id, { hash, salt, tokens: [], failedAttempts: 0, lockedUntil: 0 });
        _log('info', `Registered: ${username}`);
        return profile;
    }

    /** Login — verify password, establish identity, return token */
    function login(username, password) {
        _layers();
        // Find profile by username
        let profile = null, userId = null;
        for (const [id, p] of _profiles) {
            if (p.username === username) { profile = p; userId = id; break; }
        }
        if (!profile) { _log('warn', `Login failed: unknown user ${username}`); return null; }

        const cred = _credentials.get(userId);
        if (!cred) { _log('warn', `Login failed: no credentials for ${username}`); return null; }

        // Lockout check
        if (cred.lockedUntil > Date.now()) {
            _log('warn', `Login locked: ${username} until ${new Date(cred.lockedUntil).toISOString()}`);
            return null;
        }

        const hash = _simpleHash(password + cred.salt);  // Self-contained — no reaching to L3
        if (hash !== cred.hash) {
            cred.failedAttempts++;
            if (cred.failedAttempts >= 5) cred.lockedUntil = Date.now() + 300000; // 5 min lockout
            _log('warn', `Login failed: bad password for ${username} (attempt ${cred.failedAttempts})`);
            return null;
        }

        // Success
        cred.failedAttempts = 0;
        const token = _genId('tok');
        cred.tokens.push({ token, issuedAt: Date.now(), expiresAt: Date.now() + 86400000 }); // 24h
        setIdentity(profile);
        _log('info', `Login success: ${username} → token ${token}`);
        return { profile, token };
    }

    /** Verify a token is valid */
    function verifyToken(token) {
        for (const [, cred] of _credentials) {
            const t = cred.tokens.find(t => t.token === token);
            if (t && t.expiresAt > Date.now()) return true;
        }
        return false;
    }

    /** Logout — invalidate tokens, clear identity */
    function logout() {
        const who = _identity ? _identity.username : 'unknown';
        if (_identity) {
            const cred = _credentials.get(_identity.id);
            if (cred) cred.tokens = [];
        }
        _identity = null;
        _persistIdentity();
        _log('info', `Logout: ${who}`);
    }

    function _simpleHash(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
        return (h >>> 0).toString(16).padStart(8, '0');
    }

    // ═══════════════════════════════════════════════════════════
    //  SESSION — the boundary of a user's time in the app
    //  Start, duration, phase, presence, connections, narrative
    // ═══════════════════════════════════════════════════════════

    const _sessions = new Map();
    let _activeSession = null;

    function createSession(hostId, opts = {}) {
        const sid = _genId('s');
        const session = {
            id: sid,
            hostId,
            players: [hostId],
            maxPlayers: opts.maxPlayers || 4,
            mode:       opts.mode || 'local',       // local | online | spectate
            status:     'waiting',                   // waiting | active | paused | ended
            phase:      opts.phase || null,          // app-defined: 'setup', 'playing', 'results'
            round:      0,
            settings:   opts.settings || {},
            createdAt:  Date.now(),
            startedAt:  null,
            endedAt:    null,
            pausedAt:   null,
            totalPaused: 0,
            connections: [],                         // L3 channel IDs bound to this session
            log:        [],                          // session narrative
            data:       {}                           // app-specific session state
        };
        _sessions.set(sid, session);
        _activeSession = session;
        _sessionLog(sid, 'created', { hostId, mode: session.mode });
        _log('info', `Session created: ${sid} (host: ${hostId})`);
        return session;
    }

    function startSession(sid) {
        const s = _sessions.get(sid);
        if (!s) return null;
        s.status = 'active';
        s.startedAt = Date.now();
        _sessionLog(sid, 'started');
        return s;
    }

    function pauseSession(sid) {
        const s = _sessions.get(sid);
        if (!s || s.status !== 'active') return null;
        s.status = 'paused';
        s.pausedAt = Date.now();
        _sessionLog(sid, 'paused');
        return s;
    }

    function resumeSession(sid) {
        const s = _sessions.get(sid);
        if (!s || s.status !== 'paused') return null;
        s.totalPaused += Date.now() - s.pausedAt;
        s.status = 'active';
        s.pausedAt = null;
        _sessionLog(sid, 'resumed');
        return s;
    }

    function endSession(sid) {
        const s = _sessions.get(sid);
        if (!s) return null;
        s.status = 'ended';
        s.endedAt = Date.now();
        _sessionLog(sid, 'ended', { duration: sessionDuration(sid) });
        if (_activeSession === s) _activeSession = null;
        _log('info', `Session ended: ${sid} (${sessionDuration(sid).toFixed(1)}s)`);
        return s;
    }

    function getSession(sid)     { return _sessions.get(sid) || null; }
    function getActiveSession()  { return _activeSession; }

    /** Session duration in seconds (excluding paused time) */
    function sessionDuration(sid) {
        const s = _sessions.get(sid);
        if (!s || !s.startedAt) return 0;
        const end = s.endedAt || Date.now();
        const paused = s.totalPaused + (s.pausedAt ? (Date.now() - s.pausedAt) : 0);
        return (end - s.startedAt - paused) / 1000;
    }

    /** Set the current phase (app-defined: 'setup', 'playing', 'results', etc.) */
    function setPhase(sid, phase) {
        const s = _sessions.get(sid);
        if (!s) return;
        const old = s.phase;
        s.phase = phase;
        _sessionLog(sid, 'phase', { from: old, to: phase });
    }

    function nextRound(sid) {
        const s = _sessions.get(sid);
        if (!s) return 0;
        s.round++;
        _sessionLog(sid, 'round', { round: s.round });
        return s.round;
    }

    function joinSession(sid, playerId) {
        const s = _sessions.get(sid);
        if (!s || s.status === 'ended') return false;
        if (s.players.length >= s.maxPlayers) return false;
        if (s.players.includes(playerId)) return false;
        s.players.push(playerId);
        _sessionLog(sid, 'join', { playerId });
        return true;
    }

    function leaveSession(sid, playerId) {
        const s = _sessions.get(sid);
        if (!s) return false;
        s.players = s.players.filter(p => p !== playerId);
        _sessionLog(sid, 'leave', { playerId });
        if (!s.players.length) endSession(sid);
        return true;
    }

    /** Bind an L3 connection to this session */
    function bindConnection(sid, channelId) {
        const s = _sessions.get(sid);
        if (!s) return;
        if (!s.connections.includes(channelId)) s.connections.push(channelId);
        _sessionLog(sid, 'connection', { channelId, action: 'bound' });
    }

    /** Session narrative log — what happened during this visit */
    function _sessionLog(sid, event, data = {}) {
        const s = _sessions.get(sid);
        if (!s) return;
        s.log.push({ t: Date.now(), event, ...data });
    }

    function getSessionLog(sid) {
        const s = _sessions.get(sid);
        return s ? [...s.log] : [];
    }

    // ═══════════════════════════════════════════════════════════
    //  SETTINGS — user preferences (diff-only storage, wildcard)
    // ═══════════════════════════════════════════════════════════

    const _defaults = {
        musicEnabled: true, musicVolume: 0.5,
        sfxEnabled: true,   sfxVolume: 0.7,
        cameraMode: 'manual', cameraAngle: 45, cameraDistance: 'medium',
        theme: 'default', showFPS: false, highQuality: true,
        showHints: true, confirmMoves: false, autoEndTurn: true,
        reducedMotion: false, highContrast: false, largeText: false
    };
    let _settings = null;
    let _settingsKey = 'butterfly_settings';
    const _settingsListeners = new Map();

    function loadSettings(appKey) {
        if (appKey) _settingsKey = appKey;
        try {
            const raw = localStorage.getItem(_settingsKey);
            _settings = raw ? { ..._defaults, ...JSON.parse(raw) } : { ..._defaults };
        } catch { _settings = { ..._defaults }; }
        return _settings;
    }

    /** Diff-only save — only persist what differs from defaults */
    function saveSettings() {
        if (!_settings) return;
        try {
            const diff = {};
            for (const k in _settings) {
                if (_settings[k] !== _defaults[k]) diff[k] = _settings[k];
            }
            localStorage.setItem(_settingsKey, JSON.stringify(diff));
        } catch (e) { _log('error', 'Settings save failed', e); }
    }

    function getSetting(key) { return (_settings || _defaults)[key]; }
    function getAllSettings() { if (!_settings) loadSettings(); return { ..._settings }; }

    function setSetting(key, val) {
        if (!_settings) loadSettings();
        const old = _settings[key];
        if (old === val) return;
        _settings[key] = val;
        saveSettings();
        // Specific listeners
        const ls = _settingsListeners.get(key);
        if (ls) ls.forEach(fn => fn(val, old, key));
        // Wildcard listeners
        const wl = _settingsListeners.get('*');
        if (wl) wl.forEach(fn => fn(val, old, key));
    }

    function onSettingChange(key, fn) {
        if (!_settingsListeners.has(key)) _settingsListeners.set(key, []);
        _settingsListeners.get(key).push(fn);
        return () => {
            const list = _settingsListeners.get(key);
            const idx = list.indexOf(fn);
            if (idx >= 0) list.splice(idx, 1);
        };
    }

    function resetSettings() {
        _settings = { ..._defaults };
        saveSettings();
    }

    // ═══════════════════════════════════════════════════════════
    //  CACHE — identity-aware memory with TTL and eviction
    // ═══════════════════════════════════════════════════════════

    const _cache = new Map();
    const _cacheStats = { hits: 0, misses: 0, evictions: 0 };
    const MAX_CACHE = 500;

    function setCache(key, value, ttlMs = 300000) {
        if (_cache.size >= MAX_CACHE) _evictCache();
        _cache.set(key, { value, expires: Date.now() + ttlMs, accessedAt: Date.now() });
    }

    function getCache(key) {
        const entry = _cache.get(key);
        if (!entry) { _cacheStats.misses++; return undefined; }
        if (entry.expires < Date.now()) { _cache.delete(key); _cacheStats.misses++; _cacheStats.evictions++; return undefined; }
        _cacheStats.hits++;
        entry.accessedAt = Date.now();
        return entry.value;
    }

    function hasCache(key) {
        const entry = _cache.get(key);
        if (!entry) return false;
        if (entry.expires < Date.now()) { _cache.delete(key); _cacheStats.evictions++; return false; }
        return true;
    }

    function delCache(key) { return _cache.delete(key); }
    function clearCache()  { _cache.clear(); }

    /** Evict oldest-accessed entries when cache is full */
    function _evictCache() {
        const entries = [..._cache.entries()].sort((a, b) => a[1].accessedAt - b[1].accessedAt);
        const toEvict = Math.max(1, Math.floor(entries.length * 0.2)); // evict 20%
        for (let i = 0; i < toEvict; i++) { _cache.delete(entries[i][0]); _cacheStats.evictions++; }
    }

    function cacheStats() { return { ..._cacheStats, size: _cache.size, maxSize: MAX_CACHE }; }

    // ═══════════════════════════════════════════════════════════
    //  SAVE / LOAD — serialize the whole experience
    // ═══════════════════════════════════════════════════════════

    function saveGame(slotName = 'autosave') {
        _layers();
        const payload = {
            identity: _identity,
            session:  _activeSession ? { ..._activeSession, log: _activeSession.log.slice(-50) } : null,
            state:    _L4 ? _L4.snapshot() : null,
            settings: _settings ? { ..._settings } : null,
            savedAt:  Date.now()
        };
        try {
            localStorage.setItem(`bf_save_${slotName}`, JSON.stringify(payload));
            _log('info', `Game saved: ${slotName}`);
            return true;
        } catch (e) { _log('error', 'Save failed', e); return false; }
    }

    function loadGame(slotName = 'autosave') {
        _layers();
        try {
            const raw = localStorage.getItem(`bf_save_${slotName}`);
            if (!raw) return null;
            const payload = JSON.parse(raw);
            if (payload.identity) { _identity = payload.identity; }
            if (payload.settings) { _settings = { ..._defaults, ...payload.settings }; }
            if (payload.state && _L4 && _L4.restore) { _L4.restore(payload.state); }
            _log('info', `Game loaded: ${slotName}`);
            return payload;
        } catch (e) { _log('error', 'Load failed', e); return null; }
    }

    function listSaves() {
        const saves = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('bf_save_')) {
                    const raw = localStorage.getItem(key);
                    const data = JSON.parse(raw);
                    saves.push({ slot: key.replace('bf_save_', ''), savedAt: data.savedAt });
                }
            }
        } catch {}
        return saves.sort((a, b) => b.savedAt - a.savedAt);
    }

    function deleteSave(slotName) {
        try { localStorage.removeItem(`bf_save_${slotName}`); return true; } catch { return false; }
    }

    // ═══════════════════════════════════════════════════════════
    //  PERSISTENCE — profiles, identity, restore
    // ═══════════════════════════════════════════════════════════

    function _persistProfiles() {
        try { localStorage.setItem('bf_profiles', JSON.stringify([..._profiles])); } catch {}
    }
    function _persistIdentity() {
        if (_identity) try { localStorage.setItem('bf_identity', JSON.stringify(_identity)); } catch {}
        else try { localStorage.removeItem('bf_identity'); } catch {}
    }

    function restore() {
        try {
            const raw = localStorage.getItem('bf_identity');
            if (raw) _identity = JSON.parse(raw);
            const pRaw = localStorage.getItem('bf_profiles');
            if (pRaw) for (const [k, v] of JSON.parse(pRaw)) _profiles.set(k, v);
            // Also try legacy key
            if (!_identity) {
                const legacy = localStorage.getItem('bf_session');
                if (legacy) _identity = JSON.parse(legacy);
            }
        } catch {}
        loadSettings();
        _log('info', `Restored: identity=${!!_identity}, profiles=${_profiles.size}`);
        return _identity;
    }

    // ── Public surface ──────────────────────────────────────────
    return Object.freeze({
        name:      'Session Substrate',
        layer:     5,
        dimension: 'Whole (4D)',
        genesis:   'Life',
        surface:   'z=xy²',
        PHI, zxy2,
        // Identity
        createIdentity, setIdentity, getIdentity, getProfile,
        // Auth
        register, login, logout, verifyToken,
        // Sessions
        createSession, startSession, pauseSession, resumeSession, endSession,
        getSession, getActiveSession, sessionDuration,
        setPhase, nextRound,
        joinSession, leaveSession, bindConnection,
        getSessionLog,
        // Settings
        loadSettings, saveSettings, getSetting, getAllSettings,
        setSetting, onSettingChange, resetSettings,
        defaults: () => ({ ..._defaults }),
        // Cache
        setCache, getCache, hasCache, delCache, clearCache, cacheStats,
        // Save/Load
        saveGame, loadGame, listSaves, deleteSave,
        // Persistence
        restore,
        restoreSession: restore,  // backward compat
        // Introspection
        sessions: () => [..._sessions.keys()],
        profiles: () => [..._profiles.keys()],
        stats: () => ({
            profiles:  _profiles.size,
            sessions:  _sessions.size,
            identity:  !!_identity,
            cache:     _cache.size,
            active:    _activeSession ? _activeSession.id : null,
            uptime:    _activeSession ? sessionDuration(_activeSession.id) : 0
        }),

        // ── Russian Doll — L5 wraps L4 ──────────────────────
        below: () => { _layers(); return _L4; }
    });
})();

if (typeof window !== 'undefined') window.SessionSubstrate = SessionSubstrate;
if (typeof module !== 'undefined') module.exports = SessionSubstrate;
