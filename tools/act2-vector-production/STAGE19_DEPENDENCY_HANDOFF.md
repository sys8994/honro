# Stage19 awaiting shared Stage18 materials

Status: **DEPENDENCY_WAIT**, not completed or accepted.

Stage19 source and scripts are ready. The final Stage18 material manifest/bytes and its strict optimization proofs are still being finalized by the Stage18 producer. No shared build hook has been changed.

Resume:
1. Merge the final Stage18 candidate commit into this worktree (preserve Stage19 scripts).
2. Run `node tools/act2-vector-production/bind-stage19-shared-assets.mjs`. This validates each shared asset and writes Stage19's own placement record. Do not copy source PNGs/SVGs or create renamed duplicate assets.
3. Run `node tests/stage19-shared-traced-art.mjs`. It separately verifies19 raw/effective source invariants, canonicalSolid/contactInset equivalence, noncombat story/units unchanged, and18→19 library ID deduplication.
4. Under `/tmp/honro-heavy-art.lock`, run `node tools/act2-vector-production/preview-stage19-art.mjs` and inspect entry/farewell/bell/mobile/minzoom/edges. `full-map-diagnostic` is explicitly below gameplay minimum zoom; do not call it a legal camera view.
5. Package19-specific test receipt/views/documentation, retaining exact shared18 optimization/provenance references. Commit coherent changes and send root SHA/tree. Root owns build integration, browser save/input QA and publication.

Shared contract: same `act2-traced:stage18-*` asset IDs/files, Stage19-only `act2-stage19-traced-*` element IDs. Existing exact-ID assets are reused; differing contents fail. Mutable native bell parts are excluded. Original19 dimensions13600×9600, heroes92, entry6240/7402.6667.

Raw18 versus19 differs only in five native iron bell pieces. All static terrain records match. Independent19 compiled world has66 terrain records. Parent-directed authored palette refinement on common material (#88887e→#68777b) is an explicit nonlossless art-direction change; original Inkscape RAW remains preserved by18. It must not be described as a lossless optimizer step.

Intermediate source previews, not acceptance: `_local/reports/stage19-shared-source-preview/` and `_local/reports/stage19-palette-preview/`. Initial pale ribbon concern was raised with18; inspect the refined result before acceptance.
