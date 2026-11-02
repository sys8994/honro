# Stage17 near-terrain review

## Scope
Static cave-rock material only. Original source11200×8200, heroheight92. Wooden paths, hoist/cage/ropes/gear, mutable gate-repair, enemies/workers, story/events, farbackground and collision unchanged. This candidate does not claim whole-stage fun, browser or clear acceptance.

## Visual findings
- Reviewed native west, overview and mobileentry at original actorscale. Rockfaces are large irregular flatplanes rather than rejected horizontalstriped shelves. Physical walkedge remains readable and separate fromfaces.
- Continuous darkbody extends beyond cameraedges; no isolated floating whole-stage card. Local colored facets stop naturally instead of rectangular seams.
- Existing upperrock islands and allwood supports are original authoredgeometry, not invented platforms. Their story/physical logic remains a later gameplay review concern, not silently changed by this materialpass.
- Originalfarbackground remains raster. Mobileentry intentionallyhasquieterrock than centralquarry; hero not shrunk tofit.

## Failures retained and prevention
1. Localv1 source rejected beforetrace: oversized pale contactcap and artificialstripes. v2 prompt pins exactguide and requests few uneven geologicalfaces.
2. Initial local12px protection passed local1×/2× tests but failed fullworldview protected paletteedge. Fullworld12sourcepx corresponds to a muchlarger worldband. Preserve72localsourcepx aroundsame canonicalcontacts; do not change QA mask/threshold. Wholecomposition tested forallthree projectionbounds.
3. Assetpath token minification requires parse_path geometric equality. Never confuse SVG filesize with topologyquality.

Finalresults are in art/act2-near-vector-candidates/stage17-quarry-v1/final-pack-report.json; sourceguard test tests/act2-stage17-candidate.mjs. Native evidence stored in review/ onpackaging. Browser and gameplay evidence must be added byintegration owner.
