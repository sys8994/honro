# Stage 5 waterfall / lake revision 1

Status: implementation and independent review in progress. This document is not release approval.

## Spatial and narrative contract

- Fresh entries use a 5300 × 5000 playable envelope (previously 4400 × 4700). Right cliff is actual rock, with upper river, continuous fall, deep plunge pool and dim downstream water.
- The small recess contains 주박목, a paper-bound wooden curse tablet. Legacy IDs `cliff-cleat` and `receiver-5` remain for save/objective compatibility only.
- Damheo uses the existing ritual action at 물길진. He must remain within the existing marker radius; moving away closes the shooting window. Seolo attacks through the opening. Hwigyeom is absent here; the independently owned Stage 6 recruitment boundary applies.
- User's latest rule replaces the earlier solid projectile wall: entering arrows rapidly lose speed and fall with the water. The fluid polygon comes from the same sampled curves as art. Full fluid/prediction/Continue/special-shot evidence belongs to `stage5-waterfall-drag.mjs`; earlier wall-only WIP passes do not establish this final rule.
- Body movement retains the cave-entry torrent barrier at y1220–2580 while arrows use the full fluid sheet through the pool. The lower y>2580 falling sheet is not a body-supporting platform. The open gap only admits projectiles from the distant bank: the removed front shelves and broad lake separate the cave from ordinary jumps. There is no new body-current or drowning system.
- Deep water uses the existing water rules, with no invented drowning or teleport recovery. The left pool shore returns to the ritual bank. Two optional low overlooks are reachable by ordinary jumps. The continuous lake bed returns to the left bank. M09 destinations east of x2380 or below y3000 are rejected only on non-custom Stage 5 lake revision 1; old snapshots and other stages retain their rules.

## Population and tactical inventory

| Source | Authored/runtime count | Role and geometry |
| --- | ---: | --- |
| receiver-guard | 3/6 | Low west contour and ritual approach; approach pressure before holding the array |
| basin-pocket | 3/6 | Inner bank and return slope; guards interrupt the archer's line and require positioning or prior combat |
| upper-roost | 2/4 | Air group above the western overlooks; elevated sight and incoming fire |
| cleat-guard | 2/4 | Outer bank ground guards and elevated ranged pressure; no guards stand on the removed cave approach |
| lower-beasts | 3/6, once | Progress1750 trigger after progress1550 warning and at least one round; atomic six-body entry on the continuous shore with 110 spacing |
| habitat-5-0/1 | existing conditional 1–4 | Existing settlement/minimum-population response from wet grass or nest; warned when fewer than5 foes remain before breaking the tablet |

Initial20, action cap4, population cap20, enemy stats, target HP and one-round settlement are preserved. The unaltered cap can legitimately defer the finite six until six initial foes are defeated. A no-kill objective-first win can preempt that wave; this is distinct from a blocked safe-placement entry. Conditional habitats can likewise be preempted by fast objective completion. No extra round is added to force every wave into every run.

## Persistence and shared authoring

- `authorStage5Waterfall(project,g)` is the last Stage5 author in the canonical Act1 generator. It leaves every other stage unchanged.
- New/retried entry additionally opts in through `honroStage5LakeRevision:1`. Old live battle snapshots with waterfall revision only retain their original terrain.
- `stage5-waterfall-authoring.mjs` requires whole-stage canonical/runtime equality, exact generator reproduction, Game/Workshop closed/open geometry equality and serialized reimport equality. Canonical Workshop metadata retains `campaign:true`; arbitrary custom maps do not receive the narrative override.
- The original037 stage is frozen in `tests/fixtures/stage5-waterfall/before-stage5.json`, SHA256 `483ee2642fcda9a7f49815d83cccbcf82583a57c3711eaa683ed5fddaf9ab439`. Existing history assertions are not weakened. The central release-history owner maintains the separate immutable/current manifest boundary.

## Earlier waterfall evidence (historical; not lake completion evidence)

- `stage5-waterfall-body-gate.mjs`: exact observed R13 whole-battle copies preserve actors/projectiles/state while upgrading only the earlier revision1 body projection; bidirectional recovery and four bodies × closed/open/released states are isolated geometry checks, not normal play.
- `stage5-waterfall-routes.mjs`: four-body isolated ordinary movement, cave return and real-gravity pool landing/escape. Its airborne starts and unlimited per-step movement are explicit geometry fixtures, not normal budget play.
- `stage5-waterfall-wave-boundaries.mjs`: isolated original habitat trigger/preemption ordering. Fixture enemy removal and round changes are explicitly not normal combat.
- `stage5-waterfall-fullplay-input.mjs`: production App input controller, legal entry reward fixture, actual movement/jump/charge/interaction/defend/pause/save input trace. No claim of playing Stages1–4 continuously.
- `capture-stage5-waterfall.mjs`: production NativeCanvas renderer, fixed identical overview/focus/portrait cameras and explicit closed/open states. This is not browser/HUD/performance proof.
- Final acceptance still requires the latest source's raw normal-play/replay trace, every group/conditional wave disposition, independent encounter review manifest, integrated regression suite and final browser/Pages verification.

## Mandatory contract wiring

`npm run test:stage5-waterfall:contracts` is required by both `test:integration` and the explicit offline verifier. It includes canonical sharing, geometry routes, narrative, conditional waves, old-save/new-retry, fluid trajectories, special projectiles and in-water App pause/Continue. A separate final normal-input replay and independent encounter manifest remain required release evidence; these isolated contracts cannot substitute for them.

`test:stage5-waterfall:fullplay` is also mandatory in integration/offline: normal difficulty, legal Stage1–4 reward ledger, basic A01/M01, zero stat training, actual observed fall→pool floor→shore→ritual return, re-approach and victory with both companions alive. Actual App charge, objective damage, warning pause/resume and exact Continue are asserted. The first passing corrected-body run completed in17 rounds (146/450 HP). This is not an old-map equal-difficulty proof or every-wave activation claim.

## Lake revision evidence (2026-10-15)

Current source normal-resource native-input run `merged-normal` wins at round 10 with finite legal chapter-4 growth. This uses actual App/input/physics with DOM/clock/storage doubles, not a browser manual completion. `normal-final` is a retained failed run (round 14). Browser Game/Workshop/Playtest checks use isolated storage; no user save was read or modified.

`tests/stage5-lake.mjs` checks 37 traversal, optional-overlook, lake recovery and gate cases; isolated combat proves closed-water deceleration/zero target damage and open-water damage. `stage5-waterfall-continue.mjs` preserves exact pre-lake battle snapshots on Continue/import and uses new geometry on retry. Explicit reduced-enemy fixtures exercise lower-beasts and conditional habitats; they are not normal-resource completions.

Evidence lives under `_local/reports/stage5-lake/`, with independent review and encounter manifest. The attachment could not be downloaded by supported Library materialization plus one retry; no attachment pixel inspection is claimed. Existing baseline failures reproduced at master 1902844: environment-composition missing rock asset, migration Stage7 growth mismatch, integration Stage8 679 differing pixels. Stage5 Game/Stage View matched exactly. Aggregate verify was attempted once and stopped at a now-corrected history normalization; no aggregate success is claimed. Release approval depends on the final encounter review and remote readback.
