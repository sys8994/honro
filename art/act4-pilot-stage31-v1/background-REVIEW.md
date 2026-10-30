# Stage 31 native background — candidate; runtime integration pending

Single full-world rear candidate, 7000 × 4700 world units, anchor (0,0), no collision. Immutable 1529 × 1029 opaque RGB PNG SHA-256 `196b8d285ce791714e7aa36cfb6fd09a2c4317783361d4145a1294437e8bf2f5`; unstacked Colors 8 trace SHA-256 `ce4f2147b116214e693dc80eee385e9c9c6a1d045fefc1a01c6286c2dad7305a`. The linked bitmap is ignored by path extraction. Final asset SHA-256 `807e7ebda3528258ba92ef25ad2f561d7a63c588a5418ba67a1081b26d10adff`, 372,886 bytes, 20 nodes, largest path 33,534 characters; Canvas vector validator errors zero. Prior background candidate was 170,004 bytes; tighter fidelity costs size, though this asset remains below the 632,812-byte native trace. This is not a runtime performance certification.

## Camera contract and geometry

`shared/map/environment.js` defines L1–L5, not L6. The current stage31 candidate assembler puts the background at world origin with scale 1 and its diagnostic renderer uses a plain camera. There is **no verified L6/environment placement contract** for this asset; the following is conditioned on that diagnostic 7000 × 4700 mapping and zooms 0.7 and 1.65. `shared/map/bounds.js` sets max zoom 1.65. Source→world x/y factors are 7000/1529 ≈ 4.57816 and 4700/1029 ≈ 4.56754.

Retained component exteriors were flattened at 0.04 source units and topology-preserving simplified at 0.08; their largest dense-sampled Hausdorff distance to their flattened predecessors is 0.103288 source units. A conservative **sample-based estimate**, adding flatten 0.04, coordinate-rounding √2×0.0005, and 0.05 same-fill stroke reach, is 0.193995 source units: **0.622 CSS px at 0.7** and **1.465 CSS px at 1.65**, using the larger x factor. This is below 1.5 in the stated diagnostic contract, but is not a formal continuous-curve guarantee and has little margin; verify again if placement or zoom changes. Oversized polygons are intersected with adjacent half-planes to meet path limits, without intended area loss. No protected gameplay/contact region is claimed for a background.

**Separate intentional changes:** Disconnected components/holes below 50 source px² are removed/filled (per-layer counts/area in `background-optimization.json`) and opaque native-palette backing plus same-fill 0.1-source-unit stroke reduces seams. These are excluded from retained-exterior distance; neither their loss nor opaque internal seams may be represented as zero geometry error. Source blue HLS lightness/saturation scaled to 80%, warm dawn #c9a39c changed to muted gray-lavender #9b99ac; this previously accepted art direction is not optimization error. Prior alpha silhouette result of 466 px measured vanished internal transparent holes, not mountain contour displacement; it is not a fidelity pass.

**Source-palette crop checks:** `background-css-comparison.json` reports the unchanged-palette native paths and unchanged-palette optimized geometry with matching sky backing at zoom 0.7 and 1.65, 1400 × 900 crops centered at source (1100,340). Mean RGB absolute differences 0.161 and 0.201/255, respectively, include intentional small-feature removals and seam overlap, not palette revision; they are crop statistics, not full-scene or maximum-displacement guarantees. See `/tmp/bg-source-palette-0.7.png` and `/tmp/bg-source-palette-1.65.png` after reproducing; left native, right optimized.

A01–A04: cause was dense, noisy native color trace and internal transparent seams. Do not crop connected full-scene art as modular terrain, hide vector gaps with linked raster, raise error allowances to force a pass, or equate renderer validation with art, physics, or deployment approval. Alternative: preserve original, whole-background image-free unstacked paths, bounded cleanup and exterior evidence at declared scale; no claim of terrain contact, gameplay, or production placement. Pending: final root art review and actual environment placement/camera integration verification.

## Reproduce

Requires numpy, shapely 2.x, svgpathtools and @napi-rs/canvas. Generated SVGs/PNGs are local only.

```sh
python tools/act4-pilot-native/optimize-background.py
BG_SOURCE_PALETTE=1 python tools/act4-pilot-native/optimize-background.py
python tools/vector-production/import-svg.py art/act4-pilot-stage31-v1/background-optimized.svg --config art/act4-pilot-stage31-v1/background-asset-config.json --output art/act4-pilot-stage31-v1/background-asset.json
node tools/vector-production/render-asset.mjs art/act4-pilot-stage31-v1/background-asset.json /tmp/bg-new-overview.png 1400
node tools/act4-pilot-native/background-css-compare.mjs
```
