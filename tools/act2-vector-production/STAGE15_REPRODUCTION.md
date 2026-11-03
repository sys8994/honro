# Stage15 native candidate reproduction

Source/provenance package: `art/act2-near-vector-candidates/stage15-waterway-v1`.
Cloud production directory: `/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage15`.

1. Keep original generated source/prompt/guide/trace gzip immutable. `prepare-stage15-assets.py` records image-component extraction; never use optimized output as a new RAW baseline.
2. `optimize-stage15-hybrid.py <part-dir>` creates bounded candidate-bbox. `refine-stage15-contact.py <production-dir>` restores the one exact source contact contour and does token-identical whitespace packing.
3. Import source RAW as `native-raw.json` and candidate-contact as `native-candidate-contact.json` using `tools/vector-production/import-svg.py` and each original config.
4. Serialize heavy work with `flock /tmp/honro-heavy-art.lock`. Use `preview-stage15-art.mjs` with `HONRO_STAGE15_ART_QA=1`, `HONRO_STAGE15_ART_FILE` selecting each import and output dirs `stage15-raw-composite-opaque` / `stage15-final-composite-contact` below `_local/reports`. These are actual authored native compositions, not standalone SVGs.
5. `compare-stage15-native.py` requires original1×/2× source density, unchanged ROI/thresholds, existing alpha-exact/RGB≤1 allowance. `finalize-stage15-assets.py` requires passing shipping results, exact SHA binding, ≥30% aggregate SVG reduction, and JSON-identical final import after XML declaration removal.
6. Standard native preview (without QA env) includes entry, crown, water before/after named visual drain fixture, east upper exit, overview, mobile and both extended ends. Baked candidates are written by the same preview function; only set `params.previewOnly=false` before runtime packaging.
7. `node tests/act2-stage15-candidate.mjs`: raw source lock, no nonvisual delta, exact effective terrain/world/actors/water/state/events, exact native world clips/contact inset and dynamic-ledged-region exclusion.

Root integrator invokes `applyStage15ArtCandidate` **before** narrative authoring. This module is stage-specific; common dispatcher/runtime/codec/build are not changed here. Integration, browser gameplay and Pages verification remain separate gates.
