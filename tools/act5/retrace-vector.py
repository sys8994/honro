"""Order-of-magnitude node reduction for traced native terrain art by region re-tracing.

Input: the asset JSON and a PNG of its fill leaves rendered without clips
(tools/act5/retrace-render.mjs, K px per source unit). Every opaque pixel is
labelled with the nearest original fill colour; colour regions are smoothed with
a majority filter, regions smaller than `min_px` merge into their surroundings,
and each colour is traced back as one even-odd path (Schneider fit, `tol` px).
Colours keep the original paint order and are dilated by `overlap` px inside the
opaque area so neighbouring colours never open seams. The asset's clips (the
silhouette / protection) and the tree structure above the leaves are unchanged.

usage: retrace-vector.py ASSET.json RENDER.png OUT.json --k 1 --radius 2 --min-px 150 --tol 1.2
"""
import argparse, json, math, sys, importlib.util, pathlib
import numpy as np, cv2
from scipy import ndimage

spec = importlib.util.spec_from_file_location('sv', pathlib.Path(__file__).with_name('simplify-vector.py'))
sv = importlib.util.module_from_spec(spec); spec.loader.exec_module(sv)
def _fmt1(v):
    t = f'{v:.1f}'.rstrip('0').rstrip('.'); return '0' if t in ('-0', '') else t
sv.fmt = _fmt1  # 0.1 source unit (0.4 world unit at Stage46) is below any rendered pixel
PART_CHARS = 59000  # renderer limit per compound part is 60000

def hex2rgb(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)

def leaves_of(node, out):
    if isinstance(node, dict):
        if node.get('tag') == 'path' and node.get('fill'): out.append(node)
        for c in node.get('children') or []: leaves_of(c, out)
    return out

def leaf_parent(root):
    """The group whose children are the fill leaves (deepest group with path children)."""
    best = None
    def walk(n):
        nonlocal best
        if isinstance(n, dict) and n.get('children'):
            if any(c.get('tag') == 'path' for c in n['children']): best = n
            for c in n['children']: walk(c)
    walk(root); return best

def majority(lab, n, r, opaque):
    if r <= 0: return lab
    size = 2 * r + 1; best = np.full(lab.shape, -1.0, np.float32); out = lab.copy()
    for i in range(n):
        s = cv2.boxFilter((lab == i).astype(np.float32), -1, (size, size), normalize=False, borderType=cv2.BORDER_CONSTANT)
        m = s > best; out[m] = i; best[m] = s[m]
    out[~opaque] = -1; return out

def merge_small(lab, n, min_px, opaque, per_label=None):
    for _ in range(3):
        small = np.zeros(lab.shape, bool)
        for i in range(n):
            cc, k = ndimage.label(lab == i)
            if k == 0: continue
            sizes = ndimage.sum(np.ones_like(cc), cc, index=np.arange(1, k + 1))
            lim = per_label[i] if per_label is not None else min_px
            tiny = np.r_[False, sizes < lim]
            small |= tiny[cc]
        if not small.any(): break
        valid = opaque & ~small
        _, (iy, ix) = ndimage.distance_transform_edt(~valid, return_indices=True)
        lab = np.where(small, lab[iy, ix], lab)
    lab[~opaque] = -1; return lab

def smooth_ring(P, w):
    if w <= 1 or len(P) < 2 * w + 3: return P
    k = np.ones(w) / w
    ext = np.vstack([P[-w:], P, P[:w]])
    xs = np.convolve(ext[:, 0], k, 'same')[w:-w]; ys = np.convolve(ext[:, 1], k, 'same')[w:-w]
    return np.column_stack([xs, ys])

