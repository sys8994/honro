# Static screen cache browser audit

Use isolated, normally built checkouts; this harness reads each checkout's actual `HONRO.html` and production runtime/asset loader rather than parsing the obsolete manifest source pattern. The same candidate-side script can test both roots. The exact fallback background image is awaited with `Image.decode()` when applicable; the actual authored-background cache must report ready when selected. A failed or unavailable image is an error, not a skipped assertion. Fresh prepared profiles and explicitly completed introduction dialogue are test fixtures, not normal campaign play.

```sh
# First run npm run build in each isolated root. Do not publish the outputs.
python tests/static-screen-cache-browser.py --root /path/to/master --out /path/to/master-report
python tests/static-screen-cache-browser.py --root /path/to/candidate --out /path/to/candidate-report
python tests/native-tide-cache-browser.py --root /path/to/master --out /path/to/master-tide
python tests/native-tide-cache-browser.py --root /path/to/candidate --out /path/to/candidate-tide
python tests/native-return-deck-browser.py --root /path/to/master --out /path/to/master-deck
python tests/native-return-deck-browser.py --root /path/to/candidate --out /path/to/candidate-deck
node tests/native-integration-bounds-fixtures.mjs /path/to/master
node tests/native-integration-bounds-fixtures.mjs /path/to/candidate
node tests/native-large-asset-culling.mjs /path/to/candidate
```

The browser cache harness preserves exact channel equality, unchanged battle state, 24 MB-per-screen slot, hits, no screen builds during motion/zoom, settled builds, scene-version invalidation, automatic camera settling, 6M-pixel and alpha bypass assertions. It additionally checks true Chromium DPR transitions and that a changing diagnostic `liveWater` paint updates outside the static cache. Cases continue after individual assertion failures and exit nonzero if any failed. `static-screen-cache-browser-isolate.py` is a **measurement** helper; its output is not a pass result. The previous Native Canvas `tests/static-screen-cache.mjs` is retained unchanged; its manifest-pattern assertion remains stale and it is not counted as passing.

## Observed baseline and candidate results

On master `7238c788` and candidate `ad4aa223`, the same 16 cases (stages 1, 11, 14, 22; 960×640 and 390×844; browser DPR 1 and 2) yielded **12 passes and four failing cases each**, with identical failure details. All 16 DPR transitions on each checkout resized and invalidated/rebuilt the screen cache; no JS page errors were reported. Actual authored/fallback background decoding completed; no decode check was disabled.

- At 390×844, browser DPR 2 (legacy backing ratio 1.7), exact cached vs direct output differed in stage 1: 128 channels, maximum 3/255; stage 11: 155, maximum 3/255; stage 22: 862, maximum 7/255. Uncached consecutive frames differed in zero channels. These are failures under the original exact criterion; no tolerance was introduced.
- With only `_screenWorldCache` enabled, stages 1 and 22 reproduced the respective differences on both builds; with only `_screenBackgroundCache`, both were identical. This isolates the failing slot, not the underlying rendering/compositing cause.
- Stage 11 at 390×844, DPR 1 and 2, allocated three screen caches during eight moving/zooming frames (`screenBuilds` 2→5). Instrumentation identifies all three as `_screenBackgroundCache`; this fails the original no-build-during-motion assertion on both checkouts. The other checks in each case continue to run.
- The actual Stage 33 tide observer, with an explicit test round, moved the surface 2280→2262 and sceneVersion 82→83 on both; the old screen cache was released and rebuilt. The Stage 40 candidate's synthetic post-dialogue production observer/Engine carried a supported hero 180 units, moved collision support, did not rebuild the resolved-ferry static screen cache, and detached the jumping hero. Master reports this opt-in API unsupported, not passed. Neither test proves full mission or water/art acceptance.

## Bounds and unresolved risks

The old general `camera-bounds.mjs` fails on master and candidate before the intended bounds comparisons, with identical 47-line Stage 8 missing-member and Stage 13 asset-scale errors (message SHA-256 `cb721a2de211911953e374ebcf7da0e974fe638df135e72975322969c96a2d81`). Those unrelated stages were not redesigned. The independent `native-integration-bounds-fixtures.mjs` validates the actual published Stage 31–40 bounds on both roots; the candidate's 50 optional viewport-containment synthetic cases also passed separately.

`native-large-asset-culling.mjs` uses the actual renderer methods with a synthetic 8,000-unit vector whose instance origin is x=-6,000, outside a 1,000-unit world, but whose artwork reaches the viewport. With accurate bounds, candidate paints it and missing/invalid bounds use the conservative fallback; master misses this outside-world paint. With `--stale-bounds`, the valid-looking bounds claim only 100 units while the actual vector extends 8,000: the candidate also fails. Thus finite but inaccurate metadata is still a real culling hazard; metadata accuracy must be validated or the culling implementation changed and rechecked before approval. Do not count either failing fixture as a pass.

Logs and screenshots for this run are local under `_local/reports/native-integration/`; no art, game data, master, or release output was changed. The remaining exact-pixel, movement-cache and stale-bounds failures block claiming complete static-screen-cache regression coverage or promoting this integration.
