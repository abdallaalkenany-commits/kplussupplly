"""K Plus product & category illustrations (original vector art, brand colours).

Run:  python3 scripts/art/gen.py && node scripts/art/render.js
Writes SVG sources to scripts/art/out/*.svg and WebP files to public/img/.
Every image is drawn here from scratch, so there are no third-party licences.
"""
import json, math, os, base64

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)

NAVY, NAVY2, AMBER, AMBER2 = "#0B2545", "#13315C", "#F29F05", "#D98B00"
INK, MUTED = "#1d2433", "#5b6475"
W, H = 800, 600

with open(os.path.join(REPO, "public/assets/mark-hd.png"), "rb") as f:
    MARK = "data:image/png;base64," + base64.b64encode(f.read()).decode()


# ---------------------------------------------------------------- helpers
def poly(pts, fill, stroke=None, sw=0, extra=""):
    s = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ""
    return f'<polygon points="{s}" fill="{fill}"{st} {extra}/>'


def shade(hexc, k):
    """k<1 darker, k>1 lighter"""
    h = hexc.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if k <= 1:
        r, g, b = (int(c * k) for c in (r, g, b))
    else:
        t = k - 1
        r, g, b = (int(c + (255 - c) * t) for c in (r, g, b))
    return f"#{max(0,min(255,r)):02x}{max(0,min(255,g)):02x}{max(0,min(255,b)):02x}"


class Iso:
    """Simple isometric projector."""

    def __init__(self, ox, oy, s=1.0):
        self.ox, self.oy, self.s = ox, oy, s

    bb = None

    def p(self, x, y, z):
        s = self.s
        pt = (self.ox + (x - y) * 0.866 * s, self.oy + (x + y) * 0.5 * s - z * s)
        b = self.bb or [pt[0], pt[1], pt[0], pt[1]]
        self.bb = [min(b[0], pt[0]), min(b[1], pt[1]), max(b[2], pt[0]), max(b[3], pt[1])]
        return pt

    def fit(self, body, box=(120, 110, 680, 500), maxs=1.6):
        x0, y0, x1, y1 = self.bb
        k = min((box[2] - box[0]) / (x1 - x0), (box[3] - box[1]) / (y1 - y0), maxs)
        tx = (box[0] + box[2]) / 2 - k * (x0 + x1) / 2
        ty = box[3] - k * y1
        return f'<g transform="translate({tx:.1f},{ty:.1f}) scale({k:.3f})">{body}</g>'

    def box(self, x, y, z, a, b, c, col, top=None, holes=None, edge=True):
        P = self.p
        t = top or shade(col, 1.18)
        l = shade(col, 0.86)
        r = shade(col, 0.72)
        sk = shade(col, 0.6) if edge else None
        out = [
            poly([P(x, y + b, z), P(x + a, y + b, z), P(x + a, y + b, z + c), P(x, y + b, z + c)], l, sk, 1),
            poly([P(x + a, y, z), P(x + a, y + b, z), P(x + a, y + b, z + c), P(x + a, y, z + c)], r, sk, 1),
            poly([P(x, y, z + c), P(x + a, y, z + c), P(x + a, y + b, z + c), P(x, y + b, z + c)], t, sk, 1),
        ]
        for hx, hy, hw, hh in holes or []:
            zz = z + c
            out.append(poly([P(x + hx, y + hy, zz), P(x + hx + hw, y + hy, zz), P(x + hx + hw, y + hy + hh, zz), P(x + hx, y + hy + hh, zz)], shade(col, 0.5)))
        return "".join(out)


def frame(body, badge=None, bg=("#F5F7FA", "#E3E9F1"), glow=True):
    b = ""
    if badge:
        w = 64 + len(badge) * 14
        b = (f'<g transform="translate({W-40-w},36)"><rect width="{w}" height="46" rx="23" fill="{NAVY}"/>'
             f'<circle cx="25" cy="23" r="6" fill="{AMBER}"/>'
             f'<text x="42" y="31" text-anchor="start" font-family="Inter" font-weight="700" font-size="22" fill="#fff">{badge}</text></g>')
    g = '<circle cx="400" cy="300" r="250" fill="#fff" opacity=".75"/>' if glow else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{bg[0]}"/><stop offset="1" stop-color="{bg[1]}"/></linearGradient>
<linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d97a5"/><stop offset=".35" stop-color="#f4f6f9"/><stop offset=".6" stop-color="#b8c0cc"/><stop offset="1" stop-color="#6f7887"/></linearGradient>
<linearGradient id="chromeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset=".5" stop-color="#aab3c0"/><stop offset="1" stop-color="#6f7887"/></linearGradient>
<linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3b27a"/><stop offset=".5" stop-color="#c8743a"/><stop offset="1" stop-color="#8c4a1f"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="porc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e8ef"/></linearGradient>
<radialGradient id="glowY" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD36B" stop-opacity=".9"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<path d="M0 0h170a170 170 0 0 1-170 170z" fill="{AMBER}" opacity=".14"/>
<path d="M{W} {H}h-120a120 120 0 0 1 120-120z" fill="{NAVY}" opacity=".07"/>
{g}
<ellipse cx="400" cy="520" rx="300" ry="22" fill="{NAVY}" opacity=".10"/>
{body}
{b}
<image href="{MARK}" x="34" y="{H-74}" width="30" height="40" opacity=".85"/>
</svg>'''


def text(x, y, s, size=20, fill="#fff", weight=700, anchor="middle", fam="Inter"):
    return f'<text x="{x}" y="{y}" font-family="{fam}" font-weight="{weight}" font-size="{size}" fill="{fill}" text-anchor="{anchor}">{s}</text>'


# ---------------------------------------------------------------- cement
def pallet(x, y, w):
    o = [f'<rect x="{x}" y="{y}" width="{w}" height="12" rx="2" fill="#c89a62"/>',
         f'<rect x="{x}" y="{y+12}" width="{w}" height="4" fill="#9c7243"/>']
    for i in range(4):
        bx = x + 6 + i * (w - 42) / 3
        o.append(f'<rect x="{bx}" y="{y+16}" width="30" height="16" fill="#b4834f"/>')
    o.append(f'<rect x="{x}" y="{y+32}" width="{w}" height="8" rx="2" fill="#c89a62"/>')
    return "".join(o)


def bag(x, y, w=170, h=96, label="CEM I", sub="42.5N · 50 kg", body="#E8DCC4", panel=NAVY, band=AMBER):
    edge = shade(body, 0.78)
    pw, ph = w * 0.7, h * 0.5
    return f'''<g transform="translate({x},{y})">
