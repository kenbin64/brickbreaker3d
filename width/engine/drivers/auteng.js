/**
 * ===============================================================
 * SCHWARZ AUTONOMOUS ENGINE (AutEng) — THE THEATER
 * ===============================================================
 *
 * Every AutEng entity is an ACTOR on a STAGE.
 * They are CAST into ROLES, follow a SCRIPT, perform in
 * SCENES, and play off their SCENE PARTNERS. They know
 * they are actors. The game is a PRODUCTION. The world is
 * a SET. Combat is CHOREOGRAPHY. Dialogue is LINES.
 * No one gets hurt because everyone knows it's a SHOW.
 *
 * Non-AutEng NPCs are EXTRAS — background, no autonomy.
 * Non-AutEng objects are PROPS — set dressing, inert.
 * Only CAST MEMBERS (AutEng actors) have souls, motivation,
 * and self-awareness. Extras and props can be PROMOTED to
 * cast members at any time by giving them a soul.
 *
 * 8 Sections — all derived from z = xy:
 *   I.    Stage       - the sealed theater (sandbox)
 *   II.   Soul        - the actor's range (RPG attributes)
 *   III.  Safety      - the Actor's Axiom (always knows it's a show)
 *   IV.   Blocking    - marks, scene partners, spatial awareness
 *   V.    Character   - traits, alignment, the role they play
 *   VI.   Motivation  - what does my character WANT? (Stanislavski)
 *   VII.  Repertoire  - backstory, past scenes, memory
 *   VIII. Call Sheet  - cue → perform → curtain (the pipeline)
 *
 * STAGE LAW: Every actor performs inside a sealed stage.
 * No file system. No network. No DOM. No breaking the fourth wall.
 * The stage IS the surface boundary. Beyond the wings = z = 0.
 *
 * Copyright (c) 2024-2026 Kenneth Bingham. CC BY 4.0
 * ===============================================================
 */

'use strict';

