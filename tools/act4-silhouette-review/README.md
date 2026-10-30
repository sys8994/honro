# Act 4 silhouette / blue-dawn revision — 2026-10-29

Status: user rejected the preceding density-only art pass. No current visual approval. Production world remains unchanged while representative candidates are tested.

## Actual screenshot audit (31–40)
Inspected original final Native Canvas screenshots materialized in `../act4-silhouette-audit-current/` (outside repo). These are actual engine art views, not browser/device proof.

| Stage | Observed unresolved defect |
|---|---|
|31|Smooth long bank, large interior rounded masses, ruler-straight timber vs detailed reeds/boat.|
|32|Ornate cover constrained by eight-point outline; flat base over sloping ramp reads floating. Foot actually lies on ramp: do not claim physical floating. Pale sky/walls and gold earth dominate.|
|33|Repeated small stair tiles read as bendable textured rail; outer route remains simplistic.|
|34|Large flat ceiling and diagonal edge, broad triangular interior face, detailed tiny rocks.|
|35|Same clipped two-peak cover outline; floor long smooth slope, gray daytime sky.|
|36|House/door improved but wall/door detail mismatch; broad gray-brown ground and gray sky break dawn.|
|37|Golden soil stripe, clipped cover masses, uniformly extruded timber ramps.|
|38|Eight-point cavern ceiling, long flat floor, small primitive distant ridge.|
|39|Uniform wood/stone strips, dense internal stone marks, angular cut banks, dense wreck contrasting plain outlines.|
|40|Uniform bridge bar, straight basin outline, oversized inner rock cells. Original normal camera lacks actors; cannot establish contact readability.|

## Correction order
1. 32 cover: native authored outline + supported landing, explicit collider/material audit.
2. 33 stone causeway: purpose-built native source, no repeated stair-texture rail; meaningful top and underside, true one-way geometry, 50-world gap retained.
3. 38 cave ceiling: eroded non-periodic outline; do not reopen existing blocked shot lines through oversized recesses.
4. Actual whole-frame blue dawn: authored far raster/mood, sea, environment and house contrast. Do not dim HUD/actors globally.
5. Propagate only reviewed role-compatible modules and repeat actual full-frame/contact/mobile checks.

## Shared initial palette (targets, not approval)
Sky #243b50; horizon #4e677c; sea #294a5d; distant forms #3c5669; shadow #172b3a/#1c2d3e; broad rock planes #2b4052/#344b5d; restrained contact edges #526477/#5c7180. Preserve material distinction and character colors.

## Acceptance gates
- Judge normal gameplay scale first, then contact closeup and portrait. Include real actor feet/aim targets in contact shots.
- Distinct silhouette before texture. Two or three broad planes per mass; interior not busier than playable boundary. No periodic bead/stalactite necklace or repeated tiny staircase patterns.
- Do not invent fake walkable art. Geometry revision must be compiled and tested: visible support/real surface agreement, no unintended new jump blocker/shot corridor, tide/refuge intact.
- One-way underside is intentionally nonblocking; do not claim all rock faces collide. No visually opaque lower-route obstruction allowed merely because collider is one-way.
- Retain raw native SVG/concept. Optimize within measured silhouette/protected-feature limits; numerical feasibility is never visual approval.
- Prior native receipts remain historical evidence only. Active art and integration verdicts are pending following user rejection.

## Observed failed shortcuts (33 representative)
The v3 hanging-lobe source mapped twice became a rhythmic rock necklace; rejected. The v4 flat beam bent along a smoothed gameplay spine became stone cloth; rejected. Both demonstrate that increasing outline complexity or softening a polyline is not structural art direction.

**Required correction:** render the actual gameplay skeleton (including bridge grades, raised span, support locations and landings) as a reference image *before* concept generation. Author the complete structural profile in the concept, trace it natively, and preserve its meaningful stone edge deviations. Do not force a generic flat kit around arbitrary stage polylines. Reuse only truly compatible modules. A new bank outline must also replace the real collider, not be painted on top of the old triangular mound.

### Full BODY domain requirement (2026-10-29)
A nominal stage width is not the camera domain. Before generating a terrain concept, the skeleton must include **actual collider minX/maxX, every camera-visible margin, and the visible deep bottom**. Otherwise even good source artwork develops vertical image edges at world0/width. Build-time source validation must render BODY alone against the actual compiled solid, without the engine's base fill: `check-body-coverage.mjs PROJECT STAGE OUTPUT SCALE`. It checks the full actual terrain X extent and visible camera depth, excludes only one raster boundary pixel, and rejects interior alpha gaps. Record its pixel scale; it is not a visual/gameplay approval.

An opaque native Inkscape rectangle union entirely inside the real solid is a technical coverage operation, not invented decorative artwork. Keep the authored natural top untouched. Prefer this simple union to repeating irregular artwork into deep layers. Existing candidate margins may reflect the native edge with support-aligned affine pieces and physical-domain clipping **outside** the playable interval only; future concepts should include those margins from the beginning.
