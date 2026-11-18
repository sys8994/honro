# Stage7 direct cross-version synthetic restore

Verified research commit: `10bb2c47a8308acd593885fe0ba13527620c6ddd`.
Baseline: `842aa12fd1144e4f7e9ee616a6ae65d632389f51`.
GitHub Actions: run `44230877810`, completed successfully.
Artifact: `14395590463`; ZIP SHA-256 `a164a0b934a54a0bb0fa37d0b5f87cba05b960c81e80d1af3a0f2600dec2e5eb`.
Downloaded artifact and independent checker rerun both verified.

## Passed

- Independent842 runtime generated a synthetic Stage7 battle with one damaged actor, round2 and shots3, then used the real compactBattleArt codec.
- A separate new-runtime Chrome context restored that exact compact JSON with the real restoreBattleArt codec.
- Full old battle equality passed WITHOUT normalizing or excluding visual fields.
- Old BODY vector/viewBox/bounds/reference remained exact while the current provider contained the distinct approved new BODY.
- Recompaction reproduced the original compact representation; a second restore reproduced the full old battle exactly.
- Inputs and canonical project remained unchanged. User-storage accesses: zero.

Old7 optimized vector SHA-256: `9d1e11d0b4ff599203237990baf2e7c71a6b2454a11066ff0a63dd7e96419919`.
New current7 optimized vector SHA-256: `fd5772719874e3c8599dec290540863a5c8009c94c6818cf50545986cb885d95`.

## Scope and limitation

Existing saved battles keep their OLD artwork and its old bounds. No automatic artwork migration was attempted or claimed. These are independently generated in-memory fixtures, not personal save data; localStorage, sessionStorage and indexedDB were blocked, and App startup was excluded.

This verifies direct codec compatibility only. It does not claim complete profile migration, Engine attachment, old-save screenshot equality under new rendering, gameplay completion, public deployment, or all possible historical save shapes. Previously completed50-stage same-version contracts are separate evidence.
