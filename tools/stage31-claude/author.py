#!/usr/bin/env python3
"""Stage 31 hand-authored vector art (Claude, direct authoring test).

Every shape below is a deliberate design decision written as control points in
world units; nothing is traced or randomly generated. Solid rock/earth outlines
are authored once and used for BOTH the painted silhouette and the collider, so
art and collision cannot drift apart. Walk tops keep the verified v5 support
lines except for a small natural undulation that is re-probed with the engine.

Outputs
  art/act4-stage31-claude-v1/stage31.svg          Inkscape layers (BACK preview image excluded)
  art/act4-stage31-claude-v1/preview.svg          same + far raster + scale figures (review only)
  tools/act4-pilot/layouts/stage31-v6-claude.json  layout with art-matched solid outlines
"""
import json, math, copy, re
from pathlib import Path
from shapely.geometry import Polygon, LineString, MultiPolygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/act4-stage31-claude-v1'
SRC = ROOT / 'tools/act4-pilot/layouts/stage31-v5-supported.json'
DST = ROOT / 'tools/act4-pilot/layouts/stage31-v6-claude.json'

# ---------------------------------------------------------------- palette
# Sampled from art/style-reference/act4-user-approved-20261030.png, plus one
# in-between rock value and a dawn-washed timber family.
ROCK_LIGHT = '#35537e'
ROCK_MIDL = '#244069'
ROCK_MID = '#142a4b'
ROCK_DARK = '#0f1d36'
SAGE = '#96a86e'
SAGE_LIP = '#a8b981'
SAGE_SHADOW = '#6f8158'
MUD = '#1a3052'
MUD_DARK = '#13243f'
WOOD_LIGHT = '#968c7b'
WOOD = '#6a635b'
WOOD_DARK = '#403e47'
WOOD_SHADOW = '#2c2d3a'
ROPE = '#b0a68f'
REED = '#7e8a7a'
REED_DARK = '#5a6662'
STONE = '#2d4670'

def f(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')

# ---------------------------------------------------------------- curves
def catmull(points, closed=False, tension=0.5, corners=()):
    """Catmull-Rom -> cubic Bezier segments. corners: indices kept sharp."""
    n = len(points)
    segs = []
    rng = range(n if closed else n - 1)
    for i in rng:
        p0 = points[(i - 1) % n] if (closed or i > 0) else points[i]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n] if (closed or i + 2 < n) else p2
        t1 = 0 if i in corners else tension
        t2 = 0 if ((i + 1) % n) in corners else tension
        c1 = (p1[0] + (p2[0] - p0[0]) * t1 / 3, p1[1] + (p2[1] - p0[1]) * t1 / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * t2 / 3, p2[1] - (p3[1] - p1[1]) * t2 / 3)
        segs.append((p1, c1, c2, p2))
    return segs

def bez(p0, c1, c2, p1, t):
    u = 1 - t
    return (u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*p1[0],
            u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*p1[1])

def sample(segs, step=18):
    pts = []
    for (p0, c1, c2, p1) in segs:
        L = math.dist(p0, c1) + math.dist(c1, c2) + math.dist(c2, p1)
        k = max(2, int(L / step))
        for j in range(k):
            pts.append(bez(p0, c1, c2, p1, j / k))
    pts.append(segs[-1][3])
    return pts

def seg_d(segs, move=True):
    d = 'M%s %s' % (f(segs[0][0][0]), f(segs[0][0][1])) if move else ''
    for (_, c1, c2, p1) in segs:
        d += ' C%s %s %s %s %s %s' % tuple(f(v) for v in (*c1, *c2, *p1))
    return d

def poly_d(pts, close=True):
    d = 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in pts)
    return d + (' Z' if close else '')

def shapely_d(g):
    out = []
    geoms = g.geoms if hasattr(g, 'geoms') else [g]
    for p in geoms:
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        out.append(poly_d(list(p.exterior.coords)[:-1]))
        for hole in p.interiors:
            out.append(poly_d(list(hole.coords)[:-1]))
    return ' '.join(out)

def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    L = math.hypot(dx, dy) or 1
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        d = abs(dy*pts[i][0] - dx*pts[i][1] + b[0]*a[1] - b[1]*a[0]) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [a, b]

