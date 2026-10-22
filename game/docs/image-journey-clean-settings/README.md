# Image journey and clean settings — parent review candidate

**Implementation and evidence pushed; parent final pixel/release decision pending.** Master merge and Pages deployment were not attempted.

- Branch: `feat/image-journey-clean-settings`.
- Baseline fetched/verified: `f37530094b3f83d33991162243b7a2722c8fd8f9`. Remote master still matched it at final verification.
- Final runtime/build candidate: **`20e1dea29014e02d4e9624a139d1b3a1ce29be3e`**. Subsequent report commits contain evidence/documentation only.
- Concepts read at `46dfc4d83d9dd15c227520e325deececa28a7b69`, including README, settings SVGs, stage-map and map SVGs. Concept drawings were not inserted as runtime UI.
- Parent art `f67092cc` was merged with ancestry preserved in `4f68732b`, after `ART_READY.md` arrived. All three actual WebPs were opened before integration. No image generation, repainting or recoloring was performed here.
- Logical pushed units: `50ec90b0` settings; `4f68732b` approved-art merge; `2ec1e812` image journey integration; `20e1dea2` final error feedback.

## Changes

Pause and settings use dark teal, warm ivory and muted gold, 44px targets, fixed fullscreen/navigation and body-only scrolling with safe-area margins. Fullscreen is the **top quick action** on pause, root, every detail, help and confirmations. Labels follow real browser state; native Chromium success and deliberate rejection were exercised. Rejection stays inline without pretending success. Browser orientation limits remain guarded and explained. Fullscreen changes do not reset gameplay.

Ordinary battle pause has Continue, settings, retry and rest. The existing special stage25 cutscene retains its scene skip/exit controls under the same top-fullscreen shell. Root settings has only 소리/화면/플레이/기록·관리. Sound uses saved effect/BGM toggles and 5% volume steps; screen keeps orientation and minimap; play uses actual difficulty names and separate speed choices. Difficulty's immediate current-battle handler is retained. Existing objective/control help is available from play settings and includes the stage guide returned by the existing objective helper.

Records separates JSON export/import and destructive new journey from its debug subpage. Import/new journey require confirmation; invalid input and picker/confirmation cancellation preserve the paused session. Import migration and recruit/allocation validation finish before disposing combat. Errors are readable Korean. Success follows the existing title path. Export stays in place. Debug still stops combat and opens rest, protects the normal profile, exports that protected profile, hides import/new journey while active, retains appropriate outline visibility and embedded restrictions.

Retry chooses conditional current segment or whole battle before confirmation. Existing restart functions retain resources/checkpoints/growth rules; the segment test checks restored items and preserved hero growth. Detail back/Escape unwinds; settings X returns to entry; battle entry returns to pause. Pause X/Continue resumes. Rest confirmation cancel returns to pause. Backdrop taps do nothing. Dialog replacement keeps the pause modal continuously open, and keyboard focus remains inside.

The journal uses the supplied 1536×1024 / 1024×1536 / 1254×1254 art with separate numbered DOM controls, labels, status and selection. Actual circle centers are checked against all 30 native anchors. Each fully unlocked act has ten canonical destinations. Act2 is one surface/cave cutaway; 18/19 share the painted bell and 20 is the separate ascending exit. Act3 has distinct surface26 and underground25→27 investigation relationships meeting28; actual 25→26→27 unlock order remains authoritative. A terminal camp uses stage30's location instead of adding an eleventh pin.

Act1–6 tabs,10/20 endpoint gates, unavailable 4–6, unvisited-name/interaction gates and current rest-hub logic remain authoritative. Locked names/buttons are absent; unrevealed image areas are shaded. Selection does not travel. The bottom CTA uses actual `hasRest`, with direct 2/10/19/25–28 entry retained. Confirmation cancellation is immutable; approved travel still discards live/saved combat while preserving permanent progress, and explicit departure starts fresh. Intro Continue and pending act-ending resume were exercised.

Only selected unlocked journal art is requested. Two decoded image nodes are retained and reused across redraws/revisits. Decode failure leaves live destinations and retry. Fit/recenter, bounded pan/wheel/pinch and rotation retain native aspect, readable text and 44px controls. Small mobile screens use a scrollable map at the minimum readable scale; they do not stretch or crop the source into a different ratio.

## Actual screenshots and pixel reviews

[Capture inventory and hashes](evidence/screenshots.json) identifies every actual JPG and its runtime candidate; each is under 1 MB. The `act*-fixture-*` screenshots use explicit unlocked-progress fixtures, **not normal-play clears**. Fresh-gate/settings captures use fresh progress; pause uses fresh stage 1 after skipping entry dialogue. Fullscreen rejection and decode failure are deliberately injected fixtures. Images were captured directly from Chromium, without composites or retouching.

Useful entry points:

