# Stage17 near-terrain review

## Revision 3: browser-discovered material scale correction (2026-11-02)

The earlier broad-face material was rejected after CI41504096815 actual browser inspection: the floor/outer domain became almost featureless giant slabs. Its earlier native approval is superseded. Geometry was not the defect; material hierarchy was.

Existing image-derived west/east/domain silhouette sheets were edited with imagegen, then traced in actual Inkscape using seven sober charcoal/grey tones. Source sheets and direction checkpoint live in `art/act2-near-vector-candidates/stage17-geology-v3`. Canonical cave-rock hosts, physical boundaries, four-unit contact inset, actor height92, machinery/wood, mutable gate, story, far background and camera remain unchanged. No manually invented terrain polygons or repeated texture tiles.

## Three focused visual rounds

1. `_local/reports/stage17-v3-iteration1`: entry/overview/mobile at actual actor scale. Smaller contact fractures and deeper interlocking planes replace empty slabs. Quantization speckles remained; not final.
2. `_local/reports/stage17-v3-iteration2`: actual Inkscape speckle threshold90 (source-pixel components, not error threshold) removes isolated patches; contact fracture hierarchy and seven-tone palette retained. Inspected overview/west/left edge. Immutable authored RAW established after this source-to-trace cleanup.
3. `_local/reports/stage17-v3-iteration3`: bounded optimized candidate, inspected east/lower/right edge. Wood, machinery and thin contact contours remain readable; no rectangular local overlay seams. Quiet deep faces remain subordinate to contact detail, not giant pale parallel bands.

The first final extreme-bottom view in `_local/reports/stage17-v3-final-extended` was rejected as too sparse. A second image-derived outer source restored continuing geology. Its actual Inkscape isolated-component cleanup is300 source pixels (locals90); these are source authoring choices, not relaxed RAW/final error thresholds. Final edge/ceiling/bottom/maxzoom/mobile-bottom views are `_local/reports/stage17-v3-final-review`. Larger dark deep-domain facets remain intentional; contact-scale detail stays in local authored overlays. RAW/final protected comparison uses the same production Scene and source density at1×/2×; criteria unchanged. Exact results and acceptance are recorded with final packaged hashes, not inferred from these notes. Browser/gameplay/Pages verification remains the integration owner's responsibility.

## Scope and retained limitations

This is a static rock material correction, not whole-stage fun or normal-play completion. Original floating authored rock islands/support paths and NPC/enemy silhouettes remain unchanged. Native portrait framing crops some party members as before; no camera change is hidden in this correction. Small connected tonal patches from image tracing are not all removed, since erasing every variation would destroy fracture hierarchy. No new raster terrain runtime assets.

## RAW registration and budget

The refined outer RAW exceeds one existing240000-character compound limit. Lossless token packing plus bbox-disconnected grouping registers it for native reference rendering: every parsed contour equals its original; all overlapping/nested contours remain in the same fill. This changes neither silhouettes nor hole topology. The final bounded optimizer remains measured against that unchanged RAW geometry. Runtime budgets are untouched; no GEOS approximation or failed Skia partition is shipped. RAW registration input, split output and hash-bound report accompany the final package.

## Measured final candidate

All three composed1×/2× comparisons pass unchanged thresholds. RAW1679371bytes → final894226bytes (46.7523% smaller). Largest RGB MAE0.022474/255; protected changed fraction0 for every view. Native final source parity reports geometry unchanged. Final entry/overview/ceiling and mobile-bottom inspected; no tiled seams or altered wood/gate. Far-right maxzoom atx11500 is outside11200 play width and remains visibly coarser outer-only material; deep bottom likewise uses larger quiet geology. These limits were explicitly sent to the integration owner for final visual disposition, not disguised as approved gameplay.
