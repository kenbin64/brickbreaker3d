/**
 * ═══════════════════════════════════════════════════════════════
 * SCHWARZ DIAMOND — PROOF TEST SUITE
 * ═══════════════════════════════════════════════════════════════
 *
 * Every assertion here is a mathematical proof.
 * If it passes, the surface is real.
 *
 * Run:  node width/engine/schwarz.test.js
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const S = require('./schwarz.js');

const EPS = 1e-9;
let passed = 0, failed = 0, total = 0;
const failures = [];

function eq(a, b, msg) {
    total++;
    if (Math.abs(a - b) < EPS) { passed++; }
    else { failed++; failures.push(`FAIL: ${msg} — expected ${b}, got ${a}`); }
}

function ok(cond, msg) {
    total++;
    if (cond) { passed++; }
    else { failed++; failures.push(`FAIL: ${msg}`); }
}

function section(name) { console.log(`\n  ── ${name} ──`); }

console.log('═══════════════════════════════════════════════════');
console.log(' SCHWARZ DIAMOND — MATHEMATICAL PROOF SUITE');
console.log('═══════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────
//  I. THE SURFACE — z = xy
// ─────────────────────────────────────────────────────────────
section('I. Surface z = xy');
eq(S.z(3, 4), 12, 'z(3,4) = 12');
eq(S.z(0, 999), 0, 'z(0, anything) = 0 — zero kills');
eq(S.z(-2, 3), -6, 'z(-2,3) = -6 — sign preserving');
eq(S.z(1, 1), 1, 'z(1,1) = 1');
eq(S.z2(2, 3), 18, 'z2(2,3) = 2·9 = 18');
eq(S.z2i(3, 2), 18, 'z2i(3,2) = 9·2 = 18');
eq(S.z22(2, 3), 36, 'z22(2,3) = 4·9 = 36');

// Commutativity: z(a,b) = z(b,a)
eq(S.z(7, 5), S.z(5, 7), 'Commutativity: z(7,5) = z(5,7)');

// ─────────────────────────────────────────────────────────────
//  II. POLAR FORM — z = r²sin(2θ)/2
// ─────────────────────────────────────────────────────────────
section('II. Polar Form');
eq(S.polar(2, Math.PI / 4), 2, 'polar(2, π/4) = 2');
eq(S.polar(1, 0), 0, 'polar(r, 0) = 0 — inflection');
eq(S.polar(1, Math.PI / 2), 0, 'polar(r, π/2) = 0 — inflection');
eq(S.wave(Math.PI / 4), 1, 'wave(π/4) = sin(π/2) = 1 — peak');
eq(S.wave(3 * Math.PI / 4), -1, 'wave(3π/4) = -1 — trough');
eq(S.wave(0), 0, 'wave(0) = 0 — inflection');
eq(S.amplitude(2), 2, 'amplitude(2) = 4/2 = 2');

// Polar ↔ Cartesian roundtrip
const p = S.toPolar(3, 4);
const c = S.toCart(p.r, p.theta);
eq(c.x, 3, 'toPolar→toCart roundtrip x');
eq(c.y, 4, 'toPolar→toCart roundtrip y');

// PROOF: Polar and Cartesian forms are equivalent
// z = xy = r²sin(2θ)/2  (identity)
for (const [x, y] of [[1,1],[2,3],[-1,4],[0.5,0.7]]) {
    const cart = S.z(x, y);
    const pp = S.toPolar(x, y);
    const pol = S.polar(pp.r, pp.theta);
    eq(cart, pol, `Cartesian=Polar at (${x},${y}): ${cart.toFixed(6)} = ${pol.toFixed(6)}`);
}

// ─────────────────────────────────────────────────────────────
//  III. GRADIENT — ∇z = (y, x)  THE INPUTS SWAP
// ─────────────────────────────────────────────────────────────
section('III. Gradient (the swap)');
const g = S.gradient(3, 7);
eq(g.dx, 7, '∂z/∂x at (3,7) = 7 (= y) — inputs swap');
eq(g.dy, 3, '∂z/∂y at (3,7) = 3 (= x) — inputs swap');
eq(S.gradientMag(3, 4), 5, '|∇z| at (3,4) = 5 = r');

// PROOF: gradient magnitude = polar radius
for (const [x, y] of [[1,0],[0,1],[3,4],[5,12]]) {
    const mag = S.gradientMag(x, y);
    const r = S.toPolar(x, y).r;
    eq(mag, r, `|∇z| = r at (${x},${y})`);
}

// ─────────────────────────────────────────────────────────────
//  IV. NORMAL — N = (-y, -x, 1) / √(1+x²+y²)
// ─────────────────────────────────────────────────────────────
section('IV. Surface Normal');
const n0 = S.normal(0, 0);
eq(n0.x, 0, 'N at origin: x=0');
eq(n0.y, 0, 'N at origin: y=0');
eq(n0.z, 1, 'N at origin: z=1 — points straight up');

// PROOF: Normal is unit length everywhere
for (const [x, y] of [[0,0],[1,1],[3,4],[-2,5],[10,10]]) {
    const n = S.normal(x, y);
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    eq(len, 1, `|N| = 1 at (${x},${y})`);
}

// Flatness at origin = 1
eq(S.flatness(0, 0), 1, 'flatness(0,0) = 1 — perfectly flat at origin');
ok(S.flatness(10, 10) < 0.1, 'flatness(10,10) ≈ 0 — steep far out');

// ─────────────────────────────────────────────────────────────
//  V. CURVATURE — K and H
// ─────────────────────────────────────────────────────────────
section('V. Curvature');

// PROOF: Gaussian curvature K < 0 everywhere (saddle)
eq(S.gaussK(0, 0), -1, 'K(0,0) = -1 — maximum negative curvature at origin');
ok(S.gaussK(1, 1) < 0, 'K(1,1) < 0 — always negative');
ok(S.gaussK(100, 100) < 0, 'K(100,100) < 0 — even far out');

// PROOF: K = -1/(1+x²+y²)²
for (const [x, y] of [[0,0],[1,0],[0,1],[2,3],[5,5]]) {
    const expected = -1 / Math.pow(1 + x*x + y*y, 2);
    eq(S.gaussK(x, y), expected, `K(${x},${y}) = -1/(1+${x}²+${y}²)²`);
}

// PROOF: Mean curvature H = 0 at origin and on axes
eq(S.meanH(0, 0), 0, 'H(0,0) = 0 — minimal at origin');
eq(S.meanH(5, 0), 0, 'H(5,0) = 0 — minimal on x-axis');
eq(S.meanH(0, 7), 0, 'H(0,7) = 0 — minimal on y-axis');

// PROOF: Principal curvatures are equal and opposite → K = k1·k2
for (const [x, y] of [[0,0],[1,1],[3,4]]) {
    const pk = S.principalK(x, y);
    eq(pk.k1, -pk.k2, `κ₁ = -κ₂ at (${x},${y})`);
    eq(pk.k1 * pk.k2, S.gaussK(x, y), `K = κ₁·κ₂ at (${x},${y})`);
}

// ─────────────────────────────────────────────────────────────
//  VI. CONTOURS — xy = c (hyperbolas)
// ─────────────────────────────────────────────────────────────
section('VI. Contours');
eq(S.contourY(12, 3), 4, 'contourY(12, 3) = 4 — y = c/x');
eq(S.contourX(12, 4), 3, 'contourX(12, 4) = 3 — x = c/y');
ok(S.contourY(5, 0) === Infinity, 'contourY(c, 0) = ∞ — asymptote');
eq(S.contourAt(3, 4), 12, 'contourAt(3,4) = 12 = z');

// PROOF: Every point on a contour has the same z value
const pts = S.contour(6, 0.5, 10, 50);
for (const pt of pts) {
    eq(S.z(pt.x, pt.y), 6, `contour z=6: z(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) = 6`);
}

// ─────────────────────────────────────────────────────────────
//  VII. TANGENT PLANE
// ─────────────────────────────────────────────────────────────
section('VII. Tangent Plane');

// PROOF: Tangent plane touches surface at the point of tangency
for (const [a, b] of [[1,2],[3,4],[0,0],[-1,5]]) {
    const tp = S.tangentPlane(a, b);
    eq(tp(a, b), S.z(a, b), `tangent(${a},${b}) touches surface at (${a},${b})`);
}

// PROOF: Error is zero at point of tangency
eq(S.tangentError(2, 3, 2, 3), 0, 'tangentError = 0 at point of tangency');

// PROOF: Error grows with distance from tangency point
ok(Math.abs(S.tangentError(1, 1, 2, 2)) > Math.abs(S.tangentError(1, 1, 1.1, 1.1)),
    'tangentError grows with distance');

// ─────────────────────────────────────────────────────────────
//  VIII. FUNDAMENTAL FORMS
// ─────────────────────────────────────────────────────────────
section('VIII. Fundamental Forms');

// First Form at origin: E=1, F=0, G=1 (flat Euclidean!)
const ff0 = S.firstForm(0, 0);
eq(ff0.E, 1, 'E(0,0) = 1');
eq(ff0.F, 0, 'F(0,0) = 0');
eq(ff0.G, 1, 'G(0,0) = 1');

// Area element at origin = 1 (unit area)
eq(S.areaElement(0, 0), 1, 'dA(0,0) = 1 — flat at origin');
ok(S.areaElement(3, 4) > 1, 'dA(3,4) > 1 — surface stretches');

// PROOF: areaElement = √(EG - F²)
for (const [x, y] of [[0,0],[1,1],[2,3]]) {
    const ff = S.firstForm(x, y);
    const expected = Math.sqrt(ff.E * ff.G - ff.F * ff.F);
    eq(S.areaElement(x, y), expected, `dA = √(EG-F²) at (${x},${y})`);
}

// Second Form: e=0, g=0, f=1/√(1+x²+y²)
const sf0 = S.secondForm(0, 0);
eq(sf0.e, 0, 'e(0,0) = 0');
eq(sf0.f, 1, 'f(0,0) = 1');
eq(sf0.g, 0, 'g(0,0) = 0');

// PROOF: K = (eg - f²) / (EG - F²)
for (const [x, y] of [[0,0],[1,1],[2,3]]) {
    const ff = S.firstForm(x, y);
    const sf = S.secondForm(x, y);
    const Kform = (sf.e * sf.g - sf.f * sf.f) / (ff.E * ff.G - ff.F * ff.F);
    eq(Kform, S.gaussK(x, y), `K from forms = K from formula at (${x},${y})`);
}

// ─────────────────────────────────────────────────────────────
//  IX. ROTATION — connecting saddles at 90°
// ─────────────────────────────────────────────────────────────
section('IX. Rotation');

// Layer angles: 0°, 45°, 90°, ...
eq(S.layerAngle(0), 0, 'L0 angle = 0');
eq(S.layerAngle(2), Math.PI / 2, 'L2 angle = π/2 (90°)');
eq(S.layerAngle(4), Math.PI, 'L4 angle = π (180°)');

// PROOF: 90° rotation NEGATES the saddle (antisymmetry)
eq(S.evalAt(1, 1, 0), 1, 'evalAt(1,1, L0) = 1');
eq(S.evalAt(1, 1, 2) + 1, 0, 'evalAt(1,1, L2) = -1 — 90° negates');

// PROOF: 180° rotation restores the saddle
const z0 = S.evalAt(2, 3, 0);
const z4 = S.evalAt(2, 3, 4);
eq(z0, z4, '180° rotation restores: evalAt(2,3,L0) = evalAt(2,3,L4)');

// PROOF: Rotation preserves radius
const r1 = S.rotate(3, 4, Math.PI / 3);
eq(Math.sqrt(r1.x * r1.x + r1.y * r1.y), 5, 'rotation preserves radius');

// ─────────────────────────────────────────────────────────────
//  X. HELIX
// ─────────────────────────────────────────────────────────────
section('X. Helix');

// Helix at t=0: x=r, y=0
const h0 = S.helix(0, 1);
eq(h0.x, 1, 'helix(0) x = 1');
eq(h0.y, 0, 'helix(0) y = 0');
eq(h0.z, 0, 'helix(0) z = 0 — starts at zero');

// PROOF: Inflection at 0, π/2, π, 3π/2
ok(S.isInflection(0), 'θ=0 is inflection');
ok(S.isInflection(Math.PI / 2), 'θ=π/2 is inflection');
ok(S.isInflection(Math.PI), 'θ=π is inflection');
ok(!S.isInflection(Math.PI / 4), 'θ=π/4 is NOT inflection');

// Walk collects all layers
const w = S.walk(1, 1, 0, 7);
eq(w.length, 8, 'walk(0→7) visits 8 layers');

// Quadrants
eq(S.quadrant(1, 1), 1, 'Q1: x>0, y>0');
eq(S.quadrant(-1, 1), 2, 'Q2: x<0, y>0');
eq(S.quadrant(-1, -1), 3, 'Q3: x<0, y<0');
eq(S.quadrant(1, -1), 4, 'Q4: x>0, y<0');

// ─────────────────────────────────────────────────────────────
//  XI. GATES — z=xy as logic
// ─────────────────────────────────────────────────────────────
section('XI. Gates');
eq(S.gate(1, 1), 1, 'AND(1,1) = 1');
eq(S.gate(1, 0), 0, 'AND(1,0) = 0 — zero kills');
eq(S.gate(0, 1), 0, 'AND(0,1) = 0');
eq(S.gate(0, 0), 0, 'AND(0,0) = 0');
eq(S.not(0), 1, 'NOT(0) = 1');
eq(S.not(1), 0, 'NOT(1) = 0');
eq(S.or(0, 0), 0, 'OR(0,0) = 0');
eq(S.or(1, 0), 1, 'OR(1,0) = 1');
eq(S.or(0, 1), 1, 'OR(0,1) = 1');
eq(S.or(1, 1), 1, 'OR(1,1) = 1');
eq(S.xor(1, 0), 1, 'XOR(1,0) = 1');
eq(S.xor(0, 1), 1, 'XOR(0,1) = 1');
eq(S.xor(1, 1), 0, 'XOR(1,1) = 0');
eq(S.xor(0, 0), 0, 'XOR(0,0) = 0');

// Clamped gate stays in [0,1]
eq(S.gateClamp(5, 5), 1, 'gateClamp caps at 1');
eq(S.gateClamp(-1, 1), 0, 'gateClamp floors at 0');

// PROOF: De Morgan's law: NOT(AND(a,b)) = OR(NOT(a), NOT(b))
for (const [a, b] of [[0,0],[0,1],[1,0],[1,1]]) {
    const lhs = S.not(S.gate(a, b));
    const rhs = S.or(S.not(a), S.not(b));
    eq(lhs, rhs, `De Morgan: NOT(AND(${a},${b})) = OR(NOT(${a}),NOT(${b}))`);
}


// ─────────────────────────────────────────────────────────────
//  XII. REFLECTION & PROJECTION
// ─────────────────────────────────────────────────────────────
section('XII. Reflection & Projection');

// PROOF: Reflected vector has same magnitude as input
const v = { x: 1, y: 2, z: 3 };
const vMag = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
const ref = S.reflect(v.x, v.y, v.z, 1, 1);
const refMag = Math.sqrt(ref.x*ref.x + ref.y*ref.y + ref.z*ref.z);
eq(refMag, vMag, 'reflection preserves magnitude');

// PROOF: At origin, normal = (0,0,1), reflection flips z only
const refO = S.reflect(1, 2, 3, 0, 0);
eq(refO.x, 1, 'reflect at origin: x unchanged');
eq(refO.y, 2, 'reflect at origin: y unchanged');
eq(refO.z, -3, 'reflect at origin: z flipped');

// PROOF: Projection removes normal component → dot(projected, normal) = 0
for (const [sx, sy] of [[0,0],[1,1],[3,4]]) {
    const proj = S.project(1, 2, 3, sx, sy);
    const n = S.normal(sx, sy);
    const dot = proj.x * n.x + proj.y * n.y + proj.z * n.z;
    eq(dot, 0, `projected · normal = 0 at (${sx},${sy})`);
}

// ─────────────────────────────────────────────────────────────
//  XIII. DATA TRANSFORM
// ─────────────────────────────────────────────────────────────
section('XIII. Data Transform');

// Number × Number
eq(S.transform(3, 4, 0), 12, 'transform(3, 4, L0) = 12');

// Array × Array
const tArr = S.transform([2, 3], [4, 5], 0);
eq(tArr[0], 8, 'transform([2,3], [4,5])[0] = 8');
eq(tArr[1], 15, 'transform([2,3], [4,5])[1] = 15');

// Object × Object
const tObj = S.transform({ a: 2, b: 3 }, { a: 4, b: 5 }, 0);
eq(tObj.a, 8, 'transform({a:2}, {a:4}).a = 8');
eq(tObj.b, 15, 'transform({b:3}, {b:5}).b = 15');

// Falsy → gate
eq(S.transform(null, true, 0), 0, 'transform(null, true) = gate(0,1) = 0');
eq(S.transform(true, true, 0), 1, 'transform(true, true) = gate(1,1) = 1');

// ─────────────────────────────────────────────────────────────
//  XIV. LIVING COORDINATES — parts of parts
// ─────────────────────────────────────────────────────────────
section('XIV. Living Coordinates');

const p1 = S.coord(1, 1, 0);
eq(p1.z, 1, 'coord(1,1,L0).z = 1');
eq(p1.layer, 0, 'coord layer = 0');

// child: relative spawn
const child = p1.child(1, 0);
ok(child.x !== p1.x || child.y !== p1.y, 'child is at a different position');
ok(typeof child.z === 'number', 'child has z');
ok(typeof child.child === 'function', 'child can spawn children (parts of parts)');

// step: gradient ascent
const stepped = p1.step(0.1);
ok(typeof stepped.z === 'number', 'step returns a coord');

// descend: gradient descent
const descended = p1.descend(0.1);
ok(typeof descended.z === 'number', 'descend returns a coord');

// dive: self-recursion
const dived = p1.dive(1);
ok(typeof dived.z === 'number', 'dive(1) returns a coord');
const dived2 = p1.dive(2);
ok(typeof dived2.z === 'number', 'dive(2) returns a coord — recursive');

// rise/sink: helix traversal
eq(p1.rise().layer, 1, 'rise() goes to L1');
eq(p1.sink().layer, 0, 'sink() stays at L0 (floor)');
const p5 = S.coord(1, 1, 5);
eq(p5.rise().layer, 6, 'L5.rise() = L6');
eq(p5.sink().layer, 4, 'L5.sink() = L4');
const p7 = S.coord(1, 1, 7);
eq(p7.rise().layer, 7, 'L7.rise() stays at L7 (ceiling)');

// bounce & slide
const bounced = p1.bounce(1, 0, 0);
ok(typeof bounced.x === 'number', 'bounce returns vector');
const slid = p1.slide(1, 0, 0);
ok(typeof slid.x === 'number', 'slide returns vector');

// PROOF: slide result is perpendicular to normal
const slideN = S.normal(p1.x, p1.y);
const slideDot = slid.x * slideN.x + slid.y * slideN.y + slid.z * slideN.z;
eq(slideDot, 0, 'slide · normal = 0 (tangent to surface)');

// gradientCoord: gradient IS a point
const gc = p1.gradientCoord();
ok(typeof gc.z === 'number', 'gradientCoord returns a living coord');
ok(typeof gc.child === 'function', 'gradientCoord can spawn children');

// normalCoord: normal IS a point
const nc = p1.normalCoord();
ok(typeof nc.z === 'number', 'normalCoord returns a living coord');

// lerp: interpolation
const p2 = S.coord(5, 5, 4);
const mid = p1.lerp(p2, 0.5);
ok(typeof mid.z === 'number', 'lerp returns a coord');
eq(p1.lerp(p2, 0).x, p1.x, 'lerp(0) = start');

// gateWith: control signal
const gated = p1.gateWith(0);
eq(gated.z, 0, 'gateWith(0) kills output — zero gate');

// snapshot: serialization
const snap = p1.snapshot();
ok(typeof snap === 'object', 'snapshot returns object');
ok(!snap.child, 'snapshot has no methods (pure data)');
eq(snap.x, p1.x, 'snapshot preserves x');
eq(snap.z, p1.z, 'snapshot preserves z');

// PROOF: Parts of parts — 3 levels deep
const level1 = S.coord(2, 3, 0);
const level2 = level1.child(0.1, 0.1).gradientCoord();
const level3 = level2.child(-0.1, 0.2).normalCoord();
ok(typeof level3.z === 'number', '3 levels deep: coord→child→gradientCoord→child→normalCoord');
ok(typeof level3.step === 'function', 'level 3 coord is still alive — can step');
ok(typeof level3.dive === 'function', 'level 3 coord can still dive deeper');


// ═══════════════════════════════════════════════════════════════
//  BENCHMARKS — performance proof
// ═══════════════════════════════════════════════════════════════
section('BENCHMARKS');

function bench(name, fn, iterations) {
    const N = iterations || 1000000;
    const start = process.hrtime.bigint();
    for (let i = 0; i < N; i++) fn(i);
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const opsPerSec = Math.round(N / (ms / 1000));
    console.log(`    ${name}: ${ms.toFixed(2)}ms for ${N.toLocaleString()} ops (${opsPerSec.toLocaleString()} ops/sec)`);
    return { name, ms, ops: N, opsPerSec };
}

const benchResults = [];
benchResults.push(bench('z(x,y)', (i) => S.z(i * 0.001, i * 0.002)));
benchResults.push(bench('polar(r,θ)', (i) => S.polar(i * 0.001, i * 0.002)));
benchResults.push(bench('gradient(x,y)', (i) => S.gradient(i * 0.001, i * 0.002)));
benchResults.push(bench('normal(x,y)', (i) => S.normal(i * 0.001, i * 0.002)));
benchResults.push(bench('gaussK(x,y)', (i) => S.gaussK(i * 0.001, i * 0.002)));
benchResults.push(bench('firstForm(x,y)', (i) => S.firstForm(i * 0.001, i * 0.002)));
benchResults.push(bench('secondForm(x,y)', (i) => S.secondForm(i * 0.001, i * 0.002)));
benchResults.push(bench('rotate(x,y,θ)', (i) => S.rotate(i * 0.001, i * 0.002, 0.5)));
benchResults.push(bench('evalAt(x,y,L)', (i) => S.evalAt(i * 0.001, i * 0.002, 3)));
benchResults.push(bench('reflect(v,s)', (i) => S.reflect(1, 2, 3, i * 0.001, i * 0.002)));
benchResults.push(bench('gate(s,c)', (i) => S.gate(i * 0.001, i * 0.002)));
benchResults.push(bench('transform(n,n,L)', (i) => S.transform(i * 0.001, i * 0.002, 0)));
benchResults.push(bench('coord(x,y,L)', (i) => S.coord(i * 0.001, i * 0.002, 0), 100000));
benchResults.push(bench('coord.child()', (i) => { const c = S.coord(1,1,0); c.child(0.1, 0.1); }, 100000));
benchResults.push(bench('coord.step()', (i) => { const c = S.coord(1,1,0); c.step(0.1); }, 100000));
benchResults.push(bench('coord.dive(3)', (i) => { const c = S.coord(1,1,0); c.dive(3); }, 100000));

// ═══════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log(` RESULTS: ${passed}/${total} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════');

if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(`  ✗ ${f}`));
}

if (failed === 0) {
    console.log('\n  ✓ ALL PROOFS VERIFIED. THE SURFACE IS REAL.');
    console.log('  ✓ Every property derives from z = xy.');
    console.log('  ✓ Every coordinate is a living dimension.');
    console.log('  ✓ Parts of parts, all the way down.\n');
} else {
    console.log(`\n  ✗ ${failed} proofs failed. The surface has holes.\n`);
    process.exit(1);
}