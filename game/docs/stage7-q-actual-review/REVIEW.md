# Stage 7 Q targeted actual Chrome review

## Verdict
Targeted attachment-seam repair accepted for progression to final integration QA, not final production or deployment acceptance. CI 44304341088 succeeded. Independently reran its protection checker against downloaded artifact 14428440449.

Directly inspected all four original normal Scene PNGs: baseline P and candidate Q at left-native and left-phone. P has a faint dark line crossing the lower cliff attachment, especially clear near physical phone y955. In Q this line is no longer visible. The large rock-face color divisions remain; they are not an open gap or the removed thin seam. No new visible sky gap or artificial cut was observed in these target views. The bright line above is the intentionally retained in-play root-floor readability rim, not this attachment defect.

## Protected scope and diagnostic exception
Both views preserve final BODY alpha, caps, actual Scene outside declared old/new seven-face union plus a 3-physical-pixel sampling guard, rim geometry/raster, and terrain/unit metadata. These exact checks remain independent of internal color exceptions.
Native direct BODY has 25 white-mask-zero RGB1 diagnostic samples within the explicitly declared one-physical-pixel boundary band of opaque nonwalk faces; phone has zero. Some pixel squares do not geometrically intersect the plane. Do not call all samples intersections or infer a proven AA-filter cause. They are separately recorded nonwalk raster differences, not an expanded alpha/foreground/gameplay tolerance. The historical P CI remains failed under its older zero-color-exception rule.

## Limitations and next step
This is an ACT4_RELEASE=1 / ACT5_RELEASE=1 pinned P-to-Q research comparison, not the official default production build. Direct BODY masks and actual Scene are distinct raster planes. The checker intentionally retains qualityAccepted:false until human-style review; this document supplies only the targeted visual verdict.
Latest-master simultaneous changes must be preserved. Final narrow integration needs default-build full Stage7 views, other-stage regression, save compatibility and performance checks before product acceptance. No master or Pages deployment is asserted here.
