# Cavern expansion B: bounded final verification

Date: 2026-10-08. This is source/engine/recording-Canvas verification, not human play or browser approval.

## Frozen source and artifacts

The final map source is the integrated 14/16 authoring from `540391e`; its campaign file SHA256 is `e4434e186ee7adc3f8dc32e8d4d71d899ef699f4a5fbaf8899e543b6e3785e3e`. The later `ec13549` rear-contact derivation fixes recipe order without changing the saved campaign, current runtime visual output, terrain, room bounds, camera or collision. A fresh production build and engine typecheck pass after that fix.

- Game SHA256: `496f797a99bfd6b2e6654d2d6cdf1258bdfa3e114bf2e59a9aa8d8863a8b1fec`
- Workshop SHA256: `23f749f9253ab5c3c7fcfc95d27bf507c8d717ecc810c7c96ca004ada64cea77`

Both hashes remained identical before and after the final derived-surface correction. The independent worktree and publisher's integrated tree were compared by production file content, not by local/connector commit-ID equality.

## Scope preservation

Against published A `cab313b`, only stages 11–19 change; stages 1–10 and 20–30 and the complete shared Library remain identical. Every changed stage retains its exact objectives, events, markers, initial state, anchors and non-position unit fields. Stage 15 changes only the optional dry-shoulder route annotation. A's split expedition, M09, XP/cache, artwork and objective production sources are preserved; the shared runtime change in B is only the read-only terrain-status predicate.

The exact B→A fixture checks 146 approved paths, their values and deletion negatives, nine complete before/after stage hashes, unrelated-field mutation rejection, duplicate identities, purity and unchanged Library. The original 164-path forest fixture and historical ACT2 hash remain unchanged. Library provenance reconstructs the original 355 assets/order and original fixture hashes after validating the exact 49 approved A additions.

## Passed coverage

- Production build and engine typecheck.
- Ground contact: 1,946 conditions across 20 stages/four bodies. Actual App save/import/Continue: 82 cases. Terrain status: 11 read-only HUD groups.
- Chapters 14/16: exact route/terrain fixtures; mission, roster, resident, defense floor/bridge/gate preservation; all-body route clearance; canonical/idempotent authoring and export/import.
- Eight isolated 14/16 player-command routes use real move/wait/tick, no mid-route position/budget/HP correction, zero jump calls and zero damage. Sixteen separate main/undercroft-return physics routes and six actual arrow lanes pass.
- Village resident position/HP/snapshot checks and three actual rescue-interaction fixtures pass. Chapter 14 defense still requires six clear full rounds, twelve finite reinforcements and the resident-loss failure gate.
- Act 2 ordered physical-access fixtures reach all 72 objectives in all ten stages; the intentionally early closed bridge negative still fails as required. Forty cleared-path four-body mandatory routes and 84 optional routes pass. These fixtures explicitly isolate combat/defense/escort completion.
- Transition chapters 11/12/13/17/18/19/20: 52 baseline routes, 14 real projectile positions, required bell-chain projectile, exact recipe reproduction, unchanged stage 20 and shared 18/19 solids.
- Full forest/cavern and Act 1 offline groups; actual guardian branch climbing/shots; exact guardian authoring isolation; terrain-domain/render, migration, granite history/visual alignment.
- A split group including M09 runtime/physics/canonical/retry XP/cache, v1/v2 population caps; waterworks maps/history; optional water pixel identity; objective clarity/reunion; one-way platforms; custom map return and Workshop template.
- Environment depth/composition (4,230 root/depth/zoom checks), validator (30 maps, zero errors), current inventory, Act 2 art fidelity/grounding/objective guidance and common renderer visibility.
- Act 2 canonical recipe, objective/save/reward fixture and all 82 revision checks pass after wiring the same canonical postprocessors. The two exactly reviewed stage-15 upper flying targets are verified through actual ordinary-arrow damage from authored grounded sites; unrelated targets retain the original 400-unit ground-band guard.

## Repaired checks and execution boundary

The initial `test:act2:offline` aggregate stopped during an obsolete recipe comparison. Its constituent checks were subsequently corrected and rerun individually, including `act2.mjs`, `act2-revision.mjs`, `act2-terrain.mjs`, optional routes, ordered progression, traversal and spirit encounter. The failed aggregate log is retained; it is not relabeled as an aggregate pass.

No golden history hashes, physics thresholds, enemy stats, goals or production movement rules were loosened. The six exactly pinned western stage-14 undercroft-wall segments are explicitly nonwalking solid faces; the required route is checked to use the supported upper shoulder instead.

## Still separate / not run

- Full `npm run verify` and browser performance were not run. Direct Chromium is blocked by the executor's OS socket restriction and was not retried. Public Pages Game/Workshop/CUA verification is owned by the release/browser task.
- Chapters 14 and 16 no-items normal-combat completion remains unverified. Prior item-assisted chapter-14 results are not promoted to a valid no-items clear. State/physics fixtures and engine bots are not human play.
- Existing legacy `game/tests/stage8-lock.mjs` has a known obsolete ledge/off-map integration fixture (old x=6736.5,y=1722,vx=350 against today's 7200-wide map). It ignores a false integration result before asserting grounded. The active boundary/contact/save tests remain separate; production physics was not changed to satisfy it.
- Final visual approval, uninterrupted new-game campaign difficulty and real-device performance remain separate.

## Fresh remote checkout

The fresh GitHub checkout initially used `5cb29e2` (tree `c3b2a70ac5059763fe28ee95229a5f31e59987a2`). It contains no local-only `dbaa565` object. Water pixel identity, the complete B146 and Library mutation suites and exact reviewed-route guards pass there. The fixture-only history/provenance suite was also independently run in a directory without Git access.

After fetching the final production authoring, `9e5f283` (tree `113665f0c7e4e27e3cc01ba5de214feb091f78ba`) passed the complete `test:cavern-places` group plus rear-contact canonical regression. The checkout was then advanced only after that command completed to final remote `33c0eae` (tree `87c995f0b566a657b9d9a5fa8a8f282dafb84b51`), matching publisher source tree `c205d44`. The final recipe, revision, terrain and rear-contact checks were rerun and passed on this checkout. A fresh build and typecheck also pass, reproducing both exact committed HTML hashes with a clean working tree. All production sources and both HTML files exactly match the independent verification worktree; remaining tree differences are central test wiring and release documentation.

Detailed local execution evidence is retained under `_local/reports/release-b-final/` and the fresh clone's `_local/reports/release-b-fresh/`. Publication/Pages artifact retrieval and browser interaction evidence must be appended by the release task, rather than inferred from these engine results.
