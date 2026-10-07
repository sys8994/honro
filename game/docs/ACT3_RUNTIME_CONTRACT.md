# Act 3 production contract

Working branch only. Source: HONRO Story Design v0.1, pages 18–26. Stages 21–30 preserve the original revelation order. No new named NPC, royal palace location, final boss, or supernatural rule is introduced.

## Map/runtime boundary

- Every ordered step has a marker with the exact step ID and finite foot coordinates, except destroy markers use `marker-<step-id>` with `target: <step-id>` to preserve global ID uniqueness. Interactions use `action: 'act3'`; passive destroy/hold/reach/escort markers need no action. `requiredClass` is copied where applicable.
- Destroy steps also have a real breakable terrain with the exact step ID. Their marker sits on a reachable shooting position; objective arrows point at the live terrain. Opening gates marks the named real gate terrain broken and increments `sceneVersion`.
- NPC records use kind `object:civilian`, team `npc`, `stageOverrides: { honroProtected: true }`; carrier additionally `fixed: false`, `maxMove: 900`, `moveLeft: 900`. No NPC personal name.
- `target` refers to the live NPC, never a stale marker position. Escort destinations remain fixed map markers. Carrier route markers use `route:<step-id>:0`, `:1`, etc. if more than a continuous forward slope is needed. No teleporting.
- Enemy records use ordinary existing kinds or `recoveryGuard` / `recoveryArcher`. Recovery personnel are nonlethal, with side 2 and disabled actions when subdued. Cohorts use `stageOverrides.honroCohort`; no stage requires total extermination.
- Each hold has a `wave-<step-id>` marker, on safe supported terrain away from the hold center. Initial enemies 6–10, active limit 3, finite reinforcement count 2–4.
- `initialState.honroAct3Revision = 1`; runtime persists ordered progress in `honroState.act3`. Saved Act 1/2 battles are untouched.
- Main and required upper-floor routes must work for all four heroes. Escort routes are continuous grounded walks. Marker height is a real reachable floor, never a decorative shelf.

## Ordered stages

21 — 성문 아래 / gate market / daylight
1. wagon-lock: destroy, archer
2. gate-resident: rescue, target act3-resident
3. refuge-hold: hold 2 enemy turns, radius 520, wave hound ×2
4. city-exit: reach

22 — 옛 장부 / archive galleries
1. archive-seal: interact, knight, opens archive-door
2. ledger-case: interact
3. upper-latch: destroy, archer, opens upper-door
4. compare-ledgers: hold 2 enemy turns, radius 460, wave lantern ×2
5. archive-exit: reach

23 — 사라진 짐 / canal granary
1. cargo-lock: destroy, opens cargo-gate
2. dispatch-bundle: interact
3. carrier-start: interact, target act3-carrier, starts escort
4. dock-mid: escort, target act3-carrier
5. dock-exit: escort, target act3-carrier

24 — 휘겸의 문장 / abandoned mansion courtyard
1. courtyard-latch: destroy, opens courtyard-door
2. family-crest: interact, knight
3. shrine-seal: interact, mage, opens shrine-door
4. land-register: interact
5. garden-exit: reach

25 — 폐가의 기록 / hidden archive
1. hidden-latch: interact, knight, opens hidden-door
2. archive-hold: hold 3 enemy turns, radius 460, wave recoveryGuard ×3
3. investigation-record: interact
4. rear-latch: destroy, opens rear-door
5. back-exit: reach

26 — 종을 만든 사람들 / burnt workshop
1. workshop-brace: interact, opens workshop-door
2. artisan-resident: rescue, target act3-resident
3. ledger-drying: hold 2 enemy turns, radius 500, wave picks ×2
4. casting-tally: interact
5. workshop-exit: reach

27 — 지워진 집안 / rooftop fire archive
1. water-release: destroy, archer, opens water-gate, stops west fire
2. fire-screen: interact, knight, opens fire-door, stops east fire
3. petition-record: interact
4. carrier-start: interact, target act3-carrier, starts escort
5. roof-exit: escort, target act3-carrier
Fire threat starts on first step; each full enemy turn advances loss pressure until both fires are stopped. No real-time timer during dialogue. Runtime fails at 12 enemy turns, shows remaining turns live. Both controls must be reachable in 12 turns with 4 heroes.

28 — 왕실의 선택 / outer government-office walls (not palace)
1. outer-chain: destroy, opens outer-door
2. closure-order: interact
3. suppression-order: interact
4. passage-hold: hold 2 enemy turns, radius 520, wave recoveryArcher ×2
5. office-exit: reach

29 — 현묵의 글 / night sluice, sealed storage
1. old-seal: hold 2 enemy turns, mage, radius 460, wave ghost ×2; opens old-door
2. hyeonmuk-letter: interact
3. sluice-chain: destroy, opens sluice-door
4. flight-hold: hold 2 enemy turns, radius 520, wave recoveryGuard ×2
5. sluice-exit: reach

30 — 남겨진 길 / river ferry
1. transport-map: interact
2. route-pin: destroy, archer, opens route-door
3. ferry-hold: hold 3 enemy turns, radius 540, wave hound ×3
4. old-road: reach, all surviving player heroes within 440 (same floor)
Ending: three records joined, Seolo's home vicinity connects to the route, old road toward Mumeongsa is cut. Act 4 is unavailable/준비 중; stage 31 cannot launch.

## Growth proposal (implementation/testing proposal; user final balance review pending)

Preserve stages 1–20 exactly. Stage 21 begins at the actual first-clear stage-20 XP, approximately level 15.69. Stage 30 target is level 22.0 using current XP curve, with 40% combat share and existing per-stage retry ledger. Existing cap 30 and skills unchanged. New stages must never extrapolate the clamped legacy level-25 reward curve.
