# Stage7 L addition versus K: actual cost tradeoff

Run44309592463 SUCCESS, research55c776efab8bcb03a1e93dcbf70da4498fb7340f. Artifact14430885785 ZIP SHA2566b0f3aea283904a20f8b220a01019ae2c8c22301cb682e6c71ee619803131e1b. K a6f2935935eed559c3ecd27207d8d8a78a1ed22d versus L85bae4a08993d3b71d22ea3fec76686e0ae3c61c. Exact seven-source scope, own official default builds, paired gameplay/physics/units, owncodec, storage isolation, camera/DPR/backing and render purity pass. Local checker rerun passes.

## Judgment
There is a real repeatable additional cost, not performance invariance: native horizontal +0.5ms/frame and vertical +0.4ms/frame, cached cold +8.75ms, first screen +15–22ms in this environment. Both ABBA blocks reproduce native increases. Unlike rejected Stage32 candidates this is not a large continuous slowdown, but accepting art improvement at this cost is a separate tradeoff. No automatic performance acceptance or agreed numerical budget is invented.

| ms | K | L |
|---|---:|---:|
| Cached first block median |192.4|214.1|
| Cached cold median / max |48.35 / 58.4|57.1 / 60.8|
| Cached H median / p95 |1.65 / 3.1|1.8 / 3.0|
| Cached V median / p95 |1.7 / 2.1|1.7 / 2.6|
| Native first block median |130.05|145.5|
| Native cold median / max |3.4 / 4.3|3.8 / 18.2|
| Native H median / p95 |2.0 / 2.7|2.5 / 3.2|
| Native V median / p95 |1.9 / 2.1|2.3 / 2.7|
| Native rAF gap median / p95 |33.2 / 33.4|33.2 / 33.4|
| Native rAF submit median / p95 |2.0 / 2.9|2.45 / 3.1|

Cached cold block medians K47.8/48.9 versus L56.9/57.3. Native H K2.0/2.0 versus L2.5/2.5; V K1.9/1.9 versus L2.35/2.3. Cached pan25 has shared repeated large24.5/25.1 versus24.9/24.9ms; not a newly introduced isolated L-only effect. Additional L cached V8.6ms occurs block2 pan58. Native rAF gap max116.7→166.7ms, submission max13.5→7.3ms; do not infer overall improvement from a single tail metric.

## Memory and coverage
Cached final15tiles/15,975,360 logicalworldbytes identical across all pages, nativeworldcache0. No observed tile memory growth at these conditions. This is not native/GPU/JSheap or normal App lifecycle proof. Native windowDPR3 uses official cap1.7 and actual663×1183 backing; no artificial DPR reduction. Two ABBA conditions8pages and independent native horizontalrAF2pages only. CIChrome conditions are not physicalphoneFPS. Actual native image is enlarged rock material, not a fullcombat sample.

Cached and native candidate PNGs were viewed directly. Cost checks do not establish final art acceptance; a small gold detail in enlargednative image x272/y985 was referred to art reviewer for original-foreground versus newartifact classification. Separate Stage3 exact/integration/all50/save suites remain required; not rerun here. The product, source policy and public deployment were not modified by this study.