| Screen | Actual JPG |
|---|---|
| Pause / root | [Pause](evidence/pause-390x844.jpg), [360×800 root](evidence/settings-root-360x800.jpg), [844×390 root](evidence/settings-root-844x390.jpg) |
| Fullscreen / sound | [Native success](evidence/fullscreen-success-chromium.jpg), [rejection fixture](evidence/fullscreen-rejected-fixture.jpg), [saved 60%](evidence/sound-saved-value-390x844.jpg) |
| Details / destructive actions | [Records](evidence/settings-records-390x844.jpg), [help](evidence/settings-help-390x844.jpg), [import](evidence/import-confirm-390x844.jpg), [invalid file](evidence/import-invalid-fixture-390x844.jpg), [retry](evidence/retry-confirm-390x844.jpg), [new journey](evidence/new-journey-confirm-390x844.jpg) |
| All 10 anchors | [Act1](evidence/act1-fixture-overview-1280x900.jpg), [Act2](evidence/act2-fixture-overview-1280x900.jpg), [Act3](evidence/act3-fixture-overview-1280x900.jpg) |
| Mobile / rotation | [Act1 360×800](evidence/act1-fixture-360x800.jpg), [Act2 360×800](evidence/act2-fixture-360x800.jpg), [Act3 390×844](evidence/act3-fixture-390x844.jpg), [rotated Act2](evidence/rotation-act2-bell-fixture-844x390.jpg) |
| Gates / failure fallback | [Fresh Act1](evidence/fresh-act1-gate-390x844.jpg), [decode failure](evidence/act2-decode-failure-fixture-390x844.jpg) |

Implementer actual-pixel reviews, followed by a separate holistic review:

1. **Responsive/fullscreen/menu hierarchy:** directly viewed portrait/landscape root, saved-value sound, help, confirmations and native fullscreen success/rejection. Fullscreen/header/close remain visible while content scrolls. Earlier review found the turn banner over settings; fixed and re-viewed. Final rejection has one inline message; invalid import uses Korean rather than raw parser output.
2. **Geography/ten anchors/labels:** directly viewed all three fitted overviews and mobile Act2/3. Confirmed village/ferry/waterfall/gate/two courts, unified underground temple/single bell/separate exit, and surface/underground city investigation relationship. Earlier review found legacy pin minimum-width offset and interpolating label positions; removed them and rechecked all actual circle centers within 1 px. Art and UI remain separate.
3. **Interrupted/repeated flow/loading:** directly viewed fresh gates, decode-failure fallback/retry, rotation and retry menu after cancellation. Read actual resource timings and test receipts: no intro/camp map requests, no locked-act image request, no extra body transfer on cached revisit, no page errors, paused state preserved through navigation/cancel/error.
4. **Separate holistic review of final candidate:** re-opened pause/root/records alongside mobile waterfall/bell and the complete city sheet after the focused reviews. Restrained controls, selected/current status, bottom CTA and native geography remain consistent. These are implementer observations; **parent aesthetic/release approval is not claimed**.

## Validation and preserved content

[Exact command results and limitations](evidence/validation.json), [text logs](evidence/tests/), [map browser/network](evidence/map-browser-results.json), [debug browser](evidence/debug-browser-results.json), [byte preservation](evidence/preservation.json).

Passed: build, engine typecheck, web-split, settings/menu, fullscreen Escape, modal keyboard, battle help, charge/input ownership, debug isolation/export, native layout/anchor/hash checks, atlas markup, retained rest art, rest journey/hub/departure, M05 deterministic variation/shortened branches, and actual Chromium map/settings/debug/layout/gesture/hub/ending-fixture scripts. Final feedback-only changes were rebuilt and rerun through settings/fullscreen, actual map/settings/debug and web-split. Other tests cover unchanged paths and were not blindly repeated.

Actual browser coverage includes360×800,390×844,844×390,1280×900 for the new maps/settings; the layout suite additionally checks1917×1025,1440×900,2560×1080. Wheel/cursor anchoring, pan bounds, pin drag suppression, CDP pinch and remaining-finger continuation, rotation, keyboard selection, embedded input, repeated selection/travel, cancellation, file errors/export/import/new journey, debug switches, and three pending-ending terminal fixtures were exercised. This is not a physical touchscreen or normal 30-stage campaign traversal.

The 84 original skill icon files are byte-identical. Engine, campaign data, environment assets and ending assets are unchanged from baseline. Existing M05 validation passed 180 deterministic paths / 810 pair comparisons, mixed target seeds and 60% nominal branch reach. Endings retained pending cut reload/import and exactly-once rewards in terminal fixtures.

**One confirmed pre-existing failure remains:** `node tests/journey-content.mjs` passes its first content audit, then fails line14 because it expects an old stage5 outro sentence (`방금 저 줄도 당겨졌소`). The test and those content sources are unchanged. Extracting only baseline files and running the same test reproduces the same failure: [candidate log](evidence/tests/journey-content-candidate-failure.txt), [baseline log](evidence/tests/journey-content-baseline-failure.txt). No unrelated narrative repair was made, and no aggregate full-suite pass is claimed.

## Loading results

First selected-act bodies: Act1 **371,256B**, Act2 **184,932B**, Act3 **419,334B**; total **975,522B**. Chromium resource timings recorded four image requests during repeated viewport/act visits: three initial bodies and one cached revisit with **transferSize 0**. Initial transferSize totals include 900 B of response overhead beyond image bodies. Opening title, intro/rest/camp and a forced locked-Act2 attempt produced no unauthorized map body request. The separate aborted-decode fixture retained live destinations and recovered on retry.

The application cache retains at most two image nodes. Browser-owned HTTP/decoded caches and device memory were not profiled; cross-reload cache persistence is not claimed.

## Remaining work / limits

Parent must inspect these final actual pixels, then decide master integration and existing Pages release. Neither operation was attempted here. No automatic approval denial, pending write or uncertain push remains; feature pushes were confirmed remotely.

The baseline narrative assertion above remains failed. Full `npm run verify`, normal-play full 30-stage traversal, physical phones/iOS/Android orientation/fullscreen behavior, and live Pages verification were not run or claimed. Browser orientation limits are handled gracefully, but actual OS support still depends on the device/browser.
