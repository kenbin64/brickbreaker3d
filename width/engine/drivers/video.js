/**
 * ===============================================================
 * SCHWARZ VIDEO ENGINE - VISUAL DIMENSION
 * ===============================================================
 *
 * A wave is a wave is a wave. Light and sound are the same
 * geometry at different scales. Wavelength and frequency are
 * the true coordinates. RGB is a lossy projection - the
 * screen's problem, not ours.
 *
 * 12 Sections - all derived from z = xy:
 *   I.    Wave        - the helical pipeline (NOT oscillation)
 *   II.   Spectrum    - collections of waves (light, sound, any)
 *   III.  Pixel       - the render output (spectrum to screen)
 *   IV.   Light       - illumination from normals and gradients
 *   V.    Shader      - surface evaluation = pixel shading
 *   VI.   Geometry    - vertex, edge, face, volume
 *   VII.  Material    - surface properties as curvature
 *   VIII. Camera      - lens, projection, aperture, exposure
 *   IX.   Screen      - viewport, resolution, aspect, display
 *   X.    Motion      - camera movements (pan, zoom, orbit)
 *   XI.   Input       - mouse, touch, gamepad to transforms
 *   XII.  Pipeline    - the complete render flow
 *
 * Copyright (c) 2024-2026 Kenneth Bingham. CC BY 4.0
 * ===============================================================
 */

'use strict';

