# Stage17 quarry static terrain — reproduction

- Baseline: master ad56f6d7a4c6f6339f6c0f2ceb792c3ddff711fd. Build hook deliberately not edited here.
- Exact generation arguments, guide, selected source and rejected local references accompany each asset. Keep original dimensions11200×8200, hero92 and canonical collision; static decoration must not touchwood/hoist/gear/mutable gate.
- Run prepare-stage17-guides.py against immutable original raw stage. Local v2 adds upper rock hosts missing from v1 extraction.
- Palette extraction: trace-stage17-palette.py uses actual Inkscape cumulative monochrome trace and excludes beige mask background; palette definitions shipped. prepare-stage17-assets.py removes only local edge-touching components/dark base and preserves continuous outer body.
- Actor-scale source preview MUST precede trace acceptance. Never compensate map fit by changing actor size.
- Optimization: locals HONRO_STAGE17_PRECISION=0 HONRO_STAGE17_PROTECT_PAD=72; outer precision1/pad12; preserveextrema; then minify-stage17-lossless.py verifies path geometry equality before serialization. Selected candidate imports are hash-bound to exact pixel comparisons.
- Important failure:12px local-source protection does not cover the broader world-space protected band in full-world QA. Preserve72px local around the SAME canonical contact edges; do not shrink QA region or relax palette-edge thresholds. Earlier rejected strict reports retained.
- Preview via actual native HonroScene, canonicalSolid clipping +4 world-unit contactInset +outeropaqueunderpaint. No alternate alpha composition. Lock all heavy renders/comparisons with flock /tmp/honro-heavy-art.lock.
- Strict1×/2× compare-stage17-native.py runs whole composition for allthree projections. finalize/package tools reject failures or candidate hash drift. Require≥30% authored RAW aggregate reduction (stronger than original Inkscape RAW reduction); no per-asset quota.
- Focused test verifies raw hook source hash, unchanged other stages, assets only/zero collision, effective actors/terrain/water/events parity, cave-only host list and original canonical/contact-inset points.
- Parent integrates build hook, publishes checkpoint, tests actual browser/normal play. Native pictures are not browser or gameplay acceptance.
