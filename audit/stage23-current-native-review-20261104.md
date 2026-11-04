# Stage23 reviewed-v4 natural gameplay and pacing review

Status: bounded native gameplay comparison and original-public-browser checkpoint review. Candidate release acceptance remains open; the20-round pacing target is not met or waived.

## Scope and provenance

- Act3 chapter3, global23, current reviewed-v4 story and map revision423. Master inspected at `f85a108a29d27cc5488d69d42034d58ac7699c0d`.
- Actual production App/Engine actions, projectiles, enemy actions, movement, finite focus and ordinary saves were run. DOM, rendering, storage and clock use test doubles. No live positions, HP, enemies, objectives or RNG were edited. External-write/recovery audits were empty.
- Entry is a legal first-clear/recruit reward-ledger fixture through22, level16, ordinary-stat6, rank1 equipped skills, 원정/story. Chapters1–22 were not naturally played in this run. It is not a real player's save or a full campaign-chain proof.
- Production story must be enabled in the runtime harness. The legacy escort tests alone do not cover the shipping reviewed narrative. Current reviewed23 has zero reinforcement events, despite legacy author metadata listing14.
- Local source is a space-constrained materialization. Runtime/controller/profile hashes identify the compared inputs, but intended source commits are not an exact whole-tree checkout attestation. The earlier baseline CI does attest its full checkout.

## Product candidate under comparison

The initial candidate omits `s23-C-5` and `s23-E-2` from fresh reviewed23 authoring. It is not a final recommendation: a later matched forward-escort policy reverses its pacing advantage, as recorded below. Initial population40→38; all10 elites, exit defenders and distinct flank/crossfire roles remain. The two guards repeat low-road obstruction roles in the long middle escort stretch.

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

## Original public build browser observations

After explicit approval of synthetic game screenshots/state in public Actions artifacts for14 days, [CI41793426811](https://github.com/sys8994/honro/actions/runs/41793426811) at `5d28c6388c0d2502bd7fd9346e07250bd185a1f6` passed Chromium UI checks against the original public Pages build. HTML SHA256 was `48508e7cbf43ad5985092a8fb62840fe9a9dabc7d5c7ac9ff49cf161809ee41a`. The source checkpoint came from the naturally earned originalR33 run, with earlier1–22 still a synthetic reward-ledger fixture.

Real settings/file import, Continue, keyboard/touch aim, walking to the exit, victory, rest and exact reload settlement passed at1440×900,390×844 and844×390, with no JavaScript errors or horizontal document overflow. These are late-checkpoint UI checks, not fullR1 browser play, real-device FPS or human-fun approval. That run tested aiming and movement, not firing.

Screenshot inspection found the landscape secondary “화면 밖” label overlapping the “물건 살피기” button. The candidate moves only Stage23's secondary world tag around this visible button, preserves the main objective and direction arrow, and omits the secondary tag only when no clear slot exists. Other stages/custom stages are unchanged. Focused tests pass the actual landscape geometry, adjacent/custom stages, hidden/zero controls, canvas offsets/DPR, left fallback and no-space arrow behavior.

The same-product candidate browser script additionally checks actual firing, equipment open/close, viewport rotation and painted-label clearance. The test's label boxes are converted from canvas-local to viewport coordinates before comparing DOM controls. This is a test correction, not a runtime change.

## Limits before release acceptance

The product candidate `6abd6389da2b224432b52bdc314fcaa48d345ccb` has not passed its full build/browser workflow. [CI41795471305](https://github.com/sys8994/honro/actions/runs/41795471305) stopped during normal `npm run build`, before native/browser steps, because the Stage31 release guard detected runtime changes after its previous actual Engine probes. No guard was weakened or bypassed. The formal Stage31 refresh procedure is prepared but its separate public-data approval is pending.

No candidate browser success, final Pages acceptance, full tactical natural clear, human fun approval or20-round completion is claimed. Master and Pages remain unchanged by this task. The original public-browser result cannot substitute for the candidate's build and UI acceptance.
