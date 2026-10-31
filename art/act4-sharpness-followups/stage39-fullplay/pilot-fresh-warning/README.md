# Fresh pilot combat warning checkpoint

This is a live-run checkpoint, not a clear. It uses the exact fresh candidate and profile recorded in `../pilot-fresh-entry/README.md`. Actual keyboard inputs, frame state, enemy HP, residents and event state are in `events-checkpoint.jsonl`. Canvas/DOM execute in headless Chromium; no physical-device claim is made.

`artillery-20.png` shows the wreck's dashed artillery marker on the occultist; a subsequent real key movement left the target area. The knight reached the ladder and a real interaction completed `netOpen` in round 7, with two normal high-tide water recoveries recorded in the hero HP history. The first resident later lost 97 HP to the wreck's artillery; all four survived at this checkpoint.

`pilot-warning-5.png` captures the restored Stage 39 midboss's actual Canvas target marker and legible Korean warning in round 8. After normal input response the midboss history records `cancelled` / `protected-area`; this is a protected-resident cancellation rather than a claimed midboss hit. Neither a seen flag nor a combat outcome was injected. This one image does not establish warning duration or mobile readability. Exit stabilization, full rescue, mission clear, same-context reload and 20-turn outcome remain under test.
