# 수직 개편 회귀 경계

## 실행 묶음

수직14 개편의 빠른 계약과 비용이 큰 물리 경로·전술·정상 플레이·렌더링 증거를 분리한다. 빠른 계약의 통과는 전체 `npm run verify`, 정상 캠페인 완료, 미술 승인 또는 Pages 직접 검수를 뜻하지 않는다.

- `npm run test:vertical-regression-wiring`: 아래 계약 목록과 integration/offline 연결, 기존 전체 density 검사 보존을 정적으로 확인한다.
- `npm run test:stage14-vertical:contracts`: composition, runtime, app-resume, bridge, defense-guidance, legacy-save. 초기5난이도 전신/정지, opt-in/원자증원/저장, 실제 닫힌 걸쇠→E→개방 및 짧은 다리 통과, 안내 상태, 더 오래된 R8 저장을 포함한다.
- `npm run test:encounter-density:contracts`: 아래7개 기존 파일을 무수정 실행한다.
- 기존 `npm run test:stage14-vertical`의7개 검사 및 `npm run test:encounter-density`의19개 검사는 보존한다.

전용 계약 두 묶음과 wiring 검사는 `test:integration` 앞부분 및 `tools/verify-offline.mjs`의 명시 checks에 연결한다. 알려진 기존 cavern 역사 실패보다 먼저 실행되지만, 이후 검사까지 통과한 것으로 간주하지 않는다.

### 가벼운 density 계약

1. `tests/encounter-density-runtime.mjs`: opt-in, 혼합대 원자진입, 실제 완료행동 기회, 재개 큐, 종결 취소, 행동 공정성
2. `tests/stage8-encounter-density.mjs`: 정본 저작/전신/960 physics step 안정성과 유한진입
3. `tests/stage11-encounter-density.mjs`: 정본 저작/전신/960 physics step 안정성
4. `tests/stage12-encounter-density.mjs`: 정본 저작/전신/960 physics step 안정성
5. `tests/stage8-density-regional-entry.mjs`: 영역별 예고 선택 고정, Continue, 실제 wait, 점유 원자성 및 취소
6. `tests/stage161718-response-lifecycle.mjs`: 기존/추가 파동 예고, 완료행동, 원자점유, export/Continue, 재개1회 및 종결
7. `tests/stage8-density-ember-recovery.mjs`: 보존된 R30 저장, 짧은 실제 tick, 원래 규칙 대조, 자원1회 회복, 구형/타장 경계

이는 무조건 일정 시간 이내라는 성능 보장이 아니다. 정상 AI 전투·탄도 탐색·대형 렌더를 제외한 계약 집합이다. fixture·helper가 없는 부분 snapshot에서는 해당 경로를 실제 입력으로 보충해야 하며, 누락을 통과로 처리하지 않는다.

## 반드시 별도로 남기는 증거

- `test:stage14-vertical:traversal`: 68개 기본 경로 및 제한된 이동/점프 자원
- `test:stage14-vertical:tactics`: 대표 기예의 실제 전술 효과
- `test:stage14-vertical:fullplay`: 실제 정상자원 전투 및 다음15 진입/Continue. 기본기 비교는 `HONRO_FULLPLAY_BASIC_ONLY=1`로 별도 출력 경로를 지정한다.
- `test:stage14-vertical:native` 또는 기존 `capture:stage14-vertical`: 순차 Native 미술 캡처. 실제 Game/Stage View/Playtest와 브라우저 성능은 별도 검수한다.
- density의 `stage161718-encounter-density`와 `stage2330-encounter-density`는 정본·진입·저장 계약과 고정조준 실제 전술발사가 한 파일에 결합되어 있다. 빠른7개에 포함되지 않았으므로 특히23/30의 개별 계약/전술 증거를 생략할 수 없다.
- `stage8-density-boss-role`, `stage8-density-response-pressure`, `stage11-density-response-pressure`, `stage11-density-echo-lifecycle`, `stage161718-response-pressure`, `stage2330-density-response-pressure`, `stage8-bier-seam-regression`도 전체 density 검사의 필수 별도 범위다. 실제 AI 행동/빙의/피해창 또는 기록된 저장의 실제 이동을 포함한다.
- `encounter-density-integration`, `encounter-density-history-audit`, `stage11-density-real-save-continuation`의 기존 역사 계약은 유지한다. 새 delta가 승인되었다는 이유로 원래 golden/SHA를 현행값으로 교체하지 않는다.

