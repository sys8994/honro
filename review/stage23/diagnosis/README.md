# 23장 R40 미완주 집중 진단 (2026-10-16)

기준 `d292248e15b44b9f0cf467da7993bb0cfad39003`, 별도 `integration/stage23-diagnosis` 작업 트리. 이 수정은 테스트 제어기/이동 그래프만 바꾼다. 게임·적 AI/편성·맵·HP·재고·위치·목표·회복/대화/VFX·두 HTML은 변경하지 않았다. 전체 캠페인과40라운드 전투는 재실행하지 않았다.

## 서로 다른 보존 자료

- 기존 `../normal-input-summary.json`: R40,160행동 상한, phase flight, NPC x3251/HP56, 초기40/정예10/잔여33.
- 기존 `../normal-input-observation.json`: 원본행동136개, 라운드18개로 **R18까지만** 있다. R17 휘겸 maxHP1549인데 요약은1605다. HP 상한 차이는 그 사이 정상 성장일 수도 있어 서로 다른 시작 프로필이라고 단정하지 않는다. 다만 R18 행동 원본으로 R40 끝 상태의 원인을 직접 검증할 수 없다. 다른 executor의 R40 checkpoint는 전달되지 않았다.
- R18의 실제 역할 기록은 지원 둘이 y3650,x4249/4443에 남고 NPC가 아래 x3051,y4925에 멈춘다. 기존 복귀 정책이 NPC x3650/4550 도착을 기다리므로 지원 위치를 스스로 바꾸지 않는 순환 조건이 존재한다. 이 관측은 R40 전체 원인 단정이나 게임 진행 불가능의 증거가 아니다.

## 현재 기준의 제한 재현

기존 v3 제어기로 새 입장부터32행동, 최대8라운드를 **한 번** 실행했다. `bounded-summary.json`, `result.json.gz`, `trace.json.gz`, `checkpoint.json.gz`가 그 결과다. R8 phase review에서 관찰 상한으로 종료했다. 승리·패배가 아니며 두 선행목표 완료/네 동행 생존/외부 전투상태 쓰기0/복구 호출0/재고 그대로다. 실제 wallSeconds140.6, 탄도 탐색98.8초였다.

현재 원본에서는 고지 전투 이전에 두 지원자가 x1420–1434에 갇혔다. 실제 발 지지면은 `sy-roof-west-wing`인데 테스트 그래프는 `honroSpaceSurfaceId`가 있는 지형만 수집해 새 단방향 지붕을 누락했다. `sy-west-upper` 경유점의 지지면을 고집하며 정상 이동 예산을 소모했다. 이것은 현재 정상 발판 물리를 모델링하지 못한 테스트 자동화 결함이다.

## 최소 보완과 증거 경계

- 테스트 navigator에 현재 단방향 지붕 노드를 넣고 실제 contactSurface와 일치하는 노드만 선택한다. 이동 중 다른 지붕에 착지하면 그 실패한 경유선을 제외하고 실제 지지면에서 같은 이동 예산으로 재계획한다. 소스/런타임의 접지·점프·속도·행동 예산은 그대로다.
- 제어기의 고지 지원은 NPC가 세 번의 서로 다른 관찰 턴에80px 미만 이동하고600px 이상 아래에 있으면 기존 복귀 경로를 선택한다. 서측은 기존 문서의 stored D-E 자동점프 미검증 구간을 피하는 `west-upper-return`, 동측은 `F-E-return`이다. 이후 하부 동행 지원으로 전환한다. `../support-policy.json`은 원R18 trace를 **읽기 전용으로 정책 상태에 재생**한 결과로, 실제 전투 재실행이 아니다. 전진 중/같은 층/동일 라운드 중복은 복귀를 강제하지 않는다.
- `stage23-support-return-input.mjs`는 이번R8의 실제 App export를 Continue해 전체 battle snapshot이 정확히 같은지 확인한 후, 담허의 지붕 통과→서측 고지→서쪽 바닥 복귀에 정상 select/move/jump/defend 입력만 준다. 다른 배우를 제거하거나 AI/승패를 끄지 않는다. 방어 회복은 실제 App.defend 결과다. 이는 길의 사용 가능성 검사이며 개선 정책의 전장 승리/호송인의 안전한 완주 증거는 아니다.
- 이전 navigator의 `../support-return-before.json`은 같은 저장/입력에서 x1410–1432에 멈춘 실패를 그대로 보존한다. 개선 후 결과는 `../support-return-input.json`에 별도 기록한다.

재현: `node tests/stage23-support-policy-test.mjs`; `node tests/stage23-support-return-input.mjs review/stage23/diagnosis/checkpoint.json.gz`.

남은 한계: R40의 원본 snapshot 부재, v4 전체 정상 전투/호송 완주 미실행, 동측 복귀의 이번 실입력 미검사, 기존 stored D-E 자동점프의 한계는 남는다. 미완주를 승리로 바꾸거나 공중 적 일반 AI/재배치 작업으로 범위를 넓히지 않았다.

최종 좁은 입력 결과: 같은R8 snapshot, 외부쓰기0/복구0/재고동일. 기존 내비는32입력 뒤 x1410–1432 정체. 수정 내비는32입력 안에 R10 고지 x4320/y3650 도착, R15 서쪽바닥 x1105/y4278 복귀를 실제 수행했다. 네 동행과 NPC(HP1068)가 살아 있다. 두 HTML SHA256은 기준과 동일하며 UI/성능/공개Pages 검사는 하지 않았다. 이 왕복 성공은 전체23장 완료가 아니다.

추가 기존 `stage23-escort-route-seam.mjs`는 navigator를 생성하기 전 원본 옛 snapshot의 전체 Continue 동일성 assertion에서 멈췄다. `spBalanceRevision`, 공격/방어/치명/기력 등 현재 수치 이관과 옛 fixture 차이다. 해당 런타임/fixture/검사를 수정하거나 통과 처리하지 않았다. 이번 동일R8 snapshot Continue 검사는 정확히 통과했다.
