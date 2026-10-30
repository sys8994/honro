# Stage36 · 쇠가 없는 마을 — production candidate

## Preserved gameplay

The official shallow basin, two entrance enemies, empty central encounter area, all unit/encounter/instance IDs and compiled collisions are unchanged. The original `a4-36-door-4` instance keeps its exact position/scale and the `a4:door` asset ID required by the existing falling-animation and rendered-receipt hooks. No new collection task, enemy wave, door collider or narrative text was added.

Roofless frames and low noncolliding foundations are visually aligned to the existing slope. This changes only decorative placement/rotation; `contract-validation.json` checks exact compiled physics and the door contract. No fake collision support is introduced.

## Separate source art

- BODY: compacted ash-earth basin, small embedded stones; exact authored terrain clip and shared mirrored/sheared domain continuation, with internal symbol reuse.
- REAR: narrow soil bank; isolated ruined home; open timber frame; low empty-hearth foundation. The home does not contain a painted door leaf.
- INTERACT: independently traced ironless wooden door, retaining original runtime identity and pivot.
- SURFACE: shared exact-contact ink/light. No additional FORE clutter was added across the deliberately quiet central courtyard.

Each component has a source skeleton, generated concept, actual native Inkscape source/raw SVG and raw PNG. Runtime final assets contain paths, not embedded bitmaps. Ground imports raw geometry unchanged. Home, frame and door use independently applied native simplification with critical raw paths restored; foundation only quantizes one oversized path's absolute Bézier controls by .01 source units. `vector-fidelity.json` retains failed low-resolution/palette-island diagnostics alongside higher-resolution semantic contact measurements; it never relabels them as general all-feature passes.

## Reproduce

```sh
node tools/stage36-production/skeleton.mjs
node tools/stage36-production/assemble.mjs
node tools/stage36-production/verify-contracts.mjs
node tools/stage36-production/inspect.mjs final-review art/stage36-vector-production/candidate-project.json
node tools/stage36-production/verify-app-observations.mjs art/stage36-vector-production/candidate-project.json art/stage36-vector-production/ordinary-inputs.json _local/reports/stage36-direct/final-app.json
```

Skeleton regeneration uses the committed official geometry by default; `--reauthor` is an explicit new geometry-authoring action. Assembly upserts only the separate production assets. Parent merges `stage36-production-package.json` by stage/asset ID and owns browser validation, remote preservation, official release and Pages verification. Retain historical assets for existing saves.

## Actual play evidence

The ordinary tape uses legal prepared Stage36 entry progression and earned-SP training, with real movement, targeting, shots, dialogue-next, camera and interaction inputs. It does not teleport actors, refill resources, force damage or write event receipts. Both enemies are defeated, all four heroes survive and exit: 18,052 simulation frames, 16 shots, round14. This adaptive test policy is not a human difficulty/fun evaluation.

Independent replay executes actual `stopBattle` / persistence / `Continue` at frame12,011 and checks units, event state, round, active unit, phase **and resolved static/dynamic art**. The two required door receipts and leave event are asserted. Native Canvas really draws the falling/fallen door; the DOM double reads actual Story-produced markup for presentation receipts. The native far painting is allowed to decode before the tape, and renderer-effect time advances by elapsed simulation time at sampled draws. No receipt or terminal state is injected.

Door-state and completed portrait-viewport images are captured directly from that replayed App. Static whole/normal/max/portrait/domain screenshots use the same production renderer. DOM/audio/frame scheduling remain harness doubles; these are not browser screenshots or physical-device FPS measurements. Final public browser/Pages review remains the parent's responsibility.

## Fallen-door art correction

Only this authored door opts into `params.act4DoorForeshortening={version:1,fallenScaleY:.25}`. The shared Stage36 door draw wrapper compresses world Y **after** the existing rotation, around the unchanged original `(x,y)` ground pivot. Standing artwork, instance/collision, fall timing, sound and render/dialogue receipts are unchanged. `test-door-foreshortening.mjs` proves default/invalid/non36/standing pixel parity and pivot/state preservation. The same ordinary tape reproduces exactly identical final units/events and18,052frames, with actual Continue and updated falling/fallen captures.

## Shared-door identity isolation

The package exports the new leaf as `s36v:door` and opts in via `stage.design.vectorDoorAssetId`. The original instance still references unchanged `a4:door`; event discovery, collision and save identity remain native. Only the Stage36 door painter selects the separate vector asset, including its foreshortening parameters. Stage32 and non-opted-in stages keep the original shared door artwork. Native pixel parity covers Stage32 with both assets present and the selected Stage36 paint against the previously approved result; Continue checks the resolved paint asset as well as the underlying dynamic instance.
