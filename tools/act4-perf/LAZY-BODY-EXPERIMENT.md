# Stage 40 lazy BODY experiment — rejected

Source base `979b9d14f8a874b82fffef1a063728261d422700` (includes the signature cache). Original assembled world SHA-256 `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. This is an isolated experiment; the patch is **not a runtime change to integrate**. It includes diagnostic hooks and an experimental equipment-observation change. The result is not a performance claim.

The patch in `lazy-vector-probe/experimental.patch` implements a getter on `approved40:body` only on restoration of an official stage 40 reference. The getter clones a private frozen canonical vector into a mutable own data property; the renderer and A01 replay use an explicit resolver while it is pending. Changed providers trigger materialization of the old canonical data, rather than reconnecting silently. The QA candidate also skips an equipment transaction when a stage 40 observation finds no change, because `equipment-state.js:transaction` otherwise performs `structuredClone(b)` on the first frame, invoking the lazy getter. This observation change itself has not received an independent contract review.

On a real boarding checkpoint imported through the title UI and continued in Chromium, two BODY assets remained pending after entry, compact snapshot and A01 prediction. On that one instrumented fixed scene, the resolver and independently materialized control produced the same canvas hash; A01 prediction JSON matched; ordinary clone changed the getter into a data property, a simple metadata edit and a direct vector edit remained inline. The archived result is `lazy-vector-probe/ui-result.json`. This does not demonstrate an improvement in frame distribution, long play, portable UI download, actual mobile behavior, or the full user-edit contract.

## Blocking counterexample

`compactLazy` serializes a shallow metadata surrogate first and, if it differs, materializes and falls through to the existing full-asset comparison. A metadata object's `toJSON` can return a modified value on its first invocation and the old value on the second. The existing code calls it once and keeps the asset inline; the candidate calls it twice and incorrectly emits the old official reference. The caller's asset therefore does not have the same persisted representation. The executable counterexample prints and asserts:

```
baseline  {"calls":1,"ref":false}
candidate {"calls":2,"ref":true}
```

Descriptor inspection alone cannot safely classify all unknown values here: a Proxy may present ordinary-looking descriptors while changing normal reads or invoking side effects. Accordingly the existing unsupported-input fallback cannot be guaranteed by this candidate. Comparing just object identities or skipping metadata validation would permit stale references. This failure is separate from the earlier bare-reference rendering failure: the actual render resolver was connected and visually checked here.

## Reproduction

Use a disposable worktree at the stated base, apply `git apply tools/act4-perf/lazy-vector-probe/experimental.patch`, then run `node tools/act4-perf/lazy-vector-probe/metadata-counterexample.mjs` and `node tools/act4-perf/lazy-vector-probe/getter-experiment.mjs`. The latter exercises the simple getter, JSON/structuredClone, direct edits, metadata, changed provider and custom-map branches; it does not cover the counterexample unless the separate test is also run. The browser harness records its fixed checkpoint paths and requires the isolated QA build and server configured in its source. Do not apply this patch to the shared RC.

A safe future design needs to establish a provenance and mutation contract for **all** metadata participating in the asset's ordinary JSON serialization, and preserve one-pass observable serialization and fallback atomicity. No such production contract or safe change to the current mutable asset interface has been established here. Existing synchronous snapshot and verified signature-cache paths remain in place; the repeated 40 save/frame cost and cold-tile delay remain unresolved. No deployment was performed.
