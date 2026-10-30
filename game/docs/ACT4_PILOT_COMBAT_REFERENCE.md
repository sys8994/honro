# Stage 31 pilot: fixed native damage reference v2

Status: native successful-contact calibration; normal-play acceptance **not established**.

## P06 cause and correction

The old `HonroProgression.referenceStats().shot` uses legacy `LA01`, legacy skill
normalization, a 1.18 archer multiplier and rank 4. Current `A01` is a redesigned
rank-1 basic attack. The old reference was 587.989, versus 237.79 raw current A01
for the same untrained level-22 reference: a 2.4727 ratio, before target defense.
Do not use the old scalar as current effective attacks-to-kill.

The separate controller run `0ea94672-0d93-49ee-a061-f45dd7b7d6a6` omitted the
pilot module entirely. Its 1420/2059/2272 HP observations are legacy-runtime
observations, not evidence for either pilot tuning version. Keep that failure
record; do not relabel it after fixing the loader.

## Frozen reference

`declared-normal-entry-six-stat-starter-v1`: current stage-31 entry level 22,
six legal stat investments, three legal training attempts on the declared
loadout, starter personal equipment, no common equipment. Basics remain rank 1.
HP: archer 1085, mage 1174, knight 2036, occultist 1362. This matches the declared
prepared entry profile; it does not claim earned preceding play or all SP spent.
No live party stats, success rate or active battle HP select the budget.

The 56-row matrix records native per-target/per-cast damage, not damage summed
across different targets. The fixture uses successful analytic projectile paths,
native collision/impact/blast/armor/existence, mean damage roll 1, no critical,
and S00 power .5. Miss rate, critical advantage, multi-target efficiency, terrain
cover and real policy outcomes remain separate measurements.

Normal HP derives from 1.5 current counter attacks: guard 266 (front A01; rear armor is
weaker), bow 372 (A01/M01), shade 297 (M01/O01), warden 244 (M01/S00), mourner 332
(A01/M01). Physical resistance remains meaningful: shade A01 does not count as
an appropriate counter. The four elites use 1.8 reference counter attacks.
Midboss HP 1191 is a **planning model**: two guarded rounds plus half an exposed
round, three successful attack actions and one movement/support action per
party round. Actual 2–3-round kills must still be measured.

Nine incoming skill rows separately calibrate native enemy casts against the
reference archer's HP 1085/armor .272. Normal target fraction .26, elite .28,
midboss .30; each skill gets its own stored attack coefficient through native
`Engine.effective()`. No target-percent hurt hook or armor bypass exists. Other
classes retain their distinct HP/armor, misses and splash falloff still matter.
Difficulty scaling applies once. Skills with different intrinsic utility keep
that utility; the contact-damage band is the authored pilot constraint.

Only fresh flagged Stage 31 actors receive v2. Existing saved HP and v1 budgets
are not upgraded or healed. Stages 34/39 still require their own calibration.
After a locked shot resolves, the same enemy action runs bounded native movement
and finishes once. The next ally phase can attack the exposed body; blocked
movement cannot preserve armor or stall forever. Snapshot continuation retains
in-progress movement. No resurrection, invulnerability or HP lock is added.

## Reproduce (coordinate the native slot)

```
node --expose-gc tools/act4-pilot/measure-damage-reference.mjs 31
node --expose-gc tools/act4-pilot/measure-incoming-reference.mjs 31
node tools/act4-pilot/build-damage-reference.mjs
node tests/act4-pilot-damage-reference.mjs
node tests/act4-pilot-combat.mjs
node --expose-gc tests/act4-pilot-combat-native.mjs
node --expose-gc tests/act4-pilot-roster-native.mjs <candidate-stage.json>
node --expose-gc tests/act4-pilot-relocation-native.mjs
```

The checked-in fixture binds exact source hashes. Changes to those damage
sources require rerunning the matrix, not just replacing hashes. The reference
builder is deterministic and does not write canonical world/stage JSON.

Runtime sentinel: `honroPilotBudgetBasis.version === 2`, fixed `referenceId`,
`role`, finite `referenceHp/referenceShot/hits/fraction/normalHp`, and finite
positive per-skill `skillAttack`; `honroPilotSkillAttack` is saved on the actor.
The reference global is `HONRO_ACT4_PILOT_COMBAT_REFERENCE`. Loader must consume
it and the pilot module once in the official source-registry order.

## App parity and withdrawn fixture attempts (P06)

`tests/fixtures/act4-pilot-app-preflight31.json` is the actual App capture from
controller tool commit `3ec206f19` (source commit is retained in the JSON).
Before either matrix runs, `reference-preflight.mjs` checks all 38 factory bodies
against that capture: hero dimensions, role, armor, attack, ranks, equipment,
HP and level; enemy dimensions, role, armor, ranks, variant/type and existence
resistance. Actual App mode is campaign/normal, not training or custom map.
Enemy HP/attack from that capture are obsolete v1 and deliberately NOT the new
calibration target. Missing hero existence fields remain absent, not fabricated.

The contact matrix is an isolated practice-mode container **without Engine.tick**;
it only integrates native melee/projectiles. It cannot test practice revival,
campaign victory, turns, or player accuracy. Lifecycle tests instead set campaign
mode, exclude unrelated victory objectives with a fixture-only checkEnd stub,
and advance native review/transition to the next player round. No such stub is
installed by the production module.

Withdrawn development attempts: missing starter sync (knight HP 1885), default
practice player body (provisional mid HP 1195), practice revival invalidating a
dead-actor assertion, and premature assertions before review/transition completed.
Their displayed tool results are retained in task history; earlier complete raw
JSON was overwritten and is NOT represented as a preserved raw dataset. None is
used in the checked-in final matrix. The final actual-App parity gate, 56 outgoing
and 9 incoming rows are the only v2 budget evidence. Contact calibration does not
waive normal 1–2 effective hits or measured midboss 2–3 party rounds.
