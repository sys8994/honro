# Forest / cavern topology representative pass

2026-10-08. New-entry authoring only. The first review pair is stage 7 and stage 15; the remaining stages have not been expanded by this change.

- Stage 7 retains the three civilian homes, main climb and ground re-entry root. Three asymmetric one-way branch choices redistribute existing enemies without changing type, elite or density budgets.
- Stage 15 uses two unequal solid granite outcrops joined to the actual ground by opposing support legs. Their undercuts are real traversable spaces, not painted paths. The lower water basin, objective identities, order and requirements remain. Mandatory travel now uses ordinary jumps; the old all-stages walk-only assumption does not describe this chapter.
- No runtime save migration applies this new layout to ongoing battles. Canonical source is `tools/map-forge/forest-cavern-topology.mjs`, called by the two act authoring entrypoints. Stage 15's larger cave envelope remains in `workshop/recipes/act2-caves.js`.
- Optional `design.space.rockCompositions` replaces rear rock compositions only when explicitly supplied, including an empty array. Optional `terrainPlanes` supplies broad color planes for named terrain. They are drawn inside the current live solid's clip. Missing data retains the original renderer.

## Verified representative scope

Production Engine: stage 7's original main climb, four body types; three new branch approaches, four body types; stage 15's complete authored required route, four body types, eight ordinary jumps, no movement skill or actor-position correction during travel. Initial fixture placement is explicit. Seven selected actual projectile shots hit their intended targets, including upper, middle and lower stage-15 firing choices. These are isolated movement and shot tests, not normal-combat victory or player input tests.

Native Canvas captures use the common production compiler, Engine and Scene. Overview, normal zoom and portrait views are available through `node tools/environment/capture-act1.mjs <tag> 7 15 --review --topology`. This is not browser DOM, HUD, touch input or performance validation.

Still required before release: fall-return and all-enemy accessibility checks, ordinary combat completion, browser Game/Workshop/Playtest checks, aggregate regressions and final art approval. Geometry-sensitive historical tests may need an explicit approved-layout comparison rather than treating the new terrain as the old walk-only map.