<path d="M8 10 Q2 0 18 3 L{w-18} 3 Q{w-2} 0 {w-8} 10 L{w-3} {h-14} Q{w} {h} {w-16} {h} L16 {h} Q0 {h} 3 {h-14} Z" fill="{body}" stroke="{edge}" stroke-width="2"/>
<path d="M14 10 Q{w/2} 18 {w-14} 10" fill="none" stroke="{edge}" stroke-width="1.5" opacity=".7"/>
<rect x="{(w-pw)/2}" y="{h*0.28}" width="{pw}" height="{ph}" rx="6" fill="{panel}"/>
<rect x="{(w-pw)/2}" y="{h*0.28}" width="{pw*0.14}" height="{ph}" rx="4" fill="{band}"/>
{text((w-pw)/2 + pw*0.57, h*0.28 + ph*0.48, label, h*0.17, "#fff" if panel not in ("#ffffff", "#fff") else NAVY)}
{text((w-pw)/2 + pw*0.57, h*0.28 + ph*0.84, sub, h*0.105, "#cfd8e6" if panel not in ("#ffffff", "#fff") else MUTED, 600)}
<path d="M10 {h-8} Q{w/2} {h-2} {w-10} {h-8}" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>
</g>'''


def bag_stack(label="CEM I", sub="42.5N · 50 kg", body="#E8DCC4", panel=NAVY, band=AMBER, n=3):
    bw, bh = 170, 96
    o = [pallet(400 - 290, 476, 580)]
    rows = [3, 2, 1] if n >= 3 else [2, 1]
    for r, cnt in enumerate(rows):
        tot = cnt * bw + (cnt - 1) * 8
        for i in range(cnt):
            o.append(bag(400 - tot / 2 + i * (bw + 8), 382 - r * (bh - 6), bw, bh, label, sub, body, panel, band))
    return '<g transform="translate(400,516) scale(1.2) translate(-400,-516)">' + "".join(o) + "</g>"


def silo_truck(x=95, y=230, label="BULK"):
    return f'''<g transform="translate({x},{y})">
