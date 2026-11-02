# Act1 pacing/pressure diagnosis — controller versus authored behavior

Scope: publicc1a8cc24 gameplay bytes; actual native App operations with DOM/render/clock doubles, **not browser proof**. Frozen15-case cohort is preserved. Numerical failures remain failures; these observations explain what to test before changing game rules. Original successful-run median targets stay unchanged.

## Frozen results

| Stage | Registered outcomes | Successful median / original target | Clear fraction |
|---|---|---|---|
|2|15/15/17R wins|15 /5–7|3/3|
|3|13/20/21R wins|20 /6–8|3/3|
|4|9/9/9R wins|9 /7–9|3/3|
|6|18/22/24R wins|22 /8–11|3/3|
|7|7R win;8/7R protected-NPC losses|7 /9–12|1/3|

Three observations exceed20R (Stage3 route21, Stage6 cover22/route24). These are not clipped. Each source/controller/trace hash and registered-runner check is in the ignored `current-strategy-measurements.json` produced by `summarize-current-strategies.py`.

## Stage2: convoy threat lock plus a poorly positioned escort policy

- Objective-follow carriage remainsx180 throughR6, advances740/1300/1860 inR7/8/9, then remains1860 throughR13. The archer firesR2–6 fromx1346→1236,y1093→1070 with the full1141 movement budget unused. Seven ofeight launches leave>500movement.
- `shared/runtime/allies.js` porter planning stops for **any** enemy within horizontal1150 and vertical650 of the carriage; initialfoe-0 at1180,2960 meets that rectangle aroundcar180,2974. Threat is presence, not proven active line of fire. Maximum ordinary porter target advance is560 per allied action, additionally bounded by escort front/blockers. `mission.js` has separate180px/s clear-road completion once all enemies and pending waves are gone, so a simple distance/560 formula is not a universal minimum-round proof.
- Controller follow logic waits for archerx<carx+500 before descending/advancing; after its initial high-cover stop it repeatedly shoots before solving the next convoy-blocking threat. This means15R is not a clean test of optimal convoy speed.
- **Next bounded controller test:** prioritize actual porter-blocking enemies, use legal lower-route/drop choices when high-cover shots cannot remove them, and report lock cause at each allied action. Preserve high-overwatch versus close-escort alternatives.
- **Potential authored concern, not yet a confirmed defect:** a harmless/occluded enemy can satisfy a wide rectangular halt rule. If the above instrumentation demonstrates that case, narrow convoy-halt semantics to actual pressure or a locally authored threat zone; do not blanket-remove escort danger, increase all speeds, or require kill-all.

## Stage3: artificial archer waypoint delays an already reachable ledger

- Frozen flow mage is on actual ledgerfloor(x~5642,y1612) byR9, but interaction occursR12; cover reaches same endpointR18/interactsR19; routeR18/interactsR20. Flow's first sampled mage ledger-distance/same-floor proximity isR9 (not by itself a full input eligibility verdict).
- `tools/testing/stage3-positioning-controller.js` additionally requires a recorded **archer** waypoint5550 before any hero may interact. Production `interactions.js` requires live active hero, nearest eligible marker, distance≤260, vertical difference≤150 and normal input availability; ledger has no requiredClass. Therefore that extra prerequisite is a controller artifact, not authored story.
- Cover/route also spend25/23 accepted launches versus flow12 and reach transfer eventR17/18 versusR8. Shared near-enemy fire-before-move choices cost turns. This is a tactical route tradeoff, not evidence that raw map distance forces20R.
- **Authorized calibrationv2:** remove only artificial archer prerequisite; let whichever companion is actually nearest and eligible interact through App adapter. Retain terrain, entry/loadout, original route, normal jump-budget recovery and production completion/settlement. All prediction uses detached Engine/battle and exact live guard. Original frozen outcomes remain untouched.

## Stage6: shared early-fire bias, not yet proof that all competent escort play exceeds20

