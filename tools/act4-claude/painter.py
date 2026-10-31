"""Act 4 direct-vector terrain painter (Claude). Shared by every stage script.

A stage script declares geography in world units:
  solid(id, top, lower)   rock/earth mass; `top` is the walk line, `lower` the
                          hand-placed outline back to the top start ('c' = sharp)
  deck(id, top, kind)     one-way timber (plank | stairs | rope); supports are
                          derived from real geometry below, or the build fails
  cover(id, x, y, w, h, kind)
Then build() writes:
  - the collision layout (same schema as tools/act4-pilot/layouts) whose solid
    outlines ARE the painted outlines (simplified within a few units),
  - per-collider BODY/SURFACE modules and per-column STRUCT/REAR/FORE modules
    (same-fill paths merged), plus a review preview SVG.

Optimisation is a first-class rule (user, 2026-10-30): colliders are simplified
(walk lines 4u, outlines 6u), paint coordinates are integers, every module has
one compound path per fill. No invisible micro detail.
"""
import json, math, copy, re, random
from pathlib import Path
from shapely.geometry import Polygon, LineString, Point, MultiPolygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]

ROCK_LIGHT, ROCK_MIDL, ROCK_MID, ROCK_DARK = '#35537e', '#244069', '#142a4b', '#0f1d36'
SAGE, SAGE_LIP, SAGE_SHADOW = '#96a86e', '#a8b981', '#6f8158'
MUD, MUD_DARK = '#1a3052', '#13243f'
WOOD_LIGHT, WOOD, WOOD_DARK, WOOD_SHADOW = '#968c7b', '#6a635b', '#403e47', '#2c2d3a'
ROPE, REED, REED_DARK, STONE = '#b0a68f', '#7e8a7a', '#5a6662', '#2d4670'
BAMBOO, BAMBOO_DARK, BAMBOO_LIGHT = '#5f7a6a', '#3c5250', '#86a08a'
LIGHT_DIR = (0.62, -0.78)

HAZE = (0x74, 0x92, 0xc0)

NEAR = (0x0a, 0x13, 0x26)

def mix(c, a):
    """a > 0: toward the haze (far); a < 0: toward deep shadow (near)."""
    v = [int(c[i:i + 2], 16) for i in (1, 3, 5)]
    tgt = HAZE if a >= 0 else NEAR
    return '#%02x%02x%02x' % tuple(int(round(x + (h - x) * abs(a))) for x, h in zip(v, tgt))

def f(v):
    return str(int(round(v)))

def poly_d(pts, close=True):
    return 'M' + ' L'.join('%s %s' % (f(x), f(y)) for x, y in pts) + (' Z' if close else '')

def shapely_d(g, simplify=1.5):
    out = []
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        if p.is_empty or p.geom_type != 'Polygon' or p.area < 40:
            continue
        p = p.simplify(simplify)
        out.append(poly_d(list(p.exterior.coords)[:-1]))
        for h in p.interiors:
            out.append(poly_d(list(h.coords)[:-1]))
    return ' '.join(out)

def catmull(points, tension=0.3, corners=()):
    n, segs = len(points), []
    for i in range(n - 1):
        p0 = points[i - 1] if i > 0 else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < n else p2
        t1 = 0 if i in corners else tension
        t2 = 0 if (i + 1) in corners else tension
        segs.append((p1, (p1[0] + (p2[0] - p0[0]) * t1 / 3, p1[1] + (p2[1] - p0[1]) * t1 / 3),
                     (p2[0] - (p3[0] - p1[0]) * t2 / 3, p2[1] - (p3[1] - p1[1]) * t2 / 3), p2))
    return segs

def sample(segs, step=16):
    pts = []
    for p0, c1, c2, p1 in segs:
        L = math.dist(p0, c1) + math.dist(c1, c2) + math.dist(c2, p1)
        k = max(2, int(L / step))
        for j in range(k):
            t, u = j / k, 1 - j / k
            pts.append((u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*p1[0],
                        u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*p1[1]))
    pts.append(segs[-1][3])
    return pts

def rdp(pts, eps):
    if len(pts) < 3:
        return list(pts)
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [a, b]

