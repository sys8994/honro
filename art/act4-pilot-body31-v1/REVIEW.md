# Stage-specific rooted BODY source

Candidate only. Generated using the actual three v4 R1 solid occupancy guides
and the accepted flat palette direction. Each body is drawn at its own native
aspect ratio rather than stretching a shallow reusable ledge.

Root visual review: full-height broad folds/roots and thin top moss are preferable
to the rejected vertical icicle stretch. Generated positions differ from the guide;
assets must be extracted independently and placed from reviewed contact anchors.
The center body's small internal green patch is NOT a gameplay ledge. Remove that
false walkability cue as an explicit vector art edit, not an optimization claim.
Final physical side contours and protected movement corridors require review and
an independently validated non-walk-body collider revision if they differ.

## Native extraction and source-specific contact reconstruction

Raw `body-traced.svg`: actual Colors8/stack/removebg/default2/1/.2. Whole-contour
region assignment: west105/court328/east293. Source remains unchanged.
Root approved annotated upper moss endpoints [87.6,334.37], [574,881], [985,1508].
Profiles are remeasured from native filled union (including subpixel paint rims),
flatten .015/source, sampled vertical reduction .04/source. These local tolerances
are not final CSS acceptance; actual fitted source/world/zoom must be checked.

Run extractor with extraction.json; native-union.mjs and inspect-visible-paints.mjs
for each raw.svg; refine-body-contact.py; revise-body-green.mjs; quantize .005 and
import-svg.py using each asset-config.json. Intentional color revision retains
actual visible green in a top-specific ROI, recolors side/base rims and court's
false middle green cue blue. Native outer silhouette is unchanged. A fail-fast
path identity check prevents XML attribute order from silently skipping repaint.
Before/after pixels must still be viewed; no zero-error optimization claim.

First v4 candidate fit depth/horizontal scale ratios: 1.071,1.019,1.053.
These are near-natural proportions, unlike the rejected common-module stretch.
Exact filled boundary export is NOT automatic collision. Current visible BODY
outside collision and current collision outside art are both blockers until root
reviews silhouettes and geometry authors/retests a separate non-walkable revision.
