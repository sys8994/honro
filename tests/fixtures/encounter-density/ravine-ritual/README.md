# Stage 11: real ritual-arrival checkpoint

`ritual-start.json.gz` is the complete original JSON saved at the first safe
player-input boundary after the west echo warning in a fresh native Stage 11
run. It is round 37, before either echo trio exists. Gzip uses a zero timestamp;
`manifest.json` records both compressed and original-byte SHA256 values.

The arrival uses the original `stage11-ravine-fullplay.mjs` level-10 training,
equipment, navigation and input policy. The instrumented prefix stopped at
round 45, four rounds after the existing ritual completed. It is not a whole-map
completion, browser run or human difficulty approval.

`tests/stage11-density-real-save-continuation.mjs` restores the entire saved battle
through the actual App Continue method, checks exact equality, and then issues
six rounds of ordinary defend inputs. This is a declared response branch from
normal arrival. The original front remains alive and contests the ritual; the
regression requires safe births, possession, the original cap and west pressure.
It reports east fire without requiring or claiming it. The separate frozen
normal prefix records east fire after front clearance and the actual O02/M11
response. It does not relocate actors, remove enemies, replenish HP or
resources, alter objectives, reserve queue slots or raise the action cap.

Only the campaign-project assignment is excluded from the runtime fingerprint,
so independent campaign-data edits to other chapters do not invalidate this
local fixture.
The full current Stage 11 and every non-project runtime byte must still match;
Continue, interactions and the native helper have separate strict hashes.
A changed relevant implementation requires reviewing and replacing the fixture,
not bypassing the guard or silently upgrading its battle.

The retained arrival report is in
`_local/reports/encounter-density/stage11-density-ritual-prefix-current/`.
The fixture itself has no dependency on that ignored report directory.
