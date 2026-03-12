# ButterflyFX Implementation Status

This document separates current implementation from conceptual intent.

## Implemented in the repository today

### 1. Core service scaffold
- FastAPI-style service under `butterflyfx-core/butterflyfx_core/core_service/`
- receipt/signing support under `security.py`
- derivation examples such as pi and primes lenses
- benchmark runner and scenarios under `butterflyfx-core/butterflyfx_core/benchmarks/`

### 2. Kernel package
- Python package under `butterflyfx_kernel/butterflyfx/`
- kernel tests under `butterflyfx_kernel/tests/`
- formal kernel/spec/security docs under `butterflyfx_kernel/docs/`

### 3. Games prototype
- browser-playable Breakout 3D prototype under `butterflyfx-games/`
- local development server in `butterflyfx-games/dev_server.py`
- game design and physics docs under `butterflyfx-games/docs/`

### 4. Conceptual and mathematical docs
- creation pattern, proof sketch, and Schwarz-diamond docs under `DOCS/`

## Current evidence in the repo

- kernel unit tests
- Core benchmark runner and benchmark documentation
- receipt/provenance documentation
- runnable local game prototype

## Not yet evidenced strongly enough for a hard claim

- live end-to-end game integration with the Core service
- proof that application data is fully derived from manifold structure across real apps
- reproducible benchmark archives with environment manifests and comparison baselines
- a fully cleaned repo scope matching the final public positioning

## Credibility rules for this repo

- mark implemented behavior separately from conceptual architecture
- do not claim integration that the code does not currently perform
- do not claim benchmark results without run artifacts and commands
- prefer tests, receipts, and reproducible runs over visionary wording

## Practical reading of ButterflyFX today

ButterflyFX currently reads best as:

- an implemented kernel package
- an implemented Core service scaffold with benchmark tooling
- an implemented browser game prototype
- a broader conceptual system that is still being tightened and verified