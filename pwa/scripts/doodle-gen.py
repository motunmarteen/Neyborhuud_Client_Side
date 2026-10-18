"""Generate the NeyborHuud doodle background tiles (light and dark).

A 480x480 seamless tile: Nigerian life and NeyborHuud motifs as clean line icons on a
jittered grid, with greetings in Nigerian languages and small sparkles between them.
Every motif is drawn in a 24x24 box with round caps, like the app's icons.
"""
import math
import random
import sys

M = {
    # getting around
    "danfo": '<path d="M2 16V9a2 2 0 0 1 2-2h12l4 4v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><path d="M5 10h3M10 10h3M15 10h2M2 13h20"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    "okada": '<circle cx="5" cy="16" r="3.2"/><circle cx="19" cy="16" r="3.2"/><path d="M5 16l4-6h5l2 6M9 10 8 7h3M14 10l3-2h2"/><circle cx="12.5" cy="5" r="1.5"/><path d="M12 6.5 11 10"/>',
    "keke": '<path d="M3 16v-6a4 4 0 0 1 4-4h8l4 5v5z"/><path d="M8 6v10M3 12h5"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    # places
    "palm": '<path d="M12 22c0-5 .5-9 1-12"/><path d="M13 10c-2-3-6-4-9-3M13 10c2-3 6-4 9-2M13 10c-1-3-1-6 1-8M13 10c-3 0-6 2-7 5M13 10c3 0 6 2 7 5"/>',
    "zuma": '<path d="M2 20c2-8 5-13 10-13s8 5 10 13z"/><path d="M9 12c1 .5 2 .5 3 0M10.5 15.5h3M14 11l1 .3"/>',
    "bridge": '<path d="M8 20V5M16 20V5M8 5l-6 8M8 5l6 8M16 5l-6 8M16 5l6 8M1 14h22"/><path d="M2 19c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>',
    "skyline": '<path d="M2 21V11h4v10M6 21V6h5v15M11 21V9h4v12M15 21V4h4v17M19 21v-8h3v8M1 21h22"/><path d="M8 9h1M8 12h1M17 7h0M17 10h0"/>',
    "compound": '<path d="M2 10l10-6 10 6M4 9v11h16V9M9 20v-5h6v5"/><path d="M6 7.8 5 9.2M10 5.4 9 7M14 5.4l1 1.6M18 7.8l1 1.4"/>',
    # food
    "jollof": '<path d="M4 11h16l-1.5 8a2 2 0 0 1-2 1.6h-9a2 2 0 0 1-2-1.6z"/><path d="M3 11h18M3 13H1.5M21 13h1.5M9 8c-1-1 1-2 0-3M12 8c-1-1 1-2 0-3M15 8c-1-1 1-2 0-3"/>',
    "suya": '<path d="M3 21 21 3"/><circle cx="8.5" cy="15.5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="15.5" cy="8.5" r="2.2"/><path d="M5 9l1 1M9 5l1 1M15 19l1-1M19 15l-1 1"/>',
    "dodo": '<path d="M4 18c5 2 12-1 15-9 .6-1.6-1-2.4-1.8-1.2C14 13 9 15.5 4.5 15.2c-1.5-.1-2 2.2-.5 2.8z"/><path d="m19 8 1.5-2M8 16l.5-1M11.5 14.5l.4-1"/>',
    "bread": '<path d="M3 13c0-4 4-6 9-6s9 2 9 6v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="m8 9 1 3M12 8v3M16 9l-1 3"/>',
    "yam": '<path d="M5 18c-2-2-1-6 2-9s7-5 10-4 3 5 0 9-8 6-12 4z"/><path d="m9 11-1-1M13 9V7.5M12 14l1 1M16 11l1.2.3"/>',
    "mango": '<path d="M12 21c-5 0-8-4-7-8s5-7 9-6 6 5 5 9-3 5-7 5z"/><path d="M14 7c0-2 2-3 4-2-1 2-2 2-4 2z"/>',
    # culture
    "drum": '<path d="M6 3h12M6 21h12M6 3c3 4 3 14 0 18M18 3c-3 4-3 14 0 18M8 6l8 12M16 6 8 18"/>',
    "eyo": '<ellipse cx="12" cy="15" rx="10" ry="3"/><path d="M7 15c0-5 2-8 5-8s5 3 5 8M7.3 12.6h9.4"/>',
    "fila": '<path d="M5 17c0-5 2-9 7-10 4-.8 7 1 7 4.5V17z"/><path d="M5 17h14M19 11.5c1.5-.3 2.5.5 2.5 1.5M8 13l1.5-3M11.5 13l1.2-3.5M15 13l.8-3.2"/>',
    "gele": '<path d="M5 13c0-5 3-8 7-8s7 3 7 8M3 13c3-2 15-2 18 0M6 10c3-2 9-2 12 0M8 13c0 3 2 6 4 6s4-3 4-6"/>',
    "adire": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/><circle cx="12" cy="12" r=".8"/>',
    "ankara": '<path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7l5 5-5 5-5-5z"/><circle cx="12" cy="12" r="1"/>',
    "calabash": '<path d="M12 21a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z"/><path d="M4 13c2-1.5 14-1.5 16 0M8 16.5l2 1.5 2-1.5 2 1.5 2-1.5"/>',
    "mortar": '<path d="M5 11h14l-2 9H7z"/><path d="M6 11c0-1 12-1 12 0M14 10l5-8"/>',
    # daily life
    "pole": '<path d="M12 2v20M6 5h12M8 9h8M1 6c3 2 6 2 5-1M23 6c-3 2-6 2-5-1"/><rect x="10" y="12" width="4" height="4" rx=".6"/>',
    "generator": '<rect x="3" y="9" width="18" height="10" rx="1.5"/><path d="M7 9V6h10v3M15 13h3M15 16h3M20 6c1-1 0-2 1-3"/><rect x="6" y="12" width="5" height="4" rx=".6"/>',
    "bulb": '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.6 1.5 2.6V17h4v-.5c0-1 .6-1.9 1.5-2.6A6 6 0 0 0 12 3z"/><path d="M2 9h2M20 9h2M4.5 3.5 6 5M19.5 3.5 18 5"/>',
    "tap": '<path d="M3 7h9v4H3zM12 8.5h4.5a3 3 0 0 1 3 3V13M7.5 7V4M5.5 4h4"/><path d="M19.5 17c0 1.4-.9 2.3-2 2.3s-2-.9-2-2.3c0-1.1 2-3.3 2-3.3s2 2.2 2 3.3z"/>',
    "rain": '<path d="M7 15a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z"/><path d="m8 18-1 2M12 18l-1 2M16 18l-1 2"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    "football": '<circle cx="12" cy="12" r="9"/><path d="M12 8l3.2 2.3-1.2 3.7h-4l-1.2-3.7z"/><path d="M12 8V3.2M15.2 10.3l4.4-1.5M14 14l2.8 3.8M10 14l-2.8 3.8M8.8 10.3 4.4 8.8"/>',
    "umbrella": '<path d="M3 10a9 6 0 0 1 18 0z"/><path d="M12 10v11M5 16h14M7 16v5M17 16v5M7.5 10 9 6M16.5 10 15 6"/>',
    "phone": '<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M11 18h2M19.5 6a4 4 0 0 1 0 5M21.5 4a7 7 0 0 1 0 9"/>',
    "flag": '<path d="M4 21V3"/><rect x="4" y="4" width="16" height="9" rx=".6"/><path d="M9.3 4v9M14.7 4v9"/>',
    # neyborhuud
    "pin": '<path d="M12 22s7-6.4 7-12A7 7 0 0 0 5 10c0 5.6 7 12 7 12z"/><path d="M9 11.5 12 9l3 2.5V14H9z"/>',
    "shield": '<path d="M12 2.5 19 5v6.2c0 5.1-3 8.4-7 10.3-4-1.9-7-5.2-7-10.3V5l7-2.5z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    "coin": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.6"/><path d="M9.2 16V8l5.6 8V8M7.8 11h8.4M7.8 13.4h8.4"/>',
    "orb": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    "hearthands": '<path d="M12 10.5c-1-2-4.5-2-4.5.8 0 2 2.5 3.6 4.5 5 2-1.4 4.5-3 4.5-5 0-2.8-3.5-2.8-4.5-.8z"/><path d="M3 14c2 0 3 1 5 3 1 1 2.5 1.5 4 1.5s3-.5 4-1.5c2-2 3-3 5-3"/>',
    "megaphone": '<path d="M3 10v4h3l7 4V6l-7 4z"/><path d="M16 9a3 3 0 0 1 0 6M18.5 6.5a7 7 0 0 1 0 11"/>',
    "chat": '<path d="M4 5h16a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H9l-5 3.8v-3.8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="8" cy="11" r=".7"/><circle cx="12" cy="11" r=".7"/><circle cx="16" cy="11" r=".7"/>',
}

