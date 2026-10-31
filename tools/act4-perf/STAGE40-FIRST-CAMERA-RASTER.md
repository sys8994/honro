# Stage 40 first-camera raster follow-up

**No production patch is proposed.** A one-tile-at-a-time prewarm was implemented only in a disposable QA copy; it reduced one render measurement but did not improve the full observed transition or the previously used distant-water probe, and its cancellation/memory behavior was not release-ready. The patch files under `evidence-stage40-water/` are retained for reproducibility and must not be applied as a fix.

The isolated base is common `b50c4533b3dab33ab71216b4a2d5cb61f1bec673` (includes the integrated 38 A01 change, stage-40 escort dirty and compact autosave). QA packed the original assembled world unchanged, SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`; newer 33/34 artwork is not included. This is a synthetic progressed 45-SP stage-40 entry followed by real guide dismissal and keyboard movement, not earned 39→40 progression or a phone test. No production package or Pages deployment occurred.

Chromium 154.0.8037.57 headless, 1440×900 DPR 1; one active browser, affinity 5 CPUs, 18,440,100 kB total RAM, roughly 15.6–16.4 GB available, 9–10 live Chromium processes including subprocesses. CDP `SystemInfo.getInfo` reports `2d_canvas=unavailable_software`, `rasterization=disabled_software`, `gpu_compositing=disabled_software`, and ANGLE SwiftShader. The observations are software-rendering browser costs; they do **not** measure a hardware phone GPU. Synchronous Canvas API timing can include deferred work and cannot assign all time to a specific CPU stage.

## The actual first camera and ordinary movement

In this fixture the open guide's scene was `(280,1095.19,.72)` while `storyCamera` held `(280,1120,.94)`; the normal follow view after the guide settled near `(450,1106,.94)`. These are observed scene values, not a manually selected destination. During return animation, the raster key first switched around scale .843–.851 and the unmodified renderer built 15 tiles in a 161–188 ms render in two instrumented runs. The guide's frame median/p95/max was 16.7/16.7–16.8/50–66.7 ms; the guide-closing interval was 16.7/33.3–33.4/383.3 ms. Timings are headless PC samples, not FPS claims.

During five seconds of real ArrowRight input, the actor moved from x≈280 to x≈2023–2098. Two baseline instrumented runs measured rAF median/p95/max 33.3–33.4/83.3–83.4/116.6–150 ms. Tile-domain wrappers saw new tiles while the view advanced, but zero *new Path2D constructions inside the domain draw*; rAF stalls also occurred on draws that built no tiles. In those two movement samples, drawImage calls with a 384×384 source into the 1440×769 screen occurred 83–93 times at median 3.2 ms (only calls ≥0.5 ms recorded); 516×516 tile-to-screen calls were observed 7 times at median 10.9–11.9 ms. Source size alone does not prove the 384×384 layer's identity, and these nested timings must not be summed with render or frame times.

## Tile and strip experiments

The 0.94 storyCamera destination required eight fixed-grid tiles at the computed viewport. Three expensive full-tile samples were repeated at the same camera/time and matched pixel-for-pixel; full tile commands were roughly 1–3 ms and forced raster/readback roughly 7–21 ms in the wider eight-tile sample. The one-pixel-read variant measured source flush 3.8–15.1 ms, then drawImage 0.3–0.5 ms and destination getImageData 0.4–0.6 ms, with eight tile RGBA buffers matching their monolithic comparisons. Sorting diagnostic samples by asset size serializes large vectors outside those timing windows; it is not a production operation. One tile can still block beyond a single 16.7 ms frame and timing varies.

Splitting a 516×516 tile into four clipped 129-pixel strips changed 5,483–6,946 pixels per sampled tile, maximum channel difference 14–20. Full-vs-full repeats were exactly identical. A 64-pixel strip overlap reduced differences to 1,737–3,340 pixels, maximum channel 5–11, but did not eliminate them. The viewed full/strip scratch-tile pair had no obvious missing layer at normal size; it was not a full-screen visual approval, contour-displacement measurement or mobile test. The strip raster path was not adopted.

The disposable full-tile candidate precomputed only the saved storyCamera viewport at its original raster scale, forced each tile's raster with a one-pixel read, and merged completed tiles when the normal cache key matched. It never published a partly painted tile. In two fixed synthetic frames at scales .848 and .94 after a 9-second observation, baseline and candidate RGBA hashes matched exactly; candidate had five completed tiles, reduced new tiles 15→10 and render 159.4→105.3 ms. This 9-second observation is not a required or enforced guide duration. In real guide runs its observed per-tile work max was 14.4–19.9 ms. Its work runs in an async continuation after the idle callback, so the separately logged callback duration does **not** bound this work.

With real guide input and autosave active, chronological baseline/candidate/baseline/candidate measurements were:

| Sample | Closing rAF median / p95 / max, ms | New-tile render / tile count |
|---|---|---|
| baseline | 16.7 / 33.3 / 383.3 | 161.1 / 15 |
| candidate | 16.7 / 33.3 / 633.2 | 99.1 / 10 |
| baseline | 16.7 / 33.4 / 383.3 | 188.2 / 15 |
| candidate | 16.7 / 16.8 / 566.7 | 111.6 / 10 |

The candidate improved this individual render in these samples but did not improve whole-transition maxima; the cause of the between-run save-time difference is not established. Its combined original/pending cache accounting, input and camera-change cancellation, source mutation invalidation, timeout/lifecycle cleanup, real mobile behavior and GPU memory were not verified sufficiently for production. It is rejected, not an endorsed partial fix.

The existing separate deep-water diagnostic forcibly sets camera `(3300,3700,.35)`; that is not the observed initial gameplay camera. In order candidate/baseline/baseline/candidate, first render was 355.9/382.2/379.5/438.4 ms; subsequent 19 frames had median 0.8–1.0 ms and p95/max 10–13.8 ms. All 20 dynamic-water frame hashes matched in these tests. The prewarm targeted a different camera/raster key, so this equality does not validate its reuse there and the first-water hitch remains open.

## Save overlap

The closing frame also contains save work. In one instrumented Enter run, three 30,745,848-character JSON stringify/parse operations took 77–85/31–35 ms each; these were the story full-battle clone and two `P.snapshot` calls. The two snapshots used `compactArt=false` and took 108/112 ms; a later throttle save used `compactArt=true` and took 62 ms. The observations overlap with enclosing persist and long-task timers: do not add nested timings. `story.js` writes to persistence, while the user-facing portable export has a separate raw-data contract. This branch did not change save code.

Raw frame, input, Canvas, long-task, save, static-pixel and backend records plus a viewed scratch-tile pair: `evidence-stage40-water/observations.tar.xz` SHA-256 `e6734c8ab48964d24b0f0e4d2cf203ee75f10e4a373db1567afc91fc73ef63d3`. Diagnostic scripts in this directory target an isolated QA server on 8772. The retained source patches describe only the rejected QA prototype; they lack the required safe invalidation/cancellation contract.