def interp(poly, x):
    x = min(max(x, poly[0][0]), poly[-1][0])
    for (x0, y0), (x1, y1) in zip(poly, poly[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / ((x1 - x0) or 1)
    return poly[-1][1]


def fix_traps(ring, walk_slope=1.25):
    """Engine rule (found in 31 playtests): an upward-facing face steeper than
    walkable but not vertical holds a falling body in a land/fall loop (not
    grounded, cannot jump). Replace each such edge with a vertical wall plus a
    walkable apron so bodies either slide off a wall or stand on a slope."""
    poly = Polygon(ring)
    out = [ring[0]]
    for p0, p1 in zip(ring, ring[1:] + ring[:1]):
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = math.hypot(dx, dy)
        if L > 1 and abs(dx) > 0.5 and abs(dy) > walk_slope * abs(dx):
            nx, ny = dy / L, -dx / L
            mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
            if poly.contains(Point(mx + nx * 3, my + ny * 3)):
                nx, ny = -nx, -ny
            if ny < -0.02:   # upward-facing steep face
                hi, lo = (p0, p1) if p0[1] < p1[1] else (p1, p0)
                out.append((hi[0], lo[1] - abs(dx) * 0.9))
        out.append(p1)
    return out[:-1]

def fix_solid(walk, lower):
    """Apply fix_traps to a solid and split it back into walk line + outline."""
    ring = fix_traps(list(walk) + list(lower))
    k = max(i for i, p in enumerate(ring) if p == walk[-1])
    return ring[:k + 1], ring[k + 1:]

class Painter:
    def __init__(self, stage, width, height, seed=1):
        self.n, self.W, self.H = stage, width, height
        self.rng = random.Random(seed)
        self.solids, self.decks, self.covers = {}, {}, []
        self.mod, self.modules, self.layers = None, {}, {k: [] for k in ['REAR', 'STRUCT', 'BODY', 'SURFACE', 'FORE']}
        self.errors = []
        self.art_features = []
        self._lit_wall = False
        self.crag = False   # concept crag shader for rock bodies (35+)
        self.depth = None   # (y_far, y_near): higher terraces recede into haze

    # ------------------------------------------------------------ declarations
    def undulate(self, top, seed, amp=1.0, keep=()):
        x0, x1 = top[0][0], top[-1][0]
        xs = list(range(int(x0), int(x1), 24)) + [x1]
        out = []
        for x in xs:
            y = interp(top, x)
            if not any(a <= x <= b for a, b in keep) and amp:
                w = min(1.0, (x - x0) / 90, (x1 - x) / 90)
                for a, b in keep:
                    w = min(w, max(0.0, min(abs(x - a), abs(x - b)) / 120))
                y += w * amp * (11 * math.sin(x / 157 + seed) + 6 * math.sin(x / 71 + 2.3 * seed) + 3 * math.sin(x / 37 + 5 * seed))
            out.append((round(x, 1), round(y, 1)))
        return rdp(out, 4.0)

    def solid(self, sid, top, lower, kind='rock', amp=1.0, keep=(), role='', band=(16, 30), extend=None, steps=(), moss=True):
        """kind: rock | earth (mud/soil strata) | masonry."""
        assert top[0][0] < top[-1][0], 'walk line must run west -> east: ' + sid
        walk = self.undulate([tuple(p) for p in top], len(sid) * 1.7, amp, keep)
        corners = {i + 1 for i, p in enumerate(lower) if len(p) > 2}
        chain = [walk[-1]] + [tuple(p[:2]) for p in lower] + [walk[0]]
        segs = catmull(chain, 0.3, {0, len(chain) - 1} | corners)
        art_lower = sample(segs, 16)[1:-1]
        walk, art_lower = fix_solid(walk, rdp(art_lower, 5.0))
        poly = Polygon(list(walk) + art_lower).buffer(0)
        if extend:  # zoom-out continuation beyond play bounds (art only; domain extends collision)
            polys = extend if isinstance(extend[0][0], (list, tuple)) else [extend]
            poly = unary_union([poly] + [Polygon(e) for e in polys]).buffer(0)
        self.solids[sid] = dict(id=sid, walk=walk, lower=art_lower, poly=poly, kind=kind, role=role, band=band, steps=steps, moss=moss)

    def deck(self, sid, top, kind='plank', role='', sockets=()):
        self.decks[sid] = dict(id=sid, top=rdp([tuple(p) for p in top], 0.5), kind=kind, role=role, sockets=sockets)

    def cover(self, cid, x, y, w, h, kind='boulder'):
        self.covers.append(dict(id=cid, x=x, y=y, w=w, h=h, kind=kind))

    # ------------------------------------------------------------ geometry queries
    def recede(self, y):
        """0 near .. 1 far, quantised to 5 steps (few distinct fills)."""
        if not self.depth:
            return 0.0
        y0, y1 = self.depth
        return round(max(0.0, min(1.0, (y1 - y) / (y1 - y0))) * 4) / 4

    def hz(self, c, y):
        if not self.depth:
            return c
        r = self.recede(y)
        return mix(c, .52 * r - .22 * (1 - r))

    def ground_below(self, x, y_from, include_decks=False):
        best = None
        line = LineString([(x, y_from + 1), (x, self.H + 4000)])
        for s in self.solids.values():
            hit = s['poly'].intersection(line)
            if not hit.is_empty:
                y = hit.bounds[1]
                best = y if best is None else min(best, y)
        if include_decks:
            for d in self.decks.values():
                xs = [p[0] for p in d['top']]
                if min(xs) <= x <= max(xs):
                    y = interp(d['top'], x)
                    if y > y_from + 30 and (best is None or y < best):
                        best = y
        return best

    def in_solid(self, x, y, pad=24):
        p = Point(x, y)
        return any(s['poly'].buffer(pad).contains(p) for s in self.solids.values())

    # ------------------------------------------------------------ paint primitives
    def module(self, name):
        self.mod = name

    def add(self, layer, d, fill):
        if not d:
            return
        if getattr(self, '_mute', False) and layer == 'STRUCT':
            return
        if getattr(self, '_hz_y', None) is not None and fill.startswith('#'):
            fill = self.hz(fill, self._hz_y)
        el = (d, fill)
        self.layers[layer].append(el)
        m = self.mod
        if layer == 'STRUCT' and getattr(self, '_grp', None):
            m = self._grp   # depth-ordered fill: its own module, in paint order
        elif m is None or layer in ('STRUCT', 'REAR', 'FORE'):
            xs = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', d)][0::2]
            m = 'x%d' % int((sum(xs) / len(xs) + 2000) // 900)
        self.modules.setdefault((layer, m), []).append(el)

    def clip(self, layer, base, pts_or_geom, fill):
        g = pts_or_geom if hasattr(pts_or_geom, 'geom_type') else Polygon(pts_or_geom).buffer(0)
        g = base.intersection(g)
        if not g.is_empty:
            self.add(layer, shapely_d(g), fill)

    # ------------------------------------------------------------ rock shading
    def shade_rock(self, s):
        poly, rng = s['poly'], random.Random(hash(s['id']) & 0xffff)
        minx, miny, maxx, maxy = poly.bounds
        self.add('BODY', shapely_d(poly), ROCK_MID)
        # Fracture shards: long angular facets hanging/standing in the mass
        # (style reference), mostly vertical, varied size; lit or shaded by
        # which side of the mass they sit on.
        cx = (minx + maxx) / 2
        lit, mid, deep = [], [], []
        area = poly.area
        for _ in range(int(min(26, max(3, area / 260000)))):
            for _try in range(12):
                x0 = rng.uniform(minx, maxx); y0 = rng.uniform(miny, maxy)
                if poly.contains(Point(x0, y0)):
                    break
            w = rng.uniform(140, 360); h = rng.uniform(420, 1200) * (1 if rng.random() < .7 else .55)
            lean = rng.uniform(-.18, .18) * h
            if rng.random() < .65:   # hanging blade: wide top, point below
                shard = Polygon([(x0, y0), (x0 + w, y0 + h * rng.uniform(.0, .15)), (x0 + w * rng.uniform(.35, .65) + lean, y0 + h)]).buffer(0)
            else:                    # standing blade: point above
                shard = Polygon([(x0 + w * rng.uniform(.3, .7) + lean, y0), (x0 + w, y0 + h), (x0, y0 + h * rng.uniform(.85, 1.0))]).buffer(0)
            r = rng.random()
            (lit if (x0 > cx and r < .45) or r < .15 else deep if r > .8 else mid).append(shard)
        if mid:
            self.clip('BODY', poly, unary_union(mid), ROCK_MIDL)
        # Edge-facing planes: bands cut inward from each outline segment, with
        # varied depth so their inner edges read as fractured facets.
        ring = list(poly.exterior.coords)
        area2 = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:]))
        lights, darks = [], []
        coarse = list(poly.simplify(12).exterior.coords)
        for (x0, y0), (x1, y1) in zip(coarse, coarse[1:]):
            dx, dy = x1 - x0, y1 - y0
            L = math.hypot(dx, dy)
            if L < 20:
                continue
            nx, ny = dy / L, -dx / L
            mx, my = (x0 + x1) / 2, (y0 + y1) / 2
            if poly.contains(Point(mx + nx * 4, my + ny * 4)):  # make the normal point outward
                nx, ny = -nx, -ny
            dot = nx * LIGHT_DIR[0] + ny * LIGHT_DIR[1]
            if ny > 0.45:      # underside of a lip / cave ceiling
                d0, d1, bucket = rng.uniform(90, 170), rng.uniform(90, 170), darks
            elif dot > 0.25:   # faces the dawn sea
                d0, d1, bucket = rng.uniform(50, 120), rng.uniform(50, 120), lights
            elif nx < -0.45:   # shadowed west faces
                d0, d1, bucket = rng.uniform(40, 100), rng.uniform(40, 100), darks
            else:
                continue
            q = Polygon([(x0, y0), (x1, y1), (x1 - nx * d1, y1 - ny * d1), (x0 - nx * d0, y0 - ny * d0)]).buffer(0)
            bucket.append(q)
        if lights or lit:
            self.clip('BODY', poly, unary_union(lights + lit), ROCK_LIGHT)
        if darks or deep:
            # Shelves cut into a lit face: undersides take the face's shade so the
            # road reads as carved into the wall, not a slab in front of it.
            self.clip('BODY', poly, unary_union(darks + deep), '#1d3358' if s.get('carved') else ROCK_DARK)

    def rock_mass(self, layer, g, seed=0, cell=430, rim=True,
                  tones=('#101d3b', '#1b305b', '#2a4777', '#3d6194', '#5980b3'), walk=None):
        """Concept-style crag rock: angular planes (Voronoi chunks, each split
        into a lit and a shaded facet), brighter toward the top of the mass,
        darkest on the underside; a dark rim reads the silhouette. No grout
        lines, so it does not look like paving or columns. One path per tone."""
        from shapely.ops import voronoi_diagram
        from shapely.geometry import MultiPoint, box
        if g.is_empty or g.area < 3000:
            return
        rng = random.Random(seed * 13 + 3)
        minx, miny, maxx, maxy = g.bounds
        pts, y = [], miny - cell
        while y < maxy + cell:
            x = minx - cell
            while x < maxx + cell:
                pts.append((x + rng.uniform(-.42, .42) * cell, y + rng.uniform(-.42, .42) * cell * 1.25))
                x += cell
            y += cell * 1.25
        cells = voronoi_diagram(MultiPoint(pts), envelope=box(minx - 3 * cell, miny - 3 * cell, maxx + 3 * cell, maxy + 3 * cell))
        groups = {}
        G = lambda i, yy: groups.setdefault(self.hz(tones[max(0, min(len(tones) - 1, i))], yy), [])
        for c in cells.geoms:
            c2 = c.intersection(g)
            if c2.is_empty or c2.area < 400:
                continue
            cx, cy = c.centroid.x, c.centroid.y
            # local depth below the top surface of the mass at this x
            col = g.intersection(LineString([(cx, miny - 10), (cx, maxy + 10)]))
            top = col.bounds[1] if not col.is_empty else miny
            if walk and walk[0][0] <= cx <= walk[-1][0]:
                top = interp(walk, cx)        # depth from the real walk line, not an art extension
            bot = col.bounds[3] if not col.is_empty else maxy
            f = (cy - top) / max(1, bot - top)
            base = 3 - int(f * 3.2 + rng.random() * .9)          # 3 near top .. 0 underside
            dep = cy - top                                         # deep ground recedes into shadow
            deep = dep > 650
            if dep > 1300:
                base = 0
            elif deep:
                base = min(base, 1)
            k = rng.uniform(-.5, .9)
            d = cell * 2
            lit = Polygon([(cx - d, cy - d), (cx + d, cy - d - k * d), (cx + d, cy + rng.uniform(-.3, .2) * cell - k * d * .2), (cx - d, cy + rng.uniform(.0, .4) * cell)]).buffer(0)
            G(base + (0 if deep and base == 0 and dep > 1300 else 1), cy).append(c2.intersection(lit))
            G(base, cy).append(c2.difference(lit))
        if rim:
            self.add(layer, shapely_d(g), self.hz('#0f1c36', (miny + maxy) / 2))
            inner = g.buffer(-10)
        else:
            inner = g
        for t, gs in groups.items():
            u = unary_union([q for q in gs if not q.is_empty]).intersection(inner)
            if not u.is_empty:
                self.add(layer, shapely_d(u, simplify=2.5), t)

    def hang_body(self, sid, depth, seed=0, to=None, arch=None, layer='STRUCT'):
        """Visual rock body under a terrace (behind actors, no collision): jagged
        underside with downward crags, tapering sides; `to` = solid id the body
        is rooted on (it reaches down to that surface); `arch` = (x0, x1, y_floor,
        h) opening left dark for a path passing under it."""
        rng = random.Random(seed * 17 + 5)
        s = self.solids[sid]
        W_ = s['walk']
        x0, x1 = W_[0][0], W_[-1][0]
        root = self.solids[to]['walk'] if to else None
        n = max(6, int((x1 - x0) / 170))
        bottom = []
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n
            e = min(i, n - i) / (n / 2)              # 0 at the ends, 1 mid
            if root and root[0][0] <= x <= root[-1][0]:
                yb = interp(root, x) + 6
            else:
                dd = depth * (0.25 + 0.75 * e ** .6) * rng.uniform(.75, 1.05)
                if rng.random() < .25 and 0 < i < n:
                    dd *= rng.uniform(1.15, 1.45)     # a crag hanging lower
                yb = interp(W_, x) + dd
            bottom.append((x + rng.uniform(-30, 30) * (0 < i < n), yb))
        # flared, broken sides: the mass widens toward its root
        def side(xe, ye, yb, out):
            pts = []
            for t in (0.2, 0.45, 0.7, 1.0):
                pts.append((xe + out * (t ** 1.3) * rng.uniform(.6, 1.2) + rng.uniform(-40, 40) * (t < 1), ye + (yb - ye) * t))
            return pts
        fl, fr = rng.uniform(80, 260), rng.uniform(80, 260)
        if root:
            fl = min(fl, max(0, x0 - root[0][0])); fr = min(fr, max(0, root[-1][0] - x1))
            ybl, ybr = interp(root, max(root[0][0], x0 - fl)) + 6, interp(root, min(root[-1][0], x1 + fr)) + 6
        else:
            ybl, ybr = bottom[0][1], bottom[-1][1]
        right = side(x1, W_[-1][1] + 10, ybr, fr)
        left = list(reversed(side(x0, W_[0][1] + 10, ybl, -fl)))
        body = Polygon([(x, y + 10) for x, y in W_] + right + list(reversed(bottom))[1:-1] + left).buffer(0)
        if arch:
            ax0, ax1, fl, ah = arch
            pts = [(ax0, fl + 10)] + [(ax0 + (ax1 - ax0) * (0.5 - 0.5 * math.cos(math.pi * t / 12)), fl - ah * math.sin(math.pi * t / 12) ** .7) for t in range(13)] + [(ax1, fl + 10)]
            hole = Polygon(pts).buffer(0)
            self.rock_mass(layer, body.difference(hole), seed)
            self.add(layer, shapely_d(hole.intersection(body.buffer(60))), self.hz('#0b1529', fl))
            return
        self.rock_mass(layer, body, seed)

    def buttress(self, did, depth=None, seed=0):
        """Masonry under a stone flight (behind actors): down to the surface
        below, or a stringer of `depth` with a ragged underside."""
        d = self.decks[did]
        d['buttress'] = True
        top = d['top']
        x0, x1 = top[0][0], top[-1][0]
        rng = random.Random(seed)
        xs = [x0 + (x1 - x0) * i / 16 for i in range(17)]
        bot = []
        for x in reversed(xs):
            y = interp(top, x)
            g = self.ground_below(x, y + 20)
            yb = g + 4 if g is not None and (depth is None or g - y < depth) else y + (depth or 300) * rng.uniform(.75, 1.1)
            bot.append((x, yb))
        g = Polygon([(x, interp(top, x) + 20) for x in xs] + bot).buffer(0)
        stringer = Polygon([(x, interp(top, x) + 20) for x in xs] + [(x, interp(top, x) + 150) for x in reversed(xs)]).buffer(0).intersection(g)
        self.rock_mass('STRUCT', g.difference(stringer), seed, cell=330)
        self._masonry_into('STRUCT', stringer, seed, y_ref=sum(y for _, y in top) / len(top), scale=.55,
                           tones=('#4a6273', '#5a7383', '#6c8592'), mortar='#1d2f40')

    def boulders(self, layer, pts, seed=0):
        """Loose rocks (art only): (x, y_ground, w, h) each; crag shaded, weed foot."""
        rng = random.Random(seed)
        gs = []
        for x, y, w, h in pts:
            k = [rng.uniform(.8, 1.15) for _ in range(6)]
            gs.append(Polygon([(x - w / 2, y + 10), (x - w * .45 * k[0], y - h * .55 * k[1]), (x - w * .15, y - h * k[2]), (x + w * .25, y - h * .9 * k[3]),
                               (x + w * .48 * k[4], y - h * .4 * k[5]), (x + w / 2, y + 10)]).buffer(0))
        g = unary_union(gs)
        self.rock_mass(layer, g, seed, cell=max(60, min(w for _, _, w, _ in pts) * .7))
        foot = g.intersection(unary_union([Polygon([(x - w, y - h * .25), (x + w, y - h * .25), (x + w, y + 20), (x - w, y + 20)]) for x, y, w, h in pts]))
        if not foot.is_empty:
            self.add(layer, shapely_d(foot), '#4d5a35')

    def sea_arches(self, sid, floor, openings, seed=0, tide=None):
        """Natural sea arches under a high road (behind actors): rock legs from
        the road's underside down to `floor`, arch openings left open to the
        sky; barnacle and weed bands at the tide line."""
        s = self.solids[sid]
        W_ = s['walk']
        x0, x1 = W_[0][0], W_[-1][0]
        F = self.solids[floor]['walk']
        xs = [x0 + (x1 - x0) * i / 40 for i in range(41)]
        def fy(x):
            return interp(F, min(max(x, F[0][0]), F[-1][0])) + 8
        body = Polygon([(x, interp(W_, x) + 10) for x in xs] + [(x, fy(x)) for x in reversed(xs)]).buffer(0)
        holes = []
        rng = random.Random(seed)
        for a, b, crown in openings:   # crown = y of the arch top
            pts = []
            for i in range(17):
                t = i / 16
                x = a + (b - a) * t
                yy = fy(x) - (fy(x) - crown) * math.sqrt(max(0.0, 1 - (2 * t - 1) ** 2)) ** .8 + rng.uniform(-14, 14) * (0 < i < 16)
                pts.append((x, yy))
            holes.append(Polygon(pts + [(b, fy(b) + 40), (a, fy(a) + 40)]).buffer(0))
        legs = body.difference(unary_union(holes))
        self.rock_mass('STRUCT', legs, seed, cell=300)
        if tide:
            lo, hi = tide
            band = legs.intersection(Polygon([(x0 - 50, hi - 160), (x1 + 50, hi - 160), (x1 + 50, lo + 60), (x0 - 50, lo + 60)]))
            weed, bar = [], []
            for g in getattr(band, 'geoms', [band]):
                if g.is_empty or g.geom_type != 'Polygon':
                    continue
                bx0, by0, bx1, by1 = g.bounds
                x = bx0
                while x < bx1:
                    ln = rng.uniform(40, 150)
                    weed.append(Polygon([(x, hi - 10), (x + 22, hi - 10), (x + 14, hi + ln), (x + 4, hi + ln * .8)]))
                    bar.append(Point(x + rng.uniform(0, 30), hi - rng.uniform(20, 140)).buffer(rng.uniform(5, 11), 3))
                    x += rng.uniform(24, 60)
            for gs, col in ((weed, '#5d6a3a'), (bar, '#c9cfc8')):
                u = unary_union(gs).intersection(legs)
                if not u.is_empty:
                    self.add('STRUCT', shapely_d(u), self.hz(col, hi))

    def hanok(self, x, y, w=420, wall=190, roof=150, porch=True, lit=(1, 2), seed=0, layer='STRUCT'):
        """Korean house (behind actors): stone plinth, timber posts and beams,
        lime-plaster walls with lattice windows (warm light), and a dark tile
        roof with upturned eave tips and a pale ridge. Foot centre at (x, y)."""
        rng = random.Random(seed)
        L, R = x - w / 2, x + w / 2
        pl = 34                                   # plinth (기단)
        self.add(layer, poly_d([(L - 30, y + 4), (L - 26, y - pl), (R + 26, y - pl), (R + 30, y + 4)]), '#3c4b5c')
        self.add(layer, poly_d([(L - 26, y - pl), (R + 26, y - pl), (R + 24, y - pl + 8), (L - 24, y - pl + 8)]), '#6a7a88')
        yb, yt = y - pl, y - pl - wall
        self.add(layer, poly_d([(L, yb), (L, yt), (R, yt), (R, yb)]), '#b9c2c6')          # plaster
        self.add(layer, poly_d([(L, yb), (L, yb - wall * .28), (R, yb - wall * .28), (R, yb)]), '#7d8a91')  # lower wall
        n = 3 if w > 300 else 2
        posts = [L + (R - L) * i / n for i in range(n + 1)]
        dark = []
        for px in posts:
            dark.append(Polygon([(px - 9, yb), (px - 9, yt), (px + 9, yt), (px + 9, yb)]))
        dark.append(Polygon([(L - 6, yt), (R + 6, yt), (R + 6, yt + 16), (L - 6, yt + 16)]))      # head beam
        dark.append(Polygon([(L, yb - wall * .28 - 6), (R, yb - wall * .28 - 6), (R, yb - wall * .28 + 2), (L, yb - wall * .28 + 2)]))
        warm, lattice = [], []
        for i in range(n):
            a, b = posts[i] + 22, posts[i + 1] - 22
            top, bot = yt + 34, yb - wall * .28 - 16
            if i in lit:
                warm.append(Polygon([(a, top), (b, top), (b, bot), (a, bot)]))
            else:
                dark.append(Polygon([(a, top), (b, top), (b, bot), (a, bot)]).difference(Polygon([(a + 8, top + 8), (b - 8, top + 8), (b - 8, bot - 8), (a + 8, bot - 8)])))
            k = max(2, int((b - a) / 26))
            for j in range(1, k):
                xx = a + (b - a) * j / k
                lattice.append(Polygon([(xx - 2, top), (xx + 2, top), (xx + 2, bot), (xx - 2, bot)]))
            for yy in (top + (bot - top) / 3, top + 2 * (bot - top) / 3):
                lattice.append(Polygon([(a, yy - 2), (b, yy - 2), (b, yy + 2), (a, yy + 2)]))
        if warm:
            self.add(layer, shapely_d(unary_union(warm)), '#e2b977')
            self.add(layer, shapely_d(unary_union(lattice).intersection(unary_union(warm))), '#7a5a3a')
        self.add(layer, shapely_d(unary_union(dark)), '#3a3536')
        if porch:   # maru: low timber floor in front
            self.add(layer, poly_d([(L - 10, yb + 2), (R + 10, yb + 2), (R + 10, yb - 14), (L - 10, yb - 14)]), '#6b5d4d')
        # roof: near-straight eave line lifting at both tips (처마), concave slopes up to a straight ridge
        ov, lift = w * .2, roof * .34
        ridge_y = yt - roof
        eave, n_ = [], 14
        for i in range(n_ + 1):
            t = i / n_
            ex = L - ov + (R - L + 2 * ov) * t
            eave.append((ex, yt + 4 - lift * abs(2 * t - 1) ** 3.2))
        def slope(x0, y0, x1, y1, bulge):
            return [(x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6 + bulge * math.sin(math.pi * k / 6)) for k in range(7)]
        right = slope(R + ov, yt + 4 - lift, R - w * .1, ridge_y, roof * .16)[1:]
        left = slope(L + w * .1, ridge_y, L - ov, yt + 4 - lift, roof * .16)[:-1]
        g = Polygon(eave + right + left).buffer(0)
        self.add(layer, shapely_d(g), '#253247')
        self.add(layer, poly_d([(L, yt + 4), (R, yt + 4), (R, yt + 24), (L, yt + 24)]), '#2a2a30')   # eave shadow on the wall
        cols = []
        k = int((R - L + 2 * ov) / 24)
        for j in range(k):
            xx = L - ov + 12 + j * 24
            cols.append(Polygon([(xx - 4, ridge_y), (xx + 4, ridge_y), (xx + 4, yt + 10), (xx - 4, yt + 10)]))
        self.add(layer, shapely_d(unary_union(cols).intersection(g.buffer(-6))), '#34445e')
        self.add(layer, shapely_d(Polygon(eave + [(e[0], e[1] - 10) for e in reversed(eave)]).buffer(0)), '#3f5272')
        self.add(layer, poly_d([(L + w * .1 - 14, ridge_y - 14), (R - w * .1 + 14, ridge_y - 14), (R - w * .1 + 6, ridge_y + 6), (L + w * .1 - 6, ridge_y + 6)]), '#b8c3c9')
        for sx in (-1, 1):   # ridge-end ornaments
            ex = x + sx * (w / 2 - w * .1 + 10)
            self.add(layer, poly_d([(ex - 10 * sx, ridge_y - 14), (ex + 18 * sx, ridge_y - 34), (ex + 22 * sx, ridge_y - 8), (ex, ridge_y + 6)]), '#b8c3c9')

    def moss_drape(self, s):
        """Moss hanging over ledge lips and down rock faces (concept: green
        tongues and a few vines), only where the face below is rock."""
        rng = random.Random(len(s['id']) * 31 + 7)
        top, poly = s['walk'], s['poly']
        tongues, dark, vines = [], [], []
        x = top[0][0] + rng.uniform(10, 80)
        while x < top[-1][0] - 20:
            y = interp(top, x)
            w = rng.uniform(70, 200)
            ln = rng.uniform(60, 260) if rng.random() < .6 else rng.uniform(25, 70)
            pts = [(x - w / 2, y + 6), (x - w * .3, y + ln * .6), (x - w * .1, y + ln * rng.uniform(.75, 1)), (x + w * .12, y + ln * .55),
                   (x + w * .3, y + ln * rng.uniform(.6, .95)), (x + w / 2, y + 6)]
            t = Polygon(pts).buffer(0)
            tongues.append(t)
            dark.append(t.difference(Polygon([(x - w, y - 50), (x + w, y - 50), (x + w, y + ln * .45), (x - w, y + ln * .45)])))
            if rng.random() < .3:
                vl = rng.uniform(140, 380); vx = x + rng.uniform(-w / 3, w / 3)
                vines.append(LineString([(vx, y + 10), (vx + rng.uniform(-14, 14), y + vl * .5), (vx + rng.uniform(-20, 20), y + vl)]).buffer(3.5))
            x += rng.uniform(60, 190)
        face = poly.buffer(-2)
        for geoms, col in ((tongues, SAGE_SHADOW), (dark, '#55684a'), (vines, '#3f5a44')):
            g = unary_union(geoms).intersection(face)
            if not g.is_empty:
                self.add('BODY', shapely_d(g), col)

    def carved_steps(self, s, a, b):
        """Stone stair carved into a ramp: pale treads and dark risers."""
        top, poly = s['walk'], s['poly']
        xs = [a + (b - a) * i / 20 for i in range(21)]
        band = Polygon([(x, interp(top, x) - 2) for x in xs] + [(x, interp(top, x) + 60) for x in reversed(xs)]).buffer(0).intersection(poly.buffer(1))
        self.add('BODY', shapely_d(band), '#56707a')
        treads, risers = [], []
        x = a
        while x < b - 10:
            y0 = interp(top, x)
            xn = x + 46
            while xn < b and y0 - interp(top, min(xn, b)) < 34:
                xn += 6
            xn = min(xn, b)
            y1 = interp(top, xn)
            treads.append(Polygon([(x, y0 - 1), (xn, y1 - 1), (xn, y1 + 9), (x, y0 + 9)]))
            risers.append(Polygon([(xn - 6, y1), (xn, y1), (xn, y1 + 54), (xn - 6, y1 + 54)]))
            x = xn
        self.add('BODY', shapely_d(unary_union(treads).intersection(band)), '#8fa3a2')
        self.add('BODY', shapely_d(unary_union(risers).intersection(band)), '#2c434c')

    def surface_band(self, s):
        top, poly = s['walk'], s['poly'].buffer(2)
        if len(top) < 2:
            return
        lo, hi = s['band']
        th = lambda x: lo + (hi - lo) * (0.5 + 0.5 * math.sin(x / 140 + len(s['id'])))
        def band(fn):
            return [(x, y - 3) for x, y in top] + [(x, y + fn(x)) for x, y in reversed(top)]
        if s.get('sand'):   # wet tidal flat: grey sand, darker wet edge, pale puddles
            self.clip('BODY', poly, band(lambda x: th(x) + 40), '#55605f')
            self.clip('BODY', poly, band(lambda x: th(x) + 26), '#77786c')
            self.clip('BODY', poly, band(lambda x: 8 + 5 * math.sin(x / 61)), '#9a9583')
            rng = random.Random(len(s['id']) + 3)
            pud = []
            x = top[0][0] + 40
            while x < top[-1][0] - 120:
                w = rng.uniform(80, 260); y = interp(top, x)
                if rng.random() < .5:
                    pud.append(Polygon([(x, y + 12), (x + w, interp(top, x + w) + 12), (x + w - 20, interp(top, x + w) + 18), (x + 15, y + 18)]).buffer(0))
                x += w + rng.uniform(60, 200)
            g = unary_union(pud).intersection(poly)
            if not g.is_empty:
                self.add('BODY', shapely_d(g), '#a9c0c6')
            return
        if s.get('path'):   # old stone road across a clearing: pale path, grass verge, moss lip
            self.clip('BODY', poly, band(lambda x: th(x) + 34), '#5d6f5a')
            self.clip('BODY', poly, band(lambda x: th(x) + 24), '#a9a58e')
            self.clip('BODY', poly, band(lambda x: 9 + 6 * math.sin(x / 47) + 4 * math.sin(x / 13)), SAGE)
            rng = random.Random(len(s['id']))
            slabs = []
            x = top[0][0] + 20
            while x < top[-1][0] - 60:
                w = rng.uniform(60, 130); y = interp(top, x)
                slabs.append(Polygon([(x, y + 16), (x + w - 8, interp(top, x + w) + 16), (x + w - 8, interp(top, x + w) + 22 + th(x)), (x, y + 22 + th(x))]))
                x += w
            g = unary_union([q for i, q in enumerate(slabs) if i % 3]).intersection(poly)
            if not g.is_empty:
                self.add('BODY', shapely_d(g), '#bdb8a0')
            return
        if s['kind'] == 'terrace':   # worn hauling road: pale packed-earth path
            self.clip('BODY', poly, band(lambda x: th(x) + 30), '#6f6a5c')
            self.clip('BODY', poly, band(lambda x: th(x) + 22), '#b3a98c')
            self.clip('BODY', poly, band(lambda x: 7 + 5 * math.sin(x / 57)), SAGE)
            return
        if s['kind'] == 'rock' and s.get('moss') is False:   # bare tidal rock: pale wet top, weed fringe
            self.clip('BODY', poly, band(lambda x: th(x) * .6 + 8), '#4f6473')
            self.clip('BODY', poly, band(lambda x: 7), '#7f93a0')
            return
        self.clip('BODY', poly, band(lambda x: th(x) + 10), SAGE_SHADOW)
        self.clip('BODY', poly, band(th), SAGE)
        self.clip('BODY', poly, band(lambda x: 5), SAGE_LIP)

    def _masonry(self, poly):
        if poly.is_empty:
            return
        self.add('BODY', shapely_d(poly), '#2a4168')
        minx, miny, maxx, maxy = poly.bounds
        joints, lit = [], []
        y, row = miny + 30, 0
        while y < maxy:
            joints.append(Polygon([(minx, y), (maxx, y), (maxx, y + 5), (minx, y + 5)]))
            x = minx + (row % 2) * 55
            while x < maxx:
                joints.append(Polygon([(x, y - 62), (x + 5, y - 62), (x + 5, y), (x, y)]))
                if (int(x) * 7 + row * 13) % 5 == 0:
                    lit.append(Polygon([(x + 8, y - 58), (x + 100, y - 58), (x + 100, y - 4), (x + 8, y - 4)]))
                x += 110 + (int(x * 13 + row * 7) % 40)
            y += 66
            row += 1
        if lit:
            self.clip('BODY', poly, unary_union(lit), '#35537e')
        self.clip('BODY', poly, unary_union(joints), '#14233f')

    def paint_solids(self):
        # Earth (ground) last: it covers the buried feet of rock standing on it.
        for s in sorted(self.solids.values(), key=lambda s: s['kind'] == 'earth'):
            self.module(s['id'])
            b = s['poly'].bounds
            self._hz_y = None if s['kind'] == 'terrace' else min((b[1] + b[3]) / 2, sum(y for _, y in s['walk']) / len(s['walk']) + 300)
            if s['kind'] == 'terrace':   # road shelf = top of its retaining wall: all coursed stone
                s['band'] = (10, 16)
                self._masonry_into('BODY', s['poly'], y_ref=sum(y for _, y in s['walk']) / len(s['walk']))
            elif s['kind'] == 'masonry':   # dressed retaining wall (옹벽): coursed blocks
                poly = s['poly']
                self.add('BODY', shapely_d(poly), '#2a4168')
                minx, miny, maxx, maxy = poly.bounds
                joints, lit = [], []
                y, row = miny + 30, 0
                while y < maxy:
                    joints.append(Polygon([(minx, y), (maxx, y), (maxx, y + 5), (minx, y + 5)]))
                    x = minx + (row % 2) * 55
                    while x < maxx:
                        joints.append(Polygon([(x, y - 62), (x + 5, y - 62), (x + 5, y), (x, y)]))
                        if (int(x) * 7 + row * 13) % 5 == 0:
                            lit.append(Polygon([(x + 8, y - 58), (x + 100, y - 58), (x + 100, y - 4), (x + 8, y - 4)]))
                        x += 110 + (int(x * 13 + row * 7) % 40)
                    y += 66
                    row += 1
                self.clip('BODY', poly, unary_union(lit), '#35537e')
                self.clip('BODY', poly, unary_union(joints), '#14233f')
            elif s['kind'] == 'earth':
                poly = s['poly']
                self.add('BODY', shapely_d(poly), MUD)
                minx, miny, maxx, maxy = poly.bounds
                for y0, col in [(miny + 380, MUD_DARK), (miny + 650, ROCK_DARK)]:
                    strip = [(x, y0 + 30 * math.sin(x / 410) + 18 * math.sin(x / 133)) for x in range(int(minx), int(maxx) + 81, 80)]
                    self.clip('BODY', poly, strip + [(maxx + 80, maxy + 100), (minx, maxy + 100)], col)
            elif self.crag:
                s['band'] = (24, 48)
                self._hz_y = None
                self.rock_mass('BODY', s['poly'], len(s['id']) * 7, cell=360, rim=not s.get('carved'), walk=s['walk'])
                for x0, x1, depth, tones, mortar in s.get('mason', ()):   # dressed embankment (석축) under the walk
                    xs = [x0 + (x1 - x0) * i / 30 for i in range(31)]
                    W_ = s['walk']
                    xs = [x for x in xs if W_[0][0] <= x <= W_[-1][0]]
                    if len(xs) > 2:
                        band = Polygon([(x, interp(W_, x) + 20) for x in xs] + [(x, interp(W_, x) + depth) for x in reversed(xs)]).buffer(0).intersection(s['poly'])
                        self._masonry_into('BODY', band, y_ref=interp(W_, xs[0]), scale=.75, tones=tones, mortar=mortar)
            else:
                self.shade_rock(s)
            self._hz_y = sum(y for _, y in s['walk']) / len(s['walk'])
            if s['kind'] == 'rock' and s.get('moss', True):
                self.moss_drape(s)
            self.surface_band(s)
            for a, b in s.get('steps', ()):
                self.carved_steps(s, a, b)
            self._hz_y = None

    # ------------------------------------------------------------ timber
    stone_posts = False

    def post(self, x, y_top, y_bot, w=22, footing=True):
        dark, lit = (ROCK_MID, ROCK_MIDL) if self.stone_posts else (WOOD_DARK, WOOD)
        if self.stone_posts:
            w = 48
        self.add('STRUCT', poly_d([(x - w / 2, y_top), (x + w / 2, y_top), (x + w / 2, y_bot), (x - w / 2, y_bot)]), dark)
        self.add('STRUCT', poly_d([(x + w / 2 - 9, y_top), (x + w / 2, y_top), (x + w / 2, y_bot), (x + w / 2 - 9, y_bot)]), lit)
        if footing:
            self.add('STRUCT', poly_d([(x - 30, y_bot + 6), (x - 22, y_bot - 12), (x + 6, y_bot - 18), (x + 28, y_bot - 8), (x + 32, y_bot + 6)]), STONE)

    def beam(self, x0, y0, x1, y1, t=16, col=WOOD_DARK, layer='STRUCT'):
        a = math.atan2(y1 - y0, x1 - x0)
        nx, ny = -math.sin(a) * t / 2, math.cos(a) * t / 2
        self.add(layer, poly_d([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny), (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)]), col)

    def socket(self, x, y, layer='SURFACE'):
        self.add(layer, poly_d([(x - 14, y - 10), (x + 14, y - 10), (x + 14, y + 30), (x - 14, y + 30)]), ROCK_DARK)

    def support_deck(self, d):
        """Derive real supports: ends let into rock, posts to the surface below,
        or braces to a nearby rock face. Unsupported spans are build errors."""
        top = d['top']
        x0, x1 = top[0][0], top[-1][0]
        n = max(2, int(math.ceil((x1 - x0) / 300)) + 1)
        xs = [x0 + 30 + (x1 - x0 - 60) * i / (n - 1) for i in range(n)]
        posts = []
        for x in xs:
            y = interp(top, x)
            if self.in_solid(x + (12 if x > (x0 + x1) / 2 else -12), y + 12, pad=6):
                self.socket(x, y)
                continue
            g = self.ground_below(x, y + 20)
            if g is not None and g - y <= (2200 if d['kind'] == 'stonestair' else 1800):
                self.post(x, y + 26, g, w=24 if g - y > 600 else 20)
                posts.append((x, y, g))
                continue
            # hang from a rock ceiling directly above (timber hanger + rope)
            above = None
            for hx in (x, x + 70, x - 70, x + 140, x - 140):
                line = LineString([(hx, y - 30), (hx, y - 650)])
                for so in self.solids.values():
                    hit = so['poly'].intersection(line)
                    if not hit.is_empty:
                        yy = hit.bounds[3]
                        if above is None or yy > above:
                            above, x = yy, hx
                if above is not None:
                    y = interp(top, x)
                    break
            if above is not None:
                self.beam(x - 10, above, x - 10, y + 30, t=10, col=WOOD_DARK)
                self.beam(x + 10, above, x + 10, y + 30, t=6, col=ROPE)
                self.socket(x, above - 6, layer='STRUCT')
                continue
            # brace to the nearest rock face within reach
            best = None
            for s in self.solids.values():
                g = max(getattr(s['poly'], 'geoms', [s['poly']]), key=lambda q: q.area)
                p = g.exterior.interpolate(g.exterior.project(Point(x, y + 200)))
                dist = math.dist((p.x, p.y), (x, y))
                if p.y > y and dist < 520 and (best is None or dist < best[0]):
                    best = (dist, p.x, p.y)
            if best:
                self.beam(x, y + 30, best[1], best[2], t=18)
                self.socket(best[1], best[2] - 10, layer='STRUCT')
            else:
                self.errors.append('unsupported deck %s at x=%d' % (d['id'], x))
        for (xa, ya, ga), (xb, yb, gb) in zip(posts, posts[1:]):
            self.beam(xa, ya + 34, xb, yb + 34, t=16)
            top_y, bot_y = max(ya, yb) + 60, min(ga, gb) - 40
            if bot_y - top_y > 260 and xb - xa < 420:
                self.beam(xa, top_y, xb, bot_y, t=12)
                self.beam(xa, bot_y, xb, top_y, t=12)

    def paint_decks(self):
        for d in self.decks.values():
            self.module(d['id'])
            self._hz_y = sum(y for _, y in d['top']) / len(d['top'])
            top, t = d['top'], 26
            if d['kind'] == 'log':   # fallen bamboo: rests on its two ends only
                for ex, ey in (top[0], top[-1]):
                    g = self.ground_below(ex, ey - 30)
                    if not (self.in_solid(ex, ey + 14, pad=4) or (g is not None and abs(g - ey) < 40)):
                        self.errors.append('log %s end unsupported at x=%d' % (d['id'], ex))
                a, b = top[0], top[-1]
                L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L; nx, ny = -uy, ux
                def strip(o0, o1, col, s0=-30, s1=30):
                    q = [(a[0] - ux * -s0 + nx * o0, a[1] - uy * -s0 + ny * o0), (b[0] + ux * s1 + nx * o0, b[1] + uy * s1 + ny * o0),
                         (b[0] + ux * s1 + nx * o1, b[1] + uy * s1 + ny * o1), (a[0] - ux * -s0 + nx * o1, a[1] - uy * -s0 + ny * o1)]
                    self.add('SURFACE', poly_d(q), col)
                strip(-4, 46, '#4f6a55'); strip(-4, 14, '#9fb08a'); strip(30, 46, '#33483e')
                for i in range(1, int(L // 170) + 1):   # nodes of the culm
                    c = (a[0] + ux * i * 170, a[1] + uy * i * 170)
                    self.add('SURFACE', poly_d([(c[0] - ux * 5 + nx * -4, c[1] - uy * 5 + ny * -4), (c[0] + ux * 5 + nx * -4, c[1] + uy * 5 + ny * -4),
                                                (c[0] + ux * 5 + nx * 46, c[1] + uy * 5 + ny * 46), (c[0] - ux * 5 + nx * 46, c[1] - uy * 5 + ny * 46)]), '#33483e')
                continue
            self.stone_posts = d['kind'] in ('stone', 'stonestair')
            self._mute = bool(d.get('buttress'))   # supports proven, drawn as the buttress
            if d['kind'] == 'rope':   # slung between its two anchors only
                for ex, ey in (top[0], top[-1]):
                    g = self.ground_below(ex, ey - 80, include_decks=True)
                    if not (self.in_solid(ex, ey + 14, pad=4) or (g is not None and abs(g - ey) < 40)):
                        self.errors.append('rope %s end unanchored at x=%d' % (d['id'], ex))
            else:
                self.support_deck(d)
            self._mute = False
            self.stone_posts = False
            if d['kind'] == 'stonestair':   # dressed stone flight on stone piers
                t = 96
                self.add('SURFACE', poly_d(list(top) + [(x, y + t) for x, y in reversed(top)]), '#4e6870')
                self.add('SURFACE', poly_d([(x, y + t - 12) for x, y in top] + [(x, y + t) for x, y in reversed(top)]), '#2c434c')
                x = top[0][0]
                tr, ri = [], []
                while x < top[-1][0] - 4:
                    y0 = interp(top, x); xn = x + 40
                    while xn < top[-1][0] and abs(y0 - interp(top, min(xn, top[-1][0]))) < 30:
                        xn += 5
                    xn = min(xn, top[-1][0]); y1 = interp(top, xn)
                    tr.append(Polygon([(x, y0 - 1), (xn, y1 - 1), (xn, y1 + 22), (x, y0 + 22)]))
                    ri.append(Polygon([(xn - 7, y1), (xn, y1), (xn, y1 + 70), (xn - 7, y1 + 70)] if y1 < y0 else [(x, y0), (x + 7, y0), (x + 7, y0 + 70), (x, y0 + 70)]))
                    x = xn
                self.add('SURFACE', shapely_d(unary_union(tr)), '#9aaeab')
                self.add('SURFACE', shapely_d(unary_union(ri)), '#2c434c')
                continue
            if d['kind'] == 'rope':
                x = top[0][0]
                while x < top[-1][0] - 8:
                    xb = min(x + 30, top[-1][0])
                    ya, yb = interp(top, x), interp(top, xb)
                    self.add('SURFACE', poly_d([(x, ya), (xb, yb), (xb, yb + 18), (x, ya + 18)]), WOOD)
                    x += 37
                a, b = top[0], top[-1]
                for k, (x, y) in enumerate([a, b]):
                    self.post(x, y - 110, y + 30, w=18, footing=False)
                pts = [((1 - t_) * a[0] + t_ * b[0], (1 - t_) * (a[1] - 104) + t_ * (b[1] - 104) + 46 * 4 * t_ * (1 - t_)) for t_ in [i / 16 for i in range(17)]]
                self.add('SURFACE', poly_d(pts + [(x, y + 5) for x, y in reversed(pts)]), ROPE)
                for x, y in pts[2:-2:3]:
                    self.add('SURFACE', poly_d([(x - 1.5, y), (x + 1.5, y), (x + 1.5, interp(top, x)), (x - 1.5, interp(top, x))]), ROPE)
                continue
            if d['kind'] == 'stone':  # broken retaining-wall top: dressed blocks
                t = 60
                self.add('SURFACE', poly_d(list(top) + [(x, y + t) for x, y in reversed(top)]), ROCK_MIDL)
                self.add('SURFACE', poly_d(list(top) + [(x, y + 8) for x, y in reversed(top)]), ROCK_LIGHT)
                x = top[0][0] + 90
                while x < top[-1][0] - 40:
                    y = interp(top, x)
                    self.add('SURFACE', poly_d([(x - 2, y + 8), (x + 2, y + 8), (x + 2, y + t), (x - 2, y + t)]), ROCK_DARK)
                    x += 110 + (int(x) * 31 % 30)
                continue
            face = list(top) + [(x, y + t) for x, y in reversed(top)]
            self.add('SURFACE', poly_d(face), WOOD)
            self.add('SURFACE', poly_d(list(top) + [(x, y + 6) for x, y in reversed(top)]), WOOD_LIGHT)
            self.add('SURFACE', poly_d([(x, y + t - 6) for x, y in top] + [(x, y + t) for x, y in reversed(top)]), WOOD_SHADOW)
            if d['kind'] == 'stairs':  # visible treads so the slope reads as steps
                x = top[0][0] + 20
                while x < top[-1][0] - 20:
                    y = interp(top, x)
                    self.add('SURFACE', poly_d([(x - 2, y + 2), (x + 2, y + 2), (x + 2, y + t - 4), (x - 2, y + t - 4)]), WOOD_DARK)
                    x += 34
            else:
                x = top[0][0] + 64
                while x < top[-1][0] - 30:
                    y = interp(top, x)
                    self.add('SURFACE', poly_d([(x - 1.5, y + 6), (x + 1.5, y + 6), (x + 1.5, y + t - 6), (x - 1.5, y + t - 6)]), WOOD_DARK)
                    x += 58 + (int(x) * 7919 % 23)

    # ------------------------------------------------------------ traced decor (hybrid)
    _decor_cache = {}

    def decor(self, name, x, y, h, layer='REAR', flip=False, tint=None, tint_a=0.0):
        """Place a traced reference decor (art/act4-claude/decor/<name>.json):
        foot (bottom centre) at (x, y), scaled to world height h."""
        rec = self._decor_cache.get(name)
        if rec is None:
            rec = self._decor_cache[name] = json.loads((ROOT / 'art/act4-claude/decor' / (name + '.json')).read_text())
        k, w2, hh = h / rec['h'], rec['w'] / 2, rec['h']
        X = (lambda px: x - (px - w2) * k) if flip else (lambda px: x + (px - w2) * k)
        hz_y = getattr(self, '_hz_y', None)
        self._hz_y = y
        for fill, rings in rec['fills']:
            d = ' '.join('M' + ' L'.join('%d %d' % (round(X(px)), round(y + (py - hh) * k)) for px, py in r) + ' Z' for r in rings)
            self.add(layer, d, mix(fill, tint_a) if tint_a else fill)
        self._hz_y = hz_y

    # ------------------------------------------------------------ covers and dressing
    def paint_covers(self):
        self._hz_y = None
        for c in self.covers:
            self.module(c['id'])
            x0, y1, w, h = c['x'], c['y'], c['w'], c['h']
            y0, x1 = y1 - h, x0 + w
            if c['kind'] == 'crate':
                self.add('SURFACE', poly_d([(x0, y0 + 8), (x1, y0), (x1, y1), (x0, y1)]), WOOD)
                self.add('SURFACE', poly_d([(x0, y0 + 8), (x1, y0), (x1, y0 + 8), (x0, y0 + 16)]), WOOD_LIGHT)
                for k in range(1, 4):
                    xk = x0 + k * w / 4
                    self.add('SURFACE', poly_d([(xk - 1.5, y0 + 8), (xk + 1.5, y0 + 8), (xk + 1.5, y1), (xk - 1.5, y1)]), WOOD_DARK)
            elif c['kind'] == 'wall':   # ruined dry-stone wall stub (돌담)
                g = Polygon([(x0, y1 + 4), (x0, y0 + 10), (x0 + w * .3, y0), (x0 + w * .55, y0 + h * .18), (x1, y0 + h * .3), (x1, y1 + 4)])
                self._masonry_into('SURFACE', g, y_ref=y1, scale=.5, tones=('#7f908f', '#93a3a0', '#a7b5b0'), mortar='#4a5d62')
            else:  # boulder
                self.add('BODY', poly_d([(x0 - 4, y1 + 6), (x0 + 2, y0 + h * .4), (x0 + w * .25, y0 + 4), (x0 + w * .6, y0), (x1 + 2, y0 + h * .35), (x1 + 4, y1 + 6)]), ROCK_MIDL)
                self.add('BODY', poly_d([(x0 + w * .6, y0), (x1 + 2, y0 + h * .35), (x1 + 4, y1 + 6), (x0 + w * .55, y1 + 6), (x0 + w * .5, y0 + h * .4)]), ROCK_LIGHT)

    def reeds(self, x, n=7, h=88, lean=0.1, layer='FORE'):
        base = self.ground_below(x, -10)
        if base is None:
            return
        for i in range(n):
            dx = (i - n / 2) * 7
            hh = h * (0.6 + 0.4 * ((i * 37) % 11) / 10)
            bend = lean + ((i * 13) % 5 - 2) * 0.05
            p3 = (x + dx + bend * hh * 0.9, base - hh)
            c = (x + dx + bend * hh * 0.2, base - hh * 0.55)
            self.add(layer, 'M%s %s Q%s %s %s %s Q%s %s %s %s Z' % tuple(f(v) for v in (x + dx - 3, base + 4, c[0] - 1, c[1], *p3, c[0] + 4, c[1], x + dx + 3, base + 4)), REED_DARK if i % 3 == 0 else REED)

    def bamboo(self, x, h=520, n=4, layer='REAR'):
        base = self.ground_below(x, -10)
        if base is None:
            return
        for i in range(n):
            bx = x + (i - n / 2) * 26 + (i * 17 % 9)
            hh = h * (0.7 + 0.3 * ((i * 29) % 7) / 6)
            lean = ((i * 11) % 5 - 2) * 6
            self.add(layer, poly_d([(bx - 7, base + 4), (bx + 7, base + 4), (bx + 5 + lean, base - hh), (bx - 5 + lean, base - hh)]), BAMBOO if i % 2 else BAMBOO_DARK)
            for k in range(1, int(hh // 120)):
                yk = base - k * 120
                self.add(layer, poly_d([(bx - 8 + lean * k * 120 / hh, yk), (bx + 8 + lean * k * 120 / hh, yk), (bx + 8 + lean * k * 120 / hh, yk + 5), (bx - 8 + lean * k * 120 / hh, yk + 5)]), BAMBOO_LIGHT)
            # a few leaf sprays near the top, kept coarse
            tx, ty = bx + lean, base - hh
            for s in (-1, 1):
                self.add(layer, 'M%s %s Q%s %s %s %s Q%s %s %s %s Z' % tuple(f(v) for v in (tx, ty + 20, tx + s * 40, ty - 10, tx + s * 90, ty + 18, tx + s * 40, ty + 10, tx, ty + 30)), BAMBOO_DARK)

    def pine(self, x, h=200, layer='REAR'):
        base = self.ground_below(x, -10)
        if base is None:
            return
        self.add(layer, poly_d([(x - 8, base + 4), (x + 8, base + 4), (x + 4, base - h * .7), (x - 4, base - h * .7)]), WOOD_DARK)
        for k, (wd, yy) in enumerate([(120, .55), (95, .75), (60, .92)]):
            y = base - h * yy
            self.add(layer, poly_d([(x - wd, y + 18), (x - wd * .4, y - 14), (x + wd * .5, y - 18), (x + wd, y + 14), (x, y + 26)]), '#24423f' if k % 2 else '#1d3735')

    def shelf(self, sid, top, thick=300, kind='masonry', role='', amp=0, taper=0.55):
        """Road shelf: walk line + underside parallel to it (irregular depth)."""
        th = list(thick) if isinstance(thick, (list, tuple)) else [thick] * len(top)
        if top[0][0] > top[-1][0]:     # walk lines are authored in either direction
            top, th = list(reversed(top)), list(reversed(th))
        top = [tuple(p) for p in top]
        lower = [(x, y + t) for (x, y), t in zip(reversed(top), reversed(th))]
        lower[0] = (lower[0][0], top[-1][1] + th[-1] * taper, 'c')
        lower[-1] = (lower[-1][0], top[0][1] + th[0] * taper, 'c')
        self.solid(sid, top, lower, kind=kind, role=role, amp=amp)
        self.solids[sid]['carved'] = True

    def stair_tower(self, prefix, x0, x1, y_bottom, y_top, start='west', end=None, role='switchback stair tower', kind='stairs', pitch=0.5):
        """Zigzag timber flights between x0..x1 rising y_bottom -> y_top; `end`
        forces the side where the last flight arrives (next road starts there)."""
        width = x1 - x0
        k = max(1, math.ceil((y_bottom - y_top) / (pitch * width)))
        if end and ((k % 2 == 1) != (start != end)):
            k += 1
        r = (y_bottom - y_top) / k
        ids, side = [], start
        for i in range(k):
            yb, yt = y_bottom - i * r, y_bottom - (i + 1) * r
            pts = [(x0, yb), (x1, yt)] if side == 'west' else [(x1, yb), (x0, yt)]
            pts.sort()
            fid = '%s%s' % (prefix, 'abcdefghij'[i])
            self.deck(fid, pts, kind=kind, role=role)
            ids.append(fid)
            side = 'east' if side == 'west' else 'west'
        return ids

    def retaining(self, *a, **k):
        if getattr(self, '_grp', None):
            return self._retaining(*a, **k)
        self._seq = getattr(self, '_seq', 0) + 1
        self._grp = 'd%02d' % self._seq
        try:
            return self._retaining(*a, **k)
        finally:
            self._grp = None

    def _retaining(self, upper, lower, seed=0, masonry=True):
        """Depth fill (behind actors, no collision): the upper road recedes on a
        coursed retaining wall of uneven height, founded on faceted bedrock that
        runs down to the lower road, so switchbacks read as stacked terraces."""
        U, Lw = self.solids[upper]['walk'], (self.solids.get(lower) or self.decks[lower])
        Lw = Lw.get('walk') or Lw['top']
        x0, x1 = max(U[0][0], Lw[0][0]), min(U[-1][0], Lw[-1][0])
        if x1 - x0 < 60:
            return
        rng = random.Random(seed)
        xs = [x0 + (x1 - x0) * i / 24 for i in range(25)]
        wall = Polygon([(x, interp(U, x) + 20) for x in xs] + [(x, interp(Lw, x) + 4) for x in reversed(xs)]).buffer(0)
        # wall band: stepped heights (each stretch built at its own depth)
        top, x = [], x0
        while x < x1:
            w, h = rng.uniform(380, 900), rng.uniform(200, 460)
            # never shallower than the road shelf's own belly (hides its underside)
            sp = self.solids[upper]['poly']
            for q in (x, x + w / 2, min(x + w, x1)):
                cut = sp.intersection(LineString([(q, -1e5), (q, 1e5)]))
                if not cut.is_empty:
                    h = max(h, cut.bounds[3] - interp(U, min(max(q, U[0][0]), U[-1][0])) + 50)
            top += [(x, interp(U, min(x, x1)) + h), (min(x + w, x1), interp(U, min(x + w, x1)) + h)]
            x += w
        band = Polygon([(x, interp(U, x)) for x in xs] + list(reversed(top))).buffer(0).intersection(wall)
        if not masonry:   # natural terrace: bedrock all the way down
            band = Polygon()
        rock = wall.difference(band)
        yr = sum(y for _, y in U) / len(U)
        self.facet_rock('STRUCT', rock, seed, cell=300 * (1 - .4 * self.recede(yr)), grass=True)
        if not band.is_empty:
            self._masonry_into('STRUCT', band, seed, y_ref=yr)
        if self.solids[upper]['kind'] == 'terrace' and not self.solids[upper].get('_rail'):
            self.solids[upper]['_rail'] = True
            posts, rails = [], []
            xa, xb = U[0][0] + 60, U[-1][0] - 60
            px = [xa + i * 260 for i in range(int((xb - xa) // 260) + 1)]
            for q in px:
                yq = interp(U, q) + 4
                posts.append(Polygon([(q - 8, yq), (q + 8, yq), (q + 8, yq - 74), (q - 8, yq - 74)]))
            for q0, q1 in zip(px, px[1:]):
                if rng.random() < .8:   # some rails are gone
                    y0, y1 = interp(U, q0) - 58, interp(U, q1) - 58
                    rails.append(Polygon([(q0, y0), (q1, y1), (q1, y1 + 9), (q0, y0 + 9)]))
            # shrubs grown out of the wall top along the road edge
            dark_s, lit_s = [], []
            q = xa + rng.uniform(100, 400)
            while q < xb:
                yq, r0 = interp(U, q) + 6, rng.uniform(40, 75)
                blob = unary_union([Point(q + dx * r0, yq - dy * r0).buffer(r0 * sc, 6) for dx, dy, sc in ((-.8, .2, .7), (0, .55, .9), (.8, .25, .75))]).intersection(Polygon([(q - 300, yq - 400), (q + 300, yq - 400), (q + 300, yq + 2), (q - 300, yq + 2)]))
                dark_s.append(blob); lit_s.append(blob.intersection(Point(q - r0 * .5, yq - r0 * 1.5).buffer(r0 * 1.2, 6)))
                q += rng.uniform(500, 1100)
            self.add('REAR', shapely_d(unary_union(dark_s)), SAGE_SHADOW)
            self.add('REAR', shapely_d(unary_union(lit_s)), SAGE)
            self.add('REAR', shapely_d(unary_union(rails)), WOOD)
            self.add('REAR', shapely_d(unary_union(posts)), WOOD_DARK)
        # dark seam where the wall sits on the rock
        self.clip('STRUCT', wall, band.buffer(12).difference(band.buffer(-0.5)).intersection(rock.buffer(14)), '#14233f')

    def facet_rock(self, *a, **k):
        if getattr(self, '_grp', None):
            return self._facet_rock(*a, **k)
        self._seq = getattr(self, '_seq', 0) + 1
        self._grp = 'd%02d' % self._seq
        try:
            return self._facet_rock(*a, **k)
        finally:
            self._grp = None

    def _facet_rock(self, layer, g, seed=0, cell=420, tones=('#1f3860', '#2b4872', '#3d5f8f', '#4d70a0'), crack='#13223e', stretch=None, grass=False):
        """Jointed cliff rock: upright columns broken into stacked blocks with
        slanted tops; every block has a lit left plane, a mid face, a dark
        right flank and a pale ledge cap. Cracks are the gaps between blocks.
        One compound path per tone."""
        if g.is_empty or g.area < 2000:
            return
        rng = random.Random(seed * 7 + 1)
        dark, mid, lit, cap = tones
        minx, miny, maxx, maxy = g.bounds
        groups = {}
        G = lambda c, yy: groups.setdefault(self.hz(c, yy), [])
        x = minx - rng.uniform(0, cell * .6)
        while x < maxx:
            w = rng.uniform(.6, 1.35) * cell
            tops, y = [], miny - rng.uniform(0, cell * 1.5)
            while y < maxy + cell:
                a, c = y + rng.uniform(-.25, .25) * w, y + rng.uniform(-.25, .25) * w
                tops.append([(x, a), (x + w * rng.uniform(.3, .6), min(a, c) - rng.uniform(.05, .3) * w), (x + w, c)])
                y += rng.uniform(1.4, 3.2) * cell
            for t0, t1 in zip(tops, tops[1:]):
                blk = Polygon(t0 + list(reversed(t1))).buffer(-8, join_style=2)
                if blk.is_empty:
                    continue
                (l, py), (r, ry) = t0[1], t0[2]
                yb = max(t1[0][1], t1[2][1])
                k = rng.uniform(.25, .5)
                yc = (py + yb) / 2
                G(mid, yc).append(blk)
                G(lit, yc).append(blk.intersection(Polygon([(x - 50, t0[0][1] - 400), (l, py - 50), (l + w * .05, py + 80), (x + w * k, yb + 50), (x - 50, yb + 50)])))
                G(dark, yc).append(blk.intersection(Polygon([(x + w * rng.uniform(.72, .85), py), (x + w + 50, ry - 200), (x + w + 50, yb + 50), (x + w * rng.uniform(.6, .8), yb + 50)])))
                capb = Polygon([(x - 20, t0[0][1] - 300), (l, py - 300), (r + 20, ry - 300), (r + 20, ry + 34), (l, py + 30), (x - 20, t0[0][1] + 34)])
                G(cap, yc).append(blk.intersection(capb))
                if grass and rng.random() < .45:
                    G(SAGE, yc).append(blk.intersection(Polygon([(x - 20, t0[0][1] - 300), (l, py - 300), (l, py + 22), (x - 20, t0[0][1] + 26)])))
            x += w
        self.add(layer, shapely_d(g), self.hz(crack, (miny + maxy) / 2))
        for t, gs in groups.items():
            gg = unary_union([q for q in gs if not q.is_empty]).intersection(g)
            if not gg.is_empty:
                self.add(layer, shapely_d(gg, simplify=3), t)

    def _masonry_into(self, layer, poly, seed=0, y_ref=None, scale=1.0, tones=None, mortar='#16253f'):
        """Coursed rubble: uneven course heights, staggered blocks of mixed
        width, three stone tones; the base fill shows as mortar."""
        if poly.is_empty or poly.area < 2000:
            return
        # world-anchored course grid: a road shelf (BODY) and the retaining
        # wall behind it (STRUCT) share joints, so the seam disappears
        yr = poly.bounds[1] if y_ref is None else y_ref
        sc = (1 - .4 * self.recede(yr)) * scale   # far courses are smaller
        self.add(layer, shapely_d(poly), self.hz(mortar, yr))
        minx, miny, maxx, maxy = poly.bounds
        tones = tuple(self.hz(c, yr) for c in (tones or ('#2a4168', '#33507b', '#3f5f8c')))
        groups = [[] for _ in tones]
        y, row = -2000.0 * sc, 0
        while y < maxy:
            rr = random.Random(row * 7919 + self.n)
            hgt = rr.uniform(90, 150) * sc
            if y + hgt > miny:
                x = (-3000 - rr.uniform(0, 120)) * sc
                while x < maxx:
                    w = rr.uniform(150, 340) * sc
                    j = [rr.uniform(0, 6) * sc for _ in range(4)]
                    t = min(2, int(rr.random() ** 1.6 * 3))
                    if x + w > minx:
                        groups[t].append(Polygon([(x + 5 + j[0], y + 5), (x + w - 5, y + 5 + j[1]), (x + w - 5 - j[2], y + hgt - 4), (x + 5, y + hgt - 4 - j[3])]))
                    x += w
            y += hgt
            row += 1
        for t, gs in zip(tones, groups):
            gg = unary_union(gs).intersection(poly.buffer(-4))
            if not gg.is_empty:
                self.add(layer, shapely_d(gg, simplify=1), t)

    def backwall(self, *a, **k):
        if getattr(self, '_grp', None):
            return self._backwall(*a, **k)
        self._seq = getattr(self, '_seq', 0) + 1
        self._grp = 'd%02d' % self._seq
        try:
            return self._backwall(*a, **k)
        finally:
            self._grp = None

    def _backwall(self, pts, seed=0, fid=None, lit=False):
        self._lit_wall = lit
        if fid:
            self.art_features.append(fid)
        """Cave back wall behind actors (no collision): dark planes with a few
        dim facets so an enclosed space reads as interior, not floating rock."""
        rng = random.Random(seed)
        g = Polygon(pts).buffer(0)
        if self._lit_wall:   # open-air cut face: jointed bedrock behind the roads
            self.facet_rock('STRUCT', g, seed, cell=380, tones=('#132541', '#192f52', '#213b62', '#2a4870'), crack='#0c172b')
            return
        self.add('STRUCT', shapely_d(g), '#0c172b')
        minx, miny, maxx, maxy = g.bounds
        shards = []
        for _ in range(int(g.area / 180000) + 2):
            x0, y0 = rng.uniform(minx, maxx), rng.uniform(miny, maxy)
            w, h = rng.uniform(160, 380), rng.uniform(200, 520)
            shards.append(Polygon([(x0, y0), (x0 + w, y0 + h * .1), (x0 + w * .5, y0 + h)]).buffer(0))
        self.clip('STRUCT', g, unary_union(shards), '#13213a')

    # ------------------------------------------------------------ output
    def layout(self, base):
        L = copy.deepcopy(base)
        surfaces = []
        for s in self.solids.values():
            surfaces.append({'id': s['id'], 'kind': 'overhang' if s['lower'] else 'ground', 'top': [list(map(lambda v: round(v, 1), p)) for p in s['walk']],
                             'bottom': [[round(x, 1), round(y, 1)] for x, y in s['lower']], 'role': s['role'],
                             'material': 'soil' if s['kind'] == 'earth' else 'rock'})
        for d in self.decks.values():
            surfaces.append({'id': d['id'], 'top': [list(p) for p in d['top']], 'material': 'wood', 'role': d['role']})
        L['surfaces'] = surfaces
        L['covers'] = [{k: c[k] for k in ('id', 'x', 'y', 'w', 'h')} for c in self.covers]
        L['width'], L['height'] = self.W, self.H
        L['artFeatures'] = list(self.art_features)
        if 'spawn' in L:  # party starts exactly on the real ground, never inside it
            L['spawn']['y'] = round(self.ground_below(L['spawn']['x'], L['spawn']['y'] - 150) - 0.5, 2)
        return L

    def build(self, out_art, out_layout, base_layout, far_preview=None):
        self.paint_solids()
        self.paint_decks()
        self.paint_covers()
        if self.errors:
            raise SystemExit('\n'.join(self.errors))
        out_art = Path(out_art)
        (out_art / 'modules').mkdir(parents=True, exist_ok=True)
        for old in (out_art / 'modules').glob('*.svg'):
            old.unlink()
        manifest, total = [], 0
        order = ['STRUCT', 'BODY', 'SURFACE', 'REAR', 'FORE']
        for (layer, m), els in sorted(self.modules.items(), key=lambda kv: order.index(kv[0][0])):
            if layer in ('BODY', 'SURFACE') and m.startswith('x'):
                raise SystemExit('unowned %s paint in %s' % (layer, m))
            groups = {}
            if layer == 'BODY':
                merged = els
            else:
                for d, fill in els:
                    groups.setdefault(fill, []).append(d)
                merged = [(' '.join(ds), fill) for fill, ds in groups.items()]
            nums = [float(v) for d, _ in merged for v in re.findall(r'-?\d+(?:\.\d+)?', d)]
            xs, ys = nums[0::2], nums[1::2]
            box = [math.floor(min(xs)) - 4, math.floor(min(ys)) - 4, math.ceil(max(xs)) + 4, math.ceil(max(ys)) + 4]
            name = '%s-%s' % (layer.lower(), m)
            body = ''.join('<path d="%s" fill="%s"/>' % (d, fill) for d, fill in merged)
            (out_art / 'modules' / (name + '.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%d %d %d %d">%s</svg>' % (box[2] - box[0], box[3] - box[1], box[0], box[1], box[2] - box[0], box[3] - box[1], body))
            terrain = 'pilot%d-%s' % (self.n, m) if layer in ('BODY', 'SURFACE') else None
            manifest.append({'name': name, 'layer': layer, 'module': m, 'bounds': box, 'paths': len(merged), 'terrain': terrain})
            total += len(merged)
        (out_art / 'modules.json').write_text(json.dumps(manifest, indent=1))
        L = self.layout(base_layout)
        Path(out_layout).write_text(json.dumps(L, ensure_ascii=False, indent=1))
        # review preview (not shipped): far raster + all layers in world coords
        xm, ym = -800, min(0, min(s['poly'].bounds[1] for s in self.solids.values()) - 600)
        far = ''
        if far_preview:
            from PIL import Image
            png = Path('/tmp/claude-0/-home-user/ce99f28e-d0a2-5521-9bd0-ca7baa6be50e/scratchpad/far-%d.png' % self.n)
            Image.open(far_preview).convert('RGB').save(png)
            far = '<image xlink:href="file://%s" x="%d" y="%d" width="%d" height="%d" preserveAspectRatio="none"/>' % (png, xm, ym, self.W + 1600, self.H - ym + 600)
        layers = ''.join('<g id="%s">%s</g>' % (k, ''.join('<path d="%s" fill="%s"/>' % e for e in self.layers[k])) for k in ['STRUCT', 'BODY', 'SURFACE', 'REAR', 'FORE'])
        prev = Path(ROOT / ('_local/reports/act4-claude/stage%d/preview.svg' % self.n))
        prev.parent.mkdir(parents=True, exist_ok=True)
        prev.write_text('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="%d" height="%d" viewBox="%d %d %d %d"><rect x="%d" y="%d" width="%d" height="%d" fill="#3d4f78"/>%s%s</svg>' % (self.W + 1600, self.H - ym + 600, xm, ym, self.W + 1600, self.H - ym + 600, xm, ym, self.W + 1600, self.H - ym + 600, far, layers))
        verts = sum(len(s['walk']) + len(s['lower']) for s in self.solids.values()) + sum(len(d['top']) * 2 for d in self.decks.values()) + 4 * len(self.covers)
        print(json.dumps({'stage': self.n, 'modules': len(manifest), 'paths': total, 'colliderVertices': verts}))


# ---------------------------------------------------------------- canonical helpers
TERRAIN_ART = re.compile(r'silhouette|domain|underpaint|native|s3[0-9]-floor|coherent|authored|contact|body|rear-continuous|exact-ground|play-left|play-right|wood-route|bank32|far-le')

ORIGIN_COMMIT = '56f58bca'   # pre-redesign source (handoff branch head)
_ORIGIN = None

def canonical(n):
    """Original Act4 stage n before this redesign (git source, not the
    working world that already holds redesigned stages)."""
    global _ORIGIN
    if _ORIGIN is None:
        import subprocess
        cache = ROOT / '_local/reports/act4-claude/origin-world.json'
        if not cache.exists():
            show = lambda path: subprocess.run(['git', 'show', '%s:%s' % (ORIGIN_COMMIT, path)], cwd=ROOT, capture_output=True, check=True).stdout
            m = json.loads(show('shared/data/act4/world.parts/manifest.json'))
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_bytes(b''.join(show('shared/data/act4/world.parts/' + q['file']) for q in m['parts']))
        _ORIGIN = json.loads(cache.read_text())
    world = _ORIGIN
    return next(s for s in world['stages'] if s['metadata']['stageId'] == n)

def canonical_top(n, tid=None, x0=0, x1=None):
    """Exact upper boundary of the main canonical ground polygon (elements,
    doors, boats and residents stand on these points)."""
    s = canonical(n)
    t = next(t for t in s['terrains'] if (tid and t['id'] == tid) or (not tid and t['id'].endswith('-land')))
    x1 = s['width'] if x1 is None else x1
    best = {}
    for q in t['points']:
        if x0 <= q['x'] <= x1:
            k = round(q['x'], 1)
            if k not in best or q['y'] < best[k]:
                best[k] = q['y']
    pts = sorted(best.items())
    return rdp([(x, round(y, 2)) for x, y in pts], 0.75)

def keep_elements(n):
    return sorted({e['assetId'] for e in canonical(n)['elements'] if not TERRAIN_ART.search(e['assetId'])})