def interp(poly, x):
    for (x0, y0), (x1, y1) in zip(poly, poly[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / ((x1 - x0) or 1)
    raise ValueError(x)

# ---------------------------------------------------------------- layout
L = json.load(open(SRC))
S = {s['id']: s for s in L['surfaces']}

def undulate(top, seed, amp=1.0, keep=()):
    """Natural low-frequency relief on a verified walk line; ends fixed."""
    x0, x1 = top[0][0], top[-1][0]
    xs = [x0]
    while xs[-1] + 24 < x1:
        xs.append(xs[-1] + 24)
    xs.append(x1)
    out = []
    for x in xs:
        y = interp(top, x)
        if not any(a <= x <= b for a, b in keep):
            w = min(1.0, (x - x0) / 90, (x1 - x) / 90)
            for a, b in keep:   # fade into protected flats
                w = min(w, max(0.0, min(abs(x - a), abs(x - b)) / 120))
            y += w * amp * (11*math.sin(x/157 + seed) + 6*math.sin(x/71 + 2.3*seed) + 3*math.sin(x/37 + seed*5))
        out.append((round(x, 2), round(y, 2)))
    # Collision cost scales with vertices: keep relief within 3 world units.
    return rdp(out, 4.0)

TOPS = {
    'shore': undulate(S['shore']['top'], 0.4, keep=[(-1, 680), (5560, 6240)]),
    'west-step': undulate([[480, 4000], [600, 3930]] + S['west-step']['top'][2:], 1.7, 0.8),
    'west-ledge': undulate(S['west-ledge']['top'], 2.9),
    'ridge-court': undulate(S['ridge-court']['top'], 4.1),
    'east-overhang': undulate(S['east-overhang']['top'], 5.3),
    'return-ramp': undulate(S['return-ramp']['top'], 6.2, 0.7),
}

# Hand-authored lower outlines (clockwise continuation from the top's last point
# back to its first). Values in world units. 'c' marks a sharp rock corner.
LOWER = {
    # West rock: chiselled lip over the lower-bridge socket, sea-worn undercut,
    # broad foot; left side buried in the scree bank (no waist).
    'west-ledge': [(2392, 3186), (2448, 3214, 'c'), (2478, 3262), (2470, 3318, 'c'), (2448, 3372), (2430, 3404, 'c'),
                   (2424, 3436), (2398, 3470, 'c'), (2350, 3502), (2300, 3548, 'c'), (2262, 3600), (2232, 3664, 'c'),
                   (2214, 3740), (2206, 3820, 'c'), (2222, 3896), (2252, 3960, 'c'), (2296, 4030), (2340, 4110, 'c'),
                   (2378, 4180), (2410, 4250, 'c'),
                   (1660, 4250, 'c'), (1610, 4120), (1560, 3960, 'c'), (1510, 3800), (1470, 3640, 'c'),
                   (1446, 3520), (1440, 3420, 'c'), (1448, 3370)],
    # Scree bank: rubble talus that leans into the west rock.
    'west-step': [(1452, 3502, 'c'), (1470, 3600), (1480, 3680), (1500, 3780, 'c'), (1540, 3960), (1600, 4250, 'c'), (560, 4250, 'c'), (548, 4100)],
    # Middle sea stack: overhanging court lip to the right, sheltered cove under
    # the gallery to the left, stem as wide as it is tall-safe for the routes.
    'ridge-court': [(4566, 2080), (4626, 2118, 'c'), (4668, 2186), (4672, 2262, 'c'), (4644, 2330), (4598, 2392, 'c'),
                    (4552, 2470), (4524, 2560, 'c'), (4512, 2650), (4530, 2760, 'c'), (4560, 2860), (4588, 2990, 'c'),
                    (4600, 3120), (4626, 3260, 'c'), (4640, 3420), (4652, 3580, 'c'), (4664, 3740), (4690, 3900, 'c'),
                    (4706, 4040), (4730, 4200, 'c'),
                    (3790, 4200, 'c'), (3820, 4100), (3850, 3980, 'c'), (3880, 3860), (3912, 3740, 'c'), (3940, 3620),
                    (3966, 3500, 'c'), (3976, 3440), (3970, 3380, 'c'), (3950, 3300), (3924, 3200, 'c'), (3900, 3110),
                    (3866, 3010, 'c'), (3826, 2920), (3770, 2830, 'c'), (3700, 2750), (3620, 2680, 'c'), (3556, 2610),
                    (3510, 2530, 'c'), (3484, 2450), (3478, 2380, 'c'), (3486, 2330), (3510, 2266, 'c'), (3540, 2206)],
    # East rock: deep sea-worn overhang on the left (the rockfall below came
    # from it), stair-tower side on the right, foot outside the boarding apron.
    'east-overhang': [(6470, 2684), (6404, 2714, 'c'), (6310, 2736), (6214, 2760, 'c'), (6150, 2800), (6118, 2870, 'c'),
                      (6112, 2960), (6126, 3060, 'c'), (6146, 3170), (6158, 3290, 'c'), (6156, 3420), (6140, 3550, 'c'),
                      (6118, 3680), (6090, 3800, 'c'), (6050, 3920, 'c'),
                      (5330, 3990, 'c'), (5344, 3880), (5366, 3760, 'c'), (5394, 3640), (5420, 3520, 'c'), (5436, 3400),
                      (5440, 3280, 'c'), (5426, 3150), (5400, 3030, 'c'), (5364, 2920), (5316, 2820, 'c'), (5256, 2730),
                      (5184, 2650, 'c'), (5100, 2580), (5020, 2510, 'c'), (4964, 2440), (4934, 2380, 'c'), (4932, 2320),
                      (4952, 2284)],
    # Rockfall scree: a heap of fallen blocks under the east overhang.
    'return-ramp': [(5190, 3510), (5300, 3524), (5432, 3536, 'c'), (5450, 3700), (5420, 3860), (5370, 4000, 'c'), (5300, 4170), (4500, 4170, 'c'), (4504, 4110)],
}

import sys as _sys
_sys.path.insert(0, str(ROOT / 'tools/act4-claude'))
from painter import fix_solid
TOPS['shore'], _ = fix_solid(TOPS['shore'], [(7000, 4700), (0, 4700)])

def outline(sid):
    top = TOPS[sid]
    lower = LOWER[sid]
    pts = [p[:2] for p in lower]
    corners = {i + 1 for i, p in enumerate(lower) if len(p) > 2}
    # Smooth the lower outline from the top's last point to the first.
    chain = [top[-1]] + pts + [top[0]]
    segs = catmull(chain, closed=False, tension=0.3, corners={0, len(chain) - 1} | corners)
    lower_pts = rdp(sample(segs, 14)[1:-1], 5.0)
    top2, lower2 = fix_solid(top, lower_pts)
    TOPS[sid] = top2
    return list(top2) + lower2, segs

SHAPES = {}
for sid in ['west-ledge', 'west-step', 'ridge-court', 'east-overhang', 'return-ramp']:
    poly, segs = outline(sid)
    SHAPES[sid] = Polygon(poly).buffer(0)

# Shore: authored as one mud bank; extends beyond play bounds for zoom-out.
shore_top = TOPS['shore']
ext_left = [(-1600, 3990), (-900, 3996), (-300, 4002)]
ext_right = [(7400, 4262), (8000, 4250), (8800, 4236)]
shore_poly = ext_left + shore_top + ext_right + [(8800, 6200), (-1600, 6200)]
SHAPES['shore'] = Polygon(shore_poly).buffer(0)

# ---------------------------------------------------------------- collision export
v6 = copy.deepcopy(L)
for s in v6['surfaces']:
    if s['id'] in TOPS:
        s['top'] = [list(p) for p in TOPS[s['id']]]
    else:  # timber decks are straight runs: drop collinear points (shape unchanged)
        s['top'] = [list(p) for p in rdp([tuple(p) for p in s['top']], 0.5)]
    if s['id'] in LOWER:
        poly, _ = outline(s['id'])
        n_top = len(TOPS[s['id']])
        s['top'] = [list(p) for p in TOPS[s['id']]]
        s['bottom'] = [[round(x, 1), round(y, 1)] for x, y in poly[n_top:]]
        s['artOutline'] = 'art/act4-stage31-claude-v1 (identical authored outline)'
v6['version'] = 6
v6['status'] = 'v6 Claude art-matched collision draft; physics re-probe required; not art/combat accepted'
for c in v6['covers']:
    pass
json.dump(v6, open(DST, 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- painting helpers
layers = {k: [] for k in ['REAR', 'STRUCT', 'BODY', 'SURFACE', 'FORE']}

MOD = [None]   # current semantic module (rock mass, deck, cover); None = spatial chunk
modules = {}   # (layer, module) -> [svg path elements], insertion-ordered

def module(name):
    MOD[0] = name

def add(layer, d, fill, extra=''):
    el = '<path d="%s" fill="%s"%s/>' % (d, fill, extra)
    layers[layer].append(el)
    m = MOD[0]
    if m is None or layer in ('STRUCT', 'REAR', 'FORE'):
        xs = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', d)][0::2]
        m = 'x%d' % (int((sum(xs) / len(xs) + 2000) // 900))
    modules.setdefault((layer, m), []).append(el)

def clip_paint(layer, base, poly_pts, fill):
    g = base.intersection(Polygon(poly_pts).buffer(0))
    if not g.is_empty:
        add(layer, shapely_d(g), fill)

def band_below(top, thick_fn):
    """Sage surface band: follows the walk line, thickness varies per x."""
    upper = [(x, y - 3) for x, y in top]
    lower = [(x, y + thick_fn(x)) for x, y in reversed(top)]
    return upper + lower

# ---------------------------------------------------------------- BODY: rock masses
def paint_rock(sid, lights, mids, darks, band=(16, 30)):
    module(sid)
    body = SHAPES[sid]
    add('BODY', shapely_d(body), ROCK_MID)
    for poly in mids:
        clip_paint('BODY', body, poly, ROCK_MIDL)
    for poly in lights:
        clip_paint('BODY', body, poly, ROCK_LIGHT)
    for poly in darks:
        clip_paint('BODY', body, poly, ROCK_DARK)
    top = TOPS[sid]
    x0, x1 = top[0][0], top[-1][0]
    lo, hi = band
    th = lambda x: lo + (hi - lo) * (0.5 + 0.5*math.sin((x - x0) / 140 + len(sid)))
    clip_paint('BODY', body.buffer(2), band_below(top, lambda x: th(x) + 10), SAGE_SHADOW)
    clip_paint('BODY', body.buffer(2), band_below(top, th), SAGE)
    clip_paint('BODY', body.buffer(2), band_below(top, lambda x: 5), SAGE_LIP)

# Fractured rock: hand-placed crack lines split each mass into planes; each
# plane is valued by the outward normal of the silhouette it belongs to
# (dawn light from the open sea, upper right), with occlusion under lips and
# near the ground. Interior planes alternate so the mass reads as blocks.
from shapely.ops import split as _split
LIGHT_DIR = (0.62, -0.78)
SHADES = [ROCK_DARK, ROCK_MID, ROCK_MIDL, ROCK_LIGHT]

def fracture(body, cracks):
    cells = [body]
    for c in cracks:
        line = LineString(c)
        nxt = []
        for cell in cells:
            try:
                parts = _split(cell, line)
                nxt.extend(g for g in parts.geoms if g.area > 50)
            except Exception:
                nxt.append(cell)
        cells = nxt
    return cells

def shade_cells(sid, cells, ground):
    body = SHAPES[sid]
    ext = body.exterior
    # orientation: shapely exterior may be CW/CCW; compute signed area
    coords = list(ext.coords)
    area2 = sum(x0*y1 - x1*y0 for (x0, y0), (x1, y1) in zip(coords, coords[1:]))
    out = []
    for i, cell in enumerate(cells):
        shared = cell.exterior.intersection(ext.buffer(1.5))
        nx = ny = 0.0
        segs = shared.geoms if hasattr(shared, 'geoms') else [shared]
        for g in segs:
            if g.is_empty or g.geom_type not in ('LineString', 'LinearRing'):
                continue
            cs = list(g.coords)
            for (x0, y0), (x1, y1) in zip(cs, cs[1:]):
                dx, dy = x1 - x0, y1 - y0
                # direction along the body boundary near this point
                d = ext.project(Polygon([(x0, y0), (x0+.1, y0), (x0, y0+.1)]).centroid)
                a, b = ext.interpolate(d), ext.interpolate(d + 1)
                bx, by = b.x - a.x, b.y - a.y
                if bx*dx + by*dy < 0:
                    dx, dy = -dx, -dy
                # outward normal for the ring orientation (y down)
                if area2 > 0:
                    nx, ny = nx + dy, ny - dx
                else:
                    nx, ny = nx - dy, ny + dx
        c = cell.centroid
        if abs(nx) + abs(ny) < 1:
            level = 1 + (i % 2)
        else:
            L = math.hypot(nx, ny)
            dot = (nx*LIGHT_DIR[0] + ny*LIGHT_DIR[1]) / L
            level = 3 if dot > 0.3 else 2 if dot > -0.15 else 1 if dot > -0.6 else 0
            if ny / L > 0.45:  # faces downward: underside of a lip
                level = 0
        if c.y > ground - 260:
            level = max(0, level - 1)
        out.append((cell, SHADES[level]))
    return out

def paint_fractured(sid, cracks, ground, band=(16, 30)):
    body = SHAPES[sid]
    add('BODY', shapely_d(body), ROCK_MID)
    for cell, col in shade_cells(sid, fracture(body, cracks), ground):
        add('BODY', shapely_d(cell), col)
    top = TOPS[sid]
    x0 = top[0][0]
    lo, hi = band
    th = lambda x: lo + (hi - lo) * (0.5 + 0.5*math.sin((x - x0) / 140 + len(sid)))
    clip_paint('BODY', body.buffer(2), band_below(top, lambda x: th(x) + 10), SAGE_SHADOW)
    clip_paint('BODY', body.buffer(2), band_below(top, th), SAGE)
    clip_paint('BODY', body.buffer(2), band_below(top, lambda x: 5), SAGE_LIP)

# Hand-painted planes. Light from the dawn sea (upper right): right/up facing
# planes LIGHT, column faces MIDL, lip undersides, caves and joints DARK.
paint_rock('west-ledge',
    lights=[[(1980, 3200), (2340, 3176), (2448, 3214), (2478, 3262), (2410, 3300), (2240, 3290), (2080, 3268)],
            [(2448, 3214), (2478, 3262), (2470, 3318), (2448, 3372), (2400, 3350), (2420, 3280)],
            [(2222, 3896), (2252, 3960), (2296, 4030), (2340, 4110), (2378, 4180), (2412, 4252), (2300, 4252), (2262, 4100), (2232, 3990)],
            [(1760, 3350), (1860, 3300), (1920, 3480), (1880, 3700), (1800, 3620)]],
    mids=[[(1440, 3340), (1760, 3290), (1800, 3400), (1700, 3600), (1560, 3700), (1460, 3600)],
          [(1880, 3700), (1920, 3480), (2060, 3420), (2100, 3640), (2040, 3900), (1960, 4120), (1900, 4252), (1840, 4252), (1860, 4000)],
          [(1560, 3960), (1700, 3880), (1760, 4100), (1700, 4252), (1630, 4252)]],
    darks=[[(2240, 3290), (2410, 3300), (2448, 3372), (2430, 3404), (2398, 3470), (2300, 3548), (2232, 3664), (2206, 3820), (2222, 3896), (2160, 3780), (2140, 3560), (2180, 3400)],
           [(2060, 3420), (2100, 3430), (2160, 3600), (2150, 3800), (2100, 4000), (2050, 4252), (2000, 4252), (2040, 3960), (2090, 3700)],
           [(1440, 3700), (1560, 3700), (1520, 3880), (1600, 4120), (1660, 4252), (1440, 4252)]])

paint_rock('ridge-court',
    lights=[[(4000, 2085), (4510, 2070), (4626, 2118), (4672, 2262), (4560, 2250), (4380, 2190), (4180, 2150)],
            [(4524, 2560), (4512, 2650), (4530, 2760), (4588, 2990), (4626, 3260), (4652, 3580), (4690, 3900), (4730, 4200), (4600, 4200), (4560, 3880), (4520, 3500), (4480, 3100), (4462, 2800), (4476, 2620)],
            [(3570, 2160), (3800, 2120), (3860, 2240), (3700, 2300), (3560, 2260)],
            [(4180, 2700), (4300, 2640), (4340, 2900), (4262, 3150), (4204, 2950)]],
    mids=[[(3540, 2206), (3700, 2300), (3860, 2240), (3960, 2420), (3880, 2620), (3740, 2600), (3600, 2500), (3500, 2400)],
          [(4000, 2300), (4180, 2250), (4300, 2640), (4180, 2700), (4204, 2950), (4262, 3150), (4240, 3500), (4300, 3900), (4280, 4200), (4120, 4200), (4140, 3800), (4080, 3400), (4100, 3000), (4020, 2700)],
          [(3966, 3500), (4060, 3550), (4040, 3900), (3980, 4200), (3790, 4200), (3850, 3980), (3912, 3740)]],
    darks=[[(4672, 2262), (4644, 2330), (4598, 2392), (4552, 2470), (4524, 2560), (4476, 2620), (4430, 2480), (4450, 2330), (4560, 2250)],
           [(3478, 2380), (3500, 2400), (3600, 2500), (3740, 2600), (3880, 2620), (3960, 2800), (3866, 3010), (3770, 2830), (3620, 2680), (3510, 2530)],
           [(4380, 2190), (4450, 2330), (4430, 2480), (4462, 2800), (4480, 3100), (4520, 3500), (4560, 3880), (4600, 4200), (4520, 4200), (4470, 3820), (4420, 3360), (4380, 2980), (4360, 2700), (4330, 2420)],
           [(3866, 3010), (3960, 2800), (4020, 2700), (4100, 3000), (4080, 3400), (4060, 3550), (3966, 3500), (3976, 3440), (3924, 3200)]])

paint_rock('east-overhang',
    lights=[[(5330, 2170), (5650, 2210), (6010, 2350), (6500, 2647), (6404, 2714), (6214, 2700), (5980, 2480), (5700, 2330), (5450, 2270)],
            [(6214, 2760), (6150, 2800), (6118, 2870), (6112, 2960), (6146, 3170), (6158, 3290), (6156, 3420), (6118, 3680), (6050, 3920), (5960, 3920), (6020, 3600), (6040, 3300), (6000, 3000), (6040, 2800)],
            [(4980, 2260), (5330, 2170), (5400, 2300), (5200, 2340), (5000, 2320)]],
    mids=[[(5450, 2270), (5700, 2330), (5760, 2600), (5700, 2900), (5760, 3300), (5700, 3700), (5740, 3960), (5560, 3970), (5600, 3600), (5560, 3200), (5580, 2800), (5480, 2500)],
          [(5980, 2480), (6214, 2700), (6040, 2800), (6000, 3000), (6040, 3300), (6020, 3600), (5960, 3920), (5850, 3930), (5900, 3500), (5850, 3100), (5900, 2700)]],
    darks=[[(4932, 2320), (5000, 2320), (5200, 2340), (5400, 2300), (5480, 2500), (5580, 2800), (5560, 3200), (5600, 3600), (5560, 3970), (5330, 3990), (5344, 3880), (5394, 3640), (5436, 3400), (5440, 3280), (5400, 3030), (5316, 2820), (5184, 2650), (5020, 2510), (4964, 2440)],
           [(5760, 2400), (5860, 2440), (5880, 2700), (5830, 3100), (5880, 3500), (5830, 3930), (5750, 3950), (5790, 3500), (5740, 3100), (5790, 2700)]])
# A wet, faintly lit plane inside the east sea cave keeps it from reading as a hole.
module('east-overhang')
clip_paint('BODY', SHAPES['east-overhang'], [(5240, 2440), (5420, 2400), (5500, 2640), (5470, 2900), (5380, 2700), (5290, 2560)], ROCK_MID)

# Scree bank and rockfall: rubble rather than monolith, so planes read as blocks.
def paint_rubble(sid, blocks_light, blocks_dark, band=(12, 22)):
    module(sid)
    body = SHAPES[sid]
    add('BODY', shapely_d(body), ROCK_MIDL)
    for poly in blocks_light:
        clip_paint('BODY', body, poly, ROCK_LIGHT)
    for poly in blocks_dark:
        clip_paint('BODY', body, poly, ROCK_MID)
    top = TOPS[sid]
    lo, hi = band
    th = lambda x: lo + (hi - lo) * (0.5 + 0.5*math.sin(x / 90))
    clip_paint('BODY', body.buffer(2), band_below(top, lambda x: th(x) + 8), SAGE_SHADOW)
    clip_paint('BODY', body.buffer(2), band_below(top, th), SAGE)

paint_rubble('west-step',
    blocks_light=[[(700, 3880), (900, 3830), (980, 3900), (920, 4000), (760, 3990)],
                  [(1100, 3700), (1300, 3600), (1380, 3700), (1300, 3820), (1150, 3820)],
                  [(1390, 3540), (1450, 3560), (1500, 3800), (1440, 3860)]],
    blocks_dark=[[(560, 4060), (760, 3990), (920, 4000), (1100, 4260), (560, 4260)],
                 [(980, 3900), (1150, 3820), (1300, 3820), (1440, 3860), (1500, 3800), (1600, 4260), (1100, 4260), (920, 4000)]])

paint_rubble('return-ramp',
    blocks_light=[[(4900, 3740), (5050, 3600), (5130, 3520), (5190, 3640), (5120, 3800), (5000, 3830)],
                  [(4600, 4020), (4700, 3960), (4780, 4060), (4700, 4140), (4610, 4120)]],
    blocks_dark=[[(5120, 3800), (5190, 3640), (5250, 3820), (5290, 4180), (5100, 4180), (5000, 3830)],
                 [(4780, 4060), (4900, 3960), (5000, 3830), (5100, 4180), (4700, 4180), (4700, 4140)]])

# Shore mud bank with low sediment strata.
module('shore')
shore = SHAPES['shore']
add('BODY', shapely_d(shore), MUD)
for y0, amp, col in [(4380, 30, MUD_DARK), (4620, 40, ROCK_DARK), (4900, 50, ROCK_DARK)]:
    strip = [(x, y0 + amp*math.sin(x/410) + 18*math.sin(x/133)) for x in range(-1600, 8801, 80)]
    clip_paint('BODY', shore, strip + [(8800, 6300), (-1600, 6300)], col)
# Light wet-sand facets on seaward slopes (dock bank, east drop).
clip_paint('BODY', shore, [(6220, 3895), (6440, 4190), (6420, 4320), (6300, 4200), (6200, 3990)], ROCK_MIDL)
clip_paint('BODY', shore, [(5250, 3990), (5600, 3895), (5560, 3980), (5320, 4060)], ROCK_MIDL)
shore_top_ext = ext_left + shore_top + ext_right
clip_paint('BODY', shore.buffer(2), band_below(shore_top_ext, lambda x: 26 + 8*math.sin(x/120)), SAGE_SHADOW)
clip_paint('BODY', shore.buffer(2), band_below(shore_top_ext, lambda x: 16 + 6*math.sin(x/120)), SAGE)

# ---------------------------------------------------------------- timber kit
def ground_y(x):
    """Real support under x: the highest solid top (shore/rock) at x."""
    best = None
    for sid, shp in SHAPES.items():
        line = LineString([(x, 0), (x, 7000)])
        hit = shp.intersection(line)
        if hit.is_empty:
            continue
        y = hit.bounds[1]
        best = y if best is None else min(best, y)
    return best

def ground_below(x, y_from):
    """First solid top strictly below y_from at x (what a post really stands on)."""
    best = None
    line = LineString([(x, y_from + 1), (x, 7000)])
    for shp in SHAPES.values():
        hit = shp.intersection(line)
        if not hit.is_empty:
            y = hit.bounds[1]
            best = y if best is None else min(best, y)
    return best

def shore_y(x):
    hit = SHAPES['shore'].intersection(LineString([(x, 0), (x, 7000)]))
    return hit.bounds[1]

def deck_y(sid, x):
    top = [tuple(p) for p in S[sid]['top']]
    return interp(top, min(max(x, top[0][0]), top[-1][0]))

def post(x, y_top, y_bot, w=22, footing=True, layer='STRUCT'):
    add(layer, poly_d([(x - w/2, y_top), (x + w/2, y_top), (x + w/2, y_bot), (x - w/2, y_bot)]), WOOD_DARK)
    add(layer, poly_d([(x + w/2 - 7, y_top), (x + w/2, y_top), (x + w/2, y_bot), (x + w/2 - 7, y_bot)]), WOOD)
    if footing:  # stone pad the post stands on
        add(layer, seg_d(catmull([(x - 30, y_bot + 6), (x - 24, y_bot - 12), (x + 4, y_bot - 18), (x + 28, y_bot - 10), (x + 32, y_bot + 6)], tension=0.5)) + ' Z', STONE)

def beam(x0, y0, x1, y1, t=16, col=WOOD_DARK, layer='STRUCT'):
    a = math.atan2(y1 - y0, x1 - x0)
    nx, ny = -math.sin(a) * t/2, math.cos(a) * t/2
    add(layer, poly_d([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny), (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)]), col)

def socket(x, y, side):
    """Beam end let into rock: dark mortise + wedge."""
    add('STRUCT', poly_d([(x - 14*side, y - 14), (x + 10*side, y - 10), (x + 10*side, y + 12), (x - 14*side, y + 14)]), ROCK_DARK)

def deck(sid, t=26, x_from=None, x_to=None, planks=True):
    module(sid)
    top = [tuple(p) for p in S[sid]['top']]
    if x_from is not None or x_to is not None:
        a = x_from if x_from is not None else top[0][0]
        b = x_to if x_to is not None else top[-1][0]
        top = [(a, interp(top, a))] + [p for p in top if a < p[0] < b] + [(b, interp(top, b))]
    face = [(x, y) for x, y in top] + [(x, y + t) for x, y in reversed(top)]
    add('SURFACE', poly_d(face), WOOD)
    add('SURFACE', poly_d([(x, y) for x, y in top] + [(x, y + 6) for x, y in reversed(top)]), WOOD_LIGHT)
    add('SURFACE', poly_d([(x, y + t - 6) for x, y in top] + [(x, y + t) for x, y in reversed(top)]), WOOD_SHADOW)
    if planks:  # plank butt joints
        x0, x1 = top[0][0], top[-1][0]
        x = x0 + 64
        while x < x1 - 30:
            y = interp(top, x)
            add('SURFACE', poly_d([(x - 1.5, y + 6), (x + 1.5, y + 6), (x + 1.5, y + t - 6), (x - 1.5, y + t - 6)]), WOOD_DARK)
            x += 58 + (int(x) * 7919 % 23)
    return top

def rope(p0, p1, sag, w=5, layer='SURFACE'):
    mid = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + sag)
    pts = []
    for i in range(25):
        t = i / 24
        pts.append(((1-t)**2*p0[0] + 2*(1-t)*t*mid[0] + t*t*p1[0], (1-t)**2*p0[1] + 2*(1-t)*t*mid[1] + t*t*p1[1]))
    upper = pts
    lower = [(x, y + w) for x, y in reversed(pts)]
    add(layer, poly_d(upper + lower), ROPE)
    return pts

# ---------------------------------------------------------------- STRUCT: central landing scaffold
# Posts stand on stone pads on the real shore; each deck rests on ledgers bolted to them.
gy = lambda x: ground_y(x)
P = {2640: deck_y('middle-west', 2640) + 26,
     2890: deck_y('broken-crossing', 2890) - 120,   # rope post rises above the bridge
     3130: deck_y('ridge-shoulder', 3130) + 26,
     3520: deck_y('middle-junction', 3520) + 26,
     3660: deck_y('middle-junction', 3640) + 26}
for x, top in P.items():
    post(x, top, ground_below(x, top) if x != 3520 else 4021, w=26 if x in (2890, 3130) else 22)
# Ledgers under every deck at each post it crosses.
def ledger(sid, xs):
    for x in xs:
        y = deck_y(sid, x) + 26
        beam(x - 46, y + 8, x + 46, y + 8, t=16)
for sid, xs in [('middle-west', [2640, 2890, 3130]), ('middle-east', [3130, 3520, 3660]),
                ('scaffold-low', [2890]), ('scaffold-mid', [2640]), ('scaffold-high', [2890]),
                ('middle-junction', [2890, 3130, 3520, 3660])]:
    ledger(sid, xs)
# Short outriggers carrying landing ends that sit between posts.
beam(2890, deck_y('scaffold-low', 3060) + 34, 3130, deck_y('scaffold-low', 3060) + 34)
beam(2890, deck_y('scaffold-high', 3060) + 34, 3130, deck_y('scaffold-high', 3060) + 34)
beam(2640, deck_y('scaffold-mid', 2820) + 34, 2890, deck_y('scaffold-mid', 2820) + 34)
# Cross bracing in the tall bays.
for (xa, xb, ya, yb) in [(2890, 3130, 3600, 4150), (2890, 3130, 2860, 3060), (2640, 2890, 3560, 3820),
                         (3130, 3520, 3500, 3980), (3520, 3660, 3460, 3980)]:
    beam(xa, ya, xb, yb, t=12, col=WOOD_DARK)
    beam(xa, yb, xb, ya, t=12, col=WOOD_DARK)
# Lower bridge sockets into the two rocks.
socket(2418, deck_y('middle-west', 2418) + 14, -1)
socket(3972, deck_y('middle-east', 3972) + 14, 1)

# Gallery on the middle rock face: post 3130 + knee braces into the rock.
beam(3300, deck_y('ridge-shoulder', 3300) + 30, 3492, 2468, t=16)
socket(3492, 2468, 1)
beam(3170, deck_y('ridge-shoulder', 3170) + 30, 3130, deck_y('ridge-shoulder', 3130) + 120, t=12)
socket(3482, deck_y('ridge-shoulder', 3482) + 14, 1)

# Rope bridge: bridgehead trestle on the west rock, rope posts at 2890/3130.
bh = [2214, 2296]
for x in bh:
    post(x, deck_y('broken-crossing', x) - 120, gy(x), w=20, footing=False)
beam(bh[0] - 10, deck_y('broken-crossing', 2214) + 34, bh[1] + 10, deck_y('broken-crossing', 2296) + 34, t=16)
beam(bh[0], gy(bh[0]) - 10, bh[1], deck_y('broken-crossing', 2296) + 40, t=10)
rail_tops = [(2214, deck_y('broken-crossing', 2214) - 112), (2296, deck_y('broken-crossing', 2296) - 112),
             (2890, deck_y('broken-crossing', 2890) - 112), (3130, deck_y('broken-crossing', 3130) - 112)]

# ---------------------------------------------------------------- STRUCT: lookout deck (망대)
lk = [4440, 4500, 5180, 5262]
for x in lk:
    post(x, deck_y('lookout', x) + 26, ground_below(x, deck_y('lookout', x)), w=22, footing=True)
beam(4440, deck_y('lookout', 4440) + 70, 4500, gy(4500) - 20, t=10)
beam(5180, deck_y('lookout', 5180) + 120, 5262, gy(5262) - 30, t=12)
beam(5180, gy(5180) - 30, 5262, deck_y('lookout', 5262) + 120, t=12)
# Under-deck truss across the chasm between the two rocks.
chord = [(x, deck_y('lookout', x) + 150) for x in (4500, 4840, 5180)]
beam(4500, deck_y('lookout', 4500) + 40, chord[1][0], chord[1][1], t=14)
beam(chord[1][0], chord[1][1], 5180, deck_y('lookout', 5180) + 40, t=14)
beam(chord[1][0], deck_y('lookout', chord[1][0]) + 26, chord[1][0], chord[1][1], t=12)
beam(4500, deck_y('lookout', 4500) + 40, 5180, deck_y('lookout', 5180) + 40, t=18)

# ---------------------------------------------------------------- STRUCT: east stair tower
tw = {6280: deck_y('east-middle', 6280) + 26, 6560: deck_y('east-turn', 6560) + 26, 6880: deck_y('east-turn', 6880) + 26}
for x, top in tw.items():
    post(x, top, ground_below(x, top), w=24)
for sid, xs in [('east-turn', [6560, 6880]), ('east-middle', [6280, 6560, 6880]), ('east-low', [6280, 6560])]:
    ledger(sid, xs)
for (xa, xb, ya, yb) in [(6560, 6880, 2760, 3060), (6560, 6880, 3200, 3480), (6280, 6560, 3200, 3480),
                         (6280, 6560, 3640, 3960), (6560, 6880, 3640, 4140)]:
    beam(xa, ya, xb, yb, t=12)
    beam(xa, yb, xb, ya, t=12)
# Horizontal ties into the east rock flank (why the tower stays upright).
for y, xr in [(2790, 6116), (3200, 6050), (3560, 6084)]:
    beam(xr, y, 6560, y, t=16)
    socket(xr, y, -1)

# ---------------------------------------------------------------- SURFACE: decks
TRIM = {'middle-west': (2426, None), 'middle-east': (None, 3974), 'ridge-shoulder': (None, 3484)}
for sid in ['middle-west', 'middle-east', 'scaffold-low', 'scaffold-mid', 'scaffold-high',
            'middle-junction', 'ridge-shoulder', 'lookout', 'east-turn', 'east-middle', 'east-low']:
    a, b = TRIM.get(sid, (None, None))
    deck(sid, x_from=a, x_to=b)
# Beam-end mortises cut into the rock face where decks enter it.
for x, sid, side in [(2426, 'middle-west', -1), (3974, 'middle-east', 1), (3484, 'ridge-shoulder', 1)]:
    module(sid)
    y = deck_y(sid, x)
    add('SURFACE', poly_d([(x - 4*side, y - 6), (x + 16*side, y - 2), (x + 16*side, y + 32), (x - 4*side, y + 30)]), ROCK_DARK)
# Rope bridge deck: slatted planks with gaps, hung from handrails.
module('broken-crossing')
bc = [tuple(p) for p in S['broken-crossing']['top']]
x = bc[0][0]
while x < bc[-1][0] - 10:
    w = 30
    xa, xb = x, min(x + w, bc[-1][0])
    ya, yb = interp(bc, xa), interp(bc, xb)
    add('SURFACE', poly_d([(xa, ya), (xb, yb), (xb, yb + 18), (xa, ya + 18)]), WOOD)
    add('SURFACE', poly_d([(xa, ya), (xb, yb), (xb, yb + 5), (xa, ya + 5)]), WOOD_LIGHT)
    x += w + 7
rope((bc[0][0], bc[0][1] + 20), (bc[-1][0], bc[-1][1] + 20), 0, w=6)   # stringer under the slats
for a, b in zip(rail_tops, rail_tops[1:]):
    pts = rope(a, b, 46)
    for i in range(3, 24, 4):  # hangers from handrail to deck
        hx, hy = pts[i]
        add('SURFACE', poly_d([(hx - 1.5, hy), (hx + 1.5, hy), (hx + 1.5, interp(bc, hx)), (hx - 1.5, interp(bc, hx))]), ROPE)

# ---------------------------------------------------------------- covers (solid colliders)
# court-cover: stacked-stone cairn; low-cover: boulder the scaffold post stands on;
# lookout-cover: boarded shield wall on the lookout deck.
module('court-cover')
cc = next(c for c in L['covers'] if c['id'] == 'court-cover')
x0, y1 = cc['x'], cc['y']; x1, y0 = x0 + cc['w'], y1 - cc['h']
for i, (a, b, col) in enumerate([(0, 52, ROCK_MIDL), (46, 96, ROCK_LIGHT), (92, 150, ROCK_MIDL)]):
    inset = 6 + i * 10
    add('BODY', seg_d(catmull([(x0 + inset - 8, y1 - a), (x0 + inset - 4, y1 - b + 8), (x0 + cc['w']/2, y1 - b - 4), (x1 - inset + 4, y1 - b + 8), (x1 - inset + 8, y1 - a)], tension=0.6)) + ' Z', col)
module('low-cover')
lc = next(c for c in L['covers'] if c['id'] == 'low-cover')
x0, y1 = lc['x'], lc['y']; y0 = y1 - lc['h']; x1 = x0 + lc['w']
# Squat mooring stone (계선석) of the old landing: dressed block, waisted neck, rope.
add('BODY', poly_d([(x0 - 4, y1 + 6), (x0 + 2, y0 + 70), (x0 + 14, y0 + 58), (x0 + 10, y0 + 14), (x0 + 30, y0), (x1 - 26, y0), (x1 - 8, y0 + 14), (x1 - 12, y0 + 58), (x1, y0 + 70), (x1 + 6, y1 + 6)]), ROCK_MIDL)
add('BODY', poly_d([(x0 + 56, y0), (x1 - 26, y0), (x1 - 8, y0 + 14), (x1 - 12, y0 + 58), (x1, y0 + 70), (x1 + 6, y1 + 6), (x0 + 64, y1 + 6), (x0 + 60, y0 + 70)]), ROCK_LIGHT)
add('BODY', poly_d([(x0 - 4, y1 + 6), (x0 + 2, y0 + 70), (x0 + 22, y0 + 76), (x0 + 18, y1 + 6)]), ROCK_MID)
for k in range(3):
    yy = y0 + 30 + k * 9
    add('BODY', poly_d([(x0 + 10, yy), (x1 - 10, yy - 2), (x1 - 10, yy + 5), (x0 + 10, yy + 7)]), ROPE)
add('BODY', 'M%s %s Q%s %s %s %s L%s %s Q%s %s %s %s Z' % tuple(f(v) for v in (x1 - 12, y0 + 40, x1 + 40, y0 + 60, x1 + 60, y1 + 4, x1 + 54, y1 + 6, x1 + 34, y0 + 66, x1 - 12, y0 + 48)), ROPE)

module('lookout-cover')
oc = next(c for c in L['covers'] if c['id'] == 'lookout-cover')
x0, y1 = oc['x'], oc['y']; y0 = y1 - oc['h']
add('SURFACE', poly_d([(x0, y0 + 10), (x0 + oc['w'], y0), (x0 + oc['w'], y1), (x0, y1)]), WOOD)
for k in range(1, 4):
    xk = x0 + k * oc['w'] / 4
    add('SURFACE', poly_d([(xk - 1.5, y0 + 8), (xk + 1.5, y0 + 8), (xk + 1.5, y1), (xk - 1.5, y1)]), WOOD_DARK)
add('SURFACE', poly_d([(x0, y0 + 10), (x0 + oc['w'], y0), (x0 + oc['w'], y0 + 8), (x0, y0 + 18)]), WOOD_LIGHT)

# ---------------------------------------------------------------- FORE: reeds and pebbles (sparse, short)
def reed_clump(x, n=7, h=88, lean=0.0):
    base = shore_y(x)
    for i in range(n):
        dx = (i - n/2) * 7
        hh = h * (0.6 + 0.4 * ((i * 37) % 11) / 10)
        bend = lean + ((i * 13) % 5 - 2) * 0.05
        p0 = (x + dx - 3, base + 4); p3 = (x + dx + bend * hh * 0.9, base - hh)
        c = (x + dx + bend * hh * 0.2, base - hh * 0.55)
        col = REED_DARK if i % 3 == 0 else REED
        add('FORE', 'M%s %s Q%s %s %s %s Q%s %s %s %s Z' % tuple(f(v) for v in (*p0, c[0] - 1, c[1], *p3, c[0] + 4, c[1], x + dx + 3, base + 4)), col)
        if i % 3 == 1:  # narrow seed head
            add('FORE', 'M%s %s Q%s %s %s %s Q%s %s %s %s Z' % tuple(f(v) for v in (p3[0] - 2, p3[1] + 2, p3[0] + 3 + bend*20, p3[1] + 10, p3[0] + bend*30, p3[1] + 26, p3[0] - 3, p3[1] + 12, p3[0] - 2, p3[1] + 2)), '#a3a58f')

def pebbles(x):
    base = shore_y(x)
    add('FORE', seg_d(catmull([(x - 36, base + 6), (x - 30, base - 14), (x - 6, base - 20), (x + 14, base - 10), (x + 18, base + 6)], tension=0.5)) + ' Z', STONE)
    add('FORE', seg_d(catmull([(x + 10, base + 6), (x + 16, base - 8), (x + 34, base - 10), (x + 44, base + 6)], tension=0.5)) + ' Z', ROCK_MIDL)

for x, n, h, lean in [(-420, 8, 100, 0.1), (110, 6, 80, 0.15), (2470, 7, 90, 0.1), (3330, 6, 76, -0.05),
                      (4700, 7, 92, 0.12), (6620, 6, 84, 0.1), (7200, 8, 96, 0.08)]:
    reed_clump(x, n, h, lean)
for x in [700, 2560, 3760, 4420, 6990]:
    pebbles(x)

# ---------------------------------------------------------------- REAR: reed beds behind the walk line
def reed_bed(x0, x1, h):
    """Dense reed stand behind the walk line: spiked silhouette, not a bush."""
    pts = []
    x, k = x0, 0
    while x <= x1:
        b = shore_y(x)
        edge = min(1.0, (x - x0) / 60, (x1 - x) / 60)
        tall = h * (0.55 + 0.45 * ((k * 53) % 17) / 16) * max(0.25, edge)
        pts.append((x - 3, b - tall * 0.25))
        pts.append((x + 1 + ((k * 7) % 5 - 2) * 2, b - tall))
        x += 9 + (k * 31) % 7
        k += 1
    base = [(x, shore_y(x) + 10) for x in range(int(x1), int(x0) - 1, -40)]
    add('REAR', poly_d(pts + base), REED_DARK)
for a, b, h in [(-1400, -200, 120), (2500, 2620, 90), (3250, 3440, 80), (4560, 4880, 100), (6440, 6700, 90), (7000, 8600, 130)]:
    reed_bed(a, b, h)

# ---------------------------------------------------------------- write SVG
order = ['REAR', 'STRUCT', 'BODY', 'SURFACE', 'FORE']
labels = {'REAR': 'REAR (behind actors)', 'STRUCT': 'STRUCT timber supports (behind actors)',
          'BODY': 'BODY rock/earth = collider outline', 'SURFACE': 'SURFACE decks and ropes',
          'FORE': 'FORE reeds (in front of actors)'}
NS = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"'
def svg(view, extra_back='', extra_front=''):
    body = ''.join('<g id="%s" inkscape:groupmode="layer" inkscape:label="%s">%s</g>' % (k, labels[k], ''.join(layers[k])) for k in order)
    x, y, w, h = view
    return '<svg %s width="%d" height="%d" viewBox="%s %s %s %s">%s%s%s</svg>' % (NS, w, h, x, y, w, h, extra_back, body, extra_front)

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'stage31.svg').write_text(svg((-1600, 1200, 10400, 5000)))
# One semantic layer per file for the importer (world coordinates, no transform).
for k in order:
    one = '<g id="%s">%s</g>' % (k, ''.join(layers[k]))
    (OUT / ('layer-%s.svg' % k.lower())).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="10400" height="5000" viewBox="-1600 1200 10400 5000">%s</svg>' % one)

# Spatial modules for the engine: BODY/SURFACE per collider (rock mass, deck,
# cover), STRUCT/REAR/FORE per 900-unit column, so live passes draw only what
# is on screen and each painted collider has exactly one owner.
mdir = OUT / 'modules'
mdir.mkdir(exist_ok=True)
for old in mdir.glob('*.svg'):
    old.unlink()
manifest = []
def merge_fills(els):
    # One compound path per fill, in first-appearance order. Draw calls drop
    # sharply; overlap order only changes between same-material timber parts.
    groups = {}
    for e in els:
        d = e.split('d="')[1].split('"')[0]
        fill = e.split('fill="')[1].split('"')[0]
        groups.setdefault(fill, []).append(d)
    return ['<path d="%s" fill="%s"/>' % (' '.join(ds), fill) for fill, ds in groups.items()]

for (layer, m), els in modules.items():
    if layer != 'BODY':
        els = merge_fills(els)
    if layer in ('BODY', 'SURFACE') and m.startswith('x'):
        raise SystemExit('unowned %s paint in %s' % (layer, m))
    nums = [float(v) for e in els for v in re.findall(r'-?\d+(?:\.\d+)?', e.split('d="')[1].split('"')[0])]
    xs, ys = nums[0::2], nums[1::2]
    box = [math.floor(min(xs)) - 4, math.floor(min(ys)) - 4, math.ceil(max(xs)) + 4, math.ceil(max(ys)) + 4]
    name = '%s-%s' % (layer.lower(), m)
    (mdir / (name + '.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%d %d %d %d">%s</svg>' % (
        box[2] - box[0], box[3] - box[1], box[0], box[1], box[2] - box[0], box[3] - box[1], ''.join(els)))
    terrain = None
    if layer in ('BODY', 'SURFACE'):
        terrain = 'pilot31-' + m
    manifest.append({'name': name, 'layer': layer, 'module': m, 'bounds': box, 'paths': len(els), 'terrain': terrain})
print('module paths', sum(r['paths'] for r in manifest))
(OUT / 'modules.json').write_text(json.dumps(manifest, indent=1))

far = (ROOT / 'shared/assets/environment/campaign-far/act4-estuary.webp').resolve()
sky = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3d6b"/>'
       '<stop offset="1" stop-color="#5a6c9a"/></linearGradient></defs>'
       '<rect x="-1600" y="0" width="10400" height="6200" fill="url(#sky)"/>'
       # far raster (review preview only; runtime uses the existing far image path)
       '<image xlink:href="%s" x="-1600" y="1500" width="10400" height="3466" preserveAspectRatio="none"/>' % far.as_uri())
figs = ''
for (x, y) in [(260, 4000), (1500, 3322), (3035, 2509), (4424, 2065), (5265, 1825), (6245, 3900), (2950, 4042)]:
    figs += ('<g opacity="0.9"><rect x="%s" y="%s" width="44" height="92" rx="18" fill="#e9d9b8"/>'
             '<circle cx="%s" cy="%s" r="17" fill="#e9d9b8"/></g>' % (f(x - 22), f(y - 92), f(x), f(y - 104)))
(ROOT / '_local/reports/stage31-claude').mkdir(parents=True, exist_ok=True)
(ROOT / '_local/reports/stage31-claude/preview.svg').write_text(svg((-1600, 1200, 10400, 5000), sky, figs))
print('ok', {k: len(v) for k, v in layers.items()})
