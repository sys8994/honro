# Stage32 bounded diagnosis conclusion — 2026-11-17

No production changes, acceptance, merge or deployment.

## Evidence
- Pattern experiment a988ac80 / CI44150722670 SUCCESS, artifact14359895655. ZIP SHA256 1ca557abd084a347743e0066b64c0d83b4c4f7c63988fe6f5d6337d6496cd31c, CRC verified.
- Gray/solid controls 56af718b / CI44152042601 SUCCESS, artifact14359163374. ZIP6,046,525B, SHA256 6e5356ab60d48031b8138f4f89a35d4be24a061d6bcc67aca86188426500c3b0, CRC verified.
- Source-only probe bde5637f / CI44153723458 SUCCESS, artifact14361100177. ZIP SHA256 af2f095aee3600af777997c6f45c17f6b6ed4a5b37c6deba9295e38615dcb603, CRC verified. No rasterization.
- All same-raw experiments retain source, physics, camera, wholebattle, first-frame/render purity, zero-error/fallback/storage contracts and exact historical candidate lower/left PNGs.

## Findings
Direct solid original colors with no redundant same-color gray repaint equals raw direct in BOTH complete 1331x763 views: RGBA difference zero. Therefore the helper's original path traversal/scale/apron/fillRule can preserve raw geometry and original colors exactly.
Pattern original without redundant gray differs by 26,589/22,987 pixels, max4. Existing redundant same-color gray repaint changes 4,348/6,816 pixels, max9/10. These isolate sampling AA and selected-gray repeated coverage, not original path loss.
Actual pattern-material lower/left images retain the thin footer and internal green residual outlines. Direct-fill Pattern did NOT solve the art defect and is not accepted.

## Footer, separate from internal green boundaries
Body registration bounds bottom is world2252.8, screen593.18 in lower view. It does not cause the screen430–435 footer.
Pale1–4 end at source903.254–903.824, world1987.16–1988.41, screen433.80–434.55. Green12–17 end at source898.279–903, world1976.21–1986.60, screen427.23–433.46. Their finite fill ends match the visible footer.
The world-space portApron boundary is below this line across the lower view, so whole-apron repeated clipping is not the primary horizontal-footer cause. Do not apply the Stage37/38 source-alpha correction indiscriminately.
Original road paths21–24 stay at sourceY<=622, world1368.4; actual declared walk edges reach world1342. Footer is over600 world units lower. Source-order coverage footer has no road contribution or fully opaque protected contribution, but residual pale/green contributions are real. Many belong to large connected subpaths extending upward. Zeroing them or applying a threshold would violate the current preservation constraint.

## Pipeline identity
Adapter constructs joined and new BODY with identical author vector. Optimization is ID-keyed and reassigns vector after strict original SHA check. An explicit new-ID alias to the existing joined optimization entry could reuse exactly the approved old optimized25d values, restoring old/new runtime geometry equality without re-optimizing. Raw source hashes and optimized runtime hashes must remain distinct. Gray subpath index correspondence requires individual order/selection verification, not merely equal723 subpath counts. This is possible pipeline repair, NOT evidence of footer resolution. Existing old/raw failed strict evidence remains preserved.

## Resolution boundary
Under current constraints the diagnostics do not establish a safe renderer-only fix. The new geology makes existing partial pale/green contributions conspicuous; switching clip+bitmap to pattern changes AA slightly but not the art contrast. Metadata expansion and whole-apron alpha correction are unsupported. Do not delete connected protected shapes, threshold alpha, or revive inaccurate Boolean masks.
A source-aligned nonwalk transition/material design that follows the existing original lower color/strata and joins into the external field is a plausible art route, subject to separate design and exact road/grass/geometry protection checks. It is not yet built or proven. Internal green residual outlines require separate treatment; a footer-only transition does not fix them. Preserve the unfinished candidate and exclude it from accepted production integration.
