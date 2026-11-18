# V3 actual Chrome: reject the post-RGB correction

Source-only experiment commit06c1474630d4f603714fefcff7ecb4dd15a12d43. CI44221871810 finished failure. Artifact14390428678, ZIP SHA256020da9f539f13621b8e56ef4360782e7d863ddb41b5b126f50c86f7c1ee42ecb.

Native/source/provider/codec/state/cache checks and all six Chrome captures passed. Independent compare failed at the explicit left measurable-change gate: changed0. All three candidate PNG hashes equal the registered production baseline exactly, including1.65 genuine-grass closeup. Thus the V2 unrelated RGB regression from changed stripe boundaries is removed, but the conservative raw-path guard suppresses every intended correction. This is not a visual pass. Direct left-image review confirms the central thin contour remains.

Additional narrow initial processing: left2.6ms, walk5.2ms, closeup9.3ms; all eligible0/changed0. Two extra canvases and readbacks provide no benefit. Same-run left cold p50 baseline119.9→118.3ms, panmax63.7→65.9; walk143.7→148.6, pan66.5→67.1. Small cold noise is not an optimization claim. Whole-helper peak logical bytes9,450,496 /9,495,072 /34,664,264. Historical24MiB SS scratch+readback cap remains unchanged and passed; whole-helper totals are separate telemetry, excluding Scene/GPU/runtime heaps.

Decision: reject V1/V2/V3 post-RGB narrow correction for production. Do not loosen protections, remove efficacy tests, or keep iterating ROI patches. Retain production SS2+emptystripe unchanged. Full-stage residual art and performance remain incomplete.

## Different next unit: source-native occlusion topology

This is a design proposal, not implemented or proven. Keep original25paths, source alpha and physics untouched. Create an explicit derived paint-only occlusion/clip asset for one nonwalk internal rock/grass junction, separating genuinely visible grass from buried grass. Render the rock material coverage once instead of repairing final RGB or repeatedly sampling the same stack. Prefer author-time normalized geometry and normal Canvas path operations; no runtime point sampling/readback or higher SS factor.

Do not assume an automatically subtracted Boolean path is authoritative: V2's thin protected path1 miss shows why an independent original-shape audit is required. Preserve visible grass including its AA footprint, roads, original holes/exterior and alpha. Do not globally recolor source palettes or erase allgrass paths. Original paint descriptors remain immutable; derived assets must declare original path hashes and which buried nonwalk paint region they exclude.

First prototype must target one complete meaningful seam, not sparse pixels. Gates: original source/physics hashes; zero alpha/outside-domain/road/visible-grass drift in actual Chrome; independent original-path ownership and high-resolution boundary tests; actual fullview+zoom closeups proving a meaningful line reduction; no-op/cache/clear/unsupported-state checks; same-run cold/pan/memory against current production. Geometry Boolean point samples alone are not analytic proof. If the prototype cannot preserve the legitimate grass AA boundary while solving a complete seam, reject it before extension. Only after a convincing small result expand to seven registered views and build/save/play regressions.
