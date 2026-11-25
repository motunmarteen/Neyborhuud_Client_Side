"""Cut the 3.9 MB Material Symbols font down to the icons the app uses.

Needed again only when src/lib/iconFont.test.ts says an icon is missing:
    pip install fonttools brotli
    python tools/icon-font/subset.py      (from pwa/)

An icon is "used" when its name appears as a word in the app's or the server's source (the server
sends some icon names). Too many is fine; a missing one would show as plain words on screen.
"""
import pathlib
import re

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

here = pathlib.Path(__file__).parent
pwa = here.parent.parent
font = TTFont(here / "full.woff2")
chars = {g: chr(c) for c, g in font.getBestCmap().items() if c < 128}
ligs = {}
for lookup in font["GSUB"].table.LookupList.Lookup:
    for st in lookup.SubTable:
        st = getattr(st, "ExtSubTable", st)
        for first, entries in getattr(st, "ligatures", {}).items():
            for l in entries:
                ligs["".join(chars[g] for g in [first, *l.Component])] = l.LigGlyph

words = set()
for root in (pwa / "src", pwa.parent.parent / "NeyborHuud-ServerSide" / "src"):
    for f in root.rglob("*"):
        if f.suffix in {".ts", ".tsx", ".css", ".json"}:
            words |= set(re.findall(r"[a-z0-9_]+", f.read_text("utf8", "ignore")))
used = sorted(n for n in ligs if n in words)

opt = subset.Options()
opt.flavor = "woff2"
opt.layout_closure = False
opt.layout_features = ["*"]
opt.hinting = False
opt.notdef_outline = True
s = subset.Subsetter(opt)
s.populate(glyphs=[ligs[n] for n in used], text="abcdefghijklmnopqrstuvwxyz0123456789_")
s.subset(font)
font = instancer.instantiateVariableFont(font, {"opsz": 24, "GRAD": 0, "wght": (300, 400, 600)})
out = pwa / "public" / "fonts" / "material-symbols-v2.woff2"
font.flavor = "woff2"
font.save(out)
(here / "icons.txt").write_text("\n".join(used) + "\n", "utf8", newline="\n")
(here / "all-icons.txt").write_text("\n".join(sorted(ligs)) + "\n", "utf8", newline="\n")
print(len(ligs), "icons ->", len(used), "|", out.stat().st_size // 1024, "KB")
