# Combined candidate Chrome/App replay plan

Planning only. No new playback, production edits, master update, Pages deployment or user-save access in this step. Final Stage3/7 exclusion manifest is still being prepared; Stage32 is pending and not assumed integrated.

## Verified Stage40 references
- Documentation330d10e3fb92e3975981ac108cab71772f7d429b is a direct child of test code6891a7e63c607d111497c3c8db9e1146b0779b90 and adds only game/docs/STAGE40_ACTUAL_APP_AUDIT_20261117.md.
- Actions44161304653: success; branch audit/stage40-qa-resume-20261117; exact head6891a7e63c607d111497c3c8db9e1146b0779b90; workflow.github/workflows/stage40-qa-resume.yml.
- shared/act4-stage40-placement.mjs has identical Git blob84379471a820d124545ef403a8206e4d273ce630 in runtimeb5c3fc203d9df64268d5f73ba3ae359e4847c283, tested6891a7e and combined6db36f5fb3b6d733ed5523746e84fe2b632eeabe. This is source identity, not whole-build identity.
- Documentation reports fresh UI combat29 rounds from d96e6387 (run44155794619, whole run failed later on obsolete dialogue assertion), then intact product autosave resumed in independent QA context by6891a7e, escort complete33 rounds and41 continuation/reload. Knight incapacitation on return means not an all-hero-survival pass. This step verified API/code/document provenance, not fresh artifact visual review.

## Extraction, preserve original sources
Resume required test-only files from6891a7e:
- tools/stage40-qa-resume/play.py, blob74c534eb2901bf2c38e06002f0ad7e3096b7d75e.
- tools/stage40-qa-resume/ui-d96e-round29.json.xz, blob537e556879c07f3ad05902aadea97d63668a8803. It is repository-owned QA evidence, not a user's save. Existing decompressed SHA gateada2099bcb273de6d7031cf1a8c8c3b361fa75054d73975521892ce112b7c3ed must remain exact.
- tools/stage40-app-flow/escort_inputs.py, blob1c03144e99b19cf42ed023c44a1055284ae24009.
- If reusing original input-contract check, also copy tools/stage40-app-flow/check-input-contract.mjs (f901c62e3adce9bbc6dd80eb57c0b128c1638163) and play.py (0f5e51c901f3ec016cff542c30b828080dfaef8d), which that check scans. Strengthen a separate combined test-only scanner to also inspect qa-resume/play.py without changing originals.
- Reuse original workflow setup but adapt only branch, evidence label, checkout/build identity. Explicit ACT4_RELEASE=1 and ACT5_RELEASE=1; official build, Playwright1.58.0/Chromium, local CI HTTP8870, fresh1440x900 context, original UI import and Continue. No real storage profile or user battle.
- Keep guard failures fatal: imported growth/proof/equipment equal original, no forced restart,29-round preserved,0living enemies, aim phase; native App E finish, resident survival, campaign reward/clear/proof and41 post-reload comparisons. Do not force33 rounds, hashes or hero survival as a pass threshold; record actual result.
- Runtime identity checks must hash the final combined build and separately compare the exact unchanged40 placement source. Old HONRO.html/manifest hashes must not be copied as new expectations.

This resumed-save replay covers final combined runtime restoration/escort/termination/41 continuation, NOT fresh40 combat or final combined40 placement creation. For fresh combat use app-flow/play.py plus existing tools/act4-ci/precise_aim.py and repository sailing-observation-local-storage.json.xz fixture; preserve rawSHA2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141 and normal UI QA migration entry. This distinct fresh test starts from QA progression, not natural1–39 play. No reset/retry or Engine.fire/tick/state mutations; inspect dependencies and scoped input contract before running.

## Four existing isolated Chrome routes
All already exist in combined6db36f5. New job names must say combined candidate, not re-use earlier run identity.
1.40: tests/monster-placement-browser-fixture.mjs / monster-placement-browser-result.mjs. ExplicitAct4, fetch7d baseline author. Baseline/candidate × overview/west/east=6views. Candidate records41ground contacts,42enemy8-secondsettling,16activationplaces and local action representatives. Engine-only local probes are not real App inputs.
2.34/35/37/38: act4-middle-placement-browser.mjs / act4-middle-placement-result.mjs. ExplicitAct4, baseline reconstruction from original raw/authors.2variants ×2views ×4stages=16views. Local action results are diagnostics; ok:true does not itself prove all local actions effective. Inspect each action result and warnings.
3.9/13/17/29: early-encounter-browser-fixture.mjs / early-encounter-browser-result.mjs. Baseline disables only declared placement author/9 whitelist while retaining combined terrain.2variants × focus/overview ×4stages=16views, optional unchanged30control2views in existing workflow. These are synthetic initial scenes.
4.43/47/48: act5-placement-browser-fixture.mjs / act5-placement-browser-result.mjs with explicitAct4/5 and7d encounter baseline.2variants × overview/west/east ×3=18views. Separate act5-placement-action-fixture.mjs produces3candidateoverview probes; local Engine activity is not actual App gameplay.

## Identified loader integration gap
The40 and middle isolated generators call runtimeEntries(app:false), then manually append act4-pilot-art, but their append lists omit stage33-exterior-art/stage34-foundation-edge/stage37-alpha-edge/stage38-alpha-edge. Those helpers are normally in the official app:true manifest. Replaying unchanged generators could silently use fallback old art, particularly34/37/38, and cannot establish final combined rendering.

Before replay, make test-only derivative generators or a shared manifest-derived helper that preserves all original data/baseline/physics assertions and loads exactly the final official terrain helper entries in their declared order before act4-pilot-art. Verify loaded helper bytes against official runtime entries; include Stage32 only if final source integrates it. Assert required helper presence and nonfallback use on changed relevant stages. Avoid executing unrelated App/campaign boot wrappers in isolated fixtures. No production hook changes are needed merely to make a test pass.

Individual original generators and whole-PNG terrain expectations remain preserved. A/B comparisons now mean original monster positions versus candidate positions on the SAME combined terrain; they are not old public baseline images. No full-image equality against old monster scenes, no altered masks/tolerances, no runtime hash relabeling.

## Execution boundary
Wait for final combined source manifest from coordinator before creating runnable follow-up CI or importing3/7/32 deltas. Then exactsource identities → minimal isolated affected scenes → actual40 App replay → compare outcomes and actual screenshots. Human taste, physical device performance, natural progression, public Pages UI and release remain separate. Missing/deviating QA-save compatibility must stop and be reported, not silently migrate/modify the checkpoint to continue.
