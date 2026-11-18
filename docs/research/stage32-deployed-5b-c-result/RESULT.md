# Final latest5b versus integratedC: actual cost evidence

CI44286626081 SUCCESS at research8466f504e1fa0d0c0e646cc1ea7f1acd16e17ad1. Artifact14420695928 ZIP SHA25636de8785fccd88465c6b41146e1966b296be8b85dcb098b5d1e44d590bc26584. Baseline5b2edf0b868a6f4ab656574b036586304eb12808 (last known successful Pages44280132384; notliveHTTP verification). CandidateC dbb25e21e075a495581ddaf8e2c0e615fe2e621e with helper8c8fd33f/pilot636. Each ownofficial Workshop/Game build/runtime, no helper or battle substitution.16captures completed, local checker rerun passed. SUCCESS denotes test-contract completion, not performance approval.

## Same-run paired results, milliseconds
|condition|cold median5b→C|horizontal pan median/p95|vertical pan median/p95|
|---|---|---|---|
|desktop.6cached|58.15→139.50|2.20/3.30→2.20/3.20|2.30/2.60→2.30/2.80|
|desktop1.65native|2.00→21.20|1.00/1.70→16.80/19.10|1.20/1.50→12.15/17.40|
|390×696DPR3native|1.85→34.45|0.80/1.10→29.80/30.60|1.00/1.30→19.65/30.00|

Percondition n10cold and60peraxis (twoABBAblocks). Vertical includes15up+15down in eachblock. Candidate horizontal/vertical max desktop31.9/29.2ms, phone-sized42.7/41.5ms. Cachedhorizontal maximum33.7→67.3ms even though medianunchanged. Firstsubmission desktopcached148.25→329.6, desktopnative50.15→44.1, phone-sized51.3→59.65ms. Firstnative improvement does not negate sustained movingcamera cost.

Actual separate120rAF horizontal callbacks: desktopmedian gap16.7→33.3ms, p9516.8→33.4; phone-sized16.7→50.0, p9533.4→50.1. Submitmedian desktop.85→15.4ms, phone.8→27.1. Finalreadback outside timing desktop13.2→12.8ms/phone19.1→14.4ms. These are CIChrome scheduling andsubmission results, NOT actualphoneCPU/GPU or presented FPS. No perframefullJSON orreadback duringrAF. Large earlyoutliers exist in bothrelease schedules.

## What was verified
Nodepreflight32source changes are only documentedvisual links/compatibility;5b's ownoptimizer reproduces candidate rawcloneexact, raw25metadata preserved. Bothmonster-scale modules exact. Browser pre/postEngine32physics/units, sourceclips/pathcount, owncodec, purity/storage andactualcameras pass. RawpathSHA deliberately differs and is connected to independently executed5b optimizer proof, not normalized renderer input. Stage3source same but referencedart differs with separate intendedStage3integration; not a32physicsfailure.

DPR proof succeeds after the same-backend oracle correction: bothphone runs windowDPR3/backing1170×2088/bodymatrix4.949999928474426 exact; desktop1.649999976158142 exact. Actualmatrixmatches independent sameCanvastransform sequence all6components, not a tolerancewaiver or forcedrender transform.

Nonvisual runtime differences remain explicitly inventoried: compactpackages, encounters, vectorart, renderer, act2spatial, terrainreadability, stage30ferry, act3handoff, earlyencounterplacement and stage33/34/37/38 helpers. Sameinitial32numericbattle does not certify all future gameplay behavior; broader integration tests remain separate.

## Memory and vertical motion
FreshC final helperlogicalbuffers desktop5,515,672B, phone13,132,088B; baseline hasno32helper. Bothnative routes SS0. Horizontal has0ROIresizes; vertical30has21desktop/19phone, passingthrough1×1anddifferentROIheights. Therefore verticalresize was actually exercised, not merely requested. Dimensions are captured perframe; helper totals do not equal entireScene/native/GPUheap or lifecycle-release proof.

Directly inspected originaldesktopmaximum before/after PNGs: old separatebluefoundation/brown/gray panels versus intended continuousgraymaterial; newart is not pixelidentical oldart. This experiment does not reapprove allqualityviews. The runtime continues to preserve original sourcegeometries/physics while using a costlier materialpipeline.

## Judgment
Earlier7ca→targetROI savings are genuine but not equivalent to no regression against deployed5b. C is substantially more expensive for nativepan, especiallyDPR3, and cachedcold; rAF evidence corroborates sustainedcost beyondsubmission-only concern. No agreeduserpan/p95 numeric threshold exists, so none is invented. Do not labelthis a performancepass or ship solelybecauseCIgreen. Finaltradeoff/redesign decision must consider these measuredcosts and device scope. No newsourcechanges or remote deployment in this analysis.

## Further repeated-work diagnosis (no new experiment)
Per axis60native frames: everyframe materialrasterizations+1, hits+2, materialresize0, Sceneworldrebuild0, SS0. Thus material shares within each FOUNDATION/BODY frame, not across translated camera frames. HorizontalROIresize0 stillcosts16.8/29.8ms. Vertical two-block totals42/38ROIresizes yetlower12.15/19.65ms asROIshrinks; resizealone is not demonstrated dominant. Currentcounters cannot separately time material/25path target/copies. Nativejunction submissionmedian0 does not mean deferredGPUcost0.

Bounded worldaligned tiles/strips could reduce repeated staticwork, but16worldpan shifts26.4desktop/79.2DPR3devicepixels: fractionalphase changes, so nativecurveAA/premult alpha/gutters/seams and48MiB budget need explicit proof. Do not cache the current complete targetROI blindly: it begins by copying current scene canvas, so a saved bitmap can freeze background/time/preceding layers. Static foundationmaterial cache alone is safer but leaves target-path/copycost. A separate transparentcorrectionplane needs correct algebra/compositing order rather than lower quality orDPR reduction. No cachingcode ornewCI implemented in this analysis.
