# 1~30장 상호작용 판정 전수 목록

이 목록은 현재 저작 조작50개의 유효 입력 predicate 전수 검사와 저장 계약 메타데이터 조사다. 실제 플레이/브라우저 실행 표본은 README에 구분한다. `tests/interaction-eligibility-audit.mjs`로 재현한다. 적을 바로 옆에 추가해도 결과가 같으며 거리·층·죽은 actor/대상·필수 역할·중복 수집은 별도 음성 사례로 검사했다.

| 장 | 실제 E/터치 조작 ID | 제거한 전멸 선행 단계 | 자동 물자 접근 | 유지한 전투/기계/이동 목표 |
|---|---|---|---|---|
| 1 연목 고갯길 | — | — | marker-2<br>marker-4<br>marker-6 | — |
| 2 상여 위의 높은 길 | — | — | marker-2<br>marker-4<br>marker-6 | — |
| 3 나루의 남은 장부 | ledger | — | marker-2<br>marker-4<br>marker-6 | — |
| 4 문 밖에 남은 사람들 | — | — | marker-2<br>marker-4<br>marker-6 | — |
| 5 폭포 틈의 한 발 | receiver-5 | — | marker-2<br>marker-4 | — |
| 6 끊어진 나무다리 | — | — | marker-2<br>marker-4<br>marker-6 | — |
| 7 살아 있는 사람을 꺼내는 법 | resident-marker-1<br>resident-marker-2<br>resident-marker-3 | — | marker-2<br>marker-4<br>marker-6 | — |
| 8 돌아오는 빈 상여 | — | — | marker-2<br>marker-4<br>marker-6 | — |
| 9 바람 없는 마당 | receiver-west<br>receiver-east | — | marker-2<br>marker-4<br>marker-6 | — |
| 10 소단 — 놓지 못한 밤 | receiver-west<br>receiver-east | — | marker-2<br>marker-4<br>marker-6 | — |
| 11 매듭을 거둔 아침 | resident | — | — | — |
| 12 돌아오는 산길 | sign | — | — | route-exit (route) |
| 13 숨은 석문 | resident<br>gate | — | — | exit (reach) |
| 14 해가 닿지 않는 마을 | family-upper<br>family-mid<br>family-lower<br>bridge | — | — | hold-refuge (hold) |
| 15 물 아래의 길 | sluice<br>groove | — | — | route-exit (route) |
| 16 잠운사 | monk<br>hall | clear-rescue-threat | — | — |
| 17 두드리는 벽 | brace<br>repair | clear-works | — | hoist (defeat)<br>hold-hoist (hold) |
| 18 묵종 | silence<br>leak<br>spirit-lamp-0<br>spirit-lamp-1 | — | — | hold-silence (hold)<br>upper-chain (destroy)<br>keeper (defeat) |
| 19 종 안의 사람들 | route<br>separate-1<br>send-1<br>separate-2<br>send-2<br>separate-3<br>send-3<br>old-soul | — | — | — |
| 20 다시 하늘 아래 | escort | clear-mouth | — | escort-mid (escort)<br>hold-convoy (hold)<br>escape (escort) |
| 21 성문 아래 | gate-resident | — | — | refuge-hold (hold)<br>city-exit (reach) |
| 22 옛 장부 | archive-seal<br>ledger-case<br>upper-register | — | — | compare-ledgers (hold)<br>archive-exit (reach) |
| 23 사라진 짐 | dispatch-bundle | — | — | dock-mid (escort)<br>dock-exit (escort) |
| 24 휘겸의 문장 | family-crest<br>shrine-seal | — | — | garden-exit (reach) |
| 25 물 아래 묶인 이름 | depot-entry-seal | — | — | stake-arrival-1 (reach)<br>stake-arrival-2 (reach)<br>stake-arrival-3 (reach)<br>stake-arrival-4 (reach)<br>stake-arrival-5 (reach)<br>waterworks-exit (reach) |
| 26 지상에 남은 증언 | hidden-latch<br>artisan-resident | — | — | workshop-exit (reach) |
| 27 검은 집하장 | family-manifest | — | — | stake-arrival-1 (reach)<br>stake-arrival-2 (reach)<br>stake-arrival-3 (reach)<br>stake-arrival-4 (reach)<br>deep-depot-exit (reach) |
| 28 지운 이름과 남은 명령 | fire-screen<br>water-release<br>petition-record | — | — | party-reunion (reach)<br>office-exit (reach) |
| 29 현묵의 글 | — | — | — | old-seal (hold)<br>route-exit (route) |
| 30 남겨진 길 | — | — | — | transport-map (reach)<br>ferry-hold (hold)<br>old-road (reach) |

