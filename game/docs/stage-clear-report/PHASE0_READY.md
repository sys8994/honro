# PHASE0_READY — clean predecessor release checkpoint

Ready for parent review and fast-forward of **this document's introducing commit**, before later report commits. No report instrumentation or unfinished report UI is included. Parent owns master/Pages; neither was changed here.

- Final predecessor candidate: `11b445dcba55613b5844d045596458ca4d06c7ec` (parent marker `43300d92`, `ready:true`).
- Validated runtime **and actual screenshot evidence SHA**: `275430808a3d23e5572fcff539683855cac26216`.
- Branch: `feat/stage-clear-report`. The checkpoint adds only this readiness document and evidence manifest to that validated runtime. Later PHASE1 commits must not be included in an early release.

The final predecessor already returned Cancel/X/Escape to pause. The origin check now explicitly requires `pause-dialog`; journal/rest-origin confirmations retain their own screens. Exact engine/profile/serialized save preservation is tested. Native settings checkbox hit boxes are now44×44px with the approved24px visual inset, linked labels, Space and focus semantics retained; high-contrast mode uses native appearance.

## Passed on this source

- `node tests/stage-report-phase0.mjs`:3 battle cancel paths plus rest/journal-origin cancellation and exact battle/save invariance.
- `node tests/settings-menu.mjs`, `node tests/fullscreen-escape.mjs`, `node tests/modal-keyboard.mjs`, `node tests/battle-help.mjs` (21 help cases).
- `node tests/rest-hub-journey-flow.mjs`, `node tests/journey-stage-departure.mjs`, `node tests/camp-persistence.mjs` (11 persistence cases), `node tests/rest-journey.mjs`.
- `npm --prefix game run typecheck`, `npm run build`, `node tests/web-split.mjs` (347 generated files, native/embedded isolation).
- `python tests/stage-report-phase0-browser.py`:39 actual Chromium assertions at390×844 and844×390: Cancel/X/Escape stays paused, unchanged battle/autosave, native fullscreen round trip, all5 actual control/label target sizes, corner clicks and Space, no page exceptions. [Receipt](evidence/phase0/checks.json).

## Actual pixels inspected

[Portrait sound](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/phase0/sound-390.jpg), [short-landscape sound](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/phase0/sound-844.jpg), [portrait pause](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/phase0/pause-390.jpg), [short-landscape pause](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/phase0/pause-844.jpg). Direct Chromium JPGs under1MB; no composites or generated images. Viewed portrait sound and landscape pause, then the independently scrolling short-landscape sound screen: visual marks remain24px, focus/close/fullscreen are readable and within the viewport. The landscape sound image intentionally shows the lower scroll position after keyboard checks.

## Limits and earlier failures

The pre-edit master `f3753009` baseline fullscreen/modal-harness assertions failed; both pass with the final predecessor's harness and this checkpoint. Unchanged baseline stake-crossing XP assertion (`0 !== 47`) and old split story-title assertion failed during preparation; they were not repaired or claimed passed by PHASE0. Predecessor documents its unchanged `journey-content.mjs` stage5 old-outro assertion failure; no full `test:rest-journey` aggregate pass is claimed here.

No full30-stage run, physical-device/iOS/Android claim, performance profile or live Pages verification. The scenarios use fixtures and desktop Chromium. Maps,84 skill icons, ending art, combat mechanics and terrain retain the final predecessor content.
