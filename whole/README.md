# ButterflyFX Repository

This repository contains the current ButterflyFX code and documentation across four main areas:

- `butterflyfx-core/` — secure Core service scaffold, receipts, and benchmarks
- `butterflyfx_kernel/` — kernel package, tests, and formal docs
- `butterflyfx-games/` — playable game prototypes such as Breakout 3D
- `butterflyfx-ip/` and `DOCS/` — IP, conceptual, and mathematical reference material

## What ButterflyFX aims to do

ButterflyFX is aimed at **storage-free computing for application data**.

The core idea is to store the **generative basis** of computation:

- source code
- kernel and core logic
- manifold definitions
- substrate rules
- policies, receipts, and provenance

Application data is intended to be **derived on demand** from stored structure rather than persisted as redundant canonical state.

## Credibility-first reading order

To keep claims honest, read the docs in this order:

1. `README.md` — repo overview
2. `DOCS/IMPLEMENTATION_STATUS.md` — what is implemented vs conceptual
3. `DOCS/README.md` — documentation map
4. package-specific docs in `butterflyfx-core/`, `butterflyfx_kernel/`, and `butterflyfx-games/`

## Current repo status

The repository is still being cleaned up. The most credible way to read it today is:

- **implemented**: Core scaffold, kernel package, kernel tests, benchmark runner, and browser-playable game prototype
- **conceptual**: creation pattern, proof sketch, and Schwarz-diamond theory docs
- **in progress**: tighter alignment between repository structure, public claims, and verification evidence

## Verification assets

Current verification material includes:

- `butterflyfx_kernel/tests/`
- `butterflyfx-core/butterflyfx_core/benchmarks/`
- `butterflyfx-core/docs/BENCHMARKS.md`
- `butterflyfx-core/docs/RECEIPTS.md`

## Principle for future claims

Claims in this repository should distinguish clearly between:

- what is implemented now
- what is prototype or exploratory
- what is conceptual or mathematical
- what has been benchmarked and independently verified