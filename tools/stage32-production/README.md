# Stage 32 — official geometry / semantic vector production

This is an art-only candidate workspace. Official `shared/data/act4/world.json` is unchanged. Do not run old preview export to regenerate it.

- `skeleton.mjs`: snapshots the official stage and merges its library with the production base; compiles actual solid/one-way/element collision and records a gameplay fingerprint. Generates BODY silhouette from original terrain coordinates.
- `inspect.mjs <tag> [project]`: production Native Canvas renders whole, gameplay, maximum, mobile and edges, plus real collision overlays. No visual approval flag is written.
- `app-adapter.mjs` / `play-inputs.mjs`: actual App/Engine/story/Act4 event code with Native Scene and modeled DOM/audio. Normal move/jump/fire/defend/selection interactions only; prepared earned-SP stage-entry profile is disclosed. This is not browser or human campaign completion evidence.

## Protected contract

Land `a4-32-land`; one-way `a4-32-back-alley`; collision-bearing `a4-32-prop-4` using `a4:old-wall`; dynamic door `a4-32-prop-6` using `a4:door`; NPC `a4-shelter-speaker`; all original units/groups/positions/mission fields. Stage-specific BODY can be clipped to original solid, but must not create collision. Existing native door art/pivot/events remain separate from cached scenery.

## Concept lineage

Built-in image generation used `body-skeleton.png` as strict geometry reference and `art/stage31-vector-production/body-small-concept.png` as style-only reference. Request: Korean dark-fantasy port terrain BODY; exact shallow top contour, thin earth rim, smaller irregular slate facets, flat graphic fills, no buildings/boats/characters/water, transparent above surface, opaque uniform #283344 deep field. Generated v1 saved as `body-concept.png` (2172×724). Direct visual review: silhouette/style useful; lower field still contains subtle gradient despite prompt, so not production-final.

A second built-in cleanup asked to preserve geometry and remove all gradients/noise, make lower45% #283344. `body-concept-v2.png` has a conspicuous noisy middle band and is REJECTED, not used for tracing. Preserve v1 lineage, have actual Inkscape trace and explicit lower-field cleanup before optimizing.

Status: skeleton and baseline; concept selected for Inkscape trial, NOT art-approved. Render and optimization metrics do not approve artwork. Shared runtime, official world and other worker files are out of this worker's write scope.
