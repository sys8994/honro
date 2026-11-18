# J ImageBitmap transfer: correctness passes, no cost benefit

Actual run44308020085 SUCCESS, researchb21fa8028d6bc6fb2e7ff060278c6ccaa175ff24. Artifact14428942741 ZIP SHA25637fd3031ad06531ebd9c6a2b2b4f20bf2e6b07e6ac0169bd93a325889e460321. Candidate2e6af21851d8b12b4eec58138be49da2b5ffc5ba204adb0011a29f9f51a4ab80, original registered J6823. No production edits.

## Actual contracts
All18 paired frame images (two poses × first/cold/five pan/cached/nativeReturn) are RGBA exact, alpha differences zero. Real transfer support was used, not unsupported fallback: each page created9 images; after cached,created8/closed8/bytes0, after returningnativecreated9/closed8, after explicitclearclosed9/bytes0. Source/camera/physics/codec/storage contracts passed. Native logical budget and canvas+image reservation pass48MiB.

Native logical allocation increases4,062,224→8,124,436 bytes (8,124,444 after returning from cached with retained tiny scratch). The image adds4,062,212 bytes. Cachedlogical4,918,512 unchanged. This is helper logical ownership, not actual GPU/JS/native heap; explicitclear is not proof of normal App lifecycle release.

## Diagnostic costs, ms
Maximum: cold7.1→7.0; fivepan median5.1→6.2. Walk: cold8.0→8.0; panmedian5.3→6.6. Maximum pan sample pairs7.1/8.2,5.1/6.2,4.7/5.8,4.6/6.0,5.1/6.4. Walk11.3/6.6,4.8/6.1,5.1/6.7,5.6/6.3,5.3/6.7. Do not infer a benefit from the single original walk11.3 spike.

Each pan transfers one image. Transfer costs2.8–3.1ms maximum,3.1–3.4ms walk; close0.1–0.4ms. These are included in whole render, not subtracted. This is consistent with the earlier firstbitmap submission stall moving to synchronous transfer rather than removal of underlying material raster/flush work. It is not a precise GPU/raster-versus-upload attribution.

Single first renders47.1→30.1 maximum and34.0→33.1 walk do not establish startup improvement. Cachedtransition287.3→278.8 and383.5→369.9 are one-off diagnostic values. Per-frame readbacks perturb scheduling, so this small study is not clean ABBA or FPS acceptance.

## Recommendation
Do not adopt or expand to a large clean suite on these results: output and ownership are valid in the observed scope, but memory doubles and repeated pan submissions become slower. Keep evidence; seek reduction of sustained underlying material work rather than a different transfer representation. Original J's historical deployed-baseline performance failure remains unresolved.
