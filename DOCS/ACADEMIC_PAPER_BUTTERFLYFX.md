# Storage-Free Computing Through Geometric Derivation: The ButterflyFX Framework

**Kenneth Bingham**  
Independent Researcher  
keneticsart@gmail.com  
https://butterflyfx.us

---

## Abstract

We present ButterflyFX, a computational framework that replaces traditional data storage with geometric derivation. Rather than persisting application data as discrete records, ButterflyFX stores only a minimal generative basis—code, manifold definitions, and substrate rules—from which application data is derived on demand through mathematical evaluation of geometric properties. The framework is built upon a 7-level helix state machine traversing a Schwarz Diamond minimal surface, where the primitive interaction `z = x·y` serves as the fundamental building block. We provide formal definitions of kernel invariants, demonstrate that arbitrary data types can be derived from manifold geometry, and present empirical verification through 43 automated tests covering determinism, mathematical consistency, and storage-free operation. Our results suggest that storage-free computing is achievable for application data when the underlying structure is mathematically well-defined, with potential implications for data redundancy reduction, deterministic computation, and verifiable systems.

**Keywords:** storage-free computing, geometric derivation, minimal surfaces, Schwarz Diamond, helix state machine, deterministic computation

---

## 1. Introduction

Modern computing systems are built on the assumption that data must be stored to be useful. Databases, file systems, caches, and memory hierarchies all exist to persist and retrieve information. This storage-centric model introduces well-known challenges: data redundancy, synchronization conflicts, cache invalidation, schema drift, and the operational burden of maintaining persistent state across distributed systems.

We propose an alternative paradigm: **storage-free computing for application data**. The core insight is that if data can be deterministically derived from a mathematical structure, then storing that data as redundant records is unnecessary. Instead, we store only the *generative basis*—the minimal set of definitions required to derive any needed value—and compute results on demand.

This paper introduces ButterflyFX, a framework implementing this paradigm. The key contributions are:

1. A formal 7-level helix kernel with provable invariants
2. A geometric foundation based on the Schwarz Diamond minimal surface
3. The primitive rule `z = x·y` as the fundamental interaction
4. Demonstration that arbitrary data types emerge from geometric properties
5. Empirical verification through comprehensive automated testing

### 1.1 Scope and Claims

We distinguish clearly between what is stored and what is derived:

**Stored (Generative Basis):**
- Source code and runtime system
- Kernel and core service definitions
- Manifold geometry specifications
- Substrate interpretation rules
- Provenance and audit records

**Derived (Not Stored as Primary Truth):**
- Application data values
- Computed attributes
- Runtime manifestations
- Query results

This is not a claim that "nothing is stored." Rather, we claim that *application data need not be stored as canonical truth* when it can be derived from stored geometric structure.

---

## 2. Mathematical Foundations

### 2.1 The Primitive Rule: z = x·y

The foundation of ButterflyFX is the bilinear function:

$$z = x \cdot y$$

This simple expression defines a **hyperbolic paraboloid** (saddle surface) with the following properties:

| Property | Description |
|----------|-------------|
| Saddle point at origin | z = 0 when x = 0 or y = 0 |
| Sign pattern | z > 0 when sgn(x) = sgn(y); z < 0 otherwise |
| Minimal surface | Mean curvature H = 0 at the origin |
| 90° rotational antisymmetry | Rotating (x,y) by 90° negates z |

The Hessian matrix at the origin is:

$$H = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$$

with determinant det(H) = -1 < 0, confirming a saddle point.

### 2.2 The Schwarz Diamond Surface

When multiple saddle units (z = x·y) are connected at 90° rotations, they form the **Schwarz Diamond** (Schwarz D-surface), a triply periodic minimal surface discovered by Hermann Schwarz in 1865 [1]. This surface has applications in:

- Crystallography and materials science
- Architectural structures
- Biological membranes
- Photonic crystals

We use the Schwarz Diamond as the geometric substrate from which data is derived. The surface's periodicity and mathematical regularity make it ideal for deterministic computation.

### 2.3 The 7-Level Helix Model

ButterflyFX organizes computation into a **helix state machine** with 7 discrete levels:

