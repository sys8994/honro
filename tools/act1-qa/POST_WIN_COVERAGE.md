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
