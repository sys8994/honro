# Stage31 static evidence map for integration A
**Read-only design assistance; no acceptance records, probes or review results created.**

## Priority and provenance
Remote RC b46348577 tools/stage31/RELEASE-CANDIDATE-AUDIT.md (blob e42696af555b31e445f21089fba83e40ce854871), stage31-support-card.draft.json (d05ca18b8438e9481a2d7e6185bb5b1d366c6eac), prepare-draft.mjs, production-contract.js and pilot combat source read directly. The existing local compressed candidate was decoded and SHA256 rechecked: **cebd6fa4858c7770739f236bbace39ef02ede43e1493ad82c0acadf10c695ff7**, same as remote audit. Local dirty runtime was not executed or substituted.
The draft has60 blockers, not60 confirmed gameplay defects. Role declarations34, four purposes/target zones plus budget, intent/references and route declaration can be informed below, but machine rerun may expose additional findings. Do not subtract these from60 without rerunning actual contract. Two slope support disagreements remain open. Reviews/screenshots/probes require actual evidence; f181dc368 harness repair is not combat acceptance.

## Source-of-truth warning
tools/stage31/blueprint.json is a **historical13-enemy s31-* layout**, not this34-enemy approved31-* candidate. It supports the estuary/upper-vs-low choice and references stage3/stage30, but its target rectangles,13-enemy budget, no-boss rationale and route coordinates MUST NOT be copied into this card.
Current candidate design.pilotRoster.source names tools/act4-pilot/layouts/stage31-roster-v6.json, but that path was unavailable at the inspected remote ref. Use the actual candidate's embedded role/roster data, not a guessed missing JSON file.

## Static declaration map
| Card field / blocker | Can be grounded now | Still not proved |
|---|---|---|
| intent / P01 | '강 끝 하구의 높은 제방에서 사거리·고도를 택할지, 낮은 물길 측면으로 내려가 사선을 바꿀지 선택한다. 물길과 선착장의 실제 위협을 모두 해소한 뒤 연실의 배 접근·4인 승선으로 끝낸다.' Current goal/pilot two-pocket counterroutes/boarding support this drafting text. | Two routes actually offer fair different choices, readability, fun. |
| referenceStages / P01 | stage-3,stage-30 are explicitly nominated by historical blueprint. Use as **planned references**, verify full canonical project IDs. | Actual matched screenshots/implementation comparison required by S4; don't pretend nominated means compared. |
| preserve | Keep exact draft story object and four party IDs. Candidate objective/event arrays are empty, so preserve arrays legitimately empty. | Runtime arrival/boat/boarding seeds still mandatory: empty authored arrays do NOT mean no story to preserve. |
| budget / E02 | initial34; authored elite flags4; midboss1 separate (ridge-court-8 is elite:false,honroMidboss:true); honroActiveLimit6. No authored finite spawn declarations in this candidate. | Verify compiled elite count and finiteSpawnCount0 against current complete runtime; activeLimit6 is cap, not6 observed acting enemies. |
| members.role / E01 | enemy-role-map.json/.csv list all34 IDs, exact supports, source intent, proposed allowed-role translation. | Actual approaches, attacks, binding, cover/LoS, pressure and movement remain required. |
| supportId / E01 | Keep34 exact authored declarations from draft/candidate. | ridge-court-7/east-return and lookout-return-5/low-flank are unresolved surfaceY>1.35 vs Engine grounding disagreements.120frame grounded does not prove traversal. Do not relabel them airborne or move coordinates to silence gate. |
| routes / T03 | authored-support-traces.json gives exact4.5× pilot trace coordinates matching current terrain vertices. Proposed route meanings below. | Inter-support jump/drop/rejoin/boat access still needs ordinary-input probes. Every trace vertex is not automatically a valid contract surfaceY point. |
| assetExceptions / A01 | Current direct5 assets and purpose can be documented below. | Mere reason text is not common-art acceptance and cannot replace actual reviews/dynamic asset binding. |
| cameraViews/V01 and requiredProbes/V02 | Can declare planned capture/probe claims, using current boarding tour values only as authored camera metadata. | Seven view categories, actual shots/enemy actions/objective, current runtimeDigest/fingerprint screenshots remain unobserved by this audit. |

### Budget rationale, not a pass
34 authored actors form west-fold17 and ridge-lookout17 pockets, each split into two actual encounter groups, with asymmetric guard/close/bow/bind roles and one existing pilot levee midboss. Full threat resolution precedes boarding; no reinforcements or extra boss should be invented to meet a numeric goal. The existing observed15R/34kills run is separate historical evidence, not a current-runtime probe or rate.

## Four encounter purposes and target-area uncertainty
These are **draft design statements supported by placements**, not verified behaviors.
- west-entry8: on entry and upper-west, guards/close approach contest the first rise, upper arc/bow threaten approach from above; binding encourages spacing. Purpose: make opening elevation/position choice before western fork. Target supports: player entry approach and first upper-west rise. Source activation radius800/maxHeight650 is a proximity rule, NOT an observed firing envelope.
- west-crossfire9: low-flank and upper-west, paired vertical pressure makes low bypass a tradeoff rather than enemy-free shortcut. Source labels/pocket counterroutes support alternate angle/cover use. **'Crossfire' is unverified** until actual rays/projectiles reach both routes; the name cannot establish it.
- ridge-court9: east-return/frontline with upper-east archers, exact levee midboss ridge-court-8 creates directional guard→locked warning→physical relocation→exposed flank opportunity. Target supports: lower-to-upper east-return climb and upper-east junction. Pilot source supports those phases, but actual warn/offer/fire/relocate/exposed and useful counterroute must be observed. Retain relocation(5940,2207.25) as authored, not proof reachable.
- lookout-return8: lower-flank return and east-return join with one upper-east binder. Purpose: maintain rear/low-route opposition while upper route approaches, then clear approach toward harbor. Not a special boarding-objective guard: no per-unit boarding tag and all groups participate in generic quiet requirement.

