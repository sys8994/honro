# Stage3-only E paired cost result

CI44292746654 SUCCESS (research a9aacaaae1b40f87d85de1e3f65238d818ec77d4), artifact14423125954 ZIP SHA256 de1d9bf53e5636cdef934ed99fb2a114acd72d7c593f6a8066f2a65ef82fc77a. Extracted18captures, local checker passed. Baseline5b2edf0b868a6f4ab656574b036586304eb12808 versus Eabdef6fc12042714f02d8ea2bf3b2c80757273f0, each own default-flag official build/runtime. No helper injection, HONRO environment override, personal storage or source edits.

## Quantitative comparison (milliseconds,5b→E)
|Condition|Cold median|Hpan median/p95|Vpan median/p95|
|---|---:|---:|---:|
|3 desktop cached .65|22.75→18.80|.50/2.90→.50/5.60|.60/.80→.60/.90|
|3 phone-sized native1.65|2.10→1.95|.70/.90→.60/1.30|.70/.80→.60/.80|
|7 native control|2.60→2.60|1.40/2.00→1.40/1.80|1.30/1.70→1.30/1.60|
|32 native control|2.00→1.90|1.10/3.40→1.10/3.60|1.10/1.40→1.10/1.30|

Each variant has10cold and60per-axis pan samples across ABBA.3native rAF120 callback gap median16.7→16.7,p9516.7→16.8,max50→66.7; submission median.8→.8,p951.1→1.3,max1.8→2.5. Horizontal only. These are CIChrome callbacks/submission, not phone FPS or proven GPU presentation.

Steady costs do not show the severe persistent regression found in32candidateC. However **tail regressions remain recorded, not waived**:3cached horizontal p95 rises2.9→5.6ms;3native horizontal max1.5→6.4ms and candidate has ~6.4/6.2ms at horizontal frame26 in both repeat blocks. Cached candidate additional6.1/5.6ms events occur after tile allocation count has stabilized at12. This does not prove cause (deferred raster/GC/other work not separated), nor justify calling all spikes random. No agreed numeric acceptance budget exists. Parent must weigh these bounded tails alongside art/lifecycle evidence; CI success alone is not release acceptance.

## Fairness and scope
All four source hashes and exact tree scope pass. All tested paired gameplay payloads/cameras match.7/32 source-stage,referencedasset and full initialized battle hashes match. Ownsave roundtrip exact, storage0, noStage32helper.3/7windowDPR3 uses unchanged official backing ratio1.7,663×1183.32DPR1 and desktop cachedDPR1 correct; native matrices match same-backend transform construction exactly. Leftward3/7 pan actually moves;32rightward moves. No earlier clamped-D data reused as ABBA.

Stage3 cached final12tiles/world logical12,780,288bytes identical across4captures. Native3/7/32 reported world tile bytes0, which is not total Scene canvas/native/GPU memory. Cold initializes a new Scene; it does not demonstrate normal transition cleanup. Independent E official App lifecycle and oldsave/all50/visual checks remain required for release. No manual clear is used to claim normal release.

Directly inspected original/candidate3cached and candidate3phone PNGs. Cached candidate restores continuous top ground across old cut and removes old rectangular boundary, while native phone camera is a lower-cliff close-up, not combat/actor or whole-stage visual coverage. Separate approved-art review is necessary. No screenshot edits or replacement goldens were made.

## Scope of recommendation
From this bounded cost study alone: no broad steady-performance blocker comparable to rejected32C, with explicit tail caveats above. Do not claim all-device performance, zero regression, full gameplay, or deployed status. This source remains a Stage3-only candidate until independent art, lifecycle, save and final deployment checks complete.
