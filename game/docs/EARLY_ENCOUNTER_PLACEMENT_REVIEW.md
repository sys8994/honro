# Early-stage monster-placement review · 2026-11-18

## Scope and safeguards
Candidate author changes fresh project placements only. No enemy is added or removed.
IDs, HP, abilities, elite identities, wave/quest definitions, terrain and map revisions remain unchanged.
The single intentional membership change is stage17 ws-west-screen from west-point to the existing brace-front cell,
so its relocated brace approach watch activates with that local group. No activation radius or cap is increased.
Legacy disabled compact/boss layouts are skipped. Existing serialized battles are not migrated.

## Decisions
- Stage9 (24 enemies): break the well-to-ascent procession into a broken-gallery heavy/escort pair,
  a return-edge lookout, a well-floor trio, a single ascent sentry, an upper-shoulder spirit
  and a separate east-return patrol. Existing connected raised terrain is reused, not floating placements.
  Clone IDs and stats remain intact; stage9 now honors existing authored clone-position support.
- Stage13 (23): keep the cave-house pair and already elevated descent guard; move actor21 to the inner gallery.
  Pin actor20 to its previous final x4934.4 because removing actor21 otherwise lets the sanitizer return it
  to source x4998.4 and visually crowd actor19 again. Final house-pair separation is157.6.
- Stage17 (26): keep the entrance pair legible, move the screen to the brace approach and the elite to the rear ground descent. The first candidate was rejected after actual Scene review: neighboring brace picks still formed
  a continuous silhouette chain. A stair candidate then failed original local activation and was rejected rather than widening activation rules.
  The rear descent preserves the required west worksite ground route and existing activation cell.
- Stage29 (32): preserve boss, shields and command archers. Separate the old archive guard into the entrance/
  sluice approach and the old archer into the upper ascent. This removes the six-body lower-floor procession.
- Stage30 (40): retain. Focused Scene shows canopy captain/hounds/front-line group, roof support and stair sentry,
  with a substantial gap before the eastern group. A short row here has a defensible tactical context.

## Evidence and limits
Official production runtimeEntries and actual Canvas Scene run in isolated Chrome (app:false, DPR1, seed3910,
time2, no storage and no network). Identical A/B cameras disable the new author and restore the pre-change stage9 clone-position whitelist for the baseline.
An earlier stage9 baseline retained that whitelist addition and is superseded; do not label its PNG public-original.
Stage17 uses the official lazy worksite initialization before the read-only render snapshot.
This is initial Scene evidence, NOT public-page interaction, normal-route play, or mission-clear evidence.

The contract checks declared-source-only changes, same final runtime IDs/stats, author idempotence,
named support and exact post-sanitize position, no body collision, and eight seconds settling without drift/damage.
Historical disabled layouts remain untouched. These do not establish real-player route difficulty.

Local combat diagnostics explicitly prepare a supported nearby hero and an enemy slot, then run the original Engine.
Actual warning render, hero wait and original damage calls are observed. They do not prove normal-route access.
HP zero is not automatically no effect: stage29 shield guard reduced a knight shield183→147;
stage9 ascent sentry125→68; stage17 entrance picks154→110. The Engine currently reports a miss label when
shield-only damage leaves HP unchanged; this pre-existing labeling issue is recorded, not fixed in placement work.
Use per-hurt before/after shield and HP logs, not net turn shield change (wait can regenerate guard shields).

## Stage-by-stage audit ledger (1–30)
All rows have initial production roster-data inspection from CI44124080375 (all50-final-initial.json).
Follow-up B census now covers the other25 stages (CI44134533604 and44136433909; report commit677d37dc812a6bbbfec4bd7e0daa0f637e1162ee).
Thus1–30 have initial Scene inspection, and the stage15 candidate was subsequently retained after direct role/terrain/objective review. Normal continuous gameplay is still unclaimed.
“Data only” is NOT a visual all-clear. Earlier review is reconstructed in EARLY_ENCOUNTER_AUDIT_RECOVERED.md; its original
local report/images were lost during environment recreation. Every stage had prior roster/terrain/marker and diagram review (A),
but only 8/9/13/17/20/21/29 had prior actual Scene inspection (B). Normal continuous gameplay is not claimed in any row.

