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
