# Stage30 ferry history boundary

- `before-stage30.json` is the complete original Stage30 and balance snapshot from `b56bfb4f6e6d35166e05c37cad6dd21a6ccde236`.
- `history-before.json` preserves that commit's global values, map/asset membership and order, per-value hashes, 124-file runtime membership, and the complete original text of each narrowly changed shared file. Each source was checked against the unchanged Stage18 history boundary before recording.
- `history-reviewed.json` is a separate, explicitly named working checkpoint. It stores the actual current Stage30, added editable-vector assets, and all allowed new/changed runtime text. It is not a new approval for gameplay, art, or publication.

The allowlist is Stage30 only; appended `stage30:ferry-*` art; the two ferry runtime files; two shared bundle registrations; the public population-cap call; the scoped ferry readability clause; and Stage30's `initialEnemies` balance value. All project globals, the other29 maps, all545 existing assets, and every other runtime source remain exact.

After an authorized working unit changes the ferry generator, assets or allowed runtime, regenerate the campaign and explicitly record that unit:

```sh
node tests/stage30-ferry-record-history.mjs --label concrete-working-checkpoint
node tests/stage30-ferry-history-audit.mjs
node tests/stage18-bell-history.mjs
node tests/stage18-bell-contracts.mjs
```

The recorder first requires production-bundle registration, exact generator reproduction, and the bounded allowlist. It never changes the Stage18 golden, leaf or capture script. Stale snapshots, new goals, NPCs, changed action/population budgets, non-vector/colliding art, unrelated map/asset/runtime changes, reorders, duplicates and missing values must fail rather than be hidden behind a historical fixture.

`stage30-ferry-history-helpers.mjs` verifies this boundary before calling the existing Stage18 leaf's pure project/source/fingerprint validators. Historical source text is used for hashing only. Live tests retain the current shared engine. Its temporary Stage18 audit wrapper restores the current project, contents, plans and balance even when the callback throws.

## Existing Act3 regression coverage

Location regeneration and the older linear-route/open-building probes first validate the exact current30 boundary, then test the original30 alongside unchanged21–29. The original20-enemy/4-elite location contract, all original movement routes, shots and top-only architecture assertions remain active. Fresh30 is covered by `stage30-ferry-contracts.mjs`, `stage30-ferry-traversal.mjs` (12 routes × 4 classes), and `stage30-ferry-tactics.mjs`/fullplay where separately run. Current canonical round-trip, map-safety and composed art regeneration retain the actual new30.

Only the former ordered-state fixture in `act3-runtime.mjs` uses `withHistoricalStage30`: its direct enemy-team-end loop predates ferry warning/actor boundaries. Fresh30 source and all-survivor goal assertions remain current; new actor-boundary waves and App/Continue states use the dedicated ferry runtime/history tests. Fiend semantic audits restore the exact reviewed Stage30 balance row and its derived `content.enemies` count before the unchanged old contract. No story prose or goal is replaced. Pure/idempotent/count-drift and exception-restoration checks are in `stage30-ferry-history-audit.mjs`.
