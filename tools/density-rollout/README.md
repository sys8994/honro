# Act4 role-density review integration

`node tools/density-rollout/assemble.mjs` generates isolated31–40 baseline/candidate projects and a combined local review project in `_local/reports/density-rollout`. It does not update official campaign/world files or production packages. Current inputs include portable original packages,32/35/36 local pilots, source-native BODY variants, and reusable gameplay modules.

`node tools/density-rollout/capture.mjs PROJECT OUTPUT --views normal,party,mobile,whole` uses the production compiler and Scene with Native Canvas. It asserts actual post-render camera coordinates and records92-world-unit actor heights. It is not a browser/device/performance or playthrough test.

Assembly requires exact compiled-terrain and gameplay-field equality against each authored package, validates expanded vector limits, rebuilds original reflected BODY domains, and prevents conflicting shared asset definitions in the combined project. Stage34overhang and38cave floor/ceiling use the original distinct clip/ownership recipes, not a generic floor-only treatment.

No script records visual approval. Preliminary palette-only31/33 renders were rejected because giant interior bands still dominate the frame. New native Inkscape depth-separated source variants and play modules must be viewed at fixed normal/detail/mobile cameras before deciding whether to promote them. Approval, source optimization fidelity, actual App tests, browser tests, and remote release remain distinct.

## First palette-only inspection (2026-10-29 KST)

-31: large dark/light interior rock blobs dominate the lowerhalf. Rejected as finalBODY art despite reduced cost. The shared36quiet ruined frame can safely replace the same original31frame at unchanged footprint; the separately authored playable thatch-house roof must not be replaced with an unrelated house.
-33: broad ochre interior backing bands and large oval rocks remain visually dominant. The plain upperwalk also needs the correct material/contact treatment; quieter geology alone does not fix play hierarchy.
-34/38: first generic camera missed playable contact/actors. Retained as geometric diagnostics only; actualparty/initialcontact and separate overhead-contact cameras are required. Ceiling undersides must be preserved, not subjected to floor-only fading.
-37/39/40: original wood route silhouettes remain too plain relative to detailed scenery. Exact-geometry cropped/sheared shared wood modules are being integrated. DeepBODY face contrast still needs revision.40quiethouse uses the full460-world source, not the420-world32variant.

These are human visual findings, not automatic metrics. Source-native31/32/33 depthfade iterations initially exposed missing nested-union groups and wrong backing-mask paint order; such provisional assets are not acceptable merely because imports and collision checks pass. Final rerendering must follow corrected source confirmation.
