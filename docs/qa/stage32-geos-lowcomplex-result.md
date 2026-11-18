# Stage32 57KB GEOS paired-left and clean ABBA result

Run 44235643226, commit a320a36288ee0a03f3f38b71b154d25288271c86. Artifact14397262334, ZIP SHA256 d6b8de6c15f18dfcf5277dc3c7c663c3f127ee54d457609048a99b6ebe53716a. Workflow completed successfully; this is not production or full-view art acceptance.

## Correctness scope

Single left Scene1331x763 at scale0.6: 8,853 RGB pixels changed against registered baseline. BODY alpha, background RGB, original protected owner samples,49walk-edge24world guard, and independently replayed actual Chrome paint mask outside count all zero. Finite original-owner samples79,677. Raw one-pixel geometric heuristic outside1 remains reported, while actual Chrome footprint outside0. These are distinct measures, not a blanket pixel tolerance.

Original319KB Scene was rerendered and exact historical golden retained. New57KB differs by115 pixels, max RGB4, alpha0; bbox[511,141,1242,534]. Native ABBA PNGs repeat exactly and match the protection diagnostic PNG. Original baseline golden exact remains enforced. New native output was NOT approved as a replacement golden. Direct image inspection shows no new large hard endpoint compared with319KB; preexisting near-grass thin traces remain.

Earlier run44235182351 stopped on stale staticBytes319449 metadata while actual coverage was57038. Fixed metadata uses ASCII nativeCoverageD.length;57038 assertion retained. Geometry, painting and SS code unchanged by that fix. Prior failure did not execute ABBA.

## Costs

Two ABBA blocks in separate fresh Chrome contexts. Each variant totals20prepared-source cold renders,4first-warm,116steady-warm,8material-rebuild-pan,232cached-pan samples.

| Phase | Baseline p50/p95/max ms |57KB p50/p95/max ms |
|---|---|---|
|Cold|142.0/161.1/174.3|145.5/159.1/166.2|
|First warm|15.6/22.6/22.6|15.7/23.0/23.0|
|Steady warm|1.4/3.0/5.6|1.5/2.7/5.9|
|Rebuild pan|69.8/76.6/76.6|71.6/86.9/86.9|
|Cached pan|1.7/2.4/4.8|1.7/2.5/4.6|

Block cold medians138.3→142.3(+4.0ms),142.0→145.5(+3.5ms); pooled cold+2.5%. Initial one-time Path2D parse0.1–0.3ms separate from prepared-source cold. Static SVG57038bytes versus319449 previously. Full JavaScript parse/download/startup and native/GPU memory not measured.

At x352 baseline material rebuild74.1/76.6/74.0/72.1ms; native86.9/74.9/74.6/77.7ms. At x1072 baseline69.8/69.4/69.3/67.5ms, native69.6/69.6/69.3/71.6ms. Rebuild positions and counts match. Cold world-build median134.2→134.0ms, SSmedian69.10→69.85ms, native direct submission median0.1ms; nested/asynchronous raster cost cannot be causally attributed from these timers.

Both blocks retain positive whole-Scene cold cost and rebuild tail worsens. Lower complexity reduces static bytes and observed initial parsing substantially; relative regression is smaller than the prior319KB run, but different CI executions have different baseline speed. Do not compare their absolute milliseconds as a controlled319KB-vs57KB speedup. No performance-win acceptance or automatic fixed total-time cap.

## Unresolved scope

SS remains fully active. No production code or personal storage changes. Seven/thirteen-view or zoom-transition protection is not certified here. The319KB separate13-view investigation found native-oracle owner disagreements near source(333.591287925,766.017163993) and(332.898653807,766.450060317);57KB also contains both points. Simplification does not establish resolution of that issue. The existing native-enable threshold pop and thin near-grass remnants remain open. No more micro-optimization or production adoption is implied by this result.
