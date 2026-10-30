# Native common-art pilot v1 — rejected optimization candidate

The actual native Inkscape trace and concept are immutable. `raw-vector-only.svg`
removes only the linked image and editor namedview. No image element is in any
runtime asset. Semantic extraction assigns every complete contour to exactly one
of four reviewed, non-overlapping object regions; nothing is cropped or redrawn.
Raw SVGs retain the traced winding and palette. Anchors/feet are provisional
sheet-box metadata, not verified game support contacts. Nothing is integrated.

## Result

**Do not deploy these candidates.** All four reduced candidates fail declared
feature fidelity gates. Source art already has an obvious pale exterior fringe,
excessive grass/texture flecks, and baked water in the foreground object. Viewed
at 600 CSS px each, the pale outline remains clearly visible on blue-gray.
Recommend a simpler new concept/native trace rather than more destructive tuning.

- Trial A: 0.01-unit control-point quantization + exact-shape Skia partitions.
  15–19 runtime nodes, ~420–528 KiB per asset. Mean RGB difference ~0.025/255,
  but strict whole-object feature gates fail. Representation optimization only.
- Trial B: bounded curve flatten .10 + topology-preserving GEOS simplify .25 +
  coordinate grid .10 source units, then partition. No contour deletion by area.
  SVG 191–229 kB; runtime 189–227 kB, still above provisional 100 kB target.
  Expanded commands **increase** from 9,915–13,187 to 16,192–20,808 (polylines):
  smaller bytes are not fewer geometric nodes or proof of cheaper rendering.
- All runtime candidates validate with zero errors against existing renderer.
  Renderer path/node/depth budgets are unchanged. See optimization-report.json.
- Trial B uses 600 CSS px individual width, 2× and 4× supersampling (not zoom).
  Maximum measured silhouette CSS offsets across samples: cliffpine 1.00,
  foregroundreedrock 4.123, overhangpine .50, reedsteps 1.118.
  Protected major reed-head/pine-junction RGB/color-boundary gates fail; one
  reedsteps protected silhouette sample also fails .5 CSS px. Raster boundary
  aliasing explains sampling variation, not permission to drop failing samples.
  Actual placement/scaling and in-game play QA have **not** been verified.

`review-600css.png` shows raw left and actual existing vector renderer right on
blue-gray. This is diagnostic review evidence, not art approval. Both trials'
metrics and reproducible configs are retained; root owns final visual decision.

## Reproduce

Requires existing NumPy, SciPy, Pillow, svgpathtools, @napi-rs/canvas plus Shapely.
The session installed Shapely into `/tmp/honro-pilot-python` (normal home install
was read-only); this is an offline build dependency, never a game dependency.

```
python tools/act4-pilot-native/extract.py
# Trial A for each objects/<name> directory D:
python tools/vector-production/quantize-svg.py "$D/raw.svg" --output "$D/quantized.svg" --grid .01
python tools/vector-production/partition-svg.py "$D/quantized.svg" --output "$D/optimized.svg" --tile-limit 45000
python tools/vector-production/import-svg.py "$D/optimized.svg" --config "$D/asset-config.json" --output "$D/asset.json"
python tools/vector-production/compare-svg.py "$D/raw.svg" "$D/optimized.svg" --config "$D/compare-config.json" --output-dir "$D/qa"
# Trial B:
PYTHONPATH=/tmp/honro-pilot-python python tools/act4-pilot-native/reduce.py
bash tools/act4-pilot-native/compare-reduced.sh
python tools/act4-pilot-native/report.py
```

Comparators return 2 on fidelity rejection, as intended. Full-resolution QA PNGs
are reproducible and kept local; compact composite + JSON evidence are versioned.
