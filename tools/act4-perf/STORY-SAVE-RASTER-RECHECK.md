# Stage 40 tile recheck after story compact save

This is a diagnostic, not a renderer change. The QA source is common `782176a0` plus story candidate `2a7cc445b1d0fe9393105743648733f553d68536`, packed with unchanged world SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. The prototype is exactly the previously rejected full-resolution story-camera tile prewarm described in `STAGE40-FIRST-CAMERA-RASTER.md` on branch `codex/act4-water-raster-followup` at `dc9eb3ce`; its patches were temporarily applied only in the isolated QA and then reverted and rebuilt. No prewarm code is proposed or deployed.

Synthetic progressed stage 40, actual guide Enter, camera release, five seconds actual ArrowRight input, autosave enabled, same 1440×900 DPR1 software-rendered Chromium and single target browser as `STORY-SAVE-FOLLOWUP.md`. Samples in time order were baseline 1, baseline 2, prototype 1, prototype 2, baseline 3. The first two baselines are the preceding story-save candidate1/2 traces, not the old full-clone baseline. Available CPUs 5, live Chromium processes 10; available RAM 15.2–15.4 GiB, load 0.75–1.31. These short samples with instrumented real-time camera movement are not strict deterministic replay or mobile FPS.

| Run | Guide exit rAF median / p95 / max ms | Return-camera new tiles / enclosing render ms | 5s movement rAF median / p95 / max ms |
|---|---:|---:|---:|
| Baseline 1 | 16.7 / 33.3 / 233.3 | 15 / 153.2 | 33.4 / 83.3 / 166.6 |
| Baseline 2 | 16.7 / 33.3 / 266.7 | 15 / 148.8 | 33.4 / 83.3 / 133.3 |
| Prototype 1 | 16.7 / 33.3 / 233.3 | 8 / 94.1 | 33.3 / 83.3 / 133.4 |
| Prototype 2 | 16.7 / 16.8 / 233.4 | 10 / 116.2 | 33.3 / 83.3 / 133.3 |
| Baseline 3 | 16.7 / 33.4 / 249.9 | 15 / 163.0 | 49.9 / 99.9 / 133.3 |

The expensive 15-tile return-camera build is a one-time cost in these individual transitions, but tile builds recur while advancing: all three baseline movement samples created 12 tiles across four renders. Two of those four renders exceeded 40ms in each baseline. Yet 20, 21, and 23 other movement renders respectively exceeded 40ms while creating zero tiles, so eliminating first-camera construction would not remove the repeated delay. Timing wrappers are nested and cannot be added. Prior layer instrumentation observed software Canvas drawImage activity during the latter; it does not isolate GPU time or prove every zero-build delay is compositing.

The prototype prepared 7 and 5 complete original-resolution tiles, with worst individual work 17.8 and 13.7ms; it reduced the measured tile-build render, but worst whole-transition frame overlaps baseline samples and guide frame max was 66.7ms versus baseline 50.1–83.4ms. The two prototype samples are adjacent; they do not establish a robust overall win. The prototype's combined cache lifecycle, cancellation after early input/camera changes, asset mutation, and actual GPU memory remain unverified. Prior fixed-view and dynamic-water hashes matched for the same prototype under the earlier source; no new pixel claim is made for this timing-only retest. It is therefore rejected and fully reverted; no forced guide delay or low-resolution drawing was used.

Raw traces `story-save-evidence/stage40-story-save-{candidate1,candidate2,prewarm1,prewarm2,postwarm-base}.json.xz`; reproducible script `stage40-story-save-trace.py` and instructions are in `STORY-SAVE-FOLLOWUP.md`. Actual phone behavior, longer play, full natural progression, and a safe optimization for recurring movement remain open.