## 새14와 두 종류의 옛14

`tests/act2-defense-contract.mjs`의 원래 round-only 방어 assertions는 `tests/fixtures/vertical-stages/before-stages.json`의14장만 임시 대입하여 실행한다. 다른29장은 건드리지 않고 try/finally로 현재 project 참조를 복원한다. 새 vertical revision/state 없음, 초기27체, population cap40을 확인한다. 경합 중0턴, 유한12증원,6완전방어턴과 주민 사망 실패의 기존 assertion 본문은 보존한다.

fresh14는 예고를 본 실제 player wait/review 완료 이후에만 파동을 허용한다. 따라서 단순 `round++`로 fresh14에 구형 방어 검사를 통과시키면 안 된다. 새 runtime/App/guidance 검사가 완료행동·막힘·재개·6턴/12증원·중복XP 방지를 담당한다.

더 오래된 `tests/fixtures/act2-spatial-legacy-save.json`은 revision2, R8,8600×7600, 방어 progress2/spawned4, heal1의 별도 저장이다. 원래 `act2-spatial-contracts.mjs`와 fixture를 그대로 보존하며, `stage14-vertical-legacy-save.mjs`가 원래 보존 필드/반복 attachment assertion을 독립 실행한다. 과거 whole-project gate에서 먼저 실패해 이 저장 검사가 미실행되는 경우를 방지한다. 이 검사는 Engine/attachment 경계이며 파일 import/Continue의 증거는 전용 App suite와 구별한다.

## 역사 고정값과 행동 결함 구분

현재14 canonical·21개 새14 에셋·새 runtime module은 기존 전체 project/library/source-membership 고정값과 다르다. Stage11 실제 도착저장 검사는 전체 non-project bundle bytes를 고정하므로, 그 장의 지도와 App 구현이 동일해도 새14 module 하나만 추가하면 실제 Continue 전에 중단된다. 이 실패는 숨기지 않는다. 새로운 범위가 정확히 승인된 경우에만 별도 delta의 전후 해시·변경 파일·부정변이 검사를 추가하고, 기존 역사 입력과 assertion을 보존한다. 현행 저장/행동 재실행은 그와 별도의 증거다.

28장 보존은14·22를 함께 수정한 최종 canonical을 기준으로 확인한다.14만 반영된 중간 tree에서는 다른29장 exact 비교가 가능하지만, 그 결과를 새22 검증으로 확대하지 않는다.

## aggregate 실행 주의

`npm run verify`는 `&&`로 연결되어 먼저 실패하면 뒤는 미실행이다. 실패/미실행을 구분해 기록한다. 알려진 이전 village-cavern/floor-main 실패도 최신 새14 행동 결함과 구분하되, 삭제하거나 조용히 건너뛰지 않는다.

`verify:offline`은 현재 이름/summary와 달리 전이 browser 호출이 남아 있다. `test:act3`→`test:act3:refinement`→`act3-refinement-browser.py`, `test:rest-journey`→`test:journey-gestures`→`journey-gestures-browser.py`를 포함한다. 이 문서의 두 contracts 명령은 명시적 Node-only지만 전체 offline aggregate까지 순수 Node라고 주장하지 않는다. 성능 검수와 겹쳐 실행하지 않는다.

## 이번 연결 변경의 검증

