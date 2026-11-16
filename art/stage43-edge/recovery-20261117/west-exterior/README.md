# Stage 43 west-only narrow outpaint study

NOT APPROVED; isolated study only. No shared production files or remote branches changed.

## Outcome
- Built-in image generation produced a narrow continuation of the original curved blue-gray western rock face, not the previously rejected broad angular mountain/shelf.
- Original source: `/workspace/scratch/0b8c8f8d81c7/stage43-recovery/art/stage43-edge/source.svg`, SHA256 `d024022a56991bc56e6d507698a6683c11d47915984dfcf2ca02b936c1d927b4`.
- `west-reference.png` is a native Inkscape rendering of the original at area -200,0..450,760. It is not a replacement source.
- Registration uses uniform 650/1160 scale, x translation -200. Three masonry anchors have residual <=1 generated pixel, NCC .916..993. See registration.json.
- `extract-native.py` uses native Inkscape intersection/difference to keep generated paint ONLY outside original alpha, limited to west x-100..100 and y250..724. All original source SVG children are copied unchanged on top.
- Palette is mapped to the existing original blue-gray paints. No moss or new architectural objects are introduced in the strip.
- Original opaque pixel comparison: 502,389 opaque pixels, zero changed in the native SVG comparison. Only exterior and antialiased edge pixels change.

## Files to inspect
- `original-native.png` / `composed-native.png`: identical source-coordinate SVG render and comparison.
- `composed-native.svg`: editable native full-source comparison, new exterior behind unmodified source.
- `exterior-native.svg`, `exterior-optimized.svg`, `exterior-mask.svg`: actual Inkscape Boolean and optimized vector products.
- `asset.json`: isolated existing-schema BODY import, approximately 22.9KB, no collision, silhouette underpaint off; not wired into production.
- `native-scene/stage-43-west.png`: production Native Canvas diagnostic with this strip as BODY and old west/east joins removed. Actual Scene battle-state purity passed. This is not browser gameplay.

## Quality limits
The broad false-platform ridge is absent and the original tree, roots, double arches, support rock and floor remain intact. However, the join still reads as a thin long border between the original face and the new narrow vertical face. Its bottom terminates as a small rounded protrusion below the original floor. Neither artifact is certified acceptable. The strip is only a west-side study; it does not resolve the original y710 bottom cut, support the entire stage, or cover minimum-zoom deep cameras. Native Scene therefore intentionally shows open background below the untouched bottom floor. Do not deploy this candidate as a whole foundation.

A failed initial diagnostic invocation omitted required positional argument43 and stopped before rendering; the corrected invocation completed with exit0. No browser, mobile, FPS, build, Pages or remote checks were attempted.

## Numeric checks
Actual Inkscape1.4 color trace: 12,false,true,false,4,0,0. Alpha trace:2,false,false,true,0,0,0.1. Narrow Boolean output2519 segments; optimizer epsilon0.5 produced1157 segments, kept49 subpaths/12 paths, accepted at render widths650 and1300. Mean channel error <=0.0000336, changed fraction <=0.0001802. Numeric acceptance is not art approval. See trace-v1/trace.json and exterior-optimized.svg.report.json.

## Prompt (built-in imagegen)
Edit the original western crop only. Preserve tree, roots, both stone arches, every masonry block, original rocks and lower stone floor at the same positions. Add only a narrow irregular vertical blue-gray rock continuation immediately outside the left edge, beside the middle/lower cliff, maximum8% image width. Taper to nothing under the roots, broaden slightly near bottom, finish just below existing floor. Match original rounded elongated formations and flat muted navy/slate planes. No broad horizontal tops, platforms, shelves, stairs, giant mountain, repeating crystalline slabs, gradients, glow, blur, noise, added moss or objects. Transparent background. Keep every original opening.

## Follow-up seam alpha check
723 rows tested at original source y250..710. 235 rows contain partially transparent connector pixels, so the thin border is not certified to be only original shading. One 1px fully transparent sample occurs at the bottom connection, source y709.03 and x~16. See seam-alpha-check.json. This remains recorded, not micro-edited, pending deep BODY composition. No geometry/paint changes were made after parent asked to hold the lower tip.

## Reproduction
- Run `python extract-native.py /absolute/repo/art/stage43-edge/source.svg` from this retained study folder, after preserving an earlier output if keeping versions. The two immutable raw traces in trace-v1 are inputs.
- Trace settings and source hash are in trace-v1/trace.json; repeat the repository tools/stage43-edge/trace-continuous.py with HONRO_TRACE_COLORS=12 if a new raw trace is needed. Never overwrite a mismatching raw trace.
- Optimizer and import commands follow the paths recorded in exterior-optimized.svg.report.json and config.json; asset.json explicitly disables BODY silhouette underpaint.
- Diagnostic: set HONRO_REPO=/absolute/repo, HONRO_BODY_FILE=/absolute/study/asset.json, HONRO_NATIVE_OUT=/absolute/study/native-scene, HONRO_VIEW=west; run `node --expose-gc capture-west.mjs 43`. This removes only diagnostic west/east legacy joins before rendering; it does not modify production files.
