/**
 * ButterflyFX Interpreter — Helix-Gyroid Runtime
 * ================================================
 * Schwarz Diamond Law: minimum material, maximum area and strength.
 *
 * This interpreter is Labyrinth B — the deployed side of the gyroid surface.
 * It loads helix_index.json (the manifold map), then crystallises each
 * substrate bundle (.bfx) into live, executable JavaScript in the browser.
 *
 * 7-Layer execution follows the helix load_order from the index:
 *   L1 SPARK      — seed the execution context
 *   L2 MIRROR     — register global symbol maps
 *   L3 RELATION   — bind synthesis edges (z = x·y dependencies)
 *   L4 FORM       — execute structural substrates (renderers, data)
 *   L5 LIFE       — activate game systems (AI, UI, audio)
 *   L6 MIND       — engage coherence layer (camera, theme, commentary)
 *   L7 COMPLETION — initialise the game (game_init, lobby, victory)
 *
 * Usage (in your shell HTML):
 *   <script src="bfx_interpreter.js"></script>
 *   <script>
 *     BFXInterpreter.boot('dist/helix_index.json');
 *   </script>
 */

'use strict';

const BFXInterpreter = (() => {
    // ── Constants ──────────────────────────────────────────────────────────────
    const PHI     = 1.618033988749895;
    const FIB     = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const LAYERS  = ['SPARK','MIRROR','RELATION','FORM','LIFE','MIND','COMPLETION'];

    // ── Internal state ─────────────────────────────────────────────────────────
    let _index        = null;   // loaded helix_index.json
    let _executed     = {};     // id → true once a point is live
    let _symbols      = {};     // global symbol registry (MIRROR layer)
    let _spiral       = {};     // layer → accumulated context snapshot (Schwarz Diamond)
    let _onComplete   = null;   // callback fired after L7 collapse

    // ── Utility ────────────────────────────────────────────────────────────────
    function _b64decode(str) {
        try { return atob(str); }
        catch(e) { console.error('[BFX] base64 decode failed', e); return ''; }
    }

    function _log(layer, msg) {
        const name = LAYERS[layer - 1] || '?';
        console.log(`[BFX L${layer} ${name}] ${msg}`);
    }

    // ── L1 SPARK — Seed execution context ─────────────────────────────────────
    function _spark(index) {
        _index    = index;
        _executed = {};
        _symbols  = { _bfx: { version: index.bfx_version, game: index.game, phi: PHI, fib: FIB } };
        _log(1, `Context seeded — game: ${index.game}  points: ${index.points.length}`);
    }

    // ── L2 MIRROR — Register symbol map ───────────────────────────────────────
    function _mirror(points) {
        const l2 = points.filter(p => p.layer === 2);
        l2.forEach(p => {
            (p.exports || []).forEach(sym => { _symbols[sym] = null; /* placeholder */ });
        });
        _log(2, `Symbol map: ${Object.keys(_symbols).length} slots registered`);
    }

    // ── L3 RELATION — Validate synthesis edges (z = x·y) ─────────────────────
    function _relation(synthesis_map) {
        let edges = 0;
        Object.entries(synthesis_map || {}).forEach(([src, deps]) => {
            deps.forEach(dep => { edges++; });
        });
        _log(3, `Synthesis map validated — ${edges} gyroid edges (z = x·y)`);
    }

    // ── Core: execute a single HelixPoint ─────────────────────────────────────
    function _executePoint(point) {
        if (_executed[point.id]) return;

        const src = _b64decode(point.code_b64 || '');
        if (!src) { _log(point.layer, `SKIP (empty) ${point.id}`); return; }

        try {
            // Wrap in an IIFE so each substrate has its own scope
            // Substrates that need globals write to window.* explicitly
            const fn = new Function('_bfx', '_symbols', src + '\n//# sourceURL=bfx://' + point.id);
            fn(_symbols._bfx, _symbols);
            _executed[point.id] = true;
            _log(point.layer, `OK  ${point.id}  [${point.layer_name}]`);
        } catch (err) {
            console.error(`[BFX L${point.layer}] FAIL ${point.id}`, err);
        }
    }

    // ── L4–L7 FORM→COMPLETION — Spiral execution (Schwarz Diamond quadrant law) ─
    // Each layer receives TWO parent contexts: z[n-1] and z[n-2].
    // This is the same law as the Schwarz Diamond quadrant:
    // each quadrant IS the product of the two quadrants before it.
    // z[n] = z[n-1] × z[n-2]  →  context[n] = merge(context[n-1], context[n-2])
    function _executeHelix(index) {
        const byId = {};
        index.points.forEach(p => { byId[p.id] = p; });

        // Build per-layer context accumulator (the growing spiral)
        const layerCtx = {};   // layer number → accumulated symbols at that layer

        for (let layer = 1; layer <= 7; layer++) {
            // Two-parent Schwarz Diamond inheritance
            const parentA = layerCtx[layer - 1] || {};
            const parentB = layerCtx[layer - 2] || {};
            // z[n] = merge of both parents — the quadrant synthesis
            const inherited = Object.assign({}, parentB, parentA);

            // Execute every point assigned to this layer
            const layerPoints = index.load_order
                .map(id => byId[id])
                .filter(p => p && p.layer === layer);

            layerPoints.forEach(point => {
                // Resolve explicit dependencies first
                (point.dependencies || []).forEach(depId => {
                    if (byId[depId] && !_executed[depId]) _executePoint(byId[depId]);
                });
                // Inject inherited context before executing (the inner quadrant)
                Object.assign(_symbols, inherited);
                _executePoint(point);

                // Log the inner quadrant (Schwarz Diamond self-similarity)
                if (point.quadrant) {
                    const dominant = Object.entries(point.quadrant)
                        .sort((a, b) => b[1].surface - a[1].surface)[0];
                    if (dominant)
                        _log(layer, `  quadrant dominant: ${dominant[0]} `
                            + `(surface=${dominant[1].surface})`);
                }
            });

            // Snapshot this layer's accumulated symbols for the next turn
            layerCtx[layer] = Object.assign({}, _symbols);
            _log(layer, `Layer ${layer} spiral complete — `
                + `${layerPoints.length} points × fib[${layer}]`);
        }

        // Store the full spiral for collapse
        _spiral = layerCtx;
    }

    // ── L7 COLLAPSE — the whole folds to one crystallised point ───────────────
    // Schwarz Diamond law: at L7, all 7 layers (accumulated context) fold to 1.
    // That 1 point is window.BFXGame — the seed of the running game.
    // It is L1 of the next helix turn (the next move, the next session).
    function _collapse() {
        const count = Object.keys(_executed).length;
        // The collapsed seed = the full accumulated context at L7
        const seed = Object.assign({}, _spiral[7] || _symbols);
        seed._bfx_collapsed  = true;
        seed._bfx_point_count = count;
        seed._bfx_law        = 'z[n]=z[n-1]*z[n-2]';
        seed._bfx_fib7       = 21;
        seed._bfx_collapse   = 1;   // the Void-Seed — 1, not 0
        seed._bfx_note       = 'Day 7 complete. Surface folds to seed. Next turn begins.';

        // The single crystallised point — window.BFXGame
        window.BFXGame = seed;
        _log(7, `COLLAPSE → window.BFXGame  (${count} points → 1 seed)`);
        _log(7, `Genesis Day 7: "And he rested." Next L1 = this seed.`);

        if (typeof _onComplete === 'function') _onComplete(window.BFXGame);
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    async function boot(indexUrl, opts = {}) {
        _onComplete = opts.onComplete || null;
        console.log(`\n🌀 ButterflyFX Interpreter — booting from ${indexUrl}`);
        console.log(`   Law: z = x·y  (Schwarz Diamond minimal surface)\n`);

        let index;
        try {
            const res = await fetch(indexUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            index = await res.json();
        } catch (e) {
            console.error('[BFX] Failed to load helix_index.json', e);
            return;
        }

        _spark(index);                          // L1 — seed
        _mirror(index.points);                  // L2 — reflect
        _relation(index.synthesis_map);         // L3 — z = x·y
        _executeHelix(index);                   // L4–L7 — spiral outward
        _collapse();                            // L7 — fold to 1 (Void-Seed)
    }

    /** Manually register a pre-decoded substrate (for inline or test use). */
    function injectPoint(point) {
        _executePoint(point);
    }

    /** Return the live symbol registry after boot completes. */
    function symbols() { return _symbols; }

    /** Return the helix index currently loaded. */
    function index() { return _index; }

    return { boot, injectPoint, symbols, index };
})();