<rect x="0" y="210" width="610" height="14" rx="4" fill="#3a4556"/>
<rect x="120" y="40" width="440" height="150" rx="75" fill="url(#chromeV)" stroke="#6f7887" stroke-width="2"/>
<rect x="120" y="100" width="440" height="22" fill="{AMBER}"/>
{text(340, 118, label + " · CEMENT", 18, NAVY, 800)}
<rect x="300" y="18" width="60" height="26" rx="4" fill="#8d97a5"/><rect x="420" y="18" width="60" height="26" rx="4" fill="#8d97a5"/>
<path d="M130 190 L180 190 L200 208 L110 208 Z" fill="#6f7887"/>
<path d="M500 190 L550 190 L570 208 L480 208 Z" fill="#6f7887"/>
<path d="M0 210 V90 Q0 70 20 70 H80 L110 120 V210 Z" fill="{NAVY}"/>
<path d="M14 84 H74 L96 120 H14 Z" fill="#9fc3e8" opacity=".9"/>
<rect x="0" y="150" width="110" height="10" fill="{AMBER}"/>
<rect x="104" y="130" width="22" height="80" fill="#2a3446"/>
{''.join(f'<g transform="translate({cx},226)"><circle r="30" fill="#1d2433"/><circle r="14" fill="#9aa3b0"/><circle r="5" fill="#1d2433"/></g>' for cx in (55, 180, 440, 510))}
</g>'''


def waves(y=520, col="#3B82C4"):
    o = []
    for i in range(3):
        yy = y + i * 18
        o.append(f'<path d="M80 {yy} q35 -14 70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round" opacity="{0.55-i*0.15}"/>')
    return "".join(o)


# ---------------------------------------------------------------- bricks
GRAY = "#A7AEB8"


def brick_wall(col=GRAY, kind="solid"):
    iso = Iso(400, 210, 1.0)
    o = []
    L, D, Hh = 120, 58, 40 if kind == "solid" else 60
    cols, rows, deps = 3, 4 if kind == "solid" else 3, 2
    items = []
    for z in range(rows):
        for j in range(deps):
            for i in range(cols - (1 if z == rows - 1 else 0)):
                off = (L / 2 if z % 2 else 0)
                items.append((i * (L + 4) + off - 180, j * (D + 4) - 60, z * (Hh + 3)))
    items.sort(key=lambda t: (t[2], t[0] + t[1]))
    for x, y, z in items:
        holes = None
        if kind == "hollow":
            holes = [(14, 12, 26, D - 24), (47, 12, 26, D - 24), (80, 12, 26, D - 24)]
        o.append(iso.box(x, y, z, L, D, Hh, col, holes=holes))
    return iso.fit("".join(o))


def block_single(col="#9BA2AC"):
    iso = Iso(400, 250, 1.6)
    o = [iso.box(-90, -40, 0, 180, 90, 90, col, holes=[(14, 14, 66, 62), (100, 14, 66, 62)])]
    iso2 = Iso(400, 250, 1.6)
    return "".join(o)


def blocks_stack(col="#9BA2AC"):
    iso = Iso(400, 170, 0.95)
    items = []
    for z in range(3):
        for j in range(2):
            for i in range(2):
                items.append((i * 184 - 184, j * 94 - 94, z * 92))
    items.sort(key=lambda t: (t[2], t[0] + t[1]))
    return iso.fit("".join(iso.box(x, y, z, 180, 90, 88, col, holes=[(14, 14, 66, 62), (100, 14, 66, 62)]) for x, y, z in items))


def pavers():
    iso = Iso(400, 160, 1.0)
    o = []
    cols = ["#B0563B", "#8E949C", "#C26A4A", "#6D737C"]
    items = []
    for j in range(7):
        for i in range(6):
            off = 0 if j % 2 == 0 else 30
            items.append((i * 64 - 200 + off, j * 34 - 120, (i + j) % 4))
    items.sort(key=lambda t: t[0] + t[1])
    for x, y, c in items:
        o.append(iso.box(x, y, 0, 60, 30, 16, cols[c]))
    o.append(iso.box(170, -40, 60, 60, 30, 16, cols[0]))
    return iso.fit("".join(o))


def curbs():
    iso = Iso(400, 230, 1.0)
    o = []
    for k, (x, y) in enumerate([(-240, 40), (-240, -40), (20, 40)]):
        o.append(iso.box(x, y, 0, 240, 40, 60, "#B6BCC4"))
        P = iso.p
        o.append(poly([P(x, y, 60), P(x + 240, y, 60), P(x + 240, y + 14, 74), P(x, y + 14, 74)], "#d3d7dd", "#8d939c", 1))
    return iso.fit("".join(o))


# ---------------------------------------------------------------- doors
def door(x, y, w=170, h=340, wood="#C8945A", style="panel", badge=None, glass=False, louver=False, bar=False, steel=False, sign=None, waves_=False, frame_col=None):
    fc = frame_col or shade(wood, 0.75)
    o = [f'<g transform="translate({x},{y})">',
         f'<rect x="-16" y="-16" width="{w+32}" height="{h+16}" rx="4" fill="{fc}"/>',
         f'<rect x="-6" y="-6" width="{w+12}" height="{h+6}" fill="{shade(fc,0.7)}"/>',
         f'<rect x="0" y="0" width="{w}" height="{h}" rx="2" fill="{wood}"/>']
    if style == "panel":
        for (px, py, pw, ph) in [(18, 18, w/2-27, h*0.36), (w/2+9, 18, w/2-27, h*0.36), (18, h*0.44, w/2-27, h*0.5), (w/2+9, h*0.44, w/2-27, h*0.5)]:
            o.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="3" fill="{shade(wood,0.88)}" stroke="{shade(wood,0.7)}" stroke-width="2"/>')
            o.append(f'<rect x="{px+8}" y="{py+8}" width="{pw-16}" height="{ph-16}" rx="2" fill="{shade(wood,1.06)}"/>')
    elif style == "two":
        for (py, ph) in [(20, h*0.42), (h*0.5, h*0.44)]:
            o.append(f'<rect x="22" y="{py}" width="{w-44}" height="{ph}" rx="4" fill="{shade(wood,0.86)}" stroke="{shade(wood,0.65)}" stroke-width="2"/>')
            o.append(f'<path d="M34 {py+12} H{w-34} V{py+ph-12} H34 Z" fill="{shade(wood,1.08)}"/>')
            o.append(f'<path d="M{w/2} {py+20} q-14 {ph/2-20} 0 {ph-40}" stroke="{shade(wood,0.75)}" stroke-width="2" fill="none" opacity=".6"/>')
    elif style == "flush":
        for i in range(9):
            xx = 12 + i * (w - 24) / 8
            o.append(f'<path d="M{xx} 6 q6 {h/2} -2 {h-12}" stroke="{shade(wood,0.82)}" stroke-width="1.6" fill="none" opacity=".7"/>')
    elif style == "groove":
        for i in range(1, 8):
            yy = i * h / 8
            o.append(f'<rect x="10" y="{yy-2}" width="{w-20}" height="4" rx="2" fill="{shade(wood,0.84)}"/>')
    elif style == "steel":
        o.append(f'<rect x="12" y="12" width="{w-24}" height="{h-24}" rx="3" fill="none" stroke="{shade(wood,0.8)}" stroke-width="3"/>')
    if glass:
        o.append(f'<rect x="{w/2-22}" y="40" width="44" height="{h*0.32}" rx="4" fill="#cfe3f5" stroke="{shade(wood,0.6)}" stroke-width="3"/>')
        o.append(f'<path d="M{w/2-14} 56 l20 -10 M{w/2-14} 76 l26 -14" stroke="#fff" stroke-width="3" opacity=".8"/>')
    if louver:
        for i in range(6):
            o.append(f'<rect x="28" y="{h-86+i*11}" width="{w-56}" height="6" rx="2" fill="{shade(wood,0.78)}"/>')
    # handle
    if bar:
        o.append(f'<rect x="10" y="{h*0.5}" width="{w-20}" height="16" rx="8" fill="url(#chromeV)" stroke="#6f7887"/>')
        o.append(f'<rect x="14" y="{h*0.5-10}" width="16" height="34" rx="4" fill="#6f7887"/><rect x="{w-30}" y="{h*0.5-10}" width="16" height="34" rx="4" fill="#6f7887"/>')
    else:
        o.append(f'<rect x="{w-32}" y="{h*0.5-24}" width="12" height="54" rx="6" fill="url(#chromeV)"/>')
        o.append(f'<rect x="{w-60}" y="{h*0.5-14}" width="40" height="11" rx="5.5" fill="url(#chrome)"/>')
    # hinges
    for hy in (40, h - 60):
        o.append(f'<rect x="-4" y="{hy}" width="7" height="26" rx="2" fill="#8d97a5"/>')
    if badge:
        bw = 20 + len(badge) * 13
        o.append(f'<rect x="{w/2-bw/2}" y="{h*0.34-20}" width="{bw}" height="34" rx="5" fill="#fff" stroke="#c0392b" stroke-width="3"/>')
        o.append(text(w / 2, h * 0.34 + 4, badge, 20, "#c0392b", 800))
    o.append(f'<rect x="0" y="0" width="{w}" height="{h}" rx="2" fill="url(#gloss)" opacity=".5"/>')
    o.append("</g>")
    if sign:
        o.append(f'<g transform="translate({x+w/2-56},{y-74})"><rect width="112" height="42" rx="6" fill="#1e8e4f"/>{text(56, 29, sign, 22, "#fff", 800)}</g>')
    if waves_:
        cx, cy = x + w + 24, y + h * 0.42
        for i in range(3):
            r = 40 + i * 30
            a = math.radians(48)
            o.append(f'<path d="M{cx+r*math.cos(a):.0f} {cy-r*math.sin(a):.0f} A{r} {r} 0 0 1 {cx+r*math.cos(a):.0f} {cy+r*math.sin(a):.0f}" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linecap="round" opacity="{0.55-i*0.15}"/>')
        o.append(f'<path d="M{cx+30} {cy-80} L{cx+120} {cy+80}" stroke="#c0392b" stroke-width="8" stroke-linecap="round"/>')
    return "".join(o)


def floor(y=470):
    return f'<rect x="0" y="{y}" width="{W}" height="{H-y}" fill="{NAVY}" opacity=".05"/>'


# ---------------------------------------------------------------- wpc
def deck():
    o = []
    top, bot = 300, 540
    for i in range(10):
        y0 = top + (bot - top) * (i / 10) ** 1.1
        y1 = top + (bot - top) * ((i + 1) / 10) ** 1.1
        x0 = 400 - (180 + 240 * i / 10)
        x1 = 400 - (180 + 240 * (i + 1) / 10)
        col = "#8B6B4E" if i % 2 else "#7A5C42"
        o.append(poly([(x0, y0), (800 - x0, y0), (800 - x1, y1 - 3), (x1, y1 - 3)], col))
        o.append(f'<path d="M{x1+40} {(y0+y1)/2} H{800-x1-40}" stroke="#5f4632" stroke-width="1" opacity=".5"/>')
    # wall + planter
    o.append(f'<rect x="220" y="90" width="360" height="210" fill="#e9edf2"/><rect x="250" y="120" width="140" height="150" fill="#bcd6ee"/><rect x="410" y="120" width="140" height="150" fill="#bcd6ee"/>')
    o.append(f'<path d="M250 120 l60 0 l-60 60 z" fill="#fff" opacity=".5"/>')
    o.append(f'<rect x="590" y="330" width="90" height="70" rx="6" fill="{NAVY}"/><circle cx="635" cy="300" r="48" fill="#5BA35B"/><circle cx="605" cy="318" r="30" fill="#4b8f4b"/><circle cx="665" cy="320" r="28" fill="#6dbb6d"/>')
    return "".join(o)


def cladding():
    o = ['<rect x="130" y="70" width="540" height="420" fill="#dfe4ea"/>']
    for i in range(27):
        x = 140 + i * 19.5
        col = "#8B6B4E" if i % 3 else "#7A5C42"
        o.append(f'<rect x="{x}" y="80" width="15" height="250" rx="2" fill="{col}"/>')
    o.append(f'<rect x="140" y="340" width="520" height="140" fill="#cfd6de"/>')
    o.append(f'<rect x="170" y="360" width="160" height="110" fill="#9fc3e8"/><rect x="360" y="360" width="90" height="120" fill="{NAVY}"/><rect x="480" y="360" width="160" height="110" fill="#9fc3e8"/>')
    o.append(f'<rect x="120" y="60" width="560" height="14" fill="{NAVY}"/>')
    return "".join(o)


def wall_panels():
    o = ['<rect x="110" y="70" width="580" height="400" fill="#ede7df"/>']
    for i in range(29):
        x = 120 + i * 19.6
        o.append(f'<rect x="{x}" y="80" width="14" height="380" rx="7" fill="{"#C9A27A" if i%2 else "#BE966D"}"/>')
    o.append(f'<rect x="230" y="370" width="340" height="80" rx="20" fill="{NAVY2}"/><rect x="250" y="340" width="300" height="50" rx="18" fill="{NAVY}"/>')
    o.append(f'<rect x="590" y="160" width="6" height="200" fill="#4a4a4a"/><path d="M560 160 h66 l-14 -46 h-38 z" fill="{AMBER}"/><circle cx="593" cy="170" r="60" fill="url(#glowY)" opacity=".7"/>')
    return "".join(o)


def pergola():
    o = []
    for x in (180, 600):
        o.append(f'<rect x="{x}" y="160" width="22" height="330" fill="#7A5C42"/>')
    o.append(f'<rect x="150" y="150" width="500" height="22" fill="#8B6B4E"/>')
    for i in range(12):
        o.append(f'<rect x="{160+i*40}" y="130" width="16" height="50" fill="#9c7a5a"/>')
    for i in range(8):
        o.append(f'<rect x="{90 + i*16 if False else 0}" y="0" width="0" height="0"/>')
    # fence
    for i in range(18):
        o.append(f'<rect x="{110+i*33}" y="400" width="26" height="90" rx="3" fill="{"#8B6B4E" if i%2 else "#7A5C42"}"/>')
    o.append(f'<rect x="100" y="410" width="600" height="8" fill="#5f4632"/><rect x="100" y="470" width="600" height="8" fill="#5f4632"/>')
    o.append(f'<rect x="300" y="300" width="200" height="16" rx="6" fill="{NAVY}"/><rect x="320" y="316" width="10" height="70" fill="{NAVY}"/><rect x="470" y="316" width="10" height="70" fill="{NAVY}"/>')
    return "".join(o)


# ---------------------------------------------------------------- sanitary
def wc(x, y, s=1.0, wall=False):
    o = [f'<g transform="translate({x},{y}) scale({s})">']
    if wall:
        o.append('<rect x="-10" y="-150" width="120" height="70" rx="10" fill="#e6ebf1"/><rect x="25" y="-135" width="50" height="34" rx="6" fill="url(#chrome)"/>')
        o.append('<path d="M0 -60 H140 Q150 20 90 50 H40 Q0 40 0 -10 Z" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>')
        o.append('<rect x="-4" y="-74" width="150" height="18" rx="9" fill="#fff" stroke="#c4ccd6" stroke-width="2"/>')
    else:
        o.append('<rect x="-6" y="-170" width="110" height="90" rx="10" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>')
        o.append('<rect x="38" y="-162" width="26" height="10" rx="5" fill="url(#chrome)"/>')
        o.append('<path d="M0 -70 H150 Q160 10 100 40 L110 110 H40 L50 40 Q0 20 0 -30 Z" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>')
        o.append('<rect x="-4" y="-84" width="160" height="18" rx="9" fill="#fff" stroke="#c4ccd6" stroke-width="2"/>')
    o.append("</g>")
    return "".join(o)


def basin_pedestal(x, y):
    return f'''<g transform="translate({x},{y})">
