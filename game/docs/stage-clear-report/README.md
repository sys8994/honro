# Stage-clear report implementation

Implemented on `feat/stage-clear-report` for parent review. **No master merge or Pages deployment was attempted.** The approved planning file was read at `fd29ea48f63f1e34d8736ef1721ada59ca73a746`; its later approved XP addition was read at `4e496c59dd6874ed775dd783410508d194ed266a`. The unrelated external-feedback plan was not used as implementation instructions.

| Checkpoint | Exact SHA |
|---|---|
| Final predecessor selected by parent `ready:true` marker | `11b445dcba55613b5844d045596458ca4d06c7ec` |
| Clean PHASE0 release checkpoint, before report instrumentation | `0a9acf40396452e2f424cd9731f8f91f3478da03` |
| PHASE0 validated source and screenshot evidence | `275430808a3d23e5572fcff539683855cac26216` |
| Final report runtime/code/evidence package commit | `4699102a27217a0372770b5866b7e181db9fdeba` |
| Final active runtime package SHA-256 | `1521fdf91f93a57c48e020d74f030c3ca88991e0b808797c06eff6beab5cc9b9` |

The subsequent publication commit changes documentation/evidence receipts only. The package digest definition, exact source hashes and screenshot hashes are in [the manifest](evidence/manifest.json). [PHASE0_READY](PHASE0_READY.md), its original screenshots and its manifest remain byte-identical to the clean checkpoint. Parent can release that exact checkpoint independently of this larger feature.

## Delivered behavior

The existing clear result keeps its narrative/progression context and primary Next. It adds a2×2 summary of active combat time, rounds, enemy final defeats and allied knockouts. Main growth rows show actual XP paid, level before→after, a level-up badge and level progress. A newly recruited companion's join level appears separately from reward XP. There is no MVP or ranking.

`상세 보고서` replaces the result content with one responsive panel: companion totals → actual participating companions in party order → expandable skill rows. Damage dealt/received, kills and effective healing are shown; shield absorption is separate. Skill uses count accepted casts, including one M05 cast hitting ten targets. Closing detail restores the exact summary and scroll position without reapplying outcome or invoking Next. Both result and detail have fixed headers/close controls and independent scroll bodies; Next stays in the result footer.

The journal adds report access beside the existing camp/direct travel CTA for a completed location. Older clears say that no report exists. First clears of10/20/30 still use the existing four ending cuts→next-act title→rest sequence. The report is saved before presentation; a small report button appears at the resulting rest, and the journal retains later access. Ending art, buttons and timing were not changed.

## Data and XP contract

- `shared/runtime/clear-report.js` holds attempt aggregates; `clear-report-ui.js` renders frozen snapshots. Engine HP receipts are committed before recursive on-hit effects. Actual HP decreases/increases exclude overkill, overheal and stat/level/transition normalization. Final death is observed at the actual engine death boundary, excluding capture, goals/objects and script/summon expiry.
- Original cast provenance is saved on projectiles, zones, curses and summons, including later caster death/removal and capture/release changes. Carried split-party curses preserve source metadata across maps. Environment, NPC, friendly fire, objectives and summon bodies remain separate. Missing legacy provenance retains its ID/unknown bucket instead of guessing a hero.
- XP uses actual cumulative `b.heroes[cls].xp` intervals around real combat grants and the existing clear settlement. Cumulative grant intervals deduplicate repeated observation. Clear settlement runs without relying on engine XP events and is captured **before recruitment floor alignment**. Rendering never calls `grantXP` or derives XP from damage/contribution scores. Level caps at30.
- Deferred branch reports show only XP already paid. Reunion reports explicitly identify25–28 settlement, or25–27 for legacyV1. Growth rows can include a real nonparticipant recipient; combat rows contain only runtime participants. Earlier reports are not retroactively paid again.
- Continue/export/import retain the attempt. Fresh/replay battles start a new attempt using retained growth as the starting XP. Segment retry restores combat/path aggregates from the checkpoint while retaining actual active time, retry count and paid XP. Pre-instrumentation checkpoints restart an explicitly partial observation interval and retain the same attempt/XP/time.
- Time uses unscaled real frame intervals, excluding dialogue, loading, menus/pause/settings, background, cinematic blocks and turn holds. Victory stops accumulation. Frame simulation caps/playback multipliers do not multiply report time.
- Reports contain schema/game version, stage, difficulty, attempt ID and completeness. Missing history is labeled partial or absent; no lifetime totals,30-string event history or capped XP ledger is used to invent battle statistics.

## Storage and loading

The existing profile/localStorage key and normal autosave cadence are used. There is no per-hit write, event log, analytics request or server. Current battle aggregates travel with the battle snapshot. Completed campaign records keep the latest result for each of30 stages; isolated debug/practice/custom records have a separate six-entry bound and cannot replace campaign reports. Debug/custom ownership/export protections remain in place.

[Measured stage25 fixture](evidence/storage-impact.json):17 units, current aggregate2,372 bytes; battle plus checkpoint855,378 bytes versus850,604 with report fields removed, an overhead of4,774 bytes. Its completed report was1,035 bytes. These are serialization samples, not maximum-size, latency, memory or long-session/quota benchmarks.

[Generated asset comparison](evidence/load-impact.json) against the final predecessor: runtime JavaScript **+21,838 raw bytes**, CSS **+6,598 raw bytes**, current asset count347→349, **zero new runtime images**. Existing two prior asset generations remain managed by the unchanged builder. Compressed transfer/cache/device memory was not benchmarked.

