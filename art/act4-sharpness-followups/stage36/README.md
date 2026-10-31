# Stage36 latest sharp candidate: isolated elite reward binding

PASS: runtime and contract fixtures, not normal UI play.

- Original SHA256 (unchanged): `8dc655dd4e1799f9364199aed5a38365893080cb4710b727dc5b1952171512ff`
- Bound candidate SHA256: `dcecb8a22c5740c6ccbd4211e3a7f7a71f1b62be16ee51ab369d65eb325f8dca`
- Evaluated runtime aggregate SHA256: `43cac65405636ac9a7c66f27bbd59b753aad408b626073e369819fec3191a249`
- Supplied remote implementation: sys8994/honro branch codex/act4-native-runtime-integration, commit 8a23dc7bb520d8e01299c43a3b17efb264cec346.

## Exact delta
Only two opt-in properties are added, as recorded in delta.json. Removing them and deep-comparing the entire project to the original passes. All nine enemies, terrain, art/library, and all other data are unchanged. No reward tag was added. Every enemy's production-compiled HP/maxHp/attack equals the unbound candidate.

## Evidence
verify-candidate.mjs evaluates production runtimeParts in an isolated VM with exactly one schema substitution before the actual production compiler runs. It uses this candidate's actual library and real existing a4-36-b-1, never the supplied remote test's synthetic additional elite. Actual Engine.hurt nonlethal/lethal/death paths generate eq_hw_t3b; existing equipment observe commits itm_hw_06 exactly once.

Passes: full candidate schema validation (zero errors); malformed authored/runtime guards; no pre-death reward; all eight other actual enemies rejected; duplicate death rejected; absent opt-in/other chapter/preview rejected; sourceRun/campaignRun/official/elite proof rejection; save failure rollback; preserved eligibility; migrated saved profile and battle Engine snapshot restoration; retry commit exactly once; repeated observation remains one item.

Existing tests/act4-stage36-door-geometry.mjs re-executed with isolated remote schema/coast runtime passes. Eight actual-candidate cases also compare opt-in vs no opt-in: door, distant door, airborne, valid exit, x boundary, y boundary, missing receipts, missing leave scene. All agree. Positive door starts falling and positive exit completes; negative gates block. These are interaction state fixtures, not observed scene playback.

## Reproduce
From repo root: `node _local/reports/approved36-reward-binding/verify-candidate.mjs`

summary.json records facts, ledger, all enemy stats, geometry rows, evaluated runtime hashes, and limits. artifact-hashes.json hashes supplied source, test, candidate, patch, and relevant local modules. test.log records the final successful run.

## Limits
DOM/canvas/scheduling/profile-save persistence are doubles. Real Engine.hurt uses fixture damage values rather than normal combat inputs. Actual equipment screen and normal UI completion remain UNVERIFIED. Shared source was not overwritten and no remote write/deployment was performed; this is local evidence, not a release.

## Prevention notes
Do not add a synthetic elite and claim latest-candidate coverage. Do not add reward tags (HP tuning side effect). Keep both opt-in copies matched, compile with the candidate's real library, and bind claims to candidate/runtime hashes. Separate state fixtures from equipment UI, story playback, art and normal-play acceptance.

## Byte-exact reconstruction contract
The original candidate file is never modified. `candidate.json` here is a NEW COPY.
Read the original bytes with Node.js, verify their SHA256, then `JSON.parse` them. Locate stage metadata.stageId === 36 (index 0 in this source). Assign `design.act4.eliteReward36 = {version:1,targetId:'a4-36-b-1'}` first, then `initialState.honroAct4Design.eliteReward36 = {version:1,targetId:'a4-36-b-1'}`. Object insertion order is significant for the hash: `version` precedes `targetId`; each new property is appended to its existing design object. Serialize with **Node.js `JSON.stringify(candidate)` with no replacer and no space argument**, UTF-8, **NO trailing newline**, no BOM. Do not use Python's default serializer, indenting, sorted keys or newline normalization. The resulting SHA256 must equal the bound candidate hash above. The complete executable construction and deletion/deep-equality proof are preserved near the top of verify-candidate.mjs.

Minimal publishable evidence is the original source SHA + delta.json + resulting candidate SHA + small summary/hashes/test. The large new candidate copy need not be published; consumers must possess the exact original bytes and follow this contract. Remote source files are inputs from the supplied implementation commit, not changes made by this verification.

## Exact upstream-byte correction and final rerun
The initial supplied source copies had one extra trailing newline each (two final newlines vs upstream one), introduced by the parent's apply_patch materialization. No logic or other content differed. Initial source files, successful test log, summary, script, README and hash manifest are preserved under initial-extra-newline-evidence/. Exactly one final newline byte was removed from each of the three isolated copies. remote-byte-correction.json records initial/final hashes and byte-level equality proof. The final test asserts all three upstream SHA256 values before running. The entire same actual-candidate verification was rerun successfully with these exact bytes; candidate SHA, all nine stats and door/exit rows remained unchanged.

Final upstream SHA256:
- `shared/map/schema.js`: `089a61a698b9447a5713fe19d3beb9bbed8e9000b98ef13a5592e8dd3380a7a3`
- `shared/runtime/act4-coast-events.js`: `05ee90f49ad40bf6a0fb11b048156c22100d97f7c4853e774a0391a19b01c63c`
- `tests/act4-stage36-elite-reward.mjs`: `909ff3dd21721ebce7e0d6fbc77dd0ff5cfd5254f2efa9b62dcab9ab34f7374e`
