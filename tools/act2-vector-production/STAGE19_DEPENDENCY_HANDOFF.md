# Stage19 native art handoff

Status: **independent native parity + visual review PASS**. Not browser/story completion or deployment.

Final Stage18 correction dependency: `06255bf2b6f0f9010ba33bb75e3d5bfc00012cc0`. Four exact `act2-traced:stage18-*` assets reused, no source/vector copies. Domain byteSHA `36bd2a52aacf280fe0d6a648bc6210b8f9a950d5d624021195b29cb24e248b15`. Stage19 manifest validates byteSHA and canonical parsedSHA; Stage19-only element IDs. Apply18 then19 adds zero duplicate assets and leaves18 unchanged. Hook order18→19.

Commands:
- `node tools/act2-vector-production/bind-stage19-shared-assets.mjs`
- `node tests/stage19-shared-traced-art.mjs`
- `flock /tmp/honro-heavy-art.lock node tools/act2-vector-production/preview-stage19-art.mjs`

Independent tests: raw source guard; original13600×9600 map,92 actors; original terrains/world/units/waters/markers/objectives/state; exact effective canonical/contact clips; bell shift parity180/720; domain decorative bounds/reference/viewBox covers canonical polygons and preserves world ratio1. Noncombat farewell remains noncombat.

Reviewed native entry/farewell/bell/mobile, legal left/right min/max, ceiling, bottom and portrait ceiling/bottom. V1 broad pale ribbon absent. Initially found a ceiling source-footprint seam: preserved rejected review. Fix expands only domain decorative bounds to canonical extents[-6000,-24000,25600,57600], unchanged source transform. Exact finalbytes independently rendered: seam absent and farewell interior remains intact. No camera/tolerance relaxation.

Mobile original.94 scale remains unchanged; portrait crops party in native renderer, and browser UI framing remains root check. Fullmap .105 diagnostic is below gameplay zoom minimum, not a gameplay screenshot.

Shared optimization proof belongs to18: immutable RAW533445→364814B,31.6117%; corrected canonical/contact1×2×8/8 PASS. Stage19 claims no separate reduction measurement. Declared palette refinement is nonlossless art direction; originaltrace preserved.

Evidence: `art/act2-near-vector-candidates/stage19-farewell-shared-v1/{independent-parity,native-views,visual-review,rejected-source-boundary-review}.json`. Local PNGs `_local/reports/stage19-art-preview/`. Root owns build integration/browser/fullstory/publication. No shared runtime/build edits.

SOP regression: a canonical underpaint path alone is insufficient if vector render bounds clip it to source footprint. Gate full canonical decorative bounds plus extreme legal camera screenshots. Do not stretch source or shrink actors to hide coverage failures.
