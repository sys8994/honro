# Stage32 alternate boundary clip experiments: rejected

Baseline is13d671e3cc80a9e70ab0a299d45860094bfe3181, helper SHA256 aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953. All experiments are isolated on perf/stage32-boundary-clip-20261117. Do not integrate any experiment from this branch. Keep baseline production helper.

## Hypothesis and scope

The alternate boundary canvas publishes only integer rows below world1716. The experiment adds an identity-space lower rectangle clip solely inside its existing save/try/finally. Real-context original BODY pass, geometry, original25paths, road/grass colors, gradient and gray selection are unchanged. No global cache was added. Seven views and strict14PNG equality, original contracts and10cold/60warm/60pan CPU diagnostics remain required. Device-space clip can change Skia path antialiasing; reductions in cost do not override visual equality.

## Results

- 1bbe6e96c474fa2cee60e80cac9655fca54176d1: exact publication-boundary clip. CI44172011981/44172011963 fail strictPNG comparison. Desktop lower228 changed pixels max8; left195 max5. Five matrix changes34–123px max2–5. World<=1700 changed0. Cold p50 lower18.1/left16.5ms. Artifacts14368716241,14369160160. Rejected.
- 8d116e59111218e1b8ef823e773b9eeb761f78cf: retain64 device pixels above publication. CI44172992874/44172992892 fail strictPNG comparison. Lower exact; left13 pixels max1; protected0. Cold p50 lower28.1/left22.9ms. Desktop artifact14369545444. Rejected.
- 78a04bb36847871f415774f72e768fa72e2be354: retain128 device pixels. Helper SHA256 bb1fd1e057be4f8b3e7c9acec028231ca604ee8e141c7b359306cf9c82c74958. Desktop strict+officialbuild CI44173922054 succeeds, but matrix CI44173922046 fails. Desktop two and portrait two images exact; desktop-walk3px max1, landscape-bottom20px max5, landscape-overview21px max4 differ. World<=1700 changed0 in all. Artifacts14368199327 and14369816131. Cold p50/p95 lower31.9/32.3ms,left25.2/27.0ms; pan maximum21.6/25.5ms. Rejected because complete equality requirement fails.

No test tolerance was relaxed; no further padding search or production changes will be made as part of this experiment. This suggests clip-region-dependent raster antialiasing rather than source geometry changes, but is not a complete renderer-internal causal proof. Current helper2,947,392 logicalRGBA bytes and cold overhead remain unresolved, and baseline13d671e3 is the retained candidate. Public UI, real devices, gameplay and combined gray changes are not validated here. A future gray-compositing change must be tested independently and cannot inherit these narrow equality observations.

No master/Pages or user-save changes occurred. The original production branch was not modified.
