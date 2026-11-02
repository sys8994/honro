# Stage12 returning mountain path — art candidate

**Provenance status: PARTIAL.** Exact originally submitted imagegen prompts were not retained in accessible files/current context. Reconstructed prompt briefs are not original prompts. Source/raw/final hash chains, optimization checks and native visual review are separate; full SOP provenance acceptance is NOT claimed.

Authority: current pre-runtime-author Stage12 plus its production-story effective projection, not frozen legacy maps. Stage12 remains 11200 × 8000; hero height 92; all world terrain, collision, camera, units, objectives, exits, events and narrative retained. Existing distant image remains separate.

Native IDs: `act2-traced:stage12-ground`, `act2-traced:stage12-quarry`, `act2-traced:stage12-rear-foundation`, `act2-traced:stage12-rear-vertical`. Ground/quarry are decorative, zero-collision assets clipped to existing world polygons. Four-world-unit visual contact inset leaves the physical silhouette unchanged. Rear geometry uses the original silhouette, seating, foot, sockets and reference scale metadata.

## Iteration decisions
- Quarry v1 was rejected for oversized pale faces; v2 is selected.
- Local oldroad/foundation v1 had lateral rectangular joins; rejected.
- Full-width v2 material scale was rejected before tracing. Full-width v3 preserves continuous dummy extensions; the separate irregular local playable band replaces oversized pale material around the recurring waymark without stretching the entire 23200-wide dummy span into one playable texture.
- Rear vertical eight-color trace exceeded native compound budgets. Unchanged generated source retraced through an explicit four-color palette (trace4); old raw retained in cloud workspace, not used as the optimization baseline.
- Playable band five-color trace had distracting palette speckles; three-color retrace selected. No raster editing was used to create vector geometry.

## Reproduction / integration
Run `tests/stage12-traced-art.mjs` from repository root. Integrator invokes `applyStage12ArtCandidate(project)` on the RAW project before the runtime author hook. Its whole-stage SHA guard deliberately refuses author-source drift. No shared dispatcher, profile-store or runtime edits are included.

Native A/B renderer: `node --expose-gc tools/act2-vector-production/preview-stage12-art.mjs ART_DIRECTORY VIEW`. Heavy rendering/comparison must hold `/tmp/honro-heavy-art.lock`. Views include normal zoom .94, original hero92, minimum zoom, mobile390×844, left/right ends and editor overview.

## Evidence boundaries
Raw→optimized SVG pixel gates are separate from the intentionally lossy raster→palette→Inkscape trace. Source images and exact selected immutable raw gzip are retained. Prompt files are explicitly reconstructed briefs, not falsely claimed verbatim transcripts. Native rendering/contracts do not certify browser playback, gameplay clearance, save quota, CI, deployment or public verification; release lead owns those checks.

Bottom-inspection is explicitly outside the playable camera bounds: the preview-only existing skillPreview flag bypasses clamping to inspect the exact y=32000 solid termination. It is not a gameplay camera claim.
