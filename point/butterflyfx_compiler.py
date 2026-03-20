#!/usr/bin/env python3
"""
ButterflyFX Compiler — Helix-Gyroid Architecture
==================================================
Schwarz Diamond Principle: minimum material, maximum area and strength.

The gyroid minimal surface is the synthesis law:  z = x·y
Every substrate is a point on this surface.
The compiler traces the surface and emits the two labyrinths:
  Labyrinth A (source)  → you write this
  Labyrinth B (build)   → the server runs this
  Surface (manifold)    → z = x·y, compiler lives here

7-Layer Helix:
  L1 SPARK      — ingest: identify all source components
  L2 MIRROR     — reflect: map all exports and dependencies
  L3 RELATION   — synthesise: z = x·y  (the gyroid saddle)
  L4 FORM       — structure: assign LWHX Fibonacci descriptors
  L5 LIFE       — compile: encode substrate bundles (.bfx)
  L6 MIND       — minimise: remove redundancy, verify coverage
  L7 COMPLETION — emit: write helix_index.json + interpreter seed

Usage:
  python butterflyfx_compiler.py <game_dir> [--out <dist_dir>]
  python butterflyfx_compiler.py games/fasttrack
"""

import os, sys, json, hashlib, base64, re, math, argparse
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple

# ── Gyroid constants (Fibonacci cascade — minimum material law) ──────────────
PHI = 1.618033988749895
FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]

LAYER_NAMES  = ['SPARK', 'MIRROR', 'RELATION', 'FORM', 'LIFE', 'MIND', 'COMPLETION']
# LWHX at each layer — Fibonacci proportions
LAYER_LWHX   = [
    {'L': 1,  'W': 1,  'H': 1,  'X': 1},   # L1 SPARK
    {'L': 2,  'W': 1,  'H': 1,  'X': 2},   # L2 MIRROR
    {'L': 3,  'W': 2,  'H': 1,  'X': 3},   # L3 RELATION  ← gyroid surface
    {'L': 5,  'W': 3,  'H': 2,  'X': 5},   # L4 FORM
    {'L': 8,  'W': 5,  'H': 3,  'X': 8},   # L5 LIFE
    {'L': 13, 'W': 8,  'H': 5,  'X': 13},  # L6 MIND
    {'L': 21, 'W': 13, 'H': 8,  'X': 21},  # L7 COMPLETION
]

# ── Dimensional layer assignment — pattern → helix layer ────────────────────
# Pattern is matched against the filename stem (lowercase)
LAYER_PATTERNS: List[Tuple[int, re.Pattern]] = [
    (1, re.compile(r'(analytics|seo|growth|pwa|legal|sitemap)')),        # SPARK
    (2, re.compile(r'(board_manifold|game_engine_manifold|state_sub)')), # MIRROR
    (3, re.compile(r'(rules|card_logic|validation|move_gen)')),          # RELATION ← z=x·y
    (4, re.compile(r'(game_engine|card_deck|peg_sub|card_render)')),     # FORM
    (5, re.compile(r'(ai_manifold|card_ui|game_ui|audio|music)')),       # LIFE
    (6, re.compile(r'(camera|theme|move_sel|comment|crowd|cutscene)')),  # MIND
    (7, re.compile(r'(game_init|victory|lobby|auth|session)')),           # COMPLETION
]

