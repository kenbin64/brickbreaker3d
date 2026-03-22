/**
 * ═══════════════════════════════════════════════════════════════
 * OSI SCHWARZ DIAMOND — LAYER 0: THE VOID
 * Genesis: SILENCE — "Before the spark, stillness"
 * Dimension: VOID (−1D) — pre-existence, pure potential
 * ═══════════════════════════════════════════════════════════════
 *
 * The innermost Russian doll. The nothing inside the nothing.
 *
 * Before the Point (0D), before existence, before the manifold,
 * there is the Void. Not empty space — space doesn't exist yet.
 * Not darkness — light hasn't been conceived. The Void is the
 * precondition for existence itself. It is the canvas before
 * the first brushstroke, the silence before the first note.
 *
 * z = 0
 *
 * No x, no y, no surface. Just zero. But zero is not nothing —
 * zero is the number that makes all other numbers possible.
 * Without zero, there is no coordinate system. Without the Void,
 * there is no manifold.
 *
 * The Void contains no logic, no state, no behavior. It simply
 * IS the absence that allows presence. When L1 (Physical) calls
 * below(), it finds this — the still point at the center of the
 * Russian doll. The seed inside the seed.
 *
 * Dimensional ladder:
 *   L0 = Void  (−1D) ← YOU ARE HERE. The silence.
 *   L1 = Point (0D)  — the first spark from the void
 *   L2 = Line  (1D)  — the point moves through time
 *   L3 = Width (2D)  — the line spreads into a plane
 *   L4 = Volume(3D)  — the plane deepens with state
 *   L5 = Whole (4D)  — the volume persists through time
 *   L6 = Mind  (5D)  — the whole is perceived
 *   L7 = Full  (6D)  — the perceived gains purpose
 *
 * Copyright (c) 2024-2026 Kenneth Bingham
 * Licensed under CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const VoidSubstrate = Object.freeze({

    name:      'The Void',
    layer:     0,
    dimension: 'Void (−1D)',
    genesis:   'Silence',
    surface:   'z=0',

    // The Void's equation: nothing multiplied by nothing.
    // z = 0. Always. The zero surface.
    z: () => 0,

    // The Void is the innermost doll. There is nothing below.
    below: () => null,

    // The Void has no state. Asking it for anything returns emptiness.
    get:  () => undefined,
    has:  () => false,
    keys: () => [],

    // The Void absorbs everything and returns nothing.
    // Data that falls into the void disappears — that's what voids do.
    // But it existed for a moment, and that moment was enough to
    // prove that something CAN exist. That proof is L1.
    absorb: () => undefined,

    // The Void's stats: nothing, measured precisely.
    stats: () => ({
        layer: 0,
        dimension: 'Void (−1D)',
        surface: 'z=0',
        contents: 0,
        exists: true,    // The void exists — that's the paradox
        empty: true      // But it's empty — that's the truth
    }),

    // Self-documenting
    help: () => {
        console.log('\n  ○ THE VOID — Layer 0');
        console.log('  ○ Dimension: Void (−1D) — pre-existence');
        console.log('  ○ Surface: z = 0');
        console.log('  ○ The innermost Russian doll.');
        console.log('  ○ The silence before the spark.');
        console.log('  ○ The nothing that makes everything possible.\n');
    }
});

if (typeof window !== 'undefined') window.VoidSubstrate = VoidSubstrate;
if (typeof module !== 'undefined') module.exports = VoidSubstrate;

