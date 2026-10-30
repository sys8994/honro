# Functional-layout failure notes

Read `game/docs/PILOT_FAILURE_PREVENTION.md` (root source 2bdd86d3a) before retries.
These notes are fixture/geometry evidence, never spatial-art acceptance.

## F01 — Jump envelope / P02
- Cause: initial layouts used world gravity 320, whereas `integrateBody` uses 1000 during a jump; actual basic apex is about218.
- Forbidden retry: adding tiny repeated steps or altering the engine/player to salvage 350–450-rise shelves.
- Replacement: actual production bodies; broad walkable rising contours between conservative seams; per-edge then continuous entrance routes.
- Evidence: stage31 exact SHA `3595025b…` had60/60 edge checks and4/4 continuous dock approaches with no mid-route pose/budget/HP corrections. Art/party combat remains separate.

## F02 — Arrival target / P05
- Cause: old boat-deck y1860 and desktop camera y1840 survived terrain relocation.
- Forbidden retry: fixing only the screenshot or teleporting the party into the old completion rectangle.
- Replacement: authored boarding config with unchanged legacy defaults, actual dock-to-event-deck seam, same quiet/all-grounded/interaction predicate.
- Evidence: `test-boarding-config.mjs`; final App boarding still needs the integrated campaign.

## F03 — Successful connectivity did not create strategic geography / A04
- Cause: three repeated pinched columns and then a single long zigzag over empty space.
- Forbidden retry: hiding that skeleton behind impressive art, counting physics success as natural/strategic map acceptance, or adding meaningless optional hops to hit metrics.
- Replacement: revise major geological masses, overlapping combat pockets, safe retreats, underpasses and alternate climbing before artwork freeze; preserve genuine support/headroom.
- Evidence/status: root rejected both compositions. Stage34 remains spatial-design revision; its68 edge/4 continuous reachability passes do not close A04.

## F04 — Continuous fixture repeated jumps at its destination
- Cause: the stuck-input recovery ran in the same frame as a successful landing at target x; depleted movement could trigger another jump before renewing the turn.
- Forbidden retry: counting those repeated jumps as effective movement or refilling moveLeft directly.
- Replacement: return immediately after target landing; renew via real finishAction/tick only. Keep raw input counts separate from effective tactical movement.
- Evidence: stage31 revised fixture4/4 continuous approaches,8 jump inputs/4 drops each, no repeated destination loops.

## F05 — Drop input is not air steering
- Cause: the39 fixture requested `drop` across a lateral gap. While platformDrop is preparing/falling, public move input is not accepted, so bodies fell vertically past the next shelf.
- Forbidden retry: driving `walk` directly to bypass the public input gate or enlarging the jump/gravity envelope.
- Replacement: use real walk-off for a lateral descent, or provide a genuine overlapping receiving shelf for vertical drop. Probe current state transitions.
- Evidence/status: first39 edge run48/68 retained; four resident geometry walks separately passed. Revised receiving surfaces/control modes await exact-SHA recheck.

## F06 — Broad-support sampling and failed-route endpoint claims
- Cause: using only a huge ground polygon's endpoints/midpoint missed a nearby connected shore; the diagnostic then walked to the final objective after an earlier route failure.
- Forbidden retry: labeling final coordinate attainment a completed continuous route or reusing an earlier stage hash.
- Replacement: sample source-local target points and points just beyond each seam; run objective approach only after every route edge succeeded. Report objectiveApproach separately.
- Evidence/status: fixture changed with the39 geometry unit; new full checks pending. No failed run is removed.

## F07 — Natural support lines themselves failed the frozen straight-run definition / A04
- Cause: sampling long straight segments into more vertices left the underlying support contour unchanged. Mapping attractive art onto those lines would flatten it again.
- Forbidden retry: subdividing lines, micro-jitter, excluding all walking tops, changing the30% cap, or inferring an art pass from connectivity.
- Replacement: first measure functional support tops with the frozen CSS protocol; register camera matrices and material exceptions; then author real broad/medium bends with a separate revision and rerun physics. Preserve stage31's prior candidate independently.
- Evidence: `measure-support-straights.py` and `test-support-straights.py`; normal0.7 diagnostic ranges were31:77.36–100%,34:83.46–100%,39:88.42–100% (six of six crops each exceeded30%). Final painted occlusion/observed runtime cameras remain unregistered: final art gate BLOCKED, not passed. Fine line subdivision and jitter fixtures remain100% straight.

