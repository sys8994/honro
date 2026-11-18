# Fixed27KB BODY guard: ten additional views

CI44249143419, commit6c5c5e04dca4c1b251ff728f7e4c5b66ac0cb05e. Artifact14403755563, ZIP SHA256 0b011f381d5e1ee499ea44c7fed8f49c8e5f3063d90d3a685799c865dc3d3f54. Workflow FAILED strict protection. All20 original/candidate Scene captures and extraction completed, observed baseline PNG/BODY golden checks passed. No benchmark loops or frame-rate claims.

|View|RGB changed|Raw failures|
|---|---:|---|
|lower|7352|none|
|portrait-bottom|586|[{'name': 'outside', 'value': 1}]|
|landscape-overview|1786|[{'name': 'outside', 'value': 1}]|
|landscape-bottom|1525|none|
|desktop-walk|3498|none|
|native-tile-below|8641|none|
|native-tile-above|7066|none|
|renderer-below|8194|none|
|renderer-above|4138|[{'name': 'ownershipViolation', 'value': 2}]|
|maximum|4572|none|

All ten views: BODY alpha changes0, Scene alpha changes0, outside-BODY RGB changes0, partial-BODY changed0, walk guard violations0. These do not waive the raw failures.

## Outstanding pixel classification

Portrait-bottom(142,294):[94,94,95,255]→[94,93,95,255], replay paint maskalpha0. Landscape-overview(449,231):[120,114,111,255]→[120,113,111,255], maskalpha0. These are one-channel1 changes requiring independent composition/support proof, not blanket tolerance. Exact blit/tile evidence is retained; this audit did not substitute a binary/semantic pass.

Renderer-above retains original Native owner14 disagreements at pixel(1100,418),offset(.1,.5),source(333.591281814632,766.017163472902), and(1098,419),offset(.5,.5),source(332.89864771850654,766.4500597829804). This matches the ongoing near-coincident original-curve ownership investigation. Not newly resolved by27KB geometry.

## Direct visual review of all ten candidate PNGs

Canonical lower/phone/landscape views preserve the large terrain silhouette, bridge/stairs/grass silhouettes and arch opening. No new large rectangular cutoff was observed. Desktop-walk preserves visible foreground ordering of characters, railings, stairs and terrain.

In the .5946 threshold pair, both frames retain the correction; no prior entirely-off→entirely-on repaint is visible. Renderer1.05 pair still changes sharpness and subtle line visibility with existing cache/live transition. At max1.65, several interior curved green seams are visibly reduced versus original. However the long left vertical/kinked original boundary, short pale segments and neighboring gray material tone seam remain. Those also appear in baseline; they are unresolved art defects, not evidence of newly damaged walkable geometry. High-zoom completion is not claimed.

## Zoom difference evidence, not automatic continuity pass

Old native threshold0.5945935575→0.5946135575: native effect8641→7066; effect-set change2493. Whole-frame baseline changes120044 pixels versus candidate113393; both maximum RGB54. This disproves the former zero-effect onset for these two poses, not all continuous zoom artifacts.

Renderer1.04999→1.05001: effect8194→4138; effect-set change4254. Baseline changes60154 pixels versus candidate52664; both maximum RGB38. Screen coordinates are not perfectly world-aligned across zoom; changes include legitimate renderer resampling. No numeric zero-difference or all-scale visual pass inferred.

## Status

Seven additional views raw-pass; three remain unclassified strict failures. Phone component/edge investigations continue independently. Production adoption, full art completion, performance and saved battle playthrough are NOT established. Existing source/physics/battle/storage guards passed; no production changes in this audit.
