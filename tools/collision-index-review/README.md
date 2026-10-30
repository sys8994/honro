# Isolated exact edge broadphase candidate (not integrated)

`make-candidate.mjs` reads current math.ts and builds an isolated candidate. Shared runtime is never written. `native-override.mjs` replaces the exact transpiled math module text only in its current benchmark process, with an exit guard requiring >=1 replacement.

Existing Engine.collisionTerrain bins whole terrains by x. Giant polygons span many bins, so each relevant substep still performs a full vertex walk. Existing segmentTerrain has per-edge AABB rejection but recomputes bounds for every edge. Existing platform sweep normalizes all upward edges.

Candidate: exact coordinate snapshot validation on every call (not an unsafe vertices-reference-only cache), ordered groups of 16 edges, conservative group bounds; retain original edge order and narrow-phase arithmetic, entering-solid/tangent rules, one-way policy, material/object result handling, skipEdges and first-hit tie behavior. Polygons below 32 vertices directly use the original functions. No simplification or geometry alteration.

Solid group rejection is a superset of current per-edge rejection: bounding extrema aggregate all edges and margin uses maximum edge L1 span, preserving original substep L1 tolerance. Platform bounds allow 2*abs(pad), epsilon along extension and epsilon*L1(motion) time overrun. Every accepted narrow-phase point remains in those conservative bounds. No platform narrow phase is altered.

Pure checks: authored before/after compiled terrains from stages32–38 including roof/cave/land/bridge; seeded local motion, tangent and vertex-adjacent probes, radii0/3/8/22, skipped edges; exact deep equality including normals/time; anchored ordered terrain ties; same-reference coordinate edits, array resize/replacement, oneWay/projectileSolid toggles. Exact stage30 boat authored quad translated in-place as current runtime does. Pure tests do not prove App/FPS/playthrough quality.

## Current decision and repeatability

**Experimental only; not integrated or approved for runtime.** First Native triplet: old-art prediction12.25ms, current-art31.11ms, optimized12.23ms. Current→optimized prediction median improves60.7%, but the single120-tick window worsens140.77→171.38ms (21.7%). Do not claim general performance improvement from this result. Further paired warmed-window/callmix diagnosis is pending. All12 prediction digests, initial actor/state and final state match exactly; disk runtime digest remains264b42d9.

From repository root:

```
node tools/collision-index-review/make-candidate.mjs
node tools/collision-index-review/differential.mjs
node tools/collision-index-review/small-and-mutable.mjs
```

Pure differential fixtures are included. Generated source and fresh receipts go to ignored `_local/collision-index`. Initial Native receipts are preserved in `receipts/`. Native scripts require the frozen baseline/current project JSONs identified by receipt hashes, passed as PROJECT OUTJSON positional arguments; never substitute an unrelated project when comparing results. Coordinate exclusive Native use with QA owner. Optimized process uses `CANDIDATE_MATH=1 node --expose-gc --import ./tools/collision-index-review/native-override.mjs tools/collision-index-review/profile-fixed.mjs PROJECT OUTJSON`. No disk runtime replacement occurs.

Warmed diagnostic variant uses `diagnostic-override.mjs` and `profile-warmed.mjs` for both baseline/current and candidate processes (CANDIDATE_MATH only for candidate). Counters are activated after all measured windows, so instrumented wrapping does not contaminate measured timings. An initial missing TypeScript package import was corrected to the repository's game/node_modules TypeScript dependency before the optimized run; the failed attempt ran no benchmark.

## Warmed paired follow-up

The isolated unchanged candidate was repeated on the same Native lease policy. Prediction median31.23→11.86ms (~62% improvement) replicates. Five120tick windows after120warmup ticks have medians128.75→124.63ms; ranges109–164ms vs123–155ms overlap strongly. The initial one-window ordinary-tick regression is **not replicated**, and no material steady simulation improvement is established.

All initial/final states, each window state digest, all12 complete prediction digests and callmix counts match exactly. The measured-afterward steady120tick interval invoked **neither** optimized routine. Three prediction calls used182 solid segment queries on288vertices and51 one-way queries on142vertices;204/233 queries were under5px. A short-query fallback would discard most demonstrated prediction benefit, so it was not added. Ordinary supported bodies return from `integrateBody` after `bodySurface`/`terrainSurface` support checks; these call `terrainSurfaces`, not the indexed functions. That is a static explanation, not a measured attribution of all tick time.

