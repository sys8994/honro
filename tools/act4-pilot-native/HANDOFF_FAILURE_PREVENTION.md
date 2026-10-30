# A08 — art packages must not silently choose gameplay authority

Cause: a geometry-only stage held4 players and no enemy roster. A subsequent
attempt to copy the current canonical stage found34 enemies but used stale v1
Y coordinates. Neither is the validated v4 combat roster. Both generated project
handoffs were explicitly withdrawn before gameplay use; canonical input files
were never modified.

Prohibited retries: never infer "latest validated" from a current worktree, copy
units alone, drop enemies to make art preview pass, or silently override geometry
and gameplay revisions while delivering a library. Do not label a geometry-only
art project as a complete tested stage.

Replacement contract: deliver `art-package.json` containing library and ordered
placements only. Root alone merges pinned geometry plus pinned combat stage
units/encounters/initialState activation/design.pilotRoster together, keeping
NPCs, event objectives and original dynamic boat identity. `write-art-handoff.mjs`
requires the explicit validated roster path and normalized SHA, checks34 enemies,
and excludes gameplay/collision fields from the delivered package.

The validated v4 roster reference for this review is:
`honro-pilot-combat/_local/reports/act4-pilot/stage31/roster-v4/stage.json`,
normalized SHA `5dfb67a082b4321cdf12217668900a8b8b80ef21aa5371bdf52eb21848d6edff`.
This reference is evidence for the handoff, not permission to publish. New revisions
require a new explicit SHA. The art library/placement SHA and final merged stage
SHA must be recorded separately. Release stays blocked until actual App and all
physics/combat/art gates pass.

# Exact native curves: regressions that numeric anchor algebra missed

Narrow Skia clip/union baking lost up to12world of the east top, despite correct
anchor algebra. Replacement splits native Beziers at mapping boundaries and applies
affine transforms directly. Floating endpoint disagreement must be welded within
an explicit tiny tolerance; otherwise SVG serialization emits hundreds of new M
commands and creates holes. Closing cubics must be serialized explicitly, never
replaced by a straight Z. Degenerate-only segments after .001-world quantization
may be omitted; nondegenerate closing curves must remain. Round-trip curve checks,
fill occupancy, runtime budget validation and actual contact boundary tests remain
independent of artistic/physics acceptance.

Oversized shore paint compounds are authoring-only intermediates. Runtime paths
still obey60000. Broad Skia partition failed containment and was rejected; the
fallback polygonizes bounded .02world flattening with original winding semantics
and .001-world grid, retaining holes, before broad GEOS tile partitions. This is
an approximation requiring normal/max-zoom seam/edge review, not an exact-fidelity
claim or a relaxation of any runtime limit.
