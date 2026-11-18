# Local native paint topology proof, incomplete

Production unchanged. No original vector/source file edits, no Stage3, no remote writes. No added runtime SS or readback. This is a constant-rock native mechanism test, NOT actual registered production texture/Scene/Chrome proof.

Semantic region: source-space topmost union of original paths7,10,18 within the left-junction review bounds, minus every later original path, inset by2device pixels at minimum examined main scale0.6. Original gray RGB inside this expressly nonwalk rock region may change to unified rock paint; source grass12..17, roads21..24, visible protected paths1..4, holes and alpha may not. Only the band surrounding original grass-boundary contours is painted. No final-screen coordinate exceptions. Original geometry and physics are immutable. The inset and author-time derivation produce a951B SVG paint coverage; runtime operation is one native path fill (eventually existing material texture clip, not implemented).

Independent original-curve point test:4144 in-coverage source-grid points, protected0. Nine original-curve owner samples per changed final pixel plus alpha checks pass at all three tested zooms:
-0.25:45 changed, alpha0/protected0
-0.6:65 changed, alpha0/protected0
-1.65:27 changed, alpha0/protected0

Native standalone paint-only p50 about0.0014ms, p95<=0.0032ms; this is only a tiny951B path on reused native canvas, NOT actual Scene overhead or Chrome/device performance.

Maximum-zoom visual inspection still shows long residual contours and does not establish a complete joined seam. Replacing boundary-only coverage with the whole safe rock interior changes the same65pixels at0.6: the semantic safe-region boundary, not merely paint bandwidth, limits the result. This experiment has not met the complete-seam gate; do not submit/promote as an art solution.

Other rejected local branches: all-topmost-material derivation invaded two genuinegrass12 grid points and one final protected sample; path9+20 union changed91pixels but one genuinegrass12 sample; rawgrass12 protection yielded0effect. High-precision full-source cubic flattening before Boolean operations was too slow for this small test and stopped under bounded author-time execution. No weakened protection or pixel whitelist was introduced.

Files: endpoint-proof.cjs is the current measurable small proof, endpoint-{0.25,0.6,1.65}.json and paired PNGs its evidence. Earlier exploratory scripts/results are retained, not candidates. Pending: identify full seam endpoints and which source ownership boundaries prevent complete treatment; independent review of whether protecting original source paint/geometry versus requiring every old mixed-AA final pixel to stay exact is the correct semantic contract. Do not confuse these requirements or relax either silently.

## Explicitly approved semantic-gray follow-up (not old-gate pass)

The parent relayed approval to redesign gray material inside a declared nonwalk junction while retaining grass/roads/alpha/holes/physics. `semantic-gray-proof.cjs` therefore permits topmost source0..11,18..20 gray paint only in worldx25..170/y1716..1870. It does NOT alter source path1 globally or call white path1 a gray asset. New semantic diagnostics replace final-gray-RGB locks only in that domain. At0.25/.6/1.65, changed74/181/498; alpha0/grass-or-road nine-sample violations0. The remaining line clearly continues beyond the rectangle: incomplete.

Connectivity study, not global artistic authorization: derived the whole nonwalk boundary-band topology, then selected its first connected outer contour with enclosed hole contour25 preserved. `component-proof.cjs` retains the raw winding of both. Coverage1866B, source bounds21.515..227.811 /781.515..866.874 (worldx47.333..501.185/y1719.333..1907.122). 31,469 finite grid points inside the selected coverage have0 outside-full-derived-coverage membership and0 original grass/road owners. Changed417 at0.6 and1117 at1.65, exact native alpha, zero nine-point grass/road violations. Direct paired maximum-zoom review shows a long lower-left line segment removed, but its upper end still meets the artificial approved-band boundary at1716 and the line continues. This is a material improvement proof, NOT a whole-seam acceptance. Native standalone one-fill p95~0.003ms at1.65 is not helper/Scene timing.

A further source-only topology inspection using the historical nonwalk1420line connects that left contour to multiple neighboring joins (component2 extends worldx43.87..1198.31/y1420..1911.02). This investigation is NOT authorization to paint the entire larger connected area. No such broad candidate has been rendered/promoted. Choosing a complete source-defined junction requires resolving genuine-grass versus buried-AA boundaries and connected neighboring rock faces, rather than widening a rectangle until tests pass.

See PATH1-SCOPE.md for source role evidence and old versus new semantic requirements. Actual registered material texture, original-visible-grass contribution/expected composition, all-scene external background, and actual Chrome checks remain unproved. No CI package submitted. No production registration.
