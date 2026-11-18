# Actual first internal seam: partial visual improvement, support diagnostic failure

Commit47a20a77549cffdbd3a081516cf8451163bfddb7, CI44252479563. Artifact14403743942 was independently downloaded and ZIP SHA355ca3897c2ef6a958a5916d14adff54c4c64ff76459c67d75a06d37257e8be5 verified.

All four actual Scene captures and original contracts succeeded. Comparison failed only outsideDeclaredSupport:2 atgray-left/.6 and6 atmaximum/1.65. RGB changes845/1232. Scene alpha0, transparent original foundation+BODY union alpha0, BODYalpha outside independent directband0, oldterraintransparent0, visible9samples0, realwalk0. Intentional internal BODYalpha changes were576 at.6 and4001 atmaximum; these are not final terrain silhouette changes.

Actual maximum inspection confirms middle vertical leakage improves; upper and diagonal residual lines remain. This is not full art or production acceptance.

The support implementation was inherited from the earlier clip+bitmap correction and used clip(coverage)+fillRect. The new seam uses fill(coverage). These AA primitives need not match. Maximum's six raw failures have independently rendered same-camera solid-fill support alpha3..7. All eight observed RGB changes are within one channel step of opaquegray94,94,96, but no RGB tolerance is granted. The next immutable-artifact replay will compare the appropriate primitive and retain/reproduce the original2/6 failures.

Original source/physics and the production helper remain unchanged. Full failure details are preserved in actual-comparison.json.
