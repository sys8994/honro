# Stage24 normal-run encounter evidence audit

Audited existing `normal-play/stage-24.json`, `normal-play/checkpoint-24.json`, and `tests/stage24-normal-play.mjs`; no rerun or runtime modification. Native production App/Engine with prepared legal entry, Canvas/menu/storage doubles; not actual browser combat.

**Gate remains pending.** Winning in round 9 with four survivors and all three events committed proves route/objective completion and event spawning, not effective pressure from every encounter.

## Recorded raw observations

The 41 player action rows preserve round, actor class, current goal, actor x/y, action and (for fire) skill/target ID. They do not preserve target position or resolved hit/damage. The final checkpoint preserves all 25 enemies' spawn/current coordinates, final HP, and response spawn-source IDs. It has only the final 30 text events, without actor IDs, target IDs, timestamps or damage amounts.

| Encounter | Existing evidence | Limit |
|---|---|---|
| empty-court-watch | Three direct fire attempts at unit 3, rounds 1–2; final units 1/3 dead, 0/2 damaged | Cannot attribute enemy attacks or player HP loss |
| crest-room-watch | Two occultist fire attempts at unit 1, rounds 1–2; unit 1 final HP 891/1086 | Other three units have full final HP; movement alone does not establish pressure |
| abandoned-garden-watch | Five direct fire attempts at unit 2, rounds 5–6; unit 2 dead, other two damaged | No per-hit timing or enemy-to-player attribution |
| shrine-approach | Six fire attempts at units 0/1, rounds 3–6; unit 0 dead, other two damaged | Does not establish every member's effective actions |
| land-register-watch | Unit 1 final HP 1011/1086; several changed coordinates | No direct target row, no recorded causal response; incidental damage cannot prove tactical effectiveness |
| response-24-0 | Two committed units, both final HP 1086/1086; event-15 moved from x3060 to x3528.83 | No direct target rows or attributable damage; effectiveness unproven |
| response-24-1 | Three committed units; knight targets event-42 in rounds 7/8/9, which is dead in final checkpoint | Other two retain full HP and spawn positions; no enemy action/damage attribution |
| response-24-2 | Two committed units with changed positions; both full HP; final text log includes their two distinct guard-kind attacks | Text lacks unique IDs/targets/damage; cannot establish meaningful pressure or player response |

Final party HP is archer 875/875, mage 408/902, knight 973/1447, occultist 589/1036. These final deficits establish overall attrition, not which encounter caused it or when. Repeated generic defend actions are bot fallbacks and must not be described as reactions to a specific attack.

## Missing evidence needed for the gate

A subsequent observation-only trace should record enemy actor/target IDs, spawn-source/group, attack start/end positions, resolved damage and target HP deltas, and player movement/fire/defend before and after each encounter. Capture full chronological events and per-action enemy/player snapshots, rather than only final state and a rolling text log. Report groups that never become effective explicitly; do not infer effectiveness from spawn commitment, movement, a win, or an attack-intent field. No source behavior or fixtures should change merely to obtain a pass.