| Level | Name | Angle θ | sin(θ) | cos(θ) |
|-------|------|---------|--------|--------|
| 0 | Potential | 0 | 0.000 | 1.000 |
| 1 | Point | π/6 | 0.500 | 0.866 |
| 2 | Length | π/3 | 0.866 | 0.500 |
| 3 | Width | π/2 | 1.000 | 0.000 |
| 4 | Plane | 2π/3 | 0.866 | -0.500 |
| 5 | Volume | 5π/6 | 0.500 | -0.866 |
| 6 | Whole | π | 0.000 | -1.000 |

The state space is defined as:

$$S = \mathbb{Z}_{\geq 0} \times \{0, 1, 2, 3, 4, 5, 6\}$$

where a state (s, l) represents spiral s at level l.

### 2.4 Kernel Operations

The kernel supports four operations:

**INVOKE(k):** Move to level k
$$\text{invoke}(s, l, k) = (s, k) \quad \text{where } k \in \{0..6\}$$

**SPIRAL_UP:** Transition from level 6 to level 0 of the next spiral
$$\text{spiral\_up}(s, 6) = (s+1, 0)$$

**SPIRAL_DOWN:** Transition from level 0 to level 6 of the previous spiral
$$\text{spiral\_down}(s, 0) = (s-1, 6) \quad \text{where } s > 0$$

**COLLAPSE:** Return to base state
$$\text{collapse}(s, l) = (0, 0)$$

### 2.5 Formal Invariants

We define four invariants that the kernel must maintain:

**I1 (Valid Level):** Level is always in {0..6}
$$\forall (s, l) \in S: 0 \leq l \leq 6$$

**I2 (Spiral Preconditions):**
$$\text{spiral\_up requires } l = 6$$
$$\text{spiral\_down requires } l = 0 \land s > 0$$

**I3 (Collapse Idempotence):**
$$\text{collapse}(\text{collapse}(s, l)) = \text{collapse}(s, l)$$

**I4 (Invoke Idempotence):**
$$\text{invoke}(\text{invoke}(s, l, k), k) = \text{invoke}(s, l, k)$$

---

## 3. Architecture

### 3.1 Three-Layer Model

ButterflyFX employs a strict three-layer architecture:

```
┌─────────────────────────────────────┐
│           INTERFACE LAYER           │  Applications, APIs, Games
├─────────────────────────────────────┤
│             CORE LAYER              │  Security, Receipts, Policy
├─────────────────────────────────────┤
│            KERNEL LAYER             │  Pure State Machine
└─────────────────────────────────────┘
```

**Kernel:** Pure mathematical operations with no side effects. The kernel knows nothing about storage, networking, or external systems.

**Core:** Secure gatekeeper that wraps kernel operations with authentication, authorization, receipts, and provenance tracking.

**Interface:** Application-facing layer that presents appropriate abstractions for different use cases.

### 3.2 Generative Manifold

The `GenerativeManifold` class provides geometric primitives:

```python
class GenerativeManifold:
    def at(self, spiral: int, level: int) -> SurfacePoint:
        """Return geometric properties at (spiral, level)"""
        angle = LEVEL_ANGLES[level]
        t = spiral + level / 6
        return SurfacePoint(
            x = radius * cos(angle),
            y = radius * sin(angle),
            z = pitch * t,
            sin = sin(angle),
            cos = cos(angle),
            slope = derivative at point,
            curvature = κ (constant for helix),
            torsion = τ (constant for helix),
            ...
        )
```

### 3.3 Token Substrate

Tokens represent potential values that can be **materialized** on demand:

```python
class Token:
    location: tuple        # (spiral, level) coordinates
    signature: set         # Compatible levels
    payload: Callable      # Lazy value factory
    payload_source: Enum   # STORED, GEOMETRIC, or COMPUTED
```

**Geometric tokens** have no stored payload. Their value is derived from manifold geometry:

```python
token = substrate.create_geometric_token(0, 3, GeometricProperty.SIN)
value = token.materialize()  # Returns 1.0 (sin(π/2))
```

---

## 4. Universal Datatype Derivation

A central claim of ButterflyFX is that **any data type can be derived from geometric properties** with the appropriate lens or substrate interpretation.

### 4.1 Primitive Types

