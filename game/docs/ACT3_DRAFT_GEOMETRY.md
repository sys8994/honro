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

Second preservation checkpoint: both canonical projects pass the complete map schema and environment validator. The initial city roof path and archive stair path found actual obstruction points; authored stair connectors and upper-gallery clearance were corrected. All four heroes now pass both primary routes with zero damage, using unchanged walking/jumping/collision rules. Tests also fire a real arrow across each open bridge, confirm 143 target damage, and confirm a low city shot strikes the authored market wall. Every draft collision polygon has its exact source polygon in the vector art.

Template-13 fixture measurements: all four h=92/r=22; maxMove=1532/1552/1642/1582 for archer/mage/knight/occultist; jumpCost=75; measured ordinary jump apex=210.8796 world units. City route length is 7380.46 units (5–6 movement-only turns per hero), archive 4409.97 (3–4), including the probe jump costs. Movement budget is replenished during geometry probes, so this is not a turn-accurate campaign completion test. These template-level values are not approved Act 3 balance.

Native capture now includes separate 400×650 and 844×390 normal-zoom scenes, records actual collision and presentation heights, and keeps the panoramas explicitly in inspection zoom. City art repetition/upper structural support and canal context remain under review before user delivery. Native initial images are geometry/art drafts, not visually approved art, browser play, HUD/input testing, campaign balance, or normal combat completion. Water-level changes, narrative events, enemies/objectives and campaign progression are not implemented. West archive upper gallery access remains a draft design item.
