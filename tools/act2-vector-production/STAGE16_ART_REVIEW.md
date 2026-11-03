# Stage16 near-terrain candidate review

## Preserved

Original 11000×7600 map, hero height92, floor/ceiling collision, processional stair and bridges, folded cloister, arch plinth/undercroft, east archive walkway, giant Buddha and main hall, actors/enemies, mission and testimony events. Existing distant image and shared camera remain unchanged.

## Art decisions

Only floor geology and cave roof receive new image-derived material. Source guides are the actual fixed silhouette, not redesigned terrain. Local ground skins are separate west, undercroft and east patches; the roof is a continuous domain material. Large clean planes avoid noisy trace islands. Original structures are deliberately not repainted. A source is not a collision generator.

First source trial and four-color extraction failed visual review because gradient quantization made pockmarks. Final selected sources use three semantic flat colors. Root review kept the world scale but requested lower contrast; authored RAW documents this color mapping explicitly. No claim that semantic recoloring is lossless.

## Verification

- Raw-stage source digest guard and duplicate/geometry-drift negative cases.
- Runtime-author effective stage exact except new decorative elements; collision, world terrain, hero and actor placements exact.
- Native renderer entry/west/temple/undercroft/east/overview/mobile and legal left/right/top/bottom views.
- Actual Inkscape trace, original source/trace hash preserved. Authored RAW and final compared under identical canonical clipping/contact inset at2048-width1×/2×.
- Four-part aggregate optimization≥30% against immutable Inkscape RAW; authored intermediate reduction reported separately; individual tiny roof part may save less. Do not label per-asset30%.
- Floor-west keeps all original path commands after a1× protected alpha edge shifted onepixel in geometric optimization. Only lexical packing allowed there. Other candidates use bounded curve simplification away from protected edges; limits unchanged.

Browser performance, full combat, timing/fun criteria, release hook and actual Pages are parent-owned and unverified in this art-only branch. Native image review is not a browser pass.

Final immutable RAW79,322B → selected SVG51,424B:35.17% reduction. Semantic authored intermediate68,590B→51,424B:25.03%, explicitly not30%. All four composed1×/2× quality gates PASS at unchanged limits, exact selected vector children tied to tested final SVG. Original/effective sourceguard passes. Final11-view native set uses subdued palette; no floating boundary or rectangular source patch edge observed. This remains a terrain-material candidate, not full stage acceptance.
