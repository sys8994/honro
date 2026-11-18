# One bounded zoom-pop candidate: fixed minimum-scale safe core

Design review only. No helper, renderer, SS or production change; no CI requested.

## Cause and rejected shortcuts

The current helper requires actual Canvas CTM scale >=0.6. Renderer raster scale is quantized independently of camera zoom. Near camera0.5946 the tile CTM changes from approximately0.594604 to0.707107, so the native contribution switches from zero to roughly8861 Scene pixels. Changing the threshold location merely relocates this switch. Fading opacity by tile CTM also jumps at that same quantization. Fading by camera zoom would require it to participate in material/tile cache identity or force repeated rebuilds; neither is the requested low-cost local correction. Do not use the current0.6 guard geometry at lower scale.

## Single proposed candidate

Construct ONE immutable source-space safe core using the minimum supported actual material CTM0.05:

1. Keep the same original painted BODY union/apron, visible protected foreground, natural nonwalk component and49walk/road guard roles.
2. Use source margin2/(0.05*2.2)+0.012 =18.1938181818 on original BODY exterior/holes and protected foreground, NOT an arbitrary erosion of every semantic seam boundary.
3. Intersect that result with the current57KB coverage. Apply only inward simplification with exported-coordinate subset proof; do not expand the gray repaint domain or erase existing owner doubts.
4. Use that SAME fixed path at all supported zooms. Remove the0.6 on/off decision. Keep a single lazy Path2D and one native fill, original source and exact SS2 unchanged. No added canvas/readback, cache-key dependency or frame-time geometry computation.

Renderer code floors cached raster CTM at0.05, and observed diagnostic transforms range0.05735..1.65. Actual live/preview paths must be checked rather than assuming the cached floor applies everywhere. Below0.05 is outside this proposal's claimed support. The auxiliary direct BODY probe is not evidence of normal low-scale live rendering.

## Feasibility / major cost to art

Read-only GEOS calculation from existing roles: min-scale safe area13826.424880941,36polygons, outside current0.6 safe area0, versus current safe30860.832512339. Retention44.8025%, before intersecting57KB/simplification. This may discard more than half the intended repair area. It is therefore only a credible low-runtime-cost, no-gate-pop candidate if its retained repair still improves the scene enough; it is not an established art solution. No renderer image or timing evidence exists for this core yet.

This design removes the helper's binary enable discontinuity but not normal existing tile-resampling differences. No promise of pixel-identical output over continuous zoom. If fixed-core art is inadequate, do not proliferate scale bands: stop this approach and resolve owner-safe source-side compositing, accepting that a different architecture is needed.

## SS overlap

Existing2385 corrected-write events at left contain1868 inside319KB native coverage and517 outside. These measurements do not establish the proposed smaller core's overlap or equivalent RGB, and are tile events rather than unique Scene pixels. Native is composited after SS. Keep SS fully active; even inside overlap, removing SS may alter native antialiased edge composition and neighboring protected pixels. No SS skip/retirement is justified here.

## Bounded next proof only if authorized

First source-only preview of the one core at low/high representative scales, including retained-effect count and lost repair map. If visually worthwhile, reuse existing two threshold-side poses around0.5946 and lowest viewport plus live1.05001; original alpha/BG, actual coverage support, owner/grass/road and protection gates remain strict. Existing57KB paired-left and319KB13view failures are historical evidence, not waived. The unresolved near-coincident grass-owner disagreement must be handled by the ongoing independent analysis before adoption. Record changed sets between threshold frames rather than merely counting nonzero effect. No additional broad13view loop or performance trial until this one core shows enough visual repair.