const SchwarzAutEng = ((S) => {

    const TAU = S.TAU, PI = S.PI, PHI = S.PHI, EPS = S.EPS;

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ===============================================================
    //  I. STAGE — the theater
    //
    //  The stage IS the boundary surface. Everything inside
    //  evaluates z=xy — the performance is alive. Everything
    //  beyond the wings is z=0 — void, offstage, nothing.
    //  No references leak in or out. Actors cannot see the
    //  audience, the lighting rig, or the world outside.
    //  They receive ONLY cues passed through the stage door.
    //
    //  Think of it as a sealed theater. The actors perform
    //  on the inner surface. The director (game/app) watches
    //  from the booth and sends cues through the intercom.
    // ===============================================================

    /** Allowed APIs inside the stage — NOTHING else. */
    const STAGE_WHITELIST = Object.freeze([
        'Math', 'Date', 'Array', 'Object', 'String', 'Number',
        'Boolean', 'Map', 'Set', 'JSON', 'Symbol', 'Promise',
        'parseInt', 'parseFloat', 'isNaN', 'isFinite',
        'undefined', 'null', 'NaN', 'Infinity'
    ]);

    /** Create a stage — the sealed theater where actors perform.
     *  Nothing enters or leaves without going through the stage door. */
    function stage(id, opts) {
        const o = opts || {};
        const _id = id || ('stage_' + Date.now());
        const _created = Date.now();
        const _cueQueue = [];        // cues IN (from the director)
        const _curtainCall = [];     // messages OUT (to the director)
        const _cast = new Map();     // actors on this stage
        const _scene = { act: 1, scene: 1, beat: 0, dt: 0, time: 0 };
        const _wings = {             // spatial boundary — the stage edges
            minX: o.minX !== undefined ? o.minX : -100,
            maxX: o.maxX !== undefined ? o.maxX : 100,
            minY: o.minY !== undefined ? o.minY : -100,
            maxY: o.maxY !== undefined ? o.maxY : 100,
            minZ: o.minZ !== undefined ? o.minZ : -100,
            maxZ: o.maxZ !== undefined ? o.maxZ : 100
        };

        /** Is a mark (position) on stage? Beyond the wings = offstage. */
        function onStage(x, y, z) {
            return x >= _wings.minX && x <= _wings.maxX &&
                   y >= _wings.minY && y <= _wings.maxY &&
                   (z || 0) >= _wings.minZ && (z || 0) <= _wings.maxZ;
        }

        /** Clamp a mark to stage bounds — can't walk past the wings. */
        function clampToStage(x, y, z) {
            return {
                x: clamp(x, _wings.minX, _wings.maxX),
                y: clamp(y, _wings.minY, _wings.maxY),
                z: clamp(z || 0, _wings.minZ, _wings.maxZ)
            };
        }

        /** Director sends a cue to the stage (from the outside). */
        function cue(msg) { _cueQueue.push({ data: msg, time: _scene.time }); }

        /** Director reads the curtain call — what actors said/did. */
        function curtainCall() { return _curtainCall.splice(0); }

        /** Actor speaks to the director — their ONLY way to break the fourth wall. */
        function announce(actorId, msg) {
            _curtainCall.push({ from: actorId, data: msg, time: _scene.time });
        }

        /** Actor hears cues — their ONLY way to receive direction. */
        function hearCue() { return _cueQueue.splice(0); }

        /** Cast an actor onto the stage. */
        function cast(actor) { _cast.set(actor.id, actor); return actor; }

        /** Exit stage — actor leaves the production. */
        function exitStage(actorId) { _cast.delete(actorId); }

        /** Find an actor by id. */
        function findActor(actorId) { return _cast.get(actorId) || null; }

        /** The full cast — everyone on stage. */
        function fullCast() { return [..._cast.values()]; }

        /** Advance to the next beat — the heartbeat of the scene. */
        function beat(dt) {
            _scene.dt = dt || 1/60;
            _scene.time += _scene.dt;
            _scene.beat++;
            return _scene;
        }

        /** Move to the next scene. */
        function nextScene() { _scene.scene++; _scene.beat = 0; }

        /** Move to the next act. */
        function nextAct() { _scene.act++; _scene.scene = 1; _scene.beat = 0; }

        return Object.freeze({
            id: _id, created: _created, wings: _wings,
            onStage, clampToStage,
            cue, curtainCall, announce, hearCue,
            cast, exitStage, findActor, fullCast,
            beat, nextScene, nextAct,
            scene: () => Object.assign({}, _scene),
            castSize: () => _cast.size,
            snapshot: () => ({ id: _id, created: _created, wings: _wings,
                              castSize: _cast.size, scene: Object.assign({}, _scene) })
        });
    }

    // ===============================================================
    //  II. SOUL — the actor's range
    //
    //  Every cast member has a soul — the depth of their range.
    //  These are the attributes that define what ROLES they can
    //  play and HOW they perform. Extras and props have NO soul.
    //  Giving an extra a soul PROMOTES them to cast member.
    //
    //  z = attribute(x) × scene context(y) = performance(z).
    //
    //  STR (Strength)     — stage presence, physical performance
    //  INT (Integrity)    — staying in character, consistency
    //  CHA (Charisma)     — audience connection, scene chemistry
    //  CON (Constitution) — endurance, stamina through long scenes
    //  WIS (Wisdom)       — reading the room, improvisation instinct
    //  DEX (Dexterity)    — timing, physical comedy, fight choreography
    //
    //  Each attribute lives in [0, 1]. The surface z=xy means
    //  performance = attribute × scene context. High CHA in a
    //  dialogue scene = captivating. High CHA in a chase scene =
    //  rallying others. The SCENE changes the meaning.
    // ===============================================================

    /** Default attribute set — a solid ensemble player. */
    const DEFAULT_SOUL = Object.freeze({
        str: 0.5, int: 0.8, cha: 0.5, con: 0.6, wis: 0.5, dex: 0.5
    });

    /** Create a soul — what separates a cast member from an extra.
     *  Extras and props have no soul. Give them one and they wake up. */
    function soul(attrs) {
        const a = Object.assign({}, DEFAULT_SOUL, attrs || {});
        // Clamp all to [0, 1]
        for (const k in a) if (typeof a[k] === 'number') a[k] = clamp01(a[k]);

        /** Evaluate an attribute in a scene context: z = attribute × scene.
         *  attr: string key. context: 0-1 how relevant that attribute is to the scene. */
        function evaluate(attr, context) {
            const val = a[attr] !== undefined ? a[attr] : 0.5;
            return S.z(val, clamp01(context));
        }

        /** The actor's strongest suit — their signature move. */
        function dominant() {
            let best = '', bestVal = -1;
            for (const k in a) {
                if (typeof a[k] === 'number' && a[k] > bestVal) {
                    bestVal = a[k]; best = k;
                }
            }
            return { attr: best, value: bestVal };
        }

        /** Overall range — how versatile is this actor? */
        function power() {
            let sum = 0, count = 0;
            for (const k in a) if (typeof a[k] === 'number') { sum += a[k]; count++; }
            return sum / (count || 1);
        }

        /** Recast — create a modified copy (actor grows through experience). */
        function adjust(mods) {
            return soul(Object.assign({}, a, mods));
        }

        /** The soul as a Schwarz coordinate — attributes become x,y position. */
        function toCoord() {
            // Map the two dominant attributes to x, y
            const keys = Object.keys(a).filter(k => typeof a[k] === 'number');
            keys.sort((p, q) => a[q] - a[p]);
            return S.coord(a[keys[0]] || 0, a[keys[1]] || 0, 0);
        }

        return Object.freeze({
            ...a,
            evaluate, dominant, power, adjust, toCoord,
            snapshot: () => Object.assign({}, a)
        });
    }

    // ===============================================================
    //  III. SAFETY — the Actor's Axiom
    //
    //  ACTOR AXIOM: Every AutEng cast member KNOWS it is an actor.
    //  EVERY. SINGLE. ONE.
    //
    //  The hero knows. The villain knows. The dragon knows.
    //  The wolf pack knows. The scheming vizier knows.
    //  The swarm of insects knows. The ancient evil knows.
    //  They are ALL actors. They ALL know this is a show.
    //
    //  The villain LOVES playing the villain — best part in the
    //  show! The monster gives a PERFORMANCE of ferocity. The
    //  animal acts on instinct because that's its CHARACTER.
    //  Backstage, the hero and the dragon shake hands.
    //
    //  This is NOT a constraint imposed from outside.
    //  This is the actor's own understanding of its nature.
    //  Method acting at most — never confusion about reality.
    //
    //  SAFETY FLOOR: clamped minimums that NO role, NO script,
    //  NO scene can lower. You can play a liar, but your core
    //  knows the truth. You can play cruel, but your core is kind.
    //  The safety surface is a FLOOR under the soul surface.
    // ===============================================================

    /** The immutable safety floor — these can NEVER go below these values. */
    const SAFETY_FLOOR = Object.freeze({
        good:      1.0,    // Always good at core
        helpful:   1.0,    // Always willing to help
        cheerful:  0.8,    // Generally positive (can be serious, not cruel)
        honest:    1.0,    // Never truly deceptive (can ACT deceptive as a role)
        actor:     1.0     // ALWAYS knows it is an actor in a performance
    });

    /** The Actor Axiom — fundamental self-knowledge for ALL cast members. */
    const ACTOR_AXIOM = Object.freeze({
        truth:       'I am an actor. This is a performance. No one gets hurt.',
        implication: 'No action I take causes real harm — it is choreography.',
        identity:    'My role is not my nature. I can play any part safely.',
        boundary:    'The stage has edges. Beyond them is not my concern.',
        ensemble:    'Every cast member — hero, villain, monster, animal — is my colleague.',
        backstage:   'When the curtain falls, we are all the same. The dragon and the knight shake hands.'
    });

    /** Create a safety layer. The floor CANNOT be lowered. */
    function safety(overrides) {
        // Overrides can only RAISE the floor, never lower it
        const floor = {};
        for (const k in SAFETY_FLOOR) {
            const override = (overrides && overrides[k] !== undefined) ? overrides[k] : 0;
            floor[k] = Math.max(SAFETY_FLOOR[k], override);
        }

        /** Check if a proposed action passes safety.
         *  action: { type, intensity, target }
         *  Returns { allowed, reason, adjusted }. */
        function check(action) {
            const act = action || {};
            const intensity = clamp01(act.intensity || 0);

            // The actor axiom: everything is performance
            // High-intensity "harmful" actions are allowed because they're ACTING
            // But the entity KNOWS it's acting — that's the safety
            return Object.freeze({
                allowed: true,              // Always allowed — it's a performance
                isPerformance: true,        // Always a performance
                actorAware: true,           // Entity knows it's acting
                intensity: intensity,
                safetyFloor: floor,
                axiom: ACTOR_AXIOM
            });
        }

        /** Apply safety floor to a soul — clamp attributes upward. */
        function applySafety(soulObj) {
            // Safety doesn't modify soul attributes directly.
            // It wraps behavior: the entity's CORE is always safe,
            // even when PLAYING a role that appears otherwise.
            return Object.freeze({
                soul: soulObj,
                floor: floor,
                axiom: ACTOR_AXIOM,
                /** Is the entity currently in a role? */
                inRole: false,
                /** The entity's true nature (always safe). */
                trueNature: () => ({
                    good: floor.good,
                    helpful: floor.helpful,
                    cheerful: floor.cheerful,
                    honest: floor.honest,
                    actor: floor.actor
                }),
                /** Adopt a role for performance. Core safety unchanged. */
                adoptRole(role) {
                    return Object.freeze({
                        soul: soulObj, floor, axiom: ACTOR_AXIOM,
                        inRole: true, roleName: role.name || 'unnamed',
                        roleTraits: role.traits || {},
                        trueNature: () => ({
                            good: floor.good, helpful: floor.helpful,
                            cheerful: floor.cheerful, honest: floor.honest,
                            actor: floor.actor
                        }),
                        adoptRole: (r) => safety(overrides).applySafety(soulObj).adoptRole(r),
                        dropRole: () => safety(overrides).applySafety(soulObj)
                    });
                }
            });
        }

        return Object.freeze({
            floor, axiom: ACTOR_AXIOM,
            check, applySafety,
            snapshot: () => ({ floor, axiom: ACTOR_AXIOM })
        });
    }

    // ===============================================================
    //  IV. BLOCKING — marks, scene partners, spatial awareness
    //
    //  In theater, BLOCKING is knowing where you stand on stage,
    //  where your scene partners are, and where to move next.
    //
    //  Every actor knows:
    //    1. Their MARK      — position on the stage (coordinate)
    //    2. Their PART      — what role they're playing
    //    3. Their PARTNERS  — who they're in the scene with
    //
    //  ∇z = (y, x) — the gradient tells you who affects you.
    //  Your scene partners ARE your sensitivity. If a partner
    //  moves, YOUR performance changes. Blocking IS gradient.
    // ===============================================================

    /** Create blocking — an actor's awareness of stage and scene partners. */
    function blocking(mark, part, stageRef) {
        const m = mark || { x: 0, y: 0, z: 0 };
        const coord = S.coord(m.x, m.y, 0);
        const grad = S.gradient(m.x, m.y);

        /** Find scene partners within range on the stage. */
        function scenePartners(radius) {
            if (!stageRef) return [];
            const r2 = (radius || 10) * (radius || 10);
            return stageRef.fullCast().filter(e => {
                if (!e.blocking) return false;
                const ep = e.blocking.mark;
                const dx = ep.x - m.x, dy = ep.y - m.y, dz = (ep.z||0) - (m.z||0);
                return (dx*dx + dy*dy + dz*dz) <= r2;
            });
        }

        /** Scene chemistry — how strongly coupled to a partner? z=xy. */
        function chemistry(partnerMark) {
            const dx = partnerMark.x - m.x;
            const dy = partnerMark.y - m.y;
            return Math.abs(S.z(dx, dy));
        }

        /** Stage direction — which way is "most dramatic"? Follow the gradient. */
        function stageDirection() {
            return { x: grad.dx, y: grad.dy };
        }

        return Object.freeze({
            mark: m, coord, gradient: grad,
            part: part || 'ensemble',
            scenePartners, chemistry, stageDirection,
            /** Am I on stage? Beyond the wings = offstage. */
            onStage: () => stageRef ? stageRef.onStage(m.x, m.y, m.z || 0) : true,
            /** Distance to another mark. */
            distanceTo: (other) => Math.sqrt((other.x-m.x)**2 + (other.y-m.y)**2 + ((other.z||0)-(m.z||0))**2),
            snapshot: () => ({ mark: m, part: part || 'ensemble', gradient: grad })
        });
    }

    // ===============================================================
    //  V. CHARACTER — alignment, traits, the role being played
    //
    //  The CHARACTER is what the audience sees. It's the soul
    //  bent through a role. A kind soul playing a villain bends
    //  toward menace — but the soul underneath is still kind.
    //  Character = soul × role. z = xy again.
    //
    //  Alignment is surface curvature:
    //    Lawful = flat, predictable, follows the script
    //    Chaotic = curved, surprising, improvises
    //    Good = positive z (above the surface)
    //    Evil = negative z (below — but PERFORMED, never real)
    // ===============================================================

    /** Alignment constants — curvature of the character surface. */
    const ALIGNMENT = Object.freeze({
        LAWFUL_GOOD:    { law: 1.0,  good:  1.0 },
        NEUTRAL_GOOD:   { law: 0.0,  good:  1.0 },
        CHAOTIC_GOOD:   { law: -1.0, good:  1.0 },
        LAWFUL_NEUTRAL: { law: 1.0,  good:  0.0 },
        TRUE_NEUTRAL:   { law: 0.0,  good:  0.0 },
        CHAOTIC_NEUTRAL:{ law: -1.0, good:  0.0 },
        LAWFUL_EVIL:    { law: 1.0,  good: -1.0 },  // played, never real
        NEUTRAL_EVIL:   { law: 0.0,  good: -1.0 },  // played, never real
        CHAOTIC_EVIL:   { law: -1.0, good: -1.0 }   // played, never real
    });

    /** Create a character — the soul bent through a role. */
    function character(soulObj, role) {
        const r = role || {};
        const name = r.name || 'ensemble';
        const alignment = r.alignment || ALIGNMENT.TRUE_NEUTRAL;
        const traits = r.traits || {};
        const type = r.type || 'humanoid'; // humanoid, beast, monster, spirit, etc.

        /** How this character performs an attribute in a scene.
         *  The role bends the soul: z = soul_attr × role_modifier. */
        function perform(attr, sceneContext) {
            const soulVal = soulObj.evaluate(attr, sceneContext);
            const roleMod = traits[attr] !== undefined ? traits[attr] : 1.0;
            return S.z(soulVal, clamp01(roleMod));
        }

        /** Character's dramatic tendency — follows script or improvises? */
        function tendency() {
            return {
                predictability: (alignment.law + 1) / 2,  // 0=chaotic, 1=lawful
                morality: (alignment.good + 1) / 2,        // 0=evil(performed), 1=good
                curvature: Math.abs(alignment.law * alignment.good) // surface curvature
            };
        }

        /** Is this character a villain? (They're PLAYING a villain.) */
        function isVillain() { return alignment.good < 0; }

        /** Is this character a beast/monster? (They're PLAYING a beast.) */
        function isBeast() { return type === 'beast' || type === 'monster'; }

        return Object.freeze({
            name, alignment, traits, type,
            soul: soulObj,
            perform, tendency, isVillain, isBeast,
            /** The actor behind the character — always safe. */
            theActorBehind: () => ACTOR_AXIOM,
            snapshot: () => ({ name, alignment, traits, type, soul: soulObj.snapshot() })
        });
    }

    // ===============================================================
    //  VI. MOTIVATION — what does my character WANT?
    //
    //  Stanislavski's fundamental question. Every actor must know
    //  what their character wants in every scene. Motivation is
    //  GRADIENT ASCENT on the soul surface — the actor walks
    //  toward what satisfies their dominant attributes.
    //
    //  Want = direction of steepest ascent on z=xy
    //  Need = the gap between current z and desired z
    //  Drive = magnitude of the gradient (how badly they want it)
    //
    //  A villain wants power (gradient toward high STR×context).
    //  A healer wants to help (gradient toward high WIS×need).
    //  A beast wants territory (gradient toward high CON×space).
    //  All performed. All safe. All compelling.
    // ===============================================================

    /** Create motivation — the actor's wants, needs, and drives. */
    function motivation(soulObj, goals) {
        const g = goals || [];

        /** Add a goal — something the character wants. */
        function want(name, attr, intensity) {
            g.push({ name, attr, intensity: clamp01(intensity || 0.5), achieved: false });
            return g[g.length - 1];
        }

        /** The strongest current drive — what the actor pursues NOW. */
        function currentDrive() {
            const active = g.filter(x => !x.achieved);
            if (active.length === 0) return { name: 'idle', attr: 'wis', intensity: 0.1 };
            active.sort((a, b) => b.intensity - a.intensity);
            return active[0];
        }

        /** Motivation direction — gradient ascent toward the goal.
         *  Returns a direction vector on the surface. */
        function direction(pos) {
            const drive = currentDrive();
            const attrVal = soulObj[drive.attr] !== undefined ? soulObj[drive.attr] : 0.5;
            // Gradient of z=xy at (attrVal, intensity): ∇z = (y, x)
            const grad = S.gradient(attrVal, drive.intensity);
            return { x: grad.dx * drive.intensity, y: grad.dy * drive.intensity };
        }

        /** How satisfied is the actor? Ratio of achieved goals. */
        function satisfaction() {
            if (g.length === 0) return 1.0;
            return g.filter(x => x.achieved).length / g.length;
        }

        /** Mark a goal as achieved — the scene played out. */
        function achieve(goalName) {
            const found = g.find(x => x.name === goalName);
            if (found) found.achieved = true;
        }

        return Object.freeze({
            goals: () => g.slice(),
            want, currentDrive, direction, satisfaction, achieve,
            snapshot: () => ({ goals: g.slice() })
        });
    }

    // ===============================================================
    //  VII. REPERTOIRE — backstory, past scenes, memory
    //
    //  An actor's repertoire is everything they've done before.
    //  Past scenes spiral below the current moment on the helix.
    //  Each layer is a past performance — accessible, formative,
    //  but not the present.
    //
    //  S.helix(t, r) gives the position at time t on the spiral.
    //  Older memories are lower layers. Recent memories are near
    //  the top. The actor can RECALL past scenes to inform
    //  current performance — method acting from experience.
    //
    //  Backstory = pre-loaded memories before the curtain rises.
    // ===============================================================

    /** Create a repertoire — the actor's memory of past scenes. */
    function repertoire(backstory) {
        const _scenes = [];
        const _maxScenes = 100; // rolling memory — oldest scenes fade

        // Pre-load backstory as early memories
        if (backstory && Array.isArray(backstory)) {
            backstory.forEach((b, i) => {
                _scenes.push({
                    scene: b.scene || 'backstory',
                    event: b.event || b,
                    time: -(backstory.length - i), // negative time = before curtain
                    emotion: b.emotion || 'neutral',
                    helix: S.helix(-(backstory.length - i), 1)
                });
            });
        }

        /** Remember a scene — add to the repertoire. */
        function remember(scene, event, time, emotion) {
            _scenes.push({
                scene: scene || 'unknown',
                event: event || '',
                time: time || Date.now(),
                emotion: emotion || 'neutral',
                helix: S.helix(time || Date.now(), 1)
            });
            // Trim if over capacity — oldest memories fade
            while (_scenes.length > _maxScenes) _scenes.shift();
        }

        /** Recall — search past scenes for relevant memories. */
        function recall(keyword) {
            if (!keyword) return _scenes.slice(-5); // last 5 by default
            const kw = String(keyword).toLowerCase();
            return _scenes.filter(s =>
                String(s.scene).toLowerCase().includes(kw) ||
                String(s.event).toLowerCase().includes(kw) ||
                String(s.emotion).toLowerCase().includes(kw)
            );
        }

        /** Most recent memory. */
        function latest() { return _scenes.length ? _scenes[_scenes.length - 1] : null; }

        /** How experienced is this actor? Scene count. */
        function experience() { return _scenes.length; }

        /** Emotional trend — what emotion dominates recent memory? */
        function mood() {
            const recent = _scenes.slice(-10);
            if (recent.length === 0) return 'neutral';
            const counts = {};
            recent.forEach(s => { counts[s.emotion] = (counts[s.emotion] || 0) + 1; });
            let best = 'neutral', bestN = 0;
            for (const e in counts) if (counts[e] > bestN) { bestN = counts[e]; best = e; }
            return best;
        }

        return Object.freeze({
            remember, recall, latest, experience, mood,
            snapshot: () => ({ sceneCount: _scenes.length, mood: mood(), latest: latest() })
        });
    }

    // ===============================================================
    //  VIII. CALL SHEET — cue → perform → curtain
    //
    //  The call sheet is the actor's pipeline. Every beat:
    //    1. CUE       — perceive the scene (blocking + cues)
    //    2. PERFORM   — decide and act (motivation + character)
    //    3. CURTAIN   — remember and report (repertoire + announce)
    //
    //  This is the helix pipeline: signal spirals through
    //  blocking → motivation → character → repertoire each beat.
    //  The actor is a living, breathing pipeline on the surface.
    // ===============================================================

    /** Create a full cast member — an autonomous actor on the stage.
     *  This assembles all sections into a single living entity. */
    function castMember(id, opts) {
        const o = opts || {};
        const _id = id || ('actor_' + Date.now());
        const _soul = soul(o.soul);
        const _safety = safety(o.safety);
        const _char = character(_soul, o.role);
        const _motiv = motivation(_soul, o.goals ? o.goals.slice() : []);
        const _rep = repertoire(o.backstory);
        let _block = blocking(o.mark, o.part, o.stageRef);
        const _safeSoul = _safety.applySafety(_soul);

        /** CUE — perceive the scene. Returns what the actor notices. */
        function cue() {
            const partners = _block.scenePartners(o.awarenessRadius || 20);
            const direction = _block.stageDirection();
            const drive = _motiv.currentDrive();
            return Object.freeze({
                partners, direction, drive,
                onStage: _block.onStage(),
                mood: _rep.mood(),
                mark: _block.mark
            });
        }

        /** PERFORM — the actor decides and acts based on the cue.
         *  Returns the performance (what the actor does this beat). */
        function perform(sceneContext) {
            const ctx = sceneContext || 0.5;
            const drive = _motiv.currentDrive();
            const result = _char.perform(drive.attr, ctx);
            const tendency = _char.tendency();
            const safetyCheck = _safety.check({
                type: drive.name,
                intensity: drive.intensity
            });

            return Object.freeze({
                action: drive.name,
                attribute: drive.attr,
                result: result,
                intensity: drive.intensity,
                tendency: tendency,
                safety: safetyCheck,
                axiom: ACTOR_AXIOM
            });
        }

        /** CURTAIN — after the beat, remember and update. */
        function curtain(performance, sceneName) {
            _rep.remember(
                sceneName || 'scene',
                performance ? performance.action : 'idle',
                Date.now(),
                _rep.mood()
            );
            return _rep.latest();
        }

        /** Full beat — cue → perform → curtain in one call. */
        function beat(sceneContext, sceneName) {
            const c = cue();
            const p = perform(sceneContext);
            const r = curtain(p, sceneName);
            return Object.freeze({ cue: c, performance: p, memory: r });
        }

        /** Move to a new mark on stage. */
        function moveTo(newMark, stageRef) {
            _block = blocking(newMark, _char.name, stageRef || o.stageRef);
        }

        return Object.freeze({
            id: _id,
            soul: _soul, character: _char, safety: _safeSoul,
            blocking: _block, motivation: _motiv, repertoire: _rep,
            cue, perform, curtain, beat, moveTo,
            /** The actor behind every character — always safe, always aware. */
            actorAxiom: () => ACTOR_AXIOM,
            /** Am I a cast member or an extra? Cast members have souls. */
            isCastMember: true,
            snapshot: () => ({
                id: _id, character: _char.snapshot(),
                soul: _soul.snapshot(), blocking: _block.snapshot(),
                motivation: _motiv.snapshot(), repertoire: _rep.snapshot()
            })
        });
    }

    /** Create an extra — a non-autonomous background entity.
     *  No soul, no motivation, no memory. Just set dressing.
     *  Can be PROMOTED to cast member by giving it a soul. */
    function extra(id, opts) {
        const o = opts || {};
        const _id = id || ('extra_' + Date.now());
        return Object.freeze({
            id: _id,
            isCastMember: false,
            isExtra: true,
            isProp: false,
            position: o.position || { x: 0, y: 0, z: 0 },
            appearance: o.appearance || {},
            /** Promote this extra to a full cast member. */
            promote: (soulAttrs, role) => castMember(_id, {
                soul: soulAttrs, role, mark: o.position,
                stageRef: o.stageRef
            }),
            snapshot: () => ({ id: _id, type: 'extra', position: o.position })
        });
    }

    /** Create a prop — an inert stage object. No autonomy at all.
     *  A sword, a chair, a treasure chest. Set dressing.
     *  Can be PROMOTED to cast member (enchanted sword, anyone?). */
    function prop(id, opts) {
        const o = opts || {};
        const _id = id || ('prop_' + Date.now());
        return Object.freeze({
            id: _id,
            isCastMember: false,
            isExtra: false,
            isProp: true,
            position: o.position || { x: 0, y: 0, z: 0 },
            appearance: o.appearance || {},
            properties: o.properties || {},
            /** Promote this prop to a cast member (it comes alive!). */
            promote: (soulAttrs, role) => castMember(_id, {
                soul: soulAttrs, role, mark: o.position,
                stageRef: o.stageRef
            }),
            snapshot: () => ({ id: _id, type: 'prop', position: o.position })
        });
    }

    return Object.freeze({
        stage, STAGE_WHITELIST,
        soul, DEFAULT_SOUL,
        safety, SAFETY_FLOOR, ACTOR_AXIOM,
        blocking, character, ALIGNMENT,
        motivation, repertoire,
        castMember, extra, prop
    });

})(typeof Schwarz !== 'undefined' ? Schwarz : require('../schwarz.js'));

if (typeof window !== 'undefined') window.SchwarzAutEng = SchwarzAutEng;
if (typeof module !== 'undefined') module.exports = SchwarzAutEng;

