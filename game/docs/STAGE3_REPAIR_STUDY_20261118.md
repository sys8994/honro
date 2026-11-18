# Stage 3 production repair integration

Candidate branch: `fix/stage03-exterior-readability-20261118`.
Public baseline: `7d238d20663c3ceffe430eb0304e01516ae625cf`.
Validated production revision: `5960c2b9d81b291552ead223d83ae0ae9c876845`.

## Product changes (only four files)
- `tools/map-forge/naru-body-finish.mjs`: new source-preserving post-optimizer BODY finish; three source fill substitutions, no original source path/transform/clip rewrite. Replaces thin-strip stretching with irregular dark exterior descent, continues the right rock stratum and ground rim, adds narrow closed-fill timber grain.
- `shared/build.mjs`: import and apply the derived finish immediately after canonical terrain optimization. The optimizer's SHA guard and optimization manifest remain unchanged.
- `shared/runtime/renderer.js`: an explicit `paintBeyondTerrainDomain` asset flag expands decorative paint bounds only; battle/camera/physics bounds and tile-cache caps remain unchanged.
- `shared/runtime/terrain-readability.js`: explicit `omitTerrainClosureIds` removes nonwalkable synthetic closure ink only. Actual walk rims remain.

`act1-naru-doldang.mjs` is restored to the public version. No layout fallback, chapter replacement, gameplay unit placements, collision points, camera limits, story data or save codec change. No Stage32 or 842 integration changes.

## Saved games
A new chapter entry receives the new registered BODY. An existing saved battle retains its own inline BODY and stays unflagged; no silent visual replacement of saved snapshots. Tests use isolated in-memory synthetic profiles, not user saves. Exact old-code save restoration, provider-less restore, saved same-ID variant retention, fresh roundtrip and critical-save-failure tests must be retained.

## Visual evidence
Four existing Library comparison images remain the shareable baseline/candidate set. The desktop-right candidate is Library version2 for production5960c2b; the pier-close candidate is version1 (same timber finish as final). Both identities are preserved.

The isolated production Scene compares six views: portrait lower-left minimum zoom, desktop lower-right minimum zoom, pier cached1.05, rock cached0.65, pier native1.65, rock native1.05001. Final Scene run44257279516 succeeded; artifact14406114749 has SHA256 ed6f00147b9f0d832214f743b7e2266d994f71ebe461ba8b74e0c5545de394ff. Source conservation and physical/camera equality are asserted. This is not a normal user playthrough or public deployment test.

## Performance constraints
Headless CPU reference only, not device FPS. Expanded art can allocate more terrain tiles: prior observations desktop8,520,192→19,170,432 bytes and portrait4,260,096→9,585,216 bytes; screen cache unchanged. Existing12/24tile cache limits remain. Final real-clock ABBA workflow44257279513 succeeded, including all24 fresh-process PNG strict comparisons and save tests. See STAGE3_PRODUCTION_VALIDATION_20261118.md for raw statistics and artifact.

The original virtual-time samples were all0ms and discarded. Fixed Scene.time did not freeze clouds because they use performance.now; tests now fix the production animation clock while timing each render with an earlier bound native clock. Internal renderer millisecond counters are invalid under this visual clock; external render durations and byte/build counts are valid. No strict PNG assertion was relaxed.

Do not count the legacy act1-local-art-save table-assumption failure as pass: unchanged public and candidate both report `Missing table for stage3`, because current act1-site assets are saved inline. No codec behavior was added to satisfy that outdated test.
