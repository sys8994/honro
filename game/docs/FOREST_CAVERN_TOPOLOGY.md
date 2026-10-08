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
