# Stage14 natural-input flight settlement lock

Baseline `292c1122fcd75256c366ec15e815fb4adcfbd7b2`; released reviewed-v4. Trial14-survival-101-cal2 uses synthetic legacy-budget actualLv11/basic recruitment weapons, legal training, production App/Engine commands and guarded actor writes. No external actor writes/recovery occurred.

At R7, after normal O08 at45°/power0.6, flight has zero projectiles/volley but `settleBusy()` stays true. Gilchan is `jumping:true, airborne:false, vx:0, vy:0`, x3004.566173610096/y2271.13124877673. Nearby companions stand at x2966–2993/y2300. After30,000 normal ticks there is still no input window. Normal Continue from the exact export plus1,200 additional Engine/App ticks reproduces identical phase, coordinates and lock.

The NPC occupancy wrappers in `act23-v4-act2-scenes.js` and `act23-v4-act2.js` can stop a falling body's displacement and zero its velocity while keeping its jump unresolved. Global engine settlement then waits, and the blocked player cannot move the occupying companion. This is a persistent gameplay-state issue, not an unexpired projectile snapshot or a missed route waypoint. Browser reproduction is still pending.

Exact compressed initial/terminal/probe artifacts and raw/gzip SHA256s are under `tests/fixtures/act2-gameplay/stage14-natural-settle-lock-*`. They are not edited recovery fixtures. Reproduce:

```
node tests/act2-gameplay-freeze-probe.mjs tests/fixtures/act2-gameplay/stage14-natural-settle-lock-terminal.json.gz
```

Root owns the bounded shared-runtime repair on a separate branch. Desired regression: same unmodified export settles through legitimate gravity/occupancy resolution and can accept normal input, without teleporting NPCs, silently overlapping them, clearing jump flags alone, changing objectives or balancing HP. Compare exact before/after fields and then obtain real-browser confirmation. QA branch does not modify runtime.
