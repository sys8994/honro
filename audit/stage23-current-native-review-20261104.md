# Stage23 reviewed-v4 natural gameplay and pacing review

Status: bounded native gameplay review, not browser acceptance or deployment approval.

## Scope and provenance

- Act3 chapter3, global23, current reviewed-v4 story and map revision423. Master inspected at `f85a108a29d27cc5488d69d42034d58ac7699c0d`.
- Actual production App/Engine actions, projectiles, enemy actions, movement, finite focus and ordinary saves were run. DOM, rendering, storage and clock use test doubles. No live positions, HP, enemies, objectives or RNG were edited. External-write/recovery audits were empty.
- Entry is a legal first-clear/recruit reward-ledger fixture through22, level16, ordinary-stat6, rank1 equipped skills, 원정/story. Chapters1–22 were not naturally played in this run. It is not a real player's save or a full campaign-chain proof.
- Production story must be enabled in the runtime harness. The legacy escort tests alone do not cover the shipping reviewed narrative. Current reviewed23 has zero reinforcement events, despite legacy author metadata listing14.
- Local source is a space-constrained materialization. Runtime/controller/profile hashes identify the compared inputs, but intended source commits are not an exact whole-tree checkout attestation. The earlier baseline CI does attest its full checkout.

## Product change recommended

Remove only `s23-C-5` and `s23-E-2` from fresh reviewed23 authoring. Initial population40→38; all10 elites, exit defenders and distinct flank/crossfire roles remain. The two guards repeat low-road obstruction roles in the long middle escort stretch.

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

The candidate makes6 closer approaches;5 find a shot and1 still defends. The original makes14 approaches;3 find shots. The fixed stand-off was a real limited input-policy issue, but correcting it does not turn this into a sub20-round chapter. The two-guard benefit persists under both tested policies (33→29 and33→28). This supports the small redundant-guard adjustment, not an optimal-strategy or human-fun claim.

The final paired raw-result SHA256 values are `2f62fee34ab5db56e8628324d5aa96f772b9a1ae52cd95e13384f232a6af940b` (original) and `d71314b242d216ea8608b8864b7e4188d9890780052fea7eb9a8ed0e6bef8d31` (two-guard candidate). Raw native profiles/results are retained separately and are not embedded in this public code/report change.

## Save, rewards and focused regressions

- Fresh38 and original whole-battle40 Continue contracts pass. Terrain/routes, retained actor properties, population caps54, active limit4 and all10 elites remain unchanged.
- 전술/normal fresh construction checks retain correct difficulty HP scaling, base HP/attack, positions and geometry. A natural tactical full clear was not run.
- Existing reviewed23 tests pass physical rescue, optional questioner deaths, banner/prior proof conditions, journal and dialogue/save behavior. Those tests use explicit setup fixtures and are not additional natural clears.
- The actual two-guardR29 checkpoint was continued through ordinary combat/escort, won atR29, then went through resultContinue→rest→export→reload. No24battle launched, visit count stayed1 and rewards did not duplicate.
- Party XP budget31548 and combat pool12620 are unchanged. Individual hero gains differ with natural contribution;7887 is not a valid per-hero cap. Spent plus forfeited remains the party total.

## Limits before release acceptance

No candidate browser run, public Pages acceptance, mobile/HUD/pointer acceptance or human fun approval is claimed. A whole repository build/aggregate suite was not run from this partial local source. The candidate needs final integration/build checks and a separate authorized browser review. The browser evidence/publication step remains separate from native code/test work.
