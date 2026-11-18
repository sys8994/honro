# C first capture: QA origin correction

CI 44288062070 failed before the first image capture: the QA createBattle call omitted options.origin and therefore created a workshop-origin battle. Official monster-scale.prepare correctly did not apply campaign-only sizing. The new positive campaign registration assertion caught this test setup error.

Source contract, official Game/Workshop builds and critical-save rollback QA passed. Nine-view rendering and all50 browser codec validation remain unverified. Original artifact 14420646419 ZIP SHA256: 9eca3b2f22ee0c017491b81ba89d6db91e7631a818da54d15f34d984a31d54e3.

Only the stage32 QA createBattle call gains the official {origin:'campaign'} option. No product code, scale predicate, size/HP rule, source/golden/protection assertion changes. All50 already used campaign origin. B terrain goldens remain unchanged, while normal full Scene and unit differences from the latest5b policy remain diagnostics rather than an exact B comparison.
