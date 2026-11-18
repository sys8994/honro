# Actual12 source experiment: original failure retained

Run 44268810252, research commit 3bb7511e. Artifact 14411961285 SHA256 cc47516e853297585703c168ed8b7c97e0fd7d82853dd086794df5c86ef2d458 independently downloaded and verified. Twenty-four captures completed. Production unchanged.

Seven cached camera views are whole Scene and transparent terrain RGBA exact. Three live views eliminate SS calls and retain Scene/terrain alpha and exterior RGB: native-walk 1024 changed Scene pixels, maximum 353, renderer-above 518. These changes are not all accepted solely by those tests.

The original final check FAIL is retained: native-walk visible-oracle grass changed518 and pale17. Raw full255 loss is zero and road changes zero, with all three roles positively represented. Subsequent source inspection found the visible model clipped only the non-transition protected fill branch. Native-walk uses wholly-above-split (`split===cv.height`) and its model therefore remained raw. A separate three-view test corrects all four protected solid-fill sites and requires twelve PNGs/RGBA hashes identical to this run. Until that result, the model failure remains unresolved. GEOS visible-role model is not universal original foreground-contribution proof.

Capacity probes at 390×696 CSS DPR2 (780×1392 actual) and 1920×1080 DPR1 preserve old Scene/terrain exactly and old positive SS call counts with transition-pixel-cap reason. This establishes safe fallback, not adequate high-DPR art support: native/internal correction remains skipped above the original cap.

Direct actual image review: maximum baseline/candidate retain the repaired long gray join, large grass tips, and broad tonal boundaries. Native-walk retains bridge, road/steps and actors; preexisting pale diagonal remains in both, not a new failure. Renderer-above faint upper contours also occur in baseline-above; the existing cached/native sampling difference must not be mislabeled as a new candidate pop. Cached/capacity overview images preserve layout and silhouette, consistent with their exact hashes. This is bounded visual review, not complete gameplay or frame-rate acceptance.

Clean timing evidence is a separate CI/worker result and is not inferred from this capture run. Candidate still requires corrected nonvacuous foreground-model results, acceptable real frame pacing, high-DPR quality solution, integration/lifecycle/save verification and final release review.
