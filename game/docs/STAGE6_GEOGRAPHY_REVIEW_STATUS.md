# Stage 6 geography and encounter review — 2026-11-03

**Exploratory candidates only. No release acceptance.** The production author and map revision have not been changed by these overlays. Review must be repeated against the exact integrated source, with actual browser play, a registered policy cohort and holdout, and a passing Stage31 gate. The previously recorded Stage31 failure remains open.

## Actual geometry and collision

The cloned floor overlay `tools/stage6-prototype/author.mjs` has SHA-256 `1c3f1f1825e39cabf653688ed779dcc42d80ce448e4e582173a8eb53cbb80870`. Its new valley left the old west rock below the floor and the old east rock suspended above it. Both deer were physically grounded on the east rock, but that rock was visually ungrounded; neither a count nor a grounded flag made this acceptable.

- Placing both full rocks by their old feet on the new road blocked normal hero traversal and failed body clearance.
- Partially burying them allowed heroes through but caused 313 prepared follower samples to intersect the east collision. This candidate was rejected; the follower crossing distance alone was misleading.
- Removing both rock collisions preserved the road and enabled one stag to move, but sacrificed elevated encounter space. It remains an alternative, not the accepted solution.
- A first elevated rock at x4640/y2510 intersected the lookout in geometry, but actual art showed a pillar passing through the rock and stag. It was rejected visually.
- The smaller exploratory `rock-deck-small.mjs` retains one physical rock at x5050/y2430.12/scale0.48, one stag on it, a second stag on the road, and the existing upper boar on the lookout. Its rock bottom at x4986.352 is y2460.120 against the lookout y2460.118. A diagnostic intersection is not visual acceptance. Initial screenshot still appeared to float; a separate vector contact treatment is under review.

The old separated bridge spans could not be traversed by ordinary tested jumps at the bridge edges. `connected-bridge.mjs` extends the existing west/middle/east deck ends, leaves two gaps, and creates no new platform. Prepared no-combat movement reached the lookout with all three heroes, without fall damage, while the lower carrier reached x6440 without terrain intersection. `broken-deck-edges.mjs` adds only inward notches within existing deck thickness; endpoints and walking surfaces remain at their previous coordinates. The same prepared route and one actual App-input projectile hit were rechecked. Art for the new ends and its collision alignment must be reviewed on the final source.

## Water and real skills

The water author material has `depth: 0` alongside an explicit surface, but its compiled pool derives depth from the actual sampled basin: surface y3270, maximum depth 29.49375. A synthetic **legacy** lightning impact damaged a wet target and not targets outside or below the pool. This is not evidence of the current M04 behavior. A separately prepared actual App aim/charge/release hit the surface with current `gourdThunder`; a target far away in the same pool took no damage. Current M04 does not conduct across the whole pool in that test, and current displayed skill lore/notes describe nearby lightning rather than whole-pool conduction. No production water behavior was changed.

## App-input observations, not cohort acceptance

All use the original entry profile and story difficulty, a single seed 2360, current App action handlers, idealized planner and DOM/clock doubles; they are not real-browser fullplays or human win rates.

- Connected-deck candidate with the registered normal policy: R10 win, carrier gross loss172 and ends1850/1850 after recovery. Pursuit was warned before a hero response, entered, dealt47, one pursuit unit was defeated and the other survived victory. Twenty enemies remained alive. Source local `54dcd3ce253d40862b58da7da3d5ec8a955190a4`.
- Same normal policy with the inward-notched collision candidate: R10 and the same headline numbers in this case, source local `8eb84d16ec7579fcb075a8c2a3b5e75877e109d6`. This single result does not establish equivalent behavior across all shots or saves.
- A deliberate upper route that continued to the exit while the mandatory warden lived took R16; its three aimed warden shots did not produce warden damage. An aim-tolerance version took R13 and actually dealt196 from the western bridge. A different policy conditionally rejoined the living warden rather than waiting at the exit, took R9 and recorded actual upper shot and subsequent rejoin attacks. Carrier gross loss209, ending1850/1850; pursuit dealt46 and survived victory. This is a tactical policy comparison, not a change to the stage goal or an invented kill quota.
- The R9 rejoin run sampled support spans archer1477, knight1418, mage1347. The latter is reported as observed; the criterion does not require artificially forcing every companion through the same height.
- The notched collision candidate was subsequently exercised with the same upper/rejoin policy: R9 win, archer dealt602 total damage to the warden across the route and rejoin, carrier gross loss209 ending1850/1850, pursuit dealt46, and 16 enemies remained alive. Source local `6cc95bd4c6cab7b2e5a7cc9ab966d5dd0f52165a`. The retained normal-policy case also won R10 on the notched candidate. Both are single seed, DOM/clock-double App runs, not a policy cohort, browser or final integrated source.

Prepared App fixtures also measured a no-damage drop from the east upper bridge to the lookout and a subsequent arrow hit on the elevated stag, as well as a robust western bridge hit on the warden. These fixtures place the hero deliberately and are not evidence that the complete route was naturally played.

Pending: final art and its renderer/collider alignment; actual browser play with natural camera and visible warning; final-source map revision and old-save boundary; meaningful enemy decisions and upper/lower responses across the registered policy cohort and holdout; exact v3 round/engagement/difficulty metrics; Stage31 failure resolution; and combined-source release verification. Preserve all failed and exploratory traces, and do not deploy on this document alone.