<path d="M-90 0 H90 Q86 50 0 60 Q-86 50 -90 0 Z" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>
<rect x="-96" y="-10" width="192" height="16" rx="8" fill="#fff" stroke="#c4ccd6" stroke-width="2"/>
<path d="M-26 56 H26 L34 170 H-34 Z" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>
<rect x="-8" y="-50" width="16" height="42" rx="4" fill="url(#chrome)"/><path d="M-6 -48 Q-6 -66 22 -62 L22 -52 Q6 -54 6 -40 Z" fill="url(#chrome)"/>
</g>'''


def mirror(x, y, w=170, h=120):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="#d6e6f5" stroke="#aab3c0" stroke-width="4"/><path d="M{x+30} {y+30} l40 -14 M{x+30} {y+56} l70 -26" stroke="#fff" stroke-width="5" opacity=".8"/>'


def tile_wall(y0=60, y1=470, x0=90, x1=710, col="#eef1f5", line="#d9dee6", tw=62, th=62):
    o = [f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{col}"/>']
    x = x0
    while x <= x1:
        o.append(f'<path d="M{x} {y0} V{y1}" stroke="{line}" stroke-width="2"/>'); x += tw
    y = y0
    while y <= y1:
        o.append(f'<path d="M{x0} {y} H{x1}" stroke="{line}" stroke-width="2"/>'); y += th
    return "".join(o)


def faucet_set():
    return f'''<g transform="translate(250,180)">
