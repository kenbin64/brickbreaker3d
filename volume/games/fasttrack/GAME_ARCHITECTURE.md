# Fast Track — Game Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FAST TRACK GAME                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   LANDING   │  │    LOBBY    │  │    GAME     │  │   RESULTS   │ │
│  │    PAGE     │→ │   SYSTEM    │→ │   ENGINE    │→ │   SCREEN    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      CORE SYSTEMS                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   P2P    │  │  PLAYER  │  │  AVATAR  │  │  GUILD   │            │
│  │  SYSTEM  │  │ PROFILES │  │  SYSTEM  │  │  SYSTEM  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│                     RENDERING LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   THREE.JS 3D ENGINE                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │   │
│  │  │  BOARD  │  │  PEGS   │  │ CAMERAS │  │ EFFECTS │          │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                   BUTTERFLYFX SUBSTRATE                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Dimensional State Management | Token System | SRL Registry   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Player Configuration

### Player Limits
```javascript
const PLAYER_CONFIG = {
  minPlayers: 2,
  maxPlayers: 4,
  minForSession: 3,      // 3 players needed to CREATE a session
  maxHumans: 4,
  maxAI: 4,
  pegsPerPlayer: 4
};
```

### Player Colors (4-Player Mode)
| Seat | Color | Hex | Corner |
|------|-------|-----|--------|
| 1 | Red | #e74c3c | 1 |
| 2 | Orange | #f39c12 | 2 |
| 3 | Green | #27ae60 | 3 |
| 4 | Blue | #3498db | 4 |

---

## 2. Multiplayer P2P System

### WebRTC Architecture (Serverless)
```
┌──────────┐         ┌──────────┐
│ Player 1 │◄───────►│ Player 2 │
│  (Host)  │    ▲    │          │
└────┬─────┘    │    └────┬─────┘
     │          │         │
     │    ┌─────┴─────┐   │
     └───►│ Player 3  │◄──┘
          └─────┬─────┘
                │
          ┌─────▼─────┐
          │ Player 4  │
          └───────────┘
```

### Connection Flow
1. **Host creates session** → Generates session code
2. **Players join** → Enter session code
3. **WebRTC handshake** → Direct peer connections
4. **Game state sync** → Host authoritative, peers validate

### State Synchronization
```javascript
// Game state packet
{
  type: 'GAME_STATE',
  turn: 5,
  currentPlayer: 'player_2',
  deck: [...],  // Encrypted deck state
  pegs: {
    red: [{hole: 'red_001_outer', status: 'playing'}, ...],
    orange: [...],
    green: [...],
    blue: [...]
  },
  drawnCard: null,  // Only visible to current player
  timestamp: 1740000000000
}
```

---

## 3. Progression System

### Experience Points (XP)
| Action | XP Gained |
|--------|-----------|
| Win game | +100 |
| Complete game (any result) | +25 |
| Cut opponent | +5 |
| Enter Fast Track | +10 |
| Escape Bullseye | +15 |
| First peg home | +20 |

### Medallion Levels
| Level | Name | XP Required | Badge |
|-------|------|-------------|-------|
| 1 | Bronze | 0 | 🥉 |
| 2 | Silver | 500 | 🥈 |
| 3 | Gold | 2,000 | 🥇 |
| 4 | Platinum | 5,000 | 💎 |
| 5 | Diamond | 15,000 | 💠 |

### Prestige System
After reaching Diamond, players can "Prestige" to reset XP and earn a prestige star ⭐

---

## 4. Player Profile

### Profile Data Structure
```javascript
{
  id: 'uuid',
  displayName: 'CoolPlayer99',  // No real names
  avatar: {
    face: 'face_012',
    torso: 'torso_008',
    skinTone: '#d2a67b',
    hairStyle: 'hair_short_curly',
    hairColor: '#2c1810',
    clothing: 'shirt_casual_blue',
    accessories: ['glasses_round']
  },
  stats: {
    gamesPlayed: 147,
    wins: 42,
    winRate: 0.286,
    totalXP: 3420,
    currentXP: 1420,  // XP in current level
    medallion: 'gold',
    prestige: 0,
    cutsDealt: 89,
    cutsTaken: 67,
    fasttracksEntered: 34,
    bullseyeEscapes: 12
  },
  friends: ['friend_uuid_1', 'friend_uuid_2'],
  guild: 'guild_uuid',
  createdAt: '2026-01-15T00:00:00Z'
}
```

---

## 5. Avatar System

