# Filled join: fixing a no-op, not widening the edit

The previous actual Chrome study showed zero joined-versus-closure changed pixels in all five views. The close view still had the long pale seam. The declared same-cache join mask was nonempty (4,389 close-view pixels), so a passing joined/expected comparison did not prove an actual edit.

Root cause: production shared/map/visual-style.js omits authored `stroke(Path2D)` in non-gameplay decoration contexts. Both native stroke and independent expected stroke were omitted. A local test using the actual policy confirms zero underlying stroke calls but one fill call. Renderer policy is intentionally unchanged.

Revision 2 replaces the round 3.2-unit stroke with one native filled compound path: positive-winding segment rectangles plus round discs. Same 14 centerline vertices, radius 1.6, same declared nonwalk envelope and color. Original runtime source, walking grass, 13 caps and physics stay unchanged. Independent expected constructs the same filled region using Canvas moveTo/lineTo/arc and fill, rather than reading the native path string.

The close view must now have nonzero actual joined-versus-closure changed pixels and a nonempty footprint. Existing exact expected-composite, outside-footprint, opaque-source-outside-footprint, caps, grass and painted-union gates remain. No screenshot tolerance is introduced.

Integration with role partition: apply partition(original, lowerCandidate) FIRST, then insert closure immediately before original source and filled join immediately after source. Running partition after joining reclassifies the join as backing and moves it underneath source, hiding it again. The original right-rim crop starts at source y882, outside the join's y562.2–866.1 footprint. Any expected control must use the identical partitioned lower tree.

Only fixture paintJoin, nonwalk-join.json, joined-check.py and this note change in this package. Native preview/validator are not actual Chrome acceptance; rerun the actual Scene suite and visually inspect the close view.