**Do not auto-fill targetZone with enemy min/max bounds.** The contract asks for actual player target region; enemy occupation rectangle is not that. A must author chosen route-corridor rectangles on actual candidate supports, explicitly justify them as planned threat areas, then test reachable enemy action/LoS within those rectangles. Four broad boxes enclosing every group would erase the very upper/lower tactical distinction. This is the clearest remaining design-authoring decision, not missing clerical metadata.

## Role translations: functional basis and required test
All34 explicit rows are in enemy-role-map.json; proposed totals vanguard7,pursuer8,ranged-support8,overwatch5,area-denial6.
- guard→vanguard: source armor.15 versus.04 and intent front armor/flank/knight. Need actual block/approach/front-vs-flank effect.
- close/mourner→pursuer: source role leaper and close-range approach/retreat-intercept intent. Need actually reaches/pressures a viable player path; don't call ambush without hidden trigger evidence.
- bow on upper support→overwatch; bow on lower/entry/return→ranged-support. Need real downward/cross-lane shot and positional difference; terrain occlusion may invalidate this proposal.
- bind/shade→area-denial: source binding-shot/spread/change-shelf intent. Need actual bind/affected zone/counter movement, not species name alone.
- arc/warden→area-denial: source native wood spike/wind, oblique lane interruption. Needs real attack; don't mistake all wardens for pilot miniboss.
- exact ridge-court-8→area-denial: source pilot levee tagged and current loader includes correct module; delayed blast/warning/relocation explicit. No special quest/victory/civilian rule is added by that module.
No airVolume workaround: current support-card treats these34 as grounded actors. No objective-guard label is necessary solely because the mission has a dock.

## Route plan using real supports, with unsolved transitions visible
1. **Primary ridge route (draft):** entry→upper-west→upper-east. Exact common endpoints entry/upper-west(2223,1885.5), upper-west/upper-east(4068,1057.5); upper-east ends(6547.5,1944). Purpose: elevated angles/range at cost of exposed climbs/upper pressure.
2. **Alternative lower flank (draft):** enter low-flank at(1696.5,2511), follow to(5085,2839.5), same-point east-return begins, climb toward(6133.5,1971). Purpose: break upper direct lanes, accept low-path pursuit and return climb. Initial entry→low-flank is a **drop/jump transfer, not shared endpoint**; ground above nearx1696 is roughlyy1930. End east-return/upper-east is also a transfer needing landing proof.
3. **Harbor approach/rejoin (draft):** boarding surface(5940,2727)→(6570,2749.5), harbor-stair top(6583.5,2736) descending to(6142.5,3298.5), harbor-landing→(6322.5,3339). Upper-east→boarding has a large drop (~800), not an automatic edge. boarding/stair tips differ13.5 in each coordinate: actual foot/support transition must be tested.
4. **Final dynamic objective:** boat deck is runtime a4-boat-deck, x6367.5,y3366,w360; board interval6397.5<x<6697.5, all4 grounded near deckY, normal interaction. Harbor-landing end(6322.5,3339) is not the boat itself. Do not declare a nonexistent static terrain ID to pass T03; static route ends at landing and objective probe handles moving boat/dynamic deck plus story/quiet.
5. **Retreat/counterroute:** reverse reachable upper or low segments is a proposed tactical option, not a newly proven retreat path. Slope disagreement vertices and water recovery must stay visible in route/probe notes.

Suggested probe declarations (no results): ordinary upper route vs low flank/rejoin; same skill/actor shot from two meaningful elevations; each encounter's actual valid enemy action and response; levee warning+relocation/exposure; all-threat-clear→boat approach→deck→four-person normal boarding. Do not manufacture IDs/results from past runs with a different digest.

## Direct asset reasons that can be drafted
- approved31:coastal-foundation: nonplay coastal foundation connecting exterior geology; actual joins/edges still review.
- approved31:body: selected traced rock/body artwork covering listed playable supports; collision-vs-art match still review.
- approved31:harbor-piling: harbor structural grounding/readability, not proof standable.
- approved31:harbor-stair: stair art matching authored harbor-stair support; must verify actual footfalls and transitions.
- a4:boat: preserved arrival/boarding story asset; moving boat and dynamic deck require runtime binding.
Also bind design.vectorArrivalBoatAssetId=approved31:complete-ferry and pilot reference/runtime separately; the5direct-asset equality alone does not cover dynamic assets.

## Hand-off limits
Only this audit folder contains new files. No production card, source, runtime, asset, code or remote changed. No engine or browser was run. Keep releaseApproved=false and retain all4reviews missing until genuinely recorded. A can use these declarations as a source map, but filling fields is not a substitute for F2 actual role performance or release acceptance.

