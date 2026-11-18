# Proposed helper-total logical byte budget (analysis only)

No cap changes implemented. Fresh cap-safe7ca476 preview retains old SS whenever the replacement pipeline cannot run. Actual large-device art remains a separate probe; current3pose costs are independent.

## Accounting

Let P=W×H actual device pixels, B=clipped transition band rows. Proposed planning inventory must include material canvas4P, actual transitionWork+Color dimensions4(Aw+Ac), stagedBODY4Ab, and retained SS canvas+lowMask4(As+Al). With a full staged boundary and fresh same-size work/color this is8P+8WB+R, R=retained SS bytes. Inactive buffers are still counted at their ACTUAL retained dimensions, not assumed zero. Fresh1×1 canvases add4bytes each.

Each SS scratch canvas is independently limited to1,048,576pixels, so two retained SS canvases have conservative8MiB logical upper bound. Existing readback stats can remain nonzero after returning but describe temporary payloads, not necessarily retained allocations; during active SS the separate24MiB scratch+readback bound still applies. Native SS-off route performs no new SS readback; switching from cached SS may nevertheless retain the8MiB canvases. Releasing them would need an explicit lifecycle decision and evidence; no test-only clear can claim normal release.

Table.json gives actual illustrative poses at scale1.65, cameraY1342(existing high-device walk probe) and1650(focused gray seam). At cameraY1342 the common device's transition band is below screen, so fresh material alone dominates, but older larger buffers may still remain. At cameraY1650, including worst8MiB retainedSS: desktop1080=30.18MiB, phoneD2=19.15MiB, phoneD3=33.07MiB. Full-band conservative maxima respectively39.64/24.57/45.28MiB. These are logical helper allocations, NOT whole-game or physical peak memory.

## Bounded study proposal

A48MiB logical helper ceiling is a reasonable experiment: it covers all three common devices even at full-band conservative sizes plus8MiB retainedSS, while refusing worst6MiPixel cases (3072×2048 gives104MiB full-band; sampled poses65.59/66.69MiB). This is not a device-safety guarantee or an approved product budget. Do not merely change1MP to6MP: extra buffers multiply the cost. Do not reduce DPR to hide it.

Compute prospective allocation inventory BEFORE resizing/allocating each buffer, including material (which currently allocates before canTransition), all retained transition buffers and both SS buffers. Use actual per-buffer dimensions and validate finite integer sizes; any unchanged buffer keeps its prior charge. Record admitted/rejected budget reason and observed before/after logical totals. A denied transition must retain old SS as cap-safe7ca does, never silently suppress it. If even material exceeds the chosen ceiling, define a separate behavior explicitly rather than enter partial unsupported rendering.

Transient old/new GPU surfaces and garbage collection can make physical peak exceed logical inventory; Scene tiles, main canvas, encoded assets, Path2D, JS/native/GPU heap also lie outside this bound. Measure device behavior before treating48MiB as safe. Any dedicated shrink on route switch must be tested for cached↔live threshold oscillation, allocation churn, first render/pan, imageexactness and normal stage transitions3→7→32→other. Region-sized staging could reduce bytes but remains unproven: the prior discarded-area clip changed published pixels and is rejected.

The eventual supported-device experiment should cover1080pDPR1 and phoneDPR2/3 at both poses, route threshold±, viewport resize and both cached→live/live→cached sequences. Preserve source/physics/foreground/finalunion gates, current DPR and complete clean CPU costs. No broad cap raise, production edit or remote write here.

## Renderer ceiling clarification

The renderer pixel-ratio formula never reduces belowDPR1. Its6,000,000pixel target is NOT an absolute canvas ceiling: CSS4K3840×2160 atDPR1 remains8,294,400pixels, below helper materialMAX8,388,608. Added4K planning case: full-band helper+retainedSS bound141,099,008bytes (134.5625MiB), not admitted by proposed48MiB study budget. Exact pose values are in table.json. The3072×2048 row is a6MiPixel study example, not renderer maximum. Beyond helper8MiPixel material cap the helper's fallback is not a universal appearance/support guarantee. This design deliberately focuses common1080p/phoneDPR2/3 and records unsupported/overbudget cases rather than claiming all canvas sizes.
