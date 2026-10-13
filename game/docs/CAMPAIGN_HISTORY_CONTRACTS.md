# Current canonical and immutable campaign history

The full campaign at 5ca1830 (also 0372047 and6c836df) contains30 chapters and640 assets. The old density checkpoint1973f07 contains30 chapters and586 assets; the preceding Stage8 checkpoint contains580 assets. These are different contracts, not interchangeable goldens.

## Provenance and independent checks

`tests/fixtures/campaign-contracts/current-manifest.json` records the explicit post-density source commits, all current stage/asset hashes and ordering, source5ca1830, and metadata-only correction e987e41. Its own bytes are pinned. Against1973f07 there are21 changed chapters,54 added assets, zero deleted assets, and one changed original asset: the source-generated hollow bell. The other9 chapters and project globals remain exact. Runtime-authored project data has a separate explicit contract from raw JSON; neither authorizes changing historical runtime sources.

`test:campaign-contracts` starts with immutable1973f07 data and executes current14/22/quest/tactical/warning/bell authors to reproduce all30 complete maps and all640 assets. Five retired editable assets are retained from their actual introduction commits, with complete bytes and independent digests.13/16 object-key insertion order is immaterial to semantic regeneration; exact raw serialized stage hashes are nevertheless required separately.15 terrain insertion order comes from the actual incremental bd61375 release; the replay requires exact IDs/values before restoring that declared order. Asset insertion order is likewise independently pinned. No asset namespace wildcard or arbitrary current golden refresh is allowed.

The immutable checkpoint is stored as `density-1973f07.json.gz`, with both compressed-byte digest and the original JSON SHA4e6862fce73a458b6ca04566d898fb0531822a95934059eb981585eaf2469722 checked. New history checks do not depend on git history being present. Stored JavaScript is never evaluated. Historical density and earlier fixture digests remain unchanged.

`campaignHistoryInput` first validates the entire separately approved current input, then supplies immutable historical DATA to the historical validators. Raw/current runtime variants are explicit and separately hashed. Existing behavior/save/actor/terrain tests still use today's production runtime. Library-only boundaries use explicit full/act12 scope; a640-asset full library is never guessed to be Act12. Current and historical tampering both fail, including asset deletion/addition/reordering and stage/global drift.

## Metadata correction

`test:campaign-metadata` independently pins5ca1830's before-spaces and verifies that only the reviewed15/19 annotations change. It compares all30 complete compiled battles, allowing only the exact honroMap.space metadata delta. Current canonical validation previously reported20 missing references and now reports zero. This does not change terrain, actor counts/stats, objectives, skills, current battle snapshots, or runtime code.

## Future changes and remaining gates

These contracts intentionally target5ca1830 plus e987e41. The proposed Stage5 waterfall redesign is not included. It and any later campaign change require a separately reviewed source-derived delta and paired current/historical negative controls, not automatic fixture regeneration.

The older130-source runtime membership and fingerprint checks have NOT been changed, waived, or supplied with old runtime code. After the data boundary is repaired, stage12-redesign reaches `Exact density source membership`, exposing newer runtime/data modules. That is a separate release blocker requiring its own evidence and approval. Aggregate verify, browser Game/Workshop/Playtest, performance and public Pages acceptance remain independent gates; passing these new data contracts is not a claim that the release is ready.

## Explicit fresh-story display boundary

Commit edcd57c30576dae6d0f4520abe2ee02b907a77af intentionally rewrote the fresh chapter8 and10 goal text in `shared/runtime/content.js`, alongside story-content. The exact two before/after sentences are declared in `tests/current-story-display-helpers.mjs`. The original sentences remain in immutable campaign input and `narrative-legacy-v0.json`. Historical recipe comparisons apply the same current `HonroObjectiveRevision.contentFor` display boundary to both inputs. This is separate from migration metadata. Only these exact two sentences can change; all other objective fields, victory conditions, target IDs, coordinates, state and order remain part of the full equality comparison. Unknown labels and unrelated field mutations fail the dedicated current-story-display regression.

## Binding creation normalization defect

Fresh narrative authoring appended chapter10's `sodan-binding` after schema normalization, omitting `detail`. A later editor import correctly supplied `{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}`, causing a real roundtrip mismatch. The creation site now initializes exactly that existing schema default; existing authored bindings and saved battles are not rewritten. `test:binding-detail` pins the prior complete runtime project and exact old terrain, proves the one-field delta, all30 author/import idempotence and complete compiled battle equality, plus geometry/HP/detail tampering rejection and three real App Continues of a partially damaged binding. Existing integrated narrative tests independently retain collision separation, damage, cooperation and old-save behavior checks. Raw canonical JSON and historical originals remain unchanged.

After the source/default fix b7ae179, the current runtime-data manifest adds an explicit reviewed delta from runtime project0b41536f to b0c19e9a, changing only chapter10's generated binding detail. Its raw project and all original history expectations remain identical. The runtime-history document supersedes the earlier source-membership blocker note: source/build identity is now a separately executed gate; no current behavioral fingerprint is rewritten to an archive identity.

## Final approved waterfall integration

The final integration from d8b2c85,17adf61 and a39a75f adds the explicitly approved chapter5 source author. Current canonical still has30 chapters and640 assets,54 additions versus density history and exactly the same single changed original bell asset. The raw/runtime chapter5 hash is d7cde437c9bfc5dd9decda15047c6a5b2a5ecc2e633f1c342937eae7a8e202a5. No library asset changes accompany this unit. The prior21 changed historical chapters remain independently enumerated; chapter5 is the22nd separately recorded change.

`approved-waterfall-contract-helpers.mjs` requires the complete exact current chapter5, reconstructs it with the real current author from the original0372047 fixture, and checks the entire project including every other chapter/global/library. That original stage is also checked equal to immutable1973f07 stage5. For the prior runtime contract, the original passes through today's actual four production authors and must match its previously pinned runtime hash. This boundary is used only to retain earlier full-project data checks. Metadata regression still compiles all30 actual current maps before and after its metadata repair; the binding regression similarly compares the actual current30. Current chapter5 behavior, physics, migration/save and Game/Workshop checks remain separate real-engine tests. Four extra asymmetric chapter5 geometry/stat/revision/order mutations fail before projection.
