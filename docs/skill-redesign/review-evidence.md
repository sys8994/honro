# Independent review evidence

## Final captive UI follow-up

Production input checkpoint: `fd9e8537e7ce2448eb47ed349ad4661111a988a6`.
Review source checkpoint: `c3cee6d20cc1d964d3a0324560b6de6b42f7a120` (same production inputs, with independent inspector assertions).

A separate follow-up approval preserves the entire completed `d03915b` two-skill approval unchanged. It proves five exact line edits across `warriorVisuals.ts`, `combat-feedback.js`, and `unit-info.js`: captive mouse/touch/inspection exclusion, live captured count and remaining enemy turns, hidden passive markings, and suppression of pre-capture damage labels. The compiled visual core changes once; optional feedback/inspector parts change only in their actual build variants.

Final checks passed: shared build, TypeScript, independent seven-case prison regression, production inspector regression, complete UI-boundary regression, quantitative sensitivity audit, and current provenance contracts. The last contract run checks 161 sources (28 added, 81 changed, 52 unchanged), nine variants, both HTML files, 910 source negatives, 48 parts negatives and 245 exact-edit negatives. Both previous approval chains and the original archive remain intact.

- Current manifest SHA256: `86dd4527fdea04a523e2eda2d91ee104541d4a9f99d74733bb7e58243e5e4f08`
- Compiled core SHA256: `1f16ffb9f9d17d02f8c4b345313b52e1f5e4eec5dd74c31255ddf411deb490fe`
- HONRO.html SHA256: `1891c958e7136e6876f9eed925700fdd612800de69c25ef6885a81457f7e8c57`
- HONRO_WORKSHOP.html SHA256: `7df7192b4b8ea07e042e80624342dc9a920587a7ddf2825e87245900c1f70731`

The final Node reports replace `runtime-contracts/contracts.json` and `two-skill-balance/quantitative-audit.json`. The earlier successful provenance report is retained locally as `runtime-contracts/contracts-two-skill-checkpoint.json`. Native captures are separately regenerated against final source hashes; publication/browser/performance verification remains outside these claims.

## Preserved completed two-skill checkpoint

Production input checkpoint: `274f0f896f51eade3bbf397509ca1b0a59523bf3`.
Review integration checkpoint: `4097d26b7a6bc05363329794d284d5a420281970` (same production inputs; additional independent tests/docs retained).

## Passed against the final inputs

- `npm run build`: both shipped standalone HTML files rebuilt from the single shared build graph.
- `npm --prefix game run typecheck`.
- `node tests/current-runtime-contracts.mjs`: 161 exact current sources, nine ordered build variants, both HTML bundles, 910 source mutation/deletion negatives, 48 build-parts negatives and 230 exact-edit negatives. Immutable 133-source archive, prior 130-source boundary and old fingerprints retained.
- `node tests/eater-independent-review.mjs`: seven adversarial cases covering live victory mode, future spawns, independent per-target overkill cap, no second armor/shield/break effect, autonomous allies, no hostile damage copying, duplicate/nested capture, inert Continue, expiry, elite/boss identity and a closed-wall release regression.
- `node tests/two-skill-balance-contracts.mjs`: all eight reflection ranks; actual HP/duration across three levels × eight eater ranks; zero/one/three/six target cases; three ally-damage schedules; per-SP utility vectors and 10/25/50/100% active-use sensitivity. Analytical assumptions are explicit, not measured hit rates.
- Final reflection Native Canvas: ten images from the production Engine/Scene, SP1/4/8 guides, first generation and maximal four/twelve live projectiles. Native render state purity, source/build immutability, core reflection and actual App Continue passed; capture PNGs match the independently reviewed reflection outputs byte-for-byte.

## Independent findings corrected before approval

1. Summon ownership originally made the enemy-side prison immune to autonomous allied targeting. The allegiance exception is now explicit.
2. Equal copied damage must not spend a prisoner's shield/armor-break state again. The independent overkill case checks that behavior.
3. A nearest-endpoint-only release crossed a four-pixel closed wall from x=950 to x=1074.952. The final implementation checks a swept full-body route in bounded local space, uses local air plus gravity when no support is available, and does not teleport survivors to distant old spawn points.
4. The active-use utility diagnostic initially applied an unweighted full MP gain to a 25% active-cast mix. Both damage and resource cost now use the declared share; late ranks' lower marginal value for occasional users is reported rather than hidden.

## Exact provenance scope

The new approval adds exact reversible line edits for 30 runtime/core files, including two new compiler inputs, and six eater artwork/generator files. Every preceding approval and its build evidence is immutable. Reversing the new source rows restores the entire previous 159-row classification/provenance hash. The actor bundle is parsed as data, without executing archived code; every actor except `summon_eater` remains identical.

- Current manifest SHA256: `1694a53061700eecec9f9c44dc3ef3333a9ec478201de954be3cf074a1d53215`
- Compiled core SHA256: `ed046745f10fb5cb67e2088d553071dd28175abbcdf51c68a5208dcd6c9b2b44`
- HONRO.html SHA256: `12bc2c81efafd532efa768314e7fe786089869033af02824cc8ed9c12b7a817e`
- HONRO_WORKSHOP.html SHA256: `7373e28fef385db3c6d60958b1e158372b2ecc0eb9be6aa949e26f92986a1ad5`

Generated reports: `_local/reports/runtime-contracts/contracts.json`, `_local/reports/two-skill-balance/quantitative-audit.json`, `_local/reports/splitting-reflection/art/captures.json`, and `_local/reports/splitting-reflection/final-parity.json`.

## Limits

Native images and Node/App harnesses are not browser interaction, live Pages, browser performance or physical-device audio evidence. The known Chromium socket/ptrace permission denial was not bypassed. Release publication and remote verification remain separate gates. Control/duplication values depend on enemy density and allied action investment; no universal scalar balance guarantee is claimed.
