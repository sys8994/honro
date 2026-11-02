# Stage18 review record

## Scope
Image-derived static cavern decoration only. All collision contours, actor dimensions, moving giant bell, chain/release targets, wooden structures, quests, rescue/support/locks and original far image remain native.

## Rejected first version
- Four palette traces: domain-v1/floor-v1/west-v1/east-v1.
- Strict optimizer inspection found1px protected contact-color drift in domain1×; complete floor highlight contour restored, no tolerance increased.
- Even after pixel comparison passed, normal actor-scale art review FAILED: full-width floor and west source read as thick parallel painted bands. Slate recoloring alone did not solve geological scale.
- Left/right source footprint edges showed vertical material seams; did not classify these as acceptable dummy terrain.
- First sources and exact prompts remain in local rollout archive, with `rejected-v1-pixel-passed-visual-failed.json`. No first-version asset is shipped except quiet continuous domain.

## Replacement
- New floor-local-v2 covers world4200,6500 at5200×3000, rather than stretching a14,600-wide art panel under actors.
- New west-v2/east-v2 use same original silhouettes but grouped diagonal/vertical interlocking faces and narrow subdued walk rim.
- Prompt specifies actor-equivalent26–28sourcepx and rim3–7sourcepx. No actor or distant image painted into source.
- Actual Inkscape four-color trace removes soft source shading. Final color planes remain crisp; no bitmap embedded.
- floor-local-v2 omits its two dark complete backing colors identically in RAW and final composition, retaining irregular generated light faces over continuous original domain. No handmade cliff geometry, invented feather-mask or mirrored material stretch.

## Required evidence
- Original world13600×9600, actor92.
- Native report records requested/actual camera, mobile390×844 at0.94, legal edge min0.2117647/max1.65, ceiling and bell shifted180visual fixture.
- Pixel gate: actualsamecanonicalSolid/contactInset RAW/final1×2×, unchanged protectededge0.5sourcepx; no ignored white silhouette failures or tolerance expansion.
- Aggregate finalSVG must be≥30%smaller than immutable authored RAW; retain original trace and authored palette baseline separately.
- Native assertions are not a browser playtest, stage clear, gameplay acceptance or deployment claim.

## V2 result
- Actual native RAW/final:8/8part-scale comparisons PASS. Max protected color-edge displacement after declared1-levelRGB quantization tolerance:0px; geometry/alpha silhouettes unchanged.
- ImmutableRAW533,445B → finalSVG364,814B:31.6117% reduction. Packaged native vectors375,538B (includes canonicalclips/metadata); no embedded source bitmap.
- Parent independently accepted V2 entry/floor/mobile art direction; legaledge min/max views visually reviewed after final baked assets, and bytes match packaged files except preview flag removal.
- Focused test PASS: raw hook source/hash lock, visual-only delta, static-only host selection, original effective geometry/units/events and two bell shifts, canonical clips/contactinsets exact.
- First test harness run compared a null-prototype runtime library to its plain JSON copy; corrected serialization-based data comparison. This was harness prototype identity, not a game-data change or gate relaxation.

## Coverage defect found by independent Stage19 review
Prior V2 edge sign-off is withdrawn: legal camera y−1800 at minimumzoom sees above the generated domain source y−2000. Existing canonical full-roof underpaint was present in vector data, but `bounds`, `reference.bounds` and `vector.viewBox` still used source-image extent, so the renderer clipped it and exposed a horizontal two-color seam.

Correction changes ONLY decorative bounds to full original canonical floor/roof extents. Source image transform, source SVG, local material sizes, anchor/foot and world scaling stay exact; `reference.heightM` is adjusted proportionally to preserve `60*heightM/bounds.h===1`. No camera restriction, collision edits, repeated texture or source stretching. The top source edge is transparent and bottom is uniform base, so the same existing canonical base gives continuous outer coverage.

New mandatory gate: decorative bounds contain `HonroBounds.visual` for desktop1440×900, mobile390×844, wide1920×1080; visually inspect top AND bottom at legal minimumzoom in addition to left/right min/max. Do not infer top coverage from a near-ceiling screenshot at y1700. Record actual camera coordinates and independent Stage19 result.
