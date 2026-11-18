# Fixed minimum-CTM core: local preview rejected for art loss

Design prototype only; no runtime helper, renderer, SS or production modification and no Chrome CI. Existing independent original25path/apron Native source-only harness reused at0.05,0.0625,0.6,1.65. Native Canvas is not Chrome Scene correctness.

## Geometry

Original roles retained: natural nonwalk component, BODY/apron exterior and holes, visible protected foreground,49walk/road guard. Minimum-CTM0.05 margin18.1938181818source. Intersect with exact57KB exported polygon, then additional inward0.21 and topology-preserving simplify0.1, four-decimal export. Reconstructed exported geometry valid, outside min-scale safe area0, outside57KB area0; protected/walk/road overlaps0. Result19598bytes,1080vertices,37polygons; area10578.94682963 versus57KB25048.610393435. Geometry model remains flattened GEOS; unresolved original near-coincident owner mismatch is not proved away.

## Finite rendering evidence

|Scale|Changed RGB pixels vs original|BODY alpha changes|Background changes|9-point owner violations|
|---|---:|---:|---:|---:|
|0.05|354|0|0|0|
|0.0625|434|0|0|0|
|0.6|2812|0|0|0|
|1.65|3756|0|0|0|

At0.6 previous57KB corrected4779pixels; core retains2812(58.84%), completely loses1967. Difference2034pixels,maxRGB24. At1.65 previous5350→3756(70.21%), completely loses1594. Difference1626pixels,maxRGB19. Thus area fraction alone would misstate actual effect, but the measured visible correction loss is still substantial.

Direct full-size images show original fine green seams reappearing below grass, along the left silhouette and across the lower interior. These were specifically part of the repair target. The fixed-core guard withdraws native paint from the protected/exterior neighborhood where those authored boundary residues occur; it does not address the near-coincident source geometry/material ownership cause. More coarse guard is therefore counterproductive to that art goal.

## Decision

Reject this one fixed-core approach as the current art solution. Using one invariant coverage path could eliminate the helper binary0.6 enable pop, but it returns too much of the defect. No further scale-band permutations or broad CI are justified on this evidence. Continue the independently assigned original ownership/compositing investigation rather than reducing guard or ignoring protection failures. SS remains fully enabled and is not claimed redundant.

PNG evidence remains in stage32-geos-fixed-core/core-{baseline,candidate}-{scale}.png. JSON geometry, four proof reports and effect-comparison preserve measured scope. No performance or actual Scene gate-pop acceptance claim.