<rect x="0" y="210" width="110" height="26" rx="6" fill="url(#chrome)"/>
<rect x="40" y="60" width="30" height="160" rx="10" fill="url(#chrome)"/>
<path d="M40 70 Q40 20 100 20 L150 20 Q160 20 160 32 L160 48 L140 48 L140 40 L95 40 Q70 40 70 70 Z" fill="url(#chromeV)"/>
<rect x="64" y="96" width="60" height="16" rx="8" fill="url(#chrome)" transform="rotate(-18 64 104)"/>
<path d="M146 54 v40" stroke="#9fd1f0" stroke-width="10" stroke-linecap="round" opacity=".8"/>
</g>
<g transform="translate(470,110)">
<rect x="34" y="0" width="16" height="300" rx="8" fill="url(#chrome)"/>
<rect x="-10" y="-14" width="110" height="22" rx="11" fill="url(#chromeV)"/>
<ellipse cx="90" cy="20" rx="44" ry="12" fill="url(#chromeV)"/>
<rect x="10" y="230" width="64" height="56" rx="12" fill="url(#chrome)"/><circle cx="42" cy="258" r="16" fill="#e8ecf1" stroke="#8d97a5" stroke-width="3"/>
{''.join(f'<path d="M{70+i*9} 36 v{30+i%2*12}" stroke="#9fd1f0" stroke-width="4" stroke-linecap="round" opacity=".7"/>' for i in range(5))}
</g>'''


def counter_basin():
    return f'''{mirror(300, 70, 200, 150)}
<rect x="160" y="330" width="480" height="26" rx="4" fill="#efe9df" stroke="#cfc6b6" stroke-width="2"/>
<rect x="180" y="356" width="440" height="120" fill="#8B6B4E"/><path d="M400 356 V476" stroke="#5f4632" stroke-width="3"/>
<rect x="370" y="410" width="60" height="8" rx="4" fill="url(#chrome)"/><rect x="250" y="410" width="60" height="8" rx="4" fill="url(#chrome)"/><rect x="490" y="410" width="60" height="8" rx="4" fill="url(#chrome)"/>
<path d="M300 330 Q300 270 400 270 Q500 270 500 330 Z" fill="url(#porc)" stroke="#c4ccd6" stroke-width="2"/>
<ellipse cx="400" cy="276" rx="96" ry="12" fill="#fff" stroke="#c4ccd6" stroke-width="2"/>
<rect x="500" y="230" width="14" height="100" rx="6" fill="url(#chrome)"/><path d="M500 238 Q470 238 466 262 L478 264 Q482 252 500 252 Z" fill="url(#chromeV)"/>'''


def bathtub():
    return f'''{tile_wall(60, 330)}