const SchwarzVideo = ((S) => {

    const TAU = S.TAU, PI = S.PI, PHI = S.PHI, EPS = S.EPS;
    const C_LIGHT = 299792458;
    const C_SOUND = 343;

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function dot3(a, b) { return a.x * b.x + a.y * b.y + (a.z || 0) * (b.z || 0); }
    function normalize3(x, y, z) {
        const l = Math.sqrt(x * x + y * y + z * z) || 1;
        return { x: x / l, y: y / l, z: z / l };
    }

    // ===============================================================
    //  I. WAVE — the helical pipeline
    //
    //  A wave is NOT an oscillation. That is the 2D shadow.
    //  A wave IS a helix — like a pulled slinky. Signal flows
    //  THROUGH the helix continuously. No peaks, no valleys.
    //  Just continuous rotation advancing forward.
    //
    //  sin and cos are not "up and down" — they are the X and Y
    //  projections of circular motion moving along an axis.
    //  What we draw on paper is the shadow of the real thing.
    //
    //  pitch     = coil spacing = wavelength (meters)
    //  radius    = coil width   = amplitude
    //  flow rate = speed through the pipe = frequency
    //  position  = where you are on the helix = S.helix(t)
    //
    //  Light: pitch 380–780nm, flow speed = c (299792458 m/s)
    //  Sound: pitch ~17mm–17m, flow speed = 343 m/s
    //  Same helix. Different pipe diameter and flow speed.
    // ===============================================================

    /** Create a wave — a helical pipeline on the Schwarz surface.
     *  pitch: coil spacing in meters (wavelength).
     *  radius: coil width (amplitude).
     *  entry: where signal enters the helix (phase in radians).
     *  medium: 'light' or 'sound' — sets flow speed. */
    function wave(pitch, radius, entry, medium) {
        const p   = pitch;
        const r   = radius !== undefined ? radius : 1;
        const ent = entry || 0;
        const spd = medium === 'sound' ? C_SOUND : C_LIGHT;
        const flowRate = spd / p;                           // Hz — coils per second
        // Position on the Schwarz helix: the REAL 3D path
        const h = S.helix(ent, r);                          // {x, y, z} on the helix
        const c = S.coord(h.x, h.y, 0);                    // living coord at this point

        return Object.freeze({
            pitch: p, radius: r, entry: ent,
            flowRate,                                       // coils traversed per second
            medium: medium || 'light', speed: spd,

            // The actual 3D position on the helix (NOT the shadow)
            x: h.x, y: h.y, z: h.z,

            // The 2D shadows (what textbooks incorrectly call "the wave")
            shadowX: h.x,                                  // cos projection
            shadowY: h.y,                                  // sin projection

            // Surface properties at this helix point
            normal: c.normal, gradient: c.gradient,
            flatness: c.flatness,

            /** Advance signal through the pipe by parameter t.
             *  Returns the 3D helix position — NOT a scalar. */
            flow(t) {
                const pos = S.helix(ent + TAU * flowRate * t, r);
                return { x: pos.x, y: pos.y, z: pos.z };
            },

            /** Sample the 2D shadow at time t (what old math calls "the value").
             *  This is the PROJECTION, not the reality. */
            shadow(t) { return r * S.wave(ent + TAU * flowRate * t); },

            /** Combine two helical pipes — interference.
             *  Two helices combine into a resultant helix. */
            combine(other) {
                // Phasor addition in the PLANE of the helix cross-section
                const dx = r * Math.cos(ent) + other.radius * Math.cos(other.entry);
                const dy = r * Math.sin(ent) + other.radius * Math.sin(other.entry);
                const newR = Math.sqrt(dx * dx + dy * dy);
                const newEnt = Math.atan2(dy, dx);
                const total = r + other.radius;
                const newP = (p * r + other.pitch * other.radius) / (total || 1);
                return wave(newP, newR, newEnt, medium);
            },

            /** Gate: z=xy. Squeeze the pipe radius by control [0,1]. */
            gate(control) { return wave(p, S.z(r, clamp01(control)), ent, medium); },

            /** Change coil spacing (Doppler, pitch shift). */
            recoil(factor) { return wave(p * factor, r, ent, medium); },

            /** Squeeze radius (attenuation, volume). */
            squeeze(factor) { return wave(p, r * factor, ent, medium); },

            /** Rotate entry point (phase shift). */
            rotate(delta) { return wave(p, r, ent + delta, medium); },

            /** Is this helix in the visible light band? */
            isVisible() { return p >= 380e-9 && p <= 780e-9; },

            /** Is this helix in the audible sound band? */
            isAudible() { return medium === 'sound' && flowRate >= 20 && flowRate <= 20000; },

            /** Map to helix layer (0-7) based on pitch band. */
            toLayer() {
                if (medium === 'sound') return Math.round(clamp((flowRate - 20) / 2497.5, 0, 7));
                return Math.round(clamp((p - 380e-9) / (400e-9 / 7), 0, 7));
            },

            snapshot() { return { pitch: p, radius: r, entry: ent, flowRate, medium: medium || 'light', x: h.x, y: h.y, z: h.z }; }
        });
    }

    /** Light wave from nanometers. */
    function lightWave(nm, radius, entry) { return wave(nm * 1e-9, radius, entry, 'light'); }

    /** Sound wave from Hz. */
    function soundWave(hz, radius, entry) { return wave(C_SOUND / hz, radius, entry, 'sound'); }

    // ===============================================================
    //  II. SPECTRUM — collections of helical pipelines
    //
    //  A single helix is a pure tone / monochromatic ray.
    //  Real light and real sound are BUNDLES of helices —
    //  many coils of different pitch and radius flowing together.
    //  The spectrum IS a spectral power distribution (SPD).
    //  No RGB. No named colors. Just helices and their radii.
    // ===============================================================

    /** Create a spectrum — a bundle of helical pipelines. */
    function spectrum(waves) {
        const w = waves ? waves.slice() : [];

        return Object.freeze({
            waves: w,
            count: w.length,

            /** Add a helix to the bundle. */
            add(wv) { return spectrum(w.concat(wv)); },

            /** Remove helices outside a pitch band. */
            bandpass(minPitch, maxPitch) {
                return spectrum(w.filter(h => h.pitch >= minPitch && h.pitch <= maxPitch));
            },

            /** Only visible light helices (380-780nm). */
            visible() { return spectrum(w.filter(h => h.isVisible())); },

            /** Only audible sound helices (20-20kHz). */
            audible() { return spectrum(w.filter(h => h.isAudible())); },

            /** Gate entire bundle: z=xy squeeze all radii by control. */
            gate(control) { return spectrum(w.map(h => h.gate(control))); },

            /** Attenuate entire bundle. */
            squeeze(factor) { return spectrum(w.map(h => h.squeeze(factor))); },

            /** Combine with another spectrum (superposition). */
            merge(other) { return spectrum(w.concat(other.waves)); },

            /** Total power — sum of radius² (energy proportional to amplitude²). */
            power() { return w.reduce((sum, h) => sum + h.radius * h.radius, 0); },

            /** Dominant pitch — weighted average by radius². */
            dominant() {
                const totalPow = w.reduce((s, h) => s + h.radius * h.radius, 0);
                if (totalPow < EPS) return 0;
                return w.reduce((s, h) => s + h.pitch * h.radius * h.radius, 0) / totalPow;
            },

            /** Flow the entire bundle forward by time t. Returns array of {x,y,z}. */
            flow(t) { return w.map(h => h.flow(t)); },

            /** Sample all 2D shadows at time t. */
            shadows(t) { return w.map(h => h.shadow(t)); },

            /** Map each helix to its layer (0-7). Returns array of layer indices. */
            toLayers() { return w.map(h => h.toLayer()); },

            snapshot() { return w.map(h => h.snapshot()); }
        });
    }

    /** White light — equal-power helices across visible band. */
    function whiteLight(steps, radius) {
        const n = steps || 8;
        const r = radius !== undefined ? radius : 1;
        const waves = [];
        for (let i = 0; i < n; i++) {
            const pitch = (380e-9 + (400e-9 * i) / (n - 1));
            waves.push(wave(pitch, r, 0, 'light'));
        }
        return spectrum(waves);
    }

    // ===============================================================
    //  III. PIXEL — the lossy projection from spectrum to screen
    //
    //  The pixel is where the 3D helical reality gets FLATTENED
    //  into hardware-compatible RGB. This is the LAST step.
    //  Internally everything stays spectral until this moment.
    //
    //  CIE 1931 color matching: wavelength → XYZ → sRGB.
    //  The pixel is a living coord: it has position, depth,
    //  normal, gradient — everything a surface point has.
    // ===============================================================

    /** Approximate CIE 1931 color matching for a single wavelength.
     *  pitch in meters → {x, y, z} tristimulus (NOT sRGB yet). */
    function cieMatch(pitch) {
        const nm = pitch * 1e9;   // meters → nanometers
        if (nm < 380 || nm > 780) return { x: 0, y: 0, z: 0 };
        // Gaussian approximation of CIE x̄, ȳ, z̄
        const t1 = (nm - 442.0) * ((nm < 442.0) ? 0.0624 : 0.0374);
        const t2 = (nm - 599.8) * ((nm < 599.8) ? 0.0264 : 0.0323);
        const t3 = (nm - 474.0) * ((nm < 474.0) ? 0.0845 : 0.0322);
        const t4 = (nm - 530.0) * ((nm < 530.0) ? 0.0490 : 0.0382);
        const t5 = (nm - 568.8) * ((nm < 568.8) ? 0.0213 : 0.0247);
        const xb = 0.362 * Math.exp(-0.5*t1*t1) + 1.056 * Math.exp(-0.5*t2*t2) - 0.065 * Math.exp(-0.5*t3*t3);
        const yb = 0.821 * Math.exp(-0.5*t4*t4) + 0.286 * Math.exp(-0.5*t5*t5);
        const t6 = (nm - 437.0) * ((nm < 437.0) ? 0.0845 : 0.0278);
        const t7 = (nm - 459.0) * ((nm < 459.0) ? 0.0385 : 0.0725);
        const zb = 1.217 * Math.exp(-0.5*t6*t6) + 0.681 * Math.exp(-0.5*t7*t7);
        return { x: xb, y: yb, z: zb };
    }

    /** XYZ → linear sRGB (D65 illuminant). */
    function xyzToLinearRGB(X, Y, Z) {
        return {
            r:  3.2406 * X - 1.5372 * Y - 0.4986 * Z,
            g: -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
            b:  0.0557 * X - 0.2040 * Y + 1.0570 * Z
        };
    }

    /** Linear → sRGB gamma (the final hardware curve). */
    function srgbGamma(c) {
        return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }

    /** Create a pixel — the final lossy projection of a spectrum onto a screen.
     *  sp: a spectrum object.  px, py: screen position.  depth: z-buffer value. */
    function pixel(sp, px, py, depth) {
        // Integrate spectrum → XYZ tristimulus
        let X = 0, Y = 0, Z = 0;
        const w = sp.waves;
        for (let i = 0; i < w.length; i++) {
            const cie = cieMatch(w[i].pitch);
            const power = w[i].radius * w[i].radius;  // energy ∝ amplitude²
            X += cie.x * power;
            Y += cie.y * power;
            Z += cie.z * power;
        }
        // XYZ → linear RGB → gamma-corrected sRGB → [0,255]
        const lin = xyzToLinearRGB(X, Y, Z);
        const R = clamp01(srgbGamma(lin.r));
        const G = clamp01(srgbGamma(lin.g));
        const B = clamp01(srgbGamma(lin.b));

        // The pixel IS a coordinate on the Schwarz surface
        const c = S.coord(px || 0, py || 0, 0);

        return Object.freeze({
            // Spectral truth (the REAL data — preserved)
            spectrum: sp,

            // Lossy projection (hardware shadow)
            r: R, g: G, b: B, a: 1,
            r8: (R * 255 + 0.5) | 0,
            g8: (G * 255 + 0.5) | 0,
            b8: (B * 255 + 0.5) | 0,

            // Position
            px: px || 0, py: py || 0, depth: depth || 0,

            // Surface properties at this pixel location
            normal: c.normal, gradient: c.gradient,

            /** Blend with another pixel (z=xy gate on spectra). */
            blend(other, t) {
                const mixed = sp.squeeze(1 - t).merge(other.spectrum.squeeze(t));
                return pixel(mixed, lerp(px || 0, other.px, t), lerp(py || 0, other.py, t), lerp(depth || 0, other.depth, t));
            },

            /** To CSS color string. */
            toCSS() { return `rgb(${(R*255+0.5)|0},${(G*255+0.5)|0},${(B*255+0.5)|0})`; },

            /** To 32-bit packed integer (ABGR for little-endian). */
            toUint32() { return (255 << 24) | (((B*255+0.5)|0) << 16) | (((G*255+0.5)|0) << 8) | ((R*255+0.5)|0); },

            snapshot() { return { r: R, g: G, b: B, px: px||0, py: py||0, depth: depth||0, spectralPower: sp.power() }; }
        });
    }

    // ===============================================================
    //  IV. LIGHT — illumination as helical flow through surfaces
    //
    //  A light source emits a spectrum (bundle of helices).
    //  Illumination = how those helices interact with surface
    //  normals and gradients — the geometry decides the brightness.
    //  Point, directional, spot, area — all the same math,
    //  different source geometries.
    // ===============================================================

    /** Create a light source.
     *  type: 'point'|'directional'|'spot'|'area'
     *  pos: {x,y,z}, dir: {x,y,z} (normalized), sp: spectrum */
    function light(type, pos, dir, sp, opts) {
        const o = opts || {};
        const intensity = o.intensity !== undefined ? o.intensity : 1;
        const range = o.range || Infinity;
        const angle = o.angle || PI;          // spot cone half-angle
        const falloff = o.falloff || 2;       // inverse-square by default

        return Object.freeze({
            type, pos, dir, spectrum: sp, intensity, range, angle, falloff,

            /** Illuminate a surface point. Returns attenuated spectrum.
             *  surfPos: {x,y,z}, surfNormal: {x,y,z} */
            illuminate(surfPos, surfNormal) {
                let L;
                if (type === 'directional') {
                    L = { x: -dir.x, y: -dir.y, z: -(dir.z || 0) };
                } else {
                    L = normalize3(pos.x - surfPos.x, pos.y - surfPos.y, (pos.z||0) - (surfPos.z||0));
                }

                // Lambert: N·L — how much helix flow hits the surface
                const NdotL = Math.max(0, dot3(surfNormal, L));

                // Distance attenuation (inverse-square = helix spread)
                let atten = intensity;
                if (type !== 'directional') {
                    const dx = pos.x - surfPos.x, dy = pos.y - surfPos.y, dz = (pos.z||0) - (surfPos.z||0);
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (dist > range) return spectrum([]);
                    atten *= 1 / Math.pow(Math.max(dist, EPS), falloff);
                }

                // Spot cone attenuation
                if (type === 'spot') {
                    const spotDot = -(L.x * dir.x + L.y * dir.y + (L.z||0) * (dir.z||0));
                    const cosAngle = Math.cos(angle);
                    if (spotDot < cosAngle) return spectrum([]);
                    atten *= Math.pow((spotDot - cosAngle) / (1 - cosAngle), 2);
                }

                // Gate the spectrum by N·L and attenuation: z=xy
                const factor = S.z(NdotL, clamp01(atten));
                return sp.squeeze(factor);
            },

            /** Move light. */
            moveTo(newPos) { return light(type, newPos, dir, sp, o); },

            /** Aim light. */
            aimAt(newDir) { return light(type, pos, newDir, sp, o); },

            /** Change intensity. */
            dim(factor) { return light(type, pos, dir, sp, Object.assign({}, o, { intensity: intensity * factor })); },

            snapshot() { return { type, pos, dir, intensity, range, angle, spectralPower: sp.power() }; }
        });
    }

    /** Directional light (sun). */
    function sunLight(dx, dy, dz, sp) {
        const d = normalize3(dx, dy, dz);
        return light('directional', {x:0,y:0,z:0}, d, sp || whiteLight());
    }

    /** Point light (bulb, flame). */
    function pointLight(x, y, z, sp, opts) {
        return light('point', {x,y,z}, {x:0,y:-1,z:0}, sp || whiteLight(), opts);
    }

    /** Spot light. */
    function spotLight(px, py, pz, dx, dy, dz, sp, opts) {
        const d = normalize3(dx, dy, dz);
        return light('spot', {x:px,y:py,z:pz}, d, sp || whiteLight(), opts);
    }

    // ===============================================================
    //  V. SHADER — the surface IS the shader
    //
    //  z=xy evaluated at a point IS the shade value.
    //  The gradient tells you diffuse direction.
    //  The curvature tells you specular spread.
    //  The normal tells you reflection direction.
    //  Shading = evaluating the Schwarz surface at a point
    //  under a set of lights.
    // ===============================================================

    /** Shade a surface point under a set of lights.
     *  Returns a spectrum representing the total illumination.
     *  surfCoord: S.coord, mat: material, lights: [light], eye: {x,y,z} */
    function shade(surfCoord, mat, lights, eye) {
        const n = surfCoord.normal;
        let result = spectrum([]);

        for (let i = 0; i < lights.length; i++) {
            const illum = lights[i].illuminate(surfCoord, n);
            if (illum.count === 0) continue;

            // Diffuse: N·L already baked into illum via Lambert
            const diffuse = illum.squeeze(mat.diffuse || 0.8);

            // Specular: reflection via S.reflect
            if (eye && mat.specular > 0) {
                const L = lights[i].type === 'directional'
                    ? { x: -lights[i].dir.x, y: -lights[i].dir.y, z: -(lights[i].dir.z||0) }
                    : normalize3(lights[i].pos.x - surfCoord.x, lights[i].pos.y - surfCoord.y, (lights[i].pos.z||0) - surfCoord.z);
                // Half-vector approach
                const V = normalize3(eye.x - surfCoord.x, eye.y - surfCoord.y, (eye.z||0) - surfCoord.z);
                const H = normalize3(L.x + V.x, L.y + V.y, (L.z||0) + (V.z||0));
                const NdotH = Math.max(0, dot3(n, H));
                // Shininess from curvature: flatter surface = sharper specular
                const shin = mat.shininess || 32;
                const spec = Math.pow(NdotH, shin) * (mat.specular || 0.2);
                result = result.merge(illum.squeeze(spec));
            }

            result = result.merge(diffuse);
        }

        // Ambient: minimum illumination (the surface never goes fully dark)
        if (mat.ambient > 0 && mat.ambientSpectrum) {
            result = result.merge(mat.ambientSpectrum.squeeze(mat.ambient));
        }

        return result;
    }

    // ===============================================================
    //  VI. GEOMETRY — vertex, edge, face, volume
    //
    //  Every geometric element is a Schwarz coordinate.
    //  A vertex IS a coord. An edge IS a walk between coords.
    //  A face IS a set of coords with a shared normal.
    //  A volume IS a set of faces that enclose space.
    //  No separate "mesh" class — it's coords all the way down.
    // ===============================================================

    /** Vertex — a living point on the Schwarz surface. */
    function vertex(x, y, z, u, v) {
        const c = S.coord(x, y, 0);
        return Object.freeze({
            x, y, z: z || c.z, u: u || 0, v: v || 0,
            coord: c, normal: c.normal, gradient: c.gradient,
            /** Transform by matrix-like {m00,m01,m02,m10,m11,m12,m20,m21,m22,tx,ty,tz}. */
            transform(m) {
                const nx = m.m00*x + m.m01*y + m.m02*(z||0) + (m.tx||0);
                const ny = m.m10*x + m.m11*y + m.m12*(z||0) + (m.ty||0);
                const nz = m.m20*x + m.m21*y + m.m22*(z||0) + (m.tz||0);
                return vertex(nx, ny, nz, u, v);
            },
            lerp(other, t) {
                return vertex(lerp(x,other.x,t), lerp(y,other.y,t), lerp(z||0,other.z||0,t),
                              lerp(u||0,other.u||0,t), lerp(v||0,other.v||0,t));
            },
            snapshot() { return { x, y, z: z||0, u: u||0, v: v||0 }; }
        });
    }

    /** Edge — a walk between two vertices on the surface. */
    function edge(v0, v1) {
        const dx = v1.x - v0.x, dy = v1.y - v0.y, dz = (v1.z||0) - (v0.z||0);
        const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
        return Object.freeze({
            v0, v1, length,
            dir: normalize3(dx, dy, dz),
            mid: vertex((v0.x+v1.x)/2, (v0.y+v1.y)/2, ((v0.z||0)+(v1.z||0))/2),
            /** Sample a point along the edge at parameter t [0,1]. */
            at(t) { return v0.lerp(v1, t); },
            /** Subdivide into n segments. */
            subdivide(n) {
                const pts = [];
                for (let i = 0; i <= n; i++) pts.push(v0.lerp(v1, i / n));
                return pts;
            }
        });
    }

    /** Face — a polygon defined by vertices, with computed normal. */
    function face(verts) {
        const n = verts.length;
        // Newell's method for face normal
        let nx = 0, ny = 0, nz = 0;
        for (let i = 0; i < n; i++) {
            const c = verts[i], nn = verts[(i+1) % n];
            nx += (c.y - nn.y) * ((c.z||0) + (nn.z||0));
            ny += ((c.z||0) - (nn.z||0)) * (c.x + nn.x);
            nz += (c.x - nn.x) * (c.y + nn.y);
        }
        const fNorm = normalize3(nx, ny, nz);
        // Centroid
        let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < n; i++) { cx += verts[i].x; cy += verts[i].y; cz += (verts[i].z||0); }
        cx /= n; cy /= n; cz /= n;

        return Object.freeze({
            verts, vertexCount: n,
            normal: fNorm,
            centroid: { x: cx, y: cy, z: cz },
            /** Edges of this face. */
            edges() {
                const e = [];
                for (let i = 0; i < n; i++) e.push(edge(verts[i], verts[(i+1) % n]));
                return e;
            },
            /** Flip face winding (reverse normal). */
            flip() { return face(verts.slice().reverse()); }
        });
    }

    /** Volume — a closed set of faces. */
    function volume(faces) {
        return Object.freeze({
            faces, faceCount: faces.length,
            /** Total vertex count (with duplicates). */
            vertexCount() { return faces.reduce((s, f) => s + f.vertexCount, 0); },
            /** Bounding box. */
            bounds() {
                let minX=Infinity, minY=Infinity, minZ=Infinity;
                let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;
                for (const f of faces) for (const v of f.verts) {
                    if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
                    if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
                    if ((v.z||0) < minZ) minZ = v.z||0; if ((v.z||0) > maxZ) maxZ = v.z||0;
                }
                return { min: {x:minX,y:minY,z:minZ}, max: {x:maxX,y:maxY,z:maxZ} };
            }
        });
    }

    // ===============================================================
    //  VII. MATERIAL — surface properties from curvature
    //
    //  A material IS how the surface bends at a point.
    //  Roughness = Gaussian curvature magnitude.
    //  Reflectance = flatness (how mirror-like).
    //  Absorption = which helical pitches get squeezed to zero.
    //  The material doesn't "have" properties — it IS them.
    // ===============================================================

    /** Create a material — surface response to helical flow. */
    function material(opts) {
        const o = opts || {};
        return Object.freeze({
            diffuse:    o.diffuse    !== undefined ? o.diffuse    : 0.8,
            specular:   o.specular   !== undefined ? o.specular   : 0.2,
            shininess:  o.shininess  !== undefined ? o.shininess  : 32,
            ambient:    o.ambient    !== undefined ? o.ambient    : 0.05,
            roughness:  o.roughness  !== undefined ? o.roughness  : 0.5,
            metallic:   o.metallic   !== undefined ? o.metallic   : 0,
            opacity:    o.opacity    !== undefined ? o.opacity    : 1,
            ior:        o.ior        !== undefined ? o.ior        : 1.5,  // index of refraction
            ambientSpectrum: o.ambientSpectrum || whiteLight(4, 0.3),

            /** Absorption filter — which pitches this material swallows.
             *  Returns a gated spectrum. */
            absorb(sp) {
                if (!o.absorptionBands) return sp;
                return sp.bandpass(o.absorptionBands[0], o.absorptionBands[1]);
            },

            /** Derive material properties from a Schwarz coord's curvature.
             *  Flat regions → mirror. Curved regions → diffuse. */
            fromSurface(coord) {
                const flat = coord.flatness;
                return material(Object.assign({}, o, {
                    roughness: 1 - flat,
                    specular: flat * 0.8,
                    diffuse: 1 - flat * 0.5,
                    shininess: 8 + flat * 120
                }));
            },

            snapshot() { return { diffuse: o.diffuse||0.8, specular: o.specular||0.2, shininess: o.shininess||32, roughness: o.roughness||0.5, metallic: o.metallic||0, opacity: o.opacity||1 }; }
        });
    }

    // ===============================================================
    //  VIII. CAMERA — lens, projection, aperture, exposure
    //
    //  The camera IS a coordinate on the surface looking at another.
    //  Projection = evaluating z=xy between the camera coord and
    //  every visible point. Perspective is the surface's natural
    //  hyperbolic projection. Orthographic flattens it.
    //
    //  Aperture = helix radius of the lens.
    //  Exposure = how long helices flow through the sensor.
    //  Focal length = pitch of the lens helix.
    // ===============================================================

    /** Camera types. */
    const PROJ_PERSPECTIVE  = 'perspective';
    const PROJ_ORTHOGRAPHIC = 'orthographic';
    const PROJ_FISHEYE      = 'fisheye';
    const PROJ_EQUIRECT     = 'equirectangular';

    /** Create a camera. */
    function camera(opts) {
        const o = opts || {};
        const pos  = o.pos  || { x: 0, y: 0, z: 5 };
        const look = o.look || { x: 0, y: 0, z: 0 };
        const up   = o.up   || { x: 0, y: 1, z: 0 };
        const fov  = o.fov  || (PI / 3);              // 60° default
        const near = o.near || 0.1;
        const far  = o.far  || 1000;
        const proj = o.projection || PROJ_PERSPECTIVE;
        const aperture = o.aperture || 0;              // 0 = pinhole
        const exposure = o.exposure || 1;              // time multiplier
        const focalLength = o.focalLength || 50e-3;    // 50mm default

        // Forward, right, up vectors
        const fwd = normalize3(look.x - pos.x, look.y - pos.y, (look.z||0) - (pos.z||0));
        const right = normalize3(
            fwd.y * up.z - fwd.z * up.y,
            fwd.z * up.x - fwd.x * up.z,
            fwd.x * up.y - fwd.y * up.x
        );
        const camUp = normalize3(
            right.y * fwd.z - right.z * fwd.y,
            right.z * fwd.x - right.x * fwd.z,
            right.x * fwd.y - right.y * fwd.x
        );

        return Object.freeze({
            pos, look, up: camUp, fwd, right,
            fov, near, far, projection: proj,
            aperture, exposure, focalLength,

            /** Project a world point to normalized screen coords [-1,1]. */
            project(worldPt) {
                const dx = worldPt.x - pos.x;
                const dy = worldPt.y - pos.y;
                const dz = (worldPt.z||0) - (pos.z||0);
                // Camera-space coords
                const cx = dx * right.x + dy * right.y + dz * right.z;
                const cy = dx * camUp.x + dy * camUp.y + dz * camUp.z;
                const cz = dx * fwd.x   + dy * fwd.y   + dz * fwd.z;

                if (cz < near || cz > far) return null;  // behind or beyond

                if (proj === PROJ_ORTHOGRAPHIC) {
                    return { x: cx, y: cy, z: cz };
                }
                // Perspective: z=xy — the surface's natural projection
                const scale = focalLength / cz;
                return { x: cx * scale, y: cy * scale, z: cz };
            },

            /** Move camera. */
            moveTo(newPos) { return camera(Object.assign({}, o, { pos: newPos })); },
            lookAt(newLook) { return camera(Object.assign({}, o, { look: newLook })); },
            setFov(newFov) { return camera(Object.assign({}, o, { fov: newFov })); },
            setAperture(a) { return camera(Object.assign({}, o, { aperture: a })); },
            setExposure(e) { return camera(Object.assign({}, o, { exposure: e })); },

            snapshot() { return { pos, look, fov, projection: proj, aperture, exposure, focalLength }; }
        });
    }

    // ===============================================================
    //  IX. SCREEN — viewport, resolution, aspect, display type
    //
    //  The screen IS a surface — literally. A flat screen is a
    //  plane, a curved screen bends, a VR headset wraps around.
    //  Each screen type maps the projected helical data onto
    //  its own geometry. Resolution = sampling density.
    //  Aspect ratio = surface proportions. All on the surface.
    // ===============================================================

    /** Display types. */
    const DISPLAY_FLAT      = 'flat';
    const DISPLAY_CURVED    = 'curved';
    const DISPLAY_SPHERE    = 'sphere';
    const DISPLAY_VR        = 'vr';
    const DISPLAY_CINEMA    = 'cinema';

    /** Resolution presets. */
    const RES_HD     = { w: 1280, h: 720 };
    const RES_FHD    = { w: 1920, h: 1080 };
    const RES_QHD    = { w: 2560, h: 1440 };
    const RES_4K     = { w: 3840, h: 2160 };
    const RES_8K     = { w: 7680, h: 4320 };

    /** Create a screen — the target surface for rendering. */
    function screen(opts) {
        const o = opts || {};
        const w = o.width  || 1920;
        const h = o.height || 1080;
        const display = o.display || DISPLAY_FLAT;
        const ppi = o.ppi || 96;
        const hdr = o.hdr || false;
        const aspect = w / h;
        const curvature = o.curvature || 0;       // 0=flat, 1=fully curved
        const stereo = o.stereo || false;          // VR stereo pair
        const eyeSep = o.eyeSeparation || 0.065;   // 65mm IPD

        return Object.freeze({
            width: w, height: h, aspect, display,
            ppi, hdr, curvature, stereo, eyeSep,
            pixelCount: w * h,

            /** Map normalized coords [-1,1] to pixel coords. */
            toPixel(nx, ny) {
                return {
                    px: ((nx + 1) * 0.5 * w) | 0,
                    py: ((1 - ny) * 0.5 * h) | 0
                };
            },

            /** Map pixel coords to normalized [-1,1]. */
            toNorm(px, py) {
                return {
                    nx: (px / w) * 2 - 1,
                    ny: 1 - (py / h) * 2
                };
            },

            /** Apply display curvature to a screen-space point.
             *  Curved screens bend x,y through the Schwarz surface. */
            applyCurvature(nx, ny) {
                if (curvature < EPS) return { x: nx, y: ny };
                // Bend through z=xy — the surface IS the curvature
                const bend = S.z(nx, ny) * curvature;
                return { x: nx + bend * ny, y: ny + bend * nx };
            },

            /** Resize screen. */
            resize(nw, nh) { return screen(Object.assign({}, o, { width: nw, height: nh })); },

            /** Create framebuffer (flat Float32 array, 4 channels RGBA). */
            createBuffer() { return new Float32Array(w * h * 4); },

            snapshot() { return { width: w, height: h, aspect, display, ppi, hdr, stereo }; }
        });
    }

    // ===============================================================
    //  X. MOTION — camera movements on the helix
    //
    //  Every camera move is a path on the Schwarz surface.
    //  Pan = translate along contour. Orbit = walk the helix.
    //  Zoom = dive deeper (radius change). Dolly = advance
    //  along the forward helix. Track = follow a target's
    //  gradient. Gimbal = rotate entry point on the helix.
    //  All motion is helical — because ALL motion is.
    // ===============================================================

    /** Motion types — each is a helix operation. */
    function motion(cam, type, params) {
        const p = params || {};
        const dt = p.dt || 1;
        const speed = p.speed || 1;
        const pos = cam.pos, look = cam.look;

        switch (type) {
            case 'pan': {
                const dx = (p.dx || 0) * speed * dt;
                const dy = (p.dy || 0) * speed * dt;
                return cam.moveTo({ x: pos.x + cam.right.x*dx + cam.up.x*dy,
                                    y: pos.y + cam.right.y*dx + cam.up.y*dy,
                                    z: (pos.z||0) + cam.right.z*dx + cam.up.z*dy });
            }
            case 'dolly': {
                const dz = (p.amount || 0) * speed * dt;
                return cam.moveTo({ x: pos.x + cam.fwd.x*dz,
                                    y: pos.y + cam.fwd.y*dz,
                                    z: (pos.z||0) + cam.fwd.z*dz });
            }
            case 'zoom': {
                const factor = 1 + (p.amount || 0) * speed * dt;
                return cam.setFov(clamp(cam.fov / factor, 0.01, PI * 0.99));
            }
            case 'orbit': {
                // Walk the helix around the look target
                const angle = (p.angle || 0) * speed * dt;
                const elev = (p.elevation || 0) * speed * dt;
                const dx = pos.x - look.x, dy = pos.y - look.y, dz = (pos.z||0) - (look.z||0);
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                // Use S.helix for the orbital path — it IS the orbit
                const currentAngle = Math.atan2(dy, dx);
                const currentElev = Math.asin(dz / (dist || 1));
                const h = S.helix(currentAngle + angle, dist * Math.cos(currentElev + elev));
                return cam.moveTo({ x: look.x + h.x, y: look.y + h.y,
                                    z: (look.z||0) + dist * Math.sin(currentElev + elev) });
            }
            case 'track': {
                // Follow a target — move along the gradient toward it
                const target = p.target || look;
                const g = S.gradient(pos.x - target.x, pos.y - target.y);
                const step = speed * dt;
                return cam.moveTo({ x: pos.x - g.dx * step,
                                    y: pos.y - g.dy * step,
                                    z: pos.z || 0 })
                           .lookAt(target);
            }
            case 'gimbal': {
                // Rotate the camera's orientation — helix entry rotation
                const yaw = (p.yaw || 0) * speed * dt;
                const pitch = (p.pitch || 0) * speed * dt;
                const dist = Math.sqrt((look.x-pos.x)**2 + (look.y-pos.y)**2 + ((look.z||0)-(pos.z||0))**2);
                const h = S.helix(Math.atan2(look.y-pos.y, look.x-pos.x) + yaw, dist);
                return cam.lookAt({ x: pos.x + h.x, y: pos.y + h.y,
                                    z: (pos.z||0) + dist * Math.sin(pitch) });
            }
            case 'crane': {
                const dy = (p.amount || 0) * speed * dt;
                return cam.moveTo({ x: pos.x, y: pos.y + dy, z: pos.z || 0 });
            }
            default: return cam;
        }
    }

    /** Follow path — array of {x,y,z} waypoints, returns camera at parameter t [0,1]. */
    function followPath(cam, waypoints, t) {
        if (waypoints.length < 2) return cam;
        const total = waypoints.length - 1;
        const idx = Math.min(Math.floor(t * total), total - 1);
        const frac = (t * total) - idx;
        const a = waypoints[idx], b = waypoints[idx + 1];
        const pos = { x: lerp(a.x,b.x,frac), y: lerp(a.y,b.y,frac), z: lerp(a.z||0,b.z||0,frac) };
        // Look ahead slightly
        const lookIdx = Math.min(idx + 1, total);
        return cam.moveTo(pos).lookAt(waypoints[lookIdx]);
    }

    // ===============================================================
    //  XI. INPUT — human control as surface coordinates
    //
    //  Mouse position → (x, y) on the surface.
    //  Joystick axes → gradient direction.
    //  Trigger/button → gate signal [0,1] — z=xy.
    //  Touch = point coord. Swipe = walk between coords.
    //  Pinch = radius change (zoom on the helix).
    //  All input maps to Schwarz operations.
    // ===============================================================

    /** Create an input state from raw device data. */
    function input(device, raw) {
        const d = device || 'mouse';
        const r = raw || {};

        // Normalize all inputs to surface coordinates
        const x  = r.x  !== undefined ? r.x  : 0;   // primary axis
        const y  = r.y  !== undefined ? r.y  : 0;   // secondary axis
        const x2 = r.x2 !== undefined ? r.x2 : 0;   // right stick / second touch
        const y2 = r.y2 !== undefined ? r.y2 : 0;
        const trigger = clamp01(r.trigger || 0);      // analog trigger → gate
        const button = r.button ? 1 : 0;              // digital → gate (0 or 1)
        const scroll = r.scroll || 0;                  // wheel / pinch
        const dt = r.dt || 1/60;                       // frame delta

        // Map to Schwarz primitives
        const coord = S.coord(x, y, 0);               // position on surface
        const grad = S.gradient(x, y);                 // direction of steepest flow
        const gateVal = S.z(trigger, 1);               // z=xy gate from trigger

        return Object.freeze({
            device: d, x, y, x2, y2, trigger, button, scroll, dt,
            coord, gradient: grad, gate: gateVal,

            /** Apply this input to a camera. Returns new camera. */
            applyToCamera(cam, sensitivity) {
                const s = sensitivity || 1;
                let c = cam;
                if (Math.abs(x) > EPS || Math.abs(y) > EPS) {
                    if (d === 'mouse' || d === 'touch') {
                        c = motion(c, 'gimbal', { yaw: -x * s, pitch: -y * s, dt });
                    } else {
                        c = motion(c, 'orbit', { angle: x * s, elevation: y * s, dt });
                    }
                }
                if (Math.abs(x2) > EPS || Math.abs(y2) > EPS) {
                    c = motion(c, 'pan', { dx: x2 * s, dy: y2 * s, dt });
                }
                if (Math.abs(scroll) > EPS) {
                    c = motion(c, 'dolly', { amount: scroll * s, dt });
                }
                return c;
            },

            /** Apply this input as object manipulation.
             *  Returns transform {dx, dy, dz, rx, ry, rz, scale}. */
            toTransform(sensitivity) {
                const s = sensitivity || 1;
                return {
                    dx: x * s * dt, dy: y * s * dt, dz: scroll * s * dt,
                    rx: y2 * s * dt, ry: x2 * s * dt, rz: 0,
                    scale: 1 + scroll * s * dt * 0.1
                };
            },

            snapshot() { return { device: d, x, y, x2, y2, trigger, button, scroll }; }
        });
    }

    // ===============================================================
    //  XII. PIPELINE — the complete render flow
    //
    //  Geometry → Material → Light → Shader → Spectrum → Pixel → Screen
    //
    //  Each stage is a Schwarz transform. Data flows through
    //  the pipeline like signal through a helix. Each stage
    //  evaluates z=xy: stage output = input × context.
    //  The pipeline IS the helix. Stages ARE layers.
    // ===============================================================

    /** Create a render pipeline. */
    function pipeline(scn, cam, scr) {
        return Object.freeze({
            scene: scn, camera: cam, screen: scr,

            /** Render a single face under the scene's lights.
             *  Returns array of pixels. */
            renderFace(f, mat, lights, eye) {
                const pixels = [];
                const c = f.centroid;
                const fCoord = S.coord(c.x, c.y, 0);

                // Shade: evaluate surface under lights
                const shaded = shade(fCoord, mat, lights, eye);

                // Project centroid to screen
                const projected = cam.project(c);
                if (!projected) return pixels;

                const sp = scr.toPixel(projected.x, projected.y);
                pixels.push(pixel(shaded, sp.px, sp.py, projected.z));
                return pixels;
            },

            /** Render entire scene.
             *  scene: { objects: [{faces, material}], lights: [light] }
             *  Returns flat pixel array. */
            render() {
                const pixels = [];
                const eye = cam.pos;
                const objects = scn.objects || [];
                const lights = scn.lights || [];

                for (let oi = 0; oi < objects.length; oi++) {
                    const obj = objects[oi];
                    const mat = obj.material || material();
                    const faces = obj.faces || [];
                    for (let fi = 0; fi < faces.length; fi++) {
                        const fp = this.renderFace(faces[fi], mat, lights, eye);
                        for (let pi = 0; pi < fp.length; pi++) pixels.push(fp[pi]);
                    }
                }
                return pixels;
            },

            /** Write pixels to a framebuffer (Float32Array, RGBA). */
            toBuffer(pixels, buffer) {
                const buf = buffer || scr.createBuffer();
                for (let i = 0; i < pixels.length; i++) {
                    const p = pixels[i];
                    const idx = (p.py * scr.width + p.px) * 4;
                    if (idx >= 0 && idx < buf.length - 3) {
                        buf[idx]   = p.r;
                        buf[idx+1] = p.g;
                        buf[idx+2] = p.b;
                        buf[idx+3] = p.a;
                    }
                }
                return buf;
            },

            snapshot() { return { camera: cam.snapshot(), screen: scr.snapshot() }; }
        });
    }

    // ===============================================================
    //  PUBLIC SURFACE — everything the engine exposes
    // ===============================================================

    return Object.freeze({
        // I. Wave — helical pipeline
        wave, lightWave, soundWave,
        // II. Spectrum — helix bundles
        spectrum, whiteLight,
        // III. Pixel — lossy projection
        pixel, cieMatch,
        // IV. Light — illumination
        light, sunLight, pointLight, spotLight,
        // V. Shader — surface shading
        shade,
        // VI. Geometry — coords as structure
        vertex, edge, face, volume,
        // VII. Material — curvature as properties
        material,
        // VIII. Camera — lens & projection
        camera, PROJ_PERSPECTIVE, PROJ_ORTHOGRAPHIC, PROJ_FISHEYE, PROJ_EQUIRECT,
        // IX. Screen — display surface
        screen, DISPLAY_FLAT, DISPLAY_CURVED, DISPLAY_SPHERE, DISPLAY_VR, DISPLAY_CINEMA,
        RES_HD, RES_FHD, RES_QHD, RES_4K, RES_8K,
        // X. Motion — helix traversal
        motion, followPath,
        // XI. Input — human → surface coords
        input,
        // XII. Pipeline — full render flow
        pipeline,
        // Constants
        C_LIGHT, C_SOUND
    });

})(typeof Schwarz !== 'undefined' ? Schwarz : require('../schwarz.js'));

if (typeof window !== 'undefined') window.SchwarzVideo = SchwarzVideo;
if (typeof module !== 'undefined') module.exports = SchwarzVideo;
