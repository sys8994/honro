# Stage32 native replacement plus consecutive-color reuse

Research commit `0bd4f654fa87ef74fdb23c84b27af91444888982`; actual Chrome CI44271930145 SUCCESS, artifact14412738300, ZIP SHA256 `a7a09035db0a0ce504231ad1765fbde84723f79860e90a0e5832f360c601b697`.

Control is copied cap-safe7ca helper, candidate is its two-substitution consecutive-color reuse; both use pilot636, official source126. This is a source-preview study, not product registration, deployment or whole-device acceptance.

## Independent exactness
All8 pages preserve source/clip/Stage3/physics/initialized battle/save and zero personal storage access. Both live routes record SS0. Four clean final PNGs are RGBA exact; separate first/cold/five-pan hashes all exact; 120rAF final endpoint hash exact. Camera really traverses120 distinct x positions336..2240 at y1650, scale1.65. PNGs are deliberately captured after resetting to the initial camera; the rAF endpoint is covered by its separately stored finalRGBA, not by the reset PNG. Initial-camera candidate PNG directly inspected: gray interior and grass/stone boundaries match control byte-for-byte. This narrow same-output check does not settle the separate native-replacement whole-view quality review.

## Clean ABBA cost (same runner, maximum live pose only)
Each variant n10 cold,58 warm and120 pan samples. Cold median61.70→56.55ms (-8.35%); pan53.10→47.20ms (-11.11%), p95 64.10→53.70, max117.5→94.8. Per-block pan medians54.05/52.55 versus46.95/47.50 support a modest repeatable saving. First submissions120.7/94.8 versus87.4/89.2ms. Warm stationary median0.5ms both. These synchronous submissions do not equal GPU completion or FPS. Do not compare their absolute cost to the earlier different-run38.6ms result as a regression.

## Separate actual rAF scheduling
No full battle serialization or pixel readback occurs inside120 callbacks. Purity checks happen before/after the loop, while per-render purity is separately checked in clean/hash pages. Control→reuse: gap median66.7→66.7ms, p95 100→83.4, max466.658→433.4; gaps>50ms113→92 of119. Submit median53.2→49.0ms; callback-loop wall8469.3→7783.8ms. Final readback after timing15.9→15.7ms. One scheduling run each is bounded evidence, not a device benchmark or presented-frame measurement.

Conclusion: preserve the exact-output reuse candidate as a modest benefit, but remaining47.2ms pan and66.7ms scheduling median are not acceptable proof of overall speed. Larger native-composition work remains justified. No blanket SS removal, cap increase or DPR reduction follows from this result.
