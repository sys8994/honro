# Canonical JSON structure experiment — rejected

**No runtime change is proposed.** QA-only prototype `rejected-canonical-prototype.patch` has a data-loss counterexample and must not be integrated. QA has been restored to common `23e8204a`. This branch contains only the diagnostic patch, tests and evidence; it does not apply the patch to `profile-store.js`.

The control is signature-only candidate `6963180f94358eae9afdac9af544ae8216f79fb6` (itself subject to independent review), not an already deployed optimization. The frozen original 31–40 world SHA-256 was `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`; current 33/34 art is excluded. Actual 40 boarding checkpoint SHA-256 `2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141` was imported with the real UI and continued through the title button.

## Prototype and decisive counterexample

The prototype retains one private parsed canonical value and its original JSON/signature for the largest matched asset, limiting the source text to 5 million UTF-16 code units. On a candidate hit, it recursively walks the current provider and then each live asset, comparing **all own keys in order**, ordinary array/object prototypes, property descriptors and primitive values, including exact `===` string values. It rejects accessors, custom prototypes, cycles/aliases, sparse or extra array properties, unsupported primitives and inherited `toJSON` and then uses the control serialization path. The parsed structure was private, but the prototype did not establish a complete memory bound for that structure and is not release-ready even apart from the following error.

A JavaScript Proxy can report the original vector via `getOwnPropertyDescriptor`, the original own keys and normal prototype, while its ordinary `get` returns a modified vector. `JSON.stringify` invokes ordinary reads, but the prototype's descriptor traversal sees the original. In the live-asset case, the control correctly left the modified `M999 999` asset inline; the prototype returned an official asset ref to the old `M0 0L30 30` art. The equivalent provider-side Proxy also makes the control leave the live asset inline while the prototype emits a stale ref. The precise minimal inputs/outputs are in `evidence-canonical-save/contract-results.json`; `canonical-contract-probe.mjs` asserts both mismatches. Ordinary browsers do not expose a reliable general test that distinguishes every Proxy from its plain-looking target, so descriptor traversal alone cannot supply the requested fallback for all unsupported values.

The same differential harness matched the control for 20 non-Proxy cases, including a 200,002-character path changed at its tail, provider mutation, key order, add/delete, arrays/holes, unsupported primitives, custom prototype, accessor, cycle, shared alias and `toJSON`. That does not repair the Proxy counterexample or prove the contract for every object. In the real checkpoint sample, 26 matching placement assets and their providers were not top-level frozen; treating object identity as immutability is not justified. Deep-freezing or replacing live assets would change the mutation contract and was not applied. A future approach would need a trusted, non-substitutable immutable source/lifetime contract, with user mutations routed safely to the old path; simply checking descriptors, version or identity is insufficient.

## Observed speed, not an adopted result

One headless Chromium 154 browser, 1440×900 DPR 1, software Canvas/SwiftShader, five CPUs; live UI import, normal keyboard/wheel/drag and autosave. Same checkpoint, but clock/camera and host scheduling vary. Chronological prototype / signature-only control / prototype / control, each 19–20 flushes; p95 nearest-rank:

| Run | Flush median / p95 / max ms | compact median / p95 / max ms | max-zoom movement rAF median / p95 / max ms |
|---|---:|---:|---:|
| rejected prototype 1 | 35.1 / 45.6 / 45.6 | 30.1 / 40.1 / 40.1 | 50 / 100 / 150.1 |
| control 1 | 43.3 / 55.5 / 55.5 | 38.8 / 50.5 / 50.5 | 50 / 100 / 116.7 |
| rejected prototype 2 | 35.0 / 44.3 / 64.8 | 29.7 / 38.8 / 57.3 | 50 / 100 / 133.4 |
| control 2 | 44.7 / 53.0 / 53.0 | 39.8 / 48.0 / 48.0 | 50 / 100 / 150.0 |

The control 1 run briefly overlapped a local ~0.3s Node contract check, so the small timing sample is not strictly isolated. The result identifies potential cost, not a release or phone FPS result. The plain-data test does not validate artwork or a natural full playthrough. Long frames and tile stalls remain; performance remains unresolved.

## Reproduce safely

On a disposable checkout of `6963180f`, apply `git apply tools/act4-perf/rejected-canonical-prototype.patch` and run `node tools/act4-perf/canonical-contract-probe.mjs`. The script expects the two Proxy differences, so a passing process means the counterexamples reproduced, **not** that the candidate passed. Pack the frozen world and build only a disposable QA copy, then use `HONRO_QA_BASE=http://127.0.0.1:8775 python tools/act4-perf/stage40-save-breakdown.py TAG`, restoring the control between candidate/control runs. No partial screenshots or visual-equivalence approval are claimed. Raw traces `evidence-canonical-save/browser-traces.tar.xz` SHA-256 `c0106b1fec60af1aeb846d9e08162bbf3b44c0d3bd1c0fca63fac72715337100`; correctness output is alongside it. No deployment occurred.
