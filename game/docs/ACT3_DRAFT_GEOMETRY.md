# Act 3 geometry review drafts

These files are inactive Workshop projects under `workshop/drafts/act3-dense-city/`. They are not imported by `shared/build.mjs`, campaign.json, journey, or the stage catalog. Nothing registers campaign stages 21–30. Canon remains a large riverside walled town; the large official compound is not asserted to be a capital or royal palace.

The ordinary Workshop custom-map path requires metadata.stageId to reference an implemented content template. The projects use template **13**, `metadata.campaign=false`, and distinct `draft-act3-*` authored IDs. Template 13 supplies existing mechanics and avoids the stage 1–10 fixed outdoor panorama; it is not an assertion that either review draft is campaign stage 13. No production runtime or schema changes are made.

Run `node tools/map-forge/act3-dense-drafts.mjs`, then `node tests/act3-dense-drafts.mjs canal-city` and `node tests/act3-dense-drafts.mjs great-archive`. Native images use `node --expose-gc --max-old-space-size=850 tools/environment/capture-act3-drafts.mjs <name>` under the shared verification lock. Generated evidence is in `_local/reports/act3-dense-drafts/`.

## Geometry

- City: 7,800×3,400 Play Bounds, 12 foreground buildings, two supported city background rows, three water channels, fixed roof and waterside bridges, timber roofs, masonry stair routes and upper galleries.
- Archive: 5,600×3,200 Play Bounds; one cutaway building, floor elevations 2,780 / 2,360 / 1,940, two principal stair flights, central atrium, shelves and rear windows. The front wall is omitted intentionally; rear wall and shelves are decorative back-plane elements.
- v6 terrain-domain authoring derives collision and extended geography from the one canonical foundation polygon. No exterior dummy ground is used.
- Draft architectural assets share authored polygons between visible structural planes and collision. The rear wall/shelves are explicitly decorative and do not claim collision.

## Verification status

Initial preservation checkpoint: both canonical projects pass the complete map schema and environment validator. Full-route movement checks are still being repaired; the initial city roof path and archive stair path found actual obstruction points. Native initial images are geometry/art drafts, not visually approved art, browser play, HUD/input testing, campaign balance, or normal combat completion. Water-level changes, narrative events, enemies/objectives and campaign progression are not implemented. West archive upper gallery access remains a draft design item.
