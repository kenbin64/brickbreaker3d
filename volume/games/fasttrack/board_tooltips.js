/**
 * Board Tooltips — Hover Descriptions for Every Element
 * ======================================================
 * Shows a floating tooltip when the player hovers over ANY element:
 *   - 3D board holes (via raycasting)
 *   - 3D pegs (via raycasting)
 *   - HTML buttons, panels, controls, indicators
 *   - Card areas, player panels, reaction bar
 *
 * Tooltip follows the cursor with a slight offset.
 * On mobile, tooltips appear on long-press (500ms).
 *
 * Copyright (c) 2024-2026 Kenneth Bingham — ButterflyFX
 * Licensed under CC BY 4.0
 */

'use strict';

window.BoardTooltips = (function () {

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    let tooltipEl = null;
    let enabled = true;
    let currentText = '';
    let hideTimer = null;
    let lastRaycastTime = 0;
    const RAYCAST_INTERVAL = 80; // ms between 3D raycasts (perf guard)

    // ═══════════════════════════════════════════════════════════════
    // TOOLTIP ELEMENT
    // ═══════════════════════════════════════════════════════════════

    function ensureTooltip() {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'board-tooltip';
        tooltipEl.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 100000;
            max-width: 280px;
            padding: 8px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, rgba(10,10,30,0.96), rgba(25,15,50,0.96));
            border: 1px solid rgba(100,255,150,0.35);
            color: #e0e0e0;
            font-size: 13px;
            line-height: 1.5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(100,255,150,0.1);
            backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.18s ease;
            white-space: normal;
            word-wrap: break-word;
        `;
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function show(text, x, y) {
        if (!enabled || !text) return;
        const tip = ensureTooltip();
        if (text !== currentText) {
            tip.innerHTML = text;
            currentText = text;
        }
        // Position with offset so it doesn't cover the cursor
        const offsetX = 14;
        const offsetY = 18;
        let posX = x + offsetX;
        let posY = y + offsetY;
        // Keep on screen
        const tipW = tip.offsetWidth || 200;
        const tipH = tip.offsetHeight || 40;
        if (posX + tipW > window.innerWidth - 8) posX = x - tipW - 8;
        if (posY + tipH > window.innerHeight - 8) posY = y - tipH - 8;
        if (posX < 4) posX = 4;
        if (posY < 4) posY = 4;

        // Mobile: Avoid player panel at top (typically 80-120px tall)
        // If tooltip would appear in top-left corner, push it down
        const isMobile = window.innerWidth <= 768;
        if (isMobile && posY < 120) {
            // Position tooltip below the player panel instead
            posY = Math.max(120, y + offsetY);
            // If that pushes it off screen, center it vertically
            if (posY + tipH > window.innerHeight - 8) {
                posY = Math.max(120, (window.innerHeight - tipH) / 2);
            }
        }

        tip.style.left = posX + 'px';
        tip.style.top = posY + 'px';
        tip.style.opacity = '1';
        clearTimeout(hideTimer);
    }

    function hide() {
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            currentText = '';
        }
    }

    function hideDelayed(ms) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, ms || 200);
    }

    // ═══════════════════════════════════════════════════════════════
    // HTML ELEMENT TOOLTIPS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Map of CSS selectors → tooltip descriptions.
     * Checked in order; first match wins.
     */
    const HTML_TOOLTIPS = [
        // ── Side buttons ──
        ['#exit-game-btn',          '🚪 <b>Exit Game</b> — Leave the current game. An AI bot will take over your pegs.'],
        ['#tutorial-btn',           '📖 <b>Tutorial</b> — Launch an interactive walkthrough of all board holes, cards, and game mechanics.'],
        ['#camera-toggle-btn',      '📸 <b>Camera Views</b> — Switch between Board, Ground, Chase, Orbit, and Manual camera modes.'],
        ['#game-chat-toggle',       '💬 <b>Chat</b> — Open/close the in-game chat panel to communicate with other players or AI.'],
        ['#organizer-menu-btn',     '🎛️ <b>Host Controls</b> — Manage the game session (host only).'],

        // ── Camera panel ──
        ['[data-view="board"]',     '🎥 <b>Board View</b> — Top-down overview of the entire game board.'],
        ['[data-view="ground"]',    '🎥 <b>Ground View</b> — Eye-level perspective from the edge of the board.'],
        ['[data-view="chase"]',     '🎥 <b>Chase View</b> — Camera follows the active peg as it moves.'],
        ['[data-view="orbit"]',     '🎥 <b>Orbit View</b> — Camera slowly orbits around the board automatically.'],
        ['[data-view="manual"]',    '🎥 <b>Manual View</b> — Drag to rotate, scroll to zoom. Full camera control.'],
        ['#camera-speed-slider',    '⏩ <b>Camera Speed</b> — Adjust how fast the camera transitions between views.'],

        // ── Player panels ──
        ['#player-panels',          '👥 <b>Player Panels</b> — Shows each player\'s name, avatar, score, and peg status. Active player is highlighted.'],

        // ── Reaction bar ──
        ['#floating-reactions',     '😱 <b>Reactions</b> — Send emoji reactions to other players. Drag the handle to reposition.'],
        ['.reactions-handle',       '⋮⋮ <b>Drag Handle</b> — Click and drag to move the reaction bar anywhere on screen.'],
        ['.reaction-btn-desktop',   null], // handled dynamically below

        // ── Turn indicators ──
        ['#ai-thinking',            '🎲 <b>Player Action</b> — Shows which player is currently making their move.'],
        ['#turn-action-banner',     '🎯 <b>Turn Banner</b> — Indicates what action is needed: draw a card or pick a destination.'],
        ['#banner-action-btn',      '▶️ <b>Make Move</b> — Click to execute the recommended move.'],

        // ── Info bar ──
        ['#info',                   'ℹ️ <b>Controls</b> — Drag to rotate the board, scroll to zoom in/out.'],
        ['#stats',                  '📊 <b>Board Stats</b> — Number of holes and pegs registered on the board.'],

        // ── Timer ──
        ['#turn-timer-display',     '⏱️ <b>Turn Timer</b> — Time remaining for the current player to make their move.'],

        // ── Chat panel ──
        ['#game-chat-panel',        '💬 <b>Game Chat</b> — Send messages to other players during the game.'],
        ['#game-chat-input',        '✏️ <b>Type Message</b> — Type your message here and press Enter to send.'],
        ['.game-chat-send-btn',     '📤 <b>Send</b> — Send your chat message.'],

        // ── Rules modal ──
        ['#rules-modal',            '📜 <b>Game Rules</b> — Complete rules reference for Fast Track.'],

        // ── Card area (dynamically created by CardUI) ──
        ['.card-deck',              '🃏 <b>Card Deck</b> — Click to draw a card when it\'s your turn. Each player has their own shuffled 54-card deck.'],
        ['.card-display',           '🎴 <b>Current Card</b> — The card you just drew. It determines how many spaces you can move.'],
        ['.discard-pile',           '📥 <b>Discard Pile</b> — Cards that have already been played.'],
        ['.deck-count',             '🔢 <b>Cards Remaining</b> — Number of cards left in your deck. When empty, the discards are reshuffled.'],

        // ── Exit confirm ──
        ['#exit-confirm-modal',     '🚪 <b>Exit Confirmation</b> — Confirm or cancel leaving the game.'],

        // ── 3D canvas ──
        ['#container',              null], // 3D canvas — handled by raycast system
    ];

    /**
     * Reaction button tooltips (dynamic — read emoji from button text)
     */
    const REACTION_LABELS = {
        '😱': 'Shock', '👏': 'Well played', '😬': 'Ouch', '😈': 'Revenge',
        '🔥': 'On fire', '😭': 'Sad', '🎉': 'Celebrate', '💀': 'Dead', '👻': 'Boo',
    };

    function getHTMLTooltip(el) {
        if (!el || el === document.body || el === document.documentElement) return null;

        // Walk up from the hovered element, checking each against our selector map
        let node = el;
        const maxDepth = 8;
        for (let d = 0; d < maxDepth && node && node !== document.body; d++) {
            for (const [selector, text] of HTML_TOOLTIPS) {
                if (text === null) continue; // skip — handled elsewhere
                try {
                    if (node.matches && node.matches(selector)) return text;
                } catch (e) { /* invalid selector guard */ }
            }

            // Reaction buttons — dynamic label
            if (node.classList && node.classList.contains('reaction-btn-desktop')) {
                const emoji = (node.textContent || '').trim();
                const label = REACTION_LABELS[emoji] || 'React';
                return `${emoji} <b>${label}</b> — Send this reaction to all players.`;
            }

            // Player panel children — dynamic player info
            if (node.classList && node.classList.contains('player-panel')) {
                const name = node.querySelector('.player-name')?.textContent || 'Player';
                const pegs = node.querySelector('.peg-count')?.textContent || '';
                return `👤 <b>${name}</b> — Player panel showing turn status and peg positions.${pegs ? ' Pegs: ' + pegs : ''}`;
            }

            node = node.parentElement;
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // 3D BOARD TOOLTIPS (RAYCASTING)
    // ═══════════════════════════════════════════════════════════════

    const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];

    function getHoleTooltip(holeId, hole) {
        if (!holeId) return null;

        const props = hole?.properties || {};
        const pIdx = hole?.playerIndex;
        const colorName = (pIdx !== undefined && pIdx !== null && pIdx >= 0)
            ? PLAYER_COLOR_NAMES[pIdx % PLAYER_COLOR_NAMES.length]
            : '';
        // Get player name from gameState if available
        const playerName = (pIdx !== undefined && pIdx !== null && window.gameState?.players?.[pIdx])
            ? window.gameState.players[pIdx].name
            : colorName;

        // Center / Bullseye
        if (holeId === 'center' || props.isBullseye) {
            return '🎯 <b>Bullseye (Center)</b> — Safe haven. Enter from FastTrack with a 1-step card. Exit with J, Q, or K to your FastTrack corner.';
        }

        // Holding
        if (holeId.startsWith('hold-')) {
            const pegNum = holeId.split('-')[2];
            return `🏠 <b>${playerName}'s Holding #${parseInt(pegNum) + 1}</b> — Pegs wait here until an entry card (A, 6, Joker) brings them onto the board.`;
        }

        // Home / Diamond / Winner hole
        if (holeId.startsWith('home-')) {
            return `💎 <b>${playerName}'s Diamond Hole</b> — Entry point from holding AND the winner hole. Your 5th peg must land here exactly (after a full circuit + 4 in safe zone) to win!`;
        }

        // Safe zone
        if (holeId.startsWith('safe-')) {
            const parts = holeId.split('-');
            const safeNum = parts[2] || '?';
            return `🛡️ <b>${playerName}'s Safe Zone #${safeNum}</b> — Protected position. Pegs here cannot be cut. Fill all 4 safe spots, then land your 5th peg on the diamond to win.`;
        }

        // FastTrack
        if (holeId.startsWith('ft-')) {
            const ftNum = holeId.split('-')[1];
            const isOwn = (pIdx !== undefined && pIdx !== null);
            if (props.isFastTrackExit || (isOwn && parseInt(ftNum) === pIdx)) {
                return `⚡ <b>FastTrack Corner #${ftNum}</b> (${playerName}'s exit) — ${playerName}'s pegs exit FastTrack here toward their safe zone. Other players can enter FastTrack from this corner.`;
            }
            return `⚡ <b>FastTrack Corner #${ftNum}</b> — Land here exactly to enter the FastTrack inner ring. Huge shortcut — skip most of the outer track!`;
        }

        // Safe zone entry point
        if (props.isSafeZoneEntry) {
            return `🚪 <b>Safe Zone Entry</b> (${playerName}) — Pegs that have completed a full circuit turn into the safe zone here instead of continuing clockwise.`;
        }

        // Regular outer track
        if (holeId.startsWith('outer-') || holeId.startsWith('side-')) {
            const parts = holeId.split('-');
            const section = parts[1] || '?';
            const pos = parts[2] || '?';
            // Extra detail for special positions
            if (props.isHoldingExit) {
                return `💎 <b>Section ${section}, Hole ${pos}</b> — Holding exit / Winner hole for ${playerName}. Entry cards place pegs here.`;
            }
            return `🔵 <b>Outer Track</b> — Section ${section}, Hole ${pos}. Standard track hole — pegs move clockwise around the 84-hole perimeter.`;
        }

        return `🕳️ <b>${holeId}</b> — Board hole.`;
    }

    function getPegTooltip(pegId, pegData) {
        if (!pegId) return null;

        // Parse player index from peg ID (e.g., "peg-0-2" → player 0, peg 2)
        const parts = pegId.split('-');
        const pIdx = parseInt(parts[1]) || 0;
        const pegNum = parseInt(parts[2]) || 0;
        const colorName = PLAYER_COLOR_NAMES[pIdx % PLAYER_COLOR_NAMES.length];
        const playerName = (window.gameState?.players?.[pIdx])
            ? window.gameState.players[pIdx].name
            : colorName;
        const holeId = pegData?.currentHole || pegData?.holeId || 'unknown';
        const holeType = pegData?.holeType || window.getNormalizedHoleType?.(holeId) || '';

        let status = '';
        if (holeType === 'holding') status = 'In holding — needs A, 6, or Joker to enter';
        else if (holeType === 'safezone') status = 'In safe zone — protected!';
        else if (holeType === 'center') status = 'In the Bullseye — needs J/Q/K to exit';
        else if (pegData?.onFasttrack) status = 'On FastTrack — taking the shortcut!';
        else if (pegData?.eligibleForSafeZone) status = 'Eligible for safe zone entry';
        else status = `At ${holeId}`;

        return `🎯 <b>${playerName}'s Peg #${pegNum + 1}</b> — ${status}`;
    }

    /**
     * Raycast the 3D scene to find which hole or peg the mouse is over.
     */
    function raycast3D(clientX, clientY) {
        if (typeof THREE === 'undefined' || !window.camera || !window.scene) return null;

        const mouse = new THREE.Vector2(
            (clientX / window.innerWidth) * 2 - 1,
            -(clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.camera);

        // Collect meshes to test
        const boardGroup = window.boardGroup || window.scene;
        const intersects = raycaster.intersectObjects(boardGroup.children, true);

        for (const hit of intersects) {
            const obj = hit.object;

            // Check pegs first (they sit on top of holes)
            if (window.pegRegistry) {
                for (const [pegId, pegData] of window.pegRegistry) {
                    if (pegData.bodyMesh === obj || pegData.discMesh === obj || pegData.mesh === obj) {
                        return getPegTooltip(pegId, pegData);
                    }
                }
            }

            // Check holes
            if (window.holeRegistry) {
                for (const [holeId, holeData] of window.holeRegistry) {
                    if (holeData.mesh === obj) {
                        // Also check if any peg is on this hole
                        const occupant = getOccupant(holeId);
                        let tip = getHoleTooltip(holeId, holeData);
                        if (occupant) {
                            tip += `<br><span style="color:#ffd700;">Occupied by ${occupant}</span>`;
                        }
                        return tip;
                    }
                }
            }

            // If hit the board surface itself
            if (obj.userData && obj.userData.isBoard) {
                return '🎲 <b>Game Board</b> — The hexagonal Fast Track board. Pegs move clockwise around the outer track.';
            }
        }

        return null;
    }

    function getOccupant(holeId) {
        if (!window.gameState?.players) return null;
        for (const player of window.gameState.players) {
            if (!player.peg) continue;
            for (const peg of player.peg) {
                if (peg.holeId === holeId && peg.holeType !== 'holding') {
                    return player.name || 'a player';
                }
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT HANDLING
    // ═══════════════════════════════════════════════════════════════

    function onMouseMove(e) {
        if (!enabled) return;

        const target = e.target;

        // 1) Check HTML tooltips first (buttons, panels, controls)
        const htmlTip = getHTMLTooltip(target);
        if (htmlTip) {
            show(htmlTip, e.clientX, e.clientY);
            return;
        }

        // 2) If hovering over the 3D canvas container, raycast
        const container = document.getElementById('container');
        if (container && (target === container || container.contains(target) || target.tagName === 'CANVAS')) {
            const now = performance.now();
            if (now - lastRaycastTime < RAYCAST_INTERVAL) return; // throttle
            lastRaycastTime = now;

            const tip3D = raycast3D(e.clientX, e.clientY);
            if (tip3D) {
                show(tip3D, e.clientX, e.clientY);
                return;
            }
        }

        // Nothing to show — hide
        hideDelayed(150);
    }

    function onMouseLeave() {
        hideDelayed(100);
    }

    // ═══════════════════════════════════════════════════════════════
    // MOBILE LONG-PRESS SUPPORT
    // ═══════════════════════════════════════════════════════════════

    let longPressTimer = null;
    let longPressPos = null;

    function onTouchStart(e) {
        if (!enabled || e.touches.length !== 1) return;
        const touch = e.touches[0];
        longPressPos = { x: touch.clientX, y: touch.clientY };
        longPressTimer = setTimeout(() => {
            if (!longPressPos) return;
            // Simulate hover at touch position
            const fakeEvent = { clientX: longPressPos.x, clientY: longPressPos.y, target: document.elementFromPoint(longPressPos.x, longPressPos.y) };
            onMouseMove(fakeEvent);
        }, 500);
    }

    function onTouchMove(e) {
        // If finger moved too far, cancel long press
        if (longPressTimer && longPressPos && e.touches.length === 1) {
            const dx = e.touches[0].clientX - longPressPos.x;
            const dy = e.touches[0].clientY - longPressPos.y;
            if (dx * dx + dy * dy > 400) { // 20px threshold
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    }

    function onTouchEnd() {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressPos = null;
        hideDelayed(800);
    }

    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════

    function init() {
        ensureTooltip();
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);
        // Mobile
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd);
        console.log('[BoardTooltips] Initialized — hover over any element for info');
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        init,
        show,
        hide,
        enable()  { enabled = true; },
        disable() { enabled = false; hide(); },
        isEnabled() { return enabled; },
    };

})();

console.log('[BoardTooltips] Module loaded');