- All three policies share nearby-enemy fire-before-move. At accepted launches, unused movement is>500 in38/42 objective,52/53 cover,51/56 route shots. Median remaining movement1291–1311 is roughly a full turn (initial budgets1291/1311/1556).
- Objective carrier plateausx4583R8–10,x5192R15–17; routex4424R8–16,x5255R19–23. Cover remainsx4100 throughR17. Production `mission.js` follows a leading hero at360px/s whenever the leader is>65px ahead, outside ally phase, stopping60px behind; this is **not** a fixed once-per-round slow convoy rule.
- Objective midboss takes first damageR3 but diesR14; route diesR16, coverR18. Objective only11 of42 planned launches targetmidboss; route7 of56. It is genuinely required by `objectives.js` alongside rescue and carrier arrival, so neither bypassing it nor moving everyone endlessly forward is a valid repair.
- **Authorized calibrationv2:** retain one companion on the existing rescue/exit route, have two focus the real midboss from legal walking/shot positions, prioritize threats near carrier, spend movement before incidental nearby shots, and ordinary-defend only when required jump/landing budget is insufficient. No actor/resource edits, HP nerf, invented teleport, round cap or objective change.
- Raw ground travel is~6050px from330 to6380 and initial hero movement is1291–1556, before slopes/jump costs/combat. This contextualizes but does not prove a minimum of4–5R: actual supports, landing budgets and tactical stops matter. Test calibration before proposing authored changes. If required boss/route still exceeds the target under competent alternative roles, inspect local encounter activation/line-of-fire and action opportunities rather than arbitrarily shrinking HP.

## Stage7: protection priority is actionable, not party-survival difficulty

- Flow rescues markers1/2/3 atR1/R2/R6 and winsR7; cover/route only rescue1 atR3/R2 before losingresident-2 atR8/R7. All three party heroes survive both losses.
- Resident-2 starts600HP at3000,3000. Recurring damage comes from nearby batsfoe-4/foe-7, crowfoe-1, rangedfoe-10 and their supporting cluster. Flow targetsfoe-4 andfoe-9-cluster; loss-policy planned target logs focus opening/flank enemies and never targetfoe-4/foe-7/foe-1/foe-10. More shots(22/18 versus12) do not imply useful protection.
- Rescue provides at least60shield and marks resolved; it does **not** reset HP or make the person invulnerable. Flow still records later damage. Finite supplies/support healing are legitimate and separate from debug recovery.
- **Next recommendation:** preserve one rescue-first runner and use other companions to intercept actual resident attackers, then compare with protective-cover tactics. Do not extend timers or inflate NPC HP merely to rescue a controller ignoring the endangered person. The1/3 frozen fraction cannot certify either acceptable intended difficulty or unavoidable unfairness. Real UI must still make resident danger and route choices readable.

## Evidence and stopping

Calibrations are separately named/versioned; source registration is `calibration-v2-registration.json`. All15 frozen generated controller strings were checked byte-identical after the conditional adapter extension. No gameplay source changed. Local browser launch lacks Chromium executable; root's fixed real-browser executor owns representative UI confirmation/publication. Overall acceptance remains incomplete/out-of-range pending required effective-action, valid-landing, special-metric and actual-UI gates.

## Calibration outcomes (separate from frozen cohort)

- Stage3v2 clean sourceef48be13: mage legally interacted withledgerR9, actual victoryR10,2survivors. This removes3R of artificial archer-wait delay versus frozenflowR13, but6–8R target remains missed. No criterion change.
- Stage6v2 clean sourceef48be13: actual victoryR10,3survivors,carrier1686HP/x6317,requiredmidboss dead.22 actual player launches,14 planned atmidboss; damage spansR3–10. Console66total fire calls included hostile fire and is not player-shot count. This establishes a legal target-band route without HP/speed/terrain changes, not a registered overall pass.18hostiles survive andbridge-boars/pursuit remain pending, which current completion allows; encounter-pressure gates therefore remain separate.
- A separately declared nextStage6 diagnostic swaps the scout fromknight tomage, preservingknight+archer boss fighters; it is informed by the first outcome, not a blind cohort addition.
