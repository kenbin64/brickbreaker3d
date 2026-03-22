#!/usr/bin/env python3
"""
Fix mojibake in board_3d_game.js.
The file is UTF-8 but contains emoji that were mis-read as Windows-1252
and stored as those codepoints. This script detects and reverses that.
"""

WIN1252_TO_BYTE = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F,
}


def to_byte(c):
    cp = ord(c)
    if cp <= 0xFF:
        return cp
    return WIN1252_TO_BYTE.get(cp, None)


def build_3byte_map():
    """
    Build a map of mojibake sequences (3 chars) -> correct Unicode char.
    The mojibake arises from UTF-8 bytes being read as Windows-1252.
    """
    result = {}
    # Known 3-byte Unicode chars that appear as emoji/symbols in JS files
    KNOWN_3BYTE_CHARS = [
        '⚽', '✔', '✗', '✂', '⭐', '⏭', '⏰', '⏳', '⚙', '✓', '✕',
        '→', '←', '↑', '↓', '═', '║', '╔', '╗', '╚', '╝', '─', '│',
        '☆', '★', '♠', '♥', '♦', '♣', '©', '™', '®', '⛔', '⚡',
        '✨', '☑', '☐', '✉', '⚠', '▶', '◀', '▲', '▼', '◆', '■', '●',
    ]
    for ch in KNOWN_3BYTE_CHARS:
        b = ch.encode('utf-8')
        if len(b) == 3:
            # Decode the 3 UTF-8 bytes as cp1252 to get the mojibake string
            try:
                mojibake = b.decode('cp1252')
                result[mojibake] = ch
            except (UnicodeDecodeError, LookupError):
                # Fall back to latin-1 for bytes with no cp1252 mapping
                try:
                    mojibake = b.decode('latin-1')
                    result[mojibake] = ch
                except Exception:
                    pass
    return result


def fix_mojibake(text):
    """
    Only fix 4-byte emoji sequences (lead byte 0xF0-0xF7 = codepoints U+10000+)
    plus a curated list of known 3-byte sequences that appear as mojibake.
    This avoids touching legitimate 2- and 3-byte UTF-8 chars in the source.
    """
    THREE_BYTE_MAP = build_3byte_map()

    result = []
    i = 0
    while i < len(text):
        # Check for known 3-byte mojibake sequences (3 chars -> 1 char)
        found_3 = False
        for moji, correct in THREE_BYTE_MAP.items():
            if text[i:i+len(moji)] == moji:
                result.append(correct)
                i += len(moji)
                found_3 = True
                break
        if found_3:
            continue

        c = text[i]
        b = to_byte(c)
        # Only fix 4-byte leading bytes (0xF0-0xF7) to catch emoji
        if b is not None and 0xF0 <= b <= 0xF7:
            byte_seq = [b]
            j = i + 1
            while j < len(text) and len(byte_seq) < 4:
                nb = to_byte(text[j])
                if nb is not None and 0x80 <= nb <= 0xBF:
                    byte_seq.append(nb)
                    j += 1
                else:
                    break
            if len(byte_seq) == 4:
                try:
                    decoded = bytes(byte_seq).decode('utf-8')
                    result.append(decoded)
                    i = j
                    continue
                except UnicodeDecodeError:
                    pass

        result.append(c)
        i += 1
    return ''.join(result)


if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'volume/games/fasttrack/board_3d_game.js'
    dry_run = '--dry-run' in sys.argv

    with open(path, encoding='utf-8') as f:
        original = f.read()

    fixed = fix_mojibake(original)
    print(f"Length before: {len(original)}, after: {len(fixed)}")
    print(f"Emoji sequences fixed (approx): {(len(original) - len(fixed)) // 3}")

    # Show sample - search in fixed text
    idx = fixed.find('avatarEmojis')
    if idx >= 0:
        print("\nFixed avatarEmojis line:")
        print(fixed[idx:idx+200])

    idx2 = fixed.find("sessionParams.get('avatar')")
    if idx2 >= 0:
        print("\nFixed avatar fallback line:")
        print(fixed[idx2:idx2+80])

    if not dry_run:
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(fixed)
        print(f"\nFile written: {path}")
    else:
        print("\n(dry run - file not written)")

