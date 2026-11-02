# Act1 gameplay QA · 2026-11-03

Candidate: `292c1122fcd75256c366ec15e815fb4adcfbd7b2`. No game/balance/map/story changes.

`plan.json` preserves the original stage1–10 v3 design criteria, classification and macro curve from immutable `3872295f`. The original gzip is 765112 decoded bytes, SHA256 `e2183e74492a4cb61338f8a691a51f23e7af2205fb9148ae6f6b2c138311aa54`. v4 only amends31–40, not these ten stages. These are **declared design goals, not measurements**, and source metadata says proposed/unimplemented. Required/reference precedence is preserved: general map size/platform counts and total enemy budgets are reference, not quotas to fabricate. Story/win conditions must be checked against current runtime.

`legacy-controller.mjs <stage> <seed>` reuses the existing stage1/2/3/4/6/7 positioning controllers with production Engine/App plus DOM/render doubles. It records actual inputs, HP damage and periodic position/support samples. This is controller calibration, not a preregistered general-policy cohort, native rendering, browser/UI or human-fun proof. Historical entry profiles are explicitly noncontinuous; Stage1 uses fresh profile. Failed/stale-route attempts remain in `_local/reports/act1-gameplay-20261103`.

Initial findings:
- `tests/stage10-normal-play.mjs` on current candidate loses using historical Stage9 victory profile. `combat.json` retained. Diagnose old controller route/strategy before balance attribution.
- Old Stage5 fullplay fails before gameplay: `campaignEntryReadiness` asserts historical archer XP1643 equals next-entry1868. `tests/stage5-entry-helper.mjs` already provides current reward/recruit ledger without that obsolete equality; use this actual fixture, do not inject XP or weaken the old test.
- Historical Oct5 ten-stage wins and old browser Engine API calls do not certify current normal UI gameplay or fun.

Acceptance is incomplete. Missing essential measurements fail closed. No automatic subjective fun approval. Final report must retain failed attempts, per-policy denominators, uncertainty, and representative actual UI evidence.
