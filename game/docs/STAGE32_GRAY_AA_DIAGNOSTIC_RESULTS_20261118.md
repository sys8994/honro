# Stage32 gray AA diagnostic result

## Verified scope

Test-only commit81e0e74352548448b6a5c23dad58fb000fbe302b / branch inspect/stage32-gray-aa-20261118, CI44172063339 success. Production stays13d671e3cc80a9e70ab0a299d45860094bfe3181, helper aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953. Current two scene PNGs exactly match previously reviewed production hashes. Six PNGs (two cameras × current/outside/solid) directly inspected, including enlarged lower arch crop.

Each current BODY cache tile was replayed from its exact pre-draw ImageData, transform and paint state. All12 lower-view tiles and9 left-view tiles matched actual current drawing with0 changed pixels. This validates the diagnostic raster grid; it is not a new production pixel tolerance. Vector/25path source, physics, entire battle, camera and storage non-access assertions passed. Source geometry, palette, optimizer registrations and production helper were not changed.

## The simple outside-gray proposal is rejected

The existing helper draws shared material through full compound clip, then fills selected gray subpaths inside the same clip. Moving gray fill outside does change AA, but selected subpaths are not necessarily a geometric subset: dropping loops changes nonzero winding and holes. Direct outside fill paints real areas excluded by original full compound, not just harmless edge noise.

|View|Final scene changed pixels|max channel difference|Changes inside previous world<=1700 blanket gate|
|---|---:|---:|---:|
|lower|6886|30|5821|
|left|9952|45|9562|

Lower cache-tile samples where gray alpha>0 but full-path alpha==0:
- p5:0
- p6:7318 (max gray alpha255)
- p7:1712 (255)
- p8:4795 (255)
- p10:4102 (255)
- p11:4965 (255)
- p18:8 (max8)
- p19:1 (max8)

These are cache sample counts, not deduplicated whole-map pixels. Opaque255 leaks in p6/7/8/10/11 establish substantive winding/hole failure. p18/19 tiny partial differences require separate precision/intersection analysis. Path5 selects all its original subpaths, so its selected path is exactly the full source string.

Visible-contribution masks preserve the original25path paint order, not union-of-grass underpaint. Opaque white-on-black contribution255 and partial1..254 are separated. In lower samples outside-fill changed8341 grass-labelled pixels (1 opaque,8340 partial),637 road-labelled pixels(all partial), and6951 opaque selected-gray-labelled pixels. In left samples the corresponding numbers are4606(1 opaque),298(all partial),1644 opaque gray. These reject a blanket claim of original semantic preservation. Final RGB at true AA edges may change with intended new non-walk background; source coverage and exact compositing expectation must be tested separately rather than calling every edge RGB change damage. The severe hole leakage is independently disqualifying.

The direct screenshots still show fine green contours after outside-fill. Solid-original-color control largely restores the old flat brown/gray BODY appearance while retaining new foundation and lower transition. Thus the original color/material replacement and layer topology interact; gray double clipping alone is not proven to explain all green contours. No production fix follows from this CI success.

## Protection specification for the next step

1. Preserve raw25path source hashes, palette, order, apron, provider/element transforms, collision geometry and all8 actual walk polylines. Their world y range is541.2..1342; original road paths21..24 extend through source y622(world1368.4). Use source walk edges, not a rectangular y cut, to identify walk silhouettes.
2. Grass paths12..17 require visible-contribution classification after later overpaint. A simple union is wrong: most green underpaint is normally hidden. The original source includes fringe around y898..903 and tiny AA residues between other color planes; genuine grass clusters must not be conflated with non-walk closure artifacts. Do not delete small components by size/morphology.
3. Road21..24 and genuine grass: preserve opaque source color and geometry/coverage. For partial edges, derive the expected premultiplied source-over mixture on the newly allowed background; compare this expectation, not merely the former bad composite's straight RGB. The current diagnostic measures edge changes but does not yet implement that full expectation test.
4. Objects/structures: preserve source providers and placements of pier-bearing, west-house, workshop, shelter and door at(2992,869),scale.9. Exported source-evidence.json contains stage and32-provider bounds/hash. The door's generic a4:door provider should be added explicitly to the final object-source lock. Final occlusion/silhouette masks for these objects remain to be built; this first diagnostic does not claim them complete.
5. Keep the former world<=1700 comparison as an explicit diagnostic. It was a conservative experimental gate, not the user's whole requirement; changing non-walk art must be recorded against the new source-defined protection specification, never silently waived.

## Recommended next method, not an implemented fix

Construct a true fullPath ∩ selectedGray region before raster painting. Because source loops are raw absolute M (all25 have zero relative-m commands), current raw extraction does not have the separate optimized-relative-m problem. Do not introduce optimization aliases.

Preferred build-time options:
- Prove non-intersecting loop topology and derive the exact retained original-loop boundary set using winding/nesting. Do not assume signs or blindly drop loops.
- Or use established Skia PathOps INTERSECT at build time and validate derived curve geometry/coverage in actual Chrome. Installed @napi-rs/canvas exposes Path2D.op(...,1), so no new package was installed. A local Native-only feasibility study produced8 intersections in roughly5..35ms each. It is NOT a production geometry proof: p10's intersection-minus-full operation leaves a tiny cubic sliver, and PathOps rewrites curves/commands. Other seven differences were empty in that same Native backend. No Chrome boolean-mask comparison has run.

Even a correct intersection does not make outside overlay mathematically correct: painting field through coverage a then gray through g increases total opacity. The desired decomposition is one final full coverage a with premultiplied gray contribution g and material contribution a−g (only after a true subset is established). Source-atop multiplies coverage and may retain the defect. Per-frame pixel readback is a slow diagnostic fallback, not a proposed production implementation. A build-time disjoint color-region representation or one-coverage compositor needs explicit source/AA/visual/performance checks.

## Evidence

Artifact14367958088,3,083,593B, ZIP SHA256 be2f9397319082b50a482b4382d8068303d69646c9838c0b500a7a6cadc85488; CRC all15 files pass. Original6PNG+JSON/comparison/source-evidence retained in stage32-gray-diagnostic/review. Additional sheets/crops are derived review images, not original captures. Actions expiry is not permanent storage. Summary/manifest accompany this document. No master/Pages, user battle or production changes.
