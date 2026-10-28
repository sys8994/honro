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

## Inkscape / current BODY candidate

Actual Inkscape 12-color Smooth/Stack/Remove-background trace produced 11 paths. `body-source.svg` preserves trace and source lineage; `body-raw.svg` is untouched trace. Inkscape cleanup removed noise paths1/2 and set path3 to #283344; `body-clean.svg` has 9 paths, no embedded bitmap, opaque uniform lower field, unchanged upper paths. Direct importer produces 13 engine nodes: further lossy simplification is unnecessary. This is a selected cleanup baseline, **not user art approval**. `body-trace-checks.json` records checks.

Rebuild with `python tools/vector-production/import-svg.py art/stage32-vector-production/body-clean.svg --config tools/stage32-production/body-config.json --output art/stage32-vector-production/body-asset.json`, then `node tools/stage32-production/assemble.mjs`. Actual compiled collision and all protected fields are asserted equal.

Native whole, normal, mobile, max and extreme-domain views were inspected. Ground contact is contiguous; extreme-domain image reveals abrupt facet cutoff at x6900 and a deep base rectangle (BODY RGB40/51/68 vs terrain42/51/65 after rendering). These remain explicit visual issues, not approved output. Buildings, door and story props retain original placement/rendering. Common improved wall/reeds are not yet integrated.

Original App input run and candidate replay both won with 35 ordinary shots over17 rounds. Candidate replay included actual stopBattle/persist/Continue at frame12249 and exact state comparison. Door-open/reunion observations came from actual Native Scene; all7 safe IDs and A4.S32.MISSING.01 were required by verifier. Both encounter groups caused actual damage. Evidence lives under `_local/reports/stage32-production/`; replay uses baseline-play/inputs.json. Harness draws only postcombat every60 physics ticks and models DOM visibility/audio; it does **not** establish browser/device performance, complete campaign balance, or art approval. Native renderer memory grows; earlier overfrequent-render attempts were killed and are not counted as passes.
