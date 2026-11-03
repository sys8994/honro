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

### Observer syntax regression (run 41548197804)

The first focused CI run reached normal title Continue, then the test observer
failed to parse (`Page.evaluate: SyntaxError: missing ) after argument list`).
Its exact artifact is `13188939789`, on request `ade6453e` and generated candidate
`781cb3bc0441b58330105e812cef8b16c7473c4d`. This is a harness failure before any
crossing measurement, not evidence of a gate/game failure or successful crossing.
The missing `flatMap` closing parenthesis is corrected without changing fixture,
game bytes, movement, or assertions. Self-tests now parse every injected browser
JavaScript expression with Node and execute the exact snapshot against live and
transient no-battle mocks. Failure screenshots are attempted independently of
the observer so a future observer error cannot suppress the actual pixels.
Actual Continue/cross/autosave/reload remains pending a corrected focused CI run;
local Chromium execution remains unavailable. No full combat replay is required.

### Authored walking interruption (run 41548793487)

The corrected observer measured a valid initial repair within 689 ms: both gate
terrains opened and the exact objectives, party, HP and resources were preserved.
Archer moved from x8879.629 to x9235.504 at y4580, spending ordinary movement,
then the authored `A2.S17.MID.11` clear-sightline dialogue paused input. Artifact
`13190536087` preserves the failed assertion and actual `failure.png`; this is
not yet a crossing/autosave/reload pass. Source `act23-v4-reviewed17.js` uses
`clearShot(app,q.clearShot)` to start the one-shot `shot` scene; its reviewed row
says “축에는 안 닿습니다. 앞의 놈부터 쏘겠습니다.”

The controller now releases direction, permits only this observed row, records
its ID/text and ordinary visible Next click, verifies exact resources/objectives
while paused, and resumes held direction only after normal grounded input returns.
Unknown rows/choices and resource changes still fail; no outcome choices are
selected. A bounded 15-second interruption handler stays within the original
20-second crossing deadline. A model test checks release → Next → resume order
and rejects unknown dialogue/resource mutations. Eight helper/JS tests pass;
actual final crossing/save/reload is still pending the focused corrected run.

### Actual browser acceptance: run 41549658978

On 2026-11-03, focused run `41549658978` succeeded on request
`98d394979d2435bf8225f8cf9d40f087d291fe35`, harness `614c92e4`, and unchanged
exact generated candidate `781cb3bc0441b58330105e812cef8b16c7473c4d`.
Artifact `13191085652` (ZIP SHA256
`f548cf3d9a2e701920e55b717c3992baa6cf074b81c0ff57a16de0b3d197ec85`)
was downloaded and its result and all four actual screenshots inspected.

- Normal Continue restored the repaired gate in both terrains within 591 ms;
  initial party, objectives, proof, HP, focus, movement and positions matched the
  exact old save. Imported profile SHA256:
  `b2a8ea47372a7af7414460f2cd464889b07dca066cb31de4aa596cabf3e1db7a`.
- Twenty-five ordinary movement observations crossed the former gate (x9300–9410).
  Archer moved from (8879.629, 4580) to (9474.936, 4604.979), full body beyond
  the gate. Movement decreased from 1609 to 1009.640; HP remained 577.9 and
  round remained 34. Other party resources and all objective/proof fields stayed
  unchanged. No attack, jump, turn completion or state mutation was used.
- One recorded visible Next click completed the legitimate `A2.S17.MID.11`
  dialogue. No choice, forced outcome or synthetic completion was used.
- Normal autosave retained the crossed position and both open gates; the saved
  projected receipt equals the subsequent reload/Continue live receipt exactly.
- Result passed with no page errors, exception, profile lock or save warning.

Inspected artifact screenshots under
`candidate/_local/reports/stage17-gate-browser/`:
`repaired-before-crossing.png`, `crossing-dialogue.png`,
`crossed-repaired-gate.png`, `reloaded-crossed-gate.png`.
Local preserved download: `_local/reports/stage17-pass41549658978/`.
The first/reloaded images include the ordinary R34 turn banner; the crossed
image shows the actor on the descending path beyond the repaired passage.

This closes the repaired-gate Continue → actual movement → autosave → reload
regression for this exact generated candidate and old interrupted native save.
It is not a fresh Stage17 clear, continuous campaign, or new combat-rate sample.
The two earlier controller failures remain archived and are not relabeled passes.

### Public Pages verification mode (prepared; not yet executed)

After the deployment owner confirms Pages publication, a request may add the
boolean `"public":true`, or workflow dispatch may set `public` to true. The only
public target is `https://sys8994.github.io/honro/HONRO.html`; callers cannot
supply another public origin. No request file is added by this change.

The same isolated-browser test imports the entire genuine fixture once and
performs the same Continue/cross/Next/autosave/reload sequence. Public HONRO.html
and manifest bytes must equal the checked-out generated candidate before any UI
interaction. Each actual loaded browser response is checked against that exact
manifest (HTTP206 media slices against the corresponding candidate byte range).
Unknown origins/resources, mismatches, HTTP failures and missing game/data
responses fail. The receipt records the public URL and matched browser bytes.
Only resources used by this focused test are fetched; unrelated chapter assets
are not bulk-downloaded or gameplay-retested.

Public identity verification is candidate-relative. The workflow's existing
normal-build provenance gate remains c5-specific until the deployment owner's
new merged-source build/run contract is verified and explicitly bound. It must
not be disabled to accept a changed master, and prepared public mode does not
claim that candidate781cb3 is deployed or is the final merged release.

### Dialogue-preserving merged candidate provenance

The gate additionally accepts the explicitly reviewed
`.github/workflows/act2-dialogue-integration.yml` contract. Requests for that build
must pair exact `sourceRef` and numeric `prerequisiteRun` with `generatedRef`;
`public:true` is still only permitted operationally after confirmed deployment.
The run must be successfully complete at that exact source and have successful
normal-build, actual new-arrival/first-shot plus Stage17-entry/save, and generated
candidate-preservation steps. Artifact name is derived from its verified workflow
and source, not supplied as an arbitrary download name.

The generated commit must have that source as its sole direct parent. Artifact
`generated-commit.txt`, final HTML/manifest hashes, source-parity receipt, unchanged
b411 runtime digest, exact original781 Stage31 package SHA, c5 measured-source and
c916 published-dialogue parents must agree. Actual Stage31 diagnostic must show
visible `A4.S31.SEA.01`, damage >0, no errors, `diagnosticPassed:true` and
`complete:false`; Stage17 entry/save must pass. The ordinary release gate is
rechecked without rebuilding or replaying combat. The original c5 workflow is
still accepted only with its original exact source/run. Unknown workflows, source
mismatches, incomplete runs and missing successful steps fail closed; mocked tests
cover those rejections. No new run or generated SHA is invented by these options.
