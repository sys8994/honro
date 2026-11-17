# Corrected source-space protection: native study only

This is a continuation of the single generated study0a07f611. No new image generation, bitmap asset edit, source-art edit, tracing/optimization, production integration or deployment.
Generated PNG SHA5959af175bff33e643d68100ebba2fe772318ac26f484575cde37d4afc8a9d09 is unchanged.
Original exported BODY SVG SHA607665bc129f6b0a94c5a204a4c33f695e16969de92bff2a47b522dea619238d and original PNG SHAfb303d9af6a6b5c1c3b4a2b820fdd697645538270e1c6d7817edf0c1c7acb10f are unchanged.

## Correction
Native SVG semantic-grass protection is explicitly capped at sourcey1070, based on actual visible grass ending1066 plus3source-pixel halo. Original nonwalking flat closure at1074 is excluded rather than being accidentally protected by scale-dependent palette filtering. This changes the permitted mask definition, NOT a tolerance on protected-road/grass differences. Walking+24margin remains protected; clip still starts+28for4pxAAreserve. All original geometry stays untouched.

Six deterministic same-backend views were compared: source1x, zoom2x, desktop-join.612864, desktop-right.612799, full.332640, portrait-left.179558. Protected pixels and semantic warm/grass pixels changed0in every view. Counts and exact sizes in multiscale-protection.json. Portrait preview now uses the lower-left camera-scale-equivalent source viewport[-1086,-798,2172,3876], so its bottom is3078, not the artificial whole-sprite bottom3600. The composition is artwork-only, not actual Scene or parallax/input.

At2x, an initial broad warm-color classifier reported8changed pixels. Their source positions arex1428.75..1432.25,y997.25..1004.25, on the nonwalking outer alpha line more than100source pixels below the local walking surface. They are warm outline underpaint revealed atsubpixels, not grass. Applying the ALREADY defined4source-pixel artificial-perimeter exclusion consistently to the multiscale diagnostic resolves those false semantic labels. The prior8pixel report is preserved; no production or visual change was made to fix it. Do not present this as an arbitrary tolerance relaxation.

## Actual background compositing diagnosis
The same generated image is placed source-over an opaque gray#808080background and the original game background image, using native SVG only. The game background is stretched to each diagnostic viewport; this is NOT production camera/parallax rendering. WebP decoding toPNG is pixel-exact format conversion, verified array equality, not artwork editing.
In the full1280x1198gray diagnostic,496rendered disconnected residue pixels have alpha1and change gray by exactly1channel value (127instead of128). The dramatic black specks seen in some transparent-image displays are not opaque defects. Actual opaque game-background previews show no obvious isolated black specks. Generated source remains unchanged; no cleanup has been silently applied.

The generated image itself still has359disconnected alpha>0components/2343pixels, allalpha1, whilealpha>127hasoneconnectedbody. A later new-field vectorization may exclude these nonmeaningful disconnected generated residues with this exact provenance. It must NOT delete source original grass/root fragments or adopt upper regenerated source geometry. Connected silhouette/AA must be judged separately.

## Human visual review
Directly inspected corrected desktop-join-game, portrait-left-gray/game, zoom-join-gray. The pale horizontal closure is no longer visible. Organic lower maroon rock continues original curvature/direction and avoids prior columns/triangles. A short dark shadow accent is still present near the lower-left joining area, but it does not read as the former bright cut. This supports continuing the study toward an isolated vector/Chrome candidate, not final art acceptance. No fake horizontal walking shelf or new arch has been intentionally added. Original houses/tree/other landmarks are not part of this BODY-only preview and must remain untouched in the eventual productionScene.

Open: runtime-compatible geometry/mask construction, palette/vector fidelity and boundary AA, exact Chrome protections/camera-corner coverage, art quality under actual production scene, performance/cache cost, integration/save/public UI/device/dynamic states. SVG filter masks here are study-only and not directly suitable for the production VectorArt format.

## Production support gate (source inspection only)
shared/map/vector-art.js in e8d8 supports g/path/use, Path2D geometry clips, paint/opacity and linear/radial gradients. Its draw path has no SVG filter/luminance-mask/feMorphology implementation; unknown attributes are not evidence of support. clipPath builds joined Path2D and applies default nonzero clipping; fillRule support for paints does not itself provide an evenodd clip mode. Current filtered mask cannot be copied into production.

A production-feasible next step must first establish explicit offline source-geometry boolean clipping/protected region geometry with correct winding, preserving original path paint/foreground coverage. If exact curve boolean geometry is not feasible within existing limits, a separate bounded isolated compositing helper requires its own transform/state/opacity/cache/performance contracts before art adoption. No such helper has been authorized or added here.

Crucial AA distinction: where opaque grass/road remains, its original pixels/paint and silhouette must be exact. At partially covered edges over a newly painted rock background, preserve original foreground coverage and color, then compare the expected new source-over result. Do NOT preserve an old flattened grass-edge pixel containing old rock RGB merely to achieve whole-image RGBA0; that would lock in a stale rock halo. Conversely do not use this distinction to waive opaque-road, geometry, alpha-hole or physics changes. Current native whole-protected-pixel results are conservative study observations, not a universal final-alpha test design.
