#!/usr/bin/env python3
"""Skinning weights for a sheet figure cut by segment.py (v018).

Rigid pieces tear at every bent joint and cannot bend cloth. Instead every piece
is densified and each vertex gets smooth bone weights, so pieces that share an
edge move together and sleeves/robes bend (linear blend skinning).

Weights are harmonic ("bone heat"-like): per layer group (body+legs, rear arm,
front arm) the group's painted silhouette is rasterised; cells on a bone are
fixed to 1 for that bone and 0 for the others, and Laplace's equation fills the
rest of the silhouette. Weights therefore follow the drawn shape (a sleeve does
not borrow the torso's weight through empty space) and depend only on
position, so neighbouring pieces get identical weights on their shared edge.
Head and weapon stay rigid.

usage: skin.py <id>.json   -> writes <id>.skin.json next to it
"""
import json, sys, math
import numpy as np
from scipy import sparse
from scipy.sparse.linalg import splu
from scipy.ndimage import distance_transform_edt
from shapely.geometry import Polygon
import shapely

CELL = 2.0          # grid cell in sheet units
STEP = 5.0          # max edge length after densifying
TOP = 3             # influences kept per vertex
JOINT = 18.0        # free (blended) length on each side of a joint, sheet units

ARM = ['_upper_arm', '_forearm', '_hand']
LEG = ['_thigh', '_shin', '_foot']


