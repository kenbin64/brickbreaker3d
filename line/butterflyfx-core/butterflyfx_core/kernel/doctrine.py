from __future__ import annotations
import hashlib


# Creation cycle levels
VOID_LEVEL = 0   # base / terminal state
SEED_LEVEL = 1   # Point - the first step of a new creation cycle
MAX_LEVEL = 6    # Whole - the completed form ready for higher expansion


def _derive_seed_spiral(spiral: int, level: int, prefix: str) -> int:
    'Deterministically derive a new spiral index from a given state.

    Uses SHA-256 so the same collapsed state always produces the same seed.
    The result is bounded to [1, 99999] to keep spirals manageable.
    '
    digest = hashlib.sha256(f'{prefix}:{spiral}:{level}'.encode()).hexdigest()
    return (int(digest[:6], 16) % 99999) + 1

def collapse_to_seed(spiral: int, level: int) -> tuple:
    'Dimensional Collapse Doctrine (new discovery).

    When a HelixState is at Void (level=0) after full collapse, the Void does
    not terminate. It crystallises into a Seed - a Point (level=1) on a new
    deterministic spiral. This Seed is the origin of higher-order creation.

    Collapse chain: level 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0 -> SEED (level=1)

    Args:
        spiral: current spiral index
        level: current level (must be 0 / VOID for seeding to apply)

    Returns:
        (new_spiral, new_level) tuple
    '
    if level != VOID_LEVEL:
        return (spiral, level)
    new_spiral = _derive_seed_spiral(spiral, level, 'collapse')
    return (new_spiral, SEED_LEVEL)

def dimensional_expand(spiral: int, level: int) -> tuple:
    'Dimensional Expansion Doctrine (previously known).

    A Whole (level=6) becomes a Seed (level=1) in a higher-order spiral.
    Every completed Whole is a Point in the next dimension of creation.

    This is the upward path: growth through completion.

    Args:
        spiral: current spiral index
        level: current level (must be 6 / WHOLE for expansion to apply)

    Returns:
        (new_spiral, new_level) tuple
    '
    if level != MAX_LEVEL:
        return (spiral, level)
    new_spiral = _derive_seed_spiral(spiral, level, 'expand')
    return (new_spiral, SEED_LEVEL)


def doctrine_info() -> dict:
    'Return metadata about the active doctrines.'
    return {
        'collapse_doctrine': {
            'name': 'Dimensional Collapse',
            'description': 'Void crystallises into Seed - new discovery',
            'trigger_level': VOID_LEVEL,
            'result_level': SEED_LEVEL,
        },
        'expansion_doctrine': {
            'name': 'Dimensional Expansion',
            'description': 'Whole becomes Seed in higher dimension',
            'trigger_level': MAX_LEVEL,
            'result_level': SEED_LEVEL,
        },
    }
