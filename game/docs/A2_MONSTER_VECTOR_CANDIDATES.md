# A2 monster vector pose candidates

**Status: art candidates, not production-approved or integrated.** Existing 350-anchor production gate remains unchanged. Renderer cost / narrow family budget review and actual game-camera checks are pending. Source baseline: `86101b3`. Branch: `art/a2-candidates/traced-v1`.

## Contract

`shared/assets/monsters/a2/manifest.candidate.json` defines 16 immutable-on-release pose frames: 어둑시니 growth 1/2/3 × idle/prepare/attack/recover, and 점복무녀 idle/prepare/link/recover. These are pre-authored vector frames, **not skeletal rigs**. Final foot-center registration uses the traced root center (shadow) or two-shoe stance center (woman), not a guessed sheet-cell center. All use a common `[-85,-150,230,160]` viewBox, base height 128, and grounded foot origin `[0,0]`. State selection changes artwork only. Facing is the root X sign. Collision width/height, attack reach, target selection and timing remain simulation-owned; do not derive them from visual bounds or scale the whole actor to implement growth.

The smallest 어둑시니 has its own crouched anatomy and short-arm action frames. It never briefly switches to the stage-3 body during an attack. Growth changes head/spine/arms while the ground root stays fixed. The support enemy uses an open-fan preparation, pointing-fan link, and folded-fan recovery. The same target/attacker marker is a separate gameplay/UI effect, not baked into the SVG.

All final candidate SVG paths contain only absolute M/L/C/Q/Z commands and solid fills; no bitmap, image, transform, clip, filter or external reference remains. The renderer owner must register these through an explicitly validated pose-frame pipeline, not silently insert them into or loosen the existing handcrafted-asset budget gate.

## Authoring lineage

Approved-direction imagegen references were inspected against actual existing shade/ghost/mourner/warden pixels. Current `party/sodan.svg` was also rendered: its narrow pale/lavender long garment is distinguishable from 점복무녀's broad dark chima, short ivory jeogori and open fan. No claim is made that the fictional costume reproduces a specific historical rite.

Actual installed Inkscape was used:

- 어둑시니: `object-trace:7,true,true,true,8,0.7,0.35`; six color layers after background removal. Additional stage-1/2 action references preserve their separate anatomies.
- 점복무녀: `object-trace:12,false,true,true,3,0.7,0.2`; eleven colors. The flatter/generated style alternative was **not adopted**.
- Raw traces remain immutable. Inkscape `path-simplify` candidates were generated independently from raw at 0.0005 / 0.002 / 0.005.
- The lowest-cost 0.005 어둑시니 candidate was rejected for up to 3 world-pixel outline drift at the reaching hand. The selected candidate uses 0.002, with exact raw fingertip regions restored on growth 2/3 through Inkscape intersection/difference after final registration exposed a remaining contour discrepancy.
- Whole-path 0.002 on 점복무녀 was rejected after enlarged face/hand inspection, despite a good average alpha metric. Raw face/hand/fan regions were restored using actual Inkscape intersection/difference, locally simplified at 0.003 and unioned; small skirt-tone islands were removed only outside semantic protected areas. Absolute normalization prevents relative-subpath origin drift.
- Final serialization rounds coordinates to 0.001 world units. Ground correction, bounds, raw/reference/final hashes and exact complexity are recorded in the manifest.

The GTK wrapper initializer already present in the workspace was needed for installed Inkscape's headless tracing path (plain tracing segfaulted). It initializes libraries only; it does not draw geometry or alter permissions.

## Direct visual checks performed

1. **Whole silhouettes / states:** all 16 frames at common scale. Growth states have different anatomy, preparation/attack/recovery are readable, no pose switches to a wrong growth body, foot baselines align.
2. **Semantic detail:** raw/candidate enlarged comparisons of long fingers and blank face slit, and the woman's face profile, fan ribs and gripping hands. This check caused the two rejections described above. Numerical metrics alone were not accepted as art approval.
3. **Small display / facing:** common 48px base-height scale, both root-mirrored facings and every state. The small growth-1 body is about 27px tall at this scale; gesture and growth outline remain primary signals, not fingers, facial detail or bell dots. This is a neutral-background art check, **not** actual game/mobile camera approval.

