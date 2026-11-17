# Stage32 original-band Chrome result: reject art adoption

Candidate 312c7d16513221513313375ce2f9cc1685ee618f; run 44202613093; artifact14381419398. Independent research, no production registration or deployment.

Actual Chrome completed three variants in two performance views and five viewport matrix views. The frozen original baseline PNGs and source/physics hashes passed. Alpha and protected world<=1380 differences were zero for both research variants. These numeric passes do not confer art approval.

Same-run attached1331x763 isolated Scene cache-cold medians (10 samples): original136.2/89.3ms lower/left; spatial437.2/251.8ms; original-band283.4/189.2ms. Pan maxima (60 samples): original30.4/51.7ms; spatial109/145.4ms; original-band68.3/97.6ms. Geometry/image decoding warm and not real mobile gameplay. Candidate improves over pixel-sampled spatial version but remains slower than original.

Direct visual review of perf/stage32-transition-lower.png shows a broad horizontal tonal band; matrix/stage32-transition-landscape-bottom.png exposes the confined restored original texture at a different scale from surrounding shared material. The local original-source region reads as a rectangular/inset texture patch. This is not a satisfactory perimeter/join fix. Candidate not adopted. Existing source geometry, alpha, grass paint order and physics are unchanged, but that is insufficient for art acceptance.

No further micro-optimization of this variant is justified. Remaining problem is a coherent source-defined material transition that avoids thin internal green traces without frame-dependent pixel sampling, extra visible texture bands or protected walk/road damage. Stage32 remains unreleased pending a visually coherent, adequately performant solution. Experimental exact-output preservation is not itself a user requirement; protection and art quality are.
