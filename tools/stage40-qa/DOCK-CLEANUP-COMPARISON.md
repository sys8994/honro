# Stage40 observed dock cleanup comparison

Prior source: canonical 9a246a768876babec884e0df73b5777835e984af, native 72ec518d6614fee195061c8195de27cb7e1d7e45. Run 41605817603 failed: all 42 combat foes cleared at R22, outside the 18–20 total-stage budget; safe return was consequently not attempted. All four heroes and residents survived, no JS errors. This is a failure, not acceptance. Original artifact 13217604145 SHA256 bba09f4ad32b8d3eaaacb5e1994b6ae383488b2c881317fe3735f2be8a714be8 preserves screenshots and final save. The compressed full event record is retained alongside this report.

## Demonstrated cause

The boss was gone by R15. By R18 four foes remained on the dock at x437/560/1081/1801, y2698–2826. Three ranged heroes returned to fixed deck anchors around y3600, outside the planner's current visible-candidate vertical reach of 600. They repeatedly had no legal plan while the knight cleared alone. This does not prove a terrain defect or impossible difficulty.

## Bounded correction

Controller only: when every currently observed living foe is on the dock or its stair, use existing deck→departure-stair→dock connections, then approach a current same-level target with class-specific firing spacing. No future spawn knowledge, stat/count/terrain/story changes, new win condition, item use, or actor teleport. Existing warning and visible tide response retain priority. A living deck or coast foe prevents this special cleanup phase.

Focused explicit starting-pose fixture used rounded observed R18 four-foe positions/HP, one archer with original entry resources, and residents. It is NOT an exact R18 continuation. Ordinary App walking and two jumps reached dock x1477 with 1046 movement remaining in the starting turn. Complete A01 rollout predicted 193 damage and zero other-friendly damage; the actual shot removed the 193-HP midboss. Subsequent real enemy response reduced archer HP1825→1254 by R2. No water recovery. Initial fixture incorrectly asserted the archer stayed active after firing; its failed log is preserved, then only the post-shot observer was corrected. Static tests check observed-only activation and distinct 320/380/440 firing spacings, not three-role combat acceptance.

## Registered next experiment

Exactly one fresh full browser comparison on this frozen controller checkpoint, immutable work/stage40-qa/20261103-dock-cleanup-01. Same prepared endgame profile, original ranks/equipment, seed policy, product/runtime and actual DOM/keyboard/joystick inputs. No battle-state injection or hidden items. Preserve every result and screenshots. Combat plus original return/dialogue/E/settlement must finish within 20 total rounds. If combat clears in budget, continue that exact checkpoint through return; no reset to erase losses. No guaranteed all-hero survival criterion is added. Browser playability and final A2-integrated quality remain outstanding regardless of focused fixture results. No master/Pages release.
