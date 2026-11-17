# Stage 7 selective exclusion plan (read-only)
Compared public 7d238d20663c3ceffe430eb0304e01516ae625cf with candidate e8d8aa8865c832e831d6d221223356b440652e5f. No production change performed.

## Findings
- shared/assets/environment/act1-sites/stage07.json is byte-identical, Git blob a90a4bc0498ab49b6503679e83d28f93b1782e4f in both refs. Original BODY and source upper art were not edited.
- tools/map-forge/act1-naru-doldang.mjs lines103–128 adds extendVillageBody. It changes site-edge-2 source crop to [16,1067,1402,1] and stretches it to height2532.75, shifts existing side joins by2 source pixels, pixel-snaps original clipped parts, adds8 village-* external strips/underlays, and expands viewBox/bounds from[-390,0,2238,1466] to[-1200,0,3848,3600]. All new external source samples are at y882 or below. Top remains y0. There is no separately proven stage7 upper-tree repair in this diff.
- line167 wraps the unchanged bodyCollage with extendVillageBody for stage7. Returning only stage7 to bodyCollage would exclude all new extended skirt changes, preserving original source and original13 footholds. Stage3 extendNaruBody must not be reverted by this selective change.
- shared/runtime/renderer.js169–179 adds _terrainRasterBounds for stages3/7 using actual landmark paint bounds. This is separable and can remain with baseline stage7 art; it does not create new geometry or require the extended bounds.
- shared/runtime/terrain-readability.js25–28 suppresses stage7 root-floor artificial side/bottom3 closures only for painted, non-oneWay, nonwalkable outer closure edges. This is also separable, but baseline-body plus this suppression must receive actual Chrome visual checking; do not infer art acceptance from the old3-segment contract.
- shared/data/terrain-path-registrations.json stage7 entry maps sourceOriginal eae291824281e0ae52ac9eb0842a65bb6b025c8ffff608efc21ff25342f63299 to extended0795f4a63b4f1c60f68749b723f713a4631455919bf14551dbb7f596c861c547. If the body wrapper is removed, remove only this registration so the optimizer uses its original entry. Keep the other stage registrations.
- The e8d8 common collapsed-snap guard in shared/map/vector-art.js remains relevant and should be preserved.

## Required verification for such a future candidate
1. Exact original stage7 BODY/vector/source/13foothold hashes and full stage/physics hash, not merely revised extent assertions.
2. Original optimizer registration/path preservation and baseline builder parity.
3. Preserve renderer culling-bound and readability walk-rim/negative-scope checks.
4. tests/stage7-art-bounds.mjs and check-stage7-edge-audit.mjs currently assert the8 rejected strips and expanded extent. Do not claim those unchanged tests pass a reverted core. Replace only invalid feature assertions with explicit baseline-core equality and an honest unmet-coverage assertion/ledger; keep all preservation checks. The stage3 checks remain separate.
5. Actual isolated Chrome baseline/original-body+retained-culling/readability comparison at desktop/mobile aspect ratios and corners; no public-play/device/gameplay claim.
6. Full terrain integration manifest and expected PNGs must be refreshed with semantic scope documented. Rejecting the artificial extension means stage7 outer-art completion remains pending. Do not describe baseline fallback as a successful repair.

This is an exclusion plan, not authorization beyond the existing parent assignment, and not a production patch.
