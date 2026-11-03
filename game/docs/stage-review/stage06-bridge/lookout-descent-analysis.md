# Stage 6 lookout descent diagnosis — 2026-11-03

**Prepared-pose App-input diagnosis, not final-source or natural-combat acceptance.** No production code, terrain, collision, enemies, or original ten cohort traces changed. This small check used the same unshipped author and broken-deck overlays, original earned-XP entry and story difficulty, a fresh-entry movement budget, and an explicitly prepared archer pose at x4808 on the lookout. App movement/jump/drop/frame handlers ran with DOM, clock, and render doubles. Other actors and terrain stayed in the compiled battle. No enemy phase was exercised.

## Findings

- **West jump reproduces 33 fall damage.** In the final descent diagnostic the archer starts at x4808/y2469.84 and lands on lower-road at x4133.625/y3259.9125 after 166 App frames. A read-only wrapper around the engine's contact-damage call records `kind: fall`, measured drop 1003.6876, and 33 HP loss. The jump's apex contributes to the measured fall. This reproduces the earlier symptom in an isolated fixture; it does not retroactively add a damage-kind record to the old five combat traces.
- **Ordinary vertical drop is damage-free in this fixture.** The existing 내려가기 action lands at x4808/y3041.8154 after 98 frames, a 571.9754-unit drop, with 0 HP loss, unchanged movement budget, and no invalid grounded body samples. The current engine's fall threshold is 600 units. The drop temporarily locks input, so the observer must continue App frames through that ordinary lock instead of treating it as termination.
- **Then moving west uses the budget without collision damage.** A separate drop-then-walk case reaches x3554.3614/y3297.2819 with 0 HP loss and no invalid grounded body samples. Its programmed target was x3550 and was not reached: the result remains `move-budget-ended`, 4.3614 units short, with no turn reset or resource refill. It demonstrates a continuous physical descent and substantial westward rejoin, not an exact goal success or a combat-safe return.
- **The tested east detour fails.** Walking right and jumping when blocked stops near x4985.47/y2460.04 at the existing rock after spending most of the movement budget. It never reaches the lower road. There are 290 invalid grounded contact-pose samples starting at x4937.08. Zero HP loss does not make this a usable or collision-safe route. Do not advertise it as the alternative or hide the blockage with art.

## Evidence and failed attempts

`tests/stage6-lookout-descent-prototype.mjs` accepts a new output path and optional fixed mode `vertical-drop-rejoin`. It refuses to overwrite a report, requires 128 MiB available space for this bounded non-build diagnostic, and caps each report at 100 KiB. It does not loosen the separate heavy-test storage rule.

`lookout-descent-diagnostics-20261103.json.gz` preserves the full four original reports with their byte counts and SHA-256 values:

1. v1: all three cases ended at frame zero because the first harness incorrectly treated the opening story lock as input termination. No route evidence.
2. v2: opening story was advanced through App frames. West jump reproduced 33 fall damage and the east route failed, but the vertical drop observation ended after its first frame because of its normal temporary input lock. This vertical result is incomplete.
3. v3: observer continued App frames while the existing platform-drop action held input. It recorded the findings for west jump, vertical drop, and failed east route above. No production behavior changed between attempts.
4. v4-rejoin: adds only the fixed drop-then-walk case. Its exact target remains unmet as described above. Earlier cases were not rerun for this extension.

## Integration work still required

The old upper route's generic controller advances a waypoint even when a requested drop is unavailable. Its R6 trace recorded a jump, not a second drop. A future separately named route policy should wait for a valid lookout drop, observe landing, and then rejoin. It must not silently rewrite the registered policy or reuse the original ten runs as evidence for the new behavior. Verify the actual reason for the old drop rejection in a natural run before declaring that controller issue fully explained.

The final source still needs natural input under enemy pressure, actual browser PC/mobile camera and warning visibility, useful cover decisions and a genuinely lower-route comparison, final art/collision alignment, and the intended old-save revision boundary. The unresolved Stage31 release failure is unchanged. The accepted art source does not yet exist; this diagnosis does not authorize release or certify the whole upper route as safe.
