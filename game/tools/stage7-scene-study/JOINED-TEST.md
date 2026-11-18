# Explicit nonwalking join scope

The new `joined` variant adds only the declared 3.2-unit stroke immediately after the unchanged original source draw, before caps. The centerline is 14 exact source-alpha outer-clip vertices, restricted to source y563.820552–864.469325. It does not alter geometry, physics, cap paths, upper walking grass or floor grass. Source opaque colors inside this exact stroke are deliberately changed. This is a new named edit unit, not silent relaxation of the older whole-source opaque test.

`joined-expected` independently draws the raw Canvas stroke after the unchanged native source. `closure` versus `expected` remains separately checked under its old no-opaque-change contract. Their static screen-world caches, not final dynamic compositions, are compared exactly. The old original/lower final protected gate remains present.

Common QA freezes performance.now only during synchronous Scene.render and restores it in finally; elapsed timing uses the captured real clock. Original source, source+caps, caps-only, closure footprint, join footprint and original+closure painted union are drawn on actual observed BODY tile transforms and replayed with the existing production tile/screen cache compositor. No rectangular exception or mask dilation. Join must not change anything outside its exact same-cache stroke footprint, touch cap pixels or protected grass bands, or extend outside the original+closure painted union.

The stroke straddles the original polygon boundary by 1.6 units. The inner half recolors the old outline; the outer half lies on existing closure backing. Thus entire-stroke inclusion inside original-only silhouette is neither claimed nor required; inclusion in the already-painted union is explicitly tested.

Tests are not visual acceptance, full campaign completion, or deployment.
