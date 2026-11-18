# Native budget actual evidence, bounded functional acceptance

Research candidate8c8fd33f (base230b immutable), run44279550948 on65f3610. Artifact14416233563 verified ZIP SHA2565b14e61d0536086331ec0ce3589c4aae0d139f3d5afc3c53a1021f0d65a05a09;39 original metadata/PNG inputs pinned.

Original CI is FAILED, not relabeled success. All13 Chrome captures completed. The only assertion failure was assuming original capped fallback always executed SS. PhoneDPR3 also hits original coherentColor low-band1MP cap: actual1170×1370=1,602,900pixels, so originalSS calls0/skips2 is correct. D2/1080 bothcalls2/skips0. Separate recheck uses the original general cap formula (world1420..1716, clipped to backing dimensions), not a per-device exception. Original helper/tests unchanged. No browser rerun is necessary; local exact-artifact recheck passes all5pairedviews and retained-cache roundtrips. CI failure and local recheck remain separate provenance.

All5candidate/reference fullScene and transparentterrain RGBA exact. Reference is TEST-ONLY230b with8MP transition cap, not previously approved highDPR product. Source/physics exact, raw/visible role tags exact to that reference, actual requested DPR/backing dimensions and BODY CTM positive. Standard cached/native controls exact; sameScene cached→native twice remains repeatable, nativeSS increment0 aftercached, no manualclear in that sequence. This is not official App stop/start lifecycle.

HighDPR actual positive correction and helper logical bytes:
- phoneD2 780×1392:5,837,528bytes; ROI780×479.
- phoneD3 1170×2088:13,132,088bytes; ROI1170×718.
- desktop1080 1920×1080:11,612,168bytes; ROI1920×432.
All below48MiB after cleanup; color/body1×1, SS0. Not physicalGPU/process peak; preexisting retained highwater and oldfallback allocations are outside this guarantee. 4K nottested or supported by this evidence.

Direct visual review of all3oldfallback/candidate pairs: long central and lower green asset-seam traces are removed; large grass tip and gray/brown authored shading remain. No newly amplified yellow-green line observed. Faint authored contours remain; no claim of removing every original line. Oldfallback→new corrected changedpixels49,792/108,568/165,047 withmaxRGB32/31/39 respectively, intended activation of previously skipped composition. Scene/terrainalpha exact versus oldfallback. Oldfallback itself is not the desired visualreference; all these corrected outputs match samealgorithm cap-open reference exactly.

Bounded functionality and inspected art are acceptable for follow-up integration. HighDPR clean/rAF performance, official stage lifecycle release, final product integration and deployed7d performance comparison remain unverified. No production/master/Pages update occurred in this unit.

Reproduce: python verify-inputs.py <original-extracted-evidence>; python recheck.py <same-evidence>. Original files are not rewritten except creating a separate comparison.json output. An optional draft checker-only workflow is deliberately NOT in the manifest; no CI run solely for a green badge is requested.
