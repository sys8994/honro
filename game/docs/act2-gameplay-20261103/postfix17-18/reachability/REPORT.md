# Stage17 retained defense: bounded reachability investigation

## Finding
**No universal geometry-lock claim is justified.** Actual O02 phase-wraith input damages both mandatory enemies through the closed gate. Other tested current-loadout attacks/routes did not establish an alternative. This is a concrete tactical bottleneck plus a controller scoring limitation, not a proven impossible stage. No runtime, terrain, balance, HP, position, RNG, cooldown, or movement-budget edits were made.

Original immutable fixture: `_local/reports/postfix-gameplay/17-natural-hoist-404/terminal.json`; SHA256 `b66c3e9e157077303991f0995e5438cba73b6e270f2dca3c89dde5b4614e3e60`. Exact normal Continue, R71, all four heroes alive. Read-only scan source `1767153aba1c390f46938e2def6811d8564b854a`; subsequent probes source `22365d6cbc35697b9ead68cfc9c03f40f61947c3` (QA commits changed, no deliberate runtime replacement within probes). Candidate14/17/18 fixes, not final art/browser release.

## Concrete obstruction and progression
`gate-repair`: x9300,y3280,w110,h1350, indestructible, unbroken. Mandatory `17.defense.1` actors: event284 (x9536.69,y4625.56,692HP/102shield), event285 (x9416.05,y4585.35,840HP/127shield). Runtime `defense()` requires both waves' spawned IDs dead and three defend actions before proof; wheel is subsequently ordered. Hence this is not optional remaining trash.

Archer/mage occupy authored east-fire-pocket at x7756.92,y3102.10; knight x9238.42,y4580. Generic high-pocket predictions usually terminate on gate/floor rather than these enemies.

## Evidence
- `probe.json`: 2520 read-only predictions over all14 positive-damage equipped skills, angles−85..90 step5°, powers.2..1 step.2. Battle JSON unchanged. All skills' current cost/cooldown/accessibility recorded. This finite grid is NOT an exhaustive continuous reachability proof.
- `withdraw-shot.json`: knight normally moved left90frames out of the proposed blast area. Same-R71 M03−10°/.8 prediction was recomputed immediately before shot, after selecting mage; includes positions, facing/angle, target collision and resources. Generic scoring predicts219.63 enemy /0 friendly damage at gate9294,4506.87. Actual guarded Engine.fire then fully settled430frames. See damage array for actual HP **and shield** result. No actual hit may be inferred from the generic score.
- Source explanation: M03 actual `redesignImpact` uses a crescent (`skillGeometry`, center offset backwards from impact), not a radial explosion. Generic `shotViable`/`shotImpactValue` radial score therefore does not establish real wave-arc contact. Existing approximate skill selection should use actual shape-aware estimates or bounded isolated simulation; do not “fix” stage geometry from this false positive.
- `knight-isolated.json`: 36 exact-state isolated production fire+tick tests, S00/S03/S05/S09, angles−20/0/20 and powers.2/.7/1; zero enemy HP/shield loss. Melee real `meleeContains` also checks collision/cover. This is off-live model testing, not player clear evidence. An initial projectile-only test was inadequate for delayed melee and was replaced by tick-based simulation before this report.
- `jump-probe.json`: actual App.jump from mage deck-edge x7791,y3101 with normal movement. Reached ~y2889, then fell to x8649,y4580, losing138HP; gate top was not reached. This tests ONE straightforward crossing, not every route or equipment build. `airborne` is not the normal jump indicator; the corrected stopping condition uses grounded+notjumping.
- `o02-shot.json`: exact untouched Continue, ordinary select then guarded O02angle0,power.6, fully settled309frames. event284 loses102shield+91HP; event285 loses105shield. Knight loses25.2HP during settlement; don't call the action zero-friendly-cost based on risk0. Complete actor deltas preserved, attribution of incidental damage not resolved.

## Interpretation / next action
The original controller's failure to find alternative attacks is meaningful but **not proof that geometry must change**. Known legal pressure exists via O02, at a potentially slow/repetitive pacing cost. Higher-level fullplay should preserve this bottleneck in turns/skill-diversity assessment rather than inflate a fun/pass claim. If independent supported ordinary builds cannot complete without this one bypass, that supports a design review; it is not established by the single inherited loadout here.

All shot proofs use guarded Engine.fire parameters and normal selection/movement/jump, not normal browser pointer/charge. No full-stage acceptance, human fun claim, broad clear probability, or final visual parity is asserted. Original R71 file untouched. Scripts and raw outputs are adjacent to this report.
