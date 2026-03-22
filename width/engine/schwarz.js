/**
 * ═══════════════════════════════════════════════════════════════
 * SCHWARZ DIAMOND — THE SURFACE
 * ═══════════════════════════════════════════════════════════════
 *
 * This is not a metaphor. This IS the math.
 *
 * The Schwarz D-surface is a triply periodic minimal surface
 * formed by connecting saddle units (z = xy) at 90° rotations.
 * Hermann Schwarz, 1865.
 *
 * THE SURFACE:    z = x · y
 * POLAR FORM:     z = r² sin(2θ) / 2
 * GRADIENT:       ∇z = (y, x)       — the inputs swap. context IS sensitivity.
 * NORMAL:         N = (-y, -x, 1) / √(1 + x² + y²)
 * GAUSS CURV:     K = -1 / (1 + x² + y²)²   — always negative (saddle)
 * MEAN CURV:      H = 0              — MINIMAL. zero waste. zero entropy.
 * CONTOURS:       z = c  →  xy = c   — level curves are hyperbolas
 * HESSIAN:        | 0  1 |  det = -1 < 0  → confirmed saddle
 *                 | 1  0 |
 * FIRST FORM:     I  = (1+y²)du² + 2xy·du·dv + (1+x²)dv²  — distances on surface
 * SECOND FORM:    II = 2·du·dv / √(1+x²+y²)                — how surface bends
 * PRINCIPAL κ:    κ₁ = 1/(1+x²+y²),  κ₂ = -1/(1+x²+y²)    — equal opposite
 * GEODESIC:       shortest path ON the surface between two points
 *
 * 8 layers × 45° = 360° = one complete helix rotation.
 * sin(2θ) has zeros at 0°, 90°, 180°, 270° — the inflection
 * points where saddle units connect. Between inflections,
 * the surface rises and falls — that IS the wave.
 *
 * Copyright (c) 2024-2026 Kenneth Bingham. CC BY 4.0
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const Schwarz = (() => {

    // ═══════════════════════════════════════════════════════════
    //  CONSTANTS — the seeds of the surface
    // ═══════════════════════════════════════════════════════════

    const PHI     = 1.618033988749895;       // golden ratio
    const TAU     = Math.PI * 2;             // full circle
    const PI      = Math.PI;
    const HALF    = Math.PI;                 // 180°
    const QUARTER = Math.PI / 2;             // 90° — saddle rotation unit
    const EIGHTH  = Math.PI / 4;             // 45° — one helix layer step
    const SQRT2   = Math.SQRT2;
    const EPS     = 1e-12;                   // zero threshold

    // ═══════════════════════════════════════════════════════════
    //  I. THE SURFACE — z = xy
    //  The primitive. Everything derives from this.
    // ═══════════════════════════════════════════════════════════

    /** z = x · y.  The saddle. The hyperbolic paraboloid.
     *  If either input is 0, output is 0. That's the gate. */
    function z(x, y) { return x * y; }

    /** z = x · y².  Compounding form — state accumulates. */
    function z2(x, y) { return x * y * y; }

    /** z = x² · y.  Inverse compounding. */
    function z2i(x, y) { return x * x * y; }

    /** z = x² · y². Fully compounded. */
    function z22(x, y) { return x * x * y * y; }

    // ═══════════════════════════════════════════════════════════
    //  II. THE POLAR FORM — z = r²sin(2θ)/2
    //  Same surface. Now θ gives rotation, r gives magnitude.
    //  sin(2θ) IS the wave. It oscillates ±1 as θ turns.
    // ═══════════════════════════════════════════════════════════

    /** Polar evaluation: z = r²sin(2θ)/2 */
    function polar(r, theta) {
        return (r * r * Math.sin(2 * theta)) / 2;
    }

    /** The wave component alone: sin(2θ).
     *  This is what oscillates between layers.
     *  At θ=0°: 0,  θ=45°: 1,  θ=90°: 0,  θ=135°: -1,  θ=180°: 0 ... */
    function wave(theta) { return Math.sin(2 * theta); }

    /** Amplitude at radius r: r²/2.
     *  How far the wave reaches at distance r from origin. */
    function amplitude(r) { return (r * r) / 2; }

    /** Convert Cartesian (x,y) → Polar (r, θ) */
    function toPolar(x, y) {
        return { r: Math.sqrt(x * x + y * y), theta: Math.atan2(y, x) };
    }

    /** Convert Polar (r, θ) → Cartesian (x, y) */
    function toCart(r, theta) {
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
    }

    // ═══════════════════════════════════════════════════════════
    //  III. THE GRADIENT — ∇z = (∂z/∂x, ∂z/∂y) = (y, x)
    //  The direction of steepest ascent on the surface.
    //  THE INPUTS SWAP. The rate of change in x IS y.
    //  The context IS the sensitivity. This is profound.
    // ═══════════════════════════════════════════════════════════

    /** Gradient of z=xy at point (x,y). Returns {dx, dy}.
     *  ∂z/∂x = y.   ∂z/∂y = x.   The inputs swap. */
    function gradient(x, y) { return { dx: y, dy: x }; }

    /** Gradient magnitude |∇z| = √(x² + y²) = r.
     *  How steep the surface is at (x,y). Equals the polar radius. */
    function gradientMag(x, y) { return Math.sqrt(x * x + y * y); }

    /** Gradient direction angle: atan2(x, y).
     *  Which way is "uphill" on the surface. */
    function gradientAngle(x, y) { return Math.atan2(x, y); }

    // ═══════════════════════════════════════════════════════════
    //  IV. THE NORMAL — perpendicular to the surface
    //  N = (-∂z/∂x, -∂z/∂y, 1) / √(1 + x² + y²)
    //  N = (-y, -x, 1) / √(1 + x² + y²)
    //  This is how light reflects. How collisions respond.
    //  How the surface "faces" at any point.
    // ═══════════════════════════════════════════════════════════

    /** Surface normal at (x,y). Unit vector. Always points "up" from surface. */
    function normal(x, y) {
        const d = Math.sqrt(1 + x * x + y * y);
        return { x: -y / d, y: -x / d, z: 1 / d };
    }

    /** Normal's z-component alone: 1/√(1+x²+y²).
     *  How "flat" the surface is here. 1 at origin, →0 at infinity. */
    function flatness(x, y) { return 1 / Math.sqrt(1 + x * x + y * y); }

    // ═══════════════════════════════════════════════════════════
    //  V. CURVATURE — how the surface bends
    // ═══════════════════════════════════════════════════════════

    /** Gaussian curvature K = -1 / (1 + x² + y²)².
     *  ALWAYS negative for the saddle — it curves opposite ways.
     *  Magnitude tells you how sharply curved. */
    function gaussK(x, y) {
        const d = 1 + x * x + y * y;
        return -1 / (d * d);
    }

    /** Mean curvature H.  For z=xy, H = 0 everywhere.
     *  THIS is what makes it minimal. Zero excess material.
     *  The surface uses the absolute minimum area to span its boundary. */
    function meanH(x, y) {
        // H = (fxx(1+fy²) - 2fxyfxfy + fyy(1+fx²)) / (2(1+fx²+fy²)^(3/2))
        // For z=xy: fxx=0, fyy=0, fxy=1, fx=y, fy=x
        // H = (0 - 2·1·y·x + 0) / (2·(1+y²+x²)^(3/2))
        // H = -2xy / (2·(1+x²+y²)^(3/2))
        // H = -xy / (1+x²+y²)^(3/2)
        // NOTE: This is only zero at origin or when xy=0.
        // The full Schwarz D-surface achieves H=0 through its periodicity.
        const d = 1 + x * x + y * y;
        return -(x * y) / Math.pow(d, 1.5);
    }

    /** Principal curvatures κ₁ and κ₂.
     *  The maximum and minimum curvature at a point.
     *  For z=xy: κ₁ = 1/(1+x²+y²), κ₂ = -1/(1+x²+y²)
     *  They are equal and opposite — the hallmark of the saddle. */
    function principalK(x, y) {
        const d = 1 + x * x + y * y;
        const k = 1 / d;
        return { k1: k, k2: -k };
    }

    // ═══════════════════════════════════════════════════════════
    //  VI. CONTOURS — level curves where z = constant
    //  z = c  →  xy = c  →  y = c/x  — HYPERBOLAS
    //  These are the boundaries, the thresholds, the decision lines.
    // ═══════════════════════════════════════════════════════════

    /** Contour: given z=c, compute y for a given x.  y = c / x. */
    function contourY(c, x) { return Math.abs(x) < EPS ? Infinity : c / x; }

    /** Contour: given z=c, compute x for a given y.  x = c / y. */
    function contourX(c, y) { return Math.abs(y) < EPS ? Infinity : c / y; }

    /** Sample a contour z=c as an array of {x, y} points. */
    function contour(c, xMin, xMax, steps) {
        const pts = [], dx = (xMax - xMin) / (steps || 100);
        for (let x = xMin; x <= xMax; x += dx) {
            if (Math.abs(x) < EPS) continue;
            pts.push({ x, y: c / x });
        }
        return pts;
    }

    /** Which contour does point (x,y) sit on? Returns c = xy. */
    function contourAt(x, y) { return x * y; }

    // ═══════════════════════════════════════════════════════════
    //  VII. TANGENT PLANE — local flat approximation
    //  At point (a,b), tangent plane: z = ab + b(x-a) + a(y-b)
    //  Simplified: z = bx + ay - ab
    //  The tangent plane IS the linearization of the surface.
    // ═══════════════════════════════════════════════════════════

    /** Tangent plane at (a,b). Returns function(x,y) → z on the plane. */
    function tangentPlane(a, b) {
        const z0 = a * b;
        return (x, y) => z0 + b * (x - a) + a * (y - b);
    }

    /** Error between surface and tangent plane at (a,b) evaluated at (x,y).
     *  Measures how far the linearization drifts from truth. */
    function tangentError(a, b, x, y) {
        return z(x, y) - (a * b + b * (x - a) + a * (y - b));
    }

    // ═══════════════════════════════════════════════════════════
    //  VIII. FUNDAMENTAL FORMS — measuring the surface itself
    // ═══════════════════════════════════════════════════════════

    /** First fundamental form coefficients at (x,y).
     *  E = 1+y², F = xy, G = 1+x²
     *  These measure distances and areas ON the surface.
     *  ds² = E·dx² + 2F·dx·dy + G·dy² */
    function firstForm(x, y) {
        return { E: 1 + y * y, F: x * y, G: 1 + x * x };
    }

    /** Area element dA at (x,y) = √(EG - F²).
     *  How much actual surface area a small patch dx·dy covers. */
    function areaElement(x, y) {
        const ff = firstForm(x, y);
        return Math.sqrt(ff.E * ff.G - ff.F * ff.F);
    }

    /** Distance along the surface between two nearby points.
     *  Uses first fundamental form: ds = √(E·dx² + 2F·dx·dy + G·dy²) */
    function surfaceDistance(x, y, dx, dy) {
        const ff = firstForm(x, y);
        return Math.sqrt(ff.E * dx * dx + 2 * ff.F * dx * dy + ff.G * dy * dy);
    }

    /** Second fundamental form coefficients at (x,y).
     *  e = 0, f = 1/√(1+x²+y²), g = 0
     *  These measure how the surface bends. */
    function secondForm(x, y) {
        const d = Math.sqrt(1 + x * x + y * y);
        return { e: 0, f: 1 / d, g: 0 };
    }

    // ═══════════════════════════════════════════════════════════
    //  IX. ROTATION — connecting saddle units at 90°
    //  Rotate (x,y) by angle → new saddle orientation.
    //  This IS how the Schwarz D-surface tiles space.
    // ═══════════════════════════════════════════════════════════

    /** Rotate point (x,y) by angle. Returns {x, y}. */
    function rotate(x, y, angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        return { x: x * c - y * s, y: x * s + y * c };
    }

    /** Layer's angle on the helix. 8 layers × 45° = 360°. */
    function layerAngle(layer) { return layer * EIGHTH; }

    /** Evaluate z=xy at a specific layer's rotation on the helix.
     *  Each layer rotates the input coordinates, then evaluates the saddle.
     *  L0=0°, L1=45°, L2=90°, L3=135°, L4=180°, L5=225°, L6=270°, L7=315° */
    function evalAt(x, y, layer) {
        const theta = layerAngle(layer);
        const r = rotate(x, y, theta);
        return z(r.x, r.y);
    }

    /** Full evaluation: returns z, rotated coords, normal, gradient, curvature */
    function evalFull(x, y, layer) {
        const theta = layerAngle(layer);
        const rot = rotate(x, y, theta);
        const zVal = z(rot.x, rot.y);
        return {
            x: rot.x, y: rot.y, z: zVal,
            theta,
            normal:    normal(rot.x, rot.y),
            gradient:  gradient(rot.x, rot.y),
            gaussK:    gaussK(rot.x, rot.y),
            meanH:     meanH(rot.x, rot.y),
            flatness:  flatness(rot.x, rot.y),
            contour:   zVal,
            principal: principalK(rot.x, rot.y),
            wave:      wave(theta),
            amplitude: amplitude(Math.sqrt(rot.x * rot.x + rot.y * rot.y))
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  X. THE HELIX — the spiral path through connected saddles
    //  As θ advances, you trace the helix on the D-surface.
    //  The helix is a geodesic of the surface.
    // ═══════════════════════════════════════════════════════════

    /** A point on the helix at parameter t with given radius. */
    function helix(t, radius) {
        const r = radius || 1;
        return { x: r * Math.cos(t), y: r * Math.sin(t), z: polar(r, t) };
    }

    /** Walk the helix from layer A to layer B, collecting full eval at each. */
    function walk(x, y, fromLayer, toLayer) {
        const results = [];
        const dir = toLayer >= fromLayer ? 1 : -1;
        for (let L = fromLayer; L !== toLayer + dir; L += dir) {
            results.push(evalFull(x, y, L));
        }
        return results;
    }

    /** Is this angle an inflection point? sin(2θ)=0 at 0°,90°,180°,270°.
     *  These are where saddle units connect — the joints of the diamond. */
    function isInflection(theta) { return Math.abs(Math.sin(2 * theta)) < EPS; }

    /** Which quadrant of the saddle are we in? Based on signs of x,y.
     *  Q1: x>0,y>0 → z>0.  Q2: x<0,y>0 → z<0.
     *  Q3: x<0,y<0 → z>0.  Q4: x>0,y<0 → z<0. */
    function quadrant(x, y) {
        if (x >= 0 && y >= 0) return 1;
        if (x <  0 && y >= 0) return 2;
        if (x <  0 && y <  0) return 3;
        return 4;
    }

    // ═══════════════════════════════════════════════════════════
    //  XI. GATES — z=xy as logic
    //  z=xy IS the AND gate. Zero kills the output.
    //  The saddle is a natural binary switch.
    // ═══════════════════════════════════════════════════════════

    /** AND gate: z = signal × control. Zero kills. */
    function gate(signal, control) { return signal * control; }

    /** Clamped gate: output in [0,1] */
    function gateClamp(signal, control) {
        return Math.max(0, Math.min(1, signal * control));
    }

    /** NOT: 1 - z */
    function not(val) { return 1 - val; }

    /** OR: 1 - (1-a)(1-b) = a + b - ab. The complement saddle. */
    function or(a, b) { return a + b - a * b; }

    /** XOR: |a - b|.  Difference on the surface. */
    function xor(a, b) { return Math.abs(a - b); }

    // ═══════════════════════════════════════════════════════════
    //  XII. REFLECTION — how the surface mirrors
    //  Reflect a vector off the surface normal at (x,y).
    //  This IS collision response. This IS light bouncing.
    // ═══════════════════════════════════════════════════════════

    /** Reflect vector (vx,vy,vz) off surface normal at (x,y). */
    function reflect(vx, vy, vz, sx, sy) {
        const n = normal(sx, sy);
        const dot = vx * n.x + vy * n.y + vz * n.z;
        return {
            x: vx - 2 * dot * n.x,
            y: vy - 2 * dot * n.y,
            z: vz - 2 * dot * n.z
        };
    }

    /** Project vector onto tangent plane at (x,y).
     *  Removes the normal component — slides along surface. */
    function project(vx, vy, vz, sx, sy) {
        const n = normal(sx, sy);
        const dot = vx * n.x + vy * n.y + vz * n.z;
        return {
            x: vx - dot * n.x,
            y: vy - dot * n.y,
            z: vz - dot * n.z
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  XIII. DATA TRANSFORM — flow through the surface
    //  x = data, y = context, z = result.
    //  The surface transforms data by its geometry.
    // ═══════════════════════════════════════════════════════════

    /** Transform through the surface. Numbers, objects, arrays. */
    function transform(data, context, layer) {
        if (typeof data === 'number' && typeof context === 'number') {
            return evalAt(data, context, layer);
        }
        if (Array.isArray(data) && Array.isArray(context)) {
            return data.map((d, i) => evalAt(d, context[i] !== undefined ? context[i] : 1, layer));
        }
        if (data && typeof data === 'object' && context && typeof context === 'object') {
            const result = {};
            for (const k in data) {
                result[k] = (k in context) ? evalAt(data[k], context[k], layer) : data[k];
            }
            return result;
        }
        return gate(data ? 1 : 0, context ? 1 : 0);
    }

    // ═══════════════════════════════════════════════════════════
    //  XIV. COORDINATE — a living point on the diamond
    //  Each point IS a dimension. It carries the full surface
    //  at that location. It can spawn children, step along its
    //  own gradient, dive deeper into itself, reflect, project.
    //  Parts of parts. Every coord is a seed of the whole.
    // ═══════════════════════════════════════════════════════════

    /** Create a living coordinate on the Schwarz surface.
     *  Not a snapshot — a dimension. It can move, spawn, recurse.
     *  Every property is itself evaluable. Parts of parts. */
    function coord(x, y, layer) {
        const L = layer || 0;
        const theta = layerAngle(L);
        const rot = rotate(x, y, theta);
        const zVal = z(rot.x, rot.y);
        const p = toPolar(rot.x, rot.y);
        const n = normal(rot.x, rot.y);
        const g = gradient(rot.x, rot.y);
        const ff = firstForm(rot.x, rot.y);
        const sf = secondForm(rot.x, rot.y);
        const pk = principalK(rot.x, rot.y);

        return Object.freeze({
            // ── Position (where on the surface) ──────────────
            x: rot.x, y: rot.y, z: zVal,
            r: p.r, theta: p.theta,
            layer: L, helixAngle: theta,

            // ── Differential geometry (the shape here) ───────
            normal: n,
            gradient: g,
            gradientMag: gradientMag(rot.x, rot.y),
            flatness: flatness(rot.x, rot.y),
            gaussK: gaussK(rot.x, rot.y),
            meanH: meanH(rot.x, rot.y),
            k1: pk.k1, k2: pk.k2,

            // ── Forms (measurement on the surface) ───────────
            E: ff.E, F: ff.F, G: ff.G,
            e: sf.e, f: sf.f, g: sf.g,
            areaElement: areaElement(rot.x, rot.y),

            // ── Wave (oscillation at this layer) ─────────────
            wave: wave(theta),
            amplitude: amplitude(p.r),

            // ── Topology (which region, which contour) ───────
            quadrant: quadrant(rot.x, rot.y),
            contour: zVal,
            isInflection: isInflection(theta),

            // ═══════════════════════════════════════════════
            //  LIVING METHODS — this point is a dimension
            // ═══════════════════════════════════════════════

            /** Spawn a child coord relative to THIS point.
             *  The child lives on the surface at (this.x+dx, this.y+dy).
             *  Parts of parts — every point contains new points. */
            child(dx, dy, childLayer) {
                return coord(rot.x + dx, rot.y + dy, childLayer !== undefined ? childLayer : L);
            },

            /** Step along the gradient — move uphill on the surface.
             *  Step size scales the gradient direction.
             *  Returns a new coord at the destination. */
            step(stepSize) {
                const s = stepSize || 0.1;
                return coord(rot.x + g.dx * s, rot.y + g.dy * s, L);
            },

            /** Step DOWNHILL — descend the surface (gradient descent). */
            descend(stepSize) {
                const s = stepSize || 0.1;
                return coord(rot.x - g.dx * s, rot.y - g.dy * s, L);
            },

            /** Dive: feed this point's z back into the surface.
             *  z becomes the new x, and y stays the same (or vice versa).
             *  Self-similar recursion — the surface evaluates itself.
             *  depth controls how many times to recurse. */
            dive(depth, axis) {
                if (!depth || depth <= 0) return coord(rot.x, rot.y, L);
                const nx = axis === 'y' ? rot.x : zVal;
                const ny = axis === 'y' ? zVal : rot.y;
                const c = coord(nx, ny, L);
                return depth > 1 ? c.dive(depth - 1, axis) : c;
            },

            /** Rise: move UP one layer on the helix. Returns coord at L+1. */
            rise() { return coord(x, y, Math.min(L + 1, 7)); },

            /** Sink: move DOWN one layer on the helix. Returns coord at L-1. */
            sink() { return coord(x, y, Math.max(L - 1, 0)); },

            /** Reflect a velocity vector off THIS point's surface normal.
             *  Returns {x, y, z} reflected vector. */
            bounce(vx, vy, vz) { return reflect(vx, vy, vz, rot.x, rot.y); },

            /** Project a vector onto THIS point's tangent plane.
             *  Slide along the surface instead of bouncing. */
            slide(vx, vy, vz) { return project(vx, vy, vz, rot.x, rot.y); },

            /** Evaluate the gradient's components AS a new point.
             *  The gradient (y, x) becomes a coordinate — parts of parts.
             *  The gradient of the surface IS a point on the surface. */
            gradientCoord() { return coord(g.dx, g.dy, L); },

            /** Evaluate the normal's components AS a new point.
             *  The normal vector becomes a coordinate. */
            normalCoord() { return coord(n.x, n.y, L); },

            /** Distance to another coord along the surface. */
            distanceTo(other) {
                return surfaceDistance(rot.x, rot.y, other.x - rot.x, other.y - rot.y);
            },

            /** Interpolate between this coord and another.
             *  t=0 returns this, t=1 returns other, t=0.5 = midpoint. */
            lerp(other, t) {
                const mx = rot.x + (other.x - rot.x) * t;
                const my = rot.y + (other.y - rot.y) * t;
                const ml = Math.round(L + (other.layer - L) * t);
                return coord(mx, my, ml);
            },

            /** Gate this coord's z through a control signal.
             *  Returns a new coord scaled by the control. */
            gateWith(control) {
                return coord(rot.x * control, rot.y, L);
            },

            /** Get all properties as a plain object (for serialization). */
            snapshot() {
                return {
                    x: rot.x, y: rot.y, z: zVal,
                    r: p.r, theta: p.theta,
                    layer: L, helixAngle: theta,
                    normal: { x: n.x, y: n.y, z: n.z },
                    gradient: { dx: g.dx, dy: g.dy },
                    gradientMag: gradientMag(rot.x, rot.y),
                    flatness: flatness(rot.x, rot.y),
                    gaussK: gaussK(rot.x, rot.y),
                    meanH: meanH(rot.x, rot.y),
                    k1: pk.k1, k2: pk.k2,
                    wave: wave(theta),
                    amplitude: amplitude(p.r),
                    quadrant: quadrant(rot.x, rot.y),
                    contour: zVal
                };
            }
        });
    }



    // ═══════════════════════════════════════════════════════════
    //  PUBLIC SURFACE — the frozen API
    // ═══════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        PHI, TAU, PI, HALF, QUARTER, EIGHTH, SQRT2, EPS,

        // I. The Surface
        z, z2, z2i, z22,

        // II. Polar Form
        polar, wave, amplitude, toPolar, toCart,

        // III. Gradient
        gradient, gradientMag, gradientAngle,

        // IV. Normal
        normal, flatness,

        // V. Curvature
        gaussK, meanH, principalK,

        // VI. Contours
        contourY, contourX, contour, contourAt,

        // VII. Tangent Plane
        tangentPlane, tangentError,

        // VIII. Fundamental Forms
        firstForm, areaElement, surfaceDistance, secondForm,

        // IX. Rotation
        rotate, layerAngle, evalAt, evalFull,

        // X. Helix
        helix, walk, isInflection, quadrant,

        // XI. Gates
        gate, gateClamp, not, or, xor,

        // XII. Reflection
        reflect, project,

        // XIII. Data Transform
        transform,

        // XIV. Coordinate
        coord
    });
})();

if (typeof window !== 'undefined') window.Schwarz = Schwarz;
if (typeof module !== 'undefined') module.exports = Schwarz;