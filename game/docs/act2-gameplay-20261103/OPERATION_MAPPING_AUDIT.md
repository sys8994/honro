# Native input mapping audit before extended cohorts

Frozen `act2-gameplay-cohort-20261103.mjs` and its navigator remain unchanged. Existing outputs are native App/Engine observations, not browser-equivalent full-clear receipts.

| Operation | Frozen implementation / production relationship | Eligibility limit |
|---|---|---|
|Defend/recovery|Actual `App.defend()`; UI F invokes the same method (`shared/runtime/main.js:536,847`). Shield,4%HP and12%focus follow production guards.|No `Engine.wait()` calls. No legacy item calls. No replacement of recovery with a different API.|
|Move|`Engine.move(direction,C.STEP)` under `App.canInput`; normal App frame uses the same endpoint at1/120s and analog stick accepts fractional direction.|Parameterized native analog input, not actual keyboard/pointer trace.|
|Jump|`Engine.jump(active)` under readiness, grounded and budget checks; App.jump adds canInput then calls the same endpoint.|Future generic uses actual App.jump wrapper; frozen path retained.|
|Drop|Recorded nav `drop` means moving off a support edge and falling under ordinary gravity.|**Not Alt platform-drop input.** Raw drop counts cannot prove that control or a meaningful landing quota.|
|Select|Living unacted specialist selected with Engine.select while App.canInput; Engine.select rejects dead/acted/invalid/retreat boundaries.|App.selectHero also cancels control and updates selected skill UI. Future generic uses App.selectHero.|
|Fire/skill|Guarded Engine.fire checks canAct, grounded, loadout membership, allowed skill, cooldown and affordability; clamps aim/power. Native chooses legal loadout skills/aim/power.|Bypasses pointer/charge-time execution, so not browser timing proof. Actual UI11/15/20 observations independently exercise charge/aim/fire.|
|Interact|Production eligibility+use enforces class, distance, height, live target and App.canInput.|Frozen chooses eligible ready-step target without recording whether it is the single visible nearest context button. Exact UI target equivalence is **unverified**, not retrospectively assumed. Future generic uses nearest visible context-button target only.|
|Dialogue|Production Story.next/tick sequential pages, no dialogue index assignment.|Native presentation clock; not human reading-time measurement.|
|Clock/settlement|Physics and mission ticks use C.STEP=1/120. Frozen simulated performance clock advanced1/60 per physics step; projectile settlement still uses actual physics ticks.|Do not infer real-time pacing/minutes. Future generic aligns wallclock delta to C.STEP; dialogue presentation remains separately advanced.|

Future generic changes are `3c206eec` (plus prior emergency/Stage16 observation calibration). They are a new controller, not a rewrite of the frozen cohort or its results. Before any20-case registration, validate required authored observations and legal normal input boundaries on the new controller. Current finite trials retain resource/pose audit and source hashes, but are not acceptance-grade normal-browser full clears.

Terminology correction: starter IDs such as `itm_se_01` are personal equipment/accessories, not necessarily weapons. Immutable historical scope strings are retained as recorded; actual equipment IDs are authoritative. The separate observed post10 build equips only already-owned gear through normal rest transactions, with no inventory/XP grants.