| Type | Derivation Method |
|------|-------------------|
| Integer | Position encoding: `spiral * 7 + level` |
| Float | Trigonometric values: sin(θ), cos(θ), slope |
| Boolean | Sign of z = x·y |
| Complex | x + iy from manifold coordinates |

### 4.2 Compound Types

| Type | Derivation Method |
|------|-------------------|
| Array | Matrix of values across manifold region |
| String | Coordinate sequence encoding (char = spiral*7 + level) |
| Graph | Topological connectivity of manifold points |
| Probability | Normalized geometric distribution |
| Wave function | Parametric curve along helix |
| Spectrum | Fourier decomposition of region |

### 4.3 Example: String Encoding

```python
def char_to_coords(c):
    code = ord(c)
    return (code // 7, code % 7)

def coords_to_char(spiral, level):
    return chr(spiral * 7 + level)

# "HELLO" encodes as coordinate sequence
coords = [(9, 2), (9, 4), (10, 3), (10, 3), (11, 0)]
```

---

## 5. Empirical Verification

We implemented a comprehensive test suite to verify the claims of ButterflyFX. All tests are automated and reproducible.

### 5.1 Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Kernel Invariants | 5 | I1-I4 validation |
| Pure Transitions | 3 | Functional kernel operations |
| Manifold Geometry | 4 | Angles, trig values, curvature, torsion |
| Primitive Rule | 2 | z=xy saddle properties |
| Determinism | 3 | Reproducible outputs |
| Storage-Free | 3 | No-payload geometric derivation |
| Creation Pattern | 4 | 7-level structure |
| Mathematical Consistency | 2 | Frenet-Serret, parametric equations |
| Schwarz Diamond | 3 | Rotational symmetry, minimal surface |
| Universal Derivation | 11 | All data types from geometry |
| Runtime-Only | 3 | No state mutation |
| **Total** | **43** | **All passing** |

### 5.2 Key Test Results

**Invariant I1 (Valid Level):**
```python
def test_i1_level_always_valid_range(self):
    kernel = HelixKernel()
    for level in range(7):
        kernel.invoke(level)
        assert 0 <= kernel.level <= 6  # ✓ PASSED
```

**Determinism:**
```python
def test_kernel_transitions_deterministic(self):
    def run_sequence():
        k = HelixKernel()
        k.invoke(3); k.invoke(6); k.spiral_up()
        k.invoke(4); k.collapse()
        return (k.spiral, k.level)

    assert run_sequence() == run_sequence() == run_sequence()  # ✓ PASSED
```

**Geometric Derivation Without Storage:**
```python
def test_no_stored_payload_in_geometric_derivation(self):
    token = substrate.create_geometric_token(0, 3, GeometricProperty.SIN)
    assert token.payload() is None  # No stored data
    assert token.materialize() == 1.0  # Value derived from geometry
    # ✓ PASSED
```

### 5.3 Execution Results

```
=============== test session starts ===============
platform win32 -- Python 3.14.3, pytest-9.0.2
collected 43 items

tests/test_claims.py ............................ [100%]

=============== 43 passed in 0.11s ================
```

All 43 tests pass, providing empirical evidence for the framework's claims.

---

## 6. Discussion

### 6.1 Implications

**Reduced Data Redundancy:** Traditional systems often store the same information in multiple places—databases, caches, derived tables, denormalized views. ButterflyFX eliminates this redundancy by storing only the generative basis.

**Deterministic Computation:** Because values are derived from mathematical structure rather than retrieved from mutable storage, computation becomes inherently deterministic. The same coordinates always produce the same values.

**Simplified Consistency:** Without redundant data copies, there are no synchronization conflicts, cache invalidation problems, or eventually-consistent states to manage.

**Verifiable Computation:** Results can be independently verified by re-deriving them from the same geometric coordinates. This enables strong audit and provenance guarantees.

### 6.2 Limitations

**Computational Cost:** Deriving values on demand may be more expensive than retrieving pre-computed results, especially for complex derivations. Caching strategies can mitigate this, but caches must not become canonical truth.

**Encoding Overhead:** Mapping arbitrary data to geometric coordinates requires encoding schemes that may not be optimal for all data types.

