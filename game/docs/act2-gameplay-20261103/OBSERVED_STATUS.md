# Act2 baseline gameplay — incomplete / release blocked

2026-11-02 16:35 UTC snapshot. Original planning criteria are immutable. This is controller calibration, not a frozen cohort or human fun score. Engine/App production execution uses DOM/render/storage doubles and declared synthetic entry profiles; no continuous campaign claim. Final terrain art and normal browser replays are pending.

| Stage | Strongest current evidence | Qualification |
|---|---|---|
|11|Survival clear R44, 33 kills, 4 heroes alive|Fails 10–13 and ≤20; real vertical traversal; inefficient route/combat prioritization still under calibration|
|12|Survival clear R33, 30 kills, 4 alive; recurrence/sign/exit completed|Fails 10–13 and ≤20; objective-first pilot lost R7|
|13|Extraction/escort/release done; real landings on gate shelves|Three objective pilots lost R8–9; chained shelf movement next; no difficulty verdict yet|
|14|Natural R7 persistent flight lock, identical after Continue +1200 ticks|P0 reproducible native; root investigating runtime, unchanged exported fixture retained|
|15|Drift/groove completed; survival progressing through knocks|No full clear yet; earlier controller process OOM explicitly censored|
|16|Elder/disciple completed; protected-NPC recovery contested|One objective trial lost R10 despite all heroes alive; lane clearance/controller calibration ongoing|
|17|Work threat and brace completed; hoist unfinished|Objective R41 bound, 3 hero deaths; not a terminal game loss or validated difficulty estimate|
|18|Legal AP03 build clear R23, all13goals, 4alive, 6kills, 0heroHPdamage|Fails 15–19 and ≤20; no-AP03 natural stale cast blocks lift, independently persists through Continue|
|19|Clear displayR1/0combatcycles, all8goals, 0damage/kills|Intentional original noncombat rest/farewell, not combat difficulty collapse; normalUI CI prepared|
|20|Survival pilot lost R17 to convoy death; improved guard reaches escape R21|No completed clear yet; close-support requirement continues after rest, controller corrected next|

## Observed design affordances and limits
- Different chapters require recurrence navigation, extraction, gate-side access, convoy protection, NPC recovery, worksite operations, bell rescue/lift/locks, and farewell interactions. These are genuinely different objective sequences, not inferred from screenshots alone.
- Survival healing/defend kept parties alive in 11/12 but greatly extended runs. Objective-first routing in 13 exposed a fragile archer; sheltering and action-efficient vertical movement remain alternatives to test. This is an observed tradeoff, not proof optimal play requires 33–44 rounds.
- Stage18 required prepositioning east of a restored solid support. A failed controller approach was corrected through actual movement, and the later clear is retained alongside the failure.
- Stage20 guard policy eliminated the ambush and preserved the convoy where prior pursuit lost Gilchan. Supporting the injured NPC remains necessary during escape; generic pursuit is not a valid difficulty benchmark.
- Stage19 pacing relief is intentional. Harness dialogue finishing proves state receipts only, not scene legibility, emotional effect, or human enjoyment.
- No stage is release approved. Registered policy probability, population uncertainty, effective enemy actions, required encounter attribution, meaningful elevation coverage, final-art parity and browser verification remain fail-closed. Diagnostic Wilson intervals in the JSON describe only the listed calibration terminals, not expected player success.

Evidence: `evidence/` machine report; compressed immutable trial exports under `tests/fixtures/act2-gameplay/`; separate Stage14 and Stage18 blocker reports. Engine/project and exact runner hashes are bound in each initial record. Raw jump counts are not forced quotas or meaningful traversal claims.
