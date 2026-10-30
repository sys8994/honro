# Point-foot save contact regression

The ordinary stage35 replay on project7956/runtime6cc9 recorded a grounded knight
at (859.95, 1836). Cold Continue incorrectly moved it32worldunits left. The live
sweep uses a zero-radius point foot and stops0.05worldunits before the stair riser;
the restore validator instead added a radius2 foot circle. The torso and head
already clear this36-high stair. This extra circle falsely rejected a live pose.

`locomotion.ts` now shares the existing zero-radius foot definition between the
live sweep and save validation. It changes no live sweep dimensions. Torso/head,
spine, interior, exposed-support and burial checks remain intact. No grounded
flag bypass, changed geometry, altered placement step or relaxed QA assertion.

`observed-stage35.json` contains the captured terrain and exact knight, with the
original diagnostic hash. `focused-results.json` records16 actual App stop/Continue
fixture cases: production hero bodies on stages1/35, captured knight, ordinary
horizontal impulse stops on both stair orientations, and five invalid burial,
wall and roof repairs. Each case also repeats Continue to check stable output.
DOM, renderer, storage and audio are doubles; this is not a campaign clear or a
replacement for the original input tape replay.

Validation:
- `node tests/stair-contact-save.mjs`:16 cases pass.
- `node tests/body-sweep.mjs`:184 cases pass.
- Existing `tests/ground-contact-save.mjs` stops at line40's Stage5 jump setup.
  Unmodified HEAD reproduces the identical failure, before any save operation.
  It is not claimed as a passing full suite. An isolated run of its remaining
  unmodified assertions is reported separately in the local diagnostic logs.
- Remaining save assertions:78 cases pass (only the baseline-failing ordinary
  Stage5 jump loop excluded in a temporary diagnostic copy, not committed).
- Unmodified HEAD fails the new test's first exact captured-pose assertion;
  baseline code was intercepted in memory without mutating the shared checkout.
