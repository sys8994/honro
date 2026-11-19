# Stage 42 stock Scene A/B proof harness

Scope: prepare only. No repository source change, remote mutation, login, user save access, App launch, gameplay, or public verification. Node syntax checks passed. Actual Chrome capture has NOT been executed by this preparation task. Uses the proven `terrain-remaining-chrome/fixture.mjs` stock runtime/Scene initialization pattern, narrowed to stage42.

## Inputs
- Authorized checkout of `sys8994/honro` at `1e043b09d4ce107e1d2dcf70fe2274dff7098476`, with normal `npm ci` and `npm ci --prefix game` dependencies.
- `terrain-optimization/stage42/baseline-package.json`
- Chosen `candidate-e5.0.json` or e8/e12/e18/e24 package. No candidate chosen by this harness.

## File plan
1. `fixture.mjs`: `runtimeEntries({vector:true,render:true,app:true,productionStory:true})` exactly once. Produces two independent HTML fixtures with identical stock runtime (only main.js boot excluded; unresolved AppReady, no App instance). Checks supplied baseline vector equals active near42 edgeWall/edgeSurface before replacing only those vector fields. Preserves all metadata and stage data. Compiles and creates actual stock battle/Engine/Scene. Never calls engine update, movement, fire, turn, or App.
2. `extract-compare.mjs`: extracts completed PNGs and checks identical runtime, world, physics, viewport, constrained camera, seed/time, fonts and target draw evidence. Writes `comparison.json`; numerical pass does not mean visual acceptance.
3. `run-ci.sh`: optional CI-only runner. Do not use as a substitute for permitted CUA on the local computer. Requires official authorized CI checkout and installed stock Chrome.

## Views and timing
18 views per variant: desktop1331x763 and portrait390x844, each whole + left/right/top/bottom + four corners. The whole view uses stock minimum zoom; close edge views use min*2.8 capped by stock maximum. Positions are passed through stock HonroBounds.constrain; requested and resulting cameras are both saved. Thus a clamp cannot silently masquerade as a requested extreme. All captures fix Date, random seed, scene time, aim and weather inputs through identical initial state, await images/fonts, and forbid all browser storage/network access.

Per view: 3 warm renders and 1 capture render, 16 stationary and 16 small-pan measured renders, individual samples plus p50/p95/max. This is synchronous stock Scene CPU cost, NOT full-device FPS or GPU/compositor frame time. Data proves only initial synthetic battle; no normal movement/landing/save/load acceptance.

Both active target IDs must be actually drawn at least once; per-view counts expose whether a given edge excludes them. Source metadata/non-vector changes abort. PNGs must be reviewed at matching views, especially surface/props holes, native alpha edge, left/right seam and enlarged mobile contacts. Do not accept a candidate merely for file/node reduction.

## Commands
From any directory, with absolute paths recommended:
```
node fixture.mjs "$CHECKOUT" "$OUT/fixtures" "$BASELINE_PACKAGE" "$CANDIDATE_PACKAGE" e12
bash run-ci.sh "$OUT/fixtures" "$OUT/evidence" e12
```

No full checkout currently exists in this preparation executor. Old local paths for stage37-L-default-validation do not exist here. The available proven terrain-remaining-chrome fixture and official source fetch confirmed stock stage42 runtime directly calls HonroVectorArt.draw on edgeWall and edgeSurface.

First CI44618310325 generated the exact hybrid successfully but failed before drawing because app:false omits Act5. Corrected to official app:true release authoring, excluding ONLY main.js boot and leaving AppReady unresolved. No HONRO release environment override.