|Stage|Initial fighters|Disposition|Scene evidence / remaining uncertainty|
|---:|---:|---|---|
|1|8|유지|B census reviewer: 뿌리 가지의 성긴 단독, 능선 소군집. 지형 높이/공백으로 분리.|
|2|12|유지|B census reviewer: 하부 3체 소군집과 단독 사이 공백, 상공 지원 별도 높이.|
|3|13|유지|B census reviewer: 뿌리 하부 보스 구역, 상부 교량, 우측 제단 군집이 비대칭으로 분리.|
|4|14|유지|B census reviewer: 수레를 중심으로 사발형 경사 위 호위, 별도 먼 감시탑. detail에서 지상 호위/개/상부 궁수 실루엣 구별. 밀집 자체를 결함으로 보지 않음.|
|5|9|유지|B census reviewer: 입구 한쌍, 상공 바위, 단독 나무, 하부 동굴3체, 먼 퀘스트 절벽. side1에는 목표1 포함.|
|6|21|유지|B census reviewer: 서측 공중4, 중앙 공중쌍, 다리 아래 보스/전방호위, 우측 계단/탑을 고저로 분리.|
|7|20|유지|B census reviewer: 오두막·뿌리다리·상단 제단·우측 단독의 구별되는 장소. 넓게 떨어진 순찰3을 행렬로 오인하지 않음.|
|8|37|유지|B census reviewer: 의식 매듭, 중앙 발판3+공중2, 상부 능선, 아래 웅덩이, 먼 보스가 분리. 중앙 및 상단 양끝 확인. side1에는 목표2 포함.|
|9|24|Candidate modified|Direct Chrome A/B. Raised-route and local approach checks are separate from normal play.|
|10|17|유지|B census reviewer: 좌측 오르막과 우측 가지 호위가 중앙 의식나무를 에워쌈. 고저/간격이 달라 등간격 열 아님. 목표1 포함.|
|11|17|유지|B census reviewer: 협곡 전방, 아래 수로, 능선 및 먼 상단 나무 군집 분리.|
|12|24|유지|B census reviewer: 여러 광산/동굴 입구에 분산. 우하부 detail에서 광차·곡괭이·궁수와 상공 까마귀 실루엣을 구별.|
|13|23|Candidate modified|Direct Chrome A/B and local original-Engine shot/hit.|
|14|24|유지|B census reviewer: 상부 집2채 앞 곡괭이·광차, 그 위 박쥐/등불 지원, 경사 접근로와 먼 감시 구역. detail에서 3체 몸체 중첩 아닌 국소 방어로 읽힘.|
|15|22|유지|Direct detail and compact design cross-check: approach-slope wheels2 + sluice-neck wheels3; center gaps141/222/217/152, height separation, rear archer/pick/bell roles. Explicit waterwheel/sluice-defense intent; no supported need for cosmetic spacing edit. Normal combat flow untested.|
|16|28|유지|B census reviewer: 사찰 외곽, 분리된 테라스 쌍, 중앙 석등, 상단 감시, 아래 지하실2, 먼 출구.|
|17|26|Candidate modified|Direct Chrome A/B; first insufficient candidate rejected, direct final rear-ground split and local activation/attack inspected; no continuous route claim.|
|18|10|유지(초기)|B census reviewer: 종 중앙 공간 비움, 입구/아래 성긴 군집, 우측 생존자. detail로 상단 석등 단독 확인. 초기10전투+목표2이며 조건부 구조 이후 증원 별도.|
|19|0|비전투 유지|B census reviewer: 공식familyCalls 초기화 후 detail에 가족/영혼/NPC와 플레이어만 확인. 초기 적0은 의도된 작별 장면. 전투 배치 평가 대상 아님.|
|20|18|유지|B census reviewer: 호송길 아래 군집, 비석 주변3체, 먼 출구3체 사이 넓은 공백.|
|21|26|유지|B census reviewer: gate detail에서 왼쪽 수레호위, 문 앞 개2/곡괭이/장벽 승려, 문 위 공중/지붕 지원, 오른쪽 단독과 주민 경사가 구분. 이전 문 앞 근접 미확인 해소. side1 수레1 포함.|
|22|30|유지|B census reviewer: 수직 탑의 층별 군집. 상단 detail의 5체는 compare-ledgers/exit 건물 국소 방어. 몇 명 같은 바닥이라는 이유만으로 결함 아님.|
|23|40|유지|B census reviewer: 최대줌아웃 U자 연속열 후보를 detail로 재판정. C-front4는 호송 바닥, 궁수2+등불 C-support는 약150world 이상 높은 별도 측면길. 다음 E-flank와 E-front도 두 경사로로 구분됨. 근접에서 장소·역할·고저 분리 읽힘. 실제 교전 합류는 C 미검수.|
|24|26|유지|B census reviewer: 5개 건물 구역, 지붕/까마귀, 골짜기 국소4체의 구분.|
|25|15|유지|B census reviewer: 수직 창고 발판쌍, 상부 우측3+공중, 좌측3, 하부3과 고립 공중. 공백 명확.|
|26|18|유지|B census reviewer: 왼쪽 기록실3, 중앙 주조소 아래4/지붕3, 우측 회계실과 먼 공중이 분리.|
|27|15|유지|B census reviewer: 입구3, 상부 좌측2+박쥐, 중앙 긴 공백/공중, 낮은 창고3, 먼 우측 발판쌍.|
|28|20|유지|B census reviewer: 서측 화재·중앙 관청·우측 사무소·동부 수문. detail의 동부4체는 fire-east→water-release 길목, 별도 궁수가 수문 앞. 왼쪽 건물 고저 지원과 분리.|
|29|32|Candidate modified|Direct Chrome A/B; entrance shield hit absorbed by shield, upper archer HP hit.|
|30|40|Retain|Direct focused and overview Chrome Scene; canopy/roof/stair roles and inter-group gap visible.|

