# Corrected protected-solid-fill tag model: three live views

Test-only follow-up to actual run 44268810252, artifact 14411961285 (SHA256 cc47516e853297585703c168ed8b7c97e0fd7d82853dd086794df5c86ef2d458). Original run remains failed: native-walk visible grass 518 pixels and pale 17 pixels. Those matched raw counts because its `split===cv.height` solid-fill branch did not receive the model's visible-role clip. Maximum and renderer-above instead exercised the already instrumented originalOnly branch.

The corrected visible model instruments all four exact protected solid-fill statements: non-transition/road, wholly-above-split, upper portion of split, and empty-band fallback. Four matches are mandatory in each unchanged helper. Raw primitive model is untouched. The GEOS visible-role clip remains a finite classification model, not a proof of universal original-layer contribution equivalence. Both tag arms omit nonlinear SS. Original raw partial-contribution changes are retained, with full255 loss and alpha strict.

Only maximum, renderer-above, and native-walk are recaptured, baseline and candidate (six pages). Whole Scene and transparent terrain PNG SHA256 and raw RGBA hashes must equal the previous actual run for all twelve images. Camera, source25, physics and runtime provenance also remain exact. Candidate/helper and pilot are unchanged. Prior seven cached and two capacity views are not rerun and remain separately attributed to the first run; no fictional single-run all-pass claim.

Local syntax and 1331×763 native-walk model construction smoke passed. Actual Chrome/model/visual acceptance remains pending. No production registration or performance/FPS acceptance. High-DPR fallback remains exact but existing art capacity limitation unresolved.