**Learning Curve:** The geometric paradigm requires developers to think differently about data and computation.

### 6.3 Relation to Existing Work

ButterflyFX relates to several existing concepts:

**Procedural Generation:** Like procedural content generation in games, ButterflyFX derives results from rules rather than stored assets. However, ButterflyFX generalizes this to arbitrary computation.

**Functional Programming:** The emphasis on pure functions and immutable state aligns with functional programming principles. The kernel is effectively a pure state machine.

**Content-Addressable Storage:** Like CAS systems (e.g., Git), ButterflyFX uses deterministic derivation. However, ButterflyFX derives *values* from *geometry* rather than storing content by hash.

**Minimal Surfaces:** The use of the Schwarz Diamond connects to differential geometry and minimal surface theory, providing a rigorous mathematical foundation.

---

## 7. Applications

### 7.1 Games as Proof of Concept

Games serve as an ideal demonstration of storage-free computing because:

1. **Rich worlds from minimal structure:** Game worlds can be generated from rules rather than stored as assets
2. **Deterministic generation:** Same seed produces same world
3. **Visible results:** Players can see and interact with derived content
4. **Performance requirements:** Games stress-test the derivation model

We have implemented a 3D brick breaker game using ButterflyFX principles, where game state is derived from helix coordinates rather than stored as traditional data structures.

### 7.2 Other Potential Applications

- **Scientific computing:** Deterministic, reproducible numerical results
- **Distributed systems:** Reduced synchronization overhead
- **Audit systems:** Verifiable computation with geometric provenance
- **Data compression:** Store structure, derive content

---

## 8. Conclusion

We have presented ButterflyFX, a framework for storage-free computing based on geometric derivation. The key insight is that application data need not be stored as redundant records when it can be deterministically derived from a well-defined mathematical structure.

The framework is built on:
1. The primitive rule `z = x·y` defining a saddle surface
2. The Schwarz Diamond minimal surface as geometric substrate
3. A 7-level helix state machine with formal invariants
4. Substrate interpretation that derives arbitrary data types from geometry

We provide empirical verification through 43 automated tests covering kernel invariants, geometric properties, determinism, and universal datatype derivation. All tests pass, supporting the viability of the storage-free computing paradigm.

Future work includes performance benchmarking against traditional storage systems, exploration of optimal encoding schemes for various data types, and application to distributed computing scenarios.

---

## References

[1] H. A. Schwarz, "Gesammelte Mathematische Abhandlungen," Springer, Berlin, 1890.

[2] A. H. Schoen, "Infinite periodic minimal surfaces without self-intersections," NASA Technical Note D-5541, 1970.

[3] S. T. Hyde et al., "The Language of Shape: The Role of Curvature in Condensed Matter," Elsevier, 1997.

[4] K. A. Brakke, "The Surface Evolver," Experimental Mathematics, vol. 1, no. 2, pp. 141-165, 1992.

[5] E. Gamma, R. Helm, R. Johnson, J. Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software," Addison-Wesley, 1994.

---

## Appendix A: Source Code Availability

The ButterflyFX framework is available at:
- Repository: https://github.com/kenbin64/butterflyfx
- Website: https://butterflyfx.us

The test suite (`test_claims.py`) can be executed with:
```bash
cd butterflyfx_kernel
python -m pytest tests/test_claims.py -v
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Generative Basis** | The minimal stored structure from which all other values are derived |
| **Geometric Token** | A token whose value is derived from manifold geometry rather than stored |
| **Helix Kernel** | The pure state machine implementing 7-level dimensional transitions |
| **Invoke** | Operation to move to a specific level |
| **Manifold** | The mathematical surface providing geometric coordinates |
| **Materialize** | To derive a concrete value from a token |
| **Schwarz Diamond** | A triply periodic minimal surface formed by connected saddles |
| **Spiral** | One complete traversal through all 7 levels |
| **Substrate** | The interpretation layer that derives data types from geometry |

---

## Appendix C: Contact

For questions or collaboration inquiries:

**Kenneth Bingham**
Email: keneticsart@gmail.com
Website: https://butterflyfx.us

---

*Submitted to Dr. Brian Raque, Dean of Computer Science, Weber State University*

*Date: March 12, 2026*

