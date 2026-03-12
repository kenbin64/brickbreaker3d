# ButterflyFX Games

Experimental 3D game prototypes exploring ButterflyFX ideas through playable demos.

**Flagship**: Breakout 3D — a browser-based 3D arena game prototype with physics, camera movement, HUD, and audio.

## Current status

- current prototype runs as static HTML/CSS/JavaScript with Three.js
- local play works through a simple development server
- this folder is best treated as a **proof-of-concept prototype**, not yet as a fully Core-integrated product
- future Core-backed derivation is an intended direction, not a claim of current default behavior

## Quick Start (Local)

```bash
git clone https://github.com/kenbin64/butterflyfx-games.git
cd butterflyfx-games
python -m http.server 8000
# Open http://127.0.0.1:8000/breakout3d.html
```

## VPS Deployment

See [DEPLOY.md](docs/DEPLOY.md) for complete VPS deployment instructions.

## Features implemented now

- **Breakout 3D**: Immersive first-person 3D breakout game
  - High-quality graphics (Three.js, WebGL)
  - Dynamic camera (auto-follow ball, manual control)
  - Physics-based gameplay (gravity, energy, collisions)
  - Colorful crystal bricks, reflective paddle, shiny steel ball
  - Space backdrop with procedural stars
  - Scoring system and level progression

- **Prototype focus**: visual and interaction proof-of-concept for ButterflyFX game ideas

## Controls

- **Mouse**: Move paddle
- **Space**: Launch ball
- **C**: Toggle camera mode (Auto ↔ Manual)
- **Arrow Keys**: Manual camera rotation

## Architecture today

- **Frontend**: HTML5 + Three.js
- **Local server**: Python static server for development
- **Core integration**: future path, not current default runtime path

## Documentation

- [BREAKOUT3D_DESIGN.md](docs/BREAKOUT3D_DESIGN.md) — Design specification
- [GAME_DESIGN.md](docs/GAME_DESIGN.md) — Dimensional game design principles
- [PHYSICS_MODEL.md](docs/PHYSICS_MODEL.md) — Physics equations and energy system
- [DEPLOY.md](docs/DEPLOY.md) — VPS deployment guide

## Credibility note

This README describes the game as it exists today: a playable prototype. Claims about full storage-free execution, live Core-backed derivation, or production-scale concurrency should be treated as future goals unless backed by code, tests, and benchmark artifacts in this repo.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Author

Kenneth Bingham — ButterflyFX
