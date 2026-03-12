# Fast Track — Mobile Setup UX Governing Document

> **Version:** 1.0  
> **Date:** February 25, 2026  
> **Scope:** All game setup workflows on mobile (smartphone/tablet)  
> **Principle:** Each view has ONE concern. Action buttons always visible. Zero scrolling to act.

---

## 1. Core UX Laws

| # | Law | Rationale |
|---|-----|-----------|
| 1 | **One Concern Per View** | A screen asks ONE question or shows ONE group of related choices. Never mix concerns (e.g., avatar + difficulty on the same screen). |
| 2 | **Action Button Always in Viewport** | All primary actions (Start, Next, Enter, Join, Create) are **pinned to the top** of the page inside a sticky header bar. The player never scrolls to find the action button. |
| 3 | **No Scrolling Unless Paged** | If content would require scrolling, it MUST be paginated (swipe/arrow pages) — never a long scroll. Exception: a single settings screen with ≤6 toggle-style items. |
| 4 | **Progressive Disclosure** | Only show what matters NOW. Don't show difficulty options when the player hasn't chosen a game mode yet. |
| 5 | **Smart Defaults** | Every choice has a pre-selected default so the player can hit "Start" immediately without touching anything. Saved preferences override defaults. |
| 6 | **Thumb-Friendly Targets** | All touch targets ≥ 48px height. Cards/buttons spaced ≥ 8px apart. |
| 7 | **Maximum 3 Steps to Game** | From landing → in-game in ≤3 taps for any play mode. |

---

## 2. Entry Points (Landing Page → Game)

The landing page (`index.html`) surfaces three clear paths:

```
┌──────────────────────────────────────────┐
│            🎯 FAST TRACK                 │
│         The Ultimate Board Game          │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 🤖       │ │ 🔒       │ │ 🌐       │ │
│  │ Play AI  │ │ Private  │ │ Online   │ │
│  │          │ │ Game     │ │ Lobby    │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────┘
```

| Button | Destination | Purpose |
|--------|-------------|---------|
| **Play AI** | `ai_setup.html` | Solo game vs 1-3 AI bots |
| **Private Game** | `board_3d.html?mode=private` | Create/join with code |
| **Online Lobby** | `lobby.html` | Auth → find/create public games |

---

## 3. Workflow A — Solo vs AI (`ai_setup.html`)

### Flow Diagram

```
[Landing] → [AI Setup: Step Flow] → [board_3d.html → Game]

Step Flow (single-concern screens):
  View 1: Profile (Name + Avatar)     ← Action: "Next →"
  View 2: Game Settings (Difficulty + Players)  ← Action: "🚀 Start Game"
```

### View 1 — Profile

**Sticky Top Bar:**
```
┌─────────────────────────────────────┐
│  ← Back     Profile     [Next →]   │
└─────────────────────────────────────┘
```

