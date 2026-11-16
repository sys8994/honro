# Stage45 integration verification

Base master:733a614c66dd2ef47d86967afa21cc66f17151ed (Guilim upper canopy). Only stage45 art/tools/tests plus generated build are changed. Shared act5-world and edge-art conflicts were resolved to retain both44 canopy and45 changes. Every other Act5 library asset and all stage/content structures deep-equal the base. Source terrain/story/save contracts are untouched.

Native final views: overview, west0.45, centre0.7, east portrait390×844/0.7 and portrait minimum zoom0.05735/bottom focus. Clear original walk surface and quest props remain above the connected rock BODY. Upper tree is visually behind the playable plane. Side/deep margins extend off-screen;6 viewport coverage tests pass. No browser input is claimed by these images. Native gameplay SHA equals original48bb34e944621fec6310bfc115e90cb8603a1f7a8b83976811e7e3636410b7ba.

Passed: stage45-continuity, act5-depth-composite, act5-edge-art, act5-terrain-contact; production build with official Act4/5 release flags. Existing immutable files removed by build were restored and the complete previous active manifest hashes verified. Latest44 canopy asset remains unchanged.

Remaining: original/generative texture differences and fine alpha edge on the final stone underside. These were visually reviewed; further cosmetic changes were intentionally stopped to preserve contact. Actual Pages hash/input verification follows publication. Local browser play has not been established in this execution environment; Native results are not substituted for it. Performance FPS/p95 has not been measured.
