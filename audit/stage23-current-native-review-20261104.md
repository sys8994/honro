# Stage23 reviewed-v4 natural gameplay and pacing review

Status: normal build, complete native expedition gameplay and an actual R1-to-win browser expedition passed on the unchanged b1b1ce63 product. The native run took 26 rounds and the separate browser run 30. Both exceed the 20-round target. No exception is approved; pacing diagnosis continues. Master and Pages are unchanged.

## Scope and provenance

- Act3 chapter3, global23, current reviewed-v4 story and map revision423. Master inspected at `f85a108a29d27cc5488d69d42034d58ac7699c0d`.
- Actual production App/Engine actions, projectiles, enemy actions, movement, finite focus and ordinary saves were run. DOM, rendering, storage and clock use test doubles. No live positions, HP, enemies, objectives or RNG were edited. External-write/recovery audits were empty.
- Entry is a legal first-clear/recruit reward-ledger fixture through22, level16, ordinary-stat6, rank1 equipped skills, 원정/story. Chapters1–22 were not naturally played in this run. It is not a real player's save or a full campaign-chain proof.
- Production story must be enabled in the runtime harness. The legacy escort tests alone do not cover the shipping reviewed narrative. Current reviewed23 has zero reinforcement events, despite legacy author metadata listing14.
- Local source is a space-constrained materialization. Runtime/controller/profile hashes identify the compared inputs, but intended source commits are not an exact whole-tree checkout attestation. The earlier baseline CI does attest its full checkout.

## Final product scope: original40 roster and HUD clearance

All enemy-removal variants are rejected after the matched comparisons below. The final product preserves the original 40-enemy reviewed runtime byte for byte and applies only the Stage23 HUD clearance fix in `shared/runtime/objectives.js`. No count, placement, HP, escort speed/budget, terrain, dialogue, rescue proof or victory-condition change is retained.

### Historical two-guard experiment, rejected

The following paragraphs describe the rejected experiment, not the final product. Initial population was 40→38; all 10 elites, exit defenders and distinct flank/crossfire roles remained. The two guards repeated low-road obstruction roles in the long middle escort stretch.

No terrain, positions of retained units, HP, attack, NPC stats, escort speed/budget, activation limits, population caps, dialogue, physical rescue proof or victory conditions change. Old saved40-enemy battles retain their exact state when continued. The raw authoring project remains unchanged; the runtime author filters all four exact ID-reference locations (units, encounter membership, and design group IDs/members), so no dangling required-unit reference remains. The adjustment only affects fresh reviewed23 launches and records a pacing revision.

The change is in `shared/runtime/act23-v4-ch23-reviewed.js`, initially committed as `b81ca7c4c42a05f80e7090c4b7f5b2460f1bbac9` on `work/stage23-two-guard-pacing-20261104`.

## Matched initial comparison

Both runs used identical profile hash `e0b0828c5da6fbf66bd5fc2c1abc30f670d1844722f626b9d8c632a1a01eda11` and controller hash `ce60c2ae9eaa1a728262dad98705eec2a5973d50a15f310e0b183d7e4f6b03a2`.

| Measure | Original40 | Remove two38 |
| --- | ---: | ---: |
| Winning round | 33 | 29 |
| Shots | 96 | 97 |
| Defends | 31 | 16 |
| NPC HP damage | 290.8 | 252.8 |
| Hero HP damage | 2812 | 2545 |
| Remaining enemies | 14 | 13 |
| Living heroes at victory | 4 | 4 |
| Observed story rows | 17 | 17 |

The improvement is fewer idle/blocked actions, not fewer total shots. All17 observed row IDs match. The NPC still takes real pressure. Having all four survive was an outcome, not a no-incapacitation requirement.

Baseline runtime SHA256: `71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c`.
Two-guard runtime SHA256: `9de11f91c3696c52df6c7a87b95f06f67f7996e9141faf9dd7cff4dab4dfed76`.

