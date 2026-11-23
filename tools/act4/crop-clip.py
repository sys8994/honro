"""Crop a clip silhouette to the window it actually shows (union of window boxes).

Outside the window the clip has no visible effect, so only the boundary
inside the window is kept; curves are flattened at `--step` and simplified at
`--tol` (clip-local units). Subpaths are combined even-odd (traced silhouettes
keep holes as separate subpaths).

usage: crop-clip.py IN.json OUT.json   IN = {"clip":[d...], "windows":[[x0,y0,x1,y1],...], "step":.5, "tol":.2}
"""
import json, sys, importlib.util, pathlib
from shapely.geometry import Polygon, box, MultiPolygon
from shapely.ops import unary_union
from shapely.validation import make_valid
from shapely.geometry.polygon import orient

spec = importlib.util.spec_from_file_location('sv', pathlib.Path(__file__).parents[1] / 'act5' / 'simplify-vector.py')
sv = importlib.util.module_from_spec(spec); spec.loader.exec_module(sv)

def geom_of(ds, step):
    g = None
    for d in ds:
        for sub in sv.parse(d):
            if sub['arc']: raise SystemExit('arc in clip')
            P = sv.sample(sub, step)
            if len(P) < 3: continue
            p = make_valid(Polygon(P))
            if p.is_empty: continue
            g = p if g is None else g.symmetric_difference(p)
    return g

def rings(geom):
    polys = [geom] if geom.geom_type == 'Polygon' else [x for x in getattr(geom, 'geoms', []) if x.geom_type == 'Polygon']
    for p in polys:
        p = orient(p, 1.0)  # exterior/holes opposite winding: correct under nonzero clipping too
        yield p.exterior.coords
        for r in p.interiors: yield r.coords

def main():
    a = json.load(open(sys.argv[1])); step = a.get('step', .5); tol = a.get('tol', .2)
    g = geom_of(a['clip'], step)
    win = unary_union([box(*w) for w in a['windows']])
    out = make_valid(g.intersection(win)).simplify(tol, preserve_topology=True)
    parts = []
    for r in rings(out):
        pts = list(r)[:-1]
        if len(pts) < 3: continue
        parts.append('M' + sv.nums(pts[0]) + ''.join('L' + sv.nums(p) for p in pts[1:]) + 'Z')
    chunks, cur = [], ''
    for s in parts:
        if cur and len(cur) + len(s) > 59000: chunks.append(cur); cur = ''
        cur += s
    if cur: chunks.append(cur)
    eps = sum(len(list(r)) - 1 for r in rings(out)) if not out.is_empty else 0
    json.dump({'clip': chunks or ['M0 0Z'], 'endpoints': eps}, open(sys.argv[2], 'w'))
    print(json.dumps({'endpoints': eps, 'chunks': len(chunks)}))

if __name__ == '__main__': main()
