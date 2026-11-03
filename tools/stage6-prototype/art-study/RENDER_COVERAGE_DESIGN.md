# Stage 6 render-only coverage candidate

Status: design and test branch only; not integrated or release-approved.

## Existing render order and hooks

`shared/runtime/renderer.js` paints canonical `back`, then `structural-back` landmarks, then terrain through `HonroScene.terrain`, then surface zones and `mid`, `prop`, `front` landmarks, followed by terrain readability. Units are painted later. The terrain-domain tile cache follows the same order. Stage 6 preview support art is currently `prop`, so it appears over the terrain; terrain remains present for simulation.

`shared/runtime/act4-pilot-art.js` wraps `HonroScene.terrain` and checks `covered()`, but its `config()` explicitly requires stage 31–40 and validated native BODY metadata. It is loaded after the normal runtime on Act 4 builds. `shared/runtime/terrain-readability.js` also performs collision-derived outlines and calls several stage-specific omit hooks; coverage of the filled blue face must not accidentally erase traversal edges. A Stage 6 hook must compose with existing wrappers, never replace the underlying method or relax Act 4 checks, and must have its own cache invalidation. Debug collision outlines stay independent.

## Proposed safety contract

Coverage is opt-in only in a fresh Stage 6 preview carrying explicit expected source terrain and asset digests. Both `pier-west` and `pier-east` are considered separately; suppress only original terrain paint, not any simulation object, ID, collision, projectile, movement, surface, or event. Before hiding, compare the exact live terrain geometry and all relevant source skin vector/registration data against immutable expected fingerprints; require the intended live landmark, exact expected asset, full opacity, visible layer and working vector renderer. A missing, stale, invalid, mutated, nonmatching, broken, or unloaded source falls back to the original terrain paint. Existing saves without the explicit verified configuration and all other stages also fall back. Hash/verification must remain correct if objects mutate, not merely trust labels or asset IDs.

This remains a proposal. Determine actual runtime serialization first, then test valid/invalid/missing/old-save/other-stage, renderer wrapper composition, zoom/camera, rendering cost and input/projectile/collision equivalence. Do not promote a result without fresh actual screenshots and separate review.
