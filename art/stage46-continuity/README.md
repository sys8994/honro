# Stage46 continuous exterior: adopted integration candidate

## Current selection, not publication approval

The current worktree uses the six `v6-grid/0..5/candidate.json` native color partitions with the canonical source-rock palette installed by `install-v6-palette.py`, plus `v6/tree-wide/candidate.json` for the western tree completion. `v6/concept.png`, `v6/input-guide.svg`, `v6/trace.json`, and the tree concept/guide retain source provenance. No rejected v3/v4/v5 color asset is the selected artwork.

Selection means the current integration route, not final art acceptance, browser play, performance acceptance, master merge, or deployment. The coordinator owns same-camera Native Scene and browser verification. Do not infer acceptance from numerical budget checks or the earlier raster-overlay previews.

## Preserved contracts

Source is `near-import.json[5]`, 1024×1536 at world scale4. Original wall silhouette/canonical alpha, interior groups2..5, walking contacts, shrine and other original props, collision, story, actors, IDs, saves, world size and camera remain authoritative. Exterior bounds are source[-1250,-100,3650,3900]. Generated gold is not a new walking surface. Original source colors/geometry are not rewritten by this artwork workflow.

Six native columns are split into three actual Inkscape Boolean row intersections each. Existing path/compound/clip budgets are unchanged. Colors are composed before one canonical alpha application; the existing bounded renderer is tested separately. Column4/5 reports record epsilon1 accepted results and runtime vector validation, but not Scene approval. Runtime palette provenance is exclusively `v6-grid/palette-install-report.json`, which cleanup did not modify.

## Reproduction

Use Inkscape1.4 and repository optimizer/importer dependencies. The recorded headless environment uses `LD_PRELOAD=/tmp/honro-inkscape-headless-init.so`; restore the existing supported headless setup rather than silently substituting another tracing algorithm.

1. Recover the exact 17,419,521-byte native color raw through the supported Library workflow in `RAW_SOURCE_RECOVERY.md`. Verify its SHA-256. Place it as `_local/stage46/trace-v6/color-raw.svg` and copy `v6/trace.json` alongside it. The large source is deliberately not split/re-encoded into the repository. Alternatively regenerate into a fresh output directory with `python tools/stage46-continuity/trace-hard.py art/stage46-continuity/v6/concept.png _local/stage46/trace-v6`; this uses the recorded actual Inkscape20-scan Smooth-OFF action. Verify trace hashes before treating regeneration as equivalent.
2. In a fresh candidate workspace/output, run `python tools/stage46-continuity/build-v6-grid.py`. It requires the supplied `v3/config.json` and `v3/alpha-composed-raw.svg`, which remain as canonical dependencies, not selected v3 color art. The optimizer refuses to overwrite its outputs. Preserve old candidates before rebuilding. The historical full builder copies the large raw into its art output; keep that redundant raw local/Library-backed rather than uploading it.
3. To resume only columns4/5 in fresh output directories, run `python tools/stage46-continuity/resume-v6-grid.py --trace-dir PATH_TO_TRACE_V6`. It does not touch columns0..3 or install assets. It permits unchanged raw fallback only if the existing importer accepts it; no limit is relaxed.
4. Tree source: `python tools/stage46-continuity/trace-hard.py art/stage46-continuity/v6/tree-concept.png _local/stage46/trace-v6-tree`, then `python tools/stage46-continuity/build-v6-tree-wide.py` in a fresh tree-wide output. The recorded trace is retained at `v6/tree-wide/trace.json`. Only the narrow left completion is adopted; the original tree remains on top.
5. `python tools/stage46-continuity/install-v6-palette.py` installs the six prepared candidates and records palette mapping/hashes. This command changes runtime assets and must be used only during coordinated integration, not merely to inspect art.
6. For bottom-mask reproduction, restore `protection/bottom-contact-inputs/{original-protection,contact-only}.json` into `_local/stage46-resume/bottom-contact/`, then run `preserve-bottom-contact.py`. This installs the protected clip JSON. Inputs are retained byte-for-byte; source color planes and collision are untouched.

The retained source/mask helpers (`prepare`, `export-source`, `protected-collar-fixed`, `protected-contact-only`, `protected-contact-semantic-v6`, `contour-seam-preserve`) preserve the diagnostic lineage and can reconstruct native source geometry. They are not a license to replace the selected mask without new comparison. `capture.mjs` and `performance.mjs` are retained QA utilities. Native source/render checks are not browser campaign play.

## Rejected history and cleanup

Rejected full v3 color artifacts, v4, v5-global, v5-hard, local-v5, v6-split, v6/0 and narrow v6/tree, and unused authoring scripts were moved without deletion into `_local/stage46-resume/rejected-history/`, preserving relative paths in `move-manifest.json`. The old `stage46-work` checkpoint0135b71 was not modified. The full original v6 trace remains in Library and that old checkpoint.

Failures retained as evidence: repetitive oval rocks, oversized smooth planes, straight source-frame/material seams, narrow collar mismatch, and tiny native-face masks leaving needle-like remnants. Earlier v6 raster overlays were diagnostic and magnified blurry raster input; they are not evidence of native output quality. Keep current source/runtime tests and final Scene evidence separate from those rejected previews.

## Final narrow readability correction

The apparent thin western seam crossing the tree was not a vector alpha join. It was the legacy internal collision-wall stroke, world(192,980)→(180,1548). Stage46's two cliff groups now omit only nonwalkable ink. Their collision geometry, all walking-contact ink (including the right-wall walkable segment), original source art and every other stage are unchanged. `tests/stage46-readability.mjs` verifies stage scope, walking-path retention and exact restoration of original cached paths. `qa/readability-cliffs.json` records the actual prepared segments. First candidate CI43996141692 passed; the follow-up CI and public UI remain separate gates.