## Validation

[Authoritative pass/fail/unrun receipt](evidence/validation.json), [command logs](evidence/tests/), [report browser assertions](evidence/report/checks.json), [PHASE0 regression assertions](evidence/phase0-regression/checks.json).

| Run | Result and scope |
|---|---|
| `node tests/stage-clear-report-data.mjs` |30 deterministic production-engine/data scenarios: HP/shield/overkill/overheal, valid multi-hit and recursion, DOT/summon/zone provenance, share/transfer/capture, environment/NPC/FF, cast count, actual combat+settlement XP, cap/recruit/split/retry/idempotency, partial data, timing, mode isolation and equivalence to the original generic-curse damage vector |
| `node tests/stage-clear-report-carry.mjs` |2 source-preservation/legacy-unknown cases across split-map curse snapshots |
| `node tests/stage-clear-report-app.mjs` |12 App checks: Continue/export/import, old saves, exact summary restoration, early victory/outro freeze, actual/legacy checkpoints, fresh/replay/latest storage, journal access, no hit writes and recruit context; DOM/storage doubles |
| `python tests/stage-clear-report-browser.py` |50 actual Chromium checks at360×800,390×844,844×390,1280×900; summary/XP/level-up, detail/skills, scroll/close/Next, journal, all3 endings pending reload/file import and seen/rest access |
| `python tests/stage-report-phase0-browser.py` |39 actual Chromium menu checks; rerun screenshots copied to `phase0-regression/`, original checkpoint artifacts retained. Future alternate output: `HONRO_PHASE0_OUT=...` |
| Build/type/native web |`npm --prefix game run typecheck`, `npm run build`, `node tests/web-split.mjs` passed;349 current assets, native/embedded entry and protected storage |
| Existing XP/heal/retry |Contribution engine20 cases, contribution App/export/import, healing-boundary5 cases and stake-crossing runtime passed |
| Existing menu/save |PHASE0 origin checks, settings hierarchy, fullscreen Escape, modal keyboard, rest-hub journey, explicit departure and camp persistence passed |
| Existing M05 |`node tests/cheonroe-target-lightning.mjs` passed. Source assets, map data/terrain and balance configuration are byte-identical to the final predecessor, including84 skill icons and seeded M05 variation/shortened branches |

**Three pre-existing failures remain:**

1. `node tests/stake-crossing-xp.mjs`: old shared-XP expectation `0 !==47`; reproduced on unchanged master `f3753009` during preparation. [Current log](evidence/tests/stake-xp-known.txt), [baseline record](evidence/pre-edit-baseline.json).
2. `node tests/act3-split-v2.mjs`: five cases pass, then an old story-title assertion expects `왕실의 선택` instead of `지운 이름과 남은 명령`; same baseline failure. [Log](evidence/tests/split-v2-known.txt).
3. `node tests/custom-map-return-profile.mjs`:17/18 groups pass; confirmed-new-journey deep equality expects `honroBattle:null` and `upgradeNotice:false`. The identical failure was rerun in a detached checkout of the final predecessor. [Candidate](evidence/tests/custom-return.txt), [baseline](evidence/tests/custom-return-baseline.txt), [receipt](evidence/tests/custom-return.json). Its retry/result/export/normal ownership groups passed.

The predecessor also documents its unchanged `journey-content.mjs` old stage5-outro assertion. The full `test:rest-journey` aggregate was not claimed passed here. No unrelated narrative/default-profile/legacy-XP test repair was added.

## Actual pixels and review limits

All24 committed JPGs across PHASE0, its regression and report evidence are direct Chromium screenshots, each below1MB (largest109,645 bytes). No image generation, composites or retouching was used. Victory, XP/time and unlocked-progress states are explicit fixtures, **not normal-play stage clears**.

| View | Evidence |
|---|---|
| Main XP/level-up |[360×800](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/focus1-summary-360x800.jpg), [390×844](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/focus1-summary-390x844.jpg), [844×390](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/focus1-summary-844x390.jpg) |
| Detailed skill expansion |[390×844](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/focus2-detail-skills-390x844.jpg), [1280×900](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/focus2-detail-skills-1280x900.jpg) |
| Fixed header/Next after scrolling |[Short landscape bottom](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/holistic-summary-bottom-844x390.jpg) |
| Journal CTA retained |[Journal report access](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/holistic-journal-report-access.jpg) |
| Ending rest report access |[10](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/ending-10-rest-report.jpg), [20](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/ending-20-rest-report.jpg), [30](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-clear-report/evidence/report/ending-30-rest-report.jpg) |

Focused reviews covered (1) actual data/XP contracts, (2) summary/progression/mobile and detail readability, and (3) close/skill expansion/Next/journal/ending interruption behavior. Direct pixel inspection caught the old turn banner over the summary and the scrolled XP row under X; the final source suppresses the banner and keeps title/X outside the scroll body. A separate holistic review reopened final portrait summary/detail, short-landscape bottom/header, desktop detail, journal and ending-rest pixels after those corrections. These are implementer observations; parent visual/release approval is still pending.

Not run/claimed: full `npm run verify`, normal30-stage fullplay, physical-device/iOS/Android testing, performance or long-session storage/quota benchmarks, master integration or live Pages verification. Parent owns final review, merge and deployment.