### Customization Options
```javascript
const AVATAR_OPTIONS = {
  faces: {
    shapes: ['round', 'oval', 'square', 'heart', 'long'],
    eyes: ['almond', 'round', 'hooded', 'monolid', 'upturned'],
    noses: ['button', 'straight', 'wide', 'pointed', 'flat'],
    mouths: ['full', 'thin', 'wide', 'small', 'heart']
  },
  skinTones: [
    '#ffe4c4', '#f5d0b9', '#d2a67b', '#c68642', 
    '#8d5524', '#5c3317', '#3c1f0a'
  ],
  hairStyles: {
    short: ['buzz', 'crew', 'spiky', 'curly_short', 'wavy_short'],
    medium: ['bob', 'shoulder', 'layered', 'curly_med', 'braids'],
    long: ['straight', 'wavy', 'curly', 'ponytail', 'buns'],
    none: ['bald', 'shaved']
  },
  hairColors: [
    '#000000', '#2c1810', '#4a3728', '#8b4513',
    '#daa520', '#ffd700', '#ff6b6b', '#9b59b6', '#3498db'
  ],
  clothing: {
    casual: ['tshirt', 'hoodie', 'polo', 'sweater'],
    formal: ['dress_shirt', 'blazer', 'suit'],
    cultural: ['dashiki', 'kimono', 'sari_top', 'lederhosen'],
    fun: ['jersey', 'tanktop', 'graphic_tee']
  },
  accessories: ['none', 'glasses_round', 'glasses_square', 'sunglasses', 
                'earrings', 'necklace', 'headband', 'hat']
};
```

---

## 6. Emote System

### Available Emotes
| Key | Emote | Description | Animation |
|-----|-------|-------------|-----------|
| 1 | 🎉 | Celebration | Confetti burst |
| 2 | 🍷 | Gloating | Raising glass |
| 3 | ⏰ | Hurry up | Tapping watch |
| 4 | 👎 | Disapproval | Thumbs down |
| 5 | 😰 | Distraught | Sweating face |
| 6 | 👏 | Applause | Clapping hands |

### Emote Cooldown
- 5 second cooldown between emotes
- Emotes visible to all players
- Animation plays on sender's avatar

---

## 7. Guild System

### Guild Structure
```javascript
{
  id: 'guild_uuid',
  name: 'The Card Sharks',
  tag: '[SHARK]',
  description: 'Family guild for competitive play',
  emblem: 'shark_01',
  members: [
    { id: 'player_1', role: 'leader', joinedAt: '...' },
    { id: 'player_2', role: 'officer', joinedAt: '...' },
    { id: 'player_3', role: 'member', joinedAt: '...' }
  ],
  stats: {
    totalWins: 234,
    gamesPlayed: 890,
    averageWinRate: 0.263
  },
  createdAt: '2026-01-01T00:00:00Z'
}
```

### Guild Features
- Max 20 members
- Leader can promote/demote officers
- Officers can invite members
- Guild chat (separate from game)
- Guild leaderboard

---

## 8. Chat & Communication

### Friends-Only Chat
- Chat only available between friends
- No general/public chat
- In-game chat limited to emotes for non-friends

### Friend System
- Send/receive friend requests
- Accept/decline requests
- Block players
- Friends list with online status

---

## 9. File Structure

```
web/games/fasttrack/
├── index.html              # Landing page
├── game.html               # Main game page
├── lobby.html              # Session lobby
├── profile.html            # Player profile/avatar
│
├── js/
│   ├── core/
│   │   ├── substrate.js    # ButterflyFX substrate
│   │   ├── game-engine.js  # Core game logic
│   │   └── legal-moves.js  # Move validation
│   │
│   ├── rendering/
│   │   ├── board-3d.js     # Three.js board renderer
│   │   ├── pegs-3d.js      # Peg rendering & animation
│   │   ├── camera.js       # Camera controls
│   │   └── effects.js      # Particles, animations
│   │
│   ├── multiplayer/
│   │   ├── p2p.js          # WebRTC peer connections
│   │   ├── signaling.js    # Initial handshake
│   │   ├── state-sync.js   # Game state synchronization
│   │   └── ai-player.js    # AI opponent logic
│   │
│   ├── ui/
│   │   ├── player-panel.js # Player cards/pegs UI
│   │   ├── emotes.js       # Emote system
│   │   ├── avatar.js       # Avatar rendering
│   │   └── hud.js          # Heads-up display
│   │
│   └── social/
│       ├── friends.js      # Friend system
│       ├── guilds.js       # Guild management
│       └── profiles.js     # Player profiles
│
├── css/
│   ├── game.css
│   ├── lobby.css
│   └── avatar.css
│
├── assets/
│   ├── avatars/
│   ├── cards/
│   ├── sounds/
│   └── textures/
│
├── data/
│   ├── board_holes.json
│   └── fasttrack_game_spec.json
│
└── docs/
    ├── FASTTRACK_RULES.md
    └── GAME_ARCHITECTURE.md
```

---

## 10. Steam Integration (Future)

### Steamworks Features
- Steam authentication
- Cloud saves for profiles
- Achievements
- Trading cards
- Leaderboards
- Steam overlay
- Workshop support (custom boards?)

### Steam Requirements
- Steam SDK integration
- Electron or native wrapper
- Steam store page assets
- Community hub setup

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| 3D Rendering | Three.js |
| UI Framework | Vanilla JS + CSS |
| P2P Networking | WebRTC (PeerJS) |
| Local Storage | IndexedDB |
| State Management | ButterflyFX Substrate |
| Audio | Web Audio API |
| Build | Vite (optional) |

---

*Fast Track © ButterflyFX — Built on the Dimensional Substrate*