def densify(ring):
    out = []
    n = len(ring)
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        k = max(1, math.ceil(math.dist(a, b) / STEP))
        for j in range(k):
            t = j / k
            out.append([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    return out


def main(cfg_path):
    cfg = json.load(open(cfg_path))
    parts = json.load(open(cfg_path.replace('.json', '.parts.json')))
    J = cfg['joints']
    P = lambda k: np.array(J[k], float)

    def tip(part, start, along):
        """end of a hand/foot bone: farthest painted point of that part from its joint"""
        pts = [p for row in parts['parts'].get(part, []) for p in row[1]]
        if not pts:
            return start + along
        d = [math.dist(p, start) for p in pts]
        far = np.array(pts[int(np.argmax(d))], float)
        return start + (far - start) * 0.8

    bones = {
        'pelvis': [P('rearHip'), P('frontHip')],
        'thorax': [P('pelvis') + (P('neck') - P('pelvis')) * 0.3, P('neck')],
    }
    for s in ('rear', 'front'):
        bones[s + '_upper_arm'] = [P(s + 'Shoulder'), P(s + 'Elbow')]
        bones[s + '_forearm'] = [P(s + 'Elbow'), P(s + 'Hand')]
        bones[s + '_hand'] = [P(s + 'Hand'), tip(s + '_hand', P(s + 'Hand'), (P(s + 'Hand') - P(s + 'Elbow')) * 0.4)]
        bones[s + '_thigh'] = [P(s + 'Hip'), P(s + 'Knee')]
        bones[s + '_shin'] = [P(s + 'Knee'), P(s + 'Ankle')]
        bones[s + '_foot'] = [P(s + 'Ankle'), tip(s + '_foot', P(s + 'Ankle'), np.array([30.0, 0]))]

    groups = {'body': ['thorax', 'pelvis'] + [s + l for s in ('rear', 'front') for l in LEG]}
    for s in ('rear', 'front'):
        groups[s + '_arm'] = ['thorax'] + [s + a for a in ARM]
    owner_group = {}
    for g, bs in groups.items():
        for b in bs:
            if b != 'thorax' or g == 'body':
                owner_group[b] = g

    fills = occlusion_fills(parts, owner_group)
    all_pts = [p for rows in parts['parts'].values() for row in rows for p in row[1]]
    x0, y0 = np.min(all_pts, 0) - 10
    x1, y1 = np.max(all_pts, 0) + 10
    W, H = int((x1 - x0) / CELL) + 1, int((y1 - y0) / CELL) + 1
    gx, gy = np.meshgrid(x0 + np.arange(W) * CELL, y0 + np.arange(H) * CELL)

    from shapely.ops import unary_union as _uu
    body_shape = _uu([Polygon(row[1], row[2]).buffer(0) for part, rows in parts['parts'].items() if owner_group.get(part) == 'body' for row in rows] + [Polygon(f[2], f[3]).buffer(0) for f in fills])
    body_mask = shapely.contains_xy(body_shape, gx, gy)
    out = {'bones': {k: [list(map(float, v[0])), list(map(float, v[1]))] for k, v in bones.items()}, 'parts': {}}
    fields = {}
    for g, bs in groups.items():
        polys = [Polygon(row[1], row[2]).buffer(0) for part, rows in parts['parts'].items() if owner_group.get(part) == g for row in rows]
        polys += [Polygon(r[2]).buffer(0) for r in parts.get('backfill', []) if owner_group.get(r[0]) == g]
        polys += [Polygon(f[2], f[3]).buffer(0) for f in fills if owner_group.get(f[0]) == g]
        if not polys:
            continue
        from shapely.ops import unary_union
        shape = unary_union(polys).buffer(CELL * 1.5)
        mask = shapely.contains_xy(shape, gx, gy)
        fixed = np.full((H, W), -1)
        for bi, b in enumerate(bs):
            a, c = bones[b]
            if b == 'thorax' and g != 'body':
                # arms blend into the torso only at the shoulder: anchor the
                # arm silhouette cells lying on the torso side of the shoulder
                sh, el = bones[bs[1]]
                L0 = np.linalg.norm(el - sh)
                d = (el - sh) / L0
                t = (gx - sh[0]) * d[0] + (gy - sh[1]) * d[1]
                # the sleeve's inner edge along the upper third stays sewn to the torso (armpit):
                # raising the arm stretches the sleeve instead of opening a gap at the shoulder
                fixed[(t < -6) & mask] = bi
                continue
            L = max(1.0, np.linalg.norm(c - a))
            # leave the joints free: weights blend over ~JOINT units on each side
            # (a hard switch at the joint keeps both sides rigid and opens a gap)
            m0 = min(0.3, JOINT / L) if b not in ('pelvis',) else 0.0
            m1 = min(0.3, JOINT / L) if not b.endswith(('_hand', '_foot')) and b not in ('pelvis',) else 0.0
            if b.endswith(('_hand', '_foot')):
                m0 = min(0.4, JOINT * 0.6 / L)
            steps = int(L / (CELL * 0.5)) + 1
            for k in range(steps):
                u = m0 + (1 - m0 - m1) * k / max(1, steps - 1)
                q = a + (c - a) * u
                i, j = int(round((q[1] - y0) / CELL)), int(round((q[0] - x0) / CELL))
                if 0 <= i < H and 0 <= j < W and mask[i, j]:
                    fixed[i, j] = bi
        free = mask & (fixed < 0)
        idx = -np.ones((H, W), int)
        idx[free] = np.arange(free.sum())
        n = int(free.sum())
        rows_, cols_, vals = [], [], []
        rhs = np.zeros((n, len(bs)))
        fi, fj = np.nonzero(free)
        for i, j in zip(fi, fj):
            r = idx[i, j]
            deg = 0
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a2, b2 = i + di, j + dj
                if not (0 <= a2 < H and 0 <= b2 < W) or not mask[a2, b2]:
                    continue  # Neumann at the silhouette edge
                deg += 1
                if fixed[a2, b2] >= 0:
                    rhs[r, fixed[a2, b2]] += 1
                else:
                    rows_.append(r); cols_.append(idx[a2, b2]); vals.append(-1.0)
            rows_.append(r); cols_.append(r); vals.append(float(max(deg, 1)))
        A = sparse.csc_matrix((vals, (rows_, cols_)), shape=(n, n))
        # isolated islands with no bone: tiny regularisation toward nearest bone afterwards
        A = A + sparse.identity(n) * 1e-6
        sol = splu(A).solve(rhs)
        Wf = np.zeros((H, W, len(bs)))
        Wf[free] = sol
        for bi in range(len(bs)):
            Wf[fixed == bi, bi] = 1.0
        s = Wf.sum(2, keepdims=True)
        # unreachable cells (no bone in their island): nearest-bone fallback
        weak = mask & (s[..., 0] < 1e-3)
        if weak.any():
            for i, j in zip(*np.nonzero(weak)):
                q = np.array([gx[i, j], gy[i, j]])
                d = [seg_dist(q, *bones[b]) if not (b == 'thorax' and g != 'body') else 1e9 for b in bs]
                Wf[i, j, int(np.argmin(d))] = 1.0
            s = Wf.sum(2, keepdims=True)
        Wf = np.where(s > 0, Wf / np.maximum(s, 1e-9), 0)
        fields[g] = (bs, Wf, mask)

    def weighted(g, rings_in, tol=0.04):
        """densify, weight, then drop in-between vertices whose weights barely change
        (on a straight edge they add cost but no deformation)"""
        rings_out, w_out = [], []
        for ring in rings_in:
            dense = densify(ring)
            corners = set()
            k = 0
            for i in range(len(ring)):
                corners.add(k)
                k += max(1, math.ceil(math.dist(ring[i], ring[(i + 1) % len(ring)]) / STEP))
            ws = [sample(g, p) for p in dense]
            vec = lambda e: {b: x for b, x in e}
            keep, last = [], None
            for i, e in enumerate(ws):
                v = vec(e)
                if i in corners or last is None or max(abs(v.get(b, 0) - last.get(b, 0)) for b in set(v) | set(last)) > tol:
                    keep.append(i)
                    last = v
            rings_out.append([dense[i] for i in keep])
            w_out += [ws[i] for i in keep]
        return rings_out, w_out

    def sample(g, p):
        bs, Wf, mask = fields[g]
        j = min(W - 1, max(0, int(round((p[0] - x0) / CELL))))
        i = min(H - 1, max(0, int(round((p[1] - y0) / CELL))))
        if not mask[i, j]:
            # walk to the nearest masked cell
            ii, jj = np.nonzero(mask)
            k = np.argmin((ii - i) ** 2 + (jj - j) ** 2)
            i, j = ii[k], jj[k]
        w = Wf[i, j]
        order = np.argsort(-w)[:TOP]
        tot = w[order].sum()
        return [[bs[o], round(float(w[o] / tot), 3)] for o in order if w[o] / tot > 0.01]

    for part, rows in parts['parts'].items():
        g = owner_group.get(part)
        outrows = []
        for color, ext, holes in rows:
            rings = [densify(ext)] + [densify(h) for h in holes]
            if g is None:
                outrows.append({'rings': rings, 'w': None})
                continue
            rings, w = weighted(g, [ext] + holes)
            outrows.append({'rings': [[[round(x, 2), round(y, 2)] for x, y in r] for r in rings], 'w': w})
        out['parts'][part] = outrows
    bf = []
    for part, color, ext in parts.get('backfill', []):
        g = owner_group.get(part)
        r = densify(ext)
        bf.append({'rings': [[[round(x, 2), round(y, 2)] for x, y in r]], 'w': [sample(g, p) for p in r] if g else None})
    out['backfill'] = bf
    out['caps'] = joint_caps(parts, J)
    out['fills'] = [{'part': part, 'color': color, 'rings': [[[round(x, 2), round(y, 2)] for x, y in r] for r in [densify(ext)] + [densify(h) for h in holes]],
                     'w': [sample(owner_group[part], p) for r in [densify(ext)] + [densify(h) for h in holes] for p in r]} for part, color, ext, holes in fills]
    json.dump(out, open(cfg_path.replace('.json', '.skin.json'), 'w'), separators=(',', ':'))
    print(cfg_path, {g: int(f[2].sum()) for g, f in fields.items()})


def occlusion_fills(parts, owner_group, R=12.0, cell=3.0):
    """Body paint hidden under the arms does not exist in a single drawing. Fill the
    body region covered by each arm (closed body silhouette under the arm) with the
    colour of the nearest body piece, so a moving arm uncovers cloth, not background."""
    from shapely.ops import unary_union
    from shapely.strtree import STRtree
    from shapely.geometry import box
    body = [(part, row[0], Polygon(row[1], row[2]).buffer(0)) for part, rows in parts['parts'].items() if owner_group.get(part) == 'body' for row in rows]
    bu = unary_union([b[2] for b in body])
    closed = bu.buffer(R).buffer(-R)
    out = []
    body = [b for b in body if b[2].area >= 400] or body   # inpaint from the large cloth panels, not trims/cuffs
    tree = STRtree([b[2] for b in body])
    for g in ('rear_arm', 'front_arm'):
        arm = unary_union([Polygon(row[1], row[2]).buffer(0) for part, rows in parts['parts'].items() if owner_group.get(part) == g and not part.endswith('_hand') for row in rows])
        region = arm.buffer(2).intersection(closed).difference(bu.buffer(-0.5))
        if region.is_empty or region.area < 30:
            continue
        x0, y0, x1, y1 = region.bounds
        cells = {}
        for x in np.arange(x0, x1 + cell, cell):
            for y in np.arange(y0, y1 + cell, cell):
                c = box(x - cell / 2, y - cell / 2, x + cell / 2, y + cell / 2)
                if not c.intersects(region):
                    continue
                k = int(tree.nearest(c.centroid))
                cells.setdefault(k, []).append(c)
        for k, cs in cells.items():
            shape = unary_union(cs).buffer(0.8).intersection(region.buffer(0.8)).simplify(0.8)
            geoms = getattr(shape, 'geoms', [shape])
            for gm in geoms:
                if gm.geom_type != 'Polygon' or gm.area < 20:
                    continue
                out.append((body[k][0], body[k][1], [list(c) for c in gm.exterior.coords[:-1]], [[list(c) for c in i.coords[:-1]] for i in gm.interiors]))
    return out


def joint_caps(parts, J, n=28):
    """Joint caps (cutout-animation practice): a disc in the child's colour at each
    joint, drawn UNDER the parent's art and moving with the child, so bending or
    raising a limb shows cloth/skin in the gap instead of background."""
    from shapely.geometry import Point
    from shapely.ops import unary_union
    shapes = {part: [(row[0], Polygon(row[1], row[2]).buffer(0)) for row in rows] for part, rows in parts['parts'].items()}
    caps = []
    for s in ('rear', 'front'):
        for parent, child, joint in ((None, s + '_upper_arm', s + 'Shoulder'), (s + '_upper_arm', s + '_forearm', s + 'Elbow'),
                                     (None, s + '_thigh', s + 'Hip'),   # no wrist cap: a disc wider than the wrist shows under a turned hand
                                     (s + '_thigh', s + '_shin', s + 'Knee'), (s + '_shin', s + '_foot', s + 'Ankle')):
            kids = shapes.get(child) or []
            if not kids:
                continue
            j = Point(J[joint])
            near = [(c, g) for c, g in kids if g.distance(j) < 30]
            if not near:
                continue
            color = max(near, key=lambda cg: cg[1].intersection(j.buffer(30)).area)[0]
            region = unary_union([g for _, g in kids] + [g for _, g in shapes.get(parent or '', [])]).buffer(1)
            # half the child's drawn width at the joint (its area near the joint over the length it spans)
            local = unary_union([g for _, g in kids]).intersection(j.buffer(40))
            r = min(30.0, max(6.0, 0.5 * local.area / 40.0)) if not local.is_empty else 6.0
            ring = [[round(J[joint][0] + r * math.cos(2 * math.pi * k / n), 2), round(J[joint][1] + r * math.sin(2 * math.pi * k / n), 2)] for k in range(n)]
            owner = parent or ('thorax' if child.endswith('upper_arm') else 'pelvis')
            caps.append({'part': owner, 'color': color, 'rings': [ring], 'w': [[[child, 1.0]] for _ in ring]})
    return caps


def seg_dist(q, a, b):
    d = b - a
    t = np.clip(np.dot(q - a, d) / max(1e-9, np.dot(d, d)), 0, 1)
    return float(np.linalg.norm(q - (a + d * t)))


if __name__ == '__main__':
    main(sys.argv[1])
