# Closure Scene study

Four variants: original production BODY; existing lower candidate; candidate with 16-path native exterior underpaint; independent expected control. The control draws the unchanged lower candidate root children in order with HonroVectorArt, inserting raw Canvas Path2D fills immediately before original source. It does not invoke the new native closure group. Both run inside real HonroScene cache/render. Exact whole-image closure/control comparison includes normal source-over AA.

All source, 13 footholds, stage, physics, bounded movement and save-codec contracts remain. Existing original-vs-lower compare.mjs and pixels.py are NOT changed and their failures remain workflow failures. The new closure check additionally requires zero opaque-source changes against lower candidate and zero changes outside the actual union of closure paths (clipped), not a rectangular exception.

Masks are rendered from original native source and raw closure path union at the viewport transform. Scene cache resampling can differ at boundaries; this package deliberately fails rather than silently expanding masks or adding tolerance. Any failure must be investigated before production. Expected-control timing is diagnostic only; candidate timing is the applicable performance observation. No production source, renderer limits, campaign or user storage is changed.
