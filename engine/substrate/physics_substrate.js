/**
 * Physics Substrate - Minimal physics engine
 * 
 * Schwarz Diamond principle: minimal code, maximum functionality.
 * This entire physics system is ~100 lines.
 * 
 * Handles: vectors, collisions, forces, bounds
 */

const PhysicsSubstrate = (function() {
    'use strict';
    
    // ================================
    // VECTOR OPERATIONS (Level 1-2: Point/Length)
    // ================================
    
    const vec3 = {
        create: (x = 0, y = 0, z = 0) => ({ x, y, z }),
        
        add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
        
        sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
        
        scale: (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
        
        length: (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
        
        normalize: (v) => {
            const len = vec3.length(v);
            return len > 0 ? vec3.scale(v, 1 / len) : vec3.create();
        },
        
        dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
        
        reflect: (v, normal) => {
            const d = 2 * vec3.dot(v, normal);
            return vec3.sub(v, vec3.scale(normal, d));
        },
        
        clamp: (v, min, max) => ({
            x: Math.max(min, Math.min(max, v.x)),
            y: Math.max(min, Math.min(max, v.y)),
            z: Math.max(min, Math.min(max, v.z))
        }),
        
        distance: (a, b) => vec3.length(vec3.sub(a, b))
    };
    
    // ================================
    // BODY (Level 6: Whole entity)
    // ================================
    
    function createBody(options = {}) {
        return {
            pos: options.pos || vec3.create(),
            vel: options.vel || vec3.create(),
            radius: options.radius || 1,
            mass: options.mass || 1,
            restitution: options.restitution || 0.9,
            static: options.static || false
        };
    }
    
    // ================================
    // COLLISION (Level 4-5: Plane/Volume)
    // ================================
    
    function sphereVsSphere(a, b) {
        const dist = vec3.distance(a.pos, b.pos);
        const minDist = a.radius + b.radius;
        
        if (dist >= minDist) return null;
        
        const normal = vec3.normalize(vec3.sub(a.pos, b.pos));
        const penetration = minDist - dist;
        
        return { normal, penetration, point: vec3.add(b.pos, vec3.scale(normal, b.radius)) };
    }
    
    function sphereVsPlane(sphere, planeNormal, planeD) {
        const dist = vec3.dot(sphere.pos, planeNormal) - planeD;
        
        if (dist > sphere.radius) return null;
        
        return {
            normal: planeNormal,
            penetration: sphere.radius - dist,
            point: vec3.sub(sphere.pos, vec3.scale(planeNormal, dist))
        };
    }
    
    function sphereVsBox(sphere, boxMin, boxMax) {
        // Clamp sphere center to box bounds
        const closest = {
            x: Math.max(boxMin.x, Math.min(boxMax.x, sphere.pos.x)),
            y: Math.max(boxMin.y, Math.min(boxMax.y, sphere.pos.y)),
            z: Math.max(boxMin.z, Math.min(boxMax.z, sphere.pos.z))
        };
        
        const dist = vec3.distance(sphere.pos, closest);
        if (dist >= sphere.radius) return null;
        
        const normal = vec3.normalize(vec3.sub(sphere.pos, closest));
        return { normal, penetration: sphere.radius - dist, point: closest };
    }
    
    // ================================
    // RESOLUTION (Level 3: Width/Force)
    // ================================
    
    function resolveCollision(body, collision) {
        if (body.static || !collision) return;
        
        // Separate
        body.pos = vec3.add(body.pos, vec3.scale(collision.normal, collision.penetration));
        
        // Reflect velocity
        const velDotN = vec3.dot(body.vel, collision.normal);
        if (velDotN < 0) {
            body.vel = vec3.reflect(body.vel, collision.normal);
            body.vel = vec3.scale(body.vel, body.restitution);
        }
    }
    
    // ================================
    // INTEGRATION (Level 0: Potential → Actual)
    // ================================
    
    function integrate(body, dt, gravity = null) {
        if (body.static) return;
        
        // Apply gravity
        if (gravity) {
            body.vel = vec3.add(body.vel, vec3.scale(gravity, dt));
        }
        
        // Update position
        body.pos = vec3.add(body.pos, vec3.scale(body.vel, dt));
    }
    
    // Public API — the minimal surface
    return {
        vec3,
        createBody,
        sphereVsSphere,
        sphereVsPlane,
        sphereVsBox,
        resolveCollision,
        integrate
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsSubstrate;
}

