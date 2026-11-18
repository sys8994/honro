# Frozen original-SS visible-component diagnostic

- Commit: 8a7a071b81b70e584bd18ef88233f59b6e2d48d2.
- Actual Chrome CI 44250407121 completed successfully. Artifact 14403397421 ZIP SHA256: 1423104f888e8bb0c5ee0392ad51fc68a1255a79b18bd1f2702a41dc3564b144, independently downloaded and verified.
- Original RGB Scene capture matches the previous baseline PNG. All 380 original SS writes were collected without truncation and eligibility was frozen, not recomputed on tag colors. Field alpha and all four original high-resolution alpha samples satisfy the asserted opaque prerequisites.
- Original clip/bitmap/gray-subpath primitive replay with frozen SS decisions: grass, pale and road component differences are zero on all four tiles and the screen. Nonzero upper-domain baseline counts are respectively 2171, 1301 and 1034, so the equality is not an all-black vacuous result.
- All five raw-owner conflict samples lie in the fully supported upper filter domain. Their three distinct pixels retain grass contribution 11, 16 and 5. This supports classifying the observed RGB changes as gray-background changes, not detected loss of the declared visible foreground contribution.
- Independent binary tile geometry support contains all 571 actual changed pixels. The previous magnitude-mask failure at (287,379) is retained: magnitude rounds to zero but binary nonzero source support reaches that screen pixel. No changed-pixel-derived mask or RGB tolerance was used.

## Limits and decision

This is an original-primitive / frozen-original-SS **visible-oracle component model** using the declared .005-source GEOS visible geometry, limited to the upper solid-fill transition domain. It is not a universal continuous-geometry proof, and does not establish the lower gradient model. Original raw owner/magnitude failures remain in their historical reports.

No production helper, original source geometry, physics or save data changed. This resolves the targeted portrait-overview component-model question; it does not establish complete terrain art, performance, or release acceptance. Visible residual lines and the remaining views require their own classification. CI success is not an art-completion judgment.
