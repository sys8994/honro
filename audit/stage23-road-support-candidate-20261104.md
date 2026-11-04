# Stage23 road-support gameplay and release review

Status: Stage23 scoped review and publication completed on2026-11-04. Normal-built native19, actual whole-browser19, terrain/readability review, Pages publication and bounded direct public UI verification passed. See audit/stage23-publication-20261104.md for exact source/deployment/verifier identities and remaining limits.

## Evidence

[Support matrix run41895405691](https://github.com/sys8994/honro/actions/runs/41895405691), source743df884bd8e1ca6ce5c3063a97e194503349c88, completed successfully. The approved synthetic artifact13356446393 is retained14 days, ZIP SHA2562389066822b16dc6d48b84ac2b345a8f4ea1ac13713c2c005d4820b26e2b6d7e. Earlier negative experiments remain in audit/stage23-current-native-review-20261104.md and their original artifacts.

All four cells use the same objective-required targeting, independent estimate streams, escort-first movement, one failed-shot hop and actual60px escort road return. Original and close130 controls are byte-identical reuse from41893444878 with controller and dependency checks. Only support300 and support130 are freshly played in this run.

- Original300 plus waypoint:29 rounds,90 shots,21 defends(15 blocked).
- Close130 only:22 rounds,74 shots,9 defends(5 blocked).
- Actual-support300:29 rounds,84 shots,27 defends(21 blocked).
- Actual-support130:19 rounds,51 shots,20 defends(6 blocked).

This is one synthetic profile/seed and an automated native input controller, not actual browser timing, optimal human play or a fun/release pass. The19-round sample meets20 numerically; no general20-round guarantee or exception approval is implied. Tactical fresh construction was checked, not a complete tactical playthrough.

## Exact product hypothesis

The selected source is byte-for-byte the previously generated escort-road-130 runtime, SHA256 c92112f31e18bb386adbe130b7f485e6bf359cd0f69655152a265520a13c6861. Its fresh-only versioned metadata remains explicit. It stops a carrier for enemies within130px of its actual position, while exempting only stable, verified terrain contacts on separate upper platforms whose bodies do not vertically overlap a carrier stably on the road. Unknown contact, jumping, falling, movement velocities and a foe returning to the road remain conservative blockers. Authored support tags are never treated as current support.

All40 enemies,10 elites, their HP/attack/positions/AI/XP, terrain, NPC1450HP/260speed/900movement, mandatory narrative,420px start safety,500px exit safety, physical walk proof and victory conditions are unchanged. Metadata-free old saves and unknown versions retain the original300px-plus-waypoint behavior. Old whole-battle Continue and fresh candidate Continue are exact; ordinary/story construction and support boundary fixtures pass. Settlement preserves the31548 partyXP budget, one visit, exact reload and no accidental stage24 battle in all cells. This budget is not identical to actual XP paid.

## Pressure and waiting: measured limits

Compared with close130 only, support130 changes middle shots37→18 and first exit actionR15→R11. Its20 defends comprise four R1 approach turns, six actual blocked defends, and ten open-route waits after the NPC's movement budget is exhausted(R8 four, R11 two, R18 four). Extra defends are not all combat stalls, but these full-round waits still need actual-screen pacing review.

Pressure decreases and must not be described as unchanged: accepted enemy casts80→59, enemy-caused hero HP-loss2456→1564, NPC enemy HP-loss213→110. NPC friendly HP-loss124.2→123.6 remains substantial. Candidate total NPC loss233.6 leaves1216.4/1450. Hero total HP-loss1605.4 includes41.4 friendly damage. Four heroes happen to survive, but all-survive was not an imposed requirement; lowest recorded HP archer717, mage601, knight1374.6, occultist904.

Twenty-five enemies remain. Some separated upper threats are effectively bypassed: C3/C4 cast once each with no observed HP damage; E4 casts zero. Remaining F0 does maintain actual threat with seven accepted casts atR11–18 and219 heroHP damage. Thus preserving enemy definitions does not establish equal practical pressure. Whether reduced compulsory cleanup creates a better escort is an actual-browser review question, not settled by19 rounds.

## Required next verification

1. Refresh the Stage31 production evidence through its unchanged formal probes, real UI battle/boarding and normal release guard on this exact candidate source. No stale-evidence shortcut.
2. Build the same candidate normally and repeat exact fresh native/save checks.
3. Play the entire same built product in an actual browser using only normal controls and the independently randomized read-only planner. Review dispatch, middle and exit pressure; repeated shots/waits; meaningful movement/skill choices; NPC friendly fire; all terrain/support transitions; desktop and landscape HUD readability.
4. Report actual browser rounds and evidence separately from native19. No master integration or deployment until parent coordination and actual acceptance.

## Formal Stage31 verification completed

[Run41898261171](https://github.com/sys8994/honro/actions/runs/41898261171) completed successfully on exact source3f13e6daa5ba617e86fbe6731988cc2590dcbe7a. Genuine entry-route, entry-shot, west-enemy-action and boarding-objective evidence all passed. The synthetic full normal-UI Stage31 battle and boarding won at15 rounds, with no browser errors and all four heroes alive as required by the existing Stage31 contract. Runtime digest c21e05e95e34259ca4fc5d9a55cd27a58c7d6538e839f8ef5b0cdbffb9f4054e; unchanged normal build guard passed and preview/final HTML plus active-file lists were identical.

Generated evidence commit5de16627962aba3a30710ae9be01c4e0e272c119 changes only tools/stage31/production-package.json from its source3f13e6da. Artifact13358685397 is10,310,793 bytes, retained14 days, ZIP SHA256 b6c8fc57e09dc5a0977bbf22716c6e247593301654cd42b20a3f961dd106117d. No historical visual reviews were relabeled as newly inspected.

The subsequent same-product Stage23 workflow requires byte-identical generated evidence, the formal HTML hash, all fresh/legacy/narrative/HUD boundaries, exact native trace and dependency/profile/stage hashes, then a new complete browser battle. The browser uses independent estimate streams and ordinary UI for objective-first movement, the bounded jump and60px road return. Its timing and production-visible melee collateral differ from native and are explicitly recorded. Normal screenshots wait for turn banners to expire without hiding them, including desktop, landscape and one portrait inspection. This step completed in run41901497974, as recorded below.

## Settlement amount clarified during browser verification

The native final profiles show actual total party XP increments of31,258(original),31,257(close130),31,282(support300),31,266(support130), against the unchanged31,548 budget. System-forfeited amounts are290/291/266/282 respectively. Thus retaining25 enemies does not create a material total-XP deficit in this sample; unused combat allocation is not all lost. The selected19-round sample awards mage8,884, archer7,807, knight9,228, occultist5,347 according to the existing contribution accounting. Do not describe the31,548 budget as an exact payment to the heroes. No reward code was changed.


## Complete same-product actual browser review

[Run41901497974](https://github.com/sys8994/honro/actions/runs/41901497974) passed on3a9e76e0b3ecd88f7a65df734de241c16bb37a29. Normal release guard/build passed. Built HTML SHA2566b9d629c6c196e1246c8b9fd97235c5c997be993e562874fc77b70db90e384d2 is identical to the formal Stage31 preview. Its package is byte-identical to the generated evidence. Fresh/legacy save, support/radius boundaries, roster, conditional narrative and Stage23-only HUD contracts passed. The native replay is exactly19 rounds with identical actions, damage, casts, events and frames, not an independent sample.

Actual Chromium, ordinary keyboard/mouse/touch controls: fresh Stage23 R1/shot0 to R19 victory, outcome, rest and reload.52 shots(45 keyboard,7 touch),21 defends(15 blocked),17 kills and23 enemies remaining. NPC1138/1450; all four heroes happened to survive, not a required pass condition.17 current narrative receipts were presented and the carrier physically traversed the map: validated walk proof6768.21px, actual path7246.30px, final(9060.89,4170), grounded and within110px of the destination with no foe inside the unchanged500px safety boundary. Full UI settlement and exact profile reload passed, with no premature Stage24 battle. Actual partyXP paid31,098, forfeited450, against the unchanged31,548 budget and one clear visit.

Artifact13359573680 is8,885,130 bytes, retained14 days, ZIP SHA256268d3f9fe15ff505178296a759b43459a59262830388f17e770e0dcdd4e3cb0d. It contains synthetic saves, game-only state/actions,22 screenshots and build/contracts. No actual user save, account information or private credential was used. Pattern inspection found no email/password/token/API-key data in the synthetic JSON.

## Combat, threat and repetition on actual screens

- DispatchR1–2: one shot and four approach/movement-exhausted defends. Dispatch guard still obeyed420px safety. A real B5 movement difference put it outside the guarded zones earlier than native; the exact AI/input cause was not isolated.
- MiddleR2–11:28 shots and9 blocked defends. Terrain/upper-platform separation permitted continuing the escort instead of compulsory distant cleanup. Meaningful choices remain between descending to the road, clearing a ground blocker, finding a firing angle and keeping allies out of the line of fire.
- ExitR11–19:23 shots and8 defends,6 blocked. Bridge/slope traversal, final ground enemies and the exit marker were visible; it was not an empty walk after the middle.
- The15 blocked defends are spread across12 rounds: middleR4–11 and exitR13–15/R18. In every such round other heroes fire2–3 times and the NPC advances. The one zero-progress intervalR12→13 has no defends: all four fire and F4 remains at23HP before the following round clears the blockage. Thus15 defends do not mean15 full dead rounds.
- C0/E0/F4 each receive five selected attacks; G0 four. Some repeated focus fire remains, but not the original mandatory distant-enemy sweep. Required story is17 receipt rows, not the reason for long combat.

Practical threat is reduced, not unchanged. Native same-policy comparison original29→candidate19 is the fair overall pacing comparison; close13022→support13019 isolates the terrain-support exemption. The older actual-browser original30 used a different planner and must not be cited as an isolated11-turn product effect. Removed-enemy and HP/placement experiments that failed to improve pacing remain rejected and documented.

Actual upper-platform enemies still act. C3 at(3950,4950), stable on the central flank, fires duringR3 shot19 and heroHP loss increases44 within that firing window. R5 upper C3/C4 firing windows absorb49/46 shield; R6 C4 absorbs42; R7 C3/C4 windows each coincide with47 heroHP loss. These are observed shot windows, not a complete exact per-enemy damage ledger. New E3/E4/F3 casts are also observed inR17 and F3 inR18 after they descend toward the road; stale lastShots alone was not counted as a new cast. Not every surviving upper enemy contributes meaningful pressure.

HeroHP loss1563.4 consists of1399 enemy and164.4 friendly damage, plus773 shield absorption recorded separately. The mage is499.3/961 before settlement atR19; the final level-up healed totals must not be used to imply no combat pressure. NPC loss312 divides into162 enemy and150 friendly damage across ten observed monotonic losses. Friendly shots hit the carrier for61.2 atR9 and88.8 atR18; the latter harms no enemy. Friendly hero damage is50.7 atR15 and113.7 atR16. Position/charge/aim decisions therefore remain consequential. Planner predicted risk0 is not a guarantee; input quantization and actual rolls differ, and this review did not isolate which caused each friendly hit.

## Terrain and readability inspection

All22 screenshots were visually inspected, not only JSON bounds: initial entry, intro/middle/end dialogue, dispatch/middle/exit goals, clear rounds1/6/8/11/13/16/19, shot/enemy frames, outcome, rest and reload. Road, slopes, bridge and upper crossfire positions are readable, with no observed floating carrier or traversal hard-lock. Round6 clearly shows NPC/upper-guard vertical separation. Round11 shows bridge/upper threats. Round13 shows meaningful crowded firing lines. Round16 is locally dense, with some sprite overlap, but selection marker/HP bars remain usable; no claim of perfectly separated sprites is made.

Desktop1440x900 and landscape844x390 were used during combat; portrait390x844 was inspected through rotation atR8, not a complete portrait battle. Secondary objective labels clear the equipment button by at least8px on desktop/landscape and24.73px in the portrait sample. Labels and minimap remain inside the viewport. Korean dialogue and action/result buttons are readable. Actual interaction, dialogue and result buttons were used; this full run did not reopen the equipment menu. The prior same-HUD contract/menu review is separate evidence.

## Interpretation and remaining limits

Within this specified stage review, the candidate better matches an escort: road-contact threats and firing lanes matter without requiring elimination of every separated upper guard. Threats, all40 enemies/10 elites, start/end safety, escort movement and narrative remain. Real carrier harm, weakened hero health, friendly-fire risk and late attacks demonstrate that it was not made an uncontested stroll. On this evidence the reviewer accepts the terrain, actual gameplay and qualitative pacing for scoped release preparation; this is an engineering/play observation, not a human user study or a universal fun claim.

Only one legal synthetic progression profile/seed was used. Stages1–22 were not played in this test. It lacks an optional Stage21 emblem/rescue proof, so FLAG.01 and safe-gate-return CLEAR.02 are not shown here; conditional narrative contracts cover those branches, and remaining enemies correctly prevent a false safe-return receipt. The fresh entry and old-save compatibility are separate: metadata-free legacy midbattle saves deliberately keep the original escort blockage rule.

The automated planner uses detached clones with independent predeclared random/damage streams, never live future rolls or battle writes.923 read-only planning SHA checks and4808 state observations pass. It still uses production-visible offscreen enemy coordinates, prioritizes high-damage skills, and is not a human aiming test.14 failed-shot hops all land normally(7 then fire,7 defend); five normal drops land. Native and UI timing/visibility differ. Automated active time647.96seconds and wall662.44seconds are not human completion estimates. Full tactical difficulty and complete portrait play remain unverified; tactical construction/static risks were checked.19 rounds meets the20-turn target in both measured native and UI trajectories, not a guaranteed maximum for every strategy.

## Release preparation

Parent coordination authorized scoped master/Pages integration only after this review and exact-source checks. Latest checked master isf85a108a29d27cc5488d69d42034d58ac7699c0d. Candidate is ahead with that exact merge base; net product changes are Stage23 escort runtime, Stage23-only objective label positioning and genuine refreshed Stage31 production evidence. Other changes are Stage23 tests/workflows/reports, preserving rejected comparisons. No pending Stage9/17/24 product work is included. Normal generated artifacts must be rebuilt and matched to the verified HTML before master moves. Successful Pages publication and direct public browser verification are still required and will be recorded separately.


## Publication completed

The verified static release53c74ef7648a313a1f4d2f95f83b7779460d2ea0 was fast-forwarded from latest masterf85a108a after exact scoped diff and retained-publication checks. [Pages41908962255](https://github.com/sys8994/honro/actions/runs/41908962255) succeeded. [Direct public UI41909747399](https://github.com/sys8994/honro/actions/runs/41909747399), verifier03a26db85284caaf6396a4b10a9802e33ae3a848, passed first combat, unchanged earned R19 return/settlement/reload, portrait touch and rotation with no errors. Public HTML/index/manifest matched the generated release; this bounded publication check is separate from the full19-round browser review. All12 public screenshots were inspected. A short-lived item-acquisition toast temporarily covers part of the top HUD on small viewports; the tested permanent objective/equipment-button collision is fixed. No claim of full portrait combat is added. Detailed evidence and the verifier metadata correction are in the publication report.
