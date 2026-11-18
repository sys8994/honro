# Nonwalking lower continuity study (not production)

Final actual order: closure underpaint, side/other backing, original source, polygon join, existing nonwalk-envelope material, original 13 caps, original clipped rim. No material geometry/clip/color changes. The lower layer retains source-fixed-grass-complement protection.

Additional variants lower-base (partition with lower behind source, no closure/join) and lower-expected (same baseline tree, independent split renderer skips lower at old location and composites it once immediately after source). Candidate is native reordered tree with no closure/join. Actual candidate vs independent lower-expected must be RGBA exact. Closure/join expected controls retain separate order-matched independent compositing.

Masks lower/lowerOnBlack/lowerOnWhite replay actual original tile/cache transforms and unchanged lower geometry. Strict floor+24 pixels.py remains unchanged; lower-check.py additionally requires unchanged source/caps/rim/physics/camera/save/movement, no cap changes, and no changes outside lower material coverage. Existing grass-complement holes are outside that coverage; quantized alpha-zero requires positive opaque black/white endpoint evidence, not tolerance.

Run python game/tools/stage7-scene-study/lower-check.py in normal mode only after artifact capture. Keep existing closure/join semantic and original strict gates. Timing remains instrumented. New material appearance and transition need manual acceptance. No source clipping, deletion or physics change.
