# Runtime source identity, archive identity and behavior

## Current production boundary

The5ca1830 runtime collector has155 files. Compared with the density checkpoint1973f07's133 files,22 are added,73 changed and60 byte-identical; none are removed. The older Stage8 boundary still has130 files. `tests/fixtures/runtime-contracts/current-manifest.json` lists every current path, exact order/hash, immutable before hash and complete relevant change-commit history. The manifest's own digest is pinned; it is not an auto-update script.

`test:runtime-contracts` checks all155 source files, the actual exported `shared/build.mjs` modelFiles order, actual TypeScript compiler input membership/order and generated core. It executes the current `runtimeParts` builder for all8 vector/render/app combinations and the existing temple audit composition. Every part's content/order and whole fingerprint are exact. Full current Game and Workshop bundles must each occur exactly once in their generated HTML. The test checks modified/missing current sources through both current and history-entry validators, injected/reordered sources, and48 missing/duplicate/reordered/core/wrapper part mutations across the8 configurations.

The actual current source/HTML identity is independently recorded. It is NOT replaced by archived identity and is NOT normal-gameplay acceptance.

## Archive boundary

`history-1973f07.json.gz` stores original source strings and raw/temple fingerprint parts as inert byte evidence. Every original source is checked against the pre-existing density fixture's afterSha256. The historical core was reproduced using the pinned TypeScript5.8.3 compiler as a text transformation and matched the original1973f07 generated HTML core byte-for-byte. Historical JavaScript is never evaluated. Existing133→130 checks, density/Stage8/earlier fixture digests and fingerprint expectations remain unchanged.

Current sources can enter an archive-source comparison only after exact current155 validation; archived sources then go through the existing immutable source validators. Fingerprint functions deliberately do NOT automatically replace current runtime parts with archived parts. A negative control requires that giving current production parts to the old gameplay-fingerprint boundary fails.

## Call-site inventory

The following six files have explicit archive fingerprint sections. Each separately validates the actual current build, then names the archived data for the immutable byte audit. Their existing negative archive controls remain. Other behavior checks in these files still execute the current runtime and are not waived:

- tests/encounter-density-history-audit.mjs
- tests/stage8-bier-history-audit.mjs
- tests/stage23-escort-history-audit.mjs
- tests/stage12-quarry-history-audit.mjs
- tests/stage30-ferry-history-audit.mjs
- tests/stage18-bell-history.mjs

The following two call sites combine a real completed-run artifact with current behavior. They are intentionally NOT switched to archive fingerprint data:

- tests/stage12-quarry-next-stage-app.mjs: real saved-profile Continue and transition into current Stage13.
- tests/stage12-quarry-hold-guide.mjs: current native Scene/guide rendering and saved-battle preservation.

Their current fingerprint/behavior incompatibilities require separate approval-supported expectations and actual current behavioral negative tests. A fixed old fingerprint cannot establish compatibility. Passing this source/archive gate does not claim those two tests pass, or that old normal-play performance/completion evidence applies to today's runtime.

## Subsequent changes

Stage5 waterfall, camera drag, later narrative/character work and any later runtime change must be integrated as separately evidenced manifest deltas before a final freeze. The current manifest targets5ca1830's runtime with6186a0e's metadata-corrected campaign build. No wildcard accepts new modules or modified bytes.

After source separation, `stage12-redesign` exposed a real test-runtime dependency error: legacy migration loads current progression without the new contribution-xp module. This is a distinct loader repair, not a reason to substitute historical executable code or a fake ledger. Further actual behavior failures remain separate blockers.

## Approved binding-default delta

Source unit b7ae179 initializes only `sodan-binding.detail` at creation with the pre-existing schema default. The current source manifest records its exact added source text, before/after module digests and one affected part position in each of the eight actual builds plus temple. Every other source, compiler output and packaging dependency stays identical. The current campaign manifest records only runtime chapter10 and complete-project digests; raw canonical,640 asset rows, historical133/130 sources, stored archive parts and every historical expected fingerprint stay unchanged. The independent binding-detail test reconstructs the pinned pre-fix runtime project, then compares all30 complete compiled battles and current save behavior. These are source-proven approval deltas, not an automatic baseline refresh.
