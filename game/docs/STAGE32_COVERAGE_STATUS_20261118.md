# Stage32 color-coverage candidate status: not release-ready

Latest code0023fef3a05baa461e63ea75423cfe7f0378125e, latest test-only head6e0a1c70b7b0c7022a6206861c31c6d70d497ee0, branch inspect/stage32-scanline-20261118. Helper SHA4965f4b373f55992a022cb00081f44fffe6ce58886dbd6c8601861d37fb83eea. CI44186346757 SUCCESS means specified tests executed, not a gameplay-performance or visual approval. No master/Pages changes.

## What is verified

- Frozen13d baseline images unchanged. Latest two candidate images are exactly the same PNGs as the slow original point-query color candidate (lower38c9da07...,leftddc4c96f...). No pixel tolerance was introduced.
- Original25 path data, palette, order, stage/physics and in-memory battle remain unchanged; no save/storage use.
- Entire original13d Native contract executed unchanged with frozen13d helper, including its expected4-vs1 buffer assertion and16-byte clear.
- Separate current Native contract passed:7 canvases (one field,three transition,three semantic masks), exact retained RGBA accounting,28-byte clear, state restoration, unsupported paint-state fallback, stage/provider guards and source/battle purity. Historical test files were not weakened.
- Missing performance in isolated Native VM fixed with Date.now fallback for metrics only. Filter/shadow unsupported states preserve prior drawing. Semantic masks now resize to1x1 on clear. Source-row cache also clears for cold benchmarks.

## Algorithm and limits

Only partial original grass overcontribution on opaque internal BODY pixels, road contribution0, all x in world y1385..1716. Genuine opaque grass is untouched. Every eligible pixel uses the same16x16 topmost original-source sample grid, including the real5/256 grass in the diagonal representative. RGB alone is changed; full alpha and source curves remain unchanged. Nothing is stroked, inflated or blurred.

Original M/L/C/z curves are split only into analytical monotonic-y intervals for winding queries, not flattened or rewritten. Shared rows reuse source intersections. Within0.002 source-unit of a boundary, original transformed Chrome point containment decides. Earlier narrower fallback failed53+9 pixels, then2 pixels; failure evidence remains. The last isolated mismatch lay0.00105594 from a boundary. The broader oracle fallback removed these discrepancies without changing comparison tolerance. Row cache uses packed Float64/Uint8 payloads, bounded4MiB. Logical payload estimate is separate from actual JS heap/GPU memory.

## Performance: still unacceptable for release

Latest same-job real-clock data,10 cold,60 cached,60 small-pan calls:

|View|baseline cold p50/max ms|candidate cold p50/max ms|baseline pan max ms|candidate pan max ms|
|---|---:|---:|---:|---:|
|lower|30.9/31.8|400.5/423.4|21.6|230.6|
|left|24.5/25.4|356.2/387.3|24.3|171.2|

Cached p50~0.2ms does not hide costly cache creation. Prior typed-row run had lower cold293ms/left256ms and pan168/123ms, but cross-job timing fluctuates; the latest paired result is the defensible comparison. Original direct point-query candidate had20-second cold builds and a lower-view320-second timeout, so it is rejected. Acceleration improved that failure but still costs roughly13-15x baseline cold. Do not ship this on the basis of a green CI badge.

## Five additional viewport observations

Matrix code26b70a74, test146d1020, CI44185296389 failed and remains failed. Its original Native contract error was retained while independent screenshots were collected. All five final alpha comparisons were0; source/battle/camera checks passed. Changes vs frozen13d:

- portrait-overview986 pixels/max58; above world1380:0.
- portrait-bottom1066/max47; above1380:31 pixels, all screen row284(world1376.90),max4.
- landscape-overview2601/max52; above1380:0.
- landscape-bottom2590/max37; above1380:0.
- desktop-walk7825/max66; above1380:0.

The31 flagged pixels may reflect minimum-zoom filtering across the start band, but no semantic road-contribution proof has been completed, so this protective gate is NOT waived. Latest helper has two-view exact equivalence, not a fresh latest-head five-view run. Source masks and output resampling must be distinguished.

Direct lower/walk visual inspection: most internal green hairlines diminish, but bright underpaint traces remain/may become more apparent, and sharp correction start/end needs improvement. No Stage32-wide art pass. Nonwalk color-only edits legitimately break the former world<=1700 blanket identity gate, which remains recorded; this does not waive actual roads, grass, holes, opacity or physics protections.

## Next work recommendation

Do not continue treating this as ready to merge. Resolve (1)remaining source-color artifacts and band-edge/resampling protection; (2)runtime cache cost. Merely expanding caches or lowering sample count is not an accepted solution. A source-defined visible-region representation or a different coverage-coherent render strategy should be evaluated against the preserved exact point-query reference and semantic/source tests. Any new build-time geometry must retain original source/holes and be independently validated; rejected gray Boolean is not a justified shortcut.

Artifacts: first slow failure14371487775; visual evidence14373080860; scanline failures14372592628 and14373546727; two-view exact26b run14374830151; typed-row run14373418783; five-view matrix14375200618; final Native+two-view run14374497206. Artifact expiry is a retention limit; source/tests/report are committed remotely. User saves, existing battle, login and browser handoff were untouched.