## 조작이 아닌 action 마커

아래는 route/reach/hold/파괴/자동 evidence 또는 폐지한 안전 단계의 마커다. E 대상과 혼동하지 않는다. 폐지한 안전 마커는 snapshot을 지우지 않고 후보 UI에서 제외한다.
- 12장: route-upper-exit [special/route / 기존 자동·목표], route-lower-exit [special/route / 기존 자동·목표], route-exit [route / 기존 자동·목표]
- 15장: route-lower-exit [special/route / 기존 자동·목표], route-upper-exit [special/route / 기존 자동·목표], route-exit [route / 기존 자동·목표]
- 16장: record [evidence / 기존 자동·목표], witness [evidence / 기존 자동·목표], clear-rescue-threat [clear / 폐지]
- 17장: notes [evidence / 기존 자동·목표]
- 23장: carrier-start [evidence / 기존 자동·목표]
- 24장: land-register [evidence / 기존 자동·목표]
- 25장: household-tally [evidence / 기존 자동·목표]
- 26장: investigation-record [evidence / 기존 자동·목표], casting-tally [evidence / 기존 자동·목표]
- 27장: depot-route-ledger [evidence / 기존 자동·목표]
- 28장: closure-order [evidence / 기존 자동·목표], suppression-order [evidence / 기존 자동·목표]
- 29장: hyeonmuk-letter [evidence / 기존 자동·목표], route-upper-exit [special/route / 기존 자동·목표], route-lower-exit [special/route / 기존 자동·목표], route-exit [route / 기존 자동·목표]
- 30장: transport-map [reach / 기존 자동·목표]

## 저장 계약 경계

저장된 `honroAct2Steps`/`honroAct3Steps`와 원문은 재작성하지 않는다. `raw`, `effective`, `objectiveLegacy`, `canonPrior`, Act2 revision1 및 splitV1/waterworksV2의 원래 ID를 조사했다. 2막은 저장 단계 배열의 읽기 전용 실행 뷰에서, 일반 clear 연속 구간 바로 뒤가 interact/rescue/evidence인 경우만 제외한다. optional/명시 target/독립 전투·defeat·destroy·hold·escort·reach·route는 남긴다. 이미 얻은 done/checkpoint/XP를 삭제하거나 없는 처치 완료 사실을 만들지 않는다.

