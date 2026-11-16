# Stage43 whole-support study (NOT APPROVED)

This is an isolated authoring checkpoint, not the production foundation or a
release. Original architecture paint/coordinates are preserved separately with
`../foreground-preservation-mask.svg`. Collision, actors, saves and objectives
are not changed. Current remaining defects: large nonwalkable rock faces and
mismatched occlusion at some original masonry feet. Do not publish as approved.

## Provenance

- Saved concept: `../concept-seam-deep-v1.png`, SHA256
  `32da6ad6b97ea78642a2a654951a09c9d4d7e6332a1986ebabdb2e6a1851d240`.
- Native Inkscape trace: 8 scans, smooth false, stack true, remove-background
  false, speckles 4, corners 0, optimize 0. Original trace is immutable.
- One uniform source mapping: scale 6.5, translate (-3000,-4700). No repeated
  textures, nonlinear stretching or different side/depth panels.
- Exterior route follows native color boundaries in raw y730..830, x215..1042,
  with low-ridge preference; 97.80% native edge length, 36 dark gap connections,
  maximum gap 1.934 raw pixels, maximum permitted 2.0. Gap max luminance55,
  mean45; no moss crossings. Native boundary y773.102..829.118.
- Alpha is this geological domain union original mainA, intersect the existing
  [-1600,0,5372,3451] domain, minus original enclosed apertures only. External
  space around the old silhouette is not cut out as a false void.
- Original distinct trace tone bands are retained with a subdued 8-entry palette,
  rather than flattening several shades into one large face. Light/moss bands
  map to #37475c/#253849/#304058; remaining bands to #27374e/#1e2d42/#162338.
- Native color paths were optimized once at epsilon1.1, then intersected with the
  existing viewBox to discard unseen geometry. Native4x4 compound partitioning
  and absolute0.1 point compaction retain painter order, closed contours and
  maximum endpoint error0.070711. No path/node budget was raised.

## Reproduce the derived asset

From repository root:

    python tools/vector-production/import-native-clip.py art/stage43-edge/whole-support-review/color.svg art/stage43-edge/whole-support-review/alpha.svg --config art/stage43-edge/whole-support-review/config.json --output <isolated-output>/asset.json
    python tools/stage43-edge/derive-preserved-foreground.py --output <isolated-output>

The foreground vector is authoring `sourcePath` data. For diagnostic runtime only,
`capture-candidate.mjs` applies its clip A to the original compiled vector; it does
not replace original paint. No gameplay code is part of this checkpoint.

## Verified scope and limits

Native production Scene has unchanged gameplay SHA256
`5010609ff55f6623fa522911bf5e37970b9ef10ff1d683f56507eef784dba538`.
Desktop general/left/right/minimum-zoom and390x844 mobile minimum-zoom show no
exposed outer/bottom rectangle. This does not certify untested viewport sizes.
The viewBox cull reduces compiled BODY from2,207,678 to754,151 bytes. Same-camera
1440x900 Scene comparison: mean channel error0.000823/255, maximum5/255,
0 pixels over8/255 among1,296,000 pixels. It is rasterization-equivalent, not a
new art approval. Native performance is not browser FPS; public play is untested.

Original contact-rock patches were rejected as visibly pasted/flat. Whole new
native face occluders were also rejected when they covered a walkway or too much
masonry. A bounded native-fracture occlusion study remains separate and unadopted.
