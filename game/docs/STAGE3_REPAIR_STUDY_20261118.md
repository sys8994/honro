# Stage3 isolated contour/palette study, 2026-11-18

Base: public master 7d238d20663c3ceffe430eb0304e01516ae625cf. No production module changes and no integration with the ongoing 842 work. This study is not registered in authorStage and does not change public/save data.

The rejected v3 generated study is not reused: endpoint-margin failures and false olive surfaces remain valid rejection reasons. This alternative uses original source vector paths plus four small code-native extension shapes, removing the three stretched crop uses in an isolated Scene. Actual physical floor endpoints are retained as construction anchors. No new collision is created.

Palette experiment merges gray/brown outlining and tones down the pale olive. It may still reduce desirable material contrast: visual review required. Source shapes/clips/transforms remain identical; the original full-map redesign is not reverted.

Initial standalone SVG review shows that the large rectangular skirt has gone, but the lower land mass is too plain, and source-side tonal joins remain visibly abrupt. NOT accepted as finished art. Actual Chrome captures test the production renderer at minimum zoom, normal close view, and right-edge close view; they must be reviewed, not merely accepted because hashes pass.

Tests require unchanged authored stage, physics, camera, pure rendering and no storage access. Synthetic battle only. No user save or gameplay acceptance implied. Further work must improve coherent geology and source-side joins before production registration.

## First actual Scene findings
CI44249462058 passed physics/camera/render purity at four paired views; artifact14403097654 SHA25609748a548f3623cc12739373f48727c4d79dfb850c9f14fed685b8cdd98132a8. Screens visibly show the new skirt clipped to a farther rectangle. Diagnosis: _drawTerrainDomainTiles intersects its iteration range with b.honroTerrainBounds, not artwork bounds. Extending artwork alone cannot fix this. Next isolated runtime unions landmark paint bounds locally when Stage3 is painted, without changing battle terrain bounds, camera or collisions. No production renderer patch. Add native zoom1.65 alongside cached zoom1.05; source geometry remains locked.

## Paint-domain actual verification and remaining outlines
CI44250277976 passed all5 paired views including native1.65. Artifact14403123835 SHA256ed8003e6102e0ea3e1d13dc1047b88885a278a82c3f193b8cb38f5eefb329aed. Actual minimum zoom images confirm the new lower tile-cut rectangle is gone after paint-domain union. Physics/camera remain equal and rendering/storage assertions pass. Remaining large black rectangle follows ferry-ground's synthetic floor/side collision edges, drawn by terrain-readability.js. Next test retains all walking-edge readability but omits only Stage3 ferry-ground's nonwalkable underground/domain edges. A2-source-pixel same-color underlap at original rectangular source boundaries tests AA contact seams without moving any source path. Still not registered production art.

## Underground edge result and AA-tail correction
CI44250891553 passed all5 views. Artifact14403323216 SHA256629c099296cab54db8b57a1886b5295839d1431c2c4553ee17bfffc430a4a5ec. Actual captures confirm the large synthetic collision-outline rectangle is removed while walking rims remain. Underpainting AA joins reduced but did not remove the smaller source rectangle. Native source pixel inspection finds every pixel in rows882..886 exactly RGBA(20,44,47,255), and side tails below723(left)/708(right) solid. Next cap paints only those synthetic AA closure tails after the original source, retaining all paths and all actual surface contact art. No blanket masking of visible roots/supports/walking edges. Upper right source seam remains outside this bounded correction.

## Production registration candidate
The current branch now registers the finish in the Stage3 BODY author only. The raw source JSON, original source paths/clips, stages, collision, units, goals, story, camera and revision fields remain unchanged. A dedicated production module owns the same finish used by tests. New BODY params explicitly opt into decorative paint-domain extension and omission of `ferry-ground` nonwalking closure ink. These flags gate renderer behavior, instead of a Stage3-ID-only rule, so restored old BODY assets do not acquire the new behavior.

Art refinements add low-contrast irregular strata/fractures, short intentional wood-grain strokes inside the four supporting timbers, and narrow right-hand floor finishing only up to its actual physical endpoint. Existing source controls are retained. Uniform right wall AA tails receive the same bounded correction as the bottom tail; no visible walking rim is erased.

The actual Scene harness now runs an untouched public-master worktree and the registered branch source, with no monkeypatch and no after-build art injection. All5 paired views must pass and be visually inspected again. Save roundtrip and ABBA performance validation are being prepared separately. No master merge or Pages deployment has occurred.

## Preserve canonical optimization guard
Initial production CI stopped with `Terrain art changed before optimization: act1-site:3:body`; no registered candidate image was rendered. The canonical optimizer correctly rejected an author-time replacement. Registration is moved to `applyNaruBodyFinish(project)` immediately AFTER `terrainOptimization.apply(project.library)`. The original author is restored; original optimizer and manifest remain untouched, including all SHA and size guards. This is a derived visual finish on the exact optimized public source, not an optimizer bypass. Add a sixth actual view just above the1.05 native-render threshold for the right join.
