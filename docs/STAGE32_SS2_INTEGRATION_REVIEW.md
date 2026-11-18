# Stage32 SS2 integration candidate: partial edge improvement

Research result: commit3f156282230ea8a4545219c7528441ed86a1f411, actual Chrome run44206446399, artifact14384342153. All three matrix views plus two performance views passed frozen baseline/source/physics/alpha/road-buffer checks. The original four-variant experiment remains unchanged.

## Independent visual judgment

Directly reviewed SS2 lower/left, portrait-bottom, landscape-bottom and desktop-walk, plus SS4 and slow spatial left. SS2 does not show the rejected original-color band's horizontal tonal seam or inset/texture-scale mismatch. It reduces internal fine green traces while retaining the shared terrain material. It is an acceptable **integration candidate**, not proof of final release readiness.

Faint thin lines remain, especially around left-view x~510,y330..480 and the walk-view arch; neither SS4 nor the slow spatial candidate removes every such trace. This is **partial improvement, not complete elimination of all seams**. Actual grass, source geometry, road and other protection constraints were not traded for a cosmetic claim. SS4's additional cost is not justified by the small visual difference observed.

## Same-run actual Scene costs

1331x763 DOM-attached bitmap/CSS canvases, decoded/prepared geometry, isolated Scene-cache cold medians10samples: baseline lower120.5ms/left76.1ms; spatial389.1/213.0; SS2 152.2/98.8; SS4 212.6/128.9. SS2 adds31.7/22.7ms relative to baseline. Pan maxima60samples: baseline28.2/45.4ms; SS2 38.5/55.4; SS4 50.1/71.0. These are not real-phone60FPS, cold app startup, campaign or UI Continue measurements. A55.4ms pan maximum must not be described as consistent60FPS.

Observed SS2 supersample scratch+live readback peak logical payload6,307,584bytes. All retained canvases including preexisting field/transition were4,918,512bytes. These quantities overlap and must not simply be added. Original field/transition payload was2,947,392bytes, making observed supersample peak plus those existing buffers an upper-bound estimate9,254,976bytes for this capture, not actual native/GPU/JS heap. Delayed GC/driver memory remains unmeasured.

## Cleanup and remaining verification package

`tests/fixtures/stage32-ss2-release-candidate.js` sets SS=2 and removes the debug testBoxMean export. The new six-canvas contract asserts the candidate is byte-for-byte identical to the tested research helper after exactly these two substitutions. There is no sampling, eligibility, blend, bounds, palette or geometry algorithm change. The helper remains a fixture here, not production registration.

- Preserve and execute historical1/4/5-buffer contracts unchanged against their existing helpers.
- New separate6-buffer contract: unsupported paint-state fallback, canvas state preservation, exact allocation accounting, cache invalidation, cap behavior, stage/provider isolation, source/battle immutability, VectorArt validation, clear-to1x1 and no debug export.
- Original provider/path/other-stage/isolated save-codec contract against e89242eedb5c040d38a9077c7289fbdc97786bdf.
- Remaining portrait-overview and landscape-overview actualChrome pairs, frozen baseline PNGs and strict alpha/world<=1380/source/physics gates.
- Temporarily substitute the cleanup helper for official Workshop and Game builds, then restore the original source with shell EXIT trap. No remote ref/publication/deployment action.

Standard browserCanvas/document/performance are the supported runtime. The existing offscreen-only/no-document environment is not newly certified. Bounds and allocation assertions fail rather than silently bypass the correction in the verification fixture. Guarded alpha/opacity/rotation/paint paths retain original rendering; arbitrary custom providers and non32 stages remain rejected. Partial subpixel road/hole cases conservatively skip correction.

Local syntax/static cleanup-equivalence checks pass. New overview/native/source/codec/build workflow execution is still required. If it fails, preserve the failure and do not register the production helper. Full5viewport completion relies on the prior three passed views plus this exact-algorithm cleanup proof and two added views. No deployment or real-phone performance acceptance is implied.
