# 14장 몸체 예약에 의한 턴 정지

현재 실제 플레이의 변경하지 않은 7턴 저장에서 길찬이 다른 생존자의 점유 영역에 막혔다. 속도는 0이지만 jumping이 남아 모든 이후 턴을 막았고, Continue 후 1200 프레임에도 같은 위치였다.

몸체 예약에 실제로 걸려 하강 운동이 정지한 경우만 공중 운동 상태를 종료한다. 지면 접촉으로 위장하지 않는다(grounded는 false). 좌표는 기존 swept collision 정지점, 체력/이동 예산/fixed/낙하 정점은 보존한다. 다른 몸체가 비키면 원래 Engine 중력과 지면 착지가 재개된다. 전역 settleBusy 우회, NPC 고정, 강제 도착/성공은 사용하지 않는다. 상승·장비 이동·아래점프 준비는 이 처리에서 제외한다.

검증: 실제 저장 Continue → 1596 정상 프레임 뒤 플레이어 입력 복귀 → 세 동료의 정상 좌측 이동으로 공간 확보 → 길찬의 실제 중력/보행으로 지면 도착. 게임 상태 직접 좌표/HP/성공 대입 없음. 기존 11–16장 장면·몸체 예약/이동비용 단위계약 통과. 이는 DOM 대역의 App/Engine 회귀이며 브라우저/전체 클리어 검수는 별도다.

## Retained interaction regressions (17/18)

Stage17's destroyed hoist retains its frame and attached spirit by authored design. The ordinary target lookup rejected dead units before the existing separation eligibility could run. The stage-scoped resolver now exposes only the canonical retained hoist marker while its spirit is still attached; normal class, distance, threat and story checks remain unchanged. It does not resurrect, move or heal the frame.

Stage18's bell boundary rejected every retained `b.cast`, including completed/refunded shots. Normal campaign shots retain this bookkeeping record. The boundary now relies on the existing physical safeBoundary checks (projectiles, motion and turn boundary) and still excludes the keeper ritual's active cast. No cast records are erased.

`node tests/act2-retained-interaction-regression.mjs` resumes immutable natural saves, uses normal select/interaction for17 and normal defend/ticks for18, and proves the hoist separates without pose/HP changes and the bell completes the lift. Existing reviewed17 and stage18 scene suites also pass. These are App/DOM-double regressions, not browser or full-stage acceptance. Baseline gameplay statistics must not be overwritten by candidate results.
