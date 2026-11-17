# Stage32 RGB semantic mask candidate

Opaque-black single mask: R is visible grass, G visible road, B BODY coverage. Each original path fills RGB with corresponding membership flags and B255. Alpha source-over and blue-on-opaque-black recurrence should agree exactly. Native differential experiment:50 original25-path/apron transforms,6,604,800 pixels, all three mapped channel differences0. Actual Chrome verifies every channel against independently rendered original three masks during initial scene capture. That extra debug verification is disabled before timed cold/pan benchmarks.

Allocation intentionally reduces7→5 canvases, clear footprint28→20bytes. Previous seven-canvas current contract is preserved verbatim in tests/fixtures/stage32-coverage-native-v2-contract.mjs; original historical lower-transition contract and baseline helper remain unchanged and executed. New current contract keeps all state/source/save/fallback/cache assertions, with stricter expected five allocation count and exact byte accounting. No masked pixel tolerance changed. Existing exact safe-band PNG, older point-query reference and frozen baseline assertions remain.

Independent research only, not release-ready until actual performance and art gates pass. No master/Pages/generated-ref changes.