The corrected original33-round run is also attested by [CI41759542357](https://github.com/sys8994/honro/actions/runs/41759542357) at `5a0e8e2dda9a606e02f1c1e72e5222ac10948f64`. Its artifact ZIP hash is `cc04ed9309a93c691a00fd78893685064d56520ef08e569fed2ca523fc4e2b75`. A prior34-round run had a controller ramp/drop limitation and is not the matched pacing baseline.

## Why the remaining length is not explained by dialogue

In the29-round candidate, the middle escort spansR4–20 with63 shots and4 defends; exit escort spansR21–29 with29 shots and6 defends. Movement and escort happen during attack preparation as well, so these cannot be divided into independent combat and walking round totals. All17 dialogue rows are acknowledged without consuming battle actions; this harness does not measure human reading time.

There are25 actual kills:7 elites targeted by37 shots,18 ordinary enemies targeted by59 shots, plus1 shot at a surviving guard. Three commanders B-0/F-0/E-5 account for21 shots. The win leaves13 enemies alive, so this is not forced map-wide cleanup. The remaining length is mainly combat plus interaction with the aiming policy, not a justified29-round narrative requirement or a demonstrated minimum for skilled play.

All10 post-start defends occur while the convoy is blocked with movement budget remaining. Block detection includes the next route waypoint as well as the NPC, and already checks vertical proximity. Faster NPC movement alone is not supported as the main remedy.

## Rejected and diagnostic alternatives

- Removing two additional guards B-5/F-2 produces27 rounds and91 shots, but NPC damage falls to65 from252.8, a74% drop for only2 additional rounds saved. This broader four-removal candidate is not recommended.
- Three genuine saved battle poses were inspected with isolated engine copies and full projectile resolution, not generic first-hit previews. M11 versus M03 produced311 vs297 damage atR13,342 vs no viable tested M03 seed atR18, and326/1kill vs325/0kills atR26. No clear M03 replacement advantage was found. These are bounded samples, some from earlier controllers, not an optimal strategy proof.
- The original controller can stop168px from a foe because it uses a170px ranged stand-off, then defend with unused movement after failing to find a shot. A bounded closer-angle input policy is compared below rather than further weakening the product to compensate for this behavior.

## Bounded closer-angle policy comparison

After all normal equipped-shot attempts fail, the input controller now makes one ordinary approach from96–190px to95px only for its nearby road threat with vertical difference below220px and movement left. It then retries a real equipped attack. There is no forced hit, teleport, focus refund or product change.

Both original and two-guard candidate were rerun with identical entry and controller SHA256 `15b0f4596ada296511f39c987ae0b21455873fcb40a1047bfb940aaa2ce01091` from test commit `2f902552b3987e765430c11782dc133a163263b5`.

| Measure | Original40 | Remove two38 |
| --- | ---: | ---: |
| Winning round | 33 | 28 |
| Shots | 108 | 96 |
| Defends | 19 | 11 |
| NPC HP damage | 171 | 207 |
| Hero HP damage | 3269.4 | 2737.3 |
| Remaining enemies | 13 | 13 |
| Living heroes | 4 | 4 |
| Story rows | 17 | 17 |

Both runs pass actual victory→rest→export→reload and single settlement. All17 story row IDs still match, and external-write/recovery audits remain empty. The candidate retains real convoy pressure; its NPC damage is higher in this paired policy, illustrating why count reductions and action sequence should not be treated as linearly equivalent.

The candidate makes6 closer approaches;5 find a shot and1 still defends. The original makes14 approaches;3 find shots. The fixed stand-off was a real limited input-policy issue, but correcting it does not turn this into a sub20-round chapter. The two-guard benefit persisted under these first two policies (33→29 and33→28), but not under the later forward-escort policy below. These earlier results alone do not justify final adoption, an optimal-strategy claim or human-fun approval.

The final paired raw-result SHA256 values are `2f62fee34ab5db56e8628324d5aa96f772b9a1ae52cd95e13384f232a6af940b` (original) and `d71314b242d216ea8608b8864b7e4188d9890780052fea7eb9a8ed0e6bef8d31` (two-guard candidate). Raw native profiles/results are retained separately and are not embedded in this public code/report change.

## Save, rewards and focused regressions

- Fresh38 and original whole-battle40 Continue contracts pass. Terrain/routes, retained actor properties, population caps54, active limit4 and all10 elites remain unchanged.
- 전술/normal fresh construction checks retain correct difficulty HP scaling, base HP/attack, positions and geometry. A natural tactical full clear was not run.
- Existing reviewed23 tests pass physical rescue, optional questioner deaths, banner/prior proof conditions, journal and dialogue/save behavior. Those tests use explicit setup fixtures and are not additional natural clears.
- The actual two-guardR29 checkpoint was continued through ordinary combat/escort, won atR29, then went through resultContinue→rest→export→reload. No24battle launched, visit count stayed1 and rewards did not duplicate.
- Party XP budget31548 and combat pool12620 are unchanged. Individual hero gains differ with natural contribution;7887 is not a valid per-hero cap. Spent plus forfeited remains the party total.

## Fresh CI cluster-skill sensitivity

The same two-guard product and bounded closer-angle input policy completed a fresh exact-checkout native run at `54d7fa09dddd1930dd640cec38b96112cbae3a93`, [CI41796761244](https://github.com/sys8994/honro/actions/runs/41796761244):28 rounds,96 shots,11 defends,13 foes left, NPC1243/1450, all four heroes alive,17 story rows and one exact settlement. Saved genuineR13/R18/R26 poses fed detached full-projectile comparisons. AtR13, M04 hit three enemies for438 damage versus M11's297 to one target. AtR18 it was worse286 vs363; atR26 it was nearly equal358 vs355. This shows a situational cluster option, not a full-run improvement.

A bounded visible-cluster controller then considered M04 only with at least two nearby enemies and an estimated15% advantage. It did not inspect future RNG or mutate the live game. Both product variants used exactly the same entry profile (`89a8778509042f6ba2afc4402bd9f9a9682a5505c31d1c8726b0feb72fd6d815`) and controller (`fc8554c514a0f1ed8f0f20f164fad06bda0a6e815a6c58d70b52ba724a5e37fc`) in [CI41798014774](https://github.com/sys8994/honro/actions/runs/41798014774), source `3789d2ef3d6b275a50d427a4aa18acf4c8a0c22a`.

| Measure | Original40 | Remove two38 |
| --- | ---: | ---: |
| Winning round | 33 | 30 |
| Shots | 104 | 96 |
| Defends | 23 | 19 |
| NPC HP damage | 181 | 145 |
| Hero HP damage | 2678.2 | 2458 |
| Remaining enemies | 12 | 12 |
| Successful M04 shots | 7 | 4 |

Both won, reached rest and reloaded with one settlement,17 equal story rows, and empty external-write/recovery audits. Candidate M04 shots actually dealt406,395,517 and468 HP damage to two or three enemies each without friendly damage. Nevertheless the overall30 rounds is slower than the separately tested closer-angle policy's28 rounds. Do not mix these policies when estimating the product effect: this matched pair is33→30. The cluster policy is not adopted as an improvement. Artifact13306133664 ZIP SHA256 is `6c6f8ceb22f7e3b472093301ea2e9cf344673c29517b8748a9519a4b11fb2dc0`.

The28-round run's dialogue rows occur only atR1,4,5,28. R5–25 contain3–4 shots per round. R26 has2 shots;R27 has no shot and four defends while the escort travels;R28 completes. The long middle is combat rather than a required narrative reading duration. Seven shots at A-0/A-1 also include the knight pursuing rear enemies fromx1511 tox436 while the carrier's round-startx moves2264→2980. This is an input-policy inefficiency, not proof that those enemies should be removed.

## Forward-escort policy reverses the two-guard result

After escort activation, a bounded policy stops pursuing enemies already550px behind the carrier. It does not remove, freeze or stop those enemies from attacking. The original closer-angle policy otherwise remains intact; it does not include the rejected M04 preference.

[CI41799550364](https://github.com/sys8994/honro/actions/runs/41799550364), commit `1198186dcb1594905ca0aeaa14e5b5ab6f4a05d0`, compared identical profile hash `d33ef246b3d5bd29819c91d88af109b49c9662e9a9c9b179561e44c6e4bca6c8` and controller hash `3c6bca2831652de4324da654c08b4eff4fa360442167d3834e82654905a4a1c3`.

| Measure | Original40 | Remove two38 |
| --- | ---: | ---: |
| Winning round | 26 | 30 |
| Shots | 87 | 95 |
| Defends | 13 | 21 |
| Post-start defends recording actual blocked=true | 5 | 17 |
| NPC HP damage | 124 | 84 |
| Hero HP damage, all sources | 2587 | 3048.9 |
| Hero HP damage, enemy sources only | 2536 | 2868 |
| Remaining enemies | 13 | 14 |

Both won, reached rest and reloaded with one settlement and17 observed story rows, without external writes or recoveries. HP damage does not include shield depletion or healing. Friendly-source damage accounts for the difference between all-source and enemy-source hero totals.

The38-enemy candidate is ahead atR10 (carrierx3662 vs3150), but recordsx4549 atR13–15 and later finishes four rounds slower. The extra defends and shots are observations, not proof of a unique causal enemy or RNG explanation. The simple `blockingFoes` diagnostic uses distance to the carrier and is not identical to the product's current-plus-next-waypoint blocking predicate. Do not call it a complete blocker trace.

This result withdraws the general pacing recommendation for removing both guards. The current best observed original is26 rounds under this specific policy, still above20. The next isolated comparison tests C5-only and E2-only39-enemy variants with this exact entry and input policy before any additional HP or roster reduction. E5 needs3/4 shots in the new pair and is already dead by candidateR12, so the earlier6-shot observations do not justify claiming it causes the subsequentR13–15 delay.

Artifact13308030054 ZIP SHA256: `d1c31af938315e74e8e3897ca8940a2d17747ac03b7d7bec628b65784530b0eb`.

## Isolated guard omissions are also rejected

[CI41801380456](https://github.com/sys8994/honro/actions/runs/41801380456) at `03bf72d56aa7036d669bf7db09bb8b1e20338e45` reused the exact original26-run entry and unchanged forward-escort controller above. It generated each diagnostic source from the hash-checked two-guard runtime by changing only the removal list to one ID. Each generated runtime is preserved in its artifact; these were not release builds.

| Measure | Original40 | C5-only39 | E2-only39 |
| --- | ---: | ---: | ---: |
| Winning round | 26 | 27 | 26 |
| Shots | 87 | 92 | 91 |
| Defends | 13 | 11 | 9 |
| NPC HP damage | 124 | 62 | 65 |
| Hero HP damage, all sources | 2587 | 2788 | 2331 |
| Remaining enemies | 13 | 13 | 13 |

Both one-guard variants won and retained17 story rows and exact single settlement, but neither reduced the winning round and both roughly halved observed NPC HP pressure. Neither is adopted. Original40 is retained; no HP, count, placement, speed or victory-rule change is selected. Original26 remains above the20-round target, without an accepted exception. This is not a claim that every different strategy must take26 rounds.

C5-only runtime SHA256: `f0b32a7f79f1e02f7e1b22ceb50219ca08771da9e284ebf89b169cf730ef3099`. E2-only: `aa5ab1d51bed7398c2dba975ca03c55840dfab692dc420482448454e133618d1`. Artifact13308147124 ZIP SHA256: `3825d0d17d3dfd19c695515a1787767de77864e504c25558c69c1ce46c961779`.

## Original public build browser observations

After explicit approval of synthetic game screenshots/state in public Actions artifacts for14 days, [CI41793426811](https://github.com/sys8994/honro/actions/runs/41793426811) at `5d28c6388c0d2502bd7fd9346e07250bd185a1f6` passed Chromium UI checks against the original public Pages build. HTML SHA256 was `48508e7cbf43ad5985092a8fb62840fe9a9dabc7d5c7ac9ff49cf161809ee41a`. The source checkpoint came from the naturally earned originalR33 run, with earlier1–22 still a synthetic reward-ledger fixture.

Real settings/file import, Continue, keyboard/touch aim, walking to the exit, victory, rest and exact reload settlement passed at1440×900,390×844 and844×390, with no JavaScript errors or horizontal document overflow. These are late-checkpoint UI checks, not fullR1 browser play, real-device FPS or human-fun approval. That run tested aiming and movement, not firing.

Screenshot inspection found the landscape secondary “화면 밖” label overlapping the “물건 살피기” button. The candidate moves only Stage23's secondary world tag around this visible button, preserves the main objective and direction arrow, and omits the secondary tag only when no clear slot exists. Other stages/custom stages are unchanged. Focused tests pass the actual landscape geometry, adjacent/custom stages, hidden/zero controls, canvas offsets/DPR, left fallback and no-space arrow behavior.

The HUD-only candidate browser script checks equipment open/close, viewport rotation and painted-label clearance in addition to the original earnedR33 exit/settlement flow. Separate public-browser combat samples are documented below; the exit script itself does not test firing. The test's label boxes are converted from canvas-local to viewport coordinates before comparing DOM controls. This is a test correction, not a runtime change.

## Public browser combat samples and final focused contracts

[CI41805141611](https://github.com/sys8994/honro/actions/runs/41805141611) at `89e63e48668f4b989afb0a6cb23fd989e064abe4` passed actual public Chromium combat controls. The published HTML hash still matches the original build above. Original40 native forward-escort play reproduced26 rounds before generating earnedR8/R19 checkpoints; the browser-only retry reused those checkpoints instead of rerunning the native playthrough. Artifact13310020643 retains approved synthetic observations for14 days.

- Desktop R8→10: real keyboard movement/aim, six shots, two defends and enemy turns. Enemy net HP decrease1611; hero net HP decrease141. The NPC remained at1406HP and the same position. High warehouse archers and lower loading-yard enemies offered distinct firing angles/targets, while the convoy stayed blocked.
- Mobile R19→21: portrait/landscape rotation, real touch movement/fine aiming, five shots, three defends and enemy turns. Two enemies died; enemy net HP decrease498, hero228, NPC64. The NPC advanced273.23px. Reducing enemies did not remove convoy pressure.
- These net before/after HP differences are not cumulative damage totals. Aiming assistance operated on a detached engine copy with a live-state equality check; actual actions used UI input, without live battle edits.
- Direct screenshots show distinguishable upper/lower threats, carrier, firing lines and bottom resources. The known secondary-objective/equipment-button overlap is visible. Overlapping allies and limited vertical space in landscape are visible limitations, not a proven new input failure. Round banners are transient transitions.
- The first mobile run stopped on the test's too-tight aiming convergence requirement. Fine analog touch adjustments passed on the same product; no product code was changed for that retry.

These are two-round samples, not a full browser clear, real-device performance measurement, optimal strategy or approval of the whole26-round experience.

[CI41805064338](https://github.com/sys8994/honro/actions/runs/41805064338), source `7e4d673e52e86740b05560aaa89e4cf2791a70c3`, passed original40 fresh construction, exact old40 Continue, tactical initial scaling, Stage23 reviewed narrative/physical rescue, scoped HUD clearance, and39 objective-clarity state-fixture checks. The first aggregate attempts exposed stale tests rather than Stage23 rules: Stage5 now calls its migrated actor-backed target 주박목; Stage10 now requires safe withdrawal after six protection turns. The fixtures were updated to assert those current conditions, including failure before the target is broken and no completion merely at six turns. No runtime rule or release guard was weakened.

## Approved Stage31 refresh and final same-product verification

After explicit authorization for the test-only public artifacts and permanent result-summary commit, [CI41846264307](https://github.com/sys8994/honro/actions/runs/41846264307) performed the unchanged official Stage31 Engine probes → fresh normal UI battle/boarding → evidence attachment → normal build procedure. Its actual source checkout was `e853f16bf007181402a90b17b1db49a88932bb92`, separately recorded from the workflow commit. It won in 15 rounds with four heroes alive, no JavaScript errors, all four probe groups passed, and identical preview/final HTML and active files. No guard or product rule was weakened. Generated commit `b1b1ce63dfa08b111725f3b907088b70f280f17c` is a direct child of e853 and changes only `tools/stage31/production-package.json`. Artifact13334256728 is 8,233,266 bytes, retained for 14 days; ZIP SHA256 `0c8d2727e3e3cd256c986566dba3c039fc19e406d3c0cebfff51619130fec1b4`.

[CI41850399757](https://github.com/sys8994/honro/actions/runs/41850399757) then passed all steps on that exact b1b1ce63 checkout:

- Normal `npm run build` with the unchanged release guard.
- Fresh original-40 expedition play from entry to actual win: 26 rounds, 87 shots, 13 defends, 13 enemies left, NPC HP1326/1450, four surviving heroes, 17 story rows. External-write/recovery audits remained empty. Rest, export and reload preserved one settlement, party XP31548 and combat budget12620.
- Scoped HUD fixtures, original-40/save contracts, reviewed23 story/rescue rules and objective-clarity checks.
- Actual Chromium settings/file import, Continue, equipment open/cancel, aim, movement, victory, rest and exact reward reload at 1440×900, 390×844 and 844×390. Mobile rotation worked. No JavaScript errors or horizontal overflow occurred. The served bytes equalled the normal built HTML: SHA256 `199a47f9180ecc106c26fcb174e99f84154ddae2f35bded2f2b41e01bdcc974b`.

The fresh native run uses the same controller SHA256 `3c6bca2831652de4324da654c08b4eff4fa360442167d3834e82654905a4a1c3` and original reviewed runtime SHA256 `71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c` as the earlier 26-round baseline. Its profile hash is `204438ad279430421596adf7e072144f3392bc1d45a146dbc0a389fafbccca52`: recursive comparison found only the newly generated `equipment.runId` differs from the earlier entry, with gameplay fields unchanged. It is a fresh repeat, not a claim of byte-identical entry profiles.

The browser uses the previously earned original-40 R33 checkpoint, not the new R26 final state. Therefore the browser result screen says 33 rounds while the new complete native play says 26; these are separate runs, not a regression or a claim of a 33-round fresh candidate playthrough. The exit browser checks do not fire weapons. At this point the firing observations were the two public-build samples above; the later complete browser run below supersedes that coverage limit.

Direct image review confirmed the normal turn banner disappears, the main objective/resources stay readable, and the landscape secondary target label is below the equipment button with an 8px gap (label y170–190, button y118–162). Portrait and desktop labels are also separate from the button/minimap. Allies can still overlap, and the landscape viewport shows less vertical terrain; these remain visible limitations, not additional proven input failures.

Artifact13336315640 is 5,140,862 bytes, retained through 2026-11-18. ZIP SHA256 `b3e872f7ad33def4ab17849bc7ee89a8c99dddd2c85893c31499516533044363`. It contains both native and browser result JSON, input/event evidence, synthetic checkpoints and 17 screenshots. Useful screenshots under `stage23-candidate-browser/`: `desktop-aim-adjusted.png`, `portrait-aim-adjusted.png`, `landscape-aim-adjusted.png` and `landscape-arrival.png`.

## Full native combat coverage versus visible samples

The complete native run covers all combat/movement, but it does not establish subjective enjoyment. Segment figures below are cumulative HP loss (not shield loss or net HP), with NPC positions sampled at each round's beginning.

| Rounds | Shots | Defends | NPC HP loss | Hero HP loss | Observed progression |
| --- | ---: | ---: | ---: | ---: | --- |
| 1–7 | 23 | 4 | 44 | 777 | Bundle/escort activation, NPC x2280→2796; B0 received six targeted shots and C0 five. |
| 8–13 | 23 | 1 | 24 | 537 | Middle escort x2989→4245; small progress at R8–11, then forward movement; C4 received five targeted shots. |
| 14–20 | 26 | 2 | 37 | 872 | x4245→5698; E0 received five targeted shots, F0 four. The mid-dock objective completed before R20. |
| 21–26 | 15 | 6 | 19 | 401 | Exit escort x5854→8323 at R26 start, then x9060 at victory; three defends explicitly recorded actual blocking. |

Story rows occurred at R1, R4, R5 and R26. Thus the R6–25 span is not explained by a large volume of dialogue. Repeated combat targets and escort movement contribute to the length, even while actual incoming damage and changing positions show it is not simply empty waiting. The strongest bounded visual observations are the R8–10 upper/lower firing choices and R19–21 continued enemy/NPC pressure above. Neither those two-round samples nor native damage totals prove that the entire 26-round experience is enjoyable.

## Complete actual browser expedition, 30 rounds

[CI41856047214](https://github.com/sys8994/honro/actions/runs/41856047214) passed a full UI battle and settlement, with test commit `12cee128bc1e975a0c132bba5ce005f0227bf85b`. Its parent lineage adds only three verification files to product `b1b1ce63dfa08b111725f3b907088b70f280f17c`; the normal build and HTML SHA256 above are unchanged. The controller imported the unchanged synthetic R1/shot0 save through the normal file/settings UI. Its initial source contained zero actions and no presented chapter receipts. No live battle positions, HP, resources, objectives or RNG were written by the controller.

- Actual R1→R30 victory, 98 accepted shots (83 keyboard, 15 touch), 17 defends, including 10 with the actual escort-blocked predicate true. The party killed 26 enemies and left 14 alive.
- NPC ended at 1218.4/1450HP and x9060.22; all four heroes survived as an observed outcome, not a required test condition. All three physical goals and actual movement proof were satisfied.
- 620 detached-planning live-before/after equality checks passed. JavaScript errors were empty. Victory→rest→reload preserved the same settlement, first clear count1 and party XP31548.
- Thirty round-start HUD measurements passed. The workflow retained 26 screenshots, round states, action records, actual fired angles/power and post-resolution states.
- The first attempt, [CI41854503476](https://github.com/sys8994/honro/actions/runs/41854503476), stopped at R2 because a newly appearing guide overlay intercepted a controller click. The screen showed normal guide text and canInput=false, with no product JavaScript error. The test was fixed to recheck input and reconcile state before any retry. No forced click or overlay deletion was used, and the incomplete first attempt is not a product failure or full-play result.

[Artifact13338737837](https://github.com/sys8994/honro/actions/runs/41856047214/artifacts/13338737837) is 9,171,781 bytes, expires 2026-11-18, and has ZIP SHA256 `4b432e5ddc798c479360637b17e079f313d5194d39264f45c190a74985d02d44`. Key images: `shot-r8.png`, `shot-r13.png`, `shot-r19.png`, `shot-r25.png`, `round-30.png`, `outcome.png`, `rest.png` and `reload.png`.

### Combat, repetition and pressure observed across the complete run

| Rounds | Shots | Defends | Blocked defends | Observation |
| --- | ---: | ---: | ---: | --- |
| 1–5 | 13 | 6 | 2 | The first round used the finite movement budget to approach from x300–600, then all four defended. Rescue/escort and goods dialogue occurred by R3. |
| 6–10 | 19 | 1 | 0 | Repeated low-road/high-position targets while moving down the yard. NPC round-start x2517→3150; HP1361→1254.4. |
| 11–15 | 20 | 0 | 0 | Four shots every round. C3 then E5/E6/other front threats dominated. NPC x3449→4018, with no start-position change across R11–12 and R14–15. |
| 16–20 | 19 | 1 | 1 | Climb toward the bridge, continued front-line pressure. Knight HP was815.1/1673 at R19 start and705.1 at R20. |
| 21–25 | 15 | 5 | 5 | Exit-side blockers and differing firing access. R25 had one knight attack and three defends. |
| 26–30 | 12 | 4 | 2 | Remaining exit defenders, then convoy movement. R29 ended with two defends while NPC moveLeft=0 and blocked=false. R30 won without another shot. |

By active goal, shots were dispatch4, mid-escort63 and exit31; defends4/4/9. B0, C0 and C3 were each selected seven times, E5 six times. These repeated attacks are a stronger pacing signal than dialogue volume. Modal dialogue was observed only at R1, R3 and R30: 15 rows. Production receipts contain all17 presented rows, including two BLOCKED lines, but the nonmodal bark path was not separately captured by this logger. Thus 17 receipts must not be described as 17 visually logged modal lines.

Pressure was real but uneven. Across recorded states the lowest knight HP was604.1/1673 at R22 and archer547/888 at R18. NPC minimum/finalHP was1218.4/1450. Growth and recovery subsequently raised heroHP, so finalHP and before/after deltas are not cumulative damage. The NPC was not close to death in this observed policy. Screens show enemies on high ledges and the lower convoy road, changing firing angles across slopes, and an actual416HP melee hit in the late corridor. They support meaningful geometry/target choices, but do not establish that every repeated attack was enjoyable.

The repetition also contains controller and input effects. Seven selected-target attacks had no targetHP drop afterward, but three damaged another enemy. Only four had no recorded enemy HP/shield decrease at all. Actual aiming differed from its planned angle by up to1.30 degrees and power by up to0.046. These observations do not prove that the misses were caused solely by input error; prediction, movement, collision and target choice must be separated. In particular, the controller never issues S04's optional second in-flight dive input. Source inspection shows its ordinary landing has radius80 and damage×0.75, while the generic shot-value estimate uses the effective skill radius/damage. Two no-damage S04 attempts had predicted miss distances178.35/159.22px. This is a concrete scoring mismatch to test before weakening enemies; it is not yet proof of the entire delay's cause. For example, R7 M01 had predicted risk0 yet no targetHP reduction, and the NPC lost27.6HP during that same player action. The planning aid is not a safety or hit guarantee.

R25 requires exact ordering: archer and mage defended while F2 still had446HP; the knight then dealt416, leaving30; only the occultist defended against the30HP remnant. Those three defends retained570/1129/1868 hero movement respectively. It would be inaccurate to say three heroes failed to finish a30HP enemy. In contrast, R29's two late defends recorded no blocker and an exhausted NPC movement budget. Late delay therefore mixes access/tactical decisions and actual escort budget, not one proven enemyHP cause.

### Limits of the complete browser observation

This is one tool-assisted complete expedition, not a human playtest or an optimum. The controller filters production visibility but can read positions/HP of eligible enemies outside the camera viewport. It uses a detached Engine and the production predictor for shot estimates, normal UI aiming/firing/movement, and automatic dialogue confirmation. A source audit found that the production warrior/archer predictor internally clones a battle, invokes fire/stepProjectile and can consume the clone damage sequence. The earlier verification comment claiming purely geometric planning with no internal fire/tick or future-RNG use was too strong. Live state stayed unchanged, and the controller did not explicitly read random rolls, but strict non-use of future randomness is not certified. The UI completion remains observed; it is not evidence of unaided human tactical fairness. Its wall time includes computation and automation, so neither that time nor the game's active-time display should be labelled human completion time. It differs from the native controller: 30 and26 are separate measurements, not an isolated product comparison.

The entry remains a legal synthetic reward-ledger fixture through22, not a real user's save or natural Chapters1–22 playthrough. Optional earlier-chapter narrative flags not present in this fixture were covered only by separate state tests. This full battle used desktop dimensions with touch landscape segments at R8–9 and R19–20; previous final-checkpoint checks cover portrait/rotation, not a full portrait-only battle. Real-device performance and a full tactical-difficulty natural clear remain unverified.

## Release status and next pacing comparison

Build, save compatibility, fresh expedition completion, scoped HUD checks and the complete browser expedition are passed. The original40 roster remains selected; no additional weakening has been adopted. **Release acceptance is still open:** native26 and browser30 both exceed20 and no exception is approved. Master/Pages remain unchanged.

Next work separates automatic-controller shortcomings from health, placement, movement and aiming bottlenecks before testing small product candidates. The counterexamples stay in force: removing both guards worsened the same forward policy26→30, C5-only took27 and E2-only26; reducing NPC pressure did not ensure better pacing. The complete-browser result is evidence for further diagnosis, not a waiver of the pacing target or blanket subjective-fun approval.

## Isolated ordinary-S04 scoring comparison

[CI41862400698](https://github.com/sys8994/honro/actions/runs/41862400698), test source `ed52d3fe94c34f932166480a3d2dbf3bfc1594fa`, completed both native runs on unchanged product `b1b1ce63`. The exact pre-entry profile, runtime, 40-enemy roster, 17 presented narrative receipts and settlement contracts matched. Baseline controller hash `3c6bca28…` reproduced26 rounds,87 shots,13 defends,5 blocked defends. Corrected ordinary-S04 scoring took32 rounds,100 shots,23 defends and15 blocked defends. NPC cumulative HP-loss events fell124→83 while hero cumulative HP-loss events across all sources rose2587→2802.1. The correction is **not adopted as an improvement**.

The correction excluded49 of86 formerly viable candidates in138 estimates, but actual S04 casts remained11 in both runs. The first changed cast was R7 knight→C3: baseline11.36°/0.778 damaged another enemy C1 by108 and next-round knight position was(3605,5100); corrected7.18°/0.972 damaged C3 by157 but left the knight at(3415,4950). Increasing immediate target damage can lose useful forward landing. This single comparison does not prove that this one cast caused the entire six-round difference.

- Dispatch was unchanged: R1–4,11 shots/4 defends.
- Mid-escort expanded from R4–19,54 shots/3 defends (2 blocked) to R4–22,62 shots/8 defends (8 blocked).
- Exit expanded from R19–26,22 shots/6 defends (3 blocked) to R22–32,27 shots/11 defends (7 blocked).
- Corrected-policy round-start carrier positions repeated at x3449 in R10–12, x4412 in R14–16, x6157 in R24–25, and x7330 in R28–29. R31 used0 shots/4 defends after the carrier movement budget was spent; R32 won.

The observation supports a mixed target/landing/access/escort-budget bottleneck. It does not establish a unique random-roll cause, an enemy-HP-only cause, or that increasing carrier budget will help. Raw evidence is [artifact13341706288](https://github.com/sys8994/honro/actions/runs/41862400698/artifacts/13341706288), with `baseline/`, `ordinary-s04/` and `comparison.json`. This remains native production-frame evidence with DOM/clock doubles, not a new browser run.

Two source clarifications from the full browser run are also retained. `A3.S23.BLOCKED.01/.02` are authored with delivery=`bark`; `story.js` routes them through `HonroStoryBarks` and `story-barks.js` writes the banter text before recording presented. Those source/receipt checks are not direct screenshots of both lines. At R25 the ranged projectile origins were inside the nearby knight's body; a20px forward step appears capable of clearing that particular muzzle overlap. This is a proposed legal tactical adjustment, not proof that all curved shots were impossible or that it will shorten the full run. The native26 run killed F2 inR20 and did not reproduce that late remnant bottleneck, so cutting only F2HP to fit the browser remnant would overfit one observation.

## Predeclared fair-policy and product probes, not acceptance

[CI41867498858](https://github.com/sys8994/honro/actions/runs/41867498858), source `f3c720cf34d24dfff9afb4a66185f534273ff33e`, was submitted after the preceding job's complete steps finished. At this report update it was queued; no new outcome is claimed. There is no local duplicate. The public [Actions/Pages incident](https://www.githubstatus.com/incidents/xr3myzj7ms51) explains a possible service-side delay; stale status responses were observed, so complete steps and artifacts are checked separately from aggregate status.

The independent planner overwrites RNG and damage-sequence fields on its detached clone **before** Engine construction, using predeclared constants0x13579bdf and0x2468ace0/index0. These are independent estimation streams, not mean damage or chosen favorable seeds. An invariant test must first show that three different live-future RNG inputs yield identical normalized inputs, estimates and a declared decision while the originals remain unchanged.

Original production S04 scoring is retained. Original-product policies with and without one obstruction-triggered20px move are compared first. Selection is fixed before any product results: winning run, fewer rounds, fewer shots, fewer defends, then no extra movement on a tie. The selected policy is then applied identically to original and each isolated product probe:

1. Four repeated mid-escort elite targets B0/C0/C3/E5 receive10% lower fresh-entry HP, retaining all units, positions, armor, attacks, XP and roles. They accounted for18 of54 mid-escort selected shots in native26 and26 of63 in browser30. This is a diagnostic hypothesis, not proof of redundant enemies.
2. Carrier per-turn movement allowance900→1000, preserving actual speed260, HP1450, blocking, physical route, dialogue and victory rules.

Fresh story/normal construction and exact pre-candidate/new-save Continue checks precede each native probe. Full tactical play remains unverified. Candidate sources are generated only in an isolated diagnostic workspace after the unchanged original normal build/hash guard, then restored. **Neither candidate is normally built, browser-accepted, selected for release, merged or deployed by this diagnostic.** A selected runtime change would still require the formal Stage31 evidence refresh, normal build and matched actual-browser verification. The20-round target remains open, with no exception approved.

### Independent-policy and small-product probe results

CI41867498858 completed successfully. [Artifact13344315396](https://github.com/sys8994/honro/actions/runs/41867498858/artifacts/13344315396) has ZIP SHA256 `f06fbe442f5c68c4e8a59743607da781785d41cdd8467cecb5b28e1b465cc7b0`, size1,527,767 bytes and expiry2026-11-18. The invariant test, exact fixtures, normal original build/hash and all fresh/save/settlement contracts passed.

| Policy/product | Rounds | Shots | Defends | NPC cumulative HP loss |
| --- | ---: | ---: | ---: | ---: |
| Independent estimate, original scoring, no added move | 26 | 87 | 13 | 124 |
| Same, conditional20px move | 28 | 95 | 12 | 193.7 |
| Selected no-added-move policy, four elite HP−10% | 27 | 93 | 10 | 64 |
| Selected no-added-move policy, carrier budget1000 | 26 | 87 | 13 | 124 |

The predeclared rule selected the no-added-move policy before the product probes. Its actual App inputs, shot angles/power, rounds, all208 damage events, dialogue and total frames matched the previous26-round baseline; only added diagnostic `plannedNet` records differed. Thus separating estimation from actual future randomness did not alter that observed baseline. It is still one fixture and not unaided human play.

The20px policy made five actual19.98–20px movements. Four were still followed by defend; only R23 O04→F5 immediately became a shot. The HP candidate killed C0 atR5 instead ofR6 and E5 atR12 instead ofR13, but C3 diedR9 instead ofR8, mid-escort shots increased54→63, and mid completion movedR19→R21. Immediate local gains did not improve total pacing, and NPC pressure was reduced. Neither change is adopted.

Carrier budget1000 was genuinely present at fresh entry, final state and each round refill. Round-start positions throughR25 and all208 damage events remained identical; only R26 start advanced fromx8323.25 tox8414.10, about90.85px. The additional budget shortened part of the final walking tail but not a round or the middle combat bottleneck. This candidate is also not adopted. Every run remains above20; none supplies release acceptance.

### Next-waypoint early stopping hypothesis

The full-browser action states allow a further distinction. Of10 defends with the actual blocked predicate true,2 had a living enemy inside the exact current-carrier test (vertical distance≤150 and weighted distance≤300). In the other8, that current-carrier test was false, so source logic identifies the next-waypoint test as the cause of the blocked predicate. DuringR24–27 the closest live enemies were about483–495px from the NPC. This does not prove that all those defends were unavoidable or that changing the predicate will save rounds.

A fresh-entry-only diagnostic now tests next-waypoint detection radius300→180 while retaining the current-carrier300 safety radius. Enemy count, HP, attacks, placements, terrain, physical walking proof, mandatory dialogue, final safe/victory conditions and metadata-free old saves are preserved. The same independent/original-scoring/no-added-move policy must be used for baseline and candidate. Explicit fake radius-boundary fixtures check only logic; they are not natural-play evidence. No result, normal candidate build, browser pass or adoption is claimed before that comparison runs.

### Next-waypoint180 result: rejected

[CI41870861247](https://github.com/sys8994/honro/actions/runs/41870861247), source `01995d96d4264464476a333beac0784e6995d5cb`, completed successfully. Original26 rounds/87 shots/13 defends reproduced exactly, including actual actions, rounds,208 damage events, dialogue and frames. The candidate took30 rounds/100 shots/15 defends; blocked defends rose5→9, NPC cumulative HP loss124→173 and hero HP-loss events across all sources2587→2689. All40 enemies/10 elites,17 receipts,XP31548 and old/new save contracts passed. The candidate is not adopted and remains above20.

The carrier advanced earlier fromR6, and the first changed shot was R7 knight S04 C3→C2. Later round-start positions stalled atx4093.8(R13–14),4672.4(R15–16),4815.4(R17–18) and6261.4(R22–23). Mid-escort completedR20 instead ofR19, blocked defends there increased2→6, and exit shots increased22→32. Both runs had only the first and last rounds without a shot. The extra NPC damage came from actual enemy sources including E2/C6/F0. Thus the candidate allowed earlier approach, but subsequent observed exchanges, risk and repetition worsened. This does not establish that one changed shot caused all four extra rounds.

[Artifact13345325960](https://github.com/sys8994/honro/actions/runs/41870861247/artifacts/13345325960),785,156 bytes, expires2026-11-18 and has ZIP SHA256 `b024539a5bef56f9faacdaeba29265248566825f4033ab7141f694bce06e7cb5`. It is native diagnostic evidence, not normal candidate build/browser/release acceptance. The selected product is still original40 plus the scoped HUD change.

One bounded remaining tactical check combines the unchanged-product forward policy with M04 cluster selection, which the26-round baseline never used. Earlier M04 trials used a different policy that continued attacking rear foes, so their33-round result cannot establish the outcome of this combination. The new pair keeps production S04 scoring, independent estimation, no extra20px step and the existing550px rear cutoff. The opt-in cluster policy retains radius260, at least2 production-visible enemies, a15% estimate advantage over M11 and friendly-risk<1. Secondary cluster counting is explicitly production-visibility filtered. This is still tool-assisted tactical diagnosis, not an optimality claim or a change to product damage/HP/roster. Its result must be reported separately from earlier product probes and actual-browser30.

### Forward plus M04 result: real multi-hits, no completion improvement

[CI41873452649](https://github.com/sys8994/honro/actions/runs/41873452649), source `79b870f5ab38365fcdf17aa88e789a8236b34289`, passed on unchanged product. Baseline26/87 shots/13 defends reproduced. M04 combination took27 rounds/88 shots/15 defends, with blocked defends5→8. NPC cumulative HP loss124→98; hero HP-loss events across all sources2587→2421.4. No product parameter changed.

M04 was actually cast five times. Mage-source HP damage between each cast and the next allied cast showed4 distinct enemies hit atR8/R9/R13 and3 atR14/R19, for626/614/776/515/441 HP respectively (2972 total). Multiple damage events to one enemy count as one target. This confirms useful secondary hits, not a guarantee that the estimate chose the best spell. In particular, M11Preview=0 atR19 means the limited proposal search found no valid M11, not an observed15% advantage over an actual M11 cast.

Mid-escort shots fell54→50 but defends rose3→9 (blocked2→8). Exit shots rose22→27; NPC round-startx5853 repeated atR21–23 while all three rounds still fired four shots. Thus the spell worked and distributed damage, but this fixed policy did not complete faster. Both versions stayed above20. [Artifact13345173742](https://github.com/sys8994/honro/actions/runs/41873452649/artifacts/13345173742),757,106 bytes, expires2026-11-18; ZIP SHA256 `7a55c6d04779fd9f0606da8f1c8fe7f59564df7b9d602f550b905981cf38ca0c`. Same profile/product,17 presented receipts and exact settlement/reload passed. Fresh initial battle differed only in time-based session/attempt identifiers.

Broader threat/goal alternatives remain authorized, but no rejection is erased. Before comparing them, an objective-first controller diagnostic tests one remaining policy limitation: the existing controller searches for a shot before using an already-open escort route. The new opt-in version moves along that open route with the same ordinary190px-leading logic and finite budgets before the first shot search. It does not move when the actual blocked predicate is true or the NPC has no movement budget. Baseline and opt-in use the same unchanged product, independent estimate, production S04 score, rear550px cutoff and no added20px/cluster policy. This isolates tactical order from any later threat-rule/product change. No outcome is claimed until it runs.
