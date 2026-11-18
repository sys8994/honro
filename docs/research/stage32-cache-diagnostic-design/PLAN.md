# Stage32 cache diagnostic design (inert, not CI-ready)

Control: integrated C dbb25e21e075a495581ddaf8e2c0e615fe2e621e, helper SHA256 8c8fd33fc74ea89cca7895d01bd96b6a0928330b3b531a3c55671a181d3bbdc2. Public comparison: last verified successful Pages source 5b2edf0b868a6f4ab656574b036586304eb12808, not a live HTTP byte assertion. No selected cache prototype or product edits in this package.

## Established cause, not an inferred GPU profile
CI44286626081: every native pan frame rerasterizes foundation material once and hits it twice; SS calls remain zero. No material canvas resize. Horizontal target ROI resize is zero yet costs 16.8ms desktop /29.8ms DPR3 median. Vertical ROI resizes occur but shrinking ROI costs less, so allocation alone does not explain the regression. Native submit counters near zero do not measure deferred raster completion.

The material key includes context identity, asset, width/height, all six CTM elements and visual-style key. Pan necessarily invalidates this screen-space cache. lowerTargetROI first copies the *current destination scene* and then renders 25 ordered paths before gradient/source-atop publication. Caching that completed destination bitmap can freeze earlier scene layers. A static cache must separate their contribution or reproduce it freshly with demonstrated compositing equivalence.

## Optional C-only diagnostic before selecting a prototype
Use one uninstrumented C and one instrumented C page at desktop maximum and DPR3 maximum (four pages total, no new full builds). Reuse exact prepared source/runtime and frozen initialization contracts. Instrument COPIED helper only, with inverse-removal SHA equal to control. No raster changes, no dropped passes, no synchronous flush inserted between passes.

Time disjoint source regions with a nesting stack, not overlapping totals:
1. geometry lazy preparation;
2. material field raster (excluding geometry);
3. target allocation/resize and destination copy;
4. ordered target path loop (25 paths, separately count clip/bitmap/fill submissions);
5. recursive original BODY (exclude material hits and geometry);
6. target gradient mask;
7. target final publication;
8. live replacement, native junction, internal seam;
9. remaining helper self time.
Existing whole-helper/Scene duration remains inclusive and must not be summed with these categories. Counters use real performance.now; no prototype-wide Canvas wrappers needed. Record calls, dimensions, bytes, hits/misses and self/inclusive submission ms. These timings cannot allocate deferred GPU raster cost to the responsible pass. Report remaining unexplained cost explicitly.

Correctness capture: first + one cold + five horizontal and five vertical frames. Read pixels only AFTER each timed render and compare all RGBA control/instrumented frame pairs. Any difference rejects the instrumentation. Save images even when a gate fails. This diagnostic is not a performance acceptance run because readback changes scheduling.

## New cache prototype first gate
Use the same two actual poses and trajectories. Compare C against the separately pinned prototype; prototype source/helper hashes and implementation owner must be supplied before activation. Preserve strict source, physics, units, own codec, zero personal storage, DPR and final backing/CTM oracle checks. Preserve original raw alpha/owner/grass/road and declared intentional lower-material scope checks; do not replace existing failures with a new semantic pass silently.

For an exact optimization: require every captured RGBA byte equal, including panned frames, not only reset-camera final screenshot. For any intended visual change: explicitly identify its allowed region and independent expected composition before executing, keeping all outside/protected gates strict. No arbitrary tolerance, phase snapping, DPR reduction or baseline-golden replacement.

Cache-specific checks: fractional device pan (26.4 desktop /79.2 DPR3 per 16 world units), horizontal and vertical tile crossings, reverse traversal, return to identical camera, first visit versus warm hit, changed prior-layer background at fixed camera, style/asset change, zoom route transition and DPR/backing resize. Geometry/time checks are correctness-only, not mixed into timed frames. Boundary images must expose seams/gutters and include scene alpha/exterior, not only the correction buffer.

Memory: count retained material/target/SS/staged plus every cache tile and gutter, released/evicted entries and transient replacement allocation. 48MiB is helper logical policy, not total Scene/JS/GPU memory. Zero new rows does not imply previous buffers were released. Verify normal lifecycle rather than calling clear() and claiming normal release.

## Only after visual/structural success
Reuse current three-condition 12-page clean ABBA plus four rAF pages: .6 cached desktop, 1.65 desktop, 1.65 phone-sized DPR3. First render +5 cold +30 warm +60 pan (30 horizontal,15 up,15 down). rAF120 remains separate and horizontal; disclose this limit or explicitly revise its trajectory in both variants. No per-frame readback, JSON purity serialization, instrumentation or cache logging in clean/rAF loops. Purity snapshots outside rAF loop; final readback after wall-clock stop. Retain latest5b reference, and show same-run C/prototype incremental comparison without calling historical ratios same-run evidence. No agreed p95 budget exists; report actual regressions and benefits, not an invented acceptance threshold. CI Chrome is not a physical-phone FPS result.
