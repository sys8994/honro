# Stage32 registered SS2 integration candidate

This patch registers the exact already-reviewed 2x helper in `shared/runtime/stage32-foundation-art.js`. No source vector, provider definition, stage placement, road, grass geometry, original compound winding, collision or monster placement changes. Helper SHA256: `0d6892a04ad601e056b62481d203c9c49471d191026ef09b75b973d0d681783a`.

## What changes and what does not

Native device-space 2x supersampling corrects eligible antialiased nonwalk RGB; the original 25 paths, alpha and protected road/walk buffer stay unchanged. Premultiplied equal-weight box mean is explicit. The field is nearest-neighbor integer expanded; no browser high-quality drawImage filter is claimed to be an exact mean. Six retained canvases, logical memory/stripe bounds, conservative original-palette preservation, paint/transform fallback and clear/reset are tested against the real production source. No debug testBoxMean export.

The provider and existing Scene art hook were already registered before this patch. The only production change is the helper file. The new Chrome harness requires production `runtimeEntries` to include that exact helper once. SS2 is NOT injected, renamed or selected from a fixture; only the frozen baseline comparison replaces the global helper. Official Stage32 provider IDs, original source hashes, actual Scene invocation and protection contracts are asserted. These remain synthetic initial-battle Scene tests, not user App navigation, full gameplay or user save migration.

## Known remaining defect and cost

SS2 reduces the fine green fringe; it does **not eliminate every seam**. Faint green traces remain particularly on the left-side curved contour (prior 1331x763 left capture around x510/y330–480) and parts of the walk-view arch. This is partial improvement, not a terrain-art final pass. SS4 and the slower spatial alternative also retained faint traces. The rejected original-color-band option had broad horizontal tonal/inset-texture regression; that approach is not registered.

Measured actual Chrome CI44206446399 (same run, lower/left): original cold Scene medians120.5/76.1ms; SS2 152.2/98.8ms; SS4 212.6/128.9ms. SS2 adds26.3%/29.8% cold cost versus original, although much less than the spatial389.1/213ms alternative. Pan maxima original28.2/45.4ms, SS2 38.5/55.4ms. These are prepared-source, decoded-asset, isolated Scene-cache measurements, NOT app cold start or mobile60FPS. A55.4ms spike cannot be described as60FPS acceptance.

SS2 peak scratch+live-readback logical6,307,584B, all retained canvases4,918,512B, original field+transition2,947,392B. Original payload+SS peak estimate9,254,976B is not actual JS/GPU heap, excludes GC/tile/image allocations and must not be summed with overlapping retained-canvas totals. `clear()` leaves six1x1 buffers24B.

## Independent registration CI

Runs production-source native contracts; existing provider/source/codec contract; real Workshop and Game builds from repo root; actual Chrome 2performance views plus5matrix views with fresh profiles. Uses the checked-in helper through `runtimeEntries`, not a test-sourced SS2 override. Comparison retains frozen baseline hashes, alpha and world<=1380 protection, source/physics/battle hashes. Seven SS2 output hashes are frozen from previously reviewed captures to detect registration-only drift. Original research fixtures/contracts remain unchanged; old1/4/5buffer expectations are historical and must not be mistaken for the new six-buffer contract.

Timing remains measured and reported for review, not automatically promoted into a device performance pass. CI success does not imply visual final acceptance, normal-input gameplay, real save/load, release approval, master integration or Pages deployment. This package does not update release/master refs or publish anything.
