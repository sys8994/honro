# Actual Chrome lower-gradient primitive check

CI44272725497 at300127042f9190e760890f38ef068f4d1bc345b7. Chrome157.0.8103.50. Four scale/DPR conditions passed positive alpha and byte-exact alpha equality between the original transformed huge rectangle and the algebraically equivalent finite device rectangle.

Positive samples:360701,383328,370500,834210. The original production gradient is therefore not absent in these Chrome probes. The all-zero Native gradient was a backend-specific local validation limitation. Previous lower-composite v0 zero-gradient image differences and timing cannot establish the intended positive composition's correctness or performance. Retain those historical data as rejected evidence, not a product fix.

This is a primitive alpha diagnostic only, not full-scene RGB/outer-support correctness or a performance acceptance. Finite-reference Native testing may now be useful for preparation, but actual Chrome lower-composite images, protected exposure, and total cost still require separate verification. No product/master/Pages modification.
