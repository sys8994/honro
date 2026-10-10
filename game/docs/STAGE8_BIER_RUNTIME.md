# Stage8 빈 상여 재배치와 유한 증원

`shared/runtime/stage8-bier.js`는 저장 전투의 `honroStage===8`, `!honroCustom`, `honroStage8BierRevision===1`에서만 동작한다. 구 8장, 구 Workshop 지도, 다른 장은 기존 함수를 그대로 호출한다. Story 뒤에 등록하며 공통 물리·성장·목표·임무 소스를 바꾸지 않는다.

## 바뀌지 않는 진행

- 설오·담허·휘겸 3인, 실제 첫 입장 경지7/XP8644. 소단은 출전하지 않는다.
- 두 원래 결박 모두 파괴 + 원래 `boss` 사망 + 기존 `b.round` 기준 수습1라운드. 어느 결박부터 처리해도 된다.
- 결박이 남으면 기존 damage amount×0.20. 보스를 먼저 죽일 수 있고, 담허 단독 사망은 실패가 아니다.
- 중앙 재배치와 미실행 증원은 승리 조건이 아니다. 막힌 상여는 그 현재 자리에서 계속 제압할 수 있다.
- 홍만이 돌아온 귀신이라는 서사를 추가하지 않는다. 세 사건은 산개/까마귀만 생성한다.

## 새 지도 데이터

`honroStage8BierSpec.movement`:

- `destinations`: 순서대로 시험할 같은 중앙 마당의 `{id,x,y,support}`
- `routes`: 현재 상여 위치에서 합류를 시험할 `{id,points:[{x,y,support}]}`
- 현재 포즈→직접 목적지, 현재 포즈→저작 경로의 남은 구간을 실제 보행으로 시험한다. F의 초기 좌표로 되돌리지 않는다.

`honroStage8BierSpec.entries`:

- `stage8-first-seal`: 첫 결박 뒤 산개3, 보스 생존과 무관
- `stage8-settled-crows`: 살아 있는 상여의 실제 정착 뒤 까마귀3
- `stage8-low-health`: 살아 있는 보스가 처음 최대HP35% 이하일 때 동쪽 산개2
- 각 입구는 `{side,x,y,support,spacing,alternates}`. 공중 편대는 `air:true`와 실제 비행 발 좌표를 지정한다. 공중 입구에는 지지면이 필요하지 않다.
- 대체 입구는 같은 side만 인정한다. 모든 개체가 정확한 지정 위치에 들어갈 때만 일괄 추가한다. `maxDistance:0`, 다른 층 검색/부분 생성/강제 삭제 없음.
- 세 events의 `when.after`는 각각 `stage8-gate-first-seal`, `stage8-gate-settled-crows`, `stage8-gate-low-health`. 새 모듈만 실제 조건에 맞춰 대응 flag를 열고, 기존 Encounters가 대기/경계/로그를 처리한다.

## 상태와 행동 경계

`honroState.stage8Bier`는 `anchored → announced → blocked/moving → settled`와 사망/종료 시 `cancelled`를 저장한다. `completedOnce`는 이미 정착했으면 사망 후에도1이다. 예고 serial, 실제 새 행동을 제공받은 동행, 그 행동을 마친 serial, 파동별 경고/성공/취소, 생성ID, 실제 출발/마지막 유효 포즈와 경로를 함께 저장한다.

단순 serial 증가·적 경계·소환·선택 전환·예고를 일으킨 기존 review 완료는 플레이어의 새 행동 기회가 아니다. 살아 있는 비소환/비매혹 동행에게 `aim`에서 제공한 뒤 실제 `finishAction`이 끝난 경우만 인정한다. 조준 충전, 비행탄/연격, review, 소환/동맹 큐, 실제 낙하, modal/history/hidden 상태에는 이동을 시작하지 않는다.

## 보스 이동과 Story

- Story의 `app.stagingLastTime`, 저장된 `dialogue.staging.cursor/elapsed/results`가 유일한 시계/커서다. 독립 RAF나 전투시간은 없다.
- 실제 `Engine.walk(...,requireSupport=true)`를 4 이하 거리 구간으로 실행한다. Skip도 같은 구간을 빠르게 소비한다. 좌표를 목적지에 직접 대입하지 않는다.
- 상여의 r70/h150 전체 폭/머리/몸통을 실제 연결된 발 접촉면으로 자른 정확한 polygon으로 쓸어 검사한다. 발판 polygon 전체를 충돌에서 제외하지 않으므로 같은 polygon의 천장/벽도 막힌다.
- 살아 있는 동행·일반적·보스 외 배우·소환령, 진목, 투사체, 활성 field/zone와 부착형 영역을 모두 검사한다. 예고 뒤 생긴 점유도 매 이동 구간마다 확인한다.
- 이동 속도/이동 예산/속박/감속을 빌린 probe에서만 계산하고 실제 배우에는 보행 출력만 반영한다. HP·기력·행동 여부·일반 이동량·AI를 덮지 않는다.
- 중간 점유는 현재 유효 포즈에서 멈추고 입력 잠금을 풀어 다음 안전 경계까지 기다린다. 사망은 이동/종속 미생성 편대를 즉시 취소하며 회복·부활·무료 공격을 주지 않는다.

## 편성과 성장

후보판은 초기28(명시 정예5 포함)+보스1, 유한8, 최대37, 실제 적 행동4다. 동일옛예산 비교판은20+보스1/정예0/유한8/최대29다. 새8은 옛 일반복제와 파동×2를 건너뛰고 `honroEncounterRevision`을 추가하지 않는다.

일반 개체의 옛 1막HP0.6은 장별 튜닝에서 정확히 한 번 유지한다. 명시 정예는 기존1.25와 armor.12를 한 번 적용한다. 파동의 factory `index%11` 우연 정예는 제거한다. 난이도별 초기/편대 개체값은 같은 옛 factory+balance 경로와 대조한다. 보스 수치와 공격은 원래 그대로다. 유한8의 weight를 기존 events로 예약하며 전투XP1667/총4168/실패-retry 원장을 바꾸지 않는다.

새 지도만 옛 hauntHabitat 두 marker를 유한 입구로 교체하므로 수습 중 별도 무한 증원이 없다. 원래 불씨3개 효과/일회성 규칙과 구 저장 marker는 그대로다.

실제 경지7→8 전투XP479 지급 후, 법적으로 투자한 일반 능력치의 critChance/critMultiplier가 Continue에서 초기화되는 기존 문제를 재현했다. 새8의 기존 성장원장이 있는 저장에 한해 유한한 두 필드를 보존한다. 새 전투/누락 필드/구8은 이전 initializer를 그대로 쓴다. 다른 성장 계산은 변경하지 않는다.

## 검사 구분

- `tests/stage8-bier-runtime.mjs`: 실제 App/Engine/Story + 명시된 격리 지형/점유/HP fixture. 새 행동, 전신 쓸림, Skip, 사망, 정확한 전체 저장, 실제 전투XP 레벨업을 검사한다.
- `tests/stage8-bier-runtime-budget.mjs`: 5난이도 옛 개체값, 초기29 생존 상태의 유한8 진입/37상한, 우연정예, 기존 피해/수습과 habitat 제외를 검사한다.
- 이 상태/피해 검사는 정상 입력 완주·실제 화면·브라우저 검수를 대신하지 않는다. 전체 지형 왕복·실탄·기본기 완주·배포 검수는 별도 보고한다.