## F08 — independent 31 v2 curve draft, NOT accepted
- Cause: v1 long straight support contours persist through otherwise successful kinematics; native source art alone also does not guarantee the frozen projected straight-run gate.
- Forbidden retry: subdividing a straight line near 80 CSS px, noise/jitter, modifying thresholds, or overwriting the frozen v1 candidate/proof.
- Replacement: explicit authored broad crown/channel/shoulder control points, monotonic piecewise cubic support interpolation, real collision vertices sampled at <=5 world units, slope audit before Engine revalidation. Curved party-start support samples each player's actual X rather than copying one spawn Y. Separate `skeleton-v2` artifact directory and explicit source/dir arguments preserve v1.
- Current evidence: domain zero errors; maximum actual segment slope 1.296. Unchanged diagnostic metric: normal 0–34.57% (1/6 >=30%), maximum nonempty samples 56.18–56.40% (2/2 >=30%), minimum 0–20.01%. Thus still FAIL/unfinished, no art pass. Full technical PNG inspected: broad curved tops visible but rhythmic scallops and inherited pinched support masses remain visual-review issues. Physics retest pending. Protected natural bank flats remain counted, timber dock alone excluded by frozen material rule.
- Reproduce: `python tools/act4-pilot/curve-layout.py`; `node tools/act4-pilot/build-skeleton.mjs 31 _local/reports/act4-pilot/stage31/skeleton-v2 tools/act4-pilot/layouts/stage31-v2.json`; then probe with `--dir=_local/reports/act4-pilot/stage31/skeleton-v2`. This is an independent unfinished revision, not a replacement release.

## F09 — projected-unit zoom dependence must not drive small-wave overfitting
- Cause: fixed 80 CSS px / 2 CSS px error selects progressively shorter physical arcs at higher zoom. The same smooth physical shape can therefore report more straightness when enlarged.
- Forbidden retry: adding little waves solely to satisfy maximum zoom, weakening 30%, or silently substituting a new definition for frozen v3 results.
- Replacement (root-requested auxiliary only): freeze each physical window at normal-policy0.7, project at each zoom and normalize to reference CSS before the unchanged measurement pipeline. Actor66 world corresponds46.2 reference CSS;80px is1.7316 actor heights. This is a normalization sanity check, not empirical proof of perceived naturalness.
- Evidence: v2 six fixed-window ratios [16.61,14.10,34.57,0,0,0]% identical at all3 zooms (delta1.94e-16); v1 [95.21,77.36,86.87,100,91.29,80.55]% (delta4.44e-16). v2 boarding-return34.57% still fails30% even in this auxiliary. Frozen support-straights.json remains unchanged and failed/blocked.

## F10 — root visually REJECTED the v2 repeating ripple silhouette (A04)
- Cause: applying many similarly spaced alternating extrema across almost every support produced rhythmic scallops. Numeric straightness improvement did not make this natural; this is visual overfitting.
- Forbidden retry: adopting v2 because Engine passed or adding more waves for zoom metrics. Do not spend additional Engine cycles before the replacement silhouette receives root review.
- Replacement: independent v3 authored with only 3–7 intentional large points per non-ground support: asymmetric rise/shoulder, long incline, broad crown, concave descent, short landing bench; the shoreline has much broader wet-bank relief. PCHIP only interpolates those authored shape decisions; no repeating wave template or threshold-length segmentation.
- Evidence retained: v2 SHA201eb1a93a25ba00eba084bc9c9f7e59f9db9d08daaf202f356e6d39508f47e2 had60/60 per-edge-body and4/4 continuous movement-only geometry passes (6 movement-only rounds,8 jumps4drops,HP0), but root image review REJECTED it. The probe had already exited when rejection arrived; no more v2 engine jobs were run.
- v3: domain0, max actual slope1.145, immutable v1/route/boarding invariants pass; full technical PNG sent for visual-first review. No v3 metric or Engine execution before initial visual review. Gray pinched support masks are inherited non-walkable constraint masks, not final art silhouettes.

### F10 v3 review boundary and unchanged metric results
Root visually approved the v3 support silhouette to proceed to physics, NOT whole art/game acceptance. Frozen metric remains failed: minimum9.75–51.59% (3/6>=30%), normal63.66–88.70% (6/6), maximum83.13–95.51% (2/2 nonempty). Fixed physical-window auxiliary [82.45,86.48,83.38,72.32,63.66,88.70]% is invariant over zoom to3.33e-16. Thus projection scale is not the only issue: the current maximal low-direction-change-run definition also classifies long parts of these broad natural curves as straight. Preserve this disagreement explicitly; no criterion exemption or acceptance was granted and no ripple may be reintroduced to manipulate it.

