# Original-band research candidate (not adopted)

Parent base: 011743163e55285985af3c9ded837feb6ae4f1fd. No production file is replaced. All implementations are injected only into isolated fixture HTML under separate globals. `candidate` names frozen13d baseline, `spatial` the previously validated string-composed spatial experiment, `transition` this new original-band candidate.

The new helper is based on the unchanged staged lower-transition helper, not the rejected immutable-addPath optimization. Original path strings, order, clips, gray overlays, grass and road fill branches stay intact. For unprotected material paths only, a single reusable scratch bitmap blends the existing field toward each original n.fill in source-atop mode. Smooth spatial rise1420..1460, plateau1460..1676, fall1676..1716. The original1716+ transition remains unchanged. The field bitmap retains alpha; the same original compound clip and gray fill then apply. No per-pixel correction, readback, scanline compiler or spatial oracle exists in this candidate.

Bounds: scratch at most1,048,576 pixels /4MiB logical RGBA; one retained canvas, clear reduces to1x1. This is NOT measured native/GPU memory. Each affected unprotected fill copies and blends a bitmap; those bulk rendering costs are real and must be benchmarked. Source geometry preparation is included in first rendered scene, not the10 repeatedly prepared cold Scene timing. Benchmark CSS/DOM size is1331x763,10cold/60warm/60pan; no mobileFPS claim.

Tradeoff: original flat material replaces some newly shared texture inside the band. It may reduce the conspicuous contrast of original green seams rather than eliminate them. The spatial blend avoids a hard rectangular color cut but can still look like a broad horizontal tonal band. Screenshots, not CI success, decide visual acceptance.

Native check: actual25path/apron/gray source with a SYNTHETIC field (not real Scene); five scales. Full alpha differences0; pixels above1420 differences0; 224,134 opaque grass-labelled pixels compared, differences0. See native-check.json. The synthetic preview was visually inspected: no old-style hard cut, broad tonal fade is visible. Not Chrome or actual field validation.

CI: existing source/physics/battle/storage/viewport invariants retained. Frozen original baseline golden hashes remain. New image hashes are recorded, NOT set as expected results. Matrix comparisons retain full final alpha=0 differences and world<=1380 road/walk-buffer=0 differences. Experimental implementation-specific sampler counters are intentionally replaced with new scratch bounds/exercised checks, since no sampler exists. Spatial reference remains an independently rendered comparison, not the required target appearance.

The native original-grass comparison is not a browser edge-premultiplication proof. Chrome final alpha/road-buffer and path/source locks are mandatory, but genuine partial grass edge appearance still needs direct review. Nothing is deployed and no remote writes were performed.

Manifest lists local-to-repository file mapping and SHA256. Existing tests/fixtures/stage32-coverage-baseline13d.js, stage32-coverage-prior-span.js and stage32-real-clock-chrome.mjs are reused unchanged. Run via workflow_dispatch after parent creates its research commit. Never install this helper into production from this manifest.
