# Stage3 isolated contour/palette study, 2026-11-18

Base: public master 7d238d20663c3ceffe430eb0304e01516ae625cf. No production module changes and no integration with the ongoing 842 work. This study is not registered in authorStage and does not change public/save data.

The rejected v3 generated study is not reused: endpoint-margin failures and false olive surfaces remain valid rejection reasons. This alternative uses original source vector paths plus four small code-native extension shapes, removing the three stretched crop uses in an isolated Scene. Actual physical floor endpoints are retained as construction anchors. No new collision is created.

Palette experiment merges gray/brown outlining and tones down the pale olive. It may still reduce desirable material contrast: visual review required. Source shapes/clips/transforms remain identical; the original full-map redesign is not reverted.

Initial standalone SVG review shows that the large rectangular skirt has gone, but the lower land mass is too plain, and source-side tonal joins remain visibly abrupt. NOT accepted as finished art. Actual Chrome captures test the production renderer at minimum zoom, normal close view, and right-edge close view; they must be reviewed, not merely accepted because hashes pass.

Tests require unchanged authored stage, physics, camera, pure rendering and no storage access. Synthetic battle only. No user save or gameplay acceptance implied. Further work must improve coherent geology and source-side joins before production registration.

## First actual Scene findings
CI44249462058 passed physics/camera/render purity at four paired views; artifact14403097654 SHA25609748a548f3623cc12739373f48727c4d79dfb850c9f14fed685b8cdd98132a8. Screens visibly show the new skirt clipped to a farther rectangle. Diagnosis: _drawTerrainDomainTiles intersects its iteration range with b.honroTerrainBounds, not artwork bounds. Extending artwork alone cannot fix this. Next isolated runtime unions landmark paint bounds locally when Stage3 is painted, without changing battle terrain bounds, camera or collisions. No production renderer patch. Add native zoom1.65 alongside cached zoom1.05; source geometry remains locked.
