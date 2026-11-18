# Internal BODY/foundation seam, not a final terrain silhouette

This is a new art-scope hypothesis, not a production change. Earlier BODY-only alpha failures remain historical evidence. The user's protected final scene silhouette must not be confused with every internal overlapping asset boundary.

The actual maximum-view BODY matrix is world scale 1.649999976, translation (137.5,-2341), followed by source scale2.2. Along the visible long line, independent original BODY alpha goes from0 to255 across3pixels while actual final Scene is opaque gray on both sides. Original foundation asset, SHA dfd795239ee47aafda4865269280ec144645512d70ba81b8ccc079e554e31669, has nonplayEnvironment=true and its own preserved source-alpha-silhouette. Independently rendering it at its original world placement(-5500,-1950) produces [94,94,96,255] at all nine reported points. Actual Scene matches that color on both sides; the line adds unwanted green/pale mixtures.

Examples: actual pixel(276,300) is [101,102,85,255], with neighboring gray [94,94,96,255] and BODY alpha0/255. Pixel(241,490) is [100,101,87,255] with the same two gray neighbors. Source BODY boundary distances are .0233 and .00042, while visible-protected geometry is6.29 and59.42source away. These are samples, not a coordinate whitelist. Upper pixel(262,200) is only.24source from actual visible protected geometry and must not be included merely because the side colors match.

## Narrow candidate construction

1. Derive the true topmost gray foundation face from original path order and source-alpha clip, transformed into BODY source coordinates. Verify source fill-rule/approximation and keep a conservative margin from the final foundation edge and other materials.
2. Select the connected left BODY boundary contour in this internal gray face. Its contact with genuine foreground or another material supplies natural ends; a small artist-selected face scope is explicit, not a claim about all BODY edges.
3. Build one narrow continuous seam band, intersect foundation gray interior, subtract true visible grass/pale/road and real walk/road safety guards. Do not require the band to be inside BODY: crossing the internal asset boundary is intentional.
4. Paint the existing shared gray material once at the original BODY-order position. Original source descriptors and physical bounds remain unchanged. No new raster buffer, SS or readback.
5. Compare the final Scene, including final alpha/background/sky and actual foreground contributions. Report BODY-only alpha changes separately as intentional internal join coverage, bounded by the declared seam. Previous BODY-alpha strict0 is retained as a diagnostic, not silently removed.

First prove one connected visible seam on the actual maximum and left views, then low zoom/filter and transition views. Do not describe a remaining truncated line as complete. Current files are evidence and construction plan only.
