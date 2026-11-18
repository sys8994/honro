# Independent hidden grass island partition: rejected

Local Native prototype only, no production/remote/Chrome changes. Original raw M...Z strings are reused unchanged; selected22 independent contours are removed from their original grass compound and filled exactly once with gray. All unselected contours, including holes, remain in their original remainder compound. This is NOT an extra overlay.

Selection:12:[7,8,14,17];13:[3,4,5,6,13,15,16,17,18];14:[6,7,11];16:[3,8,12,32,33];17:[22]. Each selected string exactly matches a later gray18/19 contour and has no area overlap with other contours in its grass path in the flattened GEOS model. This does not imply raster-AA separability.

Standalone original grass path white-alpha versus two-group partition:40cases (5paths ×4scales0.05/0.0625/0.6/1.65 ×2camera-x320/2400).21cases fail exact alpha, maximum delta10. Right scale0.6 path13 alone differs612pixels, path17 differs169. Thus later overpaint cannot be used to hide loss of original coverage equivalence.

Full25path BODY source-only previews at camera-y1650:
- Left0.6 and1.65: RGB changes0, alpha0, owner violations0. No repair benefit.
- Right0.6: RGB changes835, alpha changes1, protected owner sample violations29.
- Right1.65: RGB changes679, alpha0, protected owner sample violations16.

Direct right-view inspection still shows long green seams. Some contour-edge color changes occur, but no quality acceptance is possible with coverage failure. Even geometrically nonoverlapping contours can share fractional raster samples; separate source-over fills need not equal one compound-path fill. Original string preservation alone does not prove alpha preservation.

Reject this simple partition approach under the required unchanged-coverage contract. No additional CI, no epsilon allowance, no compensating overlay. Keep the independent source-atop/ownership investigation separate. coverage.cjs and proof.cjs are reproducible local test harnesses; coverage.json and four preview JSONs retain exact failures.
