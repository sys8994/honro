# Stage46 continuous shaft exterior (candidate)

Base: c31ad3ed5f7e8521f9438892cdc1ef069d890ade. Later master 806f555 includes stage33 and must be preserved on integration.

Scope: replace the sampled/blurred exterior of `act5:near:46` only. World4096×6504, source1024×1536 at scale4. Internal arch, shelves, shrine, crossings, golden walking surfaces, collision, story, actors, IDs and save contracts remain canonical. This is an artwork correction, not stage redesign or completed campaign play.

Source is `near-import.json[5]`. The six root children include clipped west wall, east wall+basin, and four protected interior groups. `export-source.py` preserves clips, symbols, use and transforms. Do not identify visible props from the raw cumulative color paths alone.

Camera coverage was measured from HonroBounds: focus[-320,-1800,4416,6744], source-space x[-990,2014], desktop bottom2277.25, portrait390×844 bottom3585.49 (with overscan). The nonplay external geology bounds exceed these side/bottom values; sky may be transparent. Camera, actors and world dimensions are unchanged.

Concept input roles: actual source vector raster and approved stage21-concept style reference. First concept failed: mapping narrow strips across a broad margin produced stretched large planes and vertical seams. Kept as rejected history. v2 uses a padded actual source SVG as spatial guide, with original artwork small in upper centre, then built-in image generation outpaints the surrounding geology. The central image is not adopted; all original internal artwork remains native.

Both candidates use actual Inkscape1.4 color+alpha tracing, native Boolean extraction, repository optimizer, coordinate registration and bounded quantization. The native trace is retained separately from registered/optimized files. No source-pixel stretching or blurred gradient extension is used by the candidate renderer.

Status: v3 integration preview under inspection. Not approved, not merged, no browser play or performance claim. Native screenshots are diagnostic production Scene renders, not browser screenshots. Never deploy a rejected candidate.


v3 uses a smaller-facet material concept. Runtime BODY alpha inside the original image is the original west/east wall alpha; interior root children2..5 are untouched. The original visible supports and props are retained via native source-geometry protection masks. The generated gold/warm markings and white matte are remapped to slate because only original supports are authoritative. Both BODY and protected source composition use the existing bounded two-canvas single-mask path, avoiding per-color clip accumulation. Temporary canvas max1024² each and release behavior remain covered by the stage45 composite regression.

Raw composed alpha is retained for contact exactness; the optimizer alpha candidate was generated/tested but not adopted at protected inner outlines. Color optimization1unit plus0.01 coordinate grid is non-destructive to raw. Renderer tests validate unchanged canonical stage/content/assets (except new supplementary46 art), no collision in the art asset, five actual minimum-zoom/focus viewport envelopes, and native state-pure captures with identical gameplay hash9bb1b06981a5f5b3058887bff17110630b96d210f2c26c69a2004fa660f96023.

Rejected concepts and native Boolean assembly inputs are retained under `_local/stage46`, not shipped. They are not approved outputs. There is no new browser play claim.


At max camera1.65 with source-to-world4, color ROI raw/final comparisons rendered at6.6px/source-unit(1320² each). West/east/basin mean channel error0.0082/0.0100/0.0205 on255 scale; max11/10/17. East raw/final images were directly reviewed; no meaningful color-form loss observed. These are vector optimization comparisons, not image-generation fidelity or FPS measurements.

## Candidate5 inspection (not accepted)

The corrected native protection mask fixes independent relative `m` concatenation and native overpaint-union defects. There is no longer a spurious huge diagonal protection triangle. The source-visible gold diagnostic finds 0 missing pixels. Native Scene overview, east portrait and bottom minimum portrait were directly inspected. Side/bottom coverage reaches beyond the tested camera envelope, but the narrow full-height original wall collar produces a visible material seam; the generated exterior stones also remain more uniform/larger than the original. Therefore candidate5 is not accepted for publication. All protected-input hashes and contact/edge/composite tests pass, which does not override the visual rejection.

Next candidates compare a finer original-style rock material and a source protection mask limited to actual road/ledge/ornament regions. Original wall silhouettes remain enforced by the canonical BODY alpha. Preserve all candidate5 files under `_local/stage46/candidate5` and `portrait5`; these are Native Scene diagnostics, not browser play.

## Work-branch checkpoint: v4 rejected; no release

Latest master reported by the coordinator is c26abb7; this branch remains based on c31ad3e and must be narrowly integrated onto a fresh master only after approval. The current supplementary runtime asset in this work branch is v4 for comparison, NOT a release-approved replacement. Native portrait7 shows overly smooth enlarged inner-wall planes; v4's outside material is repetitive oval stone rows. Both are visual failures despite native budgets and optimization fidelity passing. No master update, build, browser play, or deployment has occurred for stage46.

The next approach restores all original wall color planes and changes only a narrow frame-adjacent region. Separate local west/east concepts are checked in a diagnostic raster overlay at actual actor scale before native tracing. A straight 30px protection candidate preserves source ornaments and all walking surfaces, but its join and the distant-wall join must still be visually resolved. A native visible-color-face mask experiment was rejected because it left disconnected needle-like crack remnants and exceeded the single-path budget. It remains diagnostic history, not runtime.