## F11 — body-scale annotation must come from actual compiled players
- Cause: auxiliary zoom report annotated66 world as actor height, but66 is a camera calibration reference; actual compiled stage31 party bodies and `shared/map/units.js` are h92,r22.
- Forbidden retry: presenting the camera calibration constant as a real actor size or changing player dimensions to make a contour look larger.
- Replacement/evidence: corrected annotation to92 world /64.4 reference CSS and80px=1.2422 actual body heights. All fixed-window ratios unchanged: their calculation uses normal scale0.7, not the annotation. Single west-ledge facet study shows44×92world collision proxies at0.7 and preserves original support endpoints. Root-requested visual-first study only, not integrated or Engine tested.
- v3 Engine outcome preserved:60/60 edges,3/4 continuous; archer stops atx6499.735 just before the6500 seam while replaying a fixture landing point with1px deadband. Other3 reach dock. This suggests a fixture-controller target issue, not a proved terrain block; geometry remains unchanged and the failed route is not relabeled pass.

### F11 seam-controller correction (static)
Use an interior movement target (35 world inset, bounded by support width) for explicit walk transitions instead of the microprobe's first-contact coordinate. This removes the mismatch between first-contact arrival and1px movement deadband without changing any body pose/collider/budget. Jump/drop destinations are untouched. Pure target regression passes; actual Engine rerun still pending and previous3/4 evidence remains preserved.

### F11 single-facet measured result
Root visually approved the one-support facet study for local validation. Actual Engine incoming/outgoing12/12 and per-body bidirectional walk8/8 pass with h92/r22, no HP loss; setup pose only, no mid-route edits. Candidate SHAea9d04eae54b6d1cd784d0c00ca4e5e2bf4325ff28b4089478a6401ace70e3b7. Original metric normal desktop27.65% / mobile43.36%; maximum91.66–98.90%; minimum0% is low-scale diagnostic only. Fixed-physical-window results27.65%/43.36% invariant across zoom. The mobile hardcap and desktop target remain failed. Do not add corners solely to reduce them. Compact reproducible receipt is evidence/stage31-west-ledge-facet-study.json; full ignored artifacts remain in west-ledge-facet-candidate.

## F12 — root-authorized v3.1 denominator, not a candidate-specific exception
- Cause: overlapping camera samples and viewport clips changed the support-length denominator; the same bench can dominate a mobile crop despite unchanged world geometry.
- Forbidden retry: silently deleting old v3 failures, excluding inconvenient supports or natural flats, tailoring camera bounds, or claiming whole-stage average excuses a bad local image.
- Replacement: root-authorized v3.1 counts every unique natural support top exactly once at reference0.7. Original 20% target/30% cap remain; per-view/other-zoom metrics remain diagnostics plus mandatory visual review. Duplicate support IDs error; camera multiplicity/crop has no effect (regression PASS).
- Whole-stage comparison: v1 95.36%, v3 88.51%, v3+singlefacet85.52%; all cap failures. Role-specific v4 candidate26.941% is below30% cap but above20% target; this is only the top-contour result, not whole acceptance. No natural-flat exceptions; wood-only exclusion unchanged. Receipt evidence/stage31-contour-versions-v31.json.
- v4 is separately authored by movement role, not repeated support templates; broad coastline basins and original contact endpoints retained. Existing rooted masses attach to the revised shore (no added skirt). Domain0/maxslope1.3. Full image submitted for visual-first review; Engine retest pending.

## F13 — preserve safe launch margin, not just matching endpoint heights
- Cause: v4 facet departure steepened the last50world on west-step. At valid25world inset the rise to receiving pose became217.5world, effectively apex217.8 and outside robust live-body clearance. First run56/60 edges and0/4 continuous correctly failed.
- Forbidden retry: raising player jump, moving fixture launch to the unsafe lip solely to pass, or claiming endpoint difference proves reachability.
- Replacement: move the steep shoulder earlier; final departure tongue is shallower while both original endpoints and route remain. Actual rise at inset drops to195world. R0 failure artifacts preserved; R1 exact stageSHA820afd2767fbf275692ef80c02ed8da59424e86bba0aabc21b1a11d6a0f4552f passes60/60 edges and4/4 continuous,6 movement-only R,8jump4drop,HP0. Whole-stage v3.1 ratio26.94465%,20% target missed. No combat/art completion claim.

