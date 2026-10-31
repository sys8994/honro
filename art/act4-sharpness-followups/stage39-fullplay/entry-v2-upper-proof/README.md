# First actual upper route landing

This continues the v2 candidate run from its game-produced save. Instead of jumping at the narrow foot of the stair, the archer walked to x≈320 on the higher western middle ledge and used real jump/right keyboard input. Actual state samples show landing on `approved39-west-stone-stair` at x542.80/y1301.65, then walking to `approved39-west-gallery` x1127.93/y1067.20 without water recovery or HP loss. This is actual headless-browser movement, not the preceding cloned-engine probe.

The mage then landed back on the middle ledge at x539.78, just short of the stair's x540 boundary; the watchdog stopped immediately. `browser-storage.json` is the real game auto-save after the archer's action and before that unsaved mage jump, so the next UI continuation preserves the archer's upper-gallery position and replays only the unsaved mage input. It does not establish the full party route, tide-warning readability or a 20-turn clear.