<rect x="130" y="320" width="540" height="150" rx="40" fill="url(#porc)" stroke="#c4ccd6" stroke-width="3"/>
<rect x="120" y="310" width="560" height="26" rx="13" fill="#fff" stroke="#c4ccd6" stroke-width="2"/>
<rect x="560" y="200" width="14" height="110" rx="6" fill="url(#chrome)"/><path d="M560 210 Q520 210 520 240 L532 240 Q534 222 560 224 Z" fill="url(#chromeV)"/>
<rect x="190" y="200" width="120" height="16" rx="8" fill="url(#chrome)"/>
<rect x="680" y="450" width="0" height="0"/>
<rect x="170" y="470" width="20" height="24" rx="4" fill="#aab3c0"/><rect x="610" y="470" width="20" height="24" rx="4" fill="#aab3c0"/>'''


# ---------------------------------------------------------------- ceramics
def floor_tiles(c1, c2, vein, n=5, label=None):
    o = []
    top, bot = 250, 545
    left_t, right_t, left_b, right_b = 240, 560, 40, 760
    def pt(u, v):
        xl = left_t + (left_b - left_t) * v; xr = right_t + (right_b - right_t) * v
        return (xl + (xr - xl) * u, top + (bot - top) * v)
    for i in range(n):
        for j in range(n):
            u0, u1, v0, v1 = i / n, (i + 1) / n, j / n, (j + 1) / n
            col = c1 if (i + j) % 2 == 0 else c2
            o.append(poly([pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)], col, shade(c2, 0.85), 1.5))
            a, b = pt(u0 + 0.1 / n, v0 + 0.7 / n), pt(u1 - 0.1 / n, v0 + 0.25 / n)
            o.append(f'<path d="M{a[0]:.0f} {a[1]:.0f} Q{(a[0]+b[0])/2:.0f} {(a[1]+b[1])/2-12:.0f} {b[0]:.0f} {b[1]:.0f}" stroke="{vein}" stroke-width="1.6" fill="none" opacity=".55"/>')
    o.append(f'<rect x="0" y="80" width="{W}" height="172" fill="#eef1f5" opacity=".0"/>')
    return "".join(o)


def wall_tiles(c1, c2, vein, tw=80, th=160):
    o = []
    x0, x1, y0, y1 = 120, 680, 60, 480
    y = y0; r = 0
    while y < y1:
        x = x0 - (tw / 2 if r % 2 else 0)
        k = 0
        while x < x1:
            xa, xb = max(x, x0), min(x + tw, x1)
            hh = min(th, y1 - y)
            col = c1 if (k + r) % 3 else c2
            o.append(f'<rect x="{xa}" y="{y}" width="{xb-xa}" height="{hh}" fill="{col}" stroke="{shade(c2,0.85)}" stroke-width="2"/>')
            o.append(f'<path d="M{xa+6} {y+hh*0.7} q{(xb-xa)/2} -{hh*0.3} {xb-xa-12} -{hh*0.5}" stroke="{vein}" stroke-width="1.5" fill="none" opacity=".5"/>')
            x += tw; k += 1
        y += th; r += 1
    return "".join(o)


def slabs(c1, vein, n=3):
    o = []
    for i in range(n):
        x = 190 + i * 150
        o.append(f'<g transform="translate({x},90) skewX(-6)"><rect width="180" height="360" rx="4" fill="{shade(c1, 1 - i*0.04)}" stroke="{shade(c1,0.8)}" stroke-width="2"/>'
                 f'<path d="M20 300 Q60 200 120 180 T170 40" stroke="{vein}" stroke-width="2.5" fill="none" opacity=".6"/>'
                 f'<path d="M10 120 Q70 140 100 90" stroke="{vein}" stroke-width="1.5" fill="none" opacity=".5"/>'
                 f'<rect width="180" height="360" rx="4" fill="url(#gloss)"/></g>')
    o.append(f'<rect x="150" y="450" width="520" height="40" rx="4" fill="#8d97a5"/>')
    return "".join(o)


def tile_stack(c1, c2, vein):
    o = [floor_tiles(c1, c2, vein, 4)]
    for i in range(5):
        o.append(f'<g transform="translate({300 + i*6},{110 - i*0})"><rect x="0" y="0" width="200" height="200" rx="4" fill="{c1 if i%2 else c2}" stroke="{shade(c2,0.8)}" stroke-width="2" transform="rotate({-8+i*4} 100 100)"/></g>')
    o.append(f'<g transform="translate(300,110) rotate(8 100 100)"><path d="M20 160 Q80 100 120 110 T190 30" stroke="{vein}" stroke-width="2.5" fill="none" opacity=".6"/><rect width="200" height="200" rx="4" fill="url(#gloss)"/></g>')
    return "".join(o)


# ---------------------------------------------------------------- electrical
def cable_reel(x, y, s=1.0, col="#c0392b"):
    o = [f'<g transform="translate({x},{y}) scale({s})">',
         '<circle r="150" fill="#c89a62" stroke="#9c7243" stroke-width="6"/>']
    for r in range(130, 50, -12):
        o.append(f'<circle r="{r}" fill="none" stroke="{shade(col, 0.85 + (r%24)/100)}" stroke-width="12"/>')
    o.append('<circle r="44" fill="#c89a62" stroke="#9c7243" stroke-width="4"/><circle r="16" fill="#6d4b28"/>')
    o.append(f'<path d="M120 60 Q200 120 260 90" stroke="{col}" stroke-width="12" fill="none" stroke-linecap="round"/>')
    o.append('<path d="M258 86 l26 -8 M262 96 l26 2" stroke="url(#copper)" stroke-width="6" stroke-linecap="round"/>')
    o.append("</g>")
    return "".join(o)


def conduits():
    o = []
    for i, c in enumerate(["#F28C28", "#9aa3b0", "#F28C28", "#9aa3b0"]):
        y = 300 + i * 34
        o.append(f'<rect x="90" y="{y}" width="420" height="28" rx="14" fill="{c}"/><rect x="90" y="{y+4}" width="420" height="6" rx="3" fill="#fff" opacity=".35"/>')
        o.append(f'<ellipse cx="510" cy="{y+14}" rx="8" ry="14" fill="{shade(c,0.7)}"/>')
    for k, (x, y) in enumerate([(540, 170), (600, 300)]):
        o.append(f'<rect x="{x}" y="{y}" width="130" height="130" rx="12" fill="#e9edf2" stroke="#aab3c0" stroke-width="3"/>')
        o.append(f'<circle cx="{x+65}" cy="{y+65}" r="38" fill="#fff" stroke="#aab3c0" stroke-width="3"/>')
        for a in range(4):
            ang = a * math.pi / 2
            o.append(f'<circle cx="{x+65+math.cos(ang)*52:.0f}" cy="{y+65+math.sin(ang)*52:.0f}" r="8" fill="#cfd6de"/>')
    o.append(f'<path d="M160 210 q120 -80 240 0" stroke="#F28C28" stroke-width="22" fill="none" stroke-linecap="round"/>')
    return "".join(o)


def switches():
    o = []
    for i, kind in enumerate(["sw", "socket", "sw2"]):
        x = 120 + i * 200
        o.append(f'<rect x="{x}" y="190" width="170" height="170" rx="18" fill="#fff" stroke="#cfd6de" stroke-width="3"/>')
        o.append(f'<rect x="{x}" y="190" width="170" height="170" rx="18" fill="url(#gloss)"/>')
        if kind == "sw":
            o.append(f'<rect x="{x+35}" y="225" width="100" height="100" rx="12" fill="#f4f6f9" stroke="#d9dee6" stroke-width="3"/><rect x="{x+78}" y="240" width="14" height="6" rx="3" fill="{AMBER}"/>')
        elif kind == "sw2":
            o.append(f'<rect x="{x+28}" y="225" width="54" height="100" rx="10" fill="#f4f6f9" stroke="#d9dee6" stroke-width="3"/><rect x="{x+88}" y="225" width="54" height="100" rx="10" fill="#f4f6f9" stroke="#d9dee6" stroke-width="3"/>')
        else:
            o.append(f'<circle cx="{x+85}" cy="275" r="52" fill="#f4f6f9" stroke="#d9dee6" stroke-width="3"/><circle cx="{x+65}" cy="275" r="8" fill="#5b6475"/><circle cx="{x+105}" cy="275" r="8" fill="#5b6475"/>')
    o.append(f'<path d="M180 450 q120 -40 240 0 t240 0" stroke="#c0392b" stroke-width="8" fill="none"/><path d="M180 466 q120 -40 240 0 t240 0" stroke="#2c6fbb" stroke-width="8" fill="none"/>')
    return "".join(o)


def board():
    o = [f'<rect x="200" y="90" width="400" height="390" rx="14" fill="#e9edf2" stroke="#aab3c0" stroke-width="4"/>',
         f'<rect x="222" y="112" width="356" height="346" rx="8" fill="#f6f8fa"/>']
    for r in range(3):
        y = 140 + r * 105
        o.append(f'<rect x="236" y="{y+28}" width="328" height="14" fill="#cfd6de"/>')
        for i in range(8):
            x = 242 + i * 40
            on = (i + r) % 3 != 0
            o.append(f'<rect x="{x}" y="{y}" width="34" height="70" rx="4" fill="#fff" stroke="#aab3c0" stroke-width="2"/>')
            o.append(f'<rect x="{x+10}" y="{y+(16 if on else 36)}" width="14" height="18" rx="3" fill="{AMBER if on else NAVY}"/>')
    return "".join(o)


def led():
    return f'''<circle cx="300" cy="230" r="170" fill="url(#glowY)"/>
