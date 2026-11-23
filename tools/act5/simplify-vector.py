"""Bounded node simplification for traced native vector assets (Act 5 terrain).

Each fill subpath is sampled to a polyline, split at sharp corners and refitted
with cubic Béziers (Schneider fitting) inside a maximum error `tol` (source
units). Subpaths whose filled area is below `min_area` and whose bounding box is
smaller than `min_box` are dropped (specks that read as noise, not form).
Clip paths (silhouette / protection) are never changed. Subpaths with arcs are
kept verbatim. Output keeps the same tree, fills, ids and `dParts` chunking.

usage: simplify-vector.py SRC OUT --tol 0.8 --min-area 6 --min-box 3 [--keys d,dParts]
"""
import argparse, json, math, re, sys
import numpy as np

TOK = re.compile(r'([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)')
NARGS = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'Z': 0}

def parse(d):
    """-> list of subpaths; each = (start, [(cmd, pts...)], closed, has_arc) in absolute coords."""
    out, cmd, buf = [], None, []
    cur = None; cx = cy = sx = sy = 0.0; lastc = None
    def emit(c, args):
        nonlocal cur, cx, cy, sx, sy, lastc
        rel = c.islower(); C = c.upper()
        if C == 'M':
            x, y = args; x, y = (x + cx, y + cy) if rel else (x, y)
            cur = {'start': (x, y), 'segs': [], 'closed': False, 'arc': False}; out.append(cur)
            cx, cy, sx, sy = x, y, x, y; lastc = None; return
        if cur is None:
            cur = {'start': (cx, cy), 'segs': [], 'closed': False, 'arc': False}; out.append(cur)
        if C == 'L':
            x, y = args; x, y = (x + cx, y + cy) if rel else (x, y); cur['segs'].append(('L', (cx, cy), (x, y))); cx, cy = x, y; lastc = None
        elif C == 'H':
            x = args[0] + (cx if rel else 0); cur['segs'].append(('L', (cx, cy), (x, cy))); cx = x; lastc = None
        elif C == 'V':
            y = args[0] + (cy if rel else 0); cur['segs'].append(('L', (cx, cy), (cx, y))); cy = y; lastc = None
        elif C in 'CS':
            if C == 'C':
                x1, y1, x2, y2, x, y = args
                if rel: x1, y1, x2, y2, x, y = x1 + cx, y1 + cy, x2 + cx, y2 + cy, x + cx, y + cy
            else:
                x2, y2, x, y = args
                if rel: x2, y2, x, y = x2 + cx, y2 + cy, x + cx, y + cy
                x1, y1 = (2 * cx - lastc[0], 2 * cy - lastc[1]) if lastc else (cx, cy)
            cur['segs'].append(('C', (cx, cy), (x1, y1), (x2, y2), (x, y))); lastc = (x2, y2); cx, cy = x, y
        elif C in 'QT':
            if C == 'Q':
                qx, qy, x, y = args
                if rel: qx, qy, x, y = qx + cx, qy + cy, x + cx, y + cy
            else:
                x, y = args
                if rel: x, y = x + cx, y + cy
                qx, qy = (2 * cx - lastc[0], 2 * cy - lastc[1]) if lastc else (cx, cy)
            c1 = (cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy)); c2 = (x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y))
            cur['segs'].append(('C', (cx, cy), c1, c2, (x, y))); lastc = (qx, qy); cx, cy = x, y
        elif C == 'A':
            x, y = args[5], args[6]
            if rel: x, y = x + cx, y + cy
            cur['segs'].append(('A', (cx, cy), tuple(args[:5]), (x, y))); cur['arc'] = True; cx, cy = x, y; lastc = None
    for m in TOK.finditer(d):
        if m.group(1):
            c = m.group(1)
            if c in 'Zz':
                if cur is not None: cur['closed'] = True
                cx, cy = sx, sy; cmd = None; buf = []; lastc = None; continue
            cmd = c; buf = []
        else:
            buf.append(float(m.group(2)))
            n = NARGS[cmd.upper()]
            if len(buf) == n:
                emit(cmd, buf); buf = []
                if cmd in 'Mm': cmd = 'l' if cmd == 'm' else 'L'
    return out

def endpoints(sub):
    return 1 + len(sub['segs'])

def sample(sub, step):
    pts = [sub['start']]
    for s in sub['segs']:
        if s[0] == 'L':
            a, b = np.array(s[1]), np.array(s[2]); n = max(1, int(math.dist(s[1], s[2]) / step))
            for t in np.linspace(0, 1, n + 1)[1:]: pts.append(tuple(a + (b - a) * t))
        else:
            p0, p1, p2, p3 = map(np.array, s[1:5]); L = math.dist(s[1], s[2]) + math.dist(s[2], s[3]) + math.dist(s[3], s[4])
            n = max(2, int(L / step))
            for t in np.linspace(0, 1, n + 1)[1:]:
                pts.append(tuple(((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3))
    P = np.array(pts)
    keep = np.r_[True, np.linalg.norm(np.diff(P, axis=0), axis=1) > 1e-6]
    return P[keep]

def area(P):
    x, y = P[:, 0], P[:, 1]; return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))

