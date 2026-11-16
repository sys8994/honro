# Stage43 verification checkpoint, not a release

All stage43 candidates remain unapproved. Original architecture, original source SVG, collision and public assets are not changed by this checkpoint. Prior contact-studies-v3 was visually rejected as a hanging group; preserving it does not imply approval.

The attached audit separates raw tracing, optimization, artistic filtering, serialization and engine import. Earlier spatial partition increased parsed segments and path objects and is rejected under the nonincrease constraint. Counts are proxies, not measured editor control-node or tessellation-face counts.

A no-partition central-field test keeps 8 color paths, 97,185 parsed segments and 3,811 subpaths. Source-coordinate import with existing dParts limits and one native scale transform succeeds without enlarging budgets. Filtered SVG 1,439,224 bytes becomes compact SVG 809,065 bytes / JSON 810,866 bytes. Absolute coordinates are rounded once to a 0.1 source grid, relative commands calculated from those rounded endpoints. Normal/double Inkscape render alpha difference is zero. This is precision normalization, not lossless geometry or artistic approval. See exact report and hashes.

Whole-geology visual context still fails: original side boundaries remain visible, side/central rock scale and deep-field scale differ. White gaps at original side boundaries were removed in a separate backing-mask test, but this does not resolve style mismatch. No master merge, build, Pages publish, or claimed browser validation occurs in this checkpoint.
