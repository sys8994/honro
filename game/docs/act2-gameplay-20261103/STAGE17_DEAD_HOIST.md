# Stage17 dead-hoist interaction deadlock — native reproduced

Natural survival404 run, actual Lv13 basic recruitment gear, production reviewed-v4 App/Engine, no external actor writes or engine recovery. Ordinary combat killed `act2-hoist` before the reviewed separation interaction. At R36 all four heroes remain alive near (6089,4740), required goal is `17.hoist`, kind `interact`; the hoist scene has a completed receipt, but the hoist has hp0/dead=true, honroHoistSpiritAttached=true.

Independent unchanged exported-profile Continue, then legitimate Engine.select for each hero, reports `HonroInteractions.eligibility` false with `구조할 주민이 없음` for every hero. `HonroObjectives.interactionTarget` returns null because the marker targets a dead actor, so `interactions.js` raw eligibility stops before the reviewed Stage17 logic.

The reviewed17 drive explicitly supports a dead-hoist fallback for the scene; its use function requires the hoist object to exist but does not require it to remain alive. Thus the outer interaction wrapper conflicts with that recovery path. This is not evidence that players should be forced to keep an enemy alive without feedback, or that balance needs changing.

## Reproduce

`node tests/act2-stage17-hoist-probe.mjs`

Immutable initial/terminal/result compressed fixtures and SHA256 manifest: `tests/fixtures/act2-gameplay/stage17-dead-hoist-404/`. Probe output: `evidence/stage17-hoist-continue.json`.

No runtime fix applied here. Root owns a bounded compatibility fix proposal. A narrow reviewed17 interaction-target exception preserving the physical hoist frame is a candidate for review, not an implemented fix. Browser reproduction and fresh post-fix progression remain pending. The QA controller now avoids deliberately targeting the hoist to continue the remaining worksite mechanics independently, not to hide this failure.
