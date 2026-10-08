# Forest / cavern topology representative pass

2026-10-08. New-entry authoring only. The first review pair is stage 7 and stage 15; the remaining stages have not been expanded by this change.

- Stage 7 retains the three civilian homes, main climb and ground re-entry root. Three asymmetric one-way branch choices redistribute existing enemies without changing type, elite or density budgets.
- Stage 15 uses two unequal solid granite outcrops joined to the actual ground by opposing support legs. Their undercuts are real traversable spaces, not painted paths. The lower water basin, objective identities, order and requirements remain. Mandatory travel now uses ordinary jumps; the old all-stages walk-only assumption does not describe this chapter.
- No runtime save migration applies this new layout to ongoing battles. Canonical source is `tools/map-forge/forest-cavern-topology.mjs`, called by the two act authoring entrypoints. Stage 15's larger cave envelope remains in `workshop/recipes/act2-caves.js`.
- Optional `design.space.rockCompositions` replaces rear rock compositions only when explicitly supplied, including an empty array. Optional `terrainPlanes` supplies broad color planes for named terrain. They are drawn inside the current live solid's clip. Missing data retains the original renderer.

## Verified representative scope

Production Engine: stage 7's original main climb, four body types; three new branch approaches, four body types; stage 15's complete authored required route, four body types, seven ordinary jumps, no movement skill or actor-position correction during travel. Initial fixture placement is explicit. Three lower-area return routes across four base body types also pass without movement skills or position correction, including re-entry to both crowns. Seven selected actual projectile shots hit their intended targets, including upper, middle and lower stage-15 firing choices. These are isolated movement and shot tests, not normal-combat victory or player input tests.

Native Canvas captures use the common production compiler, Engine and Scene. Overview, normal zoom and portrait views are available through `node tools/environment/capture-act1.mjs <tag> 7 15 --review --topology`. This is not browser DOM, HUD, touch input or performance validation.

Control images for untouched stages 14 and 20 match the previous renderer byte-for-byte at overview, entry, place and portrait sizes (eight PNGs).

Still required before release: all-enemy accessibility checks, ordinary combat completion, browser Game/Workshop/Playtest checks, aggregate regressions and final art approval. Geometry-sensitive historical tests may need an explicit approved-layout comparison rather than treating the new terrain as the old walk-only map.

## ACT1 restrained extension and stage 9 art correction

Chapters 1, 3, 4, 5, 6 and 8 receive one low branch each, attached to an existing tree. They are optional and reachable with the base jump by all four body types. The ferry docks/warehouse, refugee gate, waterfall and broken bridge remain the dominant structures. Six real arrow shots from these additions hit existing enemies; all seven affected/checked chapters' original required routes (including unchanged stage-9 physics) pass across four bodies.

Chapter 2 already has unequal left/right tree branches around the valley and is deliberately unchanged. Chapter 10 keeps the separately reviewed new guardian tree. Chapter 9 does not gain another branch: the old shrine's roof was severely occluded by the east gallery and its supports in the actual Pages review. The same shrine asset is moved to x=3595 and scale=.59, leaving the roof clear without touching collision, receivers, enemies or NPC paths. Full overview and a .59-scale targeted view verify the placement. This fixes an art-review omission in the previous release, not a new gameplay issue.

The stage-15 first western suppression cohort is kept at the sluice approach. The middle shoulder uses an existing later-cohort minecart instead of moving a western prerequisite enemy far beyond the sluice. Enemy type counts, elites and objective cohort membership remain unchanged.

## 2026-10-08 · Stage 15 no-items engine-input completion

The revised cavern was completed at round 74 with four survivors, using the production Engine's finite movement, ordinary jump, aim/fire, defend and Act 2 interaction APIs. There were 323 recorded tactical actions: 124 shots, 194 defends, 3 retreat-defends and 2 interactions. Movement/jump frames are recorded separately. Items were never used (the initial/final inventory is unchanged). No actor position, movement budget, HP, focus, enemy count, damage, reward or geometry was modified during play.

This is **checkpoint-resumed input-bot evidence**, not an uninterrupted fresh run of the final driver, browser testing, human play, or campaign difficulty approval. The initial profile uses the existing bot's `rewardXpAt(plan(15).entryLevel)` setup: the plan is 14.4 but the current progression yields actual level 12 for all four heroes. Training uses the normal auto-training budget; loadouts are archer A01/A02/A05/A09, mage M01/M02/M03/M06, knight S00/S01/S03/S05, occultist O01/O02/O08/O11 (O07/O08 trained through the normal prerequisite API). Difficulty is normal. The bot knows authored route anchors and uses engine trajectory prediction; it does not model first-time navigation or human aiming.

The first exploratory run used the historical bot's focus item and was rejected as normal-play evidence: item UI exists only in the old engine App module, not the current runtime App. The accepted fresh battle used `HONRO_BOT_NO_ITEMS=1` throughout. Production `wait()` still supplies its existing focus regeneration and 12% HP recovery when no combat enemies remain; there is no additional recovery fixture. Final HP: archer 451, mage 525, knight 848, occultist 124.

Progress boundaries: clear-water rounds 1–15; sluice interaction round 15; hold-sluice rounds 15–33; clear-gallery rounds 33–73; groove interaction round 73; exit reached round 74. These intervals include bot overhead. In rounds 33–40, three heroes reused stale approach waypoints after chasing sluice reinforcements and walked below the western support. The fourth hero climbed the crown normally. After returning to the correct approach, the three heroes also climbed using normal input. Around rounds 61–73, failed east-join steering and actual remaining-enemy combat overlap; this is not a pure combat-duration measurement.

At rounds 40 and 73 the complete current battle was exported/imported/continued through the production App with DOM/storage doubles. Assertions preserved every unit's identity, position, velocity, HP, focus, movement/acted/dead state, XP/level, plus terrain, inventory, round, phase, side, active actor and objective progress. No checkpoints were spliced. Only the test navigator changed: invalidate a stale approach, stay on an attained firing support, and retain ordinary reduced horizontal steering through a planned jump and recover a failed join. All four heroes made the east-toe jump; the knight reached the exit. The final report's `seconds` field measures only the final resumed segment, not total play time.

Verified source: stage 15 matches `1fccfa3` (stage JSON SHA-256 `09ebd0daa572eb0200ce812259e49d15215c986f17e597ef8c6509ad3b3df2ed`); the later `50469ee` corrects only small authored-anchor heights, with terrain, units and events confirmed identical. The current final navigator still needs one fresh full run against those final anchors. It remains opt-in; production engine/UI behavior is unchanged.

Reproduce a fresh run: `HONRO_BOT_AUTHORED_ROUTE=1 HONRO_BOT_NO_ITEMS=1 node tests/act2-playthrough.mjs 15`. For an unmodified no-items checkpoint, additionally set `HONRO_BOT_RESUME=1 HONRO_BOT_APP_RESUME=1`; any checkpoint with prior item use is rejected. Local evidence is `_local/reports/cavern-combat/summary.json` and its `no-items-v1`, `no-items-v2`, `no-items-final` archives, including snapshots, action/navigation logs, real exported profiles and SHA-256 inventory. The earlier `items-reference` archive is explicitly excluded.