**Body (no scroll):**
```
┌─────────────────────────────────────┐
│  Your Name                          │
│  ┌─────────────────────────────┐    │
│  │ [text input]                │    │
│  └─────────────────────────────┘    │
│                                     │
│  Avatar   [🎮 current]             │
│  ┌──────────────────────────────┐   │
│  │ [category tabs: People|      │   │
│  │  Animals|Fantasy|Food|Obj]   │   │
│  │                              │   │
│  │ PAGE 1 of N                  │   │
│  │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐   │   │
│  │ │😀││😃││😄││😁││😆││😅│   │   │
│  │ └──┘└──┘└──┘└──┘└──┘└──┘   │   │
│  │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐   │   │
│  │ │😂││🤣││😊││😇││🙂││🙃│   │   │
│  │ └──┘└──┘└──┘└──┘└──┘└──┘   │   │
│  │         [◀ 1/3 ▶]            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Avatar Paging Rules:**
- Grid: 6 columns × max 3 rows = **18 avatars per page**
- If a category has >18 items → paginate with `◀ 1/N ▶` controls
- Swipe left/right also navigates pages
- Category tabs are horizontal scroll (no wrap) — always visible without scroll
- Selected avatar shows with highlight border + appears in preview circle

### View 2 — Game Settings

**Sticky Top Bar:**
```
┌──────────────────────────────────────┐
│  ← Back    Settings   [🚀 Start]    │
└──────────────────────────────────────┘
```

**Body (no scroll — fits in viewport):**
```
┌──────────────────────────────────────┐
│  ⚔️ Difficulty                       │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ 😊     │ │ 🎯     │ │ 🔥     │   │
│  │ Easy   │ │ Normal │ │ Hard   │   │
│  └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐              │
│  │ 🏆     │ │ 🔥👹   │              │
│  │ Expert │ │Warpath │              │
│  └────────┘ └────────┘              │
│                                      │
│  👥 Players                          │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │   2    │ │   3    │ │   4    │   │
│  │ vs 1AI │ │ vs 2AI │ │ vs 3AI │   │
│  └────────┘ └────────┘ └────────┘   │
└──────────────────────────────────────┘
```

**Rules:**
- Difficulty + Players fit in one viewport (no scroll needed)
- Pre-selected defaults: Normal difficulty, 2 players
- Tapping "Start" saves name/avatar to localStorage and navigates to `board_3d.html` with URL params

### Tap Count: **3 taps** (Landing → Next → Start) or **2 taps** (Landing → Start, if defaults are fine)

---

## 4. Workflow B — Private Game (Create or Join)

### Flow Diagram

```
[Landing: "Private Game"] → [Choose: Create or Join]

CREATE PATH:
  View 1: Create Game (shows code immediately)  ← Action: share code / wait
  View 2: Lobby (waiting room)                   ← Action: "Start Game"

JOIN PATH:
  View 1: Enter Code                             ← Action: "Join →"
  View 2: Lobby (waiting room)                   ← Action: "Ready"
```

### View: Choose Create or Join

**Sticky Top Bar:**
```
┌────────────────────────────────────┐
│  ← Back     Private Game           │
└────────────────────────────────────┘
```

**Body (2 big buttons — no scroll):**
```
┌────────────────────────────────────┐
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🎮  Create New Game         │  │
│  │  Get a code to share         │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  🎟️  Join with Code          │  │
│  │  Enter a friend's code       │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

### View: Join with Code

**Sticky Top Bar:**
```
┌────────────────────────────────────────┐
│  ← Back     Join Game    [Join →]      │
└────────────────────────────────────────┘
```

**Body:**
```
┌────────────────────────────────────┐
│                                    │
│     Enter the 6-digit code         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │       [_ _ _ _ _ _]         │  │
│  └──────────────────────────────┘  │
│                                    │
│     Ask your friend for the code   │
│                                    │
└────────────────────────────────────┘
```

### View: Create Game (Settings → Code)

**Sticky Top Bar:**
```
┌─────────────────────────────────────────┐
│  ← Back    Create Game   [Create →]     │
└─────────────────────────────────────────┘
```

**Body (all fits without scroll — max 4 settings):**
```
┌────────────────────────────────────┐
│                                    │
│  Max Players         [2] [3] [4]   │
│                                    │
│  Allow AI Bots       [toggle ON]   │
│                                    │
│  Allow Late Joiners  [toggle ON]   │
│                                    │
└────────────────────────────────────┘
```

After tapping "Create →", transitions immediately to the **Lobby Waiting Room**.

### View: Lobby Waiting Room (Shared by host & joiners)

**Sticky Top Bar:**
```
┌────────────────────────────────────────────┐
│  ← Leave   Lobby   [▶ Start Game]         │  ← Host only; joiners see [✓ Ready]
└────────────────────────────────────────────┘
```

