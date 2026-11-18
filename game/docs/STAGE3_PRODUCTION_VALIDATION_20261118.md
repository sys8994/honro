# Stage3 production validation handoff

Prepared only, not executed against a final production candidate. Parent owns integration and remote writes.

Install four .mjs files under tests/ and YAML under .github/workflows/. Do NOT enable this workflow until the candidate author actually registers the new BODY and its paintBeyondTerrainDomain / omitTerrainClosureIds flags. This suite refuses a test-only runtime. The browser fixture has no source replacement or test artwork injection.

## Save and scope
Baseline public SHA7d238d20663c3ceffe430eb0304e01516ae625cf generates a synthetic initial Stage3 battle using production code. Candidate must match every authored stage and every non-Stage3-BODY asset exactly. Compiled battle is compared in full, excluding only exact nested BODY asset payloads. If a new renderer metadata field fails this strict comparison, inspect it; do not broadly discard non-art fields.

Old inline and production-encoded snapshots restore exactly in the new codec, including with the current provider library removed. A saved same-ID variant is preserved. Fresh candidate roundtrip and flags are checked. Old saved assets must remain unflagged, so paint-domain and nonwalkable-rim changes can be gated by saved asset flags rather than Stage3 ID. Profile migration compact-vs-inline equality is additional evidence, not a substitute for exact old battle restoration.

Storage in appHarness is an isolated in-memory Map, never the user's browser storage. critical-save-failure additionally exercises synthetic quota and error rollback. The legacy act1-local-art-save suite is run on both code versions and its exact known Stage3 table-assumption failure is retained as a pre-existing failure, NOT counted as a pass. Unexpected or different failures still block. No normal-play/real-device quota assertion.

## Performance
Same fixture copied byte-for-byte into baseline and final candidate worktrees. Three views: desktop minimum zoom, portrait minimum zoom, native1.65. Each view runs baseline/candidate/candidate/baseline twice, fresh Chrome profile/process per entry, sequentially on one runner. No source overrides and no helper instrumentation that differs between versions.

Each entry records initial pre-image-decode frame separately;5 fresh Scene/tile/screen-cache builds after image/source preparation;2 screen-prime frames;24 warm calls;12 actual constrained pans in both directions. All raw samples and Scene cache memory counters are retained. Each timing phase is labeled, especially that scene-cold is NOT full app cold startup. Warm samples assert no domain tile rebuild.

Comparator enforces same physics, camera and authored stage, and stable render PNG per variant across repeats. It reports phase medians/p95/max and per-ABBA-block deltas; it deliberately does not invent a time threshold or silently call positive regressions a pass. Review cold/pan/native costs and portrait memory, not warm-cache timings alone. No normal-play FPS claim.

The actual requested pan coordinates are included in each row. Native zoom may be constrained in x by normal camera rules; compare observed paths rather than intended positions.

## Local validation performed
Node syntax checks passed for all4 scripts. No repository checkout/dependencies exist in this child workspace, so runtime/codec/Chrome execution remains to be performed by CI after parent production integration. Not production acceptance.

## Corrected public-codec assumption
CI44253255164 failed while creating the public baseline, before candidate verification, because this test incorrectly demanded a local-art table. Exact public profile-store.js localArtAsset accepts act1-traced and selected other prefixes, not act1-site. A local VM reproduction using the unchanged public codec confirms act1-site:3:body is returned inline with the same reference and restores exactly; an otherwise identical act1-traced synthetic asset creates a table. No codec registration variable is missing. The script now records actual inline/mixed representation, checks self-contained duplicated BODY payloads and idempotency, and compares the real old representation across versions. It does not add a new codec rule or pretend compact savings occurred. This patch remains unexecuted against the full candidate harness pending CI.
