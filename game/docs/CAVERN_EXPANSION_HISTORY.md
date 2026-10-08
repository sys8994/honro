# B cavern history and Library provenance

The B test projection reverses exactly 146 paths in stages 11–19 from source
`540391e` to approved public A `cab313b9404c1cb4da82c62fdb017bbed1aae02b`.
The fixture records complete source commit IDs and nine full-stage before/after
SHA256 hashes. It was derived by comparing those immutable campaign JSON files,
not by re-recording any older golden hash from the current output. Runtime tests
need only checked-in fixtures; they do not require Git history or local branches.

`beforeCavernExpansion` verifies every current path value and presence before
reversing it. Named collections require unique IDs. Existing array order is
retained; polygon/route arrays are exact values. Unchanged values remain visible
to full-stage hashes. Stage 15 reverses only B's optional-route annotation before
the original A forest/cavern delta. `beforeApprovedTopology` composes these two
reversals in that order. Old guardian, objective, roster and terrain projections
run afterward, without replacing their original fixtures. Current movement,
mission and combat tests still use the current production project.

The original village and temple preservation fixtures both record Library hash
`c1c0e092da50db58c5273fd076ba5a8e097ee6d138303fe99a1351cc7b3607ee`.
Their original sources `aa5f6d5` and `44f69dd` reproduce it. Approved public A
contains 49 added waterworks assets and a reordered Library; the original 355
asset values remain exactly unchanged. Both approved and original orders are pinned. B's Library is byte-equivalent under JSON
serialization to A, hash
`9a355e51d027dff100f6b6d819c01dfe3ae96e3491904654fb7ca8e4b9f2f0cd`.
The separate provenance fixture pins each added asset's ID and hash. Tests
check the complete approved Library, every addition, and the original hash after
removing only those exact additions and restoring the pinned original ID order. Neither old preservation fixture is edited.

Focused commands:

- `node tests/cavern-expansion-history.mjs`
- `node tests/cavern-library-provenance.mjs`
- `node tests/forest-cavern-history.mjs`
- `node tests/act1-act2-history.mjs`

The forest history entry imports the B and Library tests, so the existing
`test:forest-cavern`, migration and offline/integration gates execute them.
Mutation controls cover every B path's changed/missing value, duplicate IDs,
unapproved HP, mission radius, markers, floor geometry, names and extra terrain;
Library controls reject old/new asset changes, removal, duplication, reordering,
unapproved additions and rewritten old fixture hashes. Original A forest and
ACT2 mutation controls remain in place.

These are exact data/history checks, not browser, art approval, normal combat or
continuous human play evidence. Aggregate and deployed Pages validation belong
to final integration.