WORDS = ["NeyborHuud", "How far?", "Ẹ káàbọ̀", "Sannu", "Nnọọ", "Abeg", "Naija", "Light don come!", "Ndewo", "We dey", "Owambe", "My Huud"]

SPARKLE = '<path d="M0 -4 1 -1 4 0 1 1 0 4 -1 1 -4 0 -1 -1z"/>'


def wrap(el_at, x, y, size, reach):
    """The element at (x, y), plus copies one tile over wherever it would cross an edge."""
    out = []
    for dx in (-size, 0, size):
        for dy in (-size, 0, size):
            nx, ny = x + dx, y + dy
            if -reach <= nx <= size + reach and -reach <= ny <= size + reach:
                out.append(el_at(nx, ny))
    return out


def build(dark: bool) -> str:
    rnd = random.Random(20261018)
    size = 480
    n = 9
    cell = size / n
    if dark:
        main, accent, third, route, op = "#46D98C", "#F2C14E", "#9FB3D1", "#46D98C", 0.15
    else:
        main, accent, third, route, op = "#0E8A3E", "#C98A0B", "#1D2433", "#0E8A3E", 0.19
    names = list(M.keys())
    cells = [(r, c) for r in range(n) for c in range(n)]
    rnd.shuffle(cells)
    word_cells = cells[: len(WORDS)]
    out = []

    # Faint dotted streets winding across the tile (they join up from tile to tile).
    for k in range(3):
        y0 = size * (k + 0.5) / 3 + rnd.uniform(-20, 20)
        amp = rnd.uniform(14, 26)
        ph = rnd.uniform(0, math.tau)
        pts = [(x, y0 + amp * math.sin(ph + x / size * math.tau * 2)) for x in range(0, size + 1, 12)]
        d = "M" + " L".join(f"{x:.0f} {y:.1f}" for x, y in pts)
        for dy in (-size, 0, size):
            out.append(f'<path d="{d}" transform="translate(0 {dy})" stroke="{route}" stroke-width="1.6" stroke-dasharray="1 7" opacity=".55"/>')

    pool = []
    for r, c in cells[len(WORDS):]:
        if not pool:
            pool = names[:]
            rnd.shuffle(pool)
        name = pool.pop()
        cx = (c + 0.5) * cell + rnd.uniform(-12, 12)
        cy = (r + 0.5) * cell + rnd.uniform(-12, 12)
        sc = rnd.uniform(1.22, 1.5)
        rot = rnd.uniform(-16, 16)
        roll = rnd.random()
        color = main if roll < 0.62 else accent if roll < 0.9 else third
        body = M[name]
        out += wrap(
            lambda x, y: f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f}) scale({sc:.2f}) translate(-12 -12)" stroke="{color}">{body}</g>',
            cx, cy, size, 24,
        )
    words = WORDS[:]
    for (r, c) in sorted(word_cells):
        w = words.pop()
        cx = (c + 0.5) * cell + rnd.uniform(-5, 5)
        cy = (r + 0.5) * cell + rnd.uniform(-5, 5)
        rot = rnd.uniform(-12, 12)
        fs = 13 if len(w) <= 7 else 11.5
        color = accent if rnd.random() < 0.45 else main
        out += wrap(
            lambda x, y: (
                f'<text x="{x:.1f}" y="{y:.1f}" transform="rotate({rot:.1f} {x:.1f} {y:.1f})" fill="{color}" stroke="none" '
                f'font-family="Nunito, Trebuchet MS, Segoe UI, sans-serif" font-weight="800" font-size="{fs}" '
                f'text-anchor="middle" dominant-baseline="middle" letter-spacing=".3">{w}</text>'
            ),
            cx, cy, size, 70,
        )
    # Sparkles and dots where cells meet, filling the gaps without crowding.
    for r in range(n):
        for c in range(n):
            if rnd.random() < 0.6:
                x, y = (c + 1) * cell, (r + 1) * cell
                if rnd.random() < 0.5:
                    s = rnd.uniform(0.9, 1.4)
                    out += wrap(lambda a, b: f'<g transform="translate({a:.1f} {b:.1f}) scale({s:.2f})" fill="{accent}" stroke="none">{SPARKLE}</g>', x, y, size, 6)
                else:
                    rr = rnd.uniform(1.2, 1.9)
                    out += wrap(lambda a, b: f'<circle cx="{a:.1f}" cy="{b:.1f}" r="{rr:.1f}" fill="{main}" stroke="none"/>', x, y, size, 3)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<g fill="none" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" opacity="{op}">'
        + "".join(out)
        + "</g></svg>"
    )


if __name__ == "__main__":
    pub = sys.argv[1]
    open(f"{pub}/doodle-pattern.svg", "w", encoding="utf-8").write(build(False))
    open(f"{pub}/doodle-pattern-dark.svg", "w", encoding="utf-8").write(build(True))
    print("motifs", len(M), "words", len(WORDS))
