# Stage 32 shared material review, 2026-11-17

## Disposition
**Implementation and focused CI completed; visual acceptance incomplete. No deployment.**
Tested code: d18b9ff926e2ca2a3ec4438226a3d5acfb1ab349, branch fix/stage32-shared-material-20261117.
CI: https://github.com/sys8994/honro/actions/runs/44085975797 — success, including official HONRO_ACT4_RELEASE=1 build.
Master remains 7d238d20663c3ceffe430eb0304e01516ae625cf. This report does not authorize or claim release.

## Actual Chrome evidence
Four baseline and four candidate images at 1331×763, DPR 1, initial official Stage32, seed3910/time2. All requested cameras survived the production constrain operation unchanged:
- overview: x0/y2252.8/scale0.19573529411764706
- lower: x1689.6/y1900/scale0.6
- left: x320/y1650/scale0.6
- right: x3200/y1650/scale0.6

Artifact 14329687058, stage32-shared-material-review, contains PNG+JSON for all eight views.
ZIP SHA256: 86b1626d052a5f9bf7586f2a76f7f8d92a7e10723357ae7ecc3a1d6539c414fa.
Archive CRC, filenames, count16 and each PNG's JSON-recorded SHA256 were verified after download.
All views retain physics SHA256 699b6a494763270ff98c1f632ab848f91d34fdf084367e532e57f627363d5c97, matching the previous original-provider baseline. Storage access, runtime/CSP errors, pending/failed images: zero. Battle rendering is state-pure. Static sea remains the official source policy; tideSnapshot remains null.

## What the pixels show
- The previous broad brown BODY rectangle over blue foundation is removed by the common field. Left/lower/right material now continues through the old paint termination rather than switching palette abruptly.
- Roads, stairs, grass, gray roadside stones, cave openings and source silhouette remain; geometry/path contracts also passed.
- **Thin residual contours remain visible in actual Chrome**, including the former BODY footer around world y1970–2000 and portions of the old side/occlusion boundaries. The enlarged lower/left/right images make them visible. These are not dismissed as a Native-only artifact.
- The protected original layer/order and partial coverage at those boundaries are a likely contributor, not a fully proven final cause. Removing source fragments or relaxing preservation checks has not been performed to hide them.
- Consequently the candidate must not be labelled visually accepted, fully repaired or ready for public release. The first V3 foundation-only attempt remains rejected; this revision is better at continuity but still incomplete visually.

## Cache and validation
One latest bitmap allocated per scene, 1,065,024 bytes (516×516×4), zero fallbacks in all candidate views. Observed rasterizations/hits:
overview8/3; lower12/12; left12/9; right12/9.
These are tile render counts, not FPS or whole-scene one-rasterization claims.
The first run failed because compiler-cloned provider objects had different identity. The corrected code resolves the same battle foundation for both passes; the compiler-equivalent cloned-provider unit now passes one rasterization/one hit. The strict browser checks were retained.
Source identity/geometry/old provider retention, other-stage equality, isolated profile codec roundtrip, cache invalidation/bounds/purity, deterministic V4 generation and official build passed.
V4 remains 609,306 bytes with an explicit750,000-byte budget. The cache has an8,388,608-device-pixel safety cap; oversized views use the prior vector fallback and are not claimed to preserve the new seam correction.

## Limits and stopping point
Only Stage32 was continued after the user's narrowed instruction. No new changes to other stages, no master/Pages update, no user save or existing battle action. Public normal UI/input, gameplay, dynamic transitions, real saved-battle migration, mobile/high-DPR hardware and oversized fallback appearance remain unverified. This is the stopping record for the current candidate, not a new request to continue other stage fixes.
