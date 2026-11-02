# Actual post-victory continuation coverage

`browser_progression.py` extends a **legitimate** won battle through normal dialogue Next/Enter, result Continue or Act1 ending, destination, reload and the title's normal Continue/rest action. It never invokes a gameplay method or changes a profile/battle in `evaluate`.

Independent authored contracts:
- Stage1 → battle2 via result Continue (`journey-content.js:transitionAfter`, `rest-journey.js:resultContinue`).
- Stage5 → rest6, including 휘겸/`knight` (`progression.js:recruitAtEntry`, stage5 recruitment anchor).
- Stage10 → Act1 ending → rest11, including 소단/`occultist` (`act-endings-content.js`, catalogue `actEndings[10]`, `act-endings.js:next`, `act2.js:recruit`). The ending must render an image, complete normally, clear its pending record and persist the `act-ending-v1:10` seen stamp. A result-only shortcut is not a Stage10 pass.
- Existing Stage9 direct continuation → battle10 is retained in the helper contract but not added as a new case in this suite.

Assertions require stored completion with exactly one additional visit and the frozen terminal round; the canonical destination and recruit/party; no stale combat save at rest; and identical completion, roster, XP/training, loadout and equipment signature after reload/Continue. Locks, save warnings, missing completion, wrong destinations, duplicate settlement/rewards, unfinished dialogue or ending, errors and observation timeout fail. No repair writes or fabricated fallback are used. The battle's `final` metrics remain frozen even after the next stage loads.

## Focused genuine-save recovery, not another combat replay

Push to `work/act1-progression-qa/**` runs `.github/workflows/act1-progression-qa.yml`, not the older combat-suite branch pattern. It downloads the exact Stage1/5/10 artifacts13174968070/13175548112/13176420147 from [successful battle run41515762111](https://github.com/sys8994/honro/actions/runs/41515762111), source `fe2cca9a975206a5fb0e72c1422b7401ec2df60d`.

Those artifacts contain entire real stored profiles whose `honroBattle.phase` is `won` at the observed R5/R12/R11. `browser-progression-recovery.py` checks their successful original receipts and exact source, validates the current HONRO.html/manifest hashes against the original served-byte receipt, and verifies every manifest file against its SHA256. It then imports the **entire unmodified recorded save once**, reloads and presses the normal saved-battle Continue button. No field is synthesized, no outcome is set and no original combat is replayed. The imported profile file/hash and original result hash remain in the new artifact. A gameplay-byte mismatch fails instead of borrowing obsolete victory evidence.

The original run remains battle-completion evidence with separate fixtures, not continuous campaign history. Focused recovery adds victory-interruption/save/continuation evidence only. It does not change the original timing-band assessment or become another clear-rate sample.

Future full combat runs also call the same helper before setting `passed:true`; `battlePassed` remains separate. The existing workflow now requires both receipts. Publish this patch to the focused branch to run only the new coverage now.

## Local validation / remaining actual check

Eight mocked progression tests and eight existing driver tests pass, including missing completion despite WON, lost battle rejection, wrong rounds/visits, missing recruitment/destination, locked save, all three route/reload cases, pending chunk-load single-click and duplicate XP on reload. Python syntax, both workflow YAML files and diff checks pass. Local comparison verified the exact original HTML/manifest and all754 manifest files.

Unmodified actual saved profiles were also restored through the native App harness: stage1 settled R5 and entered battle2; stage5 settled R12 and entered rest6 with knight; stage10 settled R11 and entered rest11 with occultist. **That existing native harness omits the act-ending modules**, so its Stage10 result-only path is not accepted as actual ending evidence and cannot satisfy the new browser contract. Initial native diagnostics hit the harness's null-scene frame limitation after entering rest; the bounded diagnostic stopped framing after actual rest instead of changing production code. No browser success is claimed before the focused Actions artifacts are inspected. Local Chromium remains blocked by socket permission, without retries/bypass.

## Actual browser verification completed — 2026-11-02 23:14 UTC

[Focused run41543440284](https://github.com/sys8994/honro/actions/runs/41543440284), source `149f1a2f0f7427206c7978524f8e4996782abbcc`, passed all three actual Chromium cases. The original battle source remains `fe2cca9a975206a5fb0e72c1422b7401ec2df60d` / run41515762111. No combat was replayed or new clear-rate sample claimed. This section supersedes only the pending actual-check status above, not its historical validation limits.

| Genuine victory restored | Persisted completion | Normal continuation and reload result | Artifact |
|---|---|---|---|
| Stage1 WON R5 | visits1, rounds5 | Result Continue → battle2, normal aim phase; reload/Continue returns to battle2 |13187880928|
| Stage5 WON R12 | visits1, rounds12 | Result Continue → rest6, 휘겸/knight joins saved party; reload returns to rest6 with all3 heroes |13187581405|
| Stage10 WON R11 | visits1, rounds11 | Act1 ending cuts1,2,3,4,title → rest11, 소단/occultist joins saved party; reload returns with all4 heroes |13185789372|

All three receipts have `passed:true`, `progression.passed:true`, no exception/page errors, no save warning/profile lock, and the verified original HTML/manifest plus754 manifest-file hashes. Independent archive inspection additionally compared the **entire imported profile objects** against the original battle artifacts' `stored` values: all exactly equal. Imported files' SHA256 values match their receipts:

- Stage1: `3bb2d043b8ddf67756847cc02f43cf7451a722a2d54bff451d79e89554ca5204`
- Stage5: `bbc59b4b3e4b34b0a0714ad0a9287ae0199ef458654dd5415259509e60839a43`
- Stage10: `a94e60741a90cf5342e2fd8410ac189205ba7408d7df05e1c1f6d04350bf2b6d`

Across `destination-before-reload` and `destination-after-reload`, full projected `cleared`, `recruited`, `party`, hero XP/ranks/stat training, loadouts and equipment are equal in all three cases. Completion remains exactly one visit. Stage5 has no knight in the result receipt, then gains him at rest6; Stage10 has three heroes during the ending, then gains occultist at rest11. Stage10's pending ending record changes from `{stage:10,index:0}` to null, while the `act-ending-v1:10` seen stamp persists through reload. Thus recruitment was observed at its authored transition, not assumed from a final roster alone.

Direct pixel review covered five original screenshots: Stage1 result modal shows5 turns/XP+180 and the onward button; reloaded Stage2 shows its actual first allied turn; reloaded rest6 visibly contains 설오·담허·휘겸; the Stage10 ending image visibly renders its tree/gate artwork and first authored line; reloaded rest11 visibly contains all four, including 소단. These are actual screenshot observations, not labels inferred from JSON.

Exact evidence root on the review executor:
`/workspace/scratch/fff510b4df37/honro-act1-browser-driver/_local/reports/progression41543440284/`

- `stage1/progression-result.png`
- `stage1/progression-reloaded.png`
- `stage5/progression-reloaded.png`
- `stage10/progression-act-ending.png`
- `stage10/progression-reloaded.png`

Each stage directory preserves its original `result.json`, imported genuine profile, browser/server logs, restored-title and destination screenshots. `review-receipt.json` records independent comparisons and file hashes. The previous victory-dialogue-only gap is closed **for these three recovered actual saves**. Their separate entry lineage and original timing deviations remain unchanged; this is not an uninterrupted fresh1→11 campaign or a whole-Act1 gameplay acceptance claim. No suite rerun or code change was made for this review.
