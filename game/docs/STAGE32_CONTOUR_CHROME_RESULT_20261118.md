# Stage 32 contour preparation: Chrome result, not adopted

2026-11-18 (KST). Independent research only; no release, master or Pages change.

Candidate 3fbf626b24bfb4cd119c48e8ff417935aee58b2b, GitHub Actions run 44198746413 passed its native contracts, source-preserving isolated Scene fixture and exact Chrome image comparisons. The two captures retained the safe-band golden PNG hashes. Protected walk/road buffer changes and alpha changes were zero. Original-path oracle comparisons were 37,493 lower + 13,825 left, with zero mismatch.

However, preparation did not demonstrate a useful real-Chrome speed gain. On attached 1331x763 bitmap and CSS canvases, ten isolated Scene cache-cold samples had median 476.6ms lower and 272.5ms left, versus same-run frozen baseline 146.3ms and 97.7ms. The preceding string-composition candidate reported 440.2ms and 251.7ms on another runner execution; this cross-run difference is not a controlled regression measurement, but gives no evidence to adopt the added preparation. Geometry setup additionally took 22.7/23.6ms and retained 723 immutable subpaths. Native memory and GC cost are not measured. Warm median was 0.5/1.6ms but does not erase cold/pan costs or prove mobile FPS.

Decision: do not adopt this experimental helper in release. Keep the earlier spatial string-composition candidate as the current comparison reference (eaf9841662a60eef4fe769b99a5bd6b2a2420d3b; complete five-view matrix run 44197678635). That reference is also NOT performance/art release-approved. Historical off-DOM 1x1 timings remain invalid for the intended viewport, as documented in STAGE32_BENCHMARK_VIEWPORT_CORRECTION_20261118.md.

Next work is a bounded architectural alternative rather than another contour micro-optimization. Any change must retain original geometry, alpha, protected buffer, source roads/grass and source hashes, and pass actual Scene captures and full cost checks. CI success alone is not acceptance.
