# Stage13 hidden gate — near-terrain candidate

Seven actual-Inkscape assets, local geometry-preserving native integration. **No master hook, browser acceptance, combat completion, or public deployment is included.**

## Evidence and sizes

- Immutable actual Inkscape RAW pack: **612,297 bytes**.
- Separate authored RAW after palette matching and removal of two rectangular local backing layers: **587,415 bytes**.
- Final SVG pack: **414,635 bytes**, **32.282% below immutable RAW**, **29.414% below authored RAW**. Both baselines are retained; semantic removal is not hidden in a claimed geometric reduction.
- All seven assets pass unchanged 1×/2× pixel limits in their **actual canonicalSolid/contactInset/underpaint composition**. `pack-report.json` contains per-part sizes, hashes, raw/adjusted edge offsets and adjusted-pixel counts. This tests visible material at native terrain boundaries, not generated overdraw outside those boundaries.
- The roof uses the repository's established one-level RGB quantization policy only for alpha-identical pixels (2 at 1×, 4 at 2×). Extension declares the same option but adjusts **zero** pixels; its final alpha and protected RGB are exact at both scales. Other five assets use zero tolerance.
- Isolated/unclipped intermediate failures and a one-pixel far-right extension clip failure were rejected. The final extension uses a smaller bound (0.5 rather than 0.8) and removes that failure, not a relaxed gate.
- Local first-backing-only variants were rejected after legal-end review exposed rectangles. Both dark backing layers are removed; only the image-derived mid/light facets remain over the continuous base.

Each part exports original source, guide, prompt, layer contract, import config, immutable trace/authored RAW gzip, final SVG, optimization provenance, metric-composition SVG gzip/config/report. Production native JSON is under `shared/data/act2/stage13-*.json` and is digest-locked by `tools/act2-vector-production/stage13-art-source.json`.

## Reproduction

Run from the repository with existing Python/Node/Inkscape dependencies. Work on a copy of this artifact directory, not the immutable package.

1. `python tools/act2-vector-production/prepare-stage13-traces.py <copy>` restores semantic authored RAW and native RAW from the immutable actual trace gzip.
2. `python tools/act2-vector-production/optimize-stage13-contact.py <copy>` creates `candidate-final.svg` and bounded-optimization provenance.
3. `python tools/act2-vector-production/compose-stage13-metrics.py <copy>` applies exactly the native canonical clips and underpaint for comparison.
4. For each part, use `flock /tmp/honro-heavy-art.lock python tools/vector-production/compare-svg.py <copy>/<part>/composed-world.svg <copy>/<part>/composed-candidate-final.svg --config <copy>/<part>/metric-config.json --output-dir <scratch-report>`.
5. Import each `candidate-final.svg` with `tools/vector-production/import-svg.py --config <part>/config.json --output <part>/native.json`; run `flock /tmp/honro-heavy-art.lock node tools/act2-vector-production/preview-stage13-art.mjs <copy>`.
6. `node tools/act2-vector-production/test-stage13-candidate.mjs` checks current committed native assets against raw pre-hook source and effective runtime-author output separately.

The actual tracing used `/tmp/trace-fixed-palette.py`, cumulative binary Inkscape object-trace with source-matched palette and full-path-hashed per-layer profiles; trace reports and logs accompany the package. The shared helper was not changed.

## Integration ownership

Invoke `applyStage13ArtCandidate(project)` only after the existing Stage13 tactical/stoneFinish pass (which itself follows Stage10 positioning) and before runtime projectAuthors. Root owns this shared-build integration, save codec, deployment and live verification. Do not remove/reorder the existing Stage13 181-plane stoneFinish or its four authored structure variants.
