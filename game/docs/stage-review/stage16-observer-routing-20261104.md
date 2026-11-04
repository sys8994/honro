# Stage16 observer routing DEV candidate

Date: 2026-11-04 UTC. Base: `f85a108a29d27cc5488d69d42034d58ac7699c0d`.
Branch: `work/stage16-observer-routing-20261104`. This is not a release or App/browser acceptance.

## Implemented narrow change

The existing expression selected any living Damheo before testing distance. A distant Damheo therefore prevented nearby Sodan from recording the existing bellward soul observation.

Select Damheo, then Sodan, only when the living actor meets the existing `V.near(..., 650)` condition. If Sodan observes while Damheo remains far away, Damheo's MID.06 is eligible only if he previously made the recorded observation or is now close enough to see it himself. The living elder's existing MID.07 remains eligible. No dialogue wording is changed; dead or uninformed distant speakers are not fabricated. Both-near preference, the 150-pixel vertical limit in V.near, finished testimony, the existing observation receipt, dialogue rows, required NPCs, Sodan's unfinished extraction requirement, geometry, combat and victory steps are unchanged. No new fallback for two unavailable soul observers is implemented.

Initial selection commit: `cf680371ad6feb0e1dbadc706ad14713a954cb4c`.
Speech-knowledge refinement commit: `6a30b1d7b243e7ae7b25be7ef7a7a6c6656db702`.
Focused tests: `tests/stage16-observer-state.mjs` on this DEV branch.

## Focused verification

`tests/stage16-observer-state.mjs` evaluates the production reviewed16 module in a VM and uses the production actor and near predicates. It uses explicit safe-frame, terrain-contact and scene-admission doubles. It does not run App, Engine physics, browser inputs or actual dialogue rendering.

The unchanged master source fails the distant-mage/near-occultist check (exit 1). The DEV source passes nine focused checks (exit 0): nearby selection, both-near preference, either single observer unavailable, both distant, wrong vertical level, incomplete testimony, preserving an existing saved receipt, and retaining a mage's prior observed knowledge after later movement. The observer cases also check MID.06 eligibility and the elder's existing followup eligibility. No filesystem artifacts were created during these inline runs.

Known unresolved diagnosis: after extraction and testimony, losing both Damheo and Sodan before observation leaves no observer and no souls scene admission, while the prior focused failure-predicate diagnostic returned no mission failure. This is not asserted as acceptable behavior or as a naturally observed App failure.

## Two unavailable observers: alternatives not applied

1. Give any nearby surviving companion the current soul-observation receipt. This is a small code change, but it attributes occult perception to a character without a confirmed narrative basis. Do not apply on this evidence.
2. Prefer a separate witness-followup route: require completed extraction, both protected NPCs alive and recovered, the five actually presented elder testimony facts, both soul observers unavailable, and an actual nearby living companion. Record a distinct approach/witness proof, not `trappedObserved`. Let the living elder present the existing MID.07 and the existing departure lines; never resurrect MID.06's absent speaker. Keep the historical journal and next-stage motive. This avoids inventing present-soul knowledge but changes the progression evidence contract and needs an explicit narrative/implementation decision first.
3. New substitute dialogue or a new soul-manifestation mechanism would expand story or mechanics and is not the minimum fix.

Normal soul-observation order must remain unchanged. A fallback must not bypass Sodan's unfinished extraction, protected-NPC failure, actual core testimony, or mandatory departure. Existing speaker-liveness filtering stays in force.

## Existing saves and remaining checks

The implemented selection and speech correction changes no map revision, schema, event ID, row ID, or authored state. Existing `trappedObserved` receipts remain byte-for-byte preserved by the existing nullish assignment. An eligible old save without a receipt can now select nearby Sodan even when Damheo survives far away.

Actual Continue compatibility still needs App verification. If the distinct witness-followup route is approved, add a separate optional proof, preserve existing events/receipts, and do not fabricate a receipt on load or reset the battle. Verify old saves before observation, after observation, during testimony, during souls dialogue, and at departure. Check two casualties only after extraction; losing Sodan earlier must still fail under the existing required action.

Before publication, perform the focused actual App input/Continue checks and affected public screen check. No build, full play, browser, master merge or deployment was performed for this DEV candidate.

## Recording limitation

The current BUG_LOG.md is larger than the GitHub contents tool can return: it returned an empty content string with blob `eff4f1c6ce45f9f31621c3322bd436eedd3c5cbe`; the raw-file read also reported too large/unsupported. No replacement of that file was attempted. This narrow cause/change/check/limitation record is preserved here until the normal repository writer can add the short BUG_LOG entry without truncating existing history.
