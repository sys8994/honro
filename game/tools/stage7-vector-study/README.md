# Stage 7 actual VectorArt study, before Scene integration

This test uses the repository's actual `shared/map/vector-art.js`, unchanged, on an attached Canvas with exact bitmap AND CSS dimensions asserted on every draw. It does **not** instantiate HonroScene, inject production assets, alter physics, build public bundles, or deploy. A 1x1/off-DOM canvas cannot pass the checks.

## Conversion contract

`convert.py` reads the canonical original/candidate SVGs already committed in `game/tools/stage7-svg-study/` and authoritative `shared/assets/environment/act1-sites/stage07.json`.

- Runtime supports g/path/use-symbol, 6-value affine transforms, nested native clips, solid paints, and nonzero/evenodd path filling. It does not implement DOM SVG, masks, filters or nested SVG viewports.
- The reviewed SVG's two filters and three masks are unreachable definitions. They are not rendered, not converted, and not implemented in the runtime. Any reachable unsupported element/property fails the adapter.
- Reachable attributes/styles are allowlisted. Multiple-child clipPath is rejected because SVG child union cannot safely become concatenated nonzero winding. Nonzero single-child clips only; clip transforms and clip-rule evenodd fail closed. Twelve negative tests cover these, external references, masks/filters, unknown attrs/styles, nested aspect changes, source path edits and cycles.
- Nested SVG `preserveAspectRatio=none` becomes an explicit affine group plus native viewport clip. Internal use becomes bounded symbols. Rectangles become closed paths. Source-space nonzero complement clips retain their authored path direction. No image, screenshot texture, external href, filter or mask is emitted.
- The original foreground symbol is copied **unchanged from the authoritative native root**, converting only existing sourcePath storage to d. Before doing so, the exported SVG's foreground must equal it after removing transform/style-free identity group wrappers. No path geometry, paints, transform or clipping is normalized away.
- All 13 authored foothold subtrees and their clip definitions must remain deep-equal between the baseline and candidate. Original source clip definitions must equal the repository source.
- No common renderer changes, relaxed limits or new runtime helpers are required by this candidate. Actual `HonroVectorArt.validate` runs unchanged.
- Local validation: original290 expanded nodes/192 paths/depth8; candidate401 nodes/281 paths/depth10. Existing limits512 nodes/depth24 are retained. New paths are below60KB each. These counts are not performance approval.

The included generated JSONs are independent study assets. CI regenerates them from checked-in SVG and native source and writes a source-preservation contract. It never registers them into production.

## Chrome and measurements

`run.mjs` launches installed Chrome with normal sandbox, an isolated profile and loopback CDP. The actual renderer source SHA is recorded. Canvas source-coordinate scale uses exact viewport dimensions; world scale3.13 and equivalent camera scale are recorded. The body keeps semanticLayer BODY / silhouetteUnderpaint false, matching the original authored native body. Source foreground remains path drawing, never rasterized into a whole-stage image.

For original and candidate: five actual renderer views, seven repeated draws, six interleaved fresh-vector prepare/draw pairs, and eight warm-vector pan transforms. Cold prepare times include the actual validator/Path2D preparation on fresh vector objects; repeated/pan reuse prepared vectors but execute actual path drawing. Real performance.now is used, never virtual time. Readback time is included and separately labeled. These are CPU CI microbenchmarks, **not** phone FPS or full Scene performance.

`check.py` applies the same unchanged protection rules to VectorArt-original vs VectorArt-candidate PNGs. This is the primary protection check. SVG-vs-VectorArt images are only cross-engine visual evidence, since AA implementations can differ. It retains strict original-opaque equality, the same explicit gap-footprint boundary, and opaque connected support on both real extended ground bands. It does not change thresholds to accommodate renderer differences.

## Commands

    python game/tools/stage7-vector-study/convert.py
    node game/tools/stage7-vector-study/validate.mjs
    CHROME_BIN=/path/to/chrome node game/tools/stage7-vector-study/run.mjs
    python game/tools/stage7-vector-study/check.py

## Next gate, NOT covered here

Only after this native renderer A/B passes should a test-only actual Scene receive the new nonwalking material, retaining the authoritative foreground symbol and 13 caps. Verify real layer order, original source pixels, body culling bounds, minimum portrait/desktop zoom, far pans, actual camera/terrain limits, unchanged terrain/actors/save/physics, and real Scene render cost. The current full-art diagnostic extends beyond the actual Scene view; its successful rendering does not establish the Scene never exposes a lower edge. Keep source native and avoid whole-stage SVG/image overlays.
