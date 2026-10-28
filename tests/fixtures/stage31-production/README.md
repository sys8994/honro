# Stage31 new-bank actual input fixtures

These tapes start from the authored player/enemy spawns. They contain ordinary
movement, selection, jump/drop, defend and shot actions, not actor poses, HP,
resources, event state, forced wins, or enemy removals.

- `route-inputs.json`: knight traverses the lower bank and separately the three
  upper spans/two gaps, with grounded checkpoints on the actual surfaces. Live
  enemies and normal movement budgets remain in place.
- `shot-inputs.json`: archer walks 180 frames from spawn. At the same position and
  .65 power, -10 degrees hits the bank without hurting the west hound; +5 degrees
  actually hits that hound. This is an angle/terrain check, not every firing lane.
- `enemy-inputs.json`: knight advances to the landing with live enemies. Each
  group is evaluated by the original runner's damage/meaningful-movement rule.
  Landing additionally waits through ordinary turns. A pass does not prove all
  individual monsters or every aspect of the group's design purpose.
- `objective-inputs.json`: parent-authored adaptive policy's fixed successful
  tape, independently replayed through the original App objective runner. It
  spends legitimately available stage-entry SP (`campaign-spent-v1`). It is a
  prepared entry profile, not evidence of playing chapters 1–30 or human balance.

Run from the repository root:

```
node tools/stage31-production/verify-gates.mjs DRAFT.json _local/reports/stage31-production/final-inputs
node tools/stage31-production/verify-app-observations.mjs DRAFT.json tests/fixtures/stage31-production/objective-inputs.json _local/reports/stage31-production/final-inputs/app-observations.json
```

The first tool calls unchanged `runProbe` / `runObjectiveProbe`, records current
source fingerprints and runtime hashes, and fails on failed checks. The second
independently collects actual App damage/impact/route/boat observations and checks
real stopBattle/persist/Continue in midcombat, then completes the tape. Its richer
observations are **not** relabeled as export-gate results. DOM, storage, audio and
render scheduling are doubles; neither tool is browser, visual or art approval.
Rerun against the final draft after source/card/art changes; never reuse stale
fingerprints or claim prior geometry evidence for new geometry.
