# Stage 33 continuous western foreground

Paint-only replacement of the lowland asset, not a new collision/domain provider.
The previous rear extension did not extend the foreground. A separate foreground
extension was rejected because its material seam remained visible. This version
uses one imagegen concept and a single native vector/alpha across x=-3000..6912.
Existing interior contact points are registered unchanged; outside x<0 is scenery.

Pipeline: concept.png → native Inkscape 1.4 16-color trace (15,870 source segments)
→ color+alpha registration to existing lowland walk edges → bounded optimizer.
Registered color: 41,020 segments / 676,075 bytes. Final: 35,608 / 588,788 bytes.
768/1536px error checks accepted; source and optimized assets retained here.

Preserved: all collision, actors, objectives, metadata and old save providers.
Staircase horizontal contacts retained, bright broad rims reduced to thin worn edges.

Verification: focused stage33-coastal-art test passes. Native Scene captures must
load act4-pilot-art.js in addition to render-only runtimeParts: without this
production opt-in, readability falsely draws closed collision edges on the art
and omits the actual backdrop. capture-stage33.mjs corrects that inspection path;
this is not a production runtime fix. Public pre-change browser inspection also
confirmed the artificial black outline was absent there.

Not a whole-stage redesign. Angular existing arch and physical staircase remain.
