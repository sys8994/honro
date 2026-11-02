# Stage18 static cavern material

## Contract
- 13600×9600 source world; actor height92 and camera unchanged.
- Four image-derived patches: domain-v1, floor-local-v2, west-v2, east-v2. Earlier full-width floor/west/east v1 are visually rejected.
- Keep moving bell, native chain/release targets, all wood, far scenery and all gameplay geometry/events untouched.
- Stage19 shares static geography; reuse these exact asset IDs/hashes, never duplicate resources.

## Reproduce
Work source folder: `../honro-act2-vector-rollout/stage18`.
1. Preserve raw stage and canonical guides, exact `submitted-prompt.json` before generation.
2. `preview-stage18-source-scale.mjs` shows source material at original actor scale.
3. `trace-stage18-palette.py` invokes actual Inkscape trace, four broad palette planes. Immutable output `trace/raw.svg`; archive `original-trace.svg.gz`.
4. `prepare-stage18-assets.py` creates baseline, canonical protection lines and native importer configs. Do not rerun after authored palette refinement without replaying refinement.
5. `optimize-stage18-hybrid.py PART` preserves contacts/compound extrema, boundedC→L/Q and precision reduction.
6. Historical v1: `refine-stage18-contact.py SOURCE` restored original floor highlight subpath2 after native domain1x detected1px drift. Do NOT run this v1-specific repair onv2. Retain failed report; no threshold change.
7. Historicalv1 palette script explicitly tones #88887e→#68777b; retained only fordomain. V2sources request slate directly, no post-trace recolor. Compact each candidate with `compact-stage18-lossless.py PART`, which verifies identical parsed geometric segments.
8. Render raw/final separately under `flock /tmp/honro-heavy-art.lock`, same `preview-stage18-art.mjs SOURCE` with `HONRO_STAGE18_ART_QA=1`, `HONRO_STAGE18_ART_FILE=native-raw.json` / `native-candidate.json`, appropriate report directories.
9. Run `compare-stage18-native.py` under same heavy lock:1×/2× actual native renderer with identical canonicalSolid/contactInset composition and original actors/background. Protected edge≤0.5sourcepx, unchanged tolerance1RGB8bit, no alpha/protection masking relaxation.
10. Review native normal/mobile/legal outer edges/bell shifted fixture visually. Shifted fixture is NOT gameplay clear.
11. `finalize-stage18-assets.py SOURCE` refuses unmeasured/mismatched/pixel-failing or aggregateSVG reduction<30%.
12. `node tests/act2-stage18-candidate.mjs`: raw source driftlock, asset hashes, effective geometry/actors/events and moving bell parity, canonical clips.

## Integration
Root calls `applyStage18ArtCandidate` before narrative hooks in shared/build.mjs. This worktree does not edit shared build/runtime. Root owns real browser screenshots, playtests and publication. Native views are evidence, not deployment or gameplay acceptance.

## Failure lessons
- Global small RGB error can hide one contact color-edge shift: restore original complete contour, never widen threshold.
- Source looks attractive alone yet cap can dominate at actor scale. Check farewell close view shared with Stage19, not only wide panorama.
- Art static hosts must exclude moving/destructible systems even when geometry appears in image guide.

### Domain coverage correction
`preview-stage18-art.mjs` now extends domain asset bounds/viewBox to original canonical floor+roof extents while keeping image transform and physical scale exact. Full underpaint already existed; expose it rather than stretching image material. RAW/final assembly uses identical correction. Test checks `HonroBounds.visual` coverage for1440×900/390×844/1920×1080 and scale1. Legal ceiling/bottom views are required, including mobile minimumzoom; prior source-image bounds alone are insufficient.
