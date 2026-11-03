# Stage14 native terrain candidate

`해가 닿지 않는 마을`: a sunless Korean cavern village. This candidate changes static BODY material only, using subdued slate, thin dusty contact caps, and angular image-derived rock faces. The far-background image and existing rear geology, Korean homes, lamps, pottery, laundry, gates, bridges, actors and events remain separate and unchanged.

## Scope and authority

- Existing authored stage: 7600 × 10400; original hero height 92.
- Seven generated/traced source pieces cover twelve static geology bodies. Gate bridge, timber refuge walkway and family roof-step are excluded.
- Pre-author source guard and effective production-story/compiled geometry equivalence are distinct tests. Runtime quest authoring is not copied into raw source.
- Native canonical clips and four-world-unit decorative contact insets preserve collision/contact boundaries. Domain underpaint extends through the original outside terrain extents; local material ends are image-derived, not rectangular crop masks.
- Exact submitted image prompts, references, immutable PNGs, RAW SVG gzip, optimized SVG, actual Inkscape reports, strict contextual comparisons and lossless lexical cleanup proofs are in `art/act2-near-vector-candidates/stage14-village-v1`.

## Evidence

`evidence/` contains twelve actual native shared-renderer views: normal entry, market, family, refuge and vault; diagnostic overview; legal minimum zoom; mobile; left/right/top/bottom extents. `native-views.json` records requested and actual cameras. The overview is deliberately diagnostic, not a claim that its zoom is available in gameplay.

Native review checks the visible house/actor silhouettes, traversable gaps, unchanged gate/timber silhouettes, local material scale, ceiling and outside continuity. These PNGs are not browser screenshots. No save-codec, combat clear, rescue-chain or Pages pass is asserted here.

## Reproduce

See `tools/act2-vector-production/README-stage14.md`. Heavy native renders and pixel checks require the shared `/tmp/honro-heavy-art.lock` and bounded heaps. No shared renderer, runtime, collision or build-dispatcher changes are part of this candidate.

Parent release integration must wire the stage-specific hook once, run browser/save/full-gameplay QA, check the real native payload against storage quotas, deploy existing Pages, and directly verify it. The separately diagnosed NPC body-reservation lock is a parent-owned runtime fix, not an art change.

### Strict-contact correction

The initial family courtyard optimizer failed its 1× protected color-edge limit (1 px measured versus 0.5 px allowed), despite passing 2×. Wider preserved strips and zero curve replacement did not solve that rasterization behavior. A one-palette-path-at-a-time probe identified the original `#979789` highlight compound. The selected family candidate preserves that entire path verbatim geometrically, followed only by proven lossless lexical cleanup. It does not expand the protected tolerance or change the terrain. Final packaged reports, rather than rejected trials, are the acceptance evidence.

## Final native candidate gates

- Seven-part immutable RAW SVG pack: **2,012,122 bytes**.
- Final SVG pack: **1,400,703 bytes — 30.3868% smaller**.
- Actual seven native JSON files: **1,268,085 bytes** (file bytes, not SVG proxy).
- All seven strict contextual comparisons pass at 1× and 2×. No threshold expansion; existing RGB ≤ 1 quantization treatment requires exact alpha.
- All seven lexical cleanup proofs are RGBA-identical at 1× and 2×.
- `node --max-old-space-size=1800 tests/stage14-traced-art.mjs` passes raw-hook guard, effective-stage restoration, all 29 other stages unchanged, exact compiled world/collisions/units/events/camera/state, native schema and immutable pack checks.
- `evidence/contracts.json` binds the source, effective stage and compiled actor/geometry hashes. This branch is based on `292c1122`; the parent-owned later NPC runtime fix must be rebound during final gameplay QA.

Status: **native candidate ready for parent integration/review**. Browser, save quota behavior, full gameplay and public Pages deployment remain unverified by this worker.