@dataclass
class HelixPoint:
    """A single point on the gyroid surface — one compiled substrate or manifold.

    Schwarz Diamond Quadrant Law: the part contains the whole.
    Every HelixPoint is itself a 7-layer helix at the next smaller scale.
    The 'quadrant' field holds the inner spiral — each key is one creation layer.
    z = x·y applies at every scale: quadrant[RELATION] = quadrant[SPARK] · quadrant[MIRROR].
    """
    id:           str
    kind:         str          # 'substrate' | 'manifold' | 'shell'
    layer:        int          # 1–7  (position on the outer helix)
    layer_name:   str
    lwhx:         Dict         # Fibonacci LWHX descriptor
    source_path:  str
    hash:         str
    size_bytes:   int
    exports:      List[str]    = field(default_factory=list)
    dependencies: List[str]    = field(default_factory=list)
    inherited:    List[str]    = field(default_factory=list)   # ids from all layers < self.layer
    code_b64:     str          = ''
    sealed:       bool         = True
    # ── Inner quadrant spiral (Schwarz Diamond self-similarity) ───────────────
    # Each key is a LAYER_NAME; value is the portion of this file that belongs
    # to that creation concern, extracted by section comment markers.
    # At the smallest scale, each field may simply be the token count proportion.
    quadrant:     Dict         = field(default_factory=lambda: {
        'SPARK':      {'weight': 1,  'tokens': 0, 'fib': 1},
        'MIRROR':     {'weight': 1,  'tokens': 0, 'fib': 1},
        'RELATION':   {'weight': 2,  'tokens': 0, 'fib': 2},   # z = x·y
        'FORM':       {'weight': 3,  'tokens': 0, 'fib': 3},
        'LIFE':       {'weight': 5,  'tokens': 0, 'fib': 5},
        'MIND':       {'weight': 8,  'tokens': 0, 'fib': 8},
        'COMPLETION': {'weight': 13, 'tokens': 0, 'fib': 13},
    })

@dataclass
class HelixIndex:
    """The manifold index — the gyroid surface map for the interpreter."""
    bfx_version:   str         = '1.0'
    game:          str         = ''
    helix_turns:   int         = 2        # kensverse → kensgames → game = turn 2
    gyroid_law:    str         = 'z=x*y'
    phi:           float       = PHI
    fib:           List[int]   = field(default_factory=lambda: FIB)
    spine:         str         = 'butterflyfx'
    points:        List[Dict]  = field(default_factory=list)   # HelixPoints serialised
    synthesis_map: Dict        = field(default_factory=dict)   # z=x·y connections
    load_order:    List[str]   = field(default_factory=list)   # L1→L7 execution order

def detect_layer(stem: str) -> int:
    """L3 RELATION — assign a helix layer to a file by name pattern (z = name·pattern)."""
    s = stem.lower()
    for layer, pattern in LAYER_PATTERNS:
        if pattern.search(s):
            return layer
    # Default heuristic: manifolds → L2 MIRROR, substrates → L4 FORM, shells → L7
    if 'manifold' in s:
        return 2
    if 'substrate' in s:
        return 4
    return 4   # unknown → FORM (safest mid-layer)

def detect_kind(stem: str, suffix: str) -> str:
    """Identify whether a file is a substrate, manifold, or shell."""
    if suffix in ('.html',):
        return 'shell'
    if 'manifold' in stem.lower():
        return 'manifold'
    return 'substrate'

def extract_exports(source: str) -> List[str]:
    """L2 MIRROR — reflect all window.* exports and named exports from source."""
    found = re.findall(r'window\.(\w+)\s*=', source)
    found += re.findall(r'const\s+(\w+)\s*=\s*\(', source)   # IIFE patterns
    return sorted(set(found))[:21]   # max 21 — L7 LWHX.X ceiling

def extract_dependencies(source: str, known_ids: List[str]) -> List[str]:
    """L3 RELATION — find z = x·y connections: what does this file consume?"""
    deps = []
    for kid in known_ids:
        # Look for usage of the other substrate's known global or filename reference
        stem = kid.replace('-', '_').replace('.', '_')
        if re.search(rf'\b{stem}\b', source, re.IGNORECASE):
            deps.append(kid)
    return deps

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:16]

def encode_source(source: str) -> str:
    """L5 LIFE — encode source into the compiled bundle (base64 for transport)."""
    return base64.b64encode(source.encode('utf-8')).decode('ascii')

# ── Schwarz Diamond Quadrant Analyser ───────────────────────────────────────
# Each file IS itself a 7-layer helix at the inner scale.
# We measure what proportion of the file's tokens belong to each creation layer
# by scanning for section comment markers (// SPARK, // RELATION, etc.)
# and distributing the remaining tokens by Fibonacci weight.
_SECTION_RE = {
    name: re.compile(rf'(?:^|//|/\*)\s*{name}\b', re.IGNORECASE)
    for name in LAYER_NAMES
}

