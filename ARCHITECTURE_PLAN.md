# HONRO runtime integration plan

The imported RC21 game is the behavioral and visual baseline. Workshop V2 currently duplicates terrain derivation, background/terrain/unit drawing, surface queries, and lightweight player physics. Its draft export also rounds and downsamples geometry. Those runtime duplicates will be removed.

1. Establish a measured RC21 baseline and preserve the original import in Git.
2. Extract the engine, scene renderer, assets, content, audio and app behavior into one shared source tree. Both static builds use the same bundle builder; the game shell remains unchanged.
3. Migrate Stage 1–10 to one versioned project schema. Exact polygons, materials, runtime unit definitions, mission events and marker IDs survive serialization. Legacy formats are import adapters, not parallel editable formats.
4. Render the Stage canvas with the actual Scene and a separate overlay canvas. Use the same camera transform and compiler for hit testing and placement.
5. Run the actual game application, including HUD and controls, in an isolated playtest iframe. Give it a cloned authored project and an in-memory profile. Stop discards runtime mutations and restores the editor.
6. Share element geometry rendering/collision and canonical unit factories. Preserve the Workshop tools and transactional human/agent undo history.
7. Extend the existing audio engine with streamed HTMLAudioElement BGM using the exact assets/bgm/README.md mapping.
8. Gate delivery on game regressions, actual browser rendering/physics/asset/round-trip equivalence, editor operations, desktop/mobile smoke and measured dense-map performance. Record exact results and remaining limits.

No redesign of story, balance, skills, VFX, controls or Stage 1–10 geometry is intended. Static raster caches, sceneVersion invalidation and authored detail are preserved.
