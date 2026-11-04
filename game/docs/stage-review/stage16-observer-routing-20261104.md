# Stage16 observer routing and witness fallback DEV

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
