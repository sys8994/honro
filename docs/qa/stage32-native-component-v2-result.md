# Native component V2: one-camera protection test passes; not release acceptance

Commit8992c83f2e1fa1e51e9d9b80eeaba15c5e878b95, CI44226504129 success. Artifact14393346844 ZIPsha256a8b07e4e56e17d6cd23338664f62505af678245e87296f3ea9b72c8241ee3486.

Actual Chrome left Scene:802 changedRGB pixels, bbox[501,422,767,516], max28. Transparent BODY alpha changed0, final Scene alpha changed0, outside-original-BODY Scene background/holes/exterior RGB changed0. Known genuinegrass/road/domain violations0;7218 original topmost samples including pale1..4, grass12..17, road21..24, rawholes and originalapron outside all0. Baseline frozen PNG exact. Source/native/codec, no-op PNG/battle and no storage access pass. Finite source-point checks are not continuous area or independent mixed-grass contribution proofs.

Actual render-plane observation: recorded BODY tiles516×516 use affine scale0.7071067690849304, with example translations[514,-510],[2,-510],[-510,-510]. Author-time source inset1.5151515 equalsworld3.3333333: about2.3570226pixels in these tile planes, exactly2pixels in the direct0.6screen plane. This was not a universal2tile-pixel contract. Only this camera's result is established; minimum/maximum zoom, cache-scale transitions and fractional phases remain unproved. Future fixtures should record all BODY planes, not only the first10 diagnostic rows.

Native paint initial9calls0.2ms; whole prepared-source benchmark105calls1.1ms. Coldp50 baseline115.9/native114.3ms, panmax63.6/native64.8ms. These one-run numbers do not prove an optimization or spike solution. Helper still uses six canvases; no additional SS/readback. Native coverage liesworld1719.33..1875.39 while SS covers1420..1716, so they are disjoint. This gives NO basis to remove SS.

Direct paired image review confirms the lower longgreen seam segment improves and the failed bottom-edge pixels fromV1 are no longer changed. Upper continuation at1716 and other seams remain visible. Complete-junction art acceptance, full zoom matrix, partial-grass expected composition, actual gameplay/phone performance and production build/registration remain incomplete. Production unchanged.

Next bounded step: same unmodified V2 helper in seven-view correctness-only matrix, no repeatedcold/warm/pan benchmark loops, frozen production baselines, transparentBODY/Scene background checks, all original protected/source/apron gates and actual tile-plane recording. Keep SS. Test-only bounded original SS changed-set instrumentation may describe coverage disjointness but must not alter the renderer's pixels or expand permission.
