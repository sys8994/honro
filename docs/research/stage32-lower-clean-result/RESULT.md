# Target ROI actual clean cost result

CI44276792209 SUCCESS; research96915d2a2ece20ac7c050bdb5808c42d536c5c68. Artifact14416230059 ZIP SHA25695874916096b6772ae15ff2dc68027e35369375e63dcfaaab5b8fd44f7f4f25f. Source126 copied-runtime preview: control7ca vs target230bb60b, pilot636 both. Production unchanged.

Same-run maximum pose ABBA clean: cold median40.85→20.65ms; pan34.05→15.55ms(-54.33%), p9537.6→17.7, max51.9→19.4. Pan blocks35.6/32.0→15.5/15.6; first71.2/60.4→42.1/42.7. n10cold/58steadywarm/120pan per variant, warm0.5ms both. These paired data support a substantial improvement over7ca, not a final approved performance threshold.

Separate120rAF scheduling: median gap49.9→33.2ms, p9550.1→33.4, max316.7→283.3; gaps>50ms15→1 of119. Submission median31.3→13.9ms, p9536.4→15.9. Loop wall5176.2→3049.6ms; final readback12.0→12.2ms outside timing. No perframe full-battle serialization or pixelreadback. This is headless Chrome scheduling evidence, not phone/display FPS or GPU-completion measurement.

All6 capture/source/Stage3/physics/initialization/save/storage contracts pass. Local checker rerun passes. Samevariant repeated resetPNGexact. Crossvariant changes53784pixels maxRGB3, alpha0; rAF endpoint hashes differ as expected for the explicitly changed lower composition. There is no false wholeRGBA claim and no every-pan art-validation claim. Directly inspected candidate initial view shows gray interior/grass-edge/stone region, without the rejected bdb9 bright seam; actual4 quality evidence is pinned separately. PNG resets camera; finalrAF hash is distinct endpoint evidence.

Fresh-helper final logical allocation11,052,624→5,515,672bytes. Control transition buffers1331×275 twice +1331×763; candidate1331×273 once +two1×1 buffers. SS0both. The old twoROI memory proposal is not the final oneROI target structure. Fresh-instance result does not prove cached-to-live releases retainedSS/staged buffers, nor totalScene/JS/native/GPU peak.

Limitations: final actual deployed-baseline comparison remains necessary.842 is the historical comparator, NOT a verified current Pages SHA; wording 'Public842' in frozen test output is superseded by this clarification. Root is resolving actual deployment. No source-normalization substitution, highDPR art acceptance, stage lifecycle memory acceptance or deployment claim. Exterior evidence is separately tracked by the art reviewer; no additional arbitrary camera test is inferred here. qualityAccepted/performanceAccepted remain false in machine report pending the broader final checks.
