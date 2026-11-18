# Registered Stage32 SS2 verification

Commit `f13588b7bea1218d5ffab8b938bd4f09a0b8b4fd`; CI44213621850 succeeded; job134497863750; artifact14386819308.

## Passed

- Registered production helper six-buffer/state/fallback/cache/reset/source contracts.
- Existing original25-path/provider/alpha/other-stage and isolated codec contracts.
- Actual Workshop and Game builds from repository root, without a temporary fixture helper swap.
- Actual App manifest order, excluding exactly main.js (App construction, user storage and automatic RAF). SS2 is not injected separately. Engine core, production helper and art hook order checked.
- Four performance captures and ten matrix captures all completed. All14 recorded no user storage access, runtime errors or CSP violations. Original PNGs retained frozen hashes; SS2 seven-view outputs exactly equal the previously reviewed SS2 captures. Alpha and world<=1380 road/walk buffer unchanged.

## Performance: measured cost, not device acceptance

Same-run prepared-source, decoded-asset, isolated Scene benchmark. Ten cold builds per view;60 pan frames. Chrome CDP diagnostic domains were active for both baseline and SS2. Not mobile hardware, cold app launch, ordinary UI gameplay, or60FPS certification.

| Measure | Original lower / left | SS2 lower / left |
|---|---:|---:|
| Cold median (ms) |130.9 /87.4|174.2 /112.3|
| Cold p95/max, n=10 (ms) |136.3 /96.6|224.6 /139.1|
| Pan maximum (ms) |31.1 /53.1|41.4 /85.9|
| Pan p95 (ms) |1.1 /2.3|1.4 /2.2|

SS2 cold median overhead is33.1%/28.5%. The85.9ms left-pan spike occurs at x1072, with three material rebuilds; original at the same x had53.1ms. This is not a no-cost-change result. Earlier research-run SS2 pan maximum55.4ms must not supersede this newer85.9ms observation. Warm/cached calls are cheap, but rebuilding has visible-risk spikes. Do not call this performance acceptance.

SS2 logical peak scratch+live-readback6,307,584B and retained canvases4,918,512B unchanged from prior captures. Original retained canvases2,947,392B. These overlap and must not be summed as independent quantities; neither measures actual JS/native/GPU heap.

## Visual judgment and remaining work

Seven SS2 PNG hashes are byte-identical to reviewed output, so registration introduces no new visible change. The improvement remains partial: fine green traces persist on the left curved contour and walk-view arch. No rejected broad horizontal color-band/inset-texture scheme is present. This is registered improvement with preserved geometry, not proof that all seams are removed.

Real user save migration, normal-input end-to-end gameplay, actual mobile performance, master integration and live Pages verification are outside this CI. No deployment claim follows from success.

## Harness issue resolved

Prior registered CI used a driver returning document.documentElement.outerHTML, including165,780,809B runtime text, with unbounded response waits inside CDP commands. A separate unchanged-baseline single-page probe completed in about15s using bounded commands and result-pre-only extraction, preserving the exact baseline PNG hash. The full14-view run then succeeded using that bounded result-only driver. This strongly localizes the previous stall to result transport rather than scene rendering; the precise old WebSocket failure is not claimed without its completed diagnostics. Previous long-running CI was not cancelled by this worker.