<path d="M300 110 a90 90 0 0 1 56 160 q-14 12 -14 34 h-84 q0 -22 -14 -34 a90 90 0 0 1 56 -160z" fill="#fff8e1" stroke="#e8c76a" stroke-width="4"/>
<rect x="258" y="306" width="84" height="16" rx="4" fill="#cfd6de"/><rect x="262" y="324" width="76" height="14" rx="4" fill="#aab3c0"/><rect x="266" y="340" width="68" height="14" rx="4" fill="#cfd6de"/><path d="M282 356 h36 l-8 18 h-20z" fill="#5b6475"/>
<path d="M270 230 q30 -30 60 0" stroke="{AMBER}" stroke-width="5" fill="none"/>
<g transform="translate(440,170)"><rect width="240" height="240" rx="14" fill="#fff" stroke="#cfd6de" stroke-width="5"/><rect x="18" y="18" width="204" height="204" rx="8" fill="#fffbea"/><circle cx="120" cy="120" r="140" fill="url(#glowY)" opacity=".5"/></g>'''


# ---------------------------------------------------------------- scenes
WOOD_OAK, WOOD_WAL, WOOD_BEECH = "#D2A56C", "#8A5A36", "#C07A45"
WPC_W = "#E6E8EB"

C_CLEO = ("#F1E9DC", "#E6DAC6", "#B9A27E")
C_GAW = ("#EEF0F3", "#DDE1E7", "#9AA3AF")
C_OBE = ("#8E9298", "#A9ADB3", "#5c6168")


def three_doors():
    return floor() + door(130, 140, 150, 320, WOOD_OAK, "panel") + door(325, 140, 150, 320, "#A8432F", "two", badge="FR 60") + door(520, 140, 150, 320, WPC_W, "groove", frame_col="#c9ced6")


def bath_scene():
    return tile_wall() + mirror(380, 110, 180, 120) + basin_pedestal(470, 300) + wc(190, 330, 0.95)


def elec_scene():
    return cable_reel(250, 330, 0.9) + f'<g transform="translate(130,-25) scale(.8)">{led()}</g>' + '<g transform="translate(500,300)"><rect width="170" height="170" rx="18" fill="#fff" stroke="#cfd6de" stroke-width="3"/><circle cx="85" cy="85" r="52" fill="#f4f6f9" stroke="#d9dee6" stroke-width="3"/><circle cx="65" cy="85" r="8" fill="#5b6475"/><circle cx="105" cy="85" r="8" fill="#5b6475"/></g>'


def project_doors():
    o = [floor()]
    cols = [WOOD_OAK, WPC_W, WOOD_WAL, WPC_W]
    for i in range(4):
        o.append(door(70 + i * 175, 170, 120, 280, cols[i], "groove" if cols[i] == WPC_W else "flush", frame_col="#c9ced6" if cols[i] == WPC_W else None))
    return "".join(o)


def door_frame_only():
    fc = "#d7dbe1"
    return floor() + f'''<g transform="translate(310,110)"><rect x="-22" y="-22" width="224" height="382" rx="4" fill="{fc}" stroke="#aab3c0" stroke-width="2"/>