# --- Schneider curve fitting -------------------------------------------------
def bez(c, t):
    t = t[:, None]; return ((1 - t) ** 3) * c[0] + 3 * ((1 - t) ** 2) * t * c[1] + 3 * (1 - t) * t * t * c[2] + t ** 3 * c[3]
def bez1(c, t):
    t = t[:, None]; return 3 * ((1 - t) ** 2) * (c[1] - c[0]) + 6 * (1 - t) * t * (c[2] - c[1]) + 3 * t * t * (c[3] - c[2])
def bez2(c, t):
    t = t[:, None]; return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])
def chord(P):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]; return d / d[-1] if d[-1] > 0 else d
def gen(P, u, t1, t2):
    p0, p3 = P[0], P[-1]
    A1 = t1[None, :] * (3 * (1 - u) ** 2 * u)[:, None]; A2 = t2[None, :] * (3 * (1 - u) * u * u)[:, None]
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    tmp = P - bez(np.array([p0, p0, p3, p3]), u)
    X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
    det = C[0, 0] * C[1, 1] - C[0, 1] * C[1, 0]
    seg = np.linalg.norm(p3 - p0)
    if abs(det) > 1e-12:
        a1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det; a2 = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    else: a1 = a2 = 0
    if a1 < 1e-6 * seg or a2 < 1e-6 * seg: a1 = a2 = seg / 3
    return np.array([p0, p0 + t1 * a1, p3 + t2 * a2, p3])
def maxerr(P, c, u):
    d = np.linalg.norm(bez(c, u) - P, axis=1); i = int(np.argmax(d)); return d[i], i
def reparam(P, c, u):
    d = bez(c, u) - P; d1 = bez1(c, u); d2 = bez2(c, u)
    num = np.sum(d * d1, axis=1); den = np.sum(d1 * d1 + d * d2, axis=1)
    with np.errstate(divide='ignore', invalid='ignore'): nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)
def unit(v):
    n = np.linalg.norm(v); return v / n if n > 1e-12 else v
def fit(P, t1, t2, tol, depth=0):
    if len(P) == 2:
        dist = np.linalg.norm(P[1] - P[0]) / 3; return [np.array([P[0], P[0] + t1 * dist, P[1] + t2 * dist, P[1]])]
    u = chord(P); c = gen(P, u, t1, t2); e, i = maxerr(P, c, u)
    if e < tol: return [c]
    if e < tol * 4:
        for _ in range(4):
            u = reparam(P, c, u); c = gen(P, u, t1, t2); e, i = maxerr(P, c, u)
            if e < tol: return [c]
    if depth > 40 or len(P) < 3: return [c]
    i = max(1, min(len(P) - 2, i))
    tc = unit(P[i - 1] - P[i + 1])
    return fit(P[:i + 1], t1, tc, tol, depth + 1) + fit(P[i:], -tc, t2, tol, depth + 1)

def corners(P, closed, max_angle):
    n = len(P); idx = []
    for i in range(n):
        if not closed and (i == 0 or i == n - 1): continue
        a = P[i - 1] - P[i]; b = P[(i + 1) % n] - P[i]
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na < 1e-9 or nb < 1e-9: continue
        ang = math.degrees(math.acos(max(-1, min(1, float(np.dot(a, b) / (na * nb))))))
        if ang < 180 - max_angle: idx.append(i)
    return idx

def simplify_sub(sub, tol, step, max_angle):
    P = sample(sub, step)
    if len(P) < 4: return None
    if np.linalg.norm(P[0] - P[-1]) < 1e-6: P = P[:-1]
    cs = corners(P, True, max_angle)
    if not cs: cs = [0]
    # rotate so the first corner is the start, close the ring
    P = np.roll(P, -cs[0], axis=0); cs = [(c - cs[0]) % len(P) for c in cs]; cs = sorted(set(cs)); ring = np.vstack([P, P[:1]])
    bounds = cs + [len(P)]
    curves = []
    for a, b in zip(bounds[:-1], bounds[1:]):
        seg = ring[a:b + 1]
        if len(seg) < 2: continue
        t1 = unit(seg[1] - seg[0]); t2 = unit(seg[-2] - seg[-1])
        curves += fit(seg, t1, t2, tol)
    return curves