def analyse_quadrant(source: str) -> Dict:
    """Schwarz Diamond quadrant law: measure the inner 7-layer spiral of a file."""
    lines = source.splitlines()
    total = max(len(lines), 1)
    # Find which lines belong to each layer by marker
    layer_lines: Dict[str, int] = {n: 0 for n in LAYER_NAMES}
    current = 'SPARK'
    for line in lines:
        for name in LAYER_NAMES:
            if _SECTION_RE[name].search(line):
                current = name
                break
        layer_lines[current] += 1

    # Compute token counts and Fibonacci-weighted surface area
    fib_weights = [1, 1, 2, 3, 5, 8, 13]
    quadrant = {}
    for i, name in enumerate(LAYER_NAMES):
        raw   = layer_lines[name]
        fib_w = fib_weights[i]
        # Surface area of this quadrant: tokens × Fibonacci weight = Schwarz Diamond patch area
        quadrant[name] = {
            'weight': fib_w,
            'tokens': raw,
            'surface': raw * fib_w,      # z = tokens · fib  (the quadrant area law)
            'fib':     fib_w,
        }
    return quadrant

# ── Fibonacci Two-Parent Cascade (Schwarz Diamond: z[n] = z[n-1] · z[n-2]) ─
def fibonacci_cascade(points_by_layer: Dict[int, List]) -> Dict[str, List[str]]:
    """
    True Schwarz Diamond inheritance: each layer receives the outputs of the
    TWO previous layers as its parents (not just one).

    z[1] = L1 substrates          (SPARK — the first axis)
    z[2] = L2 substrates          (MIRROR — the second axis)
    z[n] = z[n-1] ∪ z[n-2]       (every subsequent layer inherits both parents)

    This is identical to F(n) = F(n-1) + F(n-2):
    the exponents of x and y in successive quadrant products ARE Fibonacci.
    """
    inherited: Dict[int, List[str]] = {}
    for layer in range(1, 8):
        parent_a = [p.id for p in points_by_layer.get(layer - 1, [])]  # z[n-1]
        parent_b = [p.id for p in points_by_layer.get(layer - 2, [])]  # z[n-2]
        # Union of both parents, deduplicated, ordered
        seen, cascade = set(), []
        for pid in parent_a + parent_b:
            if pid not in seen:
                seen.add(pid)
                cascade.append(pid)
        inherited[layer] = cascade

    total_edges = sum(len(v) for v in inherited.values())
    print(f'  CASCADE     — {total_edges} Fibonacci inheritance edges '
          f'(z[n] = z[n-1] × z[n-2])')
    return inherited

# ── L1 SPARK — Ingest ────────────────────────────────────────────────────────
def spark_ingest(game_dir: Path) -> List[Path]:
    """Collect all source files that belong to this game's dimension."""
    INCLUDE = {'.js', '.html', '.css', '.json'}
    EXCLUDE = re.compile(r'(node_modules|__pycache__|\.git|dist|deploy|\.pyc|test_|run_|debug_)')
    files = []
    for p in sorted(game_dir.rglob('*')):
        if p.is_file() and p.suffix in INCLUDE and not EXCLUDE.search(str(p)):
            files.append(p)
    print(f'  L1 SPARK    — ingested {len(files)} source files')
    return files

# ── L2 MIRROR — Reflect ──────────────────────────────────────────────────────
def mirror_reflect(files: List[Path]) -> Dict[str, dict]:
    """Read each file and extract its surface-level symbol map."""
    reflected = {}
    for p in files:
        try:
            source = p.read_text(encoding='utf-8', errors='replace')
        except Exception:
            continue
        stem   = p.stem
        kind   = detect_kind(stem, p.suffix)
        layer  = detect_layer(stem)
        exports = extract_exports(source) if p.suffix == '.js' else []
        reflected[stem] = {
            'path': str(p), 'stem': stem, 'suffix': p.suffix,
            'kind': kind, 'layer': layer, 'source': source,
            'exports': exports, 'size': len(source.encode('utf-8')),
        }
    print(f'  L2 MIRROR   — reflected {len(reflected)} components')
    return reflected

