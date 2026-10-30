# Stage39 upper-east stone ledge — native source candidate

Scope: replace only `a4-39-east-upper` and `s39-density:rock-east` visual reference. No bank, timber route, residents, events, water or main-world changes.

## Source chain
- `gameplay-skeleton.svg/png`, `protected-anchors.json`: exact original rising-left / flat-right route,50-world thickness.
- `prompt.txt`, `concept.png`, `source-receipt.json`: generated full-profile concept; stage33 reference is style only.
- `ledge-source.svg`: actual native Inkscape8-color trace, Smooth/Stack/Remove-background ON, speckles2, corners1, optimize0.2. Seven path layers plus embedded reference retained.
- `palette.svg`: quiet blue-dawn role palette, native paths unchanged.
- `final.svg`: absolute Bézier control-point quantization grid0.02, maximum displacement0.014143 source pixels (convex-hull bound). Raw trace immutable. Imported asset shrinks106,698→79,839 bytes. No runtime budget change.
- `contour.json`: native outermost traced path sampled at≤2sourcepx; bounded curve flatten0.08sourcepx, monotone upper/lower envelopes simplified≤0.18world. Two continuous anchor-preserving affine fits, not repeated tiles or a generic flat strip.
- `world-asset.json`: renderable seven native layers, source-derived silhouette clip and matching collision. Unreferenced bitmap never enters runtime.

## Geometry contract
Exact route anchors `(4600,1790)`, `(5300,1720)`, `(6000,1720)` retained. Original platform ribbon becomes explicit solid polygon with **oneWay=true**, rock, unbreakable unchanged. This allows the authored underside to match the terrain body rather than leaving an old rectangular body behind it.26 top /66 bottom vertices; maximum top slope0.254364; maximum thickness50.554 world. Lower boundary traverses strictly right→left; actual compiled polygon has exactly25 upward support edges, all on the top. No accidental underside landing ledges.

`terrain-delta.json` contains original and changed authoring geometry, actual compiled polygon/support edges, unchanged gameplay-field assertions. `integration.json` is the scoped handoff; do not replace a newer full project with the ignored candidate snapshot.

## Reproduce
```
PYTHONPATH=/tmp/cave-python-deps python tools/stage39-upper-ledge-v4/derive.py
python tools/vector-production/quantize-svg.py art/stage39-upper-ledge-v4/palette.svg --output art/stage39-upper-ledge-v4/final.svg --grid .02
python tools/vector-production/import-svg.py art/stage39-upper-ledge-v4/final.svg --config art/stage39-upper-ledge-v4/import-config.json --output art/stage39-upper-ledge-v4/source-asset.json
node tools/stage39-upper-ledge-v4/assemble.mjs
```
Assembler currently requires frozen `_local/reports/stage39-upper-ledge-v4/base-project.json`; durable scoped terrain/asset delta is independent of this ignored test fixture.

Status: native source and static geometry checks complete; actual scene visual and gameplay checks pending. Not a release approval.
