# Stage3 production validation handoff

Executed in GitHub Actions against the public baseline and successive registered production candidates. Final run evidence is recorded below. Master integration and public deployment are separate release steps.

The five .mjs scripts are installed under tests/ and YAML under .github/workflows/. The production build registers the new BODY and its paintBeyondTerrainDomain / omitTerrainClosureIds flags. This suite refuses a test-only runtime. The browser fixture has no source replacement or test artwork injection.

## Final executed result (2026-11-18)
- Candidate: `5960c2b9d81b291552ead223d83ae0ae9c876845`.
- Public baseline: `7d238d20663c3ceffe430eb0304e01516ae625cf`.
- [Actions run 44257279513](https://github.com/sys8994/honro/actions/runs/44257279513): SUCCESS, job 134641890324.
- Artifact `14406606911`, `stage3-production-validation`, ZIP SHA256 `bad0a984578faa87504def5e1bcf766e7980703868d67f47d4e60ac064984f69`.
- Artifacts retain the old synthetic snapshot, verification JSON, both legacy suite logs/status, all 24 screenshot/raw timing pairs, and aggregate comparison JSON.
- All authored stage data and every non-BODY asset are unchanged. Compiled gameplay unchanged outside exact BODY payload. Old saves restore exactly with current or empty providers; saved same-ID variant preserved; fresh save roundtrip passes; old flag absence/new flag presence confirmed. `critical-save-failure` passed.
- Inline snapshot grew 1,153,396 → 1,158,250 bytes (+4,854 bytes, about 0.42%). No local-art-table compression is claimed.
- Each baseline/candidate view is byte-identical across four repeated PNG captures. Camera, physics and stage hashes match. No storage access, errors or pending image decode in timed frames; warm frames rebuild zero terrain tiles.
- Legacy `act1-local-art-save` FAILS on BOTH versions with `Missing table for stage3`, recorded separately as pre-existing, NOT passed. No codec was modified to conceal that mismatch.

### Paired cost observations
Headless software-render reference, same runner, ABBA twice. Times below are milliseconds, baseline → candidate. Each variant/view has 20 scene-cold, 96 warm and 48 pan samples. Fixed synthetic visual state; external native monotonic timing.

| View | Scene-cold p50 | Warm p50 | Pan p50 | Pan p95 | Pan max |
|---|---:|---:|---:|---:|---:|
| Desktop 1331×763 | 42.6 → 40.6 | 1.6 → 1.6 | 1.5 → 1.5 | 2.5 → 4.0 | 2.8 → 5.6 |
| Portrait 390×696 | 21.3 → 20.4 | 1.6 → 1.7 | 1.5 → 1.5 | 2.5 → 2.6 | 2.7 → 2.7 |
| Native zoom 1.65 | 2.1 → 2.0 | 0.5 → 0.5 | 1.0 → 0.9 | 7.3 → 7.2 | 7.8 → 7.9 |

Desktop cold median improves in both ABBA blocks (-2.3/-2.0ms); portrait -0.9/-0.9ms. Desktop pan p95 increases 1.5ms and max doubles; do not describe the candidate as universally faster. Desktop warm max is 7.2 → 9.4ms even though median unchanged. Portrait warm p50 increases 0.1ms. Full raw data is retained rather than masked by a made-up pass threshold.

Maximum terrain tile canvas `worldBytes` grows **2.25×**: desktop 8,520,192 → 19,170,432 (+10,650,240 bytes, +10.16MiB), portrait 4,260,096 → 9,585,216 (+5,325,120 bytes, +5.08MiB). Screen world/background counters remain 4,062,212 each on desktop/native and 1,085,760 each on portrait; native uses zero terrain tile bytes. These are instrumented canvas counters, NOT whole-process RAM or GPU VRAM.

First pre-image-decode frame medians: desktop 104.4→96.9ms, portrait81.6→74.9ms, native55.5→48.4ms. This is not total ready-to-play loading. Scene-cold recreates Scene/tile/screen caches after source/image preparation, not full cold app startup. Measurements do not certify device FPS, sustained mobile behavior, battery cost, memory pressure or normal gameplay completion. Deployment/master verification is outside this validation package.

## Save and scope
Baseline public SHA7d238d20663c3ceffe430eb0304e01516ae625cf generates a synthetic initial Stage3 battle using production code. Candidate must match every authored stage and every non-Stage3-BODY asset exactly. Compiled battle is compared in full, excluding only exact nested BODY asset payloads. If a new renderer metadata field fails this strict comparison, inspect it; do not broadly discard non-art fields.

Old inline and production-encoded snapshots restore exactly in the new codec, including with the current provider library removed. A saved same-ID variant is preserved. Fresh candidate roundtrip and flags are checked. Old saved assets must remain unflagged, so paint-domain and nonwalkable-rim changes can be gated by saved asset flags rather than Stage3 ID. Profile migration compact-vs-inline equality is additional evidence, not a substitute for exact old battle restoration.

Storage in appHarness is an isolated in-memory Map, never the user's browser storage. critical-save-failure additionally exercises synthetic quota and error rollback. The legacy act1-local-art-save suite is run on both code versions and its exact known Stage3 table-assumption failure is retained as a pre-existing failure, NOT counted as a pass. Unexpected or different failures still block. No normal-play/real-device quota assertion.

## Performance
Same fixture copied byte-for-byte into baseline and final candidate worktrees. Three views: desktop minimum zoom, portrait minimum zoom, native1.65. Each view runs baseline/candidate/candidate/baseline twice, fresh Chrome profile/process per entry, sequentially on one runner. No source overrides and no helper instrumentation that differs between versions.

Each entry records initial pre-image-decode frame separately;5 fresh Scene/tile/screen-cache builds after image/source preparation;2 screen-prime frames;24 warm calls;12 actual constrained pans in both directions. All raw samples and Scene cache memory counters are retained. Each timing phase is labeled, especially that scene-cold is NOT full app cold startup. Warm samples assert no domain tile rebuild.

Comparator enforces same physics, camera and authored stage, and stable render PNG per variant across repeats. It reports phase medians/p95/max and per-ABBA-block deltas; it deliberately does not invent a time threshold or silently call positive regressions a pass. Review cold/pan/native costs and portrait memory, not warm-cache timings alone. No normal-play FPS claim.

The actual requested pan coordinates are included in each row. Native zoom may be constrained in x by normal camera rules; compare observed paths rather than intended positions.

## Local validation performed
Node syntax checks passed for all five scripts. Runtime/codec/Chrome tests execute in GitHub Actions, not the restricted local workspace. The local Chrome launch was blocked by its socket sandbox. CI evidence, not local syntax checks, establishes the results below.

## Corrected public-codec assumption
CI44253255164 failed while creating the public baseline, before candidate verification, because this test incorrectly demanded a local-art table. Exact public profile-store.js localArtAsset accepts act1-traced and selected other prefixes, not act1-site. A local VM reproduction using the unchanged public codec confirms act1-site:3:body is returned inline with the same reference and restores exactly; an otherwise identical act1-traced synthetic asset creates a table. No codec registration variable is missing. The script now records actual inline/mixed representation, checks self-contained duplicated BODY payloads and idempotency, and compares the real old representation across versions. It does not add a new codec rule or pretend compact savings occurred. This correction passed the full candidate save harness in runs 44254418008, 44255727140, and 44256089332.

## Real-clock correction after run 44254418008
Chrome `--virtual-time-budget` froze `performance.now()` inside post-await synchronous render samples: every scene-cold/warm/pan sample was 0ms. Those duration samples are INVALID, not evidence of zero cost. `stage3-production-browser.mjs` now drives an isolated synthetic page through CDP without virtual time, polls the result, and closes its fresh profile. It uses software canvas (`--disable-gpu`) for a reproducible reference raster path. Results are headless CPU reference costs, not GPU/device FPS. The extractor now rejects an all-zero cold timing series.

The old run's native screenshots differed even on public baseline (150–311 pixels, max channel deviation 1); desktop and portrait screenshots were exact across all four repeats. The initial GPU/raster rounding hypothesis was not confirmed: software rendering still varied until the independent production cloud clock was identified (see below). The strict repeated PNG hash comparison is retained, not weakened.

Old run 40d memory counters were valid non-timing observations: peak worldBytes desktop 8,520,192→19,170,432 (+10,650,240); portrait 4,260,096→9,585,216 (+5,325,120), 2.25× both. Screen cache counters unchanged. Native used zero terrain tiles. These counters are not whole-process peak RAM.

## Fixed visual clock, separate real measurement clock
Source investigation found `shared/runtime/time-of-day.js` `clouds()` advances cloud position from `performance.now()` independently of Scene dt/time. Thus image warmup duration changed the captured cloud phase even when Scene.time=2 and dt=0. This explains why switching software rasterization alone did not eliminate the small upper-background differences; the earlier GPU-rounding hypothesis was not sufficient.

The fixture now binds the native performance clock before fixing the production animation clock at 2000ms. All external first-frame/cold/warm/pan duration measurements use that preserved native clock. All production render code sees the same clock, so the unchanged strict PNG equality remains meaningful. Internal renderer build-time counters (`worldBuildMs`, etc.) use the fixed visual clock and are explicitly invalid for time analysis; external sample durations and byte/build-count counters remain usable. No runtime source or saved data is changed by this test fixture.
