# Stage 31 low-estuary roster and boundary pursuit

## Failure prevention: boundary disengagement exploit

Counterexample: approach a cell at x1700, then move past its x-zone edge before
an enemy turn. The previous API excluded it immediately despite its saved alert.
Repeated boundary crossings could deny retaliation without actual separation.

The new roster explicitly opts in to `engagementRounds:1`. A normal refresh while
a hero is inside the zone AND within the native per-cell approach radius stores
`engagedUntil[cell] = battle.round + 1`. Eligibility includes that round:
approach in R1 permits R1 and R2; if completely departed, R3 expires. Read-only
combatEnemies calls and out-of-zone refreshes cannot renew it. Re-entry legitimately
renews it. Save/load retains the receipt, but does not create a new one.

Actual native hurt retains its existing `aggroUntil = round + 3`. Hit alone does
not extend the approach receipt; after a hit in R1, native aggro is valid through
R4 and expires R5. Dead actors are excluded. Legacy configs without the explicit
option retain old behavior. There is no spawn, timer, revive or HP adjustment.

## Geography and roster

First reed bank: 8 close/front-screen actors on the exposed shoulder and 9 reverse
bank actors beyond the open erosion gutter. Enter the gutter to reduce low direct
fire, expose yourself on the shoulder for range, or close along the bank.
Second bank: 8 approach/flank-pressure actors and 9 shoulder actors, including the
midboss. Four elites and six roles remain; Stage 31 fixed v2 damage is unchanged.
The midboss is at x5070, native relocation x5180; both y values are exact top
interpolations. No old elevated actor coordinates or quota platforms are reused.

Every cell has `supports:[]` and `extra` bounded support/x zones. Zones do not
open simply because the party shares a continuous ground support. Radius and
height constraints still apply. Crossing a boundary can temporarily retain two
cells; deliberately splitting the party or hitting distant opponents can engage
both. This is disclosed, not forcibly suppressed to claim a 10-enemy absolute cap.
Normal one-cell approach is 8/9/8/9; enemy action limit stays 6.

## Reproduction and scope

```
node tools/act4-pilot/build-roster.mjs ../honro-pilot-terrain \
  _local/reports/act4-pilot/stage31/roster-estuary \
  ../honro-pilot-terrain/_local/reports/act4-pilot/stage31/estuary-graybox \
  tools/act4-pilot/layouts/stage31-roster-estuary.json
node tests/act4-pilot-engagement.mjs
node tests/act4-pilot-estuary-activation-native.mjs
```

The builder binds source raw/canonical hashes and preserves all nonenemy units,
NPC/events/objectives/boarding contracts. Pure activation fixtures model saved
state, legacy opt-out and death. Native fixtures pose real bodies, scan 147 fresh
approaches, apply actual hurt, restore a saved receipt and use native queue
planning. Posed placement is NOT player route traversal, GUI observation or full
play acceptance. The raw candidate and results remain separate from canonical
world. The short native enemy-phase test uses the frozen level-22/six-stat/starter-equipment reference solely
for lifecycle counting, not damage calibration, survival or win-rate evidence.

A preceding untrained lifecycle attempt ended lost after five completed actions;
its raw local result is preserved as `estuary-activation-untrained-lost.json`, not
relabelled as a completed enemy phase or normal-entry balance evidence.

Final recorded lifecycle: HP 1085/1174/2036/1362, 17 eligible on deliberate
split, 6 native admitted actors, 6 actual action completions, 1835 frames, return
to player aim. This is one posed phase, not complete combat acceptance. Evidence:
`tests/fixtures/act4-pilot-estuary-activation-native.json`; the preceding invalid
untrained lifecycle is separately preserved in the adjacent fixture file.
Candidate SHA-256: `11a84ac9a68028715118a966f1d42735682402f7ab39d0f99b3cdc3c1bd80234`.
