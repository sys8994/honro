# Rejected continuous correction-plane prototype

Actual CI44240542288, commit12a78a6803003abd38616582c4641e389b59b2b7. Artifact14399685683 download ZIP SHA256a61abe93f61c30ed484b870a70d69c1e75ea434d1d92969345b667aed57f3809 matches GitHub digest. Six captures finished; endpoint quality gate failed. No production files changed, and no fade/performance expansion was run.

Weight0(.25): wholeScene and transparentBODY exactly equal standalonelowcore. Original-production comparison2287 RGB changes, alpha/BG/9owner/walk/support violations0.

Weight1(.6): transparentBODY exactly equal standalonefull57KB, but wholeScene differs9268pixels, maxchannel7,57pixels above3. Original-production comparison17971changes, alpha/BG/9owner/walk/support violations0. The endpoint is FAILED, not waived because protected counts are0. Native source-only endpoint equality was insufficient evidence for actual filtered tiles.

Filtering separate correction and background planes and then compositing is generally different from compositing inside a tile and filtering once. Later-static-object occlusion also remains a structural risk. Neither is proven harmless. An independent full-tile path would have to reproduce the standalone endpoint before a broader experiment.

Extra correction storage:6planes/6,390,144bytes at.25;9planes/9,585,216bytes at.6. Observed build times2.8/4.4ms and compose0/1.5ms are instrumented component totals, not clean wholeScene cost. Clear released allplanes/bytes in this fixture. SameScene reuse after helperclear remains unverified and would require coordinated cache invalidation. Additional rendererMemory fields were prepared locally after this commit, not present in this artifact.

A subsequent local source-only complete-image source-atop blend preservedalpha but changed unchangedinput RGB by rounding (e.g.396911pixels atweight.25, maxRGB1 onopaque pixels). This cannot support an unchanged-foreground claim. Such whole-image blending is rejected absent a mathematically and empirically protected implementation. No arbitrary1RGB tolerance is introduced.

Stop this engine-plane line for now. A simpler paint-only source operation is being tested: suppress only authored grass paint already hidden beneath later gray inside the declared nonwalk gray seam, retaining immutable original paths/physics and independently testing true visiblegrass/road/pale contribution. It is not accepted merely because it avoids allocations. Existing upper/vertical residuallines and zoompop remain incomplete.