2026-10-10, 부분 snapshot에서 아래15개 Node 파일을 각각 순차 실행하여 모두 통과했다. 명령은 각 행에 `node tests/<파일>.mjs`다. 이 결과는 npm 전체 aggregate를 실행한 결과가 아니다.

| 파일 | 최종 wall time(초) | 결과 |
|---|---:|---|
| vertical-regression-wiring | 0.064 | PASS |
| act2-defense-contract | 2.422 | PASS |
| stage14-vertical-legacy-save | 1.722 | PASS |
| stage14-vertical-composition | 6.783 | PASS |
| stage14-vertical-runtime | 23.418 | PASS |
| stage14-vertical-app-resume | 8.085 | PASS |
| stage14-vertical-bridge | 9.593 | PASS |
| stage14-vertical-defense-guidance | 3.874 | PASS |
| encounter-density-runtime | 7.684 | PASS |
| stage8-encounter-density | 8.235 | PASS |
| stage11-encounter-density | 4.375 | PASS |
| stage12-encounter-density | 2.673 | PASS |
| stage8-density-regional-entry | 14.251 | PASS |
| stage161718-response-lifecycle | 29.446 | PASS |
| stage8-density-ember-recovery | 5.027 | PASS |

최신 성공 실행 합계127.652초. 누락된 기존 입력 때문에 검사 시작 전 실패한3회(2.299초)를 포함한 전체 기록은129.951초다. stage12의 보존된 before-stage12 fixture 및16/17/18 검사 import의 기존 저작module/layout을 완전 clone에서 바이트 그대로 보충한 뒤 재실행했다. 해당 입력 경로·SHA와 모든 성공/실패 로그는 검증 패킷에 보존한다. assertion이나 fixture값을 완화하여 재시도하지 않았다.

기존 전체 density19·전체14의7개·기존 native 명령이 변경되지 않았고, old14 방어 assertion 본문이 바이트 동일함을 별도 확인했다. 변경된 JS의 syntax와 wiring도 확인했다.

전체 verify/offline, 브라우저, 대형 렌더, 정상전투는 이번 연결 변경에서 재실행하지 않았다. 생성 HTML과 canonical은 편집하지 않았다.23/30 및 나머지 별도 전술·역사검사, 최종14/22의 다른28장 검증과 배포 증거는 위 범위에 합산하지 않는다.

## 최종14/22의 최소 현재 경계

전체 동결 SHA는 해당 역사 시점의 증거로 보존한다. 이번 변경에서 inverse/helper 프레임워크를 새로 만들거나 과거 golden을 갱신하지 않는다. 미통과 전체 aggregate는 계속 별도 상태로 남긴다.

최종14/22 확정 뒤 필요한 현재 검사는 다음으로 제한한다.

- 14/22의 명시 변경 파일·revision·정본/asset ID와 실제 소스 해시를 기록한다. 신뢰한 이전 commit과 대조해 다른28장, 기존 asset의 값/순서, 허용외 runtime/authoring 파일이 그대로임을 확인한다.
- 현재 경계의 부정변이는 다른28장의 단1byte 변경, 기존asset 값/누락/순서 변경, 미승인14/22 목표·성장·수치·revision 변경 및 허용외 runtime 추가/삭제/변경을 거부하는 최소 범위로 둔다. 기존 전체역사 SHA를 통과시키기 위한 역투영 확대는 보류한다.
- 기존8장 행동/큐/원자증원 검사는 명시된 contracts와 별도 필수 전술 파일로, 구형14 및 오래된R8저장은 현행 runtime의 독립 저장 검사로 확인한다. 역사 SHA 불일치와 실제 행동 실패를 섞지 않는다.
- 기존 직접 raw gate인 encounter-density-integration/history-audit 및 stage11-density-real-save-continuation은 그대로 남긴다. 실행 전 역사값 차이로 중단하면 미통과로 표시하고 현행 행동 결과를 별도로 기록한다. 저장된source 실행을 새로 도입하지 않는다.
