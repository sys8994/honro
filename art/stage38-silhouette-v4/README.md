# Stage 38: authored cave-ceiling silhouette candidate

## Scope and authority

This is a ceiling-only candidate, not a completed stage or final art approval. The root reviewer accepted the new boundary direction and requested quieter broad interior contrast. `roof-shallow-final.svg` includes that correction. Existing sky, sea, floor, floor ramps, actors, encounters and events are not redesigned here. Do not replace the main world with the single-stage QA project.

The source `roof-concept-shallow.png` was generated as an isolated transparent blue-dawn cave ceiling, then traced in **actual Inkscape GUI** (Colors, 8 scans, Smooth/Stack/Remove background enabled; speckles 2, corner smoothing 1, optimization .2). `roof-shallow-source.svg` retains both embedded reference and native paths. `roof-shallow-raw.svg` removes only the reference image. Palette changes precede bounded optimization. No procedural polygon drawing is used as the art source.

The earlier `roof-concept.png` / `roof-source.svg` trial was rejected: two large arches excessively altered the low-ceiling shape. The shallow revision asks for unequal medium shoulders and recesses instead. `concept-prompt.txt` records the first generation prompt, not the exact second request.

## Error-bounded optimization versus intentional art editing

`shallow-optimization/report.json` records the raw-relative search. The selected `simplify-0.0003.svg` passes normal and near-scale limits; raw path maximum 117609 characters is reduced below 60000 without changing engine limits. At normal width1732 the boundary maximum is1px; at near width3072 it is1.414px (below the scale-adjusted limit). This is only a candidate-selection test, not a claim of visual approval.

`quiet-interior.py` performs separately declared art editing after direct normal/near/portrait inspection: remove284 small decorative subpaths, remove cosmetic intermediate path3, and lighten broad shadow path2 from #172b3a to #1c3141. It preserves path8, the entire outer boundary. These intentional style changes are **not** claimed error-bounded to the raw trace. `interior-art-edit.json` records them. No facial, sign or gameplay-detail features exist in this isolated asset.

## Visible contour and real collision

`derive-contour.py` extracts the final traced lower silhouette, crops native page-edge rounding at source x2..1553, and maps it along the existing roof profile. It carves upward only; maximum material removal310.849 world units. Existing upper cap, left domain and exact x0/x3300 joins are retained. The final polygon is used by both native solid collision and BODY clipping: source vertices32→198 and compiled playable vertices8→174. All other terrain and gameplay fields are asserted unchanged by `assemble.mjs`.

The first extraction sampling source x1554.99 incorrectly selected the rounded side edge and flattened the right half. It was rejected on image review and fixed before the v2–v5 geometry. Do not reuse the old unversioned candidate.

The authored source is instanced across four affine profile segments. This is fitting an existing authored asset to declared geometry, not inventing decoration in code. The contour approximation tolerance is .65 world units. Main asset `s38-silhouette-v4:ceiling` and recolored outside-domain asset `s38-silhouette-v4:ceiling-domain-left` are isolated from previous IDs.

## Reproduce and integrate

Python requires svgpathtools and Shapely. The active environment used a separate `/tmp/cave-python-deps` target for Shapely. Starting from a frozen pre-change world:

```
node tools/cave-silhouette-v4/prepare-project.mjs
python tools/cave-silhouette-v4/quiet-interior.py
python tools/vector-production/import-svg.py art/stage38-silhouette-v4/roof-shallow-final.svg --config art/stage38-silhouette-v4/roof-shallow-config.json --output art/stage38-silhouette-v4/roof-shallow-asset.json
PYTHONPATH=/tmp/cave-python-deps python tools/cave-silhouette-v4/derive-contour.py
node tools/cave-silhouette-v4/assemble.mjs
node tools/stage38-production/inspect.mjs silhouette-v4-after5 _local/reports/cave-silhouette-v4/candidate-v5.json
```

`candidate-v5.json` was frozen for independent QA before a metadata-only correction to the source-config provenance filenames. Its art/geometry are unchanged by that correction. Never overwrite an immutable tested candidate during integration; generate a new named candidate and checksum if rebuilding.

Integrator should merge only the new assets, changed roof terrain points and matching two element asset IDs from `stage-candidate.json`. Preserve unrelated concurrent work. `candidate-delta.json` contains original/changed source and compiled polygons. Physical roof impact/resident survival and connection Continue checks remain with independent gameplay QA; no final PASS is claimed here.

Actual production nativeScene comparisons are under `_local/reports/stage38-production/silhouette-v4-before` and `silhouette-v4-after5`: normal .53, near .94, portrait, entry, whole, and collision overlays. They use the production renderer, not a mock SVG composition. They do not establish browser HUD or device performance. Before/after/source/portrait were uploaded as native image files for parent delivery.
