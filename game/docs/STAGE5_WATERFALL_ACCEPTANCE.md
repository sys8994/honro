# Stage 5 waterfall revision 1

Status: implementation and independent review in progress. This document is not release approval.

## Spatial and narrative contract

- Same 4400 × 4700 playable envelope. Right cliff is actual rock, with upper river, continuous fall, deep plunge pool and dim downstream water.
- The small recess contains 주박목, a paper-bound wooden curse tablet. Legacy IDs `cliff-cleat` and `receiver-5` remain for save/objective compatibility only.
- Damheo uses the existing ritual action at 물길진. He must remain within the existing marker radius; moving away closes the shooting window. Seolo attacks through the opening. Hwigyeom is absent here; the independently owned Stage 6 recruitment boundary applies.
- User's latest rule replaces the earlier solid projectile wall: entering arrows rapidly lose speed and fall with the water. The fluid polygon comes from the same sampled curves as art. Full fluid/prediction/Continue/special-shot evidence belongs to `stage5-waterfall-drag.mjs`; earlier wall-only WIP passes do not establish this final rule.
- Deep water uses the existing water rules, with no invented drowning or teleport recovery. The left pool shore returns to the ritual bank. The upper shooting ledge is reached by an ordinary jump near x1800→1900; the opened cave is reached by another ordinary jump from the front rib.

## Population and tactical inventory

| Source | Authored/runtime count | Role and geometry |
| --- | ---: | --- |
| receiver-guard | 3/6 | Split-height bank shoulder and ritual approach; approach pressure before holding the array |
| basin-pocket | 3/6 | Ascending shooting ledge; guards interrupt the archer's line and require positioning or prior combat |
| upper-roost | 2/4 | Air group above the ledge; elevated sight and incoming fire |
| cleat-guard | 2/4 | Front-rib stags and two cave archers in front of the tablet, avoiding an inert tablet-blocked rear clone |
| lower-beasts | 3/6, once | Original progress1900 trigger after earlier approach warning and at least one round; atomic entry along the upper ledge |
| habitat-5-0/1 | existing conditional 1–4 | Existing settlement/minimum-population response from wet grass or nest; warned when fewer than5 foes remain before breaking the tablet |

Initial20, action cap4, population cap20, enemy stats, target HP and one-round settlement are preserved. The unaltered cap can legitimately defer the finite six until six initial foes are defeated. A no-kill objective-first win can preempt that wave; this is distinct from a blocked safe-placement entry. Conditional habitats can likewise be preempted by fast objective completion. No extra round is added to force every wave into every run.

## Persistence and shared authoring

- `authorStage5Waterfall(project,g)` is the last Stage5 author in the canonical Act1 generator. It leaves every other stage unchanged.
- New/retried entry opts in through `honroStage5WaterfallRevision:1`. Old live battle snapshots have no flag and remain untouched.
- `stage5-waterfall-authoring.mjs` requires whole-stage canonical/runtime equality, exact generator reproduction, Game/Workshop closed/open geometry equality and serialized reimport equality. Canonical Workshop metadata retains `campaign:true`; arbitrary custom maps do not receive the narrative override.
- The original037 stage is frozen in `tests/fixtures/stage5-waterfall/before-stage5.json`, SHA256 `483ee2642fcda9a7f49815d83cccbcf82583a57c3711eaa683ed5fddaf9ab439`. Existing history assertions are not weakened. The central release-history owner maintains the separate immutable/current manifest boundary.

## Evidence boundaries

- `stage5-waterfall-routes.mjs`: four-body isolated ordinary movement, cave return and real-gravity pool landing/escape. Its airborne starts and unlimited per-step movement are explicit geometry fixtures, not normal budget play.
- `stage5-waterfall-wave-boundaries.mjs`: isolated original habitat trigger/preemption ordering. Fixture enemy removal and round changes are explicitly not normal combat.
- `stage5-waterfall-fullplay-input.mjs`: production App input controller, legal entry reward fixture, actual movement/jump/charge/interaction/defend/pause/save input trace. No claim of playing Stages1–4 continuously.
- `capture-stage5-waterfall.mjs`: production NativeCanvas renderer, fixed identical overview/focus/portrait cameras and explicit closed/open states. This is not browser/HUD/performance proof.
- Final acceptance still requires the latest source's raw normal-play/replay trace, every group/conditional wave disposition, independent encounter review manifest, integrated regression suite and final browser/Pages verification.
