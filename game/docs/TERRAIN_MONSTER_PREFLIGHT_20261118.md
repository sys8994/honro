# Terrain and monster integration preflight

Not a release or art acceptance. Stage3 and Stage7 retain known unfinished art; Stage32 is excluded. No master/Pages changes or user-save access.

## Inputs
- terrain: e8d8aa8865c832e831d6d221223356b440652e5f
- m40: 321a8a61a9fd383ef3f4470cbf08d68bc3464092
- middle: afc7b98d772e3c22d25e82d8d32202c3801e66fa
- early: 6a6b538b95042e93562dab72a64725bea41fcc3b
- act5: 9a75ec977d00947c7cefbf2424de920a1e569943

All monster parents share public baseline 7d238d20663c3ceffe430eb0304e01516ae625cf. All their changed files are copied exactly, except shared/build.mjs which is merged: preserve terrain's four Act4 helpers and early placement's model and author registrations. Existing tests and assertions remain unchanged. Manifest verifies blob identities and unique registration.

CI checks four placement contracts, renderer contracts, baseline codec behavior, current synthetic model save roundtrip and official build. Existing whole-PNG terrain comparisons are not relabeled or weakened: combined monster placement intentionally changes units, so this is not equivalent to their individual image acceptance. The model roundtrip is not browser storage/Continue proof and only covers its existing1–16 range. Act4/Act5 save, actual combined Chrome/UI, quantitative gameplay, performance and physical devices remain unverified here. All test failures must be diagnosed against inputs before changing expectations.

No generated HTML is committed by this preflight. Source combination, CI result and deployment are distinct.

## First preflight result and harness correction
Run44165930671 on0a123040: exact35-file copy/registration check, all four placement contracts, snap guard, baseline codec, current1–16 synthetic roundtrip and official build passed. Three Native renderer tests34/37/38 failed at provider lookup assert(a), before rendering, because this new workflow omitted HONRO_ACT4_RELEASE=1. Their existing source workflow explicitly supplies that flag. Test assertions and production code are unchanged. The follow-up reproduces missing-flag failures on exact terrain parent e8d8aa88 and runs each with the correct flag, then repeats combined checks. This is a workflow setup correction, not weakening a test or declaring the initial run passed.
