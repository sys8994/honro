# Matrix runner contract versioning

Old matrix runs invoked the historical four-buffer contract directly on a later7/5-buffer helper, so that step failed even when source tests/pixels were collected. Historical original file is unchanged. Runner now invokes current versioned suite: executes preserved historical4-buffer helper against historical contract, executes preserved1-buffer helper against originalv1 contract, verifies intendedcurrent-v1 incompatibility, then checks new5-buffer state/source/save/cache/caps/clear contract. No historical assertion or pixel threshold removed.

New matrix also demands byte-exact safe-band images in all5views, frozen13d images, original protected<=1380 gate, alpha0 and full-source oracle/packed-mask debug equivalence. Now provider/codec and build jobs can execute instead of being skipped after outdated allocation check. Research only, not performance/art approval.
