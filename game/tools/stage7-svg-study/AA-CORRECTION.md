# First Chrome failure and conservative source-space correction

First ordinary Chrome run: 44194151847, input candidate SHA256 8cfb92f302133fe2d24698c8518db28b6771db72a101e7cbdc1da5c40524c2e0.

Two join-view original-opaque protected pixels changed:

- pixel (462,241), source (12,991): [123,100,71,255] → [123,100,72,255].
- pixel (463,265), source (13,1015): [120,97,71,255] → [120,98,71,255].

Both lie at the old near-left gap / original source silhouette boundary. The underpainting reaches beneath the original partially covered edge. Final original alpha quantizes to255, but adding another color underneath changes a rounded RGB channel by1. Native rendering did not exhibit the same rounding. This is a preservation failure, not a reason to relax the original-opaque equality criterion.

## Correction
The entire side underpaint is now clipped away from a conservative original source-space AA contour near the join. The contour is generated from the unchanged original source-contact 2x coverage: every nonzero original alpha within the original floor+24 protected region is reserved, expanded by **0.5 source unit**, then traced as exact pixel-cell geometry with only collinear vertices removed. The scope is source x8..42/y986..1030. This produces one 20-vertex contour. A single nonzero complement path is used, avoiding resolution-dependent morphology/filter evaluation. Paint images and original paths are not edited. This protects the whole joint edge, rather than special-casing the two failing screen pixels.

The new additional clip is `source-side-aa-complement`. It wraps only the preexisting side-underpaint group, not the original source or entire new lower material. Original collision, source foreground and runtime code are untouched. Existing mask/filter definitions in the study have NOT been declared compatible with game VectorArt; actual Scene integration remains separate.

## Local verification, not a Chrome success claim
Native re-render: all five views have zero original opaque protected changes. Source-contact raw protected differences drop434→331; all remain inside the existing gap, with zero outside. Left38,367 and right37,681 samples remain alpha255 and connected. Source foreground is now less underpainted at its partial-alpha boundary; Chrome and visual review must verify the conservative seam does not introduce an unacceptable hairline.

The checker additionally reports `firstOpaqueFailures` coordinates. Its thresholds, allowed gap, original-opaque equality and support assertions are unchanged. No new workflow or permissions are required. Re-run the same normal Chrome CI. Do not call this fixed until that result is inspected.
