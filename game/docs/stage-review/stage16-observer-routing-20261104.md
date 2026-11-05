# Stage16 observer routing and witness fallback verification

## Current checkpoint: 2026-11-05 UTC

Integrated the original three-file DEV candidate onto master `2657fe659996e76bacc82b4c321690e07a43b82f` as `f5da29db9a48c0c8ff0207b96a7c30ffdff0d414`. No Stage17 source, pending upload request or guard was changed.

- First guarded run [41938136699](https://github.com/sys8994/honro/actions/runs/41938136699) failed at the unchanged Stage31 runtime-digest gate. App/browser steps did not run.
- Genuine prerequisite refresh [41938742761](https://github.com/sys8994/honro/actions/runs/41938742761), source `51ce3b25511270f36d26b5e4c277b8b94276c031`, reran existing Engine probes and actual Stage31 browser combat/boarding. It won in 17 rounds with four survivors. Genuine evidence attachment, normal guarded build and preview/normal-build byte equality passed. The resulting evidence-only commit is `ecd6145c5c9faad2a96c4bac33206a69d877e49c`. Historical visual reviews remained historical. Overall run then failed in the new Stage16 fixture's obsolete level-13 assertion (current result 12), not in product behavior.
- Reused the already passing actual App test's defaults-derived `profileThrough(15)` fixture instead of changing growth rules or the old helper. Browser assertions also explicitly check both casualty classes and allow normal scene-motion clicks.
- Final focused run [41941498778](https://github.com/sys8994/honro/actions/runs/41941498778), exact source `192cc9300ce3b90c4b5613f3027a6f145c280003`, passed typecheck, unchanged release gate and build, 19 state cases, existing production App/Story/Engine cases, new physical-movement/Continue cases and real Chromium controls.
- In Chromium, the imported synthetic checkpoint had both observers down, completed actual testimony and no soul/approach receipt. ArrowRight moved the living archer from x2765 to x2796.561679501051; the real runtime opened only MID.07 and recorded elder-testimony approach. Reload/Continue during the followup and again after completion preserved the same battle session and receipt. No fabricated trappedObserved, repeated followup or duplicate journal appeared; journal count remained one.
- App fixtures also retain pre-extraction Sodan blocking, protected-NPC failure, existing soul observation, supported NPC recovery, testimony presentation/cursor persistence and living-speaker filtering.
- Artifact [13375669119](https://github.com/sys8994/honro/actions/runs/41941498778/artifacts/13375669119) contains explicit synthetic profiles, result JSON and two original browser screenshots, retained 14 days. No player account, private save or unrelated file was read or uploaded.

Scope: the additional App fixture deliberately prepares enemy casualties, companion starting poses and movement allowance, then uses actual NPC movement, Engine walking, Story and Continue. The browser imports that synthetic checkpoint using the actual UI and uses ordinary movement/dialogue inputs with normal frames. This is focused changed-path verification, not a naturally played whole Stage16 battle, full terrain/fun acceptance, mobile/device acceptance, or manual visual approval of the screenshots. No master merge or Pages deployment occurred in this checkpoint.

## Original DEV checkpoint (historical)

Date: 2026-11-04 UTC. Base: `f85a108a29d27cc5488d69d42034d58ac7699c0d`.
Branch: `work/stage16-observer-routing-20261104`. This is a DEV candidate, not a release or actual App/browser acceptance.

## Cause and narrow observer correction

The original observer expression selected any living Damheo before checking distance. A distant Damheo therefore prevented nearby Sodan from recording the existing bellward soul observation.

Select Damheo, then Sodan, only when the living actor meets the existing `V.near(..., 650)` condition. When Sodan observes while Damheo remains far away, MID.06 is eligible only if Damheo previously made the recorded observation or is now close enough himself. Both-near preference and the 150-pixel vertical condition remain. The elder's existing MID.07 remains eligible. No dialogue wording is changed.

## Witness fallback after both soul observers are unavailable

An unfinished extraction still requires Sodan. Only after actual extraction, supported recovery of both living protected NPCs, and completion of the five actually presented elder testimony facts does the fallback become available.

If neither Damheo nor Sodan is alive/available through the existing actor lookup, and no actual soul-observation receipt exists, a living nonsummoned companion within the existing bellward observation range records `witnessApproach`. The record contains the companion, actual position, source position, presented witness rows and `basis: elder-testimony`. It is not `trappedObserved` and does not claim current soul perception.

The existing souls event ID is retained for save compatibility, but the fallback admits only the existing elder MID.07. Its camera targets the bellward source, not a fabricated soul observation. Existing departure lines follow under the unchanged living-speaker filtering. If Hwigyeom is unavailable, only the elder's existing COMPLETE.02 remains. The historical journal is unchanged and makes no new present-soul claim. No new prose, entity, magical ability, battle outcome or resurrection is added.

Normal observation takes priority and follows its existing sequence. If an actual soul receipt already exists, no fallback receipt is manufactured. If a soul observer is still available but far away, the normal approach requirement remains. Existing NPC survival, extraction, testimony and departure conditions are not removed.

Runtime fallback commit: `b9c5ab9994a07338b69b3e42fb7105a073aa0204`.
Focused test commit: `42c4c11b2fc84de81dc448e31c3d2802523a73c3`.

## Verification and its limits

`node tests/stage16-observer-state.mjs` executes the actual reviewed16 module in a VM and extracts the actual shared actor, near, hero, failure and living-speaker predicates. Safe-frame, terrain-contact and scene-admission handling are explicit doubles. The test does not run App, Engine physics, browser inputs or real Story completion.

- Unchanged master fails nearby-Sodan selection (exit 1).
- The earlier selection-only DEV fails the new surviving-companion fallback requirement (exit 1).
- The combined candidate passes 19 focused state checks (exit 0). These cover observer preference/range, dead or uninformed mage speech, actual finished testimony, existing receipt preservation, remembered mage knowledge, both-observer loss, elder-only fallback, distant/no survivor, unfinished extraction, protected NPC loss, unfinished testimony, no unnecessary fallback while an observer survives, JSON-roundtripped approach evidence after its original companion dies, and reaching the existing departure scene conditions without creating `trappedObserved`.
- To inspect the final scene conditions, the test explicitly models completion of already admitted lines. This is not proof that the real Story UI completed them.
- An initial test-only cross-VM array comparison failure was corrected by normalizing the array in the harness; no product change was made for that test error.

## Existing saves

No map revision, authored state, row ID, step ID, or existing event ID changes. Existing soul receipts remain unchanged through nullish assignment. The optional `witnessApproach` record is created only after a live runtime observation, never by prepare/load migration.

An old unresolved save can obtain the new proof when a surviving companion is actually nearby. A valid saved approach is retained even if its original companion later becomes unavailable; this does not introduce a new permanent survival condition. Old testimony and departure receipts are not deleted or rewritten.

Only in-memory/JSON state preservation is demonstrated. Actual App Continue still needs focused verification before any publication: before observation, after actual soul observation, with both observers down before approach, after fallback approach, during testimony, during elder followup and at departure. Confirm no dead-speaker line, duplicate testimony/journal/reward, automatic fabricated observation or battle reset. Also retain the required pre-extraction Sodan failure and protected-NPC failure checks.

## Publication and recording limits

No build, actual App run, physical movement test, browser test, master merge or Pages deployment was performed. Normal-input completion and the affected public screen must be checked before calling the fix accepted. No Stage17 test or pending approval was touched.

The existing BUG_LOG.md exceeds the GitHub contents tool's readable size: it returned empty content with blob `eff4f1c6ce45f9f31621c3322bd436eedd3c5cbe`; the raw-file read also reported too large/unsupported. No replacement was attempted. This cause/change/check/limit record is preserved here until the normal repository writer can add a brief BUG_LOG entry without truncating existing history.
