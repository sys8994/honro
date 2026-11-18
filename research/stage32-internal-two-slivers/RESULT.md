# Local joined gray seam with two explicitly reclassified microfaces

This is an intentional art-scope change, not a claim that the original pale/grass components never existed. The two isolated nonwalk internal microfaces are:

- Original topmost pale path1: bbox[34.496094,698.29492,35.746094,707], area.0947758288source². Original cubic winding confirms path1 at all5 sampled cross sections. Source-only Native pale tag has42nonzero pixels,max23/255 near this face atmaximum.
- Original topmost grass path12: bbox[40.470083,718.904246,45.647782,721.811295], area.1088183931source². Original cubic winding confirms path12 at all5 sampled cross sections; widths.0197~.0528source. Source-only Native grass tag has75nonzero pixels,max59/255 in its vicinity. This is not a runtime-frozen-SS tag proof.

Both are separated from the large exposed grass/roads, inside the original foundation gray face and far from real walk/road geometry. Their contribution is deliberately changed to original foundationgray9 #5e5e60, while all other visible geometry remains protected. Original25paths, physical bounds and save data stay unchanged. These two component geometries, not a screen-coordinate whitelist or a global color tolerance, define the exceptional art scope.

The continuous cover is4138bytes,1component,area3081.63322475source². It fills the old internal BODYguard gap plus the narrow outside-BODY join. Its intersections with the two authorized faces equal their full areas. Other visible overlap0, walk/road overlap0, outside original foundationgray0.

Local original foundation+prior26782 helper proof:

|View|RGB changes|Terrain union alpha|Previously transparent terrain|Raw visible samples|Other visible samples|
|---|---:|---:|---:|---:|---:|
|max1.65|1193|0|0|24|0|
|.6|402|0|0|1|0|
|min.05|34|0|0|0|0|
|phone390x696/.05735294|36|0|0|0|0|

All raw visible changes were retained and classified against the two exact allowed component geometries. The integrated helper matches an isolated reference paint byte-exact at.6; no extra runtime canvas, readback or SS. Actual Chrome is still pending for this combined candidate.

Visual inspection: the targeted long middle seam and its small upper gap are clean. Other faint lines remain near the top of the maximum view and bottom-left. The selected face box and conservative original foundationgray margin may explain some; they are being classified, not hidden. This is not complete Stage32 art or release acceptance.
