# Actual browser verification — 2026-11-02

[Actions run 41515762111](https://github.com/sys8994/honro/actions/runs/41515762111), exact source `fe2cca9a975206a5fb0e72c1422b7401ec2df60d`. Downloaded and inspected all three original artifacts, `result.json`, events, and six screenshots. This is committed-production Chromium keyboard/pointer evidence, not native simulation. No rerun, game change, or driver change was made during this review.

| Stage | Actual terminal | Player launches / survivors | Original round target | Assessment |
|---|---|---|---|---|
| 1 | WON R5 | 4 / 1 of 1 | 4–6 | Within band |
| 5 | WON R12 | 15 / 2 of 2 | 7–10 | Above band by 2; UI pass does not waive this |
| 10 | WON R11 | 30 / 3 of 3 | 12–16 | Below band by 1; UI pass does not waive this |

All results have `passed:true`, empty page errors, no exception, and the exact source above. `round` is the displayed round field (each starts R1), not a count of individually completed allied/enemy actions. `shots` equals observed player `fire` receipts; total battle `shotId` is respectively 13/63/80 and must not be mislabeled player shots. All three remain below the 20-round ceiling. Original bands come from `tools/act1-qa/plan.json`; no thresholds changed.

## Fixes directly verified

- **Stage5 movement:** command31 moves from timber-mid to `stage5-timber-high` at `(3004.11,1499.10)`; command33 repeats the landing at `(2996.12,1499.23)`. Commands36/37 retain high support. The previous run41507840802 fell to y2369 then the valley and lost R30. New `command-34-defend.png` visibly places the archer on the upper wooden ledge. `command-45-shoot.png` shows the actual R10 A02 launch from that ledge toward the cleat; the second cleat launch is R11. The terminal screen states the cleat broke and shows objective completion at R12.
- **Stage10 terminal-aware aim:** 30 successful aims/launches are followed by one interrupted aim (`passed:false`) and an explicit `terminal-during-aim` event with actual `phase:won`, R11. No 31st launch or fabricated precision pass is claimed. Terminal pixels show all three heroes with Sodan and her authored victory dialogue. The prior run's R12 victory was wrongly labeled an aim failure; this exact transition now reaches the unchanged final won/no-errors gate.
- All 15 Stage5 aims succeeded, with no wrong-skill receipt. Maximum requested-vs-released charge difference is0.0283 (Stage5) /0.0362 (Stage10); those are actual elapsed-input differences, not exact-power claims. Stage1's four launches are full-power A01. No game defect requiring further driver changes was found in these observations.

## Entry lineage and limits

- Stage1 uses fresh browser storage/new journey.
- Stage5 imports `fixtures/stage5-entry.json`: reconstructed current first-clear reward/recruit fixture through4, then declared legal SP allocation. Prior `cleared` entries have rounds0. It is not an earned continuous1→5 campaign.
- Stage10 imports `fixtures/stage10-entry.json`: historical actual Stage9 victory profile plus declared legal allocation of existing XP/SP. Prior stage8 is37R and stage9 is2R; those historical values remain and are not current-source stage8/9 passes. It is not this run's Stage5 survivor/profile.
- All cases use seed19388 and one tool-assisted policy per stage. Three UI wins are not a population clear rate, blind holdout, full Act1 acceptance, or enjoyment evidence.
- Capture stops in the authored victory dialogue. Each stored profile still lacks the just-won stage in `cleared`; post-dialogue outcome/save, recruitment, Continue/reload and cross-stage campaign persistence are **not** verified by these artifacts. Terminal full HP includes normal settlement/growth effects and is not proof of zero combat damage.
- First-to-last event windows are approximately81/237/340 seconds for1/5/10. These exclude some startup/terminal work and include automation overhead. They are not human play durations and cannot be compared directly with the planned5–9/9–15/17–25 minute bands.

## Evidence locations

Worktree: `/workspace/scratch/fff510b4df37/honro-act1-browser-driver/`.
Original downloads are extracted under `_local/reports/pass41515762111/stage{1,5,10}/`, including `result.json`, `events.json`, `browser.log`, `source.txt`, `served-sha256.txt`. Screenshots remain outside Git as required.

| Stage | Artifact ID | Inspected screenshots (relative to extracted stage directory) |
|---|---|---|
| 1 | 13174968070 | `terminal.png` |
| 5 | 13175548112 | `command-34-defend.png`, `command-45-shoot.png`, `terminal.png` |
| 10 | 13176420147 | `command-43-shoot.png` (visible5/6 protection hold), `terminal.png` |

Historical failure evidence remains separately under `_local/reports/fail5/` and `fail10/`; no failed traces were replaced. These artifacts establish the two input-driver repairs and representative actual UI clears, while Stage5/10 round-band deviations and broader campaign/gameplay acceptance remain separate.
