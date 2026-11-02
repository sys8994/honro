# Stage8 dedicated movement / manual reader compatibility

## Cause and bounded correction
On candidate `292c1122`, a normal-input Stage8 run reached R24 with both bindings broken. The generic caption reader replaced the bier's physical movement steps with presentation cues and set `complete=true`. The dedicated collision walker therefore never ran; completing the reader left `stage8Bier.status='moving'`, `completedOnce=0`, no active dialogue, and its scene marked done. The moving guard then blocked Engine ticks and player input indefinitely.

Only `shared/runtime/stage8-bier.js` changes. Manual caption pages remain manual. Their separate `bierMotion` retains the original route steps, physical cursor and completion; only the duplicate generic boss movement cue is removed. Existing `walkStep`, full-body collision/blocking and resource-preservation behavior remain authoritative. Next/Skip uses that same safe walker. Completion of motion never advances the manual caption.

Previously orphaned moving saves return to the existing blocked/retry path from their actual saved pose. They do not gain settled/completed status, damage, healing, movement allowance or a new position. A stale open generic reader is canceled into the same safe retry path instead of asserting a false arrival. Other scenes, objectives, rosters, damage, map geometry and story wording remain unchanged.

## Verification
- `node tests/stage8-staging-reader-regression.mjs`: PASS. Actual unmodified saved R24 normal-input profile, exact Continue, no actor changes during recovery, normal Defend retry, bounded actual motion, mid-motion exact Continue, manual dialogue, eventual player input, no external actor writes/recovery calls. Separately labelled isolated fresh-trigger/modal pause/Skip and ordinary-reader contracts also pass.
- `node tests/caption-world-motion.mjs`: PASS (Stage23 physical cargo and manual caption contract).
- `tests/manual-scene-captions.mjs`: inherited stale prose assertion; same failure on baseline (`거기 활 든 양반…` vs old `사람이오…`). Not relaxed.
- `tests/story-staging.mjs`: inherited missing old Stage9 NPC assertion; same failure on baseline. Not relaxed.
- `tests/story-staging-outcome.mjs`: old `waitForDialogue` assumption conflicts with manual reader. Not counted as pass.
- `tests/stage8-bier-runtime.mjs`: historical map re-authoring stops before its tests on current unrelated Stage7/13 artwork scale checks. Not bypassed.

The gzip fixture has explicit provenance and hash. It is actual native gameplay from a declared earned-reward/recruit entry fixture, not continuous campaign history and not browser evidence. This correction's browser regression and rebuilt deployed bundle remain pending parent integration; no Stage8 gameplay/fun approval is implied.
