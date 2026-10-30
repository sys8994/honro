# Stage 31 roster on v4 R1 public tops

This is a geometry-only reanchor of the existing 34 enemies: 4 elites, 1
midboss, 6 roles, 4 finite activation cells (8/9/9/8), action limit 6. Actor
IDs, horizontal positions, roles, activation settings and combat budgets are
unchanged. Vertical positions and midboss relocation height are interpolated
from exact authored top segments, not rounded or eyeballed.

Source identities (SHA-256):
- Stage canonical compact JSON: `820afd2767fbf275692ef80c02ed8da59424e86bba0aabc21b1a11d6a0f4552f`
- Stage raw bytes: `e863ce5e01c7896e161469f3c9846106267f6f8bba57a2db61d3a49c682a77ec`
- Blueprint raw bytes: `e1c5974f3fad365e1a88e6d20eac0e732abcb6d73f373299945e257c12de6097`

The explicit skeleton input must match all three bindings. The writer preserves
NPCs, events, objective and boat semantics and writes only a candidate JSON.

```
node tools/act4-pilot/build-roster.mjs ../honro-pilot-terrain \
  _local/reports/act4-pilot/stage31/roster-v4 \
  ../honro-pilot-terrain/_local/reports/act4-pilot/stage31/skeleton-v4 \
  tools/act4-pilot/layouts/stage31-roster-v4.json
node tests/act4-pilot-roster-reanchor.mjs
node tests/act4-pilot-roster-native.mjs \
  _local/reports/act4-pilot/stage31/roster-v4/stage.json
```

Static checks cover body span, slope, cover intersections, inter-actor spacing
and other solid penetration. Native checks use actual enemy factories and exact
body contact/pose on public top geometry, activation by posed hero supports,
and clear valid midboss relocation destination. They do not inspect illustrated
body boundaries, play routes, native turn-selection behavior, line of fire or
full battle completion. Public-top acceptance does not imply art/body-boundary
acceptance or an entire stage pass.

Recorded result: 34/34 valid native poses and expected supports, initially 0
eligible enemies, posed cell counts 8/9/9/8, enemy action limit 6. Exact candidate
SHA-256: `5dfb67a082b4321cdf12217668900a8b8b80ef21aa5371bdf52eb21848d6edff`.
Per-actor evidence: `tests/fixtures/act4-pilot-roster-v4-native.json`.
