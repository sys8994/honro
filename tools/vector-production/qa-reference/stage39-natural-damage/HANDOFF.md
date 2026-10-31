# v3 natural wreck damage geometry — isolated deliverable

**Replaces held v2. No shared source or remote changes.**

- Patch: `wreck-damage-natural-opt-in.patch`; base/result hashes in `BASE_SHA256SUMS` / `RESULT_SHA256SUMS`. Exact final-source patch consistency and `git apply --check` pass.
- Candidate delta: `candidate-delta.json`; only `design.vectorWreckInTerrain.damage` added to latest sharp39. No actor/terrain/initialState/tide/objective changes. HP7800, optional objective, four residents, actor/AI/weapon anchor unchanged.
- Actual authored outline: one54-vertex central plank silhouette, not two small hit strips. Bounded maximum4polygons/64vertices each/128total. `outline-provenance.json` documents material-first authoring. Primary target point(3590,2370).
- Projectile-only hull shape replaced with the visible material outline; physical terrain/body/route remain unchanged. Dead unit's material still blocks as hull terrain, without damage. Independent deck/obstacle/NPC earliest contact remains authoritative. Expanded projectile silhouette is considered even outside the old hull's spatial bin/AABB.
- Projectile/AoE/phase special sweep/homing/ultimate children/summon bolt/autoaim/critical use the same existing unit identity. Existing coefficients retained; no extra proxy actor. The existing ballistic seeds are enabled only for opt-in autoaim targets.
- Validated geometry is a detached transient WeakMap cache; authored data is immutable between sceneVersion updates, matching existing terrain-cache discipline. No serialized cache; replacement references, aim changes, sceneVersion invalidation and malformed data are tested.

## Validation scripts/results
- `tests.mjs` → **22 checks,5 actual shots,1–30 fallback30/30 PASS** (`tests-final.json`). Includes material/void controls, NPC interception, JSON save, dead wood shielding/path persistence, overlapping two-polygons single AoE identity, special sweeps, guidance, critical coefficient, malformed/missing link fallback.
- `distributed.mjs` → **33 actual fired A01 shots** against11 independent material target samples from three reached positions,14 distinct50world contact bins; no failure, all terrain unchanged. Upper-route shot separately passes in main suite. Full results `distributed.json`.
- `negatives.mjs` →3 actual empty/gap-direction shots, boss damage0 and no actor hit; other unchanged terrain correctly stops each projectile. `negative-shots.json`.
- Existing generated guided child fixture: same a4-wreck targetId,19steps,133HP loss,one hurt. Fixture explicitly positions an ultimate root to exercise its real child generator/flight; not a full ultimate-cast campaign test.
- Normal A01 hits148 or180 where existing +22% critical criterion applies; M01 explosion192,one hurt. NPC misfire still intercepts resident3 with the same original63.9 damage; no new immunity/redirect.
- Four-class upper/lower actual movement replay results completely equal baseline; NPC4 full-actor walk/integrate results equal baseline (`movement-results-v6*.json`, `safety.json`).
- `typecheck.mjs` → project ES2022 baseline0/candidate0 (`typecheck-final.log`). Cloud clean branch MUST run its own `npx tsc -p game/engine/tsconfig.json` and existing regression suite after application.
- Warm A01 prediction8samples: baseline P50=7.11ms/max12.92; optimized v3 P50=13.14ms/max15.58. Before transient compilation v3 P50≈24ms. Local Node measurements, not public browser/mobile acceptance.

## Actual Native evidence / residuals
- Material outline: `_local/reports/stage39-local/target-natural-v3/39-landscape-high-normal-wreck.png`.
- Actual impact scatter: `.../target-natural-v3-distributed/39-landscape-high-normal-wreck.png`.
- Production compiler delivers damage opt-in without battle injection. `compiled-sea.json` in Native folder also verifies current high tide helper active at2812.5; differing initialState continuousSea absence is not changed here.
- Existing HWD01 actual frame: `.../target-boss-shot-anchor/39-landscape-high-normal-wreck.png` + `actual-shot.json`. Muzzle remains airborne at(2941.06,1725.43). **Muzzle origin / HPbar / hover / public browser final visual acceptance remain a separate next step**, preserving artillery warning target and timing.
- SOP changes recorded in `SOP-SUPPLEMENT.md`; v2 test overfitting and our earlier string-replacement/typecheck setup errors are explicitly recorded, not blamed on baseline.

Final route-fixture clarification: the replay now constructs the candidate through the production compiler and asserts active damage metadata **before** its existing enemy-free movement isolation. Both candidate-enabled input and same-candidate/no-opt-in baseline replays pass8/8 with identical result JSON,HP loss0,resets0 (`baseline-movement-results-v6*.json`). Because the historical route fixture then keeps only its moving hero, it is explicitly a terrain/locomotion proof, not full-combat/dead-enemy projectile proof. Full35-actor NPC walking and the live-battle nonprojectile collision test cover the separate body/actor invariant.
