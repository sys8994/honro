# Observed tide entry and upper cleanup correction

No product source, enemy stat, terrain or objective changes in this unit.
The exact failed deck comparison is frozen in records/deck-01-failed.json.xz,
including protocol, original entry, result/actions, turn rows, analysis and
actual saved final profile. Native source b631d1b1 maps to canonical6d3f9319.
It reached R25 with one9HP upper-coast enemy left. Boss diedR17 and all42 were
engaged. Four residents survived; two heroes died. It did NOT complete within
20R and did NOT run the safe return. This failure is retained, not superseded
by synthetic fixture success.

Cause1: R13/R14 high tide was already visible, but the dock role still selected
a drop into submerged deck water. Archer lost457HP and mage495HP each time.
The mage's two recoveries contributed990HP loss; do not classify that loss as
unavoidable combat damage. The occultist's R12 jump/land/climb escape worked.
Correction: refuse that descent during visible high tide and the final shown
rising round. Existing dry dock remains available; low-water entry unchanged.
The focused policy test covers each ranged role at observedR12–14 states.

Cause2: after boss removalR17, the two ranged roles held their deck firing
anchors although the sole enemy was above them. Knight's vertical-distance
fallback mistook that upper target for a lower approach and sent him down
into water onR18/20/22. Correction: when all remaining known foes occupy the
upper coast, follow connected supports, not their horizontal position:
return deck2350 -> ordinary jump/walk2140/land -> departure stair1460 ->
jump/land dock -> dock1900 -> jump/land dock stair -> stair2660 -> jump/land
coast. No new platform, movement allowance or coordinate write is involved.

Focused physical fixture uses an explicitly posed single hero and one upper
9HP foe. The first one-budget probe stopped on dock stair atx2496 with96move
remaining, not a geometry wall. It is retained. The registered bounded route
with one actual App.defend finishes on upper coast inR2 with2031move remaining,
zero water recoveries and unchanged heroHP. Ordinary shot proof follows.
These fixtures are not normal-entry/full-stage acceptance. Before another
whole-stage comparison, freeze the causal fixes and evidence and register its
scope; never rerun until success. Existing20 total-round target includesreturn.

The final upper-route fixture uses the same support-connection selector as the
new controller. It reaches the coast and fires actual App A01 onR2, removing
the9HP foe; the single-hero turn then advances toR3. No HP was lost and no water
recovery occurred. The tide-entry physical fixture starts at the recorded mage
R13 dock pose, chooses the new dry goal, and reachesx2067/y2870 with1978HP
unchanged and no drop/recovery. Both are explicit fixtures, not natural entry.

Return adapter preflight retained two narrower failures: it initially left the
boarding zone before the existing two-second quiet gate settled; after waiting
normally, the minimal DOM double lacked the generated story-line text and the
production receipt guard correctly refused dialogue advance. The DOM fix parses
only the actual escaped <p id="story-line"> emitted by the production renderer.
It does not copy dialogue source rows, write receipt flags or relax the guard.
Canvas/CSS visibility is still doubled and must be checked in the browser.

The markup-backed return preflight reaches all four residents safe, every
boarding/reunion/thirteen/next row presented (none retired), roster13/11/2,
normal win and rest. Its final strict reload assertion differed only at
`equipment.rewardLedger.eq_so_t3b.notified`, false before the first rest frame
and true on ordinary reload. That is the existing reward-toast acknowledgement,
not lost growth or equipment. The adapter now waits for the actual App rest
frames to commit that notification before taking its comparison snapshot;
it never edits or normalizes the field. This final adjustment will be checked
on the next registered real run if combat clears; no full-stage claim here.