## Integration
Branch fix/early-meaningful-encounters-20261118 is candidate only. Coordinated master/Pages release is separate.
Merge only the early-encounter author registration into shared/build.mjs without losing parallel registrations.
Keep the stage9 whitelist addition in shared/runtime/encounters.js; do not replace sibling work wholesale.

## Verified run and incidental sanitizer effects
Production code 42a93a136a1cfbbf5c98e4a79f4575c5d544d0ef passed CI44135679880 (artifact14352546476).
The corrected public-baseline fixture is test-only commit425bfe13301d682cc068aab9ccb4b9a849eb3b56.
A declared source move can change another actor's sanitizer resolution: stage9 flyer foe-6 shifts x1110→1174;
stage17 actor2 returns from x1410.380952 to source x1442.380952 after the elite leaves the overlap.
Both are included in final runtime position reports and visually inspected, not hidden as unchanged placements.
The stage17 rear-descent source x2350 was rejected by the exact-placement contract (sanitizer chose2286);
final author explicitly uses the verified x2286,y2358.8 support instead of relying on silent relocation.

Exact-baseline corrected CI44136678634 passed all contracts and18 Chrome views (artifact14352387671).
All13 prepared local-action cases caused original-Engine HP or shield loss: stage9 six,13 one,17 four,29 two.
Stage9 baseline Library ID libfile_fde3_f-6f1ed8f0d0148191a82cc7d96866b4cb_96967c77b91c81918106de623b21132d was replaced at version1 with the exact public-baseline PNG; old version0 is superseded.

## Stage15 follow-up: retain, no gameplay change
Reviewed stage15-candidate-detail.png/JSON from census CI44136433909 and current shared/data/act2/stage15-compact-package.json.
Design explicitly says “수차 제압·수문 방어·높은 공동의 고정구 사격”. Wheels543.2/684.5 sit on the entry slope at y2078.98/2100.08;
906.4/1123.6/1276 sit at the sluice neck y2191.98/2200/2200. Gaps141.3/221.9/217.2/152.4 are not equal-spacing filler.
Actor3 is elite in source; sluice is a separate optional interact marker1350,2200, not a mandatory actor3-kill objective.
The rear1375/1452/1622 actors have visually distinct archer/pick/bell roles. Large repeated wheel silhouettes are intentional
for this machinery-defense introduction. No placement edit is justified merely to make the distances less regular.
The existing2+3 layout and its main-route pressure remain; actual sequential combat and the sluice interaction have not been played here.
Final1–30 disposition: four modified stages9/13/17/29;26 retained, including noncombat19. All initial Scenes inspected;
only the four changed stages have synthetic local original-Engine diagnostics in this work, not full normal play.
