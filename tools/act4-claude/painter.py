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

    def solid(self, sid, top, lower, kind='rock', amp=1.0, keep=(), role='', band=(16, 30), extend=None):
        """kind: rock | earth (mud/soil strata) | scree (rubble blocks)."""
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
        self.solids[sid] = dict(id=sid, walk=walk, lower=art_lower, poly=poly, kind=kind, role=role, band=band)

    def deck(self, sid, top, kind='plank', role='', sockets=()):
        self.decks[sid] = dict(id=sid, top=rdp([tuple(p) for p in top], 0.5), kind=kind, role=role, sockets=sockets)

    def cover(self, cid, x, y, w, h, kind='boulder'):
        self.covers.append(dict(id=cid, x=x, y=y, w=w, h=h, kind=kind))

    # ------------------------------------------------------------ geometry queries
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
        el = (d, fill)
        self.layers[layer].append(el)
        m = self.mod
        if m is None or layer in ('STRUCT', 'REAR', 'FORE'):
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
            self.clip('BODY', poly, unary_union(darks + deep), ROCK_DARK)

    def surface_band(self, s):
        top, poly = s['walk'], s['poly'].buffer(2)
        lo, hi = s['band']
        th = lambda x: lo + (hi - lo) * (0.5 + 0.5 * math.sin(x / 140 + len(s['id'])))
        def band(fn):
            return [(x, y - 3) for x, y in top] + [(x, y + fn(x)) for x, y in reversed(top)]
        self.clip('BODY', poly, band(lambda x: th(x) + 10), SAGE_SHADOW)
        self.clip('BODY', poly, band(th), SAGE)
        self.clip('BODY', poly, band(lambda x: 5), SAGE_LIP)

    def paint_solids(self):
        # Earth (ground) last: it covers the buried feet of rock standing on it.
        for s in sorted(self.solids.values(), key=lambda s: s['kind'] == 'earth'):
            self.module(s['id'])
            if s['kind'] == 'earth':
                poly = s['poly']
                self.add('BODY', shapely_d(poly), MUD)
                minx, miny, maxx, maxy = poly.bounds
                for y0, col in [(miny + 380, MUD_DARK), (miny + 650, ROCK_DARK)]:
                    strip = [(x, y0 + 30 * math.sin(x / 410) + 18 * math.sin(x / 133)) for x in range(int(minx), int(maxx) + 81, 80)]
                    self.clip('BODY', poly, strip + [(maxx + 80, maxy + 100), (minx, maxy + 100)], col)
            else:
                self.shade_rock(s)
            self.surface_band(s)

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
            if g is not None and g - y <= 1500:
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
            self.stone_posts = d['kind'] == 'stone'
            self.support_deck(d)
            self.stone_posts = False
            top, t = d['top'], 26
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

    # ------------------------------------------------------------ covers and dressing
    def paint_covers(self):
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

    def backwall(self, pts, seed=0):
        """Cave back wall behind actors (no collision): dark planes with a few
        dim facets so an enclosed space reads as interior, not floating rock."""
        rng = random.Random(seed)
        g = Polygon(pts).buffer(0)
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
