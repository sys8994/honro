# Stage 40 A01 prediction replay follow-up

Code commit `e185d7b1be68af291d0b7b16925e19ed8b712e8b`, on common `782176a0` plus story-save candidate `2a7cc445b1d0fe9393105743648733f553d68536`; frozen original world SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. It adds only the exact official `(stage 40, preview 40)` pair to the already independently reviewed stage 38 A01 private replay contract. It retains one isolated native structured clone and one replay, checks current data each time, keeps all gameplay fields, collision geometry, units, terrain, escort and narrative state, and omits only placement asset vector drawing bodies. Other skills/stages, workshop/custom, invalid data, accessors or dangerous aliases choose the full clone before executing. It does not change rendering, persistence or portable export. This is a narrow authored-game contract, not a general replacement for `structuredClone` or a guarantee for monkey-patched production hooks.

## Why stage 40

In an instrumented Chromium real movement sample, 19 renders took over 40ms without building a tile. Across those renders `predictionGuide` median was 39.0ms, nested engine `predict` 38.8ms and nested `structuredClone` 35.5ms; `occludedUnitSilhouettes` median 5.3ms and summed drawImage per render 4.3ms. These are nested timings, not additive. The active unit was archer with A01 selected; this is one headless sample with instrumentation overhead, not phone performance.

The 38 gate was intentional scope established by its review, not evidence that 40 has identical gameplay. Static audit of the fixed arrow replay follows `arrowPrediction` -> fresh Engine -> fire -> projectile steps/collisions. In the shared engine, direct placement-vector access in `wreckDamage` is gated specifically to preview 39; equipment's unrelated `vector` field remains in the snapshot. The real 40 escort/story runtime wraps the live engine instance; the replay uses the same detached fresh Engine on both paths. `terrain`, residents, dynamic deck, escort progress, reader and receipts remain fully cloned. Any future replay hook that uses drawing bodies invalidates this audit and requires fallback or updated contract and tests.

## Equality, fallback, and actual saved state

- Corrected independent synthetic scenario setup: 149 non-passive skills × official/modified-art/custom-workshop/broken-terrain/status = 745 full-clone vs candidate outputs exactly equal, no errors, live battle JSON and RNG unchanged. Canonical JSON SHA-256 for both `f0a90894fca751423332e0eb9697022861ff583b7d9819c9230811bae5d39035`.
- Actual 40 boarding (`sailing-observation`) and landed storage checkpoints were loaded through real title Continue. Each was frozen and independently modified into 18 cases × unit collision on/off: movement, target, terrain broken marker, status, skill/rank, angle/power/wind, custom flag, modified art, deck position, passenger, boat/escort clock, residents and reader/receipts. Full and candidate output JSON and RNG/live checks matched for all 72. Actor movement, skill, angle, power and wind changes positively changed the resulting trajectory in both collision modes. The checkpoint has no breakable terrain fixture: the broken marker is synthetic and the separate damage case may be a no-op; this does not prove an actual destructive event. Boat/deck/reader mutations are synthetic variations of real saves, not a claim that each changed a projectile outcome.
- Fixed stage-40 camera/time: 24 predictions (A01/A02/A05/A14 × 3 angles × collision mode), live/RNG and RGBA canvas SHA-256 `ce1e3834dff174172a9e03b3fb5564b5dae3eaa71a578b14af2b19812c3383ee` match. This is one scene, not all visual states or phone rendering.
- Official A01 used one narrow clone and one `HonroClearReport.cast`. Custom/workshop, other skill/mode/stage/preview, altered skill mode, nonofficial, placement/art/child aliases, cycle and accessors each selected one full clone before one cast; uncloneable art kept `DataCloneError` and ran no cast. These are controlled cases; real downloaded custom maps and arbitrary injected JS remain outside the claim.
- The actual stage-40 checkpoint progressed from boarding into sailing, persisted escort progress and restored boat/deck/resident offsets through title Continue/reload with modal pause holding state. Source checkpoint SHA-256 `2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141`. This is not a full natural 39→40 playthrough. TypeScript `--noEmit`, synthetic stage-39 wreck and resident platform-drop restore tests passed.

## Browser timing

Synthetic progressed profile, real guide dismissal and ArrowRight for five seconds, autosave active, actual camera follow, 1440×900 DPR1. In B/C/B/C order, where B already includes story-save candidate:

| Build | movement rAF median / p95 / max ms | zero-new-tile renders over 40ms |
|---|---:|---:|
| B1 | 33.4 / 83.3 / 133.3 | 21 |
| C1 | 16.7 / 33.4 / 83.4 | 0 |
| B2 | 41.6 / 83.4 / 166.6 | 27 |
| C2 | 16.7 / 33.4 / 100.0 | 0 |

One headless Chromium target, 10 live Chromium subprocesses, 5 available CPUs, available RAM 15.3–15.6 GiB and load 1.03–1.58. This uses software Canvas/SwiftShader; timing hooks, camera/input timing and host variation remain, and two runs each are not real-phone FPS. New-tile and first-water rendering hitches remain. The candidate has not been merged or deployed and needs independent review, actual mobile and longer-session testing.

Scripts `stage40-all-skills-diff.py`, `stage40-checkpoint-diff.py`, `stage40-prediction-contract.py`, `stage40-prediction-parity.py`, and `stage40-prediction-compare.py` reproduce comparisons against separately built candidate and baseline QA servers. `stage40-cpu-detail.py` captures nested call timing; `stage40-story-save-trace.py` captures UI movement. The original world and checkpoint restore/build steps are in `tools/act4-rc/README.md`. Raw results and observations in `evidence-stage40-prediction/`; archive SHA-256 `335efd68034d3f065a5cfe0b44b9a55db17ef7126f1ae87b01380e8409d634d3`. The B1 trace is in `story-save-evidence/stage40-story-save-candidate2.json.xz`. One target browser should be active for timings.
