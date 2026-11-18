# Internal material join: local 6184-byte candidate

Research only. Baseline is the unchanged 26782-byte/.05 experimental helper, not production. Original BODY paths, FOUNDATION source, physical bounds and saved source are unchanged.

This paint-only runtime extension copies the existing original FOUNDATION material canvas through a declared native clip. It does not copy BODY pixels. Thus original broad gray/brown shading is preserved rather than replaced by constant gray. No new canvas, readback or supersampling is introduced. One lazy Path2D (6184 bytes of text) and clip/bitmap draw are added; total Scene cost is not yet measured.

The authored left contact contour is within source x0..100,y600..930; its band extends 28 source units inside BODY and 2 outside. Foundation silhouette inset18.194 and other exposed foreground inset9.103 are conservative authoring choices, not user requirements. Original walk/road guards remain. Area9389.96075, BODY-outside area635.62362. Original FOUNDATION silhouette outside area0, walk/road and other visible overlap0 in the author-time geometry checks.

## Explicit changes to material roles
Exactly three small isolated internal overlap regions are recolored: pale area.09477583, grass area.10881839, and mixed diagonal area.68786069 source². Their existence is not denied. The third region is NOT pure path12 grass: original cubic winding samples identify gray9, grass15 and grass12. Its declared artist-region geometry, not a global path-role exemption, bounds the change. Large exposed grass, roads/steps and other pale material remain protected. These regions and BODY asset alpha changes are deliberate changes from earlier stricter contracts; old failures remain preserved.

## Local Native evidence
|View|RGB changed|Terrain union alpha|Background|Raw visible samples|Other visible samples|
|---|---:|---:|---:|---:|---:|
|maximum1.65|2913|0|0|104|0|
|left.6|1305|0|0|8|0|
|phone overview.05735294|100|0|0|0|0|

All raw visible samples were retained and independently classified inside the three declared regions. Nine samples per changed pixel and finite raster views are bounded evidence, not continuous geometric or foreground-contribution proof. Actual Chrome with the candidate is pending. The source-only prototype is not production acceptance.

Direct images show upper vertical, central contact and lower-left short diagonal cleanup while broad material shading remains. A faint diagonal running from the upper large grass toward the center-left remains under classification; Stage32 art is NOT complete. Actual bitmap/clip support must be replayed using that primitive, not the earlier solid-fill support oracle. Final transparent FOUNDATION-union-BODY alpha, sky/background, support outside the declared band, other visible regions and gameplay protections remain strict in the next Chrome package.
