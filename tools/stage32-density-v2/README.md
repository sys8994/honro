# Isolated gameplay-material density pilots (32 / 35)

These tools share a small capture/assembly implementation for two exact physical
contracts. They do not modify the original source packages, campaign or renderer.
Final artwork must be generated from the source-derived guide and traced in
Inkscape; this assembler draws no final art.

```
node tools/stage32-density-v2/assemble.mjs --stage 32 --surface art/vector-gameplay-density-v2/wood-platform-asset.json
node tools/stage32-density-v2/capture.mjs _local/reports/stage32-density-v2/baseline-project.json _local/reports/stage32-density-v2/baseline-native
node tools/stage32-density-v2/capture.mjs _local/reports/stage32-density-v2/candidate-project.json _local/reports/stage32-density-v2/candidate-native
# --stage 35 uses the pinned stage35 package, not the older official skeleton.
```

Omit `--surface` to prepare the untouched baseline. `--out` overrides output dir.
Imported surface must have a new `density-play:` ID, empty collision, and its
root already mapped to world coordinates. The assembler adds two clip scopes:
original compiled physical polygon, then the intentional pilot region.32 is the
flat interior wood segment x1660..2300/y1760..1806 (46world vertical thickness,
wood, oneWay=true).35 is x520..940/y1770..1990 around the first rock stairs.
No physical silhouette, actor, event, encounter or interactive identity changes.
Compiled collision arrays and all original stage data are asserted equal.

35 surface is appended after BODY;32 surface is inserted just before its BODY
so the ground naturally occludes buried ramp ends. Both use the `front` environment pass before
actors (production renderer draws the landmark front pass before unit rendering).
This is NOT a screen-front/FORE asset. Art never extends outside physical solid.

Capture initializes the actual production compiler and Scene in Native Canvas,
with original actors. It is not an App event replay, browser or device result.
The older35 App adapter intentionally disables rendering, so is not reused here.
Fixed-camera capture suspends presentation framing and records/asserts actual
post-render camera x/y/scale, viewport and every player actor's nominal CSS H.
Normal/mobile scale is.53; actual heroes have h92world =>48.76CSSpx.

Inspect normal, detail, mobile and whole PNGs directly. Successful assembly and
matching physics cannot establish visual approval. Do not equalize node counts;
use `game/docs/VISUAL_DENSITY_STANDARD.md`.32 buildings/BODY remain the existing
baseline unless separately reauthored: a wood-only comparison is deliberately
not a scene-wide density pass.35 stone-looking wall assets currently compile as
wood because material is missing; do not silently alter that physics in art work.

## Full32 route

Add `--whole-route` with the same optimized wood source. Each sloped segment
uses x-scale1 and y-shear, cropping the source to460/300world instead of
compressing board joints. Vertical46world thickness remains unchanged. Three
source instances are exact-subtree deduplicated using existing internal symbols;
expanded runtime validation remains mandatory. One physical terrain mask and
three segment masks constrain all paint. The guide's flat interior is not an
endcap design. Same-camera normal/detail/mobile review must inspect joins and
burial; the initial front-after-BODY version exposed buried tips and was rejected.

## Quiet BODY / architecture integration

`--body` accepts stage-scoped `s32-density:body` or `s35-density:body` and
regenerates both original domain continuations with the original stage's mapping.
32 keeps base#283344;35 adopts its candidate's deep#46595e. The stage's ground
substrate is matched. No original assets or instances are relocated. Compiled
physics and all gameplay data remain equal. Same-camera quietBODY comparisons
are separately named from surface-only evidence; quieter does not mean approved.

`--building` is a32-only noncolliding scoped replacement for existing
`s32v:port-building` references, retaining position/scale. Source bounds must
be authored to the original footprint; this option does not fit arbitrary art.

`--contact` adds an already world-mapped, noncolliding `density-play:` lower
contact asset after BODY, with an additional exact physical-ground clip. The
source must carry its intended depth/extent mask.32 source36-palette reuse was
rejected in combined scene review: exact geometry reuse is useful but the pale
outline/gray-brown rocks clash with the olive soil. A stage palette variant and
fresh same-camera inspection are required, not automatic approval by validator.

32 background replacement explicitly asserts reference bounds match the actual
scoped32 asset (-420,-420,840,456.521739...), not the larger40 source footprint.
The first460world variant was caught before integration. Use the corrected
`coastal-house-32-*` variant, leaving all original instance scales untouched.

For35 comparison, `--body` also permits isolated `body-edge` (135world) and
`body-depthfade` (420world) variants. Both retain original support silhouette.
Capture `--views normal,mobile` limits the requested inspection set explicitly.
For32 `--contact` also accepts `s32-density:soil-contact` and adds a ground-right
camera to inspect the long lower route. The matching ochre/depth40world variant
is distinct from the rejected gray prototype; no source geometry changes.
