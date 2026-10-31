# Natural tide dialogue capture attempt

A normal-input continuation from the real round-one `../entry-v2-upper-proof/browser-storage.json`, using the tide HUD fix. It reached rising tide and later completed in round 4. The actual HUD frame is in `../tide-hud-layout/actual-rising-round2.png`. No event or receipt was inserted.

The added frame observer and six-second Playwright wait did **not** capture the `물이 올라옵니다` bark; the wait timed out and the frame list was empty. The preserved run therefore does not establish dialogue visibility duration. The game save nevertheless contains the game's `A4.S39.TIDE.01` receipt; that receipt alone does not prove the text was legible or unobstructed. An independent instrumentation/visual review of the actual bark is still required. This result must not be confused with the synthetic timer test or the fresh five-round run.
