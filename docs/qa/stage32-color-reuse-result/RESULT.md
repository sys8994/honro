# Consecutive-color reuse: actual exactness passed, performance unresolved

CI44266135563 success, research d0074ad85756391f8d6411fe48460cf2c9966069; product source remains126a2b56. Artifact14409833920 ZIP SHA25689cb2fc3905bcf8aef50915dc521e32a93930991246619ebc61738e19d93fcec. Six actual Chrome pages used own registered source runtime, copied helper substitutions only, no Canvas instrumentation or full build repeat.

All3poses match registered control exactly at first, cold and each5pan frame (21RGBA comparisons), plus3finalPNG comparisons. Source, initialized battle, camera, own-version save and storage gates pass. Unlike rejected staged clipping, no observed moving-frame discrepancy.

Diagnostic cold control→reuse(ms): .6 152.9→129.1; portraitminimum66.2→66.0; maximum124.1→108.6. Maximum5pan median109.9→110.8ms, so this trial does NOT demonstrate moving-view improvement. Five samples, fixed variant order and readback/hash after frames are insufficient for clean performance acceptance. Large livepan cost remains approximately100ms, far above842's earlier clean baseline. Do not compare absolute diagnostic numbers directly with cleanABBA or call this solved.

Retain as a small exactness-supported candidate that avoids redundant consecutive-color recomposition without new canvas/memory. It is not production-registered or release-approved. Structural SS/raster/compositing work remains necessary; a final selected candidate needs9view regression and clean whole842 ABBA. No blind SS removal, geometry weakening, or reuse of the failed clipping optimization.