<rect x="0" y="0" width="180" height="360" fill="#f5f7fa"/><rect x="-6" y="-6" width="192" height="366" fill="none" stroke="#bcc3cc" stroke-width="3"/>
<rect x="-4" y="50" width="8" height="30" rx="2" fill="#8d97a5"/><rect x="-4" y="270" width="8" height="30" rx="2" fill="#8d97a5"/><rect x="172" y="170" width="8" height="34" rx="2" fill="#8d97a5"/></g>
<g transform="translate(560,170)"><rect width="34" height="300" rx="3" fill="{fc}" stroke="#aab3c0" stroke-width="2"/><rect x="44" y="0" width="34" height="300" rx="3" fill="{fc}" stroke="#aab3c0" stroke-width="2"/></g>'''


def scene(slug):
    S = {
        "cement": lambda: bag_stack(),
        "cement/sulfate-resistant": lambda: bag_stack("SRC", "42.5 · 50 kg", "#E8DCC4", "#0E5E6F", AMBER) + waves(),
        "cement/white": lambda: bag_stack("WHITE", "52.5N · 50 kg", "#FBFBF8", "#ffffff", AMBER),
        "cement-bricks": lambda: brick_wall(),
        "doors": three_doors,
        "doors/wooden": lambda: floor() + door(225, 130, 160, 330, WOOD_OAK, "panel") + door(420, 130, 160, 330, WOOD_BEECH, "two"),
        "doors/fire-rated": lambda: floor() + door(225, 150, 160, 320, "#A8432F", "two", badge="FR 60") + door(420, 150, 160, 320, "#7d8794", "steel", badge="FR 90", glass=True, bar=True, sign="EXIT"),
        "doors/soundproof": lambda: floor() + door(250, 130, 170, 340, WOOD_WAL, "flush", badge="45 dB", waves_=True),
        "doors/wpc": lambda: floor() + door(225, 130, 160, 330, WPC_W, "groove", frame_col="#c9ced6") + door(420, 130, 160, 330, "#cfc6b8", "groove", louver=True, frame_col="#b9b0a2"),
        "wpc": deck,
        "ideal-standard": bath_scene,
        "ceramics": lambda: tile_stack(*C_CLEO),
        "ceramics/cleopatra": lambda: floor_tiles(*C_CLEO) + wall_tiles_top(C_CLEO),
        "ceramics/al-gawhara": lambda: floor_tiles(*C_GAW) + wall_tiles_top(C_GAW),
        "ceramics/obelisk": lambda: floor_tiles(*C_OBE) + wall_tiles_top(C_OBE),
        "electrical": elec_scene,
    }
    return S[slug]()


def wall_tiles_top(c):
    o = []
    for i in range(6):
        x = 240 + i * 53.3
        o.append(f'<rect x="{x}" y="70" width="53.3" height="180" fill="{c[0] if i%2 else c[1]}" stroke="{shade(c[1],0.85)}" stroke-width="2"/>')
    o.append(f'<path d="M250 200 q80 -60 150 -40 t140 -60" stroke="{c[2]}" stroke-width="2" fill="none" opacity=".5"/>')
    return "".join(o)


def product(slug, i):
    """Return (svg_body, badge) for product i of category slug."""
    if slug == "cement":
        return [
            (bag_stack("CEM I", "42.5N · 50 kg"), "42.5N"),
            (bag_stack("CEM II", "32.5 · 50 kg", panel="#3E5C76"), "32.5"),
            (bag_stack("SRC", "42.5 · 50 kg", panel="#0E5E6F") + waves(), "SRC"),
            (bag_stack("WHITE", "52.5N · 50 kg", "#FBFBF8", "#ffffff"), "WHITE"),
            (silo_truck(), "BULK"),
        ][i]
    if slug == "cement/sulfate-resistant":
        return [(bag_stack("SRC", "42.5 · 50 kg", panel="#0E5E6F") + waves(), "SRC 42.5"), (silo_truck(label="SRC"), "BULK")][i]
    if slug == "cement/white":
        return [(bag_stack("WHITE", "50 kg", "#FBFBF8", "#ffffff"), "50 kg"),
                (bag_stack("WHITE", "25 kg", "#FBFBF8", "#ffffff", n=2), "25 kg")][i]
    if slug == "cement-bricks":
        return [(brick_wall(kind="solid"), "25×12×6"), (brick_wall(kind="hollow"), "25×12×13"),
                (blocks_stack(), "20×20×40"), (pavers(), "INTERLOCK"), (curbs(), "CURB")][i]
    if slug == "doors/wooden":
        return [(floor() + door(310, 120, 180, 350, WOOD_OAK, "panel"), "HDF"),
                (floor() + door(310, 120, 180, 350, WOOD_WAL, "flush"), "FLUSH"),
                (floor() + door(310, 120, 180, 350, WOOD_BEECH, "two"), "BEECH"),
                (floor() + door(310, 120, 180, 350, WPC_W, "groove", frame_col="#c9ced6"), "WPC")][i]
    if slug == "doors/fire-rated":
        return [(floor() + door(310, 130, 180, 340, WOOD_OAK, "two", badge="FR 30"), "30 min"),
                (floor() + door(310, 130, 180, 340, "#A8432F", "two", badge="FR 60"), "60 min"),
                (floor() + door(310, 130, 180, 340, "#7d8794", "steel", badge="FR 90", glass=True), "90 min"),
                (floor() + door(310, 150, 180, 320, "#7d8794", "steel", badge="FR 60", bar=True, sign="EXIT"), "PANIC BAR")][i]
    if slug == "doors/soundproof":
        db = ["32 dB", "40 dB", "45 dB", "45 dB"]
        wood = [WOOD_OAK, WOOD_WAL, "#5b3b26", "#A8432F"]
        return (floor() + door(250, 130, 170, 340, wood[i], "flush", badge=(db[i] if i < 3 else "FR+dB"), waves_=True), db[i] if i < 3 else "FR + dB")
    if slug == "doors/wpc":
        return [(floor() + door(310, 120, 180, 350, "#cfc6b8", "groove", louver=True, frame_col="#b9b0a2"), "BATH"),
                (floor() + door(310, 120, 180, 350, WPC_W, "groove", frame_col="#c9ced6"), "ROOM"),
                (door_frame_only(), "FRAME"),
                (project_doors(), "PROJECTS")][i]
    if slug == "wpc":
        return [(deck(), "DECK"), (cladding(), "CLADDING"), (wall_panels(), "PANELS"), (pergola(), "PERGOLA")][i]
    if slug == "ideal-standard":
        return [(bath_scene(), "SET"),
                (tile_wall() + wc(310, 330, 1.2, wall=True), "WALL-HUNG"),
                (counter_basin(), "BASIN"),
                (faucet_set(), "MIXERS"),
                (bathtub(), "BATH")][i]
    if slug.startswith("ceramics/"):
        c = {"ceramics/cleopatra": C_CLEO, "ceramics/al-gawhara": C_GAW, "ceramics/obelisk": C_OBE}[slug]
        sizes = {"ceramics/cleopatra": ["60×60", "30×60", "60×120"], "ceramics/al-gawhara": ["40×40", "60×60", "25×40"], "ceramics/obelisk": ["60×60", "60×120", "30×60"]}[slug]
        sz = sizes[i]
        if sz == "60×120":
            return slabs(c[0], c[2]), sz
        if sz in ("30×60", "25×40"):
            return wall_tiles(c[0], c[1], c[2], 80 if sz == "30×60" else 70, 160 if sz == "30×60" else 112), sz
        return floor_tiles(c[0], c[1], c[2], 5 if sz == "60×60" else 6), sz
    if slug == "electrical":
        return [(cable_reel(330, 300), "CABLES"), (conduits(), "CONDUITS"), (switches(), "SWITCHES"), (board(), "BOARDS"), (led(), "LED")][i]
    return None


def main():
    data = json.load(open(os.path.join(REPO, "lib/data.json")))
    jobs, manifest = [], {"cat": {}, "prod": {}}
    for c in data["categories"]:
        slug = c["slug"]
        key = slug.replace("/", "-")
        svg = frame(scene(slug))
        p = os.path.join(OUT, f"cat-{key}.svg"); open(p, "w").write(svg)
        jobs.append({"svg": p, "out": os.path.join(REPO, f"public/img/cat/{key}.webp")})
        manifest["cat"][slug] = f"/img/cat/{key}.webp"
        prods = c["ar"].get("products") or []
        for i in range(len(prods)):
            r = product(slug, i)
            if not r:
                continue
            body, badge = r
            p = os.path.join(OUT, f"p-{key}-{i}.svg"); open(p, "w").write(frame(body, badge))
            jobs.append({"svg": p, "out": os.path.join(REPO, f"public/img/p/{key}-{i}.webp")})
            manifest["prod"].setdefault(slug, []).append(f"/img/p/{key}-{i}.webp")
    json.dump(jobs, open(os.path.join(OUT, "jobs.json"), "w"), indent=0)
    json.dump(manifest, open(os.path.join(REPO, "lib/art.json"), "w"), indent=1, ensure_ascii=False)
    print(len(jobs), "images")


if __name__ == "__main__":
    main()
