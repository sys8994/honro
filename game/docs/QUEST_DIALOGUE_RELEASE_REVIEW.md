# Third release: quest targets and campaign dialogue

Source freeze: `75d91c8c16ec82171f9b988fb46bf3926c05ecad`.
Artifact: `7894f0cde802829bc99e4fc4365db486230946bd`.
Includes second-release artifact/history (`88b7ac9`, `d2f1951`) and final dialogue/departure (`3160125`).

## Passed, independently scoped checks

- `npm run test:quest-hostile-targets`: all 30 stage inventories, 5 current and 14 saved historical target IDs; damage, targeting, path/collision exclusion, capture protection, saved partial/broken HP; actual sword fire/tick; canonical arrows and App save/load/Continue.
- Integrated objective accounting: existing goal contribution credited once, zero ordinary enemy XP/ledger entry, unchanged combat budget, 80% earned / 20% common share retained.
- `npm run test:dialogue-clarity`: approved prose, source/structure delta, dialogue controls, staging, supported offscreen Sodan departure, skip/save/Continue, stage10 separation.
- `npm --prefix game run typecheck` and physical waterfall drag/blast test.
- Native Scene captures for stages 5/8/10/18, portrait and landscape: body art, one HP bar, short labels, genuine hitflash mask. Independently reviewed. This is native engine evidence, not public-browser gameplay.
- `node tests/current-runtime-contracts.mjs`: 163 actual sources, all nine build graphs, both HTML; immutable 133-source archive and prior approved deltas. 918 source, 48 part, 585 exact-edit and 6 derived-project negative controls.
- Campaign metadata and contracts: independently regenerated all 30 maps, 640 assets, old history and 12 mutation controls. The only derived project differences are five explicitly recorded dialogue strings; exact inverse restores the prior bytes. A repinned unrelated geometry mutation fails.
- Migration ledger, current migration metadata (10 historical maps, 3 invalid-ID/revision controls, 3 real App Continues), and current story display.

## Aggregate and limits

`npm run verify` ran once: release guard (19 tests) and build passed. `test:title` then failed because the declared `sharp` package is missing from the verified dependencies. Every later aggregate command is NOT RUN by that aggregate; independent passes above are separate evidence. No dependency/security workaround or retry.

The existing stage18 melee ledger expectation fails at 45103 versus 46235 on both this branch and the completed second release. Its later combat assertions are not counted as passed; the focused actual-engine sword tests above cover this change independently. Local Chromium launch was previously blocked by socket EPERM; no browser success is claimed here.

## Artifact identity

- `HONRO.html`: `8f909ca2e0f3636ec761bda097a66826839411fe8dd1a26bcbdebf456ea1daf2`
- `HONRO_WORKSHOP.html`: `d4bfc0a8b64f0926c79af759ea1da7bcb1524288a67f89a4adbcacb1d49a8258`
- Runtime manifest: `476d746f8ddcab4e12b75769ccd7fc6c6dd2a8c60f7453a41b1c218f1832c141`

Remote preservation, master integration, Pages delivery and public-browser checks belong to the designated publisher/reviewer. This local record does not claim they have completed.

## Standalone migration classification

`node tests/migration.mjs` passed the unchanged library/forest/cavern historical proofs and migrated stages 1–6, including converted stage5 old-target descriptor/HP checks. It stopped at the existing stage7 story `honroGrowth` ledger discrepancy (foe-0 HP527 versus434, foe-1 HP411 versus338). The entire 2,759-character assertion diff matches the completed second-release baseline exactly. Remaining stage7 difficulties and stages8–10 in this standalone run are NOT RUN. Dedicated current metadata and quest-target saved-state suites passed separately.
