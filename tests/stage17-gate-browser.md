# Stage17 repaired-gate actual-browser probe

Run against the generated, gated production candidate containing `d8f89737` / `c5f9765e` and its existing fixture. This test commit contains **no game, workflow or fixture change**. It does not rebuild or launch a server.

```sh
python tests/stage17-gate-browser.py --self-test
python tests/stage17-gate-browser.py \
  --url http://127.0.0.1:8870/HONRO.html \
  --out _local/reports/stage17-gate-browser
```

`--fixture` defaults to `tests/fixtures/stage17-gate/old-natural-continue34.json.gz` relative to the checkout. `HONRO_QA_URL` and `HONRO_QA_OUT` provide defaults; `GITHUB_SHA` is recorded, or local HEAD otherwise. Python Playwright with installed Chromium is required for the real run. The fixture already exists on the integration branch; do not duplicate it into this test commit.

## Exact entry and provenance

The fixture wrapper contains `provenance`, `profile`, `b`, actions and diagnostics. Its entire unchanged `profile` is imported once before normal title Continue; `profile.honroBattle` must equal wrapper `b`. This is an actual interrupted **native App** ground-policy checkpoint at R34, not an old browser success or a fresh campaign. Its original entry used synthetic legacy-budget growth and prior-clear unlock flags; original actual entry actors were level13. Preserve these limitations.

- Gzip SHA256: `0ae6a6c22718b821f65cadc2882bde026f43774d3c86263a9120e9cd263cdf5e`
- Decompressed SHA256: `8eceb8323fbfb4965d6b7d3a751dfd9fcefd6de473bc2c801b83defc042434d2`
- Recorded source checkout: `2b93d09b1c8d7a92056617d3198f6c33743d095c`
- Source state: Stage17, R34, allied aim, active `p-archer` at x8879.629/y4580 with1609 movement. Both terrain representations of `gate-repair` are closed, x9300–9410/y3280–4630.
- Existing completed mesh proof identifies worker `17.mason` and carrier `17.gilchan`; existing lock proof has `pinSeated:true`. Defense is not completed. No proof, objective, gate or actor field is created by this probe.

## Required observations

1. Normal Continue and legitimate dialogue Next only; wait for real grounded input. Record the wall-clock normal-frame/load window. No frame stepping, animation freezing, teleports, manual gate flips or direct gameplay calls.
2. Gate opened in **both** collision/world terrain from the saved proof. Require unchanged geometry, R34/actor/phase/shot counts, objective completion/proof/markers, party identity, HP/maxHP, focus/maxFocus, movement, loadouts and equipment on initial input-ready observation. Positions have a documented0.05px floating-point tolerance; resources are exact. Any real ambient change fails rather than being compensated.
3. Hold one ordinary ArrowRight across read-only16ms observations for at most20s. Release in `finally`. Active actor must cross with its whole body beyond the former gate's right edge, while vertically inside its original obstruction; walking must spend movement. No jump, attack, turn end, actor selection, or objective interaction. Initial600px-scale approach fits the existing1609 movement.
4. Wait at most10s for ordinary dirty-movement autosave (production throttle1200ms), never invoke persist. Require stored open gate, current crossed position/resources and unchanged objective state. Reload and normal title Continue; require the same saved crossed position, resources and open gate.

The receipt captures source, served HTML/manifest hashes, exact fixture/profile hashes and provenance, baseline/initial/crossed/autosaved/reloaded state and movement samples. Screenshots: `repaired-before-crossing.png`, `crossed-repaired-gate.png`, `reloaded-crossed-gate.png`; failures retain `failure.png` and structured exception/state when available.

Local validation: five pure mocked-state helper tests pass (proof/both-terrain requirement; HP/resource/objective preservation; actual-body crossing and movement cost; reload position/resource preservation; immutable geometry), plus Python syntax. Real browser execution was not attempted because local Chromium socket launch is already known blocked. Actual CI execution on the final generated build is required. This is a focused repaired-passage/continued-save test, not Stage17 defense completion, fresh playthrough, pacing or full battle acceptance.

## Standalone workflow: exact generated candidate only

`.github/workflows/stage17-gate-browser.yml` runs only this focused probe. Supply an immutable generated commit SHA, not the source commit, branch name, old HTML checkout or a merge containing other changes.

Required prerequisite is successful run `41543828006`, exact source `c5f9765e369cd6a69d4e7440a65756d8519e4923`. The workflow checks its successful normal build gate, final-browser regressions and generated-package preservation via the read-only GitHub API. A still-running/failed run fails the prerequisite; this workflow never bypasses it or starts another combat run.

Invocation options:

1. When the workflow is available for manual dispatch, set the required `generated_ref` input to the exact generated40-character SHA.
2. Without installing a new workflow on master first, publish the QA workflow/test on `work/stage17-gate-browser/<name>` and then commit `.github/qa/stage17-gate-request.json` containing only `{"generatedRef":"<exact generated40-character SHA>"}`. Only that request file triggers the push workflow. Do not commit the placeholder. Workflow/test publication alone does not launch a probe against an unspecified candidate.

The candidate is checked out separately at depth2. It must be the direct generated child of the exact c5 source, with changes restricted to the integration workflow's generated paths (`web/`, HTML/index, measured production package). The verifier requires byte-identical repaired runtime source and genuine fixture, final HTML/manifest hashes from the prerequisite artifact, the exact measured package and every manifest file hash. Source c5 itself fails this check because it is not the generated child. Both provenance and test-harness source/hash are archived.

The existing `tools/stage31/check-release.mjs` normal gate validates the saved current production evidence once; it may materialize the unchanged ignored canonical world file. There is **no** `npm run build`, Stage31 first-shot/probe/fullplay rerun, terrain smoke sweep or other combat replay. Served/source bytes are verified again after the gate. Only then is the standalone QA script copied into the generated checkout, the exact package served locally, and the Stage17 input test run.

Output artifact: `stage17-repaired-gate-<generated SHA>`, containing prerequisite/API and package hash receipts, the normal gate log, harness hash, browser log and the test's three screenshots/structured result. A prerequisite mismatch, package/source drift, missing fixture/evidence, normal gate failure or browser failure remains an explicit failure.

Workflow authoring validation: Python compilation and YAML parsing pass; the existing five pure probe helper cases pass; malformed ref values (branch, short SHA, uppercase SHA and shell-like input) are rejected. The actual generated candidate is not available locally yet, so the final package/API/gate/browser steps remain unexecuted until the publisher supplies its verified exact ref. No workflow was dispatched during authoring.
