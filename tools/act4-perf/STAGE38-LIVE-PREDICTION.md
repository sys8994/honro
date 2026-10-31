# Stage 38 active movement: prediction replay experiment

Status: diagnostic experiment only; do not apply `projection-experiment.patch`. No engine or renderer change is proposed for integration. This supplements, and does not solve, the remaining stage 40 cold-water raster cost in `TILE-UI-COMMON97.md`.

## Scope

Common source 97fa997591759541ca385124f51ae0edded02e14, plus only the incremental guide changes from e6f1cc19438f6f2ce9e3231c0449abec365b6d2a and c1e6f9cb2a9415fcdde2fdfd51260fb388543240. The 4ebe01b stage 40 escort dirty path and common compact autosave were retained. Frozen assembled world SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. Synthetic progressed 45-SP profile directly launches stage 38; actual browser dialogue dismissal, wheel zoom, drag and arrow key movement with autosave enabled. This is not a normal title-to-38 playthrough or a phone FPS measurement. Chromium headless, 1440×900, DPR 1, one active browser per run; host affinity 5 CPUs, 18,440,100 kB total and 16.2–16.4 GB available RAM, 10 live Chromium processes (including subprocesses). Per-run resources, events and frames are in compressed evidence. Real-time inputs and camera can vary between runs.

At the UI maximum zoom 1.65 the renderer uses direct vector drawing, not the terrain tiles. In baseline1 stationary rAF median/p95/max was 16.7/33.4/33.4 ms, maximum-zoom pan 16.7/33.4/99.9 and 16.7/33.4/66.6 ms, and movement 50/83.3/100 ms. During movement sceneVersion was unchanged and tile/screen raster creation was zero; five real persists were 24–34 ms. Zooming out built 12 tiles in a render of approximately 105 ms. Detail instrumentation introduces overhead: predictionGuide 72 measured calls totaled 1166 ms, median 16.9 ms; occludedUnitSilhouettes median 5.2 ms. Timings are nested and must not be summed.

A further instrumented sample recorded 120 `Engine.predict` calls totaling 1109 ms, and 606 `structuredClone` calls totaling 1027 ms, max 21.2 ms; the latter includes other callers and is nested in the former when applicable. The active skill A01 uses `arrowPrediction`, which clones the whole battle for isolated replay. At that point the `honroLandmarks` and `honroElements` JSON representations each measured about 6.48 MB; these numbers do not imply distinct memory objects. A broad-phase unit rejection reorder in a separate experimental build did not improve movement rAF (50/83.4/100 versus 50/83.3/116.7 ms), so it was reverted.

## Unaccepted projection experiment

For diagnosis only, a stage-38-only QA patch replaced vector values with empty objects in shallow copies of the landmarks/elements before `structuredClone`. It does not mutate the live battle, but **changes the simulated snapshot**, including alias relationships, and does not establish safety for external callbacks, modified assets, all abilities, collisions, or future consumers. This is not an acceptable production fix. It was tested on a clean common engine, without the reverted broad-phase change.

| Order | Build | Movement rAF median / p95 / max (ms) |
|---|---|---|
| 1 | baseline | 50 / 83.4 / 100 |
| 2 | projection | 33.4 / 66.7 / 83.4 |
| 3 | baseline | 50 / 83.3 / 100 |
| 4 | projection | 33.4 / 66.7 / 83.3 |

A fixed initial battle was separately tested with A01, A02, A05 and A14 at angles 15, 44 and 75 degrees with and without unit collision: all 24 returned prediction JSON objects, an initial rendered frame hash, and the captured RNG matched between baseline and projection; both reported unchanged live-battle JSON. Full parity evidence SHA-256 is `bf8e4b6b2e11d76a62202c1d920e8c60bb1ade131784a8d1ad856e3fd9ad5a97`. This is narrow sample evidence, not proof of isolated-snapshot semantics or complete gameplay equivalence.

`stage38-live-input.py` and `stage38-projection-parity.py` reproduce the probes against a separately built QA server. Evidence records baseline, rejected broad-phase candidate, the clone instrumentation, and each projection run. A safe implementation needs an explicit simulation-state contract that retains all collision/gameplay metadata and alias/mutation semantics or safely proves the omitted data inaccessible, with modified/custom assets, all replay families, RNG, saved-state and normal UI regression tests. Do not deploy or promote the experimental patch.
