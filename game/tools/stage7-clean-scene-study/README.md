# Clean actual Scene comparison

Two variants × five views only: original BODY / partitioned lower candidate + closure + polygon filled join. Both use the independently validated tests/fixtures/stage7-readability.js helper, so the nonwalking domain rectangle is absent in both and art timing is compared fairly. The helper is loaded only in test pages. All art JSON dependencies reuse existing research files; no production injection or duplicated assets.

The fixture removes VectorArt wrappers, source/caps/probe masks, cache replay, image readback and diagnostic geometry drawing from measured render calls. It asserts VectorArt.draw identity remains unchanged. It records first render, new-Scene image-ready render, five repeated renders and three pans. Real elapsed time wraps a synchronously frozen visual clock, restored in finally. PNG readback and JSON checks occur outside the timed calls.

First render can include image decode initiation; image-ready new Scene has fresh Scene caches but globally warm VectorArt and decoded images. Render-call elapsed is not end-to-end frame presentation or phone FPS. There is no automatic threshold-based performance approval. Report includes ratios and raw cache counters for human review.

Stage/camera/source/native 13 caps/physics/save-codec/movement contracts remain exact. The original source draw itself is unchanged; the explicitly authorized narrow join overlay is not claimed to preserve source pixel colors inside its footprint. Pixel semantic gates are retained in the separate instrumented study, not replaced by this benchmark. Inspect five PNG pairs with readability applied. Lower-art finish remains subject to separate art review.

Latest layer candidate included: closure is prepended below all lower/side backing to avoid the rectangular tail; joined ribbon remains immediately after original source. This layer change still needs actual Scene acceptance.

Final lower-role ordering included: closure → side/other backing → unchanged source → polygon join → existing nonwalk-envelope material (unchanged source-fixed-grass-complement) → 13 caps → original rim. Only existing lower layer ordering changes; no additional masks, probes or instrumentation are introduced.
