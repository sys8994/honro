# Stage 33 coastal side-view art revision

Source base: 0582ae39f3e80775fffc82047f22beaafe33216e (includes the current monster composition changes).

Paint-only production adapter: `shared/act4-stage33-coastal-art.mjs`, invoked after existing Act4 side-view art. New source: `shared/data/act4/sideview-art/33-coastal-v2.json`.

Replaces broad bird-view lowland paint with registered coastal side faces, a nonplay rear support arch, exact physical foreground silhouettes, and tapered stair sidewalls. Original provider IDs stay untouched in the library for prior battle snapshots. Current retired providers retain only coverage metadata and an empty visual group; large invisible SVG duplicates are not created. No terrain polygons, walk edges, monsters, mission conditions, or saves are changed.

Validation: `node tests/stage33-coastal-art.mjs` passes input immutability, non-art stage parity, other-stage parity, original provider parity, zero new collision and idempotence. Four native production Scene renders (west/mid/east lowland and upper-middle) were visually inspected. These are not browser screenshots and do not establish actual movement/projectile validation. The browser could not reach localhost across execution environments; traversal QA remains outstanding. This is an art pilot, not a redesign of all stage 33 routes.

Sidewall geometry-culling reduced its JSON from 403191 to 64580 bytes; complete compact source pack is approximately 1.84 MB. Do not pad assets to a byte target.

Release gate: do not label browser traversal verified. Keep this source branch separate from Pages until build and release review pass, preserve latest master and all parallel Act5 changes, and never overwrite generated assets from an older master build.
