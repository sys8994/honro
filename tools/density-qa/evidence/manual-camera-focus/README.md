# Restore existing focus bounds during manual camera ownership

Browser review of Stage35 found an ordinary released drag at cameraX10123.242,
scale0.1713235, beyond the stage's default focus right7200+320. No camera setter
was used: wheel zoom and released canvas drags reproduced the problem.

Cause predates this Act4 art revision. `ReinforcementCamera.update` returns true
while `AttackCamera.blocksFocus` holds manual ownership. `Scene.render` therefore
skips its regular follow branch AND the `HonroBounds.constrain` call inside it.
The pointer handlers can translate beyond the focus extent, and that unbounded
position persists after release.

The manual-block branch now invokes that same existing constraint. It does not
change limits, camera zoom policy, manual ownership, player follow-resume logic,
geometry, save data or world bounds. Authored storyFrame/storyTween and actual
reinforcement inserts retain their previous special framing.

`node tests/manual-camera-focus-bounds.mjs` executes the actual `main.inputs`
method and actual `Scene.render` camera phase against a DOM/canvas stub. It stops
immediately before background paint. Historical reinforcement source569e111
reproduces the overshoot. Current code passes16cases: desktop/portrait held and
released drag at all4extremes, in-bounds manual pan and zoom anchor, translated
pinch extremes, authored focus override, and unchanged story/reinforcement
special frames. Battle bytes remain unchanged.

Also passed existing `attack-camera`, `reinforcement-camera`, `camera-follow`
(210cases), and `camera-resize` (17cases) tests. Browser recheck is separate and
must bind the updated runtime; this contract is not a browser screenshot claim.
