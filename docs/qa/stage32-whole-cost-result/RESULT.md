# Registered Stage32 whole842 cost: rejected

CI44261628330, artifact14408129369, ZIP SHA25659c51dab8f8e39c6c440c0efae738dd0d3313f7cc4fc63028881b77cfcd7b4ee. All12 own-runtime browser captures completed; CI then failed raw source path SHA equality. No gate was silently removed. Independent successful CI44261966463 proves original raw25 preservation and official optimizer-on-clone equality; this explains representation provenance, not rendering-cost or pixel equivalence. Actual renderer retained raw source.

| Pose | Cold median842→candidate(ms) | Pan median | Pan maximum |
|---|---|---|---|
| .6tile |58.50→124.35|2.20→2.20|38.0→82.6|
| portraitminimum |43.40→63.25|2.40→2.40|19.4→10.0|
|1.65live |1.95→113.80|1.00→92.40|5.7→143.2|

Maximum live pan regressions reproduce in both candidate blocks: medians92.85/92.05ms against1.0/1.0. Stationary warm medians are near equal and do not excuse moving-view cost. Candidate max pan SS measured section median57.75ms, but this is not an exclusive whole-cost decomposition. Remaining material, raw path, transition, native, rasterization and deferred costs require targeted profiling. No blind SS removal is warranted.

First Scene submissions: .6baseline147.8/147.7ms vs328.7/312.2; minimum169.5/162.5 vs269.6/267.6; maximum53.1/53.0 vs245.9/247.2. These are synchronous render submission costs, not full app startup or GPU completion. All pan worldBuild deltas were0, including costly live rendering: that counter cannot label frames cheap/cached.

Candidate maximum observed retained helper logical canvas bytes: .6=4,918,512; minimum=2,406,624; maximum=15,668,532. SS internal peak canvas+readback logical bytes reaches22,893,200 at max; overlapping definitions must not be added. Native/JS/GPU heap and normal stage-change release remain unmeasured. Baseline helper is absent, not total baseline memory zero. Cold clear calls are benchmark setup, not normal lifecycle proof.

All12 render-purity/storage/save checks passed. Initialized battle changes20 fields consistently, units intents/awake and occultRevision. Crosschecked initialized physics/units, original physics, Stage3/assets, source clips,25path count and actual cameras exact. Only raw path signatures differ. Candidate uses839,358path bytes/23,141explicit commands versus680,512/13,346optimized; explicit command count is not geometric segment count. Whole generated runtime167,282,854 vs165,438,256bytes includes data and assets; it is not helper-only startup cost.

Directly inspected original PNG pairs at all3poses. Candidate replaces the old blue foundation/brown cut panel with the approved continuous gray/brown terrain. Maximum internal gap and thin tail are visibly closed; minimum composition preserves village/arch layout. This local3pose visual observation is not a new full art or protection acceptance. Performance is rejected despite the art improvement.