def trace(mask, k, vx, vy, tol, corner, min_contour_px, smooth):
    cs, hier = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []; n = 0
    for c in cs:
        if len(c) < 4 or cv2.contourArea(c) < min_contour_px: continue
        P = c[:, 0, :].astype(float) + 0.5
        P = smooth_ring(P, smooth)
        # thin to roughly 1px steps, then fit as a closed ring
        sub = {'start': tuple(P[0]), 'segs': [('L', tuple(P[i - 1]), tuple(P[i])) for i in range(1, len(P))] + [('L', tuple(P[-1]), tuple(P[0]))], 'closed': True, 'arc': False}
        curves = sv.simplify_sub(sub, tol, 1.0, corner)
        if not curves: continue
        curves = [np.array([[x / k + vx, y / k + vy] for x, y in cv]) for cv in curves]
        text = sv.emit_curves(curves); t2 = tol
        while len(text) > PART_CHARS:
            t2 *= 1.5; curves = sv.simplify_sub(sub, t2, 1.0, corner)
            curves = [np.array([[x / k + vx, y / k + vy] for x, y in cv]) for cv in curves]; text = sv.emit_curves(curves)
        out.append(text); n += len(curves) + 1
    return ''.join(out), n

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('asset'); ap.add_argument('png'); ap.add_argument('out')
    ap.add_argument('--k', type=float, default=1); ap.add_argument('--radius', type=int, default=2)
    ap.add_argument('--min-px', type=int, default=150); ap.add_argument('--tol', type=float, default=1.2)
    ap.add_argument('--corner', type=float, default=70); ap.add_argument('--overlap', type=int, default=1)
    ap.add_argument('--smooth', type=int, default=3); ap.add_argument('--chunk', type=int, default=60000)
    ap.add_argument('--root', default='vector.root')
    ap.add_argument('--merge-dist', type=float, default=0)
    ap.add_argument('--bright-count', type=int, default=0, help='lightest N colours (highlight rims) use --bright-min-px')
    ap.add_argument('--bright-min-px', type=int, default=0)
    o = ap.parse_args()
    a = json.load(open(o.asset))
    vec = a
    for key in o.root.split('.')[:-1]: vec = vec[key]
    root = vec[o.root.split('.')[-1]]
    vx, vy = vec['viewBox'][0], vec['viewBox'][1]
    leaves = leaves_of(root, [])
    before = 0
    for l in leaves: before += sum(sv.endpoints(s) for s in sv.parse(l.get('d') or l.get('sourcePath') or ''.join(l.get('dParts') or [])))
    order = []
    for l in leaves:
        if l['fill'] not in order: order.append(l['fill'])
    pal = np.array([hex2rgb(f) for f in order])
    img = cv2.imread(o.png, cv2.IMREAD_UNCHANGED)
    rgb = img[:, :, 2::-1].astype(np.float32); alpha = img[:, :, 3]
    opaque = alpha >= 128
    best = np.full(alpha.shape, np.inf, np.float32); lab = np.zeros(alpha.shape, np.int32)
    for i, c in enumerate(pal.astype(np.float32)):
        dist = ((rgb - c) ** 2).sum(-1); m = dist < best; lab[m] = i; best[m] = dist[m]
    del rgb, best; lab[~opaque] = -1
    # optional tone merge: a colour within merge_dist (RGB) of a more common
    # colour is repainted with it (fewer, larger regions; same palette entries)
    if o.merge_dist > 0:
        counts = np.bincount(lab[lab >= 0].ravel(), minlength=len(order))
        target = list(range(len(order)))
        for i in np.argsort(counts):
            near = [j for j in range(len(order)) if j != i and counts[j] > counts[i] and np.linalg.norm(pal[i] - pal[j]) <= o.merge_dist]
            if near: target[i] = min(near, key=lambda j: np.linalg.norm(pal[i] - pal[j]))
        for _ in range(len(order)):
            target = [target[t] for t in target]
        lut = np.array(target + [-1], np.int32); lab = lut[lab]
        merged = {order[i]: order[t] for i, t in enumerate(target) if t != i}
    else: merged = {}
    lab = majority(lab, len(order), o.radius, opaque)
    lum = pal @ np.array([.299, .587, .114])
    bright = set(np.argsort(-lum)[:o.bright_count]) if o.bright_count else set()
    per = [o.bright_min_px if i in bright else o.min_px for i in range(len(order))]
    lab = merge_small(lab, len(order), o.min_px, opaque, per)
    kern = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * o.overlap + 1, 2 * o.overlap + 1))
    new_leaves = []; after = 0
    for i, fill in enumerate(order):
        m = (lab == i)
        if not m.any(): continue
        if o.overlap: m = cv2.dilate(m.astype(np.uint8), kern).astype(bool) & cv2.dilate(opaque.astype(np.uint8), kern).astype(bool)
        dstr, n = trace(m, o.k, vx, vy, o.tol, o.corner, 4, o.smooth)
        if not dstr: continue
        after += n
        chunks, cur = [], ''
        for s in sv.SPLIT.findall(dstr):
            if cur and len(cur) + len(s) > o.chunk: chunks.append(cur); cur = ''
            cur += s
        if cur: chunks.append(cur)
        leaf = {'tag': 'path', 'fill': fill, 'stroke': 'none', 'opacity': 1, 'fillRule': 'evenodd', 'lineWidth': 1, 'lineJoin': 'miter', 'lineCap': 'butt'}
        if len(chunks) == 1: leaf['d'] = chunks[0]
        else: leaf['dParts'] = chunks
        new_leaves.append(leaf)
    parent = leaf_parent(root)
    parent['children'] = new_leaves
    a.setdefault('params', {})['nodeRetrace'] = {'tool': 'tools/act5/retrace-vector.py', 'k': o.k, 'radius': o.radius, 'minPx': o.min_px, 'tol': o.tol, 'overlap': o.overlap, 'smooth': o.smooth, 'mergeDist': o.merge_dist, 'brightCount': o.bright_count, 'brightMinPx': o.bright_min_px, 'mergedTones': merged, 'endpointsBefore': before, 'endpointsAfter': after, 'clipsUnchanged': True}
    json.dump(a, open(o.out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps({'file': o.asset.split('/')[-1], 'before': before, 'after': after, 'ratio': round(after / max(1, before), 3), 'leaves': len(new_leaves)}))

if __name__ == '__main__': main()
