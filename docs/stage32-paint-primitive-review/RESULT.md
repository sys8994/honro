# Stage32 paint primitive diagnostic results

No production changes or acceptance. Original source/physics unchanged. Native source-only constant gray evidence is not actual Chrome Scene evidence.

## Failed approaches retained
- Opaque image pattern is not an alpha-preserving substitute for the original solid fill in the measured Native backend. Even uniform original-color pattern control changes678 alpha pixels at.6; extra gutter does not fix it. Rejected.
- Repartitioning only the distant isolated source13:17/source17:22 duplicate contour into remainder+selected fills changes remote RGB with original colors:1/25/57/111 pixels at.05/.25/.6/1.65, max2. Raw protected sample failures0/15/26/4. Geometric disjointness does not prove raster equivalence. Rejected as proposed.
- Initial broad source-atop failure report `alpha=1` meant one changed pixel, **not one level**. Actual alpha differences are203→201,233→231,237→235 at.05/.25/.35. These lie within.20/.24/.33device of original BODY boundary. They cannot be relabeled harmless opaque interior quantization.

## State-path isolation, not a tolerance waiver
An isolated original contour was repainted immediately after its original solid compound fill. Adding save/restore under the existing AA apron produced changes1200source away from the target, including alpha227→226. Removing only the extra state stack round trip and explicitly restoring fillStyle/composite operation eliminated those non-local changes. Source-over and source-atop were both affected by the stack variant. This suggests backend clip/state raster behavior; actual Chrome diagnosis is still required before claiming cause or adoption.

The exact browser-function Native test in `stage32-buried-probe/native-check.json` compares baseline/original-color no-op/gray-save/gray-manual at7scales and checks independent selected-path support and tagged exposed grass/road/pale. Manual isolated source-atop has16..634 changed pixels, alpha/background/outside-support and all three protected tags0. It reduces one right-side closed green contour but does not fully remove its line. All other long seams remain incomplete.

A larger prior mask with explicit state restoration was also measured separately: alpha/BG0 at7scales,658..8604 changed pixels. It still has raw-owner125/13 failures at.05/.125 and2 at1.05001. It also removes per-source clip, so its semantics are approved gray-region repaint, not a claim that only individual grass contribution changed. Independent GEOS-visible-tag Native checks have exposed grass0, road0 and exposed pale0 at all7scales. Full raw pale underpaint tag changes34..193 pixels, which includes intentionally gray-covered pale AA. These are distinct quantities; no generic RGB/alpha waiver is introduced. Lowzoom raw-owner conflicts still require classification. It is not included in the isolated Chrome package and is not accepted.