Raw-to-final comparison uses the same chosen horizontal registration for raw and candidate and separately grounded vertical coordinates, rendered at 1× and 2×. At 2×, the sampled alpha-contour distance is at most 0.707 world px across these 16 candidates. This is a raster threshold metric, not a continuous mathematical Hausdorff bound. Protected bands include head/hand/fan/foot areas; their mean error does not replace direct inspection. Imagegen-reference-to-trace approximation is separate and is not covered by the raw-to-final error number.

## Budget / runtime review still required

- 어둑시니: 395–726 anchors, six paths/colors, 16,450–28,355 bytes per pose.
- 점복무녀: 4,287–7,705 anchors, eleven paths/colors, 160,098–304,766 bytes per pose.
- All 16 SVGs: 1,125,763 bytes before transfer compression. A low SVG path-element count is **not** a low node/overdraw cost claim.
- Compare cold Path2D compile, direct actual-renderer drawing and optionally a shared static-pose cache with existing shade/ghost. Static frame caching can preserve vector source; it is only a proposal until measured and explicitly accepted.
- Existing code has not been modified to select these frames, change budgets, cache them, place actors or change combat.

Local authoring/evidence workspace retains PNGs, exact prompts, immutable raw SVGs, trace/edit logs, error JSON, contact sheets, and standalone `production/benchmark.html` using the existing monster renderer. Those large references are intentionally not runtime/Git dependencies. The benchmark is pending execution in an authorized browser environment: sandbox Chromium socket creation and the attempted escalation failed; cloud browser explicitly disallowed `file://`. No restriction was bypassed.

## Release handoff

Keep the original 350-anchor gate until the coordinator reviews actual costs and either accepts a narrowly scoped pose-family budget/cache contract or requests further art reduction. Re-run the changed semantic regions if any optimization changes. After A1 gates, integrate through the shared renderer, confirm actual min/default/max camera sizes and motion/state switching, preserve body collision/save behavior, then commit/push and use the existing master/Pages release process. This document does not mark those steps complete.

## Vector-friendly alternate and candidate CI

The coordinator approved `munyeo-flat-candidate.png` as an **alternate reference direction**, not a pixel-equivalent copy or a selected final. It retains the adult stern profile, hanbok, fan/bells and four gestures, with reduced texture. The retained high-fidelity family is not overwritten. `manifest.alternates.json` and `alternates/*.svg` contain four separately traced 10-scan/smooth candidates (9 retained colors), actual Inkscape Simplify0.002: idle 1,304 / prepare 1,923 / link 1,660 / recover 1,407 anchors; 48,645 / 72,486 / 63,986 / 52,920 bytes. Final selection still requires visual/cost review. Raw-flat-to-optimized comparison must not be mislabeled as raw-original equivalence.

`tools/a2-art-qa/run.py --validate-only` checks the exact candidate SVG hashes, path syntax and statistics without a browser. The dedicated `a2-art-candidates.yml` workflow runs only on `art/a2-candidates/**` or explicit dispatch. It serves the actual SVGs/manifests and existing monster renderer over loopback HTTP, captures shade/ghost plus all retained/alternate frames, source provenance, cold compile and direct/cache CPU-submission timings, heap snapshot and explicitly limited memory estimates. 4× CPU emulation is labeled synthetic, not mobile GPU FPS. No full-game build, production budget change, merge or deployment occurs. A green run means measurements were collected, not production approval.

Body-core guide boxes are approximate authoring metadata only, separate from complete visual bounds. Movement footprint and hit geometry are explicitly unset. Arms/fan extensions must not silently become always-targetable body or wider collision.
