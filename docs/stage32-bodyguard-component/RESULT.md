# Actual Chrome fill-model result, not runtime acceptance

Run44248478946 on9c2d1c951d0a1ef48b24235cff3c04d32aec1067 succeeded. Artifact14402587752 independently verified SHA2563e8bed55e82f0b451c1b2025b4b8d0c1c62e8b43cb29e2ac3e13369ea1d10b4f.

Grass/pale/road baseline nonzero pixels2566/1355/1034 (each max255). All four source tiles and the entire filtered screen preserve all three declared GEOS-visible components exactly. At prior raw-owner pixels grass tags11→11,16→16,5→5. No all-black vacuous pass.

Geometry-derived magnitude support still misses1 observed changed pixel. Independently computed binary tile support, subsequently resampled with actual numeric blits, contains all571 changed pixels. This preserves the historical magnitude0 finding while distinguishing nonzero support from magnitude; it is not an RGB1 waiver.

This is a **fill-based semantic diagnostic using the declared GEOS visible oracle(.005source)**. Actual nonprotected helper paint uses clip+fieldbitmap, not plainfill; existing SS uses original-RGB nonlinear eligibility. Thus this result cannot alone replace raw-owner5 with a claim of actual runtime foreground preservation. Original run44247043774 failures are retained and production stays unchanged. A follow-up must preserve real paint primitives and freeze real baseline SS decisions rather than recomputing eligibility on tag colors.