| 자료 | 조작이 있는 장과 원래 ID |
|---|---|
| splitV1 | 25: hidden-latch, investigation-record<br>26: workshop-brace, artisan-resident, casting-tally<br>27: water-release, fire-screen, petition-record, carrier-start<br>28: closure-order, suppression-order |
| waterworksV2 | 25: depot-entry-seal, household-tally<br>27: depot-route-ledger, family-manifest |
| act2Revision1 | 11: knot-west, knot-east, resident, trace<br>12: sign<br>13: resident, gate<br>14: family-upper, family-mid, family-lower, bridge<br>15: sluice, groove<br>16: monk, hall, record, witness<br>17: brace, repair, notes<br>18: silence, lower-chain, leak<br>19: route, separate-1, send-1, separate-2, send-2, separate-3, send-3, old-soul<br>20: escort |
| raw | 11: knot-west, knot-east, resident, trace<br>12: sign<br>13: resident, gate<br>14: family-upper, family-mid, family-lower, bridge<br>15: sluice, groove<br>16: monk, witness, hall, record<br>17: brace, repair, notes<br>18: silence, leak<br>19: route, separate-1, send-1, separate-2, send-2, separate-3, send-3, old-soul<br>20: escort<br>21: gate-resident<br>22: archive-seal, ledger-case, upper-register<br>23: dispatch-bundle, carrier-start<br>24: family-crest, shrine-seal, land-register<br>25: depot-entry-seal, household-tally<br>26: hidden-latch, investigation-record, artisan-resident, casting-tally<br>27: depot-route-ledger, family-manifest<br>28: fire-screen, water-release, petition-record, closure-order, suppression-order<br>29: hyeonmuk-letter<br>30: transport-map |
| effective | 11: knot-west, knot-east, resident, trace<br>12: sign<br>13: resident, gate<br>14: family-upper, family-mid, family-lower, bridge<br>15: sluice, groove<br>16: monk, hall<br>17: brace, repair<br>18: silence, leak<br>19: route, separate-1, send-1, separate-2, send-2, separate-3, send-3, old-soul<br>20: escort<br>21: gate-resident<br>22: archive-seal, ledger-case, upper-register<br>23: dispatch-bundle<br>24: family-crest, shrine-seal<br>25: depot-entry-seal<br>26: hidden-latch, artisan-resident<br>27: family-manifest<br>28: fire-screen, water-release, petition-record |
| objectiveLegacy | 11: knot-west, knot-east, resident, trace<br>12: sign<br>13: resident, gate<br>14: family-upper, family-mid, family-lower, bridge<br>15: sluice, groove<br>16: monk, witness, hall, record<br>17: brace, repair, notes<br>18: silence, lower-chain, leak<br>19: route, separate-1, send-1, separate-2, send-2, separate-3, send-3, old-soul<br>20: escort<br>21: gate-resident<br>22: archive-seal, ledger-case<br>23: dispatch-bundle, carrier-start<br>24: family-crest, shrine-seal, land-register<br>25: depot-entry-seal, household-tally<br>26: hidden-latch, investigation-record, artisan-resident, casting-tally<br>27: depot-route-ledger, family-manifest<br>28: fire-screen, water-release, petition-record, closure-order, suppression-order<br>29: hyeonmuk-letter<br>30: transport-map |
| canonPrior | 11: knot-west, knot-east, resident, trace<br>12: sign<br>13: resident, gate<br>14: family-upper, family-mid, family-lower, bridge<br>15: sluice, groove<br>16: monk, witness, hall, record<br>17: brace, repair, notes<br>18: silence, leak<br>19: route, separate-1, send-1, separate-2, send-2, separate-3, send-3, old-soul<br>20: escort<br>21: gate-resident<br>22: archive-seal, ledger-case, upper-register<br>23: dispatch-bundle, carrier-start<br>24: family-crest, shrine-seal, land-register<br>25: depot-entry-seal, household-tally<br>26: hidden-latch, investigation-record, artisan-resident, casting-tally<br>27: depot-route-ledger, family-manifest<br>28: fire-screen, water-release, petition-record, closure-order, suppression-order<br>29: hyeonmuk-letter<br>30: transport-map |

## 코드 경로별 판정

- `interactions.js`: 거리260/층150/살아 있는 actor·대상/필수 역할/행동 중·대화·중복 제약 유지. 주변 적 판정 없음. 사용자 작성 custom 목표를 필터하지 않는다.
- `act2.js`: 기존360거리 일반 적 gate 삭제. 직접 조작·자동 증거에 붙어 있던 clear 선행만 읽기 뷰에서 제외. 원래 장치·구조 위치는 그대로 요구한다. 특정 부착혼 약화/분리는 예외 검토 후보로 별도 기록한다.
- `act3-objectives.js`: 같은 층220거리 작업 안전 gate 삭제. 현장 수거·동행/실제 carrier·역할·행동 조건 유지. 방어 hold의 contest는 명시적 방어 목표이며 그대로다.
- `objective-guidance.js`, `stage11-ravine-encounters.js`: 제거한 주변 위협 안내·수레 수에 따른 구조 cue 억제 제거. 옛11장의 전역 E/use 차단 wrapper 제거. 독립 clear-road 전투/예고 편대의 완료 판정은 남긴다.
- `evidence-quests.js`: 폐지된 clear 의존만 바로 앞 실제 단계로 연결한다.16장 방·26장 현장 수거의 접근 조건은 아래 검증에서 구분한다.
- `mission.js`: 1막 유한 휴식 물자의 주변 적470 gate 제거. 실제 접근의 honroPending, collected1회, 기존30%HP/40%기력은 유지한다. 보호/호위 objective의 이동·방어 조건은 변경하지 않는다.
- `stage14-rescue-gates.js`, `stage18-short-quest.js`: 부모의 구조/18장 새 목표·2턴·저장 이행 그대로. 18장만 면제하던 일반 gate 분기는 전 장 제거로 불필요해졌지만 전용 모듈/API는 보존했다.
- `stage15-drain-contact.js`, engine `gateTravel.ts`: 실제 활성 지형 접촉/쓸림면·착지 공간·생존 몸 충돌은 보존. 적 수를 죽여야 한다는 조건이 아니라 어느 편 몸도 겹치지 않게 하는 물리 안전이다.
- `route-branches.js`: 12장 높은 작업굴의 명시적 경로 수비 target과 열린 내리막 대안 등 선택 경로 계약은 유지. E 순간의 추가 주변 전멸 gate와 구분한다.
- `act3-void.js`: 27장 기록 확인의 기존 서사 장면은 보존. 일반 주변 적 수에 따라 조작을 막는 판정이 아니다.
- 원본 옛 immutable JS는7일 공개 클라이언트 호환용 비활성 자산으로 남는다. 새 코드 실행 연결에 옛 gate를 다시 넣지 않았다. 이미 열린 옛 JS 자체를 원격 패치했다고 하지 않는다. 새로고침 후 같은 저장 Continue에 적용된다.

