# Cave whole-frame coherence — candidate, not final approval

Scoped stage34/38 cleanup uses the existing native Inkscape decorative boulder paths, not a new invented asset. Nine grey boulder shades become four restrained blue-dawn role tones; small route-crack source retains five tones to preserve its hollow cue. All cloned assets have empty collision arrays. Stage34 decorative feet formerly supported by the changed floor are re-grounded to the actual new top; no actor/event/route positions move.

The redundant huge polygon backdrop is precisely `a4-coast:ridge`: two L3 environment placements per stage. Only those confirmed collision-free placements and their now-unused rear groups/support surfaces are removed. Authored far coastline/runtime art remains intact.

38 old stone contact clusters are removed only over the new0..2350 floor, retaining protected plateau and separate ledge/east contact. Stage38 v2 additionally extends native source deep material and reflected domain coverage, and consolidates unchanged east/ledge BODY colors. Terrain arrays and actual App complete instantiated terrain are compared against frozen geometry-authority candidates using `tools/density-qa/compare-app-entry-physics.mjs`; this is physical equivalence, not movement/visual approval.

Outputs: `stage34-stage.json` + `stage34-assets.json`; stage38 uses v1 decor assets PLUS `stage38-v2-assets.json` and `stage38-v2-stage.json`. Do not substitute discarded earlier candidates. Immutable full projects are under `_local/reports/cave-decor-coherence-v4/`. Native screenshots pending. Main campaign/world source is untouched.

## Reviewed direction / latest immutable selections
34 coherent v1 (SHA43edff3b1b6fda17a02a93784dba488d5c3d175be269b7fcabc4eea4e6c61cf0): root accepted actual normal frame direction; normal, portrait, fullwidth and thin-tip anchor views reviewed. Native captures: `_local/reports/stage34-production/coherent-v4-after1/`. Known minor: reflected far-left roof continuation shows a thin seam/symmetry at whole-stage zoom outside the normal play view. Root explicitly bounded this as minor rather than requesting another source rewrite. Full gameplay QA remains separate.

38 v2 color consolidation accidentally merged two distinct broad BODY planes; rejected for that visual issue. Latest v3 explicitly maps original three BODY roles to #405568/#304758/#243949, retaining broad interior structure without dense texture. v3 SHA69137730c60777a839c06164748367df4379ac3d77aef54f9338ff9f51bec7dc; actual App full terrain equality passes. Final v3 visual check pending. Use `stage38-v3-assets.json` + `stage38-v3-stage.json`, not v2, after review.
