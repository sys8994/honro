# Hwigyeom low follow-through revision 014

## Observed defect

The frozen 8e80d306 runtime passed positional and rotational grip checks, but its follow-through never lowered the whole arm. At the S00 cut (+75ms) the wrist y was196.5; at authored follow phase.69 it was207.0 while the pelvis was243.6. Only10.5 units of hand descent occurred and the hand remained36.6 units above the waist. The actual S07 seventh cut remained in the high impact pose from+675ms until+835ms, then returned to idle without a low finish. This was a missing whole-arm endpoint, not a blade-angle problem.

## Narrow correction

The shoulder, elbow and wrist now move together after the unchanged impact. The low wrist reaches y286.8,41.1 units below the waist and approximately42.6% of the waist-to-knee interval. The elbow is lowered, the arm extends alongside the body, and small chest/shoulder settling accompanies the hand. Fixed transverse grip and v013 head95%/body105% remain intact. Phase.69 to.78 holds the low finish before recovery; clip duration and release event remain unchanged.

S07 retains compact intermediate cuts and all original damage events. Only the final cut enters a separate presentation tail through the same low endpoint. Odd/even last-cut orientation is preserved at entry. S02 retains its200ms cut-delay snapshot after meleeAction expires, preventing the rendering phase from suddenly using the ordinary75ms delay. Body-rush recovery keeps the existing continuous entry and is checked for blade-ground clearance. None of these controls writes engine actor, damage, projectile, hitbox or physics data.

## References: what was actually verified

1. Huang Hanxun, Yan Qing's Single Saber (1956), sequence8a–8d:
https://brennantranslation.wordpress.com/2018/12/23/yan-qings-single-saber/
The original8c/8d photographs were opened and visually inspected. The hand moves from above the head to a low position near the hip, with both upper arm and forearm lowered. This is a storing-position sequence, not verified evidence of a post-strike follow-through. It supports only the low arm silhouette; no timing or Korean hwando reconstruction is claimed.

2. Fu Zhongwen, Yang-style Taiji Saber (1959), MAIDEN WORKS THE SHUTTLE, photographs27–29:
https://brennantranslation.wordpress.com/2014/01/17/yang-style-taiji-saber-according-to-fu-zhongwen/
The source explicitly describes a rear preparation, downward-forward cut, and horizontal recovery. The photographs were opened and inspected. Its cutting hand remains near the upper abdomen, not the thigh. It supports the preparation/cut/recovery order, not the exact low endpoint requested for this game.

Both are Chinese single-saber references rather than Korean hwando authentication. No video playback or measured motion-capture timing was verified. The thigh-side endpoint and timing here are a requested game-animation design choice informed by those limited observations.

## Evidence and regression

Production Native Canvas captures use actual Engine.fire/tick for S00, S02, S07 and S01 in both directions. Record waist-relative wrist/elbow height, low-point hold duration, blade-ground clearance, fixed grip rotation/gap, exact impact coordinates/times and per-frame continuity. Include odd/even combo endings and charge-cancellation recovery. Baseline and candidate sources are frozen separately; current delivery is a same-time+275ms comparison and original-speed GIF. These are not browser screenshots. Master/Pages deployment remains a separate outcome from source preservation and Library backup.