def fmt(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.'); return '0' if s in ('-0', '') else s
def nums(vals):
    out = ''
    for v in vals:
        t = fmt(v)
        out += t if (not out or t.startswith('-')) else ' ' + t
    return out
def emit_curves(curves):
    out = ['M' + nums(curves[0][0])]; last = None
    for c in curves:
        p1, p2, p3 = c[1], c[2], c[3]
        d = p3 - c[0]; L = np.linalg.norm(d)
        line = L > 0 and all(abs(d[0] * (q - c[0])[1] - d[1] * (q - c[0])[0]) / L < 0.05 for q in (p1, p2))
        cmd, vals = ('L', [p3[0], p3[1]]) if line else ('C', [p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]])
        body = nums(vals)
        out.append((cmd if cmd != last else ('' if body.startswith('-') else ' ')) + body); last = cmd
    return ''.join(out) + 'Z'

SPLIT = re.compile(r'[Mm][^Mm]*')
def emit_exact(sub):
    """Lossless absolute re-emission of a parsed subpath (used for kept ones)."""
    out = 'M' + nums(sub['start'])
    for sg in sub['segs']:
        if sg[0] == 'L': out += 'L' + nums(sg[2])
        elif sg[0] == 'C': out += 'C' + nums([*sg[2], *sg[3], *sg[4]])
        else:
            rx, ry, rot, large, sweep = sg[2]
            out += 'A' + nums([rx, ry, rot]) + ' ' + str(int(large)) + ' ' + str(int(sweep)) + ' ' + nums(sg[3])
    return out + ('Z' if sub['closed'] else '')
def simplify_d(d, opt, stats):
    absolute_input = not relative_mixed(d)
    pieces = SPLIT.findall(d) if absolute_input else None
    subs = parse(d)
    if absolute_input and len(pieces) != len(subs): pieces = None
    out = []
    for k, sub in enumerate(subs):
        before = endpoints(sub); stats['before'] += before
        raw = pieces[k] if pieces else None
        if sub['arc'] or (not sub['closed'] and not opt.close_open) or (not absolute_input and not opt.relative):
            out.append(raw if raw is not None else emit_exact(sub)); stats['after'] += before; stats['kept'] += 1; continue
        P = sample(sub, opt.step)
        xs, ys = P[:, 0], P[:, 1]
        if len(P) >= 3 and abs(area(P)) < opt.min_area and max(xs.max() - xs.min(), ys.max() - ys.min()) < opt.min_box:
            stats['dropped'] += 1; continue
        curves = simplify_sub(sub, opt.tol, opt.step, opt.corner)
        if not curves or len(curves) + 1 >= before:
            out.append(raw if raw is not None else emit_exact(sub)); stats['after'] += before; continue
        out.append(emit_curves(curves)); stats['after'] += len(curves) + 1
    return ''.join(out)

def relative_mixed(piece):
    return bool(re.search(r'[a-y]', piece.replace('e', '')))

def walk(node, opt, stats):
    if isinstance(node, dict):
        for key in ('d', 'sourcePath'):
            if isinstance(node.get(key), str) and node[key]:
                node[key] = simplify_d(node[key], opt, stats)
        if isinstance(node.get('dParts'), list) and not node.get('d'):
            parts = node['dParts']; lim = max(len(p) for p in parts) if parts else 60000
            new = simplify_d(''.join(parts), opt, stats); chunks = []; cur = ''
            for s in SPLIT.findall(new):
                if cur and len(cur) + len(s) > lim: chunks.append(cur); cur = ''
                cur += s
            if cur: chunks.append(cur)
            node['dParts'] = chunks or ['']
        for c in node.get('children') or []: walk(c, opt, stats)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--tol', type=float, default=0.8); ap.add_argument('--step', type=float, default=0.5)
    ap.add_argument('--corner', type=float, default=55, help='turn angle (deg) kept as a corner')
    ap.add_argument('--min-area', type=float, default=6); ap.add_argument('--min-box', type=float, default=3)
    ap.add_argument('--close-open', action='store_true', help='fills close open subpaths implicitly; refit them as closed')
    ap.add_argument('--relative', action='store_true', help='also refit subpaths written with relative commands')
    ap.add_argument('--path', default='vector.root', help='dotted path to the vector root(s) to simplify')
    opt = ap.parse_args()
    a = json.load(open(opt.src)); stats = {'before': 0, 'after': 0, 'dropped': 0, 'kept': 0}
    for target in opt.path.split(','):
        node = a
        for k in target.split('.'): node = node[int(k)] if k.isdigit() else node[k]
        walk(node, opt, stats)
    json.dump(a, open(opt.out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps({'file': opt.src.split('/')[-1], **stats, 'ratio': round(stats['after'] / max(1, stats['before']), 3)}))

if __name__ == '__main__': main()
