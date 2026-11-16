# Stage33 coastal side-view status

## 2026-11-16 continuous natural-rock stairs, published

Production master: `806f555478464cce1ff70e8a4ca0f901c1854e97`, based on `c31ad3ed5f7e8521f9438892cdc1ef069d890ade`. Latest stage44 canopy, stage45 geology and prior published hashed resources were preserved. Source checkpoint `690788b`, build checkpoint `8ad83ce`; Pages run `43855759837` succeeded.

Stairs and their support rock were redesigned as continuous natural geology, removing floating strips, western source seams and the eastern vertical cutoff. Actual native Inkscape tracing/editing separates upper support REAR and lowland BODY. Native source color and alpha share contact registration; original upper vertices and stair contacts are retained. Three existing eastern end-facet contours were toned down to avoid emphasizing non-walkable horizontal extensions. There are no new collision surfaces or per-step decorative rectangles. Color geometry extends beyond internal semantic alpha boundaries to avoid repeated per-color antialiasing seams. Exterior silhouettes and gameplay are unaffected by that guard band.

Production editable source and exact assembly script: `art/stage33-continuous-stairs-20261116/`. Runtime package: `shared/data/act4/sideview-art/33-coastal-v2.json`, SHA256 `1a1ffa644586c30e7a8c186f526c710d5945aac0a2fc22476197176ee15b86b4`. Standalone assembly reproduces that hash. Optimizer candidates come directly from each role's raw SVG, epsilon0.8 world units; 768/1536/3072 render checks accepted. Renderer/import budgets were not increased.

Validation passed: `node tests/stage33-coastal-art.mjs`, `node tests/web-build-retention.mjs`, and `npm run build`. Focused tests cover input immutability, non-art stage parity, other chapters, old-save providers, no added collision and idempotence. Native Scene inspection includes east/west contact overlays and overview. Native before/after comparisons use identical 1440x900 views: west(950,1750,0.53), east(6800,2500,0.53).

Actual public browser verification: new isolated debug session displayed “디버그 · 기록 분리”; DOM loaded `game.7c1546e35aaf84d1.js`. Normal 4막→33장 entry succeeded. Right movement changed movement points1100→871; jump and further movement reached621, followed by visible slope landing and “이동·발사 가능”. Camera panning and zoom verified western/eastern connected artwork; no tab-code9 crash occurred in this pass. Existing tabs were preserved and normal-save reset was not used. Screenshots were captured from the public browser separately from Native comparisons.

Scope limits: this is a terrain-art correction with a short public movement/jump/landing check, not a whole-stage clear, exhaustive traversal of every staircase, or performance benchmark. Prior pilot notes below are historical and do not override this release record.

## Historical pilot record

# Stage 33 coastal side-view art revision

Source base: 0582ae39f3e80775fffc82047f22beaafe33216e (includes the current monster composition changes).

Paint-only production adapter: `shared/act4-stage33-coastal-art.mjs`, invoked after existing Act4 side-view art. New source: `shared/data/act4/sideview-art/33-coastal-v2.json`.

Replaces broad bird-view lowland paint with registered coastal side faces, a nonplay rear support arch, exact physical foreground silhouettes, and tapered stair sidewalls. Original provider IDs stay untouched in the library for prior battle snapshots. Current retired providers retain only coverage metadata and an empty visual group; large invisible SVG duplicates are not created. No terrain polygons, walk edges, monsters, mission conditions, or saves are changed.

Validation: `node tests/stage33-coastal-art.mjs` passes input immutability, non-art stage parity, other-stage parity, original provider parity, zero new collision and idempotence. Four native production Scene renders (west/mid/east lowland and upper-middle) were visually inspected. These are not browser screenshots and do not establish actual movement/projectile validation. The browser could not reach localhost across execution environments; traversal QA remains outstanding. This is an art pilot, not a redesign of all stage 33 routes.

Sidewall geometry-culling reduced its JSON from 403191 to 64580 bytes; complete compact source pack is approximately 1.84 MB. Do not pad assets to a byte target.

Release gate: do not label browser traversal verified. Keep this source branch separate from Pages until build and release review pass, preserve latest master and all parallel Act5 changes, and never overwrite generated assets from an older master build.