## F14 — post-combat fixture setup must validate collision pose before ticking
- Cause: boarding fixture initialized first bodyx5970/y3900 based only on shore top, but east solid mass overlaps that shore region. Invalid setup fell/recovered and lostHP; this is not a valid route trial.
- Forbidden retry: ignoring setup validity, accepting the resulting complete flag despite HP loss, or moving the body during traversal.
- Replacement: bank setup6040/6090/6140/6190 is validated for all4 h92/r22 bodies before simulation; invalid fixture now aborts immediately. Real event creates deck6260/3900/450; real move/integrate walks each body aboard,HP0. Three aboard remains ineligible, four grounded allows probe without completing, explicit interaction alone completes. Dialogues/DOM receipts omitted and no enemies initially: local post-combat fixture, not App combat victory.

## F15 — raw file hash and normalized stage hash are different identities
- Cause: stage.json is pretty-printed while physics receipts hash JSON.stringify(parsedStage). Treating the normalized820afd… as a raw byte hash triggered a correct combat-owner identity question.
- Forbidden retry: assuming a hash mismatch is harmless without recomputing both, or relabeling either value as the other.
- Replacement/evidence: builder emits identity.json with raw stage, normalized stage, raw blueprint and exact canonicalization. Current R1 raw e863ce5e01c7896e161469f3c9846106267f6f8bba57a2db61d3a49c682a77ec; normalized820afd2767fbf275692ef80c02ed8da59424e86bba0aabc21b1a11d6a0f4552f. This metadata change does not alter candidate geometry.

## F16 — one-way Engine connectivity does not prove thick-rock visual traversability
- Cause: several overlapping ascending links use one-way supports. The real Engine route can pass upward through their undersides. Fitting deep native rock bodies to those tops caused the optimizer's actual-trajectory torso samples to lie71–100% inside painted rock on west-step/broken-crossing/ridge-shoulder/lookout.
- Forbidden retry: treating60/60+4/4 kinematics as an occlusion pass, leaving a thick visually-solid body around a one-way ascent, or silently changing top/solid semantics after roster verification.
- Replacement: root/art must approve a shallow/open underside that keeps the traversed actor space clear, or explicitly authorize a separate solid-side-entry geometry revision with new Engine/roster proofs. Current R1 remains preserved and is NOT final art accepted.
- Evidence: optimizer's honro-pilot-native-opt/_local/reports/stage31-full-native-v4/route-occlusion.json uses exact current stage identity and actual6frame-sampled continuous trajectories. Sampled overlap is a definite failure diagnostic, not a complete swept-volume test. Native solid-mass uncovered regions and pinched/stretch artifacts also remain unresolved.

### F16 root-authorized timber semantic revision (separate R2)
Root chose thin jetty/plank visual semantics for all current one-way support surfaces rather than repainting them as thick natural rock. Future natural ledges must start with solid physics, not rely on hidden underside passage. R1 is preserved. R2 changes11 baseMaterial fields only; exact terrain points/walk flags/covers/player poses/routes/boarding deep equality passes. This is static collision equivalence, not a new Engine run.
All authored unique walk-support tops are always reported alongside natural/timber groups to prevent material-label metric evasion. R2 natural37.368% FAIL (shore49.05%, west-ledge27.65%, ridge-court11.44%, east-overhang6.95%); timber14.885%; all surfaces including existing boat-access dock27.566%. No natural-flat exclusions. Previous R1 ratio26.945% excluded only that original timber dock. Root received this worsened natural-only result; no terrain change was made merely to relabel it pass. Receipt evidence/stage31-v4-r2-timber-transition.json.

## F17 — Stage34 structural exploration is not a finished natural-space candidate
- The isolated stage34-v2-structure draft removes five cloned tactical bays and adds a sheltered west climb, central connected drop/crossing pocket and different-height upper-court entries. Three route choices are declared; original exit/wrong-exit story semantics remain.
- All intended natural shelves are solid from inception (A07), rather than reusing one-way ascent proof. Domain authoring has0 errors, but no Engine proof exists. Solid overlapping shelves can block formerly possible underside entries, so route lists alone are not reachability evidence.
- Self-review of full.png: branching/overlap improved, but thin detached shelves and unresolved large cliff-body attachment still dominate. Do NOT advance to art/expensive physics as if this solved the natural composition. Need coordinated cliff-body/cave-mouth silhouettes and support side-entry clearance first; do not hide detached collision planks under deep decorative rock.
- This exploratory draft is preserved separately from original34 and from verified31; stage-specific body work on31 remains first priority.

