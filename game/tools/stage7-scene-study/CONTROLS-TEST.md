# Stage7 minimal cache/composite controls

Parent edcedd7a47f06e7d0168f8af1b22cb3e375a2836. Uses existing runner without changes. `STAGE7_CONTROLS=1` selects3views (portrait-bl, desktop-br, portrait-tr) ×5variants=15captures. Default fixture retains existing closure mode4×5.

- original and original-repeat: identical source, bounds, init, scene/camera, independently launched fresh browser profiles. An RGB1 difference is still a difference.
- bounds-only: exact original root/symbols/clips, candidate viewBox and asset/reference bounds. Explicit exact asserts prevent content drift.
- candidate: existing full candidate, no closure additions.
- right-backing-off: candidate minus exactly one root child with protected-right clip. No other art or source change.

Before pan, record actual `_domainTiles`: rs, tile IDs, worldleft/top, bitmap width/height, last context transform and rawRGBA SHA256. Record actual BODY draw call canvas dimensions/transform/state/placement, deduplicated with a hard128-entry guard. Export actual screen-background/world/foreground PNGs using existing runner `masks` support. Metadata does not invent screen-to-source alpha or assume source-resolution rendering equals cache rendering.

Instrumentation readbacks occur after captured Scene and ready timing, before pan, outside frame timers. They can nevertheless perturb later memory/backend caching, so these control timing results are NOT performance acceptance. Source/13caps/physics/codec/movement/camera/storage contracts remain checked for every pair. Existing strict protected-region pixel formula and exit-on-any-difference remain; only camera list is restricted in control mode. controls-check runs even after strict failure and writes cause evidence, not an art pass.

If A/A differs, classify divergence at rawtile, screenbackground, screenworld or final composite before attributing candidate errors. If bounds-only differs, isolate culling/grid/render path first. The rightbacking-off table reports exactly which candidate protected pixels recover, without removing them from the strict gate.

Not implemented: effective source-only alpha through exact tile and screen resampling. Once control branch is determined, replay original source+13caps on transparent canvases using observed original draw matrices, then use SAME tile compositing clips/gutters/rounding and screen cache transform; assert replay/source behavior before classifying0/partial/255. Existing closure direct viewport alpha mask cannot substitute. No opaque/AA allowance is made here.

No production file changed; no remote writes performed. Syntax checks only locally; actual browser run is delegated to parent CI.
