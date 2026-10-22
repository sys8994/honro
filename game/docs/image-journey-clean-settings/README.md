# Image journey map and clean settings — implementation review

Work branch: `feat/image-journey-clean-settings`. Baseline fetched and verified: `f37530094b3f83d33991162243b7a2722c8fd8f9`. Approved concepts read at `46dfc4d83d9dd15c227520e325deececa28a7b69` on `design/journey-settings-concepts-v1`. Master merge and Pages deployment are reserved for the parent's final actual-pixel review.

## Settings unit

- Restrained teal/ivory/gold pause and settings hierarchy. Fullscreen is the top quick action on pause, root, details, help and confirmations. Its label follows actual fullscreen state; unsupported/rejected requests retain state and show a message.
- Root has four categories; sound, screen, play and records keep the existing real controls and immediate persistence. Debug has its own records subpage, normal-profile export/isolation and embedded restrictions.
- Pause uses Continue/settings/retry/rest. Retry selects conditional segment or whole battle before confirmation. Import/new journey require confirmation. Import normalization completes before disposing the active battle.
- Body-only scrolling, 44px targets, fixed navigation and fullscreen, safe-area margins. Settings X returns to its entry; Escape/back unwinds; background taps do nothing. Menu replacement does not clear the pause modal.

Actual Chromium screenshots in `evidence/` are local runtime captures, not concept art. `settings-*` show fresh title settings; `pause-*` is fresh stage 1 after skipping entry dialogue; `fullscreen-rejected-fixture.jpg` deliberately overrides the browser request with rejection. These do not demonstrate a normal campaign clear or a real phone.

Settings validation passed: build, engine typecheck, `tests/settings-menu.mjs`, `tests/fullscreen-escape.mjs`, `tests/rest-journey.mjs`, and actual Chromium `tests/settings-menu-browser.py`. Four viewport roots/details fit; paused battle data was unchanged during navigation and rejected fullscreen. Superseded layer/menu/selection assertions were updated while retaining navigation, save isolation and input coverage.

Final candidate/network/pixel review records will be completed after the designated art branch contains `ART_READY.md`. No art has been generated or repainted by this implementation task.

## Image journey unit

Parent art merge: `4f68732b` preserves parent `f67092cc` ancestry and its `ART_READY.md`. No images were generated, repainted, or recolored here. All three actual WebP sources were opened and inspected before integration.

Native-aspect image surfaces use supplied per-stage anchors, separate numbered DOM controls and labels, status/current selection and a fixed CTA. Act2 is one cutaway; no layer toggle. Act3 investigation relationships are schematic and keep canonical unlock order. Ten canonical stage buttons per fully unlocked act; the terminal camp reuses the stage30 location. Locked stage names/buttons are absent and unrevealed art is shaded. Existing act1–6 tabs and act-end gating remain authoritative.

Only selected unlocked journal art is requested. Two decoded image nodes are retained; redraws reuse nodes. Decode failure retains landmarks and offers retry. Fit/recenter, bounded wheel/pinch/drag and rotation preserve native aspect and fixed-size controls. A legacy minimum button width that offset numbered circles was removed; browser geometry checks compare actual circle centers to all supplied anchors.

Actual local Chromium viewport/gesture, debug, rest-hub and ending-fixture suites passed. Full review receipts, final candidate SHA and the one confirmed pre-existing narrative assertion failure are recorded in the final report update below.
