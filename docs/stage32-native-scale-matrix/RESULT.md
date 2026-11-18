# Three-band actual Chrome result: partial protection improvement, not accepted

Run44230433550, commit8b8a4853db9c2c16915237df43c6f0f3d3a0bbc6, artifact14394453121. Archive SHA25689905fd611c7fe6b4191dab2e72569313758e0b97fb94a2dc87e73bac8fe6f02. All14 captures completed; source/codec/production contracts pass. Original7PNG goldens and prior left native/BODY hashes exact.

| View | Changed RGB pixels | BODY/Scene alpha | BG outside BODY | Forbidden owner samples | Domain failures |
|---|---:|---:|---:|---:|---:|
| lower |0|0|0|0|0|
| left |802|0|0|0|0|
| portrait overview |58|0|0|0|1|
| portrait bottom |54|0|0|0|0|
| landscape overview |151|0|0|0|0|
| landscape bottom |127|0|0|0|0|
| desktop walk |0|0|0|0|0|

The low-zoom raw-hole/apron owner and background violations in the previous static guard are gone in these seven observed views. Remaining failure is NOT silently waived: portrait overview pixel(120,379)blue113→114, no otherchannelchange. Independent exact curve radial-distance minimization (svgpathtools, original V2coverage) gives8.376022736sourceunits=1.056856986screenpixels to the closest curve. Existing domain gate permits1screenpixel only.

Independent Native paint-only tile raster(.0625world CTM,2pixelgutter,516canvas) followed by camera resampling(.057352941) produces maskalpha11 at this pixel. This supports, but does not establish in actual Chrome, a two-stage raster/filter footprint explanation. No arbitrary1.1pixel allowance or coordinate whitelist was added. The robust follow-up is an independently replayed actual Chrome paint coverage/filter mask, preserving strict BODY/Scenealpha, background, grass/pale/road owner and original data checks. Actual tile full-image gutter and rounded cache clip must match the real renderer, not a guessed enlarged domain.

Instrumentation invalidates performance conclusions. No SS removal or production acceptance. .6 band transition appearance and upper/natural seam remain unfinished. New3band helper remains test-only.