# ── L3 RELATION — Synthesise (the gyroid surface z = x·y) ───────────────────
def relation_synthesise(reflected: Dict) -> Dict:
    """Build the synthesis map: for each file, which others does it consume?
    This is z = x·y — the intersection of two file-dimensions produces the edge."""
    known = list(reflected.keys())
    synthesis_map = {}
    for stem, info in reflected.items():
        if info['suffix'] != '.js':
            continue
        deps = extract_dependencies(info['source'], [k for k in known if k != stem])
        info['dependencies'] = deps
        if deps:
            synthesis_map[stem] = deps   # z = stem · dep (gyroid connection)
    edge_count = sum(len(v) for v in synthesis_map.values())
    print(f'  L3 RELATION — synthesised {edge_count} gyroid edges (z = x·y connections)')
    return synthesis_map

# ── L4 FORM — Assign LWHX ────────────────────────────────────────────────────
def form_lwhx(info: dict) -> Dict:
    """Assign Fibonacci LWHX descriptor based on helix layer."""
    base = LAYER_LWHX[info['layer'] - 1].copy()
    # X = discrete sub-parts = number of exports (bounded by layer ceiling)
    base['X'] = min(len(info.get('exports', [])), base['X']) or 1
    return base

# ── L5 LIFE — Compile Substrate Bundles ──────────────────────────────────────
def life_compile(reflected: Dict, synthesis_map: Dict) -> List[HelixPoint]:
    """Encode each component into a sealed HelixPoint (the .bfx substrate bundle).

    Schwarz Diamond quadrant law applied here:
    - Each point carries its inner 7-layer quadrant (the part contains the whole).
    - The quadrant is measured by analyse_quadrant() — Fibonacci-weighted token areas.
    """
    # Build points without cascade first (cascade needs all points grouped by layer)
    points = []
    for stem, info in reflected.items():
        raw   = info['source'].encode('utf-8')
        point = HelixPoint(
            id          = stem,
            kind        = info['kind'],
            layer       = info['layer'],
            layer_name  = LAYER_NAMES[info['layer'] - 1],
            lwhx        = form_lwhx(info),
            source_path = info['path'],
            hash        = sha256_hex(raw),
            size_bytes  = info['size'],
            exports     = info.get('exports', []),
            dependencies= info.get('dependencies', []),
            code_b64    = encode_source(info['source']),
            sealed      = True,
            quadrant    = analyse_quadrant(info['source']),  # inner spiral
        )
        points.append(point)
    points.sort(key=lambda p: p.layer)

    # Apply two-parent Fibonacci cascade: z[n] = z[n-1] × z[n-2]
    by_layer: Dict[int, List[HelixPoint]] = {}
    for p in points:
        by_layer.setdefault(p.layer, []).append(p)
    inherited_map = fibonacci_cascade(by_layer)
    for p in points:
        p.inherited = inherited_map.get(p.layer, [])

    print(f'  L5 LIFE     — compiled {len(points)} helix points '
          f'(each carrying inner 7-quadrant spiral)')
    return points

# ── L6 MIND — Minimise ───────────────────────────────────────────────────────
def mind_minimise(points: List[HelixPoint]) -> List[HelixPoint]:
    """Remove duplicate hashes (same content, different path) — minimum material law."""
    seen, pruned = set(), []
    for p in points:
        if p.hash not in seen:
            seen.add(p.hash)
            pruned.append(p)
    removed = len(points) - len(pruned)
    print(f'  L6 MIND     — minimised: removed {removed} duplicates, '
          f'{len(pruned)} unique points remain')
    return pruned

