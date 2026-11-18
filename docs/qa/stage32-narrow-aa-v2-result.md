# V2 actual Chrome: rejected, not production

Commit d146db4b647c6d28e20b8d29f711a8fa6d7f7b90, run 44220628918, artifact 14391065870.

All six captures, native/source/codec checks, three repeated no-op Scene renders and full-memory measurement completed. Independent source ownership failed. Left: 587 changed pixels, zero alpha/road/normal/outside/owner violations. Walk: 352 changed pixels, 97 protected path1 sample violations. The 1.65 close view additionally differs in genuine-grass pixels outside the two correction ROIs; e.g. (272,103) RGB123,130,54 to124,130,55. This is an unrelated raster change from the experimental full-helper memory budget changing SS stripe boundaries. That alternative is rejected.

The existing 24 MiB contract explicitly covers SS scratch+readback, not all helper canvases. The observed whole-helper total around33.9 MB is separate telemetry, not a violation of the historical contract. V2 achieved25,144,952 logical bytes in closeup, but byte equivalence is more important than inventing a new product cap.

Same-run left cold128.8→132.8 ms, panmax71.7→74.5; walk156.4→166.7, pan69.4→71.8. Narrow correction initial cost3.4/7.0 ms, closeup9.5 ms. These are single-run prepared-source desktop Chrome measurements, not phone60fps certification.

Direct full-image review: left hue is slightly reduced along the lower central thin contour, but that contour remains visible, as do lines outside the two ROIs. 587 changed pixels is not full art acceptance. V2 is not registered.

Next isolated V3 restores original SS stripe behavior exactly, reports full bytes separately, and adds raw original path1 plus two-device-pixel guard without Boolean subtraction. This can conservatively suppress all arch corrections; such a no-op is a negative art result, not a pass for line removal. All alpha/geometry/source-owner/normal-grass/ROI checks remain mandatory.
