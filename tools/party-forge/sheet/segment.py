#!/usr/bin/env python3
"""Cut a sheet's full-body figure into rig parts without changing its look.

The traced figure is a stack of overlapping fills (later fills, including
paper-coloured erasers, cover earlier ones). Steps:
 1. flatten every path to a polygon in paint order;
 2. keep only the visible region of each fill (minus everything painted later),
    drop paper/erasers -> a flat, non-overlapping colour map identical to the art;
 3. split that map into part territories (nearest bone, per-character bone list;
    cloth colours may not go to the legs), each territory slightly enlarged so
    parent/child overlap at joints;
 4. under each limb, back-fill the parent with its dominant colour so moving a
    limb never opens a hole.
Writes tools/party-forge/sheet/<id>.parts.json (sheet units)."""
import json, re, sys, math
from pathlib import Path
from shapely.geometry import Polygon, LineString, Point, MultiPoint, box
from shapely.ops import unary_union, voronoi_diagram
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parents[3]
num = re.compile(r'-?\d*\.?\d+(?:e[-+]?\d+)?')

def flatten(d, step=10):
    rings, cur, pos = [], [], (0, 0)
    for cmd, args in re.findall(r'([MLCZmlcz])([^MLCZmlcz]*)', d):
        a = [float(v) for v in num.findall(args)]
        if cmd == 'M':
            if len(cur) > 2: rings.append(cur)
            cur = [(a[0], a[1])]; pos = cur[0]
            for i in range(2, len(a), 2): cur.append((a[i], a[i+1])); pos = cur[-1]
        elif cmd == 'L':
            for i in range(0, len(a), 2): cur.append((a[i], a[i+1])); pos = cur[-1]
        elif cmd == 'C':
            for i in range(0, len(a), 6):
                p0 = pos; p1 = (a[i], a[i+1]); p2 = (a[i+2], a[i+3]); p3 = (a[i+4], a[i+5])
                L = math.dist(p0, p1) + math.dist(p1, p2) + math.dist(p2, p3)
                n = max(2, int(L / step))
                for k in range(1, n + 1):
                    t = k / n; u = 1 - t
                    cur.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
                pos = p3
        elif cmd in 'Zz':
            if len(cur) > 2: rings.append(cur)
            cur = []
    if len(cur) > 2: rings.append(cur)
    g = None
    for r in rings:  # even-odd like the tracer's subpaths
        p = make_valid(Polygon(r))
        g = p if g is None else g.symmetric_difference(p)
    return g

def lum(c):
    v = int(c[1:7], 16); return ((v >> 16) & 255) * .2126 + ((v >> 8) & 255) * .7152 + (v & 255) * .0722

