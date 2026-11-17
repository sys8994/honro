# Stage34 non-play foundation edge candidate
Code basis: clean396 plus isolated diagnostic records; Stage32/33 candidates are not merged here.
Source approved34:coastal-foundation is unchanged: placement(-1536,-256), root6×, original source1536×1024, artificial right/bottom world7680/5888. Its natural alpha silhouette, arches, palette, every path, bounds, collision and gameplay data remain unchanged. This is a compositing correction; no new artwork/trace is required.

## Observed cause and rejected diagnostics
Chrome baseline confirms the bright L at finite imported canvas edges. Generic silhouette underpaint is already disabled. Removing first pale fill barely changes the line and damages authored paint; removing source alpha clip damages holes. Both are diagnostics, never production candidates.
The source's fractional canvas boundary causes stacked source/clip AA colors to appear as a bright edge. The candidate preserves the ordinary source render and restores only the pre-render backdrop in the fractional right/bottom cache pixel, equivalent to inward pixel alignment of these two artificial non-play canvas edges. It does not erode the natural source alpha contour or blur/rescale artwork. Integer-aligned and offscreen edges are exact no-ops.

## Evidence so far
Test-only prototype e1f51d6f / CI44140444169 succeeded in actual Chrome157, DPR1, desktop1331×763, portrait390×844, landscape844×390.
Desktop bright L removed, 1565 final pixels changed; all changes stay in the exactly traced one-cache-pixel linear-reconstruction support. At bottom this occupies two final-screen rows; the earlier one-final-pixel assumption failed and was preserved in57afbdf0/CI44138852304. No color tolerance was added.
Portrait and landscape cache boundaries are already integer-aligned: 0 renderer replacements, exact unchanged pixels required. All views retain source/physics/camera equality, storage/runtime/image errors0 and battle JSON purity.
Cache trace: desktop eligible9 tiles, draw5, column3,row3; two reusable strips total4128bytes; no fallback. These are render/cache counts, not performance or FPS measurements.
Artifact14354546977 ZIP SHA25659c6f53ac5b739f5407903edbe5b9438de0001143da11b6b9c8d000d11e25bf4 contains6PNGs+6JSONs. CRC, hashes and visible images checked.

## Production integration and remaining work
This revision adds the narrowly guarded helper to the normal Act4 module/landmark path and uses that real hook in the test (old-render control disables only this helper). It guards source identity/transform/placement, stages/custom maps, finite positive axis-aligned matrices and cache dimensions/pixel cap.
The production guard, official build and same Chrome A/B must run again; prior prototype success is not this commit's result.
No source/provider ID/schema change. Actual scene state remains read-only. Public UI/input, continuous pan/zoom, dynamic states, real hardware/highDPR and p50/p95 timing remain unverified. No master/Pages deployment or final art acceptance is claimed.
