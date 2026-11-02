# Normal-input QA aiming: released-angle convergence

The Stage 31 CI run `41468270968` (source `0b737b9`) stopped at
`precision-aim-12`, round 4 / archer / A14, after 12 shots. Evidence is in
`_local/reports/item-discovery-run2/item-discovery-release/stage31/tactical-v8-events.jsonl`.
The target was 48.765061°, the last held-pointer sample 48.709555°, and the
released angle 48.659931°: a 0.10513° released miss despite unchanged position
and movement. This is a QA input-controller convergence failure, not evidence
that game difficulty or combat balance needs changing.

`tools/act4-ci/precise_aim.py` retains normal vertical mouse gestures and the
strict released-angle error ≤0.1° gate. It now:

- Releases to neutral, observes immediately and after 100 ms, and permits at
  most two additional correction gestures only for an angle-only miss.
- Shares a 20-second active-loop deadline across all three attempts; each loop
  also has a 500-sample cap. Required release/observation cleanup can run after
  the deadline. Browser transport calls retain their own timeout behavior.
- Narrows the held-pointer stop window from 0.07° to 0.04° and lowers the fine
  input floor from 0.012 to 0.004 (approximately 0.744°/s to 0.248°/s using the
  unchanged runtime's 62°/s coefficient). Correction input is capped at 0.012.
- Preserves the real joystick's initial `max(.18 * radius, 8)` intent threshold,
  then immediately reduces displacement; below-threshold starts cannot latch
  `aimOnly`. No runtime controller, game state, angle, HP, balance, or movement
  budget is written by this helper.
- Compares every observed context with the original `before`, never a retry
  baseline. Any observed actor, facing, round, phase, side, shots, health,
  enemy-state, dialogue, position, movement, input-readiness or grounded change
  permanently fails the operation and stops further correction. This guards
  observed samples; it does not claim observation of every simulation frame.
- Records each attempt's before/release/settled state and released-pointer
  result, plus per-sample position/movement/actor/facing/round and detected
  context changes. Release failures are never retried. A `finally` block
  releases the pointer even if a held-input observation raises an exception.

## Focused verification

Run:

```sh
python -m unittest discover -s tools/act4-ci -p test_precise_aim.py -v
```

Eight deterministic mock tests cover release drift recovery, changes during
held input and neutral settling, retained original baseline, bounded repeated
misses, stalled input deadline, unreleased-pointer rejection, exception cleanup,
and one-attempt success. These tests validate the helper's control-flow
contract, **not real browser timing, ballistic safety, Stage 31 completion, or
gameplay balance**. The unchanged full browser/Stage 31 CI must establish those
results after publication. Existing caller-side settled ballistic-envelope,
movement, health and outcome gates remain untouched.
