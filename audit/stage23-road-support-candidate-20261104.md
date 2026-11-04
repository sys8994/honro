# Stage23 road-support candidate: preliminary native result

Status: selected for further validation, not accepted for release. No master or Pages change.

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

The subsequent same-product Stage23 workflow requires byte-identical generated evidence, the formal HTML hash, all fresh/legacy/narrative/HUD boundaries, exact native trace and dependency/profile/stage hashes, then a new complete browser battle. The browser uses independent estimate streams and ordinary UI for objective-first movement, the bounded jump and60px road return. Its timing and production-visible melee collateral differ from native and are explicitly recorded. Normal screenshots wait for turn banners to expire without hiding them, including desktop, landscape and one portrait inspection. This step is prepared, not yet completed; Stage23 actual-browser/fun/release acceptance remains open.

## Settlement amount clarified during browser verification

The native final profiles show actual total party XP increments of31,258(original),31,257(close130),31,282(support300),31,266(support130), against the unchanged31,548 budget. System-forfeited amounts are290/291/266/282 respectively. Thus retaining25 enemies does not create a material total-XP deficit in this sample; unused combat allocation is not all lost. The selected19-round sample awards mage8,884, archer7,807, knight9,228, occultist5,347 according to the existing contribution accounting. Do not describe the31,548 budget as an exact payment to the heroes. No reward code was changed.