## 전멸 단계별 실제 동선·사실 관계

| 단계 | 변경 | 접근/행동/증거 근거 |
|---|---|---|
| 16 clear-rescue-threat | 주변4명 처치 선행 제거 | 원래 witness는 evidence/afterEvidence=clear-rescue-threat로 actor 거리 없이 자동 전달했다. 이제 실제 monk 구조가 끝나고 동행이 원래 witness 위치/살아 있는 지정 인물 곁에 있어야 기존 자동 경로로 전달한다. 먼 곳에서는 새 지급 불가, E 클릭 추가 없음. |
| 16 hall→record | 변경 없음 | hall은 여전히 그 장치 앞 E/역할/거리 조건이다. record는 기존부터 afterEvidence=hall 자동 전달이었으며, hall 전 원격 지급은 계속 불가하다. |
| 17 clear-works→brace | 주변 편대 처치 선행 제거 | 버팀목 위치의 E/담당 인물은 유지. 인양틀 defeat, 축 복구 위치,3턴 방어 유지. |
| 옛17 clear-lift→notes | 일반 전멸 선행만 제거 | evidence revision의 notes는 원래 afterEvidence=clear-lift 자동 전달이었다. 직전 실제 hold-hoist 완료와 원래 notes 위치 접근이 필요하다. E 클릭은 추가하지 않는다. evidence가 아닌 옛 interact notes는 기존 기록 위치 E를 계속 요구한다. |
| 20 clear-mouth→escort | 출발 조작 앞 일반 전멸 선행 제거 | 실제 생존 행렬 곁의 출발 조작·중간 지점까지 호송·4턴 방어 보존. |
| 20 clear-pass→escape | 보존 | 별도 마지막 매복 전투와 실제 행렬 탈출 목표다. E 안전 gate로 보아 일괄 삭제하지 않는다. |
| 14 clear-village / 독립 옛clear-road 등 | 보존 | 독립적인 전투/방어 마무리 조건을 이번 E 선행 조건과 구분한다. 서사 필수 승인이라고 주장하는 것은 아니다. |
| 26 investigation-record | 변경 없음 | hidden-latch가 열려도 hero가 실제 기록 위치 근처에 없으면 지급하지 않는다. 이 음성/양성 경계를 검사했다. |

기존 자동 전달 근거는 기준424c의 `evidence-quests.js` changes/satisfied에 명시된 afterEvidence와 done 조회다. 새 상호작용 클릭이나 원격 지급 기능을 만들지 않았다. `tests/interaction-clearance-steps.mjs`는 방 개방 전 기록 불가, 옛 clear 의존 해제 후 원래 기계 단계 유지,26장 실제 수거 거리, 독립 clear-pass 유지 및 저장 배열/처치 사실 미변경을 검사한다.

폐지한 clear 뒤 자동 증거에는 실제 증언/기록 위치의 동행 접근과 지정 인물 생존/필요 역할을 검사한다. 기존부터 hall 개방 뒤 자동 전달되던16장 record는 그대로이고,26장 현장 수거 거리도 그대로다. [별도 사용자 판단 후보](EXCEPTIONS_PENDING.md)는 주변 적이 아니라 특정 부착혼의 구조 기믹이다.
