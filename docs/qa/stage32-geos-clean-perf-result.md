# Stage32 clean GEOS paint cost result

Run 44234014196, commit 7a161ed2dc4f6eb7d2d0fba9e49be498abe985aa. Artifact 14396488049; ZIP SHA256 ddb85edbc097a1c9c25ec7e3d7b0c227a1d8a0c716cc8009fd9722d7fe3a6910.

## Verdict

Measurement and unchanged-pixel gates passed. Performance acceptance remains withheld: both ABBA blocks have slower native cold medians, and the first rebuild-pan location is consistently slower. No production registration or SS removal follows from this run.

Eight separate fresh Chrome contexts in A B B A A B B A order. A is the registered baseline (`candidate`); B is the unchanged native GEOS experiment (`ss2`). Per context: 5 prepared-source cold rebuilds, 30 warm renders, 60 pan steps. All eight PNGs exactly match their prior CI44233247194 variant; source/physics/battle checks and storage-zero gates pass.

| Phase | Baseline p50 / p95 / max ms | Native p50 / p95 / max ms |
|---|---|---|
| sceneCold | 170.0 / 211.7 / 236.1 | 185.3 / 203.6 / 205.6 |
| firstWarm | 17.7 / 17.8 / 17.8 | 17.7 / 18.0 / 18.0 |
| steadyWarm | 1.8 / 3.5 / 20.5 | 1.8 / 2.9 / 4.8 |
| rebuildPan | 85.6 / 91.0 / 91.0 | 85.9 / 115.8 / 115.8 |
| cachedPan | 2.0 / 3.7 / 19.4 | 1.9 / 3.6 / 21.3 |

Cold block medians: 176.9 → 179.2 ms (+2.3); 166.5 → 189.7 ms (+23.2). Pooled cold p50 increases 9.0%. Baseline first context is slower than later baseline contexts; do not interpret pooled p95 improvement as a native speedup. Samples share one CI runner and are not independent devices.

## Rebuild location and counters

At camera x=352, baseline rebuilds take 89.8/90.6/90.7/91.0 ms; native 115.8/93.8/93.2/94.6 ms. Even excluding the native 115.8 ms tail, all other native observations are slower here. At x=1072 the two variants overlap (baseline 81.0–85.6, native 83.5–85.9 ms). Rebuild counts and positions match; warm and cached pan do not substitute for these hitches.

The new Path2D is prepared once per fresh page, 1.4–1.5 ms, before the prepared-source cold phase. Prepare counters remain zero in all measured phases. Static added SVG text is 319,449 bytes. Full module parse/download/startup and native/GPU memory are NOT measured. Clear intentionally retains prepared geometry.

Per cold render, SS remains six calls and 2,385 corrected writes in both variants. SS median measured cost is 85.3 ms baseline versus 87.6 ms native; native direct draw-call timing median is 0.5 ms. This small submission timer does not isolate downstream raster/composite cost, so it cannot explain away the larger Scene regression. Cold world-build median is 163.45 → 169.85 ms. Logical helper canvas/readback gauge remains 4,918,512 bytes in both variants; this is not total memory.

No diagnostic observation callback, vector/helper wrapper or proof mask is active in either measurement page. Existing production counters remain. The SS2385-write overlap finding from the separate correctness run (1868 native-covered, 517 outside) is only a possible future research input, not permission or proof to remove SS.

## Scope limits

One left view at 1331×763 and scale 0.6, two ABBA blocks on one CI worker. Warm steady count116 and cached-pan232 per variant; cold20 and material-rebuild-pan8 per variant. Not seven-view visual acceptance, phone FPS, long playthrough, total startup, or an absolute performance cap. Keep candidate unchanged pending a separately authorized next experiment.
