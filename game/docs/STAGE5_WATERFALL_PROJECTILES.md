# Stage 5 falling-water flight

Scope: campaign stage 5, `honroStage5WaterfallRevision === 1`, not a custom map. Old saved battles and the other 29 stages keep the original flight integrator. Game, Stage View and Playtest use this same Engine.

## Geometry and motion

The current `waterfall-veil.vertices` polygon comes from `HonroStage5WaterGeometry.closed/opened`, the same cubic samples used by the waterfall artwork. Holding the ritual changes that actual polygon. There is no invisible permanent immunity flag for the cleat or a projectile. Body collision retains its existing rapid-water barrier policy.

For airborne projectiles only, the sheet is excluded from solid collision. Swept entry runs before fluid motion so a projectile that would traverse the full sheet during one update still enters the water. Fluid geometry crossings use at most 1/240-second segments, with analytical motion inside each medium.

Horizontal resistance is `dv/dt = -32v - 0.05|v|v`, with exact displacement and velocity. For 1,500 units/s starting inside water, total horizontal advance is about 24.14 units. Vertical motion follows `dvy/dt = 320 + 3(300-vy)`: gravity plus downward entrainment. The arrow remains present, and its renderer points along its actual velocity. A thin dark edge makes the wet shaft and head readable against pale water.

Leaving the polygon preserves current velocity and returns to the ordinary force sampler. Re-entering applies resistance again. The opened shooting gap is genuinely dry; its surrounding curved ribbons still exert resistance. A once-only entry-splash flag controls appearance only and cannot disable later water drag. Entry never invokes terrain impact, reflection, damage, explosion or consumption.

## Weapon policy

- All flying weapons that use the shared integrator, including ordinary/piercing/bouncing/guided/splitting arrows, qi, gourds, thrown stakes, ballistic spirit seeds and generated flying children, use the same fluid law.
- Homing, returning arrows, ultimate bolts and summon bolts stop steering/replenishing their speed while inside water. Outside they resume their authored steering from their current velocity.
- Terrain-phasing ballistic spells still cross solid terrain by their original rule, but their moving projectile is carried by the water. Their phase and damage rules are unchanged.
- Bodies, melee motions, grapple travel, already-landed rolling attacks, stationary rings/emitters/stakes, instantaneous geometry/secondary effects and authored `convergeSpirit` spline travel retain their existing behavior. These are not free ballistic flight and are not newly made into falling arrows.
- Actual rocks/units, timers, manual fuse activation, apex splits, landing transformations and lifetime limits remain authoritative. Water itself causes none of those impacts. A split naturally triggered at an apex still uses its original skill rule; the children are also resisted.
- Existing damage attribution and friendly-fire eligibility are unchanged. Real intervening units can still be struck, including during downward motion; water grants no team immunity.

## Verification and limits

- `stage5-waterfall-drag.mjs`: 20/30/60/120/240 Hz homogeneous fluid equivalence, swept 1,500–1,000,000 units/s, closed/open A01, unchanged ordinary/old/custom/body integration, JSON velocity continuation.
- `stage5-waterfall-drag-specials.mjs`: current A/M/O skill IDs, finite lifetime and child count, no water impacts, loss of forward speed for ballistic casts, plus seven guided/return modes. A10 is preparation without flight; M14 is a stationary ring; O99 retains its unmet prerequisite in this fixture. No normal-resource or full encounter claim.
- `stage5-waterfall-drag-preview.mjs`: representative live/preview endpoints for arrows and mage projectiles in closed/open states, all sampled polygon-edge interior probes, and exiting with reduced momentum. At this checkpoint all compared endpoints match exactly.
- `stage5-waterfall-drag-app.mjs`: production App pause/dialogue, export, file import and Continue retain the exact saved projectile and dialogue; resumed next step matches uninterrupted simulation. Actor/projectile placement and plentiful focus are explicit fixtures, with DOM/render/storage/time doubles.
- `stage5-waterfall-drag-native.mjs`: production Scene six-frame sequence, including inspection 2x and ordinary 0.7x world scale. These are isolated real-flight renders, not browser input/performance evidence.
- Existing projectile-friendly-fire, guided-allegiance and aim-launch-collision regressions pass. The older migration asset-membership baseline currently fails independently of these engine changes; aggregate verification must reconcile it on the final release tree. Actual browser, latest combined release and normal encounter acceptance remain separate gates.

The final focused matrix covers 49 current A/M/O skill IDs: 46 ballistic casts explicitly assert forward-speed loss and downward motion, with the three exceptions above. Seven additional guided/return-mode fixtures also assert suppression of speed replenishment. The maximum observed simultaneous child count is 14. The fluid ray-parity optimization reduces the recorded 20,000-step microbenchmark from ~8.7 s to ~0.46 s; this does not replace real browser frame measurements. Actual integration browser launch is currently blocked by the executor's Chromium socket permission (`TargetClosedError` / SIGABRT).
