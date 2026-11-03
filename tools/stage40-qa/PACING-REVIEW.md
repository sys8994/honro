# Pacing diagnosis, 2026-11-03

The user requested that excess turns be separated into actual repetition,
terrain/target access, and necessary story scope before choosing a small enemy
placement/count/HP/objective adjustment. Stage40 has an explicit total23R
exception. Stage31 still has its20R release bound. Neither timing bound certifies
subjective fun. This is a diagnosis and comparison plan, not a product change.

## Observed Stage31 delay

Current-source run41721169502 started with34 enemies and12,212HP. Living enemies
at round starts were21 inR5,17 inR9,6 inR14,3 inR18 and1 with2HP inR21. That last
`pilot31-ridge-court-3` already had2HP fromR14. The1191HP midboss was actually hit
for796 inR19 and395 inR20: its long lifetime was not a long sequence of damage
exchanges. Knight positions went roughly5790→1979→5957 inR14→18→21. The return
boat remained waiting; only three entry dialogue rows had been presented.
This particular overrun is combat/access delay, not lengthy ending dialogue.

There was real early pressure, including large hero HP losses. However, the QA
controller retains lifetime maximum incoming damage. Archer's old675 peak still
caused critical-threat decisions inR17–20. This confounds the product pacing
observation and must not be presented as a measured optimal human route.

## Observed Stage40 delay and ending

Whole run41690685003 has42 enemies and48,301HP in eight groups. Ordinary39 enemies
carry75% of total HP, two midbosses13.6%, final boss11.4%. The western13 enemies
were cleared byR6;R15 still had10 enemies and13,220HP. This is a genuinely large
combat roster, distinct from the ending's narrative scope.

The isolated `final40-dock-stair-5` started at(2310,2464.57), retreated from about
(2229,2517) to(2641,2302) inR7, and kept929HP throughR16. Its lastAct stayed7.
The dock-stair cell accepts only heroes supported on that stair; its one-round
engagement receipt stopped at10 after the party moved down to the dock. InR17
the enemy later crossed to coast-west. Actual finishing shots inR21 required
returning to the upper route around(2616,2233):A02 dealt848 andM01 dealt81.
An initial-coordinate change alone cannot reliably prevent this same retreat.

R20 was high tide: all four heroes defended, with no shot or damage increase.
The warning/retreat/reentry choice is intentional; whether the second high-tide
round feels like preparation or waiting is not settled by this log. The QA
controller's estimated friendly-risk prefilter also rejected some candidate
shots, so its64 shots/19 defenses are not a claim about minimum human turns.

The exact saved-state continuation41703469779 completed normal return inR23.
The four residents took their boat/high-path routes, all13 required dialogue
rows were actually shown, the13-person roster was accounted for, and settlement
and reload persisted. That separate ending has a story function. Do not remove
dialogue or escort just to make the round count smaller.

## Smallest candidates to compare, not applied

1. Stage40: keep initial coordinates, HP, count and global action cap. Constrain
   this one archer's voluntary destination to the existing lower dock stair,
   no farther east thanx2360. Give only this actor a narrow additional activation
   approach from dockx1880–2240, preserving radius850/height500/one-round pursuit.
   The highest allowed point is around(2360,2433), within451 vertical units of
   the observed mage dock post. Real shot/path usefulness remains unverified.
   First test whether an even smaller activation-only correction suffices.
   Do not widen the whole seven-member group's pressure without a comparison.
2. Stage31: compare that single ridge archer's voluntary retreat endpoint near
   the existing upper-east/east-return junctionx6170 instead of the far dead-end.
   An optional initial move6165→6090 is only75 units, but alone may simply replay
   the same retreat. Keep HP372 rather than overfitting this run's2HP remainder.
3. Only if the isolated enemy cannot perform a useful local role, consider
   reducing that one actor. Boss-HP reduction and objective relaxation currently
   have weaker evidence. High tide2→1 rounds is a lower-priority comparison,
   preserving warning and sufficient evacuation opportunity.

No existing actor coordinates, HP, flags or metadata may be rewritten in a live
test to manufacture a win. A pure before/after fixture must be labeled as such.
New authored opt-ins must preserve old saves and unrelated actors/stages;
`honroRouteGuard` cannot silently be reused because it is bound to a different
route revision. A changed Stage31 payload invalidates its production fingerprint
and needs honest new related evidence; old hashes must not be rebound.

Actual comparison must cover the affected approach, enemy response, cleanup and
normal return. Partial comparisons cannot claim a fresh whole-stage timing pass.
The unchanged-product current-master functional run41729470340 is pending and
is not included in this diagnosis. Source: archived original results/events and
normal saves from the three named runs, current author, activation and movement
candidate code. Current product is still3a7b9b88-equivalent.

## First product comparison unit

The first candidate keeps both original starting positions, all34/42 enemies,
HP/skills, terrain, boss/tide cycles, objectives, story and action caps. A pure
engine destination predicate selects only the two exact official campaign
archers, their existing pilot revisions and declared supports. Stage31 can use
upper-east/east-return but cannot voluntarily retreat east of6170. Stage40 can
use its dock stair but not voluntarily retreat east of2360. An actor already
outside because of knockback or an old save may take paid inward stepping stones.
No pose, HP, saved metadata or physical collision rule is rewritten.

Only a fresh Stage40 construction assigns the stair archer its own density cell
with the narrow dock approach above. The other six members retain the original
cell. Existing continued Stage40 battles keep their saved activation data, so
their results cannot stand in for the new roster's activation comparison.
Stage31 source payload is unchanged; its new runtime needs fresh probes/UI.

Pure captured-state policy/negative-scope and one-actor author fixtures passed.
The historical two-dock-position fixture explicitly accounts for the new cell
and still checks every unrelated field. These are not physics or gameplay
passes. Real compiled movement, fresh Stage31 normal completion and fresh
Stage40 combat/return remain pending. No stale threat-memory or other QA policy
change is bundled with this product unit; the initial before/after comparison
will retain the original controller to isolate product effects.

Register one immutable parallel comparison: unchanged Stage31 prepared entry,
original controller, genuine Engine probes and normal20R objective/gate; and
unchanged Stage40 prepared entry constructing the new one-actor cell, original
controller through normal return/settlement/reload under approved23R. The two
jobs upload independently. A1 browser scenarios remain explicit isolated
fixtures, not whole-stage or normal campaign play. Neither job publishes.

The prior unchanged-product run41729470340 finished Stage40 combat inR19 and
return inR22 from its exactR15 save. Fresh first cast and four PC/landscape-mobile
locale/charge observations passed. Actual result, combat-end and mobile guide
pixels were inspected. The guide uses deliberate normal minimap pan/zoom, so
its cropped caster is not evidence of an automatic-camera tracking failure.
It is not a new pacing-candidate result. Original archive is retained.
