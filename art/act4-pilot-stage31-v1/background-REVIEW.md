# Stage 31 native background — candidate; art review pending

Single full-world rear layer; bounds 7000 × 4700, anchor (0,0), no collision. Original 1529 × 1029 opaque RGB PNG and native Colors 8 unstacked trace are immutable. Source PNG SHA-256 `196b8d285ce791714e7aa36cfb6fd09a2c4317783361d4145a1294437e8bf2f5`; trace SHA-256 `ce4f2147b116214e693dc80eee385e9c9c6a1d045fefc1a01c6286c2dad7305a`. The optimizer reads only SVG paths, never its linked image. Final JSON SHA-256 `64161d7491d290fdce61aa6a3b17a2cce65553c77a5b0c08d58002ae73c72d1d` (170004 bytes; 14 nodes).

## Separate decisions and evidence

* **Geometry cleanup, not a fidelity pass:** Flatten tolerance 0.10 source units, topology-preserving simplify 0.22; disconnected components and holes below 50 source-pixel² intentionally removed/filled. Each surviving polygon exterior is compared to its own flattened source exterior, densify 0.1: largest Hausdorff distance 0.3111 source units (before 0.01 coordinate rounding and the 0.16 outward seam overlap). Full per-layer counts and area changes are in `background-optimization.json`. Small features are intentionally sacrificed; this is not a guarantee of semantic or pixel fidelity.
* **Palette art revision, not optimization error:** Blue HLS lightness and saturation scaled to 80%; dawn #c9a39c changed to muted gray-lavender #9b99ac. The source→revision mapping is in the metrics JSON. Contrast and mood require visual approval.
* **Comparator caveat:** Prior raw/optimized alpha silhouette comparison reported 466 px distance, but this measures internal transparent unstacked seams/holes that disappear under the opaque backing, not movement of a mountain exterior. Neither that result nor the intentionally recolored RGB error is a valid geometry-fidelity pass. Major retained exteriors are measured separately as above; visual review remains required.
* **A01–A04 failure prevention:** Cause: disconnected color trace speckles and unstacked antialias seams survived the raw import. Forbidden retry: crop a connected concept as a modular asset, hide seams behind the linked bitmap, increase loss until a limit passes, or claim validator/physics implies art approval. Alternative: this is the original separated full-scene background, use vector-only unstacked paths, discard bounded tiny geometry and use an opaque palette backing plus same-fill 0.32-source-unit stroke. Evidence: per-layer exterior measurements and actual Canvas vector render; no claim about foreground module contacts or gameplay. Candidate remains **visual review pending**.

## Reproduce

Requires Python `numpy`, `shapely` 2.x and `svgpathtools`; run from repository root:

```sh
python tools/act4-pilot-native/optimize-background.py
python tools/vector-production/import-svg.py art/act4-pilot-stage31-v1/background-optimized.svg --config art/act4-pilot-stage31-v1/background-asset-config.json --output art/act4-pilot-stage31-v1/background-asset.json
node tools/vector-production/render-asset.mjs art/act4-pilot-stage31-v1/background-asset.json /tmp/bg31-overview.png 1400
node tools/vector-production/render-asset.mjs art/act4-pilot-stage31-v1/background-asset.json /tmp/bg31-3920.png 3920
python -c "from PIL import Image; Image.open('/tmp/bg31-3920.png').crop((1260,500,2660,1500)).save('/tmp/bg31-camera.png')"
```

Canvas render uses the existing engine vector draw and both validators: zero validation errors for 1400 × 940 and 3920 × 2632 renders. The 1400 × 1000 crop is from 3920-wide render, corresponding to an **assumed**, not observed, 0.56 CSS px/world-unit camera. Neither static preview verifies gameplay or deployment.