# ── L7 COMPLETION — Emit + Collapse ──────────────────────────────────────────
def completion_emit(game: str, points: List[HelixPoint],
                    synthesis_map: Dict, out_dir: Path) -> Path:
    """Write the helix_index.json and all .bfx substrate files to dist/.

    Schwarz Diamond collapse law:
    At L7 the entire accumulated spiral (all 7 layers, all quadrants, all inherited
    edges) collapses to ONE point — the genesis_seed.bfx.
    That single point is the Void-Seed: L1 of the next helix turn.
    It carries the fingerprint (combined hash) of the whole surface.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    bfx_dir = out_dir / 'substrates'
    bfx_dir.mkdir(exist_ok=True)

    # Write individual .bfx substrate bundles
    for p in points:
        bundle_path = bfx_dir / f'L{p.layer}_{p.id}.bfx'
        bundle_path.write_text(json.dumps(asdict(p), indent=2), encoding='utf-8')

    # Build load order: L1 → L7, alphabetical within each layer
    load_order = [p.id for p in sorted(points, key=lambda x: (x.layer, x.id))]

    # ── L7 COLLAPSE: the whole folds to one point ────────────────────────────
    # Combined hash = SHA-256 of all point hashes in load order (the surface fingerprint)
    combined_raw = ''.join(p.hash for p in sorted(points, key=lambda x: (x.layer, x.id)))
    combined_hash = sha256_hex(combined_raw.encode())
    total_surface = sum(
        cell['surface']
        for p in points
        for cell in p.quadrant.values()
    )
    genesis_seed = {
        'id':            'genesis_seed',
        'kind':          'seed',
        'layer':         7,
        'layer_name':    'COMPLETION',
        'game':          game,
        'surface_hash':  combined_hash,       # fingerprint of the whole spiral
        'total_points':  len(points),         # 21 at full Fibonacci scale
        'total_surface': total_surface,       # sum of all quadrant areas
        'load_order':    load_order,
        'next_seed':     combined_hash[:8],   # first 8 chars become L1 of next turn
        'law':           'z[n]=z[n-1]*z[n-2]',
        'fib_7':         21,                  # the 7th level — Completion
        'collapse':      1,                   # the Void-Seed — L1 of next dimension
        'genesis_note':  (
            'Day 7: the whole is complete. '
            'The surface folds to a point. '
            'The point is the seed of the next turn.'
        ),
    }
    seed_path = out_dir / 'genesis_seed.bfx'
    seed_path.write_text(json.dumps(genesis_seed, indent=2), encoding='utf-8')

    index = HelixIndex(
        game          = game,
        helix_turns   = 2,
        points        = [asdict(p) for p in points],
        synthesis_map = synthesis_map,
        load_order    = load_order,
    )
    index_path = out_dir / 'helix_index.json'
    index_path.write_text(json.dumps(asdict(index), indent=2), encoding='utf-8')

    total_kb = sum(p.size_bytes for p in points) / 1024
    print(f'  L7 COMPLETION — emitted {len(points)} .bfx bundles '
          f'+ genesis_seed.bfx (collapse → 1)')
    print(f'  SURFACE       — {total_kb:.1f} KB  '
          f'{len(synthesis_map)} gyroid edges  '
          f'fingerprint: {combined_hash}')
    return index_path

# ── Main — the helix traversal ───────────────────────────────────────────────
def compile_game(game_dir: str, out_dir: Optional[str] = None):
    src  = Path(game_dir).resolve()
    dist = Path(out_dir).resolve() if out_dir else src / 'dist'
    game = src.name

    print(f'\n🌀 ButterflyFX Compiler — Helix-Gyroid ({game})')
    print(f'   Source:  {src}')
    print(f'   Output:  {dist}')
    print(f'   Law:     z = x·y  (Schwarz Diamond minimal surface)\n')

    files          = spark_ingest(src)                          # L1
    reflected      = mirror_reflect(files)                      # L2
    synthesis_map  = relation_synthesise(reflected)             # L3
    # L4 is embedded inside life_compile (form_lwhx called per point)
    points         = life_compile(reflected, synthesis_map)     # L4+L5
    points         = mind_minimise(points)                      # L6
    index_path     = completion_emit(game, points,              # L7
                                     synthesis_map, dist)

    print(f'\n✅ Manifold sealed → {index_path}')
    print(f'   Run the interpreter to crystallise the build into the game.\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='ButterflyFX Compiler — Helix-Gyroid')
    parser.add_argument('game_dir', help='Path to game source directory')
    parser.add_argument('--out',    help='Output dist directory', default=None)
    args = parser.parse_args()
    compile_game(args.game_dir, args.out)

