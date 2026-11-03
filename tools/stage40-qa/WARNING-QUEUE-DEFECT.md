# Confirmed Stage40 pending-warning starvation

Actual focused browser41638240125, sourceb11e15c5/native161e9b0b. Artifact13231614819 SHA25635a8e68d3553f0d695b3827df72cb80fca27d9c68685cb78cae530ec9437e6af is verified and retained. The newR18 warning was seen atR19, and its target occultist normally walked1653→1025, spending631 movement and remaining on the dock. The actor response is recordedR19/teamEnd18. Yet at finalR24 the living midboss remains telegraph with no fire/cancel event. This is a failed warning-resolution test, not a stage result.

The exact last autosave isR23 during a transition; normal Continue/readiness finishes that transition toR24 without altering saved resources. A detached copy of that actual resumed state produces the following queue:
- Six selected ordinary enemies: tier2, distance band0.
- Pending midboss final40-dock-right-3: tier2, distance304.119, band1, excluded.
- Target.seen=true, response.round19, teamEnds advanced beyond seenTeamEnd18.
The ordinary queue sorts tier, then distance band, then lastAct. Thus fairness cannot rescue a waiting attack in the next band. The pilot's bespoke fixed-location delayed attack is not represented in queue ranking. The warning's promise can remain unresolved after successful retreat.

This is a confirmed product scheduling integration defect; not evidence that retreat is impossible. Original four-point escape failure and all late full-stage failures remain separate and retained. New wider escape sampling is QA only and has actual movement proof.

## Narrow proposed correction
Only on authored Stage40 revision2 with official/custom pilot enabled, promote a living equipped pilot actor's telegraph action when target.seen and target.response exist and a later ally team boundary has passed. Keep the six-enemy action cap, existing pilot protected-resident checks, movement, damage, HP, target lock, response opportunity and all other stage behavior. No priority before player observation/response. A safe-area cancellation also needs its turn to resolve the stale warning normally.

The shared-engine patch is a separate coherent unit, not yet approved for final integration or deployment. Required regressions: exact captured pending actor enters unchanged-size queue; removing it leaves ordinary order identical; no pending warning / unseen / unanswered / same boundary remains identical; other stages31/34/39 remain identical even with same-shaped metadata; invalid/dead/friendly actors are not promoted. Then test actual normal saved-state warning resolution and body/retreat outcome. Final integrated runtime and normal Stage31 gate must be regenerated/reverified.

## Isolated correction verification (2026-11-03)

The isolated patch adds `shared/engine/src/act4WarningQueue.ts` and one guarded priority hook in `shared/engine/src/enemyAI.ts`. The predicate mirrors existing authored-finale pilot eligibility and requires the actual seen/responded telegraph and a later team boundary. Tier3 places it ahead of ordinary attacks without expanding the six-actor cap. Existing pilot firing/cancellation rules remain untouched.

`npm --prefix game run typecheck` passed. `node tools/stage40-qa/pending-warning-queue.test.mjs` passed14 frozen-state A/B cases plus controlled-actor guards against native96f203cb. The other-stage checks change metadata on the captured fixture; they are NOT natural Stage31/34/39 gameplay. The initial assertion failed solely because separate VM arrays have different prototypes; exact JSON values matched. That failed log is retained. The test now compares JSON-serialized queue records and still asserts the battle is unchanged by ranking.

Actual browser warning firing, fresh normal Stage31 runtime evidence, combined A2 acceptance, and whole-stage18–20-round completion remain pending. No production approval is implied.

## Actual browser correction comparison41642048069

Frozen sourcefbfee413 (nativee04ed9a6), unchanged R15 profile/driver and bounded36 defensive actions/R24. New actual Stage31 first-shot trials and whole objective passed, with boarding atR15, zero enemies and all four heroes alive; the normal evidence gate and normal build passed. Runtime digest7ae278319004dd73ce772abc042c2d6e33c22d9e4691feac740484254013f1ad. This is newly measured evidence, not a relabeled old hash.

Stage40: warning originatedR18, observed before the R19 response. The occultist normally moved x1653.095→1028.662 on the same dock, spending627.467 of2830 movement. The queued attack actually fired during the R19 enemy phase and was observed resolved at the next R20 ally boundary. The old source stayed telegraph throughR24. Warning readiness now follows the existing observed/responded promise without reducing damage or expanding the action cap.

All four heroes and residents remained alive; all residents stayed1450HP. Across the entire intervening enemy phase the occultist2039→1855 and mage1735→1713 lost HP, while defensive recovery increased archer/knight HP. The record does not isolate each damage source, so this is not a zero-damage dodge claim. Desktop1440×900 and mobile844×390 actual images show the target ring and Korean warning clearly above the HUD. Lower stairs are outside/behind the mobile HUD in this zoom, so comprehensive mobile threat readability and actual touch controls remain unaccepted. No new UI/art change.

Artifact13235351277, ZIP SHA256158215ef51c5a469322ddfdcd886c8269dea1c1d323e5be32cf2e2505251107d. Result/protocol and the fresh Stage31 package are archived alongside this report. This focused pass does not override the failed R25 full-stage outcome or establish18–20 total-round safe return, final A2 integration, earned campaign growth, or human fun acceptance.
