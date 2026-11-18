# Narrow AA v2: stricter footprint and full logical memory experiment

V1 failed actual Chrome CI44218935681. This is a separate test-only correction, not a waiver of that failure or production promotion.

Changes from V1:
- Add the original BODY holes/exterior to the source-derived blocked region, rather than assuming packed blue255 proves actual filled geometry.
- Increase the source-defined protected-mask dilation from1 to2device pixels before changing RGB, protecting a wider final resampling footprint. The9-point original-owner final-image audit remains unchanged and must still pass. Known real grass exception retains exact protection.
- Keep the same two ROIs and8world-unit edge fade. No expansion of editing area or relaxation of visible grass/fixedgray ownership.
- Reserve existing material, transition and narrow retained canvases before sizing each SS stripe. Before low reads, shrink a stale oversized high canvas if its live budget would exceed24MiB. Track and assert all retained helper canvases plus currently live readback payload at SS and narrow phases. The earlier24MiB SS-only number was correctly documented and was not violated by this33.9MB whole-helper observation. The new whole-helper24MiB cap is a conservative experimental alternative, not an established user/product requirement. Added stripe cost must be weighed rather than treating this new cap as mandatory. This remains logical live allocation, not measured GPU/GC heap; unreachable readback allocations may physically await GC.
- At1.65x, test normal-grass as an art/protection closeup with repeated no-op images, not as a stable-cache benchmark. V1 original also rebuilt material there. Unchanged warm-no-rebuild benchmark gates remain on left/walk; their cold10/pan60 costs still compare same-run.
- Add three completed, identical-image no-op Scene renders before benchmarking in all views, with unchanged battle JSON. This is not a real App save/load/reload certification.

Local synthetic constant-field smoke:8canvases/clear32B/source unchanged; full1.65x1331×763 peak25,139,928B <=24MiB(25,165,824B),9SS stripes rather than prior3. That extra raster work may cost too much; actual Chrome and visual review decide. Native test is not accepted performance or visual evidence.

Baseline remains registered empty-stripe SS2. No production, Stage3, master or Pages changes. Exact original baseline left/walk images, alpha, world<=1380, true-grass exception, allowed ROI and raw-source ownership checks remain. A failure is not to be bypassed. A small local color improvement does not certify the remaining whole contour, especially outside the two ROIs.
