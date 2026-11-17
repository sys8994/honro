# Stage7 minimal actual Scene A/B

Test-only memory injection, not production registration. Uses `runtimeEntries({vector:true, render:true, app:false, productionStory:true})`, actual `HonroMaps`, campaign-origin battle, `Engine`, `HonroBounds` and `HonroScene`. No user storage, App, network image or renderer-limit changes. Each view/variant runs in a fresh normal-sandbox Chrome profile.

The candidate replaces only the in-memory 7th stage BODY vector and its visual culling bounds/reference bounds. Its original source symbol must exactly equal the actual runtime source. All source references then point at that exact current native source. All13 foothold subtrees and their clips are reused from the actual current asset, not re-created by the study. Stage/camera/placements, source metadata, collision and physics are unchanged. No whole-stage image/SVG draw shortcut.

## Five cameras
- portrait bottom-left minimum legal zoom
- desktop bottom-right minimum legal zoom
- portrait top-right minimum legal zoom
- desktop top-right minimum legal zoom
- desktop right-edge close view, scale0.6 or legal minimum if higher

The original source's upper-right vertical boundary x1448 / y419..884 is unchanged by this lower-body candidate. The real authored right-ridge ends at source(1448,419). The fixture projects this boundary into each constrained actual camera and records visibility plus original play/terrain/camera bounds. Inspect the PNGs to determine whether its visible finish remains a defect; being outside playBounds alone does not excuse a visible cut. This fixture does not silently repair the protected original upper foreground.

## Mandatory checks
Canvas is attached to the DOM; bitmap and CSS dimensions are asserted before/after every render, preventing 1x1 captures. Both variants retain identical stage, physics, source and13-cap hashes and constrained camera. Actual original-source-region pixels are compared in the Scene, using the unchanged explicit gap-footprint exclusion and zero tolerance outside it. Native renderer-only protection tests remain separate evidence.

The actual save codec compacts/restores the entire campaign-origin candidate battle in memory, with exact battle equality and no mutation. It is not an App export/import/Continue claim. A cloned battle runs90 normal Engine.move(1,1/120)+tick calls; both variants must move and have identical trajectories. This is bounded movement equivalence, not completed campaign/UI play. The render battle is untouched by this probe.

## Timings
Real performance.now, never virtual time. Records first render (may include pending images), a new Scene's cold local caches after image decoding/global vector warmup, seven repeated renders, and five constrained camera pans with requested/applied delta and cache stats. No phone-FPS claim. The known direct VectorArt slowdown must be assessed against these actual Scene cache measurements before approval.

## Commands
    python game/tools/stage7-vector-study/convert.py
    node game/tools/stage7-scene-study/fixture.mjs /tmp/stage7-scenes
    CHROME_BIN=/path/to/chrome node game/tools/stage7-scene-study/run.mjs /tmp/stage7-scenes artifacts/stage7-scene-study
    node game/tools/stage7-scene-study/compare.mjs artifacts/stage7-scene-study
    python game/tools/stage7-scene-study/pixels.py

The regular CI writes only test artifacts/generated study files and verifies shared production sources remain unchanged. Source preparation passed syntax checks locally; actual Scene execution still requires CI. A green numeric report is not final visual acceptance, deployment, or full gameplay certification.

## Production source adapter correction
The SVG converter carries the raw authoritative source. Production authoring then applies the repository's existing terrain path optimization before publishing HONRO_PROJECT. The fixture now independently reauthors an untouched clone with applyAct1Sites, proves the candidate source equals that raw source, runs the existing hash-guarded terrainPathOptimization, and proves its entire BODY vector equals runtimeEntries' production BODY. The browser additionally requires the actual runtime source to equal this expected optimized source, then installs that exact runtime source, unchanged, in the candidate. No path equivalence tolerance, visual protection threshold, or renderer limit is relaxed. source-adapter-contract.json records exact raw/runtime hashes and every changed field (path, sizes, hashes). This test does not approve optimizer visual differences; it preserves the already-shipping native baseline in both variants.
