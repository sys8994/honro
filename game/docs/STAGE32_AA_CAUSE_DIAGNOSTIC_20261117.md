# Stage32 original-color compositor diagnostic
Base: d18b9ff926e2ca2a3ec4438226a3d5acfb1ab349.
Place fixture in tests/ of that exact checkout. Run HONRO_ACT4_RELEASE=1 node tests/stage32-aa-browser-fixture.mjs OUTPUT.
No production source edits. Exact renderer SHA-256 is enforced.
Three variants, two views:
- baseline: original BODY provider, V4 foundation retained (not historical full-scene baseline).
- candidate: existing shared material renderer.
- original-colors: original path's opaque color rasterized uniformly in one diagnostic viewport canvas, then sampled through exactly the candidate's clip; protected paths remain direct fills; original gray selected paths remain repainted in their original order.
This is NOT an old complete-BODY bitmap inserted into each clip: that would violate occlusion.
Continuous interiors are equivalent to original path fills. Raster boundaries need not be: clip-AA, repeated gray fills and original group transforms may cause differences. This experiment measures those differences and cannot by itself prove source coverage preservation.
The extra diagnostic canvas adds W*H*4 bytes beyond production cache. No performance/production suitability claim.
Original vector equality asserted; source canonical hash emitted and before/after invariant checked; whole battle JSON checked after each first/later render; terrain+units hash emitted. Fresh in-memory profile, unresolved App-ready promise, storage forbidden, dt=0.
Evaluate three-way RGBA difference in BODY-only lower/green ROIs. sourceCanonicalSha256 and physicsSha256 must match all six results. Old/candidate source curves are unchanged. Do not threshold away sparse residues or infer that every visible protected-color line may be removed.
Candidate vs original-colors changes intended geology color; original-colors vs baseline isolates compositor/gray handling but may also expose pre-existing flattened group-transform differences. If visible non-AA interior changes occur, stop and classify instead of treating as alpha noise.
No local Chrome was executed. Generator syntax only checked. Actual Chrome and generated outputs remain pending.


Historical candidate PNG hashes are checked exactly against artifact14329687058. No visual acceptance asserted.