## F18 — authored top inventory is not automatically exposed or body-valid
- Cause: an authored shore contour may lie inside another solid mass (e.g. failed5970 fixture). A whole-stage authored-top metric alone must not certify visible or actually standable contour length.
- Forbidden retry: manually excluding inconvenient shore spans, changing the support set per candidate, or equating static pose validity with route reachability/rendered visibility.
- Prepared general procedure: probe-exposed-supports.mjs uses actual live C.exposedSurface on every declared support and then C.validTerrainContactPose for every distinct real party h/r footprint. No region-specific masks. It emits authored/exposed/contact-valid lengths and separate inputs to the unchanged whole-stage metric; all natural/timber/all-surface group values remain disclosed. Half-world-unit midpoint sampling and boundary uncertainty are explicit; it is not an exact swept/pixel-visibility proof.
- Pure mask tests pass full/gap/empty/subdivision invariance. No Engine measurement has been run for this new tool yet; execute on the approved newBODY candidate with the shared heavy slot, not on a guessed art shape.

## F19 — native BODY fitting still needs exact protected-contact checks
- Cause: the first stage-specific east BODY fit had native boundary y errors1.2783world atx4980 and12.1686world atx6500 against unchanged approved support endpoints. A10world-spaced check found145/170 samples beyond0.5CSS at normal zoom. West/court sampled maxima0.128/0.140world did not show that failure.
- Forbidden retry: moving the approved top to match the misfit, publishing the first export because source anchors were approved, or rect-cutting the body to old trajectory coordinates.
- Replacement: optimizer repairs native Bezier splitting/affine fitting without redrawing source or changing target top. Geometry proposal tool preserves exact approved tops and retains the entire native lower arc; .12world adaptive flatten +.1world simplification are explicit. No canonical writes. The initial cyan/gray overlay is only a proposal; current east mismatch is reported and not approved for physics.
- Root requires overlay approval first, then static spawn/body validity and narrow west-entry/east-dock actual Engine input tests. Old trajectory overlap diagnoses changed occupied space, not impossibility under legal new input. Incidental upward side edges must be inventoried separately, never used to dilute the intended-walk-surface denominator.

### F19 incidental contact inventory
The general exposure probe now also enumerates actual compiled solid polygon upward-facing edges outside the declared protected top segments (including cover tops), applies the same exposed/contact-valid checks, and reports them separately. They are NOT inserted into the authored-walk denominator. This avoids calling every new native side facet non-walkable merely because its art role says BODY, or lowering a required ratio with incidental micro-ledges. Still unexecuted until BODY approval/shared-slot coordination.

## F20 — new BODY can pass local entry/boarding while breaking a lower return access
- Root approved the corrected single-ring nativeBODY overlay for narrow Engine testing, not final collision/art. Protected top unchanged; no rectangle cuts or old-trajectory forcing.
- Exact candidate normalizedSHA0f6afa266dea154aa16707851a141c1912f4e45a16f3416614efc8fcffe1a61d:4 original spawns valid. West4/4 physically walk on west-step then1 jump fromx1350 to west-ledge,HP0. East4/4 walk along east-low then1 drop onto real event-created boat deck at6335/6405/6475/6545,HP0; all-party grounded plus explicit interaction completes. These legal input changes avoid old torso overlap; local fixture only.
- Center failure: return-ramp capx4520–4797.665 is buried/body-invalid; only4797.665–5120 remains valid. Valid-shore startsx5000 with actual left movement and1 attempted jump triggered Engine recovery aroundx4560,y4180, ending on the high court with about40% HP loss. Never count this as a legal climb, normal drop, or route success. Not an exhaustive proof that every possible route is impossible.
- Root receives only the local affected art/geometry range x4400–4850,y3600–4250 and unchanged top constraints. No broad redesign or recovery/HP rules change. Full ignored failure artifacts remain in native-body-proposal-v2; compact reproducible receipt evidence/stage31-native-body-v2-narrow.json records both passes and the blocker.
