# Stage32 independent root-solver study, 2026-11-18

## Result and scope

Local research candidate only. NOT merged, NOT pushed, NOT deployed. The current release candidate still excludes Stage32. The prior generated-commit ref rejection was not retried or routed through another ref. These files do not change any user's battle, saves or production checkout.

Read latest remote `STAGE32_COVERAGE_STATUS_20261118.md` and verified CI 44186346757 diagnose completed successfully. That status still rejects release: cold lower 400.5ms vs30.9 baseline; left356.2ms vs24.5; 31 protective-band pixels unproven; residual visual bright seams and band ends. Green CI is not visual/performance acceptance.

## New experiments

1. Extracted the exact source-preserving scanline compiler from the retained v5 helper. Tested 14,065 unique source segments at220,129 curve/height combinations, emphasizing extrema and very near boundaries.
2. Naive safeguarded Newton inversion failed precision:9,253 cases exceeded1e-9 source-unit error; maximum1.883744e-5. Retained rejected result and code, not adopted.
3. Derivative guard uses the original44-iteration inversion near horizontal tangencies. Accepted research math sample:maximum4.72937e-11; zero cases over1e-9. Full-range isolated inversion was about1.6x faster, not an overall frame-speed claim.
4. Built a separate candidate helper with only root inversion changed. All original path strings, masks, color coverage16x16 samples, .002 browser-oracle guard, cache bound, and output logic remain unchanged.
5. On300 deterministic sampled rows inside the actual world1385..1716 band,450,000 random queries produced0 topmost-path/gray-label differences and0 oracle-fallback-decision differences. Five paired isolated row-build samples: original16.37..18.17ms, candidate7.84..10.16ms. This is NOT proof over every possible sample and NOT a Chrome pixel/render timing benchmark.

## Next gate

Do not adopt until the exact latest Chrome image matrix and browser containment oracle are rerun without weakening tolerances, real full-render paired cold/pan timing is measured, the31 protected-band pixels receive semantic contribution analysis, and visible seams/bands pass actual image inspection. Reducing one small CPU component may not resolve overall400ms cold cost. In this environment normal sandboxed Chromium startup is blocked (independent Stage7 probe:socket Operation not permitted); no sandbox bypass was used.

Files: reference.cjs, benchmark-v1.cjs/result-v1.json (failed), benchmark.cjs/result.json (guarded), candidate-art.js, make-candidate.py, rows.cjs/rows-result.json.

## Remote verification follow-up
This source-only candidate is being registered on the existing independent inspect/stage32-scanline-20261118 branch for its unchanged CI. No generated-release ref retry or workflow edit. The local-only status above records the state before this commit; test outcome remains pending.