**Body:**
```
┌────────────────────────────────────────┐
│  Code: ABC123        [📋 Copy] [📱]   │
│                                        │
│  Players (2/4)                         │
│  ┌──────────────────────────────────┐  │
│  │ 🦊 You (Host)          ✅ Ready  │  │
│  │ 🐢 PlayerName          ⬜ ...    │  │
│  │ ⬜ Waiting...                     │  │
│  │ ⬜ Waiting...                     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  💬 Chat                               │
│  ┌──────────────────────────────────┐  │
│  │ [chat messages]                  │  │
│  │ [input] [Send]                   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Rules:**
- Share buttons (WhatsApp, SMS, Copy) are inline — NOT a separate view
- Chat is collapsible (tap header to expand/collapse) — defaults collapsed on mobile
- "Start Game" only enabled when ≥2 players ready (host is auto-ready)
- Host settings (Add AI Bot, music toggle) are inline buttons — NOT a separate screen

---

## 5. Workflow C — Online Lobby (`lobby.html`)

### Flow Diagram

```
[Landing: "Online Lobby"] → [Auth Screen]

GUEST PATH (no account):
  → [Create Private] or [Join Private] or [Play AI] (same as Workflow A/B)

LOGGED-IN PATH:
  → [Main Lobby: Quick Actions + Available Games]

Quick Match:
  View 1: Main Lobby                    ← Action: "Quick Match"
  View 2: Matchmaking (searching...)    ← Action: "Cancel"
  View 3: Auto-join → Game

Private from Lobby:
  View 1: Main Lobby                    ← Action: "Private Game"
  → Same as Workflow B from here

Join Available Game:
  View 1: Main Lobby → tap a game row   ← Action: "Join"
  View 2: Lobby Waiting Room            ← Action: "Ready"
```

### Auth Screen

**Layout (no scroll — two focused forms):**
```
┌────────────────────────────────────┐
│        🎯 Fast Track               │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [Login] [Register]  ← tabs   │  │
│  │                              │  │
│  │ Username [___________]       │  │
│  │ Password [___________]       │  │
│  │                              │  │
│  │ [Login Button]               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ──── or play without login ────   │
│                                    │
│  [🔒 Private Game] [🤖 Play AI]   │
└────────────────────────────────────┘
```

### Main Lobby (Logged In)

**Sticky Top Bar:**
```
┌────────────────────────────────────────┐
│  🎯 Fast Track          [👤 Profile]   │
└────────────────────────────────────────┘
```

**Body:**
```
┌────────────────────────────────────────┐
│  Quick Actions                         │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ ⚡     │ │ 🔒     │ │ 🤖     │     │
│  │ Quick  │ │Private │ │ vs AI  │     │
│  │ Match  │ │ Game   │ │        │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  Available Games                       │
│  ┌──────────────────────────────────┐  │
│  │ 🟢 Ken's Game   2/4   [Join]    │  │
│  │ 🟢 Sarah's Game 3/4   [Join]    │  │
│  │ 🟡 Mike's Game  4/4   Full      │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Rules:**
- Quick actions are ≤3 big cards — no scroll
- Game list is a simple vertical list — scrollable if >4 games
- Each game row: status dot, name, player count, join button
- Tapping "Join" goes directly to the Lobby Waiting Room

---

## 6. Workflow D — board_3d.html Start Screen (Direct Load)

When `board_3d.html` is loaded directly (no URL params from ai_setup.html),
it shows its own built-in start screen. This screen follows the same laws.

### Flow (Simplified — replaces the current overloaded start screen)

```
View 1: Choose Play Mode
  ┌────────────────────────────────────────┐
  │        🎯 FAST TRACK                   │
  │                                        │
  │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
  │  │ 🤖 Solo  │ │ 🔒 Code  │ │ ⚡ Qck │ │
  │  │  vs AI   │ │  Join    │ │ Match  │ │
  │  └──────────┘ └──────────┘ └────────┘ │
  │                                        │
  │  [📚 Tutorial]  [📜 Rules]            │
  └────────────────────────────────────────┘

  Solo → Opens ai_setup.html (redirect)
  Code Join → Shows code entry inline
  Quick Match → Starts matchmaking
```

**Current Problem:** The start screen in `board_3d.html` has:
- Game mode selector (3 modes) ✓
- Matchmaking status ✗ (mixed in)
- Private game settings (4 toggles + host/join) ✗ (mixed in)
- Solo setup (player cards + difficulty) ✗ (mixed in)
- Full rules panel (10 rules) ✗ (causes massive scroll)
- Start button **AT THE BOTTOM** ✗ (below fold)

