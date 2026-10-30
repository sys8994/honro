# Stage 36 density pilot

Isolated from the old production package; no approval flag or campaign edits.

```
node tools/stage36-density-v2/assemble.mjs
node tools/stage36-density-v2/capture.mjs _local/reports/stage36-density-v2/baseline-project.json _local/reports/stage36-density-v2/baseline-app-views
node tools/stage36-density-v2/assemble.mjs --home art/stage36-density-v2/home-asset.json
node tools/stage36-density-v2/capture.mjs _local/reports/stage36-density-v2/candidate-project.json _local/reports/stage36-density-v2/candidate-app-views
python tools/stage36-density-v2/screen-density.py _local/reports/stage36-density-v2/candidate-app-views
```

Optional `--frame`, `--foundation`, `--door`, `--surface`, `--body` require new scoped vector IDs and empty
collision arrays. `--out` changes the isolated output folder. Home replacement
is all seven references in Stage36 only, never the common original asset.
Door replacement changes only `design.vectorDoorAssetId`, preserving original
`a4:door` instance, pivot and event identity. Surface artwork must already be world-mapped. The assembler derives an exact
clip from original terrain over x1600..3400 and only the first80world units below
its surface. It never draws above the collision contact or invents new walkable
geometry. This pilot band is explicitly scoped, not a global stage rule.

Capture uses the existing production App adapter and ordinary recorded inputs,
not injected event state. It captures standing and genuinely fallen states at
identical normal/detail/mobile/whole inspection cameras. Presentation framing is
temporarily suspended and restored; actual post-render camera is recorded.
DOM/audio remain adapter doubles,
so these are not browser or device-performance results. Existing scene-only
`stage36-production/inspect.mjs` does not activate the full dynamic door and must
not be used as door-art evidence.

`screen-density.py` reports screen-space adjacent luminance differences and
contrast in identical world ROIs. It cannot recognize important small features
or separate overlapping actors from art. Never treat it as acceptance, equalize
node counts across roles, or optimize toward a numeric ratio blindly. Inspect
same-camera original/candidate renders and meaningful detail crops directly.

A `--body` replacement regenerates both existing domain-continuation assets
using the same piecewise-affine domain mapping and the new BODY source. The
matched substrate/deep base is `#666a62`; no old high-contrast mirrored extension
is left active. These derived assets retain empty collision arrays and existing
instance transforms. Original authored terrain remains authoritative.
