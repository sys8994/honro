"""Stage44 underside: reuse the approved Gwirim root body (stage45-root-body.json)
as the root mass that the Stage44 root plate rests on.

Only paint changes: fills are mapped to the Stage44 root-exterior brown family by
luminance rank (kept on the darker side: it sits in the plate's shadow), and a
clip keeps every pixel below the plate's walking line so the upper lattice holes
still show the far image. Geometry is unchanged. Collision: none.

python3 tools/act5/build-stage44-underside.py
"""
import json, pathlib, copy
ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT/'shared/assets/environment/act5/stage45-root-body.json'
OUT = ROOT/'shared/assets/environment/act5/stage44-underside.json'
# stage45 colour -> existing stage44 root-exterior colour
PALETTE = {
 '#332a3c':'#2c231c','#3a2a39':'#2c231c','#412e40':'#352f27','#402e3e':'#352f27',
 '#483445':'#352f27','#523a4c':'#4a392c','#583e51':'#4a392c','#5c4155':'#524635',
 '#68495a':'#524635','#6d4d62':'#6c4e38','#8d666a':'#6c4e38','#947787':'#6c4e38',
 '#ba8979':'#916948','#a9959d':'#916948',
}
# Source-unit clip (this asset's own coordinates): everything below LIMIT_Y.
# Placement (act5-world.mjs) puts the source's natural wavy top (y≈520) at world y≈2250, so it stays a natural edge west of the plate; the clip (y≥460, world≈2058) only removes the source tree, hidden behind the plate under the walking line, under the
# Stage44 walking line (~2000) and above the plate's underside.
def build(limit_y):
    a = json.loads(SRC.read_text())
    out = copy.deepcopy(a)
    seen = set()
    def walk(n):
        if isinstance(n, dict):
            f = n.get('fill')
            if f:
                if f not in PALETTE: raise SystemExit('unmapped fill '+f)
                n['fill'] = PALETTE[f]; seen.add(f)
            for c in n.get('children') or []: walk(c)
    walk(out['vector']['root'])
    x, y, w, h = out['vector']['viewBox']
    out['vector']['clips']['stage44-under-limit'] = [f'M{x-10} {limit_y}H{x+w+10}V{y+h+10}H{x-10}Z']
    out['vector']['root'] = {'tag':'g','clipPath':'stage44-under-limit','children':[out['vector']['root']]}
    out['id'] = 'act5:under:44'; out['name'] = '귀림의 첫 밤 · 하부 뿌리'
    out['collision'] = []; out['sockets'] = []
    out.setdefault('params', {})['derivedFrom'] = {'asset':SRC.name,'paletteMap':PALETTE,'clipFromSourceY':limit_y}
    return out

if __name__ == '__main__':
    import sys
    limit = float(sys.argv[1]) if len(sys.argv) > 1 else 460.0
    OUT.write_text(json.dumps(build(limit), ensure_ascii=False, separators=(',',':')))
    print('wrote', OUT, OUT.stat().st_size)
