# Expanded actual Chrome result: failed protection checks and visible activation discontinuity

CI44234241948, commit3365613c945010d8ab54a0b54bee193583f58d19; artifact14396883086. ZIP SHA25602df07ec03918ad4d7da06bf0d87210e0a64f61a0050bed680663041717692b3.26Scene captures and all6paired directBODY threshold probes completed. Original source/physics/codec/baseline7goldens passed. Candidate319KB remains test-only and independently fails clean wholeScene performance; no production registration.

| View | Changed RGB pixels | Strict failures |
|---|---:|---|
| lower |10613|none|
| left |8891|none|
| portraitoverview/bottom |0/0|none; native disabled, art unresolved|
| landscapeoverview/bottom |0/0|none; native disabled, art unresolved|
| desktopwalk |5511|1pixel outside independent fill-support mask|
| native-tile-below |0|none; disabled|
| native-tile-above |8861|none|
| renderer-below/at |10807/10809|none|
| renderer-above |5428|2Native owner samples identify originalpath14|
| maximum1.65 |5596|none|

WholeBODYalpha, finalScenealpha, originalBODYempty/background, actual49walk guard and road/pale samples remain0 in all13views. The failures are NOT waived. Desktopwalk pixel(253,648)green90→89 with fill-support maskalpha0. Actualhelper usesclip(path)+bitmap, whereas prior independent mask usedfill(path); fill-vs-clip raster support is under separate investigation, not an assumed tolerance.

Live1.05001 owner failures:
- pixel(1100,418), sample(.1,.5), sourceActual(333.591287925,766.017163993), blue95→96.
- pixel(1098,419), sample(.5,.5), sourceActual(332.898653807,766.450060317), RGB96,96,92→94,94,96.
Native rawcurve owner says14; GEOS gray says9. Independent originalcubic root winding gives latergray20/9. Points lie only.00012..00020source from near-coincident originalgrass14 and latergray10/18/20 curves. These are much smaller than authorflatten.005. This may be a backend boundary-oracle discrepancy or tiny sourceface issue; do not yet claim confirmed grass removal OR dismiss it as harmless. Original actualChrome membership and raw/recentered microscopic raster/contribution tests are prepared separately. No coordinate whitelist or removed owner gate.

Direct transparentBODY probes .599999/.6/.600001 at phase0/.25 all passed alpha/BG/footprint/9owner/49walk checks. ActualCTM below.6:0changed. At.6:4808/4781changed. Above.6:4807/4784changed. Native-call deltas match actualgate, fallback/transition skip0. This proves bounded execution/protection, not smooth appearance.

Actual nearbycamera discontinuities:
- Camera2^(-3/4) below→above: native effect0→8861pixels. Difference-of(native-baseline) across these nearly identical cameras changes8861pixels;5278over1channel,2086over3, max21. Existing cache raster changes also affect baseline, so those counts isolate added correction rather than all scene drift. Direct visual comparison confirms long greenlines suddenly disappear at activation. Gate pop remains unfinished.
- Renderer1.05 below→at: additional correction drift175pixels,3over1,max2.
- Renderer1.05 at→above:10433additional delta pixels,5316over1,1911over3,max23. Cached/live raster differences require explicit visual review; neither protection nor continuity is accepted from the aggregate alone.

Direct full-image review confirms central seam improvement but persistent upperbranches/verticaledge fragments. Lowzoom and activation behavior remain unfinished. Keep SS and originalsource unchanged. Follow-up diagnosis uses frozenactualartifact and a singleChrome source/clip probe, not26repeatedcaptures. Further performance work targets a simpler candidate independently; existing319KB findings are retained.
