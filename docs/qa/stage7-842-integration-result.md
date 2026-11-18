# Stage 7 narrow integration onto842: verified scope

Production candidate: `c2b1c595ed9e5b482d0131b0699a22efbc40f2cc` on the existing independent Stage7 research branch. Production contents are identical to `3aa8680c64232c50dab8ca7244d3c354520694a5`; the later two commits fix test initialization only. This is source-only research integration, NOT master/Pages deployment. Stage32 is excluded. Stage3 was not changed or restored.

## Base and narrow merge

Base `842aa12fd1144e4f7e9ee616a6ae65d632389f51` is the nine-commit direct descendant of `09ac90235b89031b6df8d88cde4c16f39aba78f7`; their production source is identical.842 additionally retains the recent QA records. The merged tree is842 plus exactly seven production paths: Stage7 author attachment, finish module/data, precise optimization descriptor/binding, Stage7-only material bounds lookup, and artificial root-floor closure suppression. Existing12/15 optimizer registrations and dormant original author exports are preserved. Whole study-branch files were not copied over the integration base.

## Actual Scene evidence

Run44220284911, head3aa8680c, artifact14390970946 passed. Root Workshop and Game builds used both release flags. Five real Chrome Scene views were captured with the integrated monster placement, without candidate BODY/helper injection. Registered BODY matches the previously approved754 vector exactly. Original source,13 caps, stage/camera/physics and in-memory codec/movement contracts remained equal between the original-BODY reference and candidate.

Independent visual review found no recurrence of the lower horizontal cut, rectangular tail, long bottom line or gold join in these views. This is the reviewed exterior/join scope, not an assertion that every art issue in the game is solved. Historical whole-scene PNG goldens were not changed to accommodate the integrated monster layout.

Observed repeated-render median1.3–2.5ms, maxima5.4–13.6ms; pan medians2.5–3.9ms; new Scene31.3–78.4ms. Tile counts6/12/2/8/12 with no extra tiles during the bounded pan. These are synchronous diagnostic Scene timings on one CI host, not phone FPS, app startup or a full playthrough.

## Independent842 regression evidence

Run44222560052, headc2b1c595, artifact14390759042 passed. Artifact ZIP SHA256 `3726e2bd26556139deeba59b1a5e1e9ff614593bb20c23fdd26e6a21256b7fa2`.

The test independently checks out/builds842 and the candidate. It uses each checkout's actual App module order, excluding only automatic `main.js`, and creates isolated profiles with the product `fresh()` factory. Storage access is blocked. All50 initial battles were compiled/sanitized and passed the real compact/restore codec exact roundtrip in Chrome157. Between builds:

- all50 stage/monster/physics and normalized restored-battle contracts are identical;
- Stage3 raw and optimized BODY are byte-signature identical;
- Stage7 original source/caps/clips and collision metadata are preserved;
- the only changed library asset is the exact approved Stage7 BODY;
- no Stage32 exceptions exist; storage calls and runtime errors are empty.

The comparator was rerun against the downloaded artifacts successfully. Earlier runs44220284730 and44221509517 failed in the independent baseline because the test omitted App pilot dependencies and then a fresh equipment-bearing profile. Those were test harness errors, not bypassed product failures. No equality gates were relaxed.

## Remaining limits

This verifies narrow Stage7 source integration and initial battle/save-codec invariants. It does not verify normal1–50 campaign completion, existing personal save migration, every device, full gameplay/performance acceptance, or deployment. No personal user save was read or changed. Master/Pages and generated release refs were not modified by this work. Stage32 visual/performance work remains separate and unfinished.
