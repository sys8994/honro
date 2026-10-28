# Stage35 · 대숲의 옛길 — production candidate

## Result and boundaries

- Asymmetric official clearings/ditch; original central x2820–3900 geometry, unit IDs, encounters, event IDs, and physical bamboo/wall collision preserved.
- Continuous stage-specific BODY: skeleton → generated material concept → native Inkscape 12-color trace → deliberate deep-noise layer removal → independently measured selective optimization.
- Common reusable assets: thin bamboo, dense physical bamboo cover, broken stone wall. Mist and FORE are palette variants, not a flattened background.
- Separate narrow REAR bank, tapering to zero at stair corners. SURFACE uses the shared renderer's exact contact ink/light (no redundant band). True FORE uses the shared post-actor compositor.
- Existing terrain-domain geometry receives reflected/sheared source continuation. No new collision. Source matte rims are removed by interior cropping and a matched flat deep substrate.

## Parent integration

`art/stage35-vector-production/stage35-production-package.json` contains one stage and only new library assets. Merge stage by ID and assets by ID; retain old assets for old saves. Parent owns official world merge, shared runtime, browser/mobile-device review, remote push, master and Pages release.

## Reproduce

From repository root, with the existing Node/native Canvas and Inkscape tooling:

```sh
node tools/stage35-production/skeleton.mjs
node tools/stage35-production/assemble-continuous.mjs
node tools/stage35-production/verify.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/final-collision-validation.json
node tools/stage35-production/verify-event-fixture.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/final-event-fixture-validation.json
node tools/stage35-production/verify-app-observations.mjs art/stage35-vector-production/continuous-project.json art/stage35-vector-production/ordinary-inputs.json _local/reports/stage35-direct/final-package-app.json
node tools/stage35-production/inspect.mjs release-with-fore art/stage35-vector-production/continuous-project.json
node tools/stage35-production/inspect.mjs release-without-fore art/stage35-vector-production/continuous-no-fore-project.json
```

Source recipes: `ground-continuous-recipe.json`, `bamboo-cover-recipe.json`, `old-wall-recipe.json`. Final source SVGs contain paths, not embedded images. Native Inkscape source documents retain reference images intentionally; do not ship them as runtime art.

## Evidence interpretation

- `ordinary-inputs.json`: actual App/Engine input tape, prepared legal Stage35 entry level, balanced earned-SP training (51 earned/15 spent per class), no teleports, resource replenishment or forced enemy damage. All six foes defeated; all four living heroes exit; round11/31 shots/30,425 frames.
- Independent replay calls actual `stopBattle`, persistence and `Continue` at frame12,584, checking exact units/event state/round/active/phase, then finishes normally.
- `final-collision-validation.json`: isolated real Engine routes explicitly replenish movement; these are geometry tests, **not** the normal completion evidence.
- `final-event-fixture-validation.json`: explicitly controlled positions/focus/actions trigger actual blocked shot, actual side hit and `A4.S35.MID.01`, then verify once-only persistence. This is a condition fixture, not proof the normal tape presents that optional bark.
- App harness doubles DOM/audio/frame scheduling, not combat/events. Native screenshots use the production shared renderer; they are not browser or physical-device FPS claims.
- `vector-fidelity.json`: final BODY14nodes, all six strips at normal/max scale pass; upper three planes unchanged. Wall's initial1× pixel silhouette diagnostic is retained; an8× measurement resolves sampling quantization with zero measured displacement, not a relaxed threshold.
- Parent reviews actual whole, normal, max, mobile, domain, matched FORE-off/on, and completed-App-state screenshots before release. Metrics and tests never automatically approve art.

## Rejected work retained as diagnosis

Separate west/center/east BODY pieces produced mismatched giant facets and rectangular joins. `west-assembly/35-whole.png` documents why they were replaced. Do not import the old diagnostic assembly or old three-piece assets.