def load(sheet, max_x):
    s = re.sub(r'<metadata>.*?</metadata>', '', (ROOT / sheet).read_text(), flags=re.S)
    grads = {m.group(1): re.findall(r'stop-color="([^"]+)"', m.group(0)) for m in re.finditer(r'<linearGradient id="([^"]+)".*?</linearGradient>', s, re.S)}
    out = []
    for m in re.finditer(r'<path ([^>]*?)/?>', s):
        a = m.group(1); fill = re.search(r'fill="([^"]+)"', a).group(1); d = re.search(r'\sd="([^"]+)"', ' ' + a).group(1)
        if fill.startswith('url('):
            st = grads[fill[5:-1]]; fill = st[len(st) // 2]
        n = [float(v) for v in num.findall(d)]; xs = n[0::2]
        if (min(xs) + max(xs)) / 2 > max_x: continue
        g = flatten(d)
        if g is None or g.is_empty: continue
        out.append((fill.upper(), g))
    return out

def polys(g):
    if g.is_empty: return []
    if g.geom_type == 'Polygon': return [g]
    return [p for p in getattr(g, 'geoms', []) if p.geom_type == 'Polygon' or p.geom_type == 'MultiPolygon' for p in ([p] if p.geom_type == 'Polygon' else p.geoms)]

def main(cfg_path):
    cfg = json.loads(Path(cfg_path).read_text())
    paths = load(cfg['sheet'], cfg['maxX'])
    W = max(p[1].bounds[2] for p in paths); H = max(p[1].bounds[3] for p in paths)
    frame = box(0, 0, cfg['maxX'] + 40, H)
    # 1-2 visible flat colour map
    covered = Polygon(); regions = []
    for fill, g in reversed(paths):
        g = g.intersection(frame)
        vis = g.difference(covered)
        covered = covered.union(g)
        if lum(fill) > 238 or vis.is_empty: continue
        vis = vis.buffer(0)
        if vis.area > 1: regions.append((fill, vis))
    regions.reverse()
    # 3 territories from bones (nearest bone segment)
    bones = cfg['bones']   # part -> list of segments [[x0,y0],[x1,y1]]
    def territories(parts):
        pts, owner = [], []
        for part in parts:
            for a, b in bones[part]:
                L = math.dist(a, b); n = max(2, int(L / 4))
                for k in range(n + 1):
                    t = k / n; pts.append((a[0] + (b[0]-a[0]) * t, a[1] + (b[1]-a[1]) * t)); owner.append(part)
        cells = voronoi_diagram(MultiPoint(pts), envelope=box(-200, -200, W + 200, H + 200))
        terr = {p: [] for p in parts}
        idx = {pt: o for pt, o in zip(pts, owner)}
        for c in cells.geoms:
            # find the generating point inside the cell
            for pt in pts:
                pass
            break
        # map cells to owners via containment
        from shapely.strtree import STRtree
        P = [Point(p) for p in pts]; tree = STRtree(P)
        for c in cells.geoms:
            for i in tree.query(c):
                if c.contains(P[i]): terr[owner[i]].append(c); break
        return {p: unary_union(v) for p, v in terr.items()}
    all_parts = list(bones)
    T_all = territories(all_parts)
    T_cloth = territories([p for p in all_parts if p not in cfg.get('noCloth', [])])
    legs = [p for p in all_parts if p.endswith(('_thigh', '_shin', '_foot'))]
    T_upper = territories([p for p in all_parts if p not in legs])
    cloth = set(c.upper() for c in cfg.get('clothColors', []))
    if cfg.get('clothAll'):
        def skinlike(c):
            v = int(c[1:7], 16); r, g, b = (v >> 16) & 255, (v >> 8) & 255, v & 255
            return r > 170 and r - b > 30 and r >= g >= b and lum(c) < 235
        keep = set(c.upper() for c in cfg.get('notCloth', []))
        cloth = {f for f, _ in regions if not skinlike(f) and f not in keep}
    margin = cfg.get('margin', 5)
    parts = {p: [] for p in all_parts}
    for fill, g in regions:
        hit = next((f for f in cfg.get('force', []) if box(*f['box']).contains(g.centroid)), None)
        if hit:
            parts[hit['part']].append((fill, g)); continue
        top = box(-1e4, -1e4, 1e4, cfg.get('clothBelowY', 0))
        band = box(-1e4, cfg.get('clothBelowY', 0), 1e4, cfg.get('clothAboveY', 1e9))
        rest = g.difference(top)
        jobs = [(g.intersection(top), T_upper)]
        if fill in cloth:
            jobs += [(rest.intersection(band), T_cloth), (rest.difference(band), T_all)]
        else:
            jobs += [(rest, T_all)]
        for gg, T in jobs:
            if gg.is_empty or gg.area < 2: continue
            for part, terr in T.items():
                core = gg.intersection(terr)
                if core.area < 25: continue                      # only owners extend into the joint overlap
                piece = gg.intersection(terr.buffer(margin))
                piece = unary_union([p for p in polys(piece) if p.area > 12 and p.area / max(p.length, 1) > 1.0])
                if not piece.is_empty: parts[part].append((fill, piece))
    # 4 backfill parents under limbs
    fills = []
    for child, parent, color in cfg.get('backfill', []):
        region = unary_union([g for _, g in parts[child]]).buffer(3)
        hull = unary_union([g for _, g in parts[parent]])
        under = region.intersection(hull.convex_hull)
        if not under.is_empty: fills.append((parent, color, under))
    # 5 small islands adopt the part they touch most (a cuff speck left on the hip would float when the arm moves)
    flat = [(part, c, p) for part, items in parts.items() for c, g in items for p in polys(g.simplify(.4))]
    for i, (part, c, p) in enumerate(flat):
        if p.area >= 90:
            continue
        best, share = part, 0.0
        for q_part, _, q in flat:
            if q is p or q.area < 90:
                continue
            l = p.buffer(1.2).intersection(q).area
            if l > share:
                best, share = q_part, l
        flat[i] = (best, c, p)
    # 6 per-piece claims (cfg 'claim': piece centroid inside box -> part)
    for i, (part, c, p) in enumerate(flat):
        hit = next((f for f in cfg.get('claim', []) if box(*f['box']).contains(p.centroid)), None)
        if hit:
            flat[i] = (hit['part'], c, p)
    out = {'sheet': cfg['sheet'], 'parts': {}}
    for part in parts:
        rows = [[c, p] for q_part, c, p in flat if q_part == part]
        out['parts'][part] = [[c, [list(map(lambda v: round(v, 2), xy)) for xy in p.exterior.coords[:-1]], [[list(map(lambda v: round(v, 2), xy)) for xy in h.coords[:-1]] for h in p.interiors]] for c, p in rows]
    out['backfill'] = [[part, color, [list(map(lambda v: round(v, 2), xy)) for xy in p.exterior.coords[:-1]]] for part, color, g in fills for p in polys(g.simplify(.6))]
    dst = Path(cfg_path).with_suffix('').with_suffix('.parts.json')
    dst.write_text(json.dumps(out))
    print(dst, {k: len(v) for k, v in out['parts'].items()}, 'backfill', len(out['backfill']))

if __name__ == '__main__':
    main(sys.argv[1])
