# Stage 32 — official geometry / semantic vector production

## Current handoff

`art/stage32-vector-production/package/` is the checked candidate: scoped `s32v:old-wall`,13-node imported BODY, exact-knot external continuation, exact internal-symbol dedup, original act4Sea backdrop persisted. Collision coordinates, instance IDs, transforms, events and mission bindings are unchanged; only Stage32 wall asset reference changes. No global old-wall replacement. FORE trial was omitted. All earlier trial notes below are historical.

Final ordinary-input replay passed:35shots,30547frames, actual Continue at12249 with exact state equality,7 wall impacts and grounded wall standing. `package/app-check.json` is fingerprinted to the final candidate. Sparse Native rendering stops after safeSeven Scene receipts; model DOM/audio and prepared entry build remain disclosed limitations. Whole/normal/mobile/maximum/domain images were directly inspected; pixelSnapClip and full-depth flat backing resolved the recorded seams. Plain-versus-symbol12-image parity is exactly0changed pixels. Art remains a reviewable candidate, not user-approved or browser-deployed by this worker.


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

## Domain / grounded FORE revision

`assemble.mjs` continues the selected BODY into the existing −6000..12600 terrain domain with the shared reflected piecewise-affine helper. Breakpoints include both official top knots and reflected source knots: coarse breakpoints were rejected because their interpolation exposed dark wedges at the contact. Each side has321 expanded nodes (under512); interior16. `vectorGround.visualDepth='gameplay'` matches the collision-linked BODY's raw color, rather than L1 decorative saturation. Source art is not recolored to hide composition errors. Rectangular-clip line artifacts depend on the shared renderer correction; final render must be repeated after that lands.

Two common reed clumps (`art/vector-common-production/fore-reeds-asset.json`) stand on an independent traced foreground earth bank (`art/stage31-vector-production/fore-ridge-asset.json`). Whole/normal/mobile pixels show their roots covered by the near bank and all actors, land contacts and story door unobscured. This is a noncolliding FORE plane, not grass pasted on the main cliff. BODY contains its generated thin surface cap; original wood one-way and native story buildings provide their existing surfaces/REAR scene. We do not force a new REAR layer where it serves no composition need.

Common35 broken-wall was trialed and REJECTED for Stage32: its top was20–35screen pixels below the protected solid collider in the first-contact view. Native `a4:old-wall` stays unchanged. Thus all original element and asset collision IDs, door pivot/position and event bindings remain exact. No redesigned wall collision or hand-drawn replacement art was used.

Replay the checked ordinary input tape with:

```
node --expose-gc --max-old-space-size=768 tools/stage32-production/verify-app-observations.mjs art/stage32-vector-production/candidate-project.json tools/stage32-production/smoke-inputs.json _local/reports/stage32-production/final-app.json
```

`app-smoke-check.json` is explicitly fingerprinted evidence for the earlier BODY-only revision, not a blanket pass for subsequent art. The full report/trace stays local; final revision gets its own checked fingerprint.

## Latest review corrections (supersedes earlier trial decisions)

- Common wall was repaired upstream with the **exact original solid silhouette** as backing/clip and traced texture fitted inside. The revised reuse now conforms to Stage32's visible collision outline; original asset/instance IDs and collider are still untouched. Ordinary App tape has7 projectile impacts on `a4-32-prop-4:collision:0`; at frame6810 knight is naturally grounded at(2187.38,1750.46). Verifier captures that actual engine state with a diagnostic camera centered on the wall, then restores the camera (no actor/resource injection).
- Sparse FORE looked grounded at normal/mobile size but extreme-domain inspection exposed the reused ridge's hard source rectangle at x8200/deep bottom. It is **omitted** from the final candidate rather than hidden by a normal-camera-only screenshot. Its trial remains documented, not counted as a successful full-domain composition.
- `package/stage.json` and `package/library.json` are generated portable outputs for the parent publisher. Stage32 remains candidate-not-art-approved until rectangular-clip seams are resolved and inspected. No automatic quality pass is derived from App/collision tests.

## Port architecture paint pass

The four occupied port structures reuse one maintained coastal-building definition from Stage40's actual Inkscape trace; house/shed footprint widths use uniform instance scaling. The ruined rubble placement reuses Stage36's separately traced low foundation, not its ruined house. Four skiffs share the traced common hull. No new improvised vector architecture is introduced.

Buildings and hulls are seated at the lowest ground elevation under their horizontal footprints, allowing uphill terrain to hide the base instead of leaving downhill feet floating. The former oversized skiff on the upper alley is stored smaller on the empty lower quay at `(4200,2010)`, scale `.45`. These are noncolliding decorative placement changes only. Original terrain, compiled collision, actors, encounters, objective state and interactive shared `a4:door` remain exact. Original instance IDs persist.

This pass runs assembly's exact gameplay/collision comparison and same-camera whole/normal/maximum/portrait visual inspection. The earlier full App replay remains historical evidence for the unchanged gameplay layout; it is not rehashed or presented as a replay of the new artwork. Browser validation remains separate. Primitive interactive door, drying racks and upper-route physical ramp art remain unchanged.
