# Linked Act4 campaign acceptance (pending final combined freeze)

`linked-stage.mjs` is a prepared, syntax-checked runner, **not a passed test**.
It must not be used to replace an old isolated proof with a new fingerprint.

1. Freeze the complete31–40 project and runtime; retain exact file SHA256.
2. Enter31 once with a declared stage30-complete earned profile. Balanced is the
   intended campaign sample; record any chosen earned-SP build explicitly.
3. Feed ordinary input policies/tapes. A tape from an isolated stage is merely
   input: if the truly carried profile cannot execute it, record failure and
   generate a new legal policy from the carried state. Never transplant a win,
   XP, resources, rescued residents, or campaign completion flags.
4. Actual win must reach the actual outro and `app.outcome()`. This creates the
   production campaign proof; `phase === 'won'` alone is insufficient.
5. Use actual `resultContinue` and, where needed, the next-rest launch action.
   Save the newly launched next battle with `stopBattle`, export exact local
   storage bytes, then start the next invocation in a cold process.
6. The next invocation uses only those saved bytes, never `profileThrough` or
   level normalization. Compare units/objective/round/active/phase/terrain with
   the preceding next-stage save. Require each prior completed row to retain
   one runId and genuine sourceRun. Stage40 must naturally receive32/39 proofs.
7. Every boundary must stay under5MiB of UTF16 local-storage keys plus values.
   The script fails on source/runtime drift, missing proof, tape failure, or
   restoration mismatch. Keep incomplete receipts and original inputs.

Example after final freeze (not performed yet):

```
node --expose-gc tools/density-qa/linked-stage.mjs FINAL.json 31 TAPE31.json RUN31
node --expose-gc tools/density-qa/linked-stage.mjs FINAL.json 32 TAPE32.json RUN32 RUN31/boundary.json
```

One Native process at a time. This harness uses Native Canvas with sparse scene
rendering and DOM/audio/scheduler doubles. Even a complete linked pass is not
browser/mobile HUD, continuous camera history, human difficulty, or art approval.
Actual outcome/rest DOM lifecycle may reveal adapter limitations: diagnose them
rather than bypassing state transitions. Stage40 terminal persistence is recorded;
its reload needs an additional terminal-profile check once the full chain exists.

## Official campaign provenance (not Workshop)

`linked-app.mjs` does **not** substitute `HONRO_PROJECT`. It consumes the default
project assembled by `runtimeParts` from canonical sources. The supplied frozen
Act4 project must exactly equal integrated `shared/data/act4/world.json`; the
`world.parts/manifest.json` hashes, lengths, and joined part bytes must reproduce
that world. Every loaded Act4 asset is checked against canonical source to catch
shared-ID shadowing. Stage comparisons permit only the three exact added value1
`initialState` narrative revision flags installed by official narrative/story
modules, recorded individually; no terrain/units/assets or arbitrary metadata
are ignored. Source and loaded stage hashes are both retained.

Why: `App.launchMap` creates `customMap`, starts a fresh map-specific profile and
mounts with `reportScope:'custom'`; `App.persist` explicitly refuses `customMap`.
Such imports cannot prove normal campaign progression or saves. The linked
adapter uses `App.launch(31)` once and real cold `App.continue()` thereafter,
asserting no custom, debug, training, or `honroCustom` state.

This is a Native default-build/manifest-source identity check, **not** evidence of
browser HTTP fetch/progressive loading. Actual browser loading/UI remains separate.

After a real completed40 boundary, run `linked-terminal.mjs FINAL.json
RUN40/boundary.json TERMINAL.json` in a cold process. It checks actual terminal
storage retains every31–40 clear and the exact same-run Act4 proof, without an
unfinished battle. The stage40 entry itself must already pass the production
`proofValid`32/39/entry-resident check. These are prepared assertions, not results.

## Final source input and bounded replay contract

The first argument is the frozen **Act4 world**, not the all-campaign inspection
project. The final source QA freeze is recorded in
`evidence/final-silhouette-freeze/official-identity.json`. A full inspection
project has additional stages/assets and must fail this exact identity check.
The guard uses exact deep comparison with bounded assertion text so a wrong
input does not allocate a multi-megabyte formatted diff.

`linked-stage.mjs` now also performs a genuine midstage stop/persist/Continue and
compares units, terrain, objective, turn/phase and resolved static/dynamic art.
Stage36 additionally checks the observed fallen door and presented door lines;
stage40 requires a mid-sailing Continue. These are requirements, not results.
Sparse Native paints consume accumulated unpaused presentation time; actual
physics still ticks at the original fixed step. Native-backend cache flushing
never clears or replaces the game's live Scene cache holders. A 2GiB diagnostic
RSS stop preserves an incomplete input prefix and is neither a gameplay loss
nor a pass. The existing completed evidence must retain its actual source and
runtime hashes, including evidence predating later unrelated fixes.