**Fix:** The board_3d.html start screen should ONLY be a mode picker that routes to the correct flow. All setup happens on dedicated pages/views.

---

## 7. Avatar Picker — Paging Specification

### Grid Layout
- **Columns:** 6 (fits 48px avatars + 6px gap on 320px+ screens)
- **Rows per page:** 3 (keeps total grid height ≤ 180px)
- **Avatars per page:** 18

### Pagination
```
Category: [People] [Animals] [Fantasy] [Food] [Objects]
                    ↕ horizontal scroll tabs

┌─────────────────────────────────────┐
│  😀 😃 😄 😁 😆 😅                │
│  😂 🤣 😊 😇 🙂 🙃                │
│  😉 😌 😍 🥰 😘 😗                │
│                                     │
│       ◀  Page 1 of 3  ▶            │
└─────────────────────────────────────┘
```

### Interaction
- Tap avatar → selects it (border highlight + preview update)
- Tap `▶` or swipe left → next page
- Tap `◀` or swipe right → previous page
- Switching category resets to page 1
- Touch target: each avatar cell ≥ 48×48px

---

## 8. Action Button Placement — Specification

### Rule: ALL primary action buttons live in the sticky top bar.

```css
.top-bar {
    position: sticky;  /* or fixed */
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(13, 17, 23, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
```

### Button Hierarchy
| Button | Position | Style |
|--------|----------|-------|
| Back (←) | Left | Ghost/transparent |
| Title/Step label | Center | Bold text |
| Primary Action (Next/Start/Join/Create) | **Right** | Red gradient, bold, 10px+ padding |

### Never place these buttons:
- Below the fold
- Inside scrollable content
- In a footer
- Requiring scroll to reach

---

## 9. Settings Screen — Single Page Rules

Settings that can share one screen (no scroll required — fits in viewport):

| Setting | Control Type | Default |
|---------|-------------|---------|
| Difficulty | 5 card buttons (2×3 grid) | Normal |
| Player Count | 3 card buttons (inline) | 2 |
| Music for All | Toggle switch | ON |
| Allow Bots | Toggle switch | ON |
| Allow Late Joiners | Toggle switch | ON |

If adding any setting would cause the page to scroll on a 667px height screen (iPhone SE), it must go on a separate view.

---

## 10. File Responsibilities

| File | Responsibility |
|------|---------------|
| `index.html` | Landing page — 3 play-mode entry buttons + marketing content |
| `ai_setup.html` | Solo vs AI setup — Profile (name+avatar) → Settings (difficulty+players) → Launch game |
| `lobby.html` | Online lobby — Auth → game list → create/join public games |
| `board_3d.html` | The game itself. Start screen is minimal mode-picker only. Private game lobby built in for WebSocket flow. |

---

## 11. CSS Breakpoints

```css
/* Mobile first — default styles target phones */
/* All layouts designed for 320px minimum width */

@media (min-width: 600px) {
    /* Tablet: wider cards, 4-column difficulty grid */
    .steps-container { max-width: 520px; }
    .diff-grid { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 1024px) {
    /* Desktop: centered card layout */
    .steps-container { max-width: 600px; }
}
```

---

## 12. Accessibility

- All interactive elements have `aria-label` or visible text
- Focus order follows visual order (top → bottom, left → right)
- Color is never the only differentiator (icons + text + border)
- Touch targets: minimum 48×48px
- Font size: minimum 14px for body, 12px for labels
- Input fields: visible focus ring with primary color border

---

## Summary: Maximum Taps to Game

| Play Mode | Taps from Landing |
|-----------|-------------------|
| Solo vs AI (defaults) | 2 (Landing → Start) |
| Solo vs AI (customized) | 3 (Landing → Next → Start) |
| Private Create | 3 (Landing → Create → Start when ready) |
| Private Join | 3 (Landing → Enter code → Join) |
| Quick Match | 2 (Landing → Quick Match → auto-join) |
| Online Lobby | 3 (Login → Tap game → Join) |