Warmed receipts and `compare-warmed.mjs` preserve the follow-up. The candidate remains experimental pending root's integration decision; no production source changed. Before adoption, root should apply only the math change and verify the relevant body/projectile contracts against the integrated build. Geometry is unchanged.

## Final root-review edge cases

The final candidate widens **only its new group rejection** to use absolute padding and double the original tolerance. The existing signed per-edge AABB and all narrow-phase arithmetic remain unchanged, preserving even legacy negative-padding behavior. Doubling the conservative group margin avoids floating-addition reassociation undershoot. No positive-pad accepted result changes are intended or observed.

The authored fixture suite now also samples padding-.1/-1/-10 and still passes49,218 exact comparisons plus1,500 anchored ties. `degenerate.mjs` adds52,920 exact comparisons over empty, repeated-point, collinear, reversed-segment, self-intersecting and tiny-edge polygons (including>=32 vertices), zero-length motion, signed padding, skipped edges and all oneWay/projectileSolid combinations. The1,821 mutable/ferry checks also pass. Native timing receipts describe the immediately prior candidate hash; this final conservative group-only refinement was rerun through exact tests, not a new Native timing run. Root explicitly did not require a new Native run for this behavior-preserving group expansion.

## Root-approved source integration

Root approved and applied only final `shared/engine/src/math.ts` (SHA256 b4396325d8f43e7e8125fbc973ea43665e758547ac53310c110d2f48ebe657d0). Production runtime digest is00b3f8b72c707db7b49e5c99d7b56397834b07a2261ef727b1b4639c1c046c3e. No planner, other physics or art source changes belong to this unit. Earlier experimental status above is historical; publication/art release remains separate and blocked.

Pure tests now compare the **actual integrated source** with preserved `fixtures/math-baseline.ts`; generator reads that frozen prechange source to remain reproducible rather than recursively transforming already-indexed code. Integrated49,218 authored/1,500ordering/1,821mutable/52,920degenerate checks pass. TypeScript typecheck passes. Existing6projectile-platform behavior groups,140one-way physics conditions,88production slope rush checks (stages1/3/5/11/18/27), and184body-sweep/legacy-skill/gate checks pass.

`tests/aim-launch-collision.mjs` stops at its initial Stage1 “fixture no longer reproduces embedded muzzle” assertion before shot assertions. The same exact failure occurs with the isolated **original** math module (see baseline log): preexisting fixture incompatibility, not a new collision regression. The test was not weakened or repaired, and its later assertions are not marked passed.

Normal `npm run build` correctly exits1 on missing/expired art-and-readability, camera-and-state and final-integration release reviews. No guard bypass and no generated production build are claimed. The additional paired Native smoke uses `baseline-override.mjs` only for the counterfactual old-math process; the final integrated process has no math override. Runtime remains frozen during those runs.

## Aim validation gap closed (test-only repair)

The old hardcoded x3215/12° fixture failed because current forest-floor geometry leaves the raw muzzle in open air, identically with both math implementations. A geometric search confirmed current Stage1 still contains the relevant product behavior at its existing authored boulder. The repaired test selects a standing pose near that explicitly named boulder using only raw containment and supported-body preconditions—not corrected origin, predicted hit or shot success. No terrain is added or changed. Its label explicitly says **unit-positioned current authored Stage1 geometry**, not normal gameplay.

All original six behavior groups and their shot/guide/material/phase/bounce/volley/tangent assertions now execute and pass on both actual integrated math and original-math process override. The former first-case expected blocker is the actual boulder rather than the no-longer-reproduced forest-floor hillside. Extra self-checks assert a valid supported actor, shoulder outside all solids, raw muzzle inside the boulder, and corrected muzzle outside with a real nonzero correction. Both complete result JSON files are byte-identical. Old failure outputs remain preserved; repair details/results are in `receipts/aim-fixture-repair.json` and `aim-repaired-*`. Runtime fingerprint remains00b3f8b7…046c3e; only the test and review evidence changed.
