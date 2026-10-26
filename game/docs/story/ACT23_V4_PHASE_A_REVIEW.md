# 2·3막 v4 Phase A 검증 기록

기준 소스는 `79a80b3084b3c5ace136c0911656c01196bfe62f`이며, 최종 후속 변경은13장 작업 발판 미술 태그/목재 지지대/타일 paint bounds,18장 받침 상면 외형,브라우저 검사와 이 기록이다. 충돌·기계 진행 계약은 후속 미술 수정으로 바꾸지 않았다. `ae32a56c`의 Stage5 revision6/기반암·역할 조우·배포 패키징과 문서 입력 `99016126`이 조상이다.

## 실제 화면 검토

공개 사이트가 아닌 별도 cloud worktree의 opt-in build를 system Chromium으로 열었다. 원시 증거는 현재 소비 환경 `/workspace/honro/_local/reports/act23-v4/`에만 있다. 다른 환경에서 이 경로의 존재를 보장하지 않는다. 재실행 코드는 `tools/testing/act23-v4-browser.py`에 보존했다. 생성 web 결과·스크린샷은 Git에 넣지 않았다.

| 검수 | 직접 확인한 증거와 결과 |
|---|---|
|1. 전체 구조|`browser/{11..30}-structure.png`20장: 기존 산길/공동/수로의 공간과 분기,필수 목표 위치를 검토했다. 원본 지형을 전면 재설계하지 않았다.|
|2. 일반거리·가독성|`browser/{11..30}-detail.png`20장: 인물·기구·목표 식별과 기존 공유 미술의 연결을 확인했다. 새13작업 발판이 회색 판으로 떠 보이는 문제를 발견해 기존 목재/지지대로 연결했다.|
|3. 모바일·상태 변화|`browser/{11..30}-mobile.png`20장과 아래 변경 상태:390×844와1280×800,다른 카메라/기믹 전후를 확인했다. 13지지대가 collider AABB 밖의 다음 타일에서 잘리는 문제를 발견해 실제 paint bounds로 수정하고 `13-inside-latch-work-shelves.png`를 다시 열어 바닥까지 연속됨을 확인했다.|
|최종 기계 종합|14홀림 경고,16물리 회복,17실제 작업자,18인양/재안착,27void DOM,29차폐/보스 보행/잔영,30선체/승객 이동을 검토했다.18은0/.45/.9초 실제 Canvas 프레임에서 한 종만 그려지고 인양은 위,재안착은 아래·오른쪽 경고와 일치했다. 작은 곡면 틈을 받침 상면 외형으로 보정 후 재확인했다. 새 미검수 본문은 빈 슬롯/기계 ID다.|

주요 상태 파일은 `14-hypnosis-warning.png`, `16-physical-recovery.png`, `17-shaft-workers.png`, `18-lift-0.png`, `18-lift-045.png`, `18-bell-lifted.png`, `18-reseat-0.png`, `18-reseat-045.png`, `18-bell-settled.png`, `27-void-empty-slots.png`, `29-cover-after.png`, `29-boss-advance.png`, `29-stake-gesture.png`, `30-ferry-crossing.png`, `30-ferry-landed.png`다. 이들은 선행 전투 사망/위치/일부 작업 조건을 명시적으로 공급한 상태 fixture이며 정상 캠페인 완주 증거가 아니다.

## 실제 입력과 저장 경계

| 항목 | 실행 결과와 범위 |
|---|---|
|16 증언|실제 E handler로 노승/제자 상호작용→원본 NPC 보행/회복 `16.safe` 완료→pending 슬롯→localStorage 저장·브라우저 reload·Continue→E acknowledgment 완료. 영웅 위치와 전투 사망은 fixture다. 구 브라우저 시나리오의 안전 보행 생략을 수정했으며 구 결과를 현재 순서의 근거로 쓰지 않는다.|
|17 운반자 사망|원본 root/Engine/App 검사에서 픽업→운반자 사망→동일 부품 소켓 복귀→저장·재개→다른 동행 재인수/맞물림. 별도 부품/보상/체크포인트 중복 없음. 이 전체 사망 시퀀스의 실제 DOM 수동 재현은 하지 않았다.|
|27 void|실제 DOM far/near 빈 두 슬롯 mount→Enter/Enter→RESOLVED/원래 위치·시계 복귀와 실제 witness. 별도로 FALLING 저장→reload/Continue→안전 READY→재진입/skip/복귀. JS page error0. 무형 존재의 본문은 넣지 않았다.|
|29 경계|원본 Engine의4/2/1영웅 finishAction/팀 전환·소환·저장 시나리오로 offered/ended 집합 확인. 조기 사망은 미입장 예비병 cancel terminal/stable_open,경고 뒤 사망은 안전 차폐 commit 유지. 실제 명령 부하 해소 뒤 보스 보행. Canvas 차폐·보행·진목 손짓도 별도 확인했다.|
|30 경계|원본 Engine의4/2/1영웅 finishAction/review/switchTeam·소환·저장 검사 통과. 다음 안전 aim에서 종료 증거를 소비한다. 예약 source 지연은 완료를 막고 모든 유한 source 종료가 필요하다. 곽진 실제 첫 이동/하선/회수/귀항/둘째 무리 합류와 각 상태 저장을 검사했다. Canvas 배 이동은 ready/dead-enemy fixture를 사용했다.|

11–30장은 실제 후보 build에서 모두 진입했다.14/16/17/18/29/30에서는 turn notice 이후 짧은 실제 ArrowRight 입력 이동도 확인했다.20/23 NPC 경로 검사는 원본 물리·예산·라운드로 실제 보행하되 지원 위치의 영웅 안내와 전투 사망을 공급한 fixture이며 NPC 외부 좌표 쓰기0이었다.19는6가지 분리 순서의 자동 후속 이동과 적0/증원0/역할 전환을 검사했다.

## 집중 검사

모두 성공 종료한 로그는 아래와 같다. 앞선 성공 후 영향 없는 전체 검사를 반복하지 않았다.

- `act2-final.txt`, `scenes-final.txt`, `stage18-final.txt`(14항목), `farewell-final.txt`, `convoy-pressure.txt`, `convoys-final.txt`.
- `city-final.txt`(15항목), `stage29-final.txt`, `stage30-final.txt`(19항목), `integration-final.txt`(12항목), `common.txt`.
- `growth-final.txt`(기존 성장12항목), `typecheck-final.txt`, 별도 후보 build 로그, `browser-final.txt`/`browser-states-final.txt`와 `browser/capture.json`/`state-capture.json`.
- 기본 build 실제 Chromium 스모크 `default-smoke.json`: 후보 flag=false,5revision6,18구 비살상/구revision0,30구revision1,후보 stamp 없음,page error0. 이 기본 build는79a80b30이며 후속 미술 태그는 후보에만 생성된다.

검사수·60뷰 자체를 품질 합격 근거로 삼지 않는다. 원본 공통 모듈과 실제 Engine/App/DOM을 사용한 범위를 명시했으며 초기 root mock은 수용 근거에서 제외했다.

## 남은 범위와 배포 상태

기계 Phase A의 집중 검사와 제한된 미술/입력 검토를 완료했다. 정상 난이도로20장 전투를 연속 완주하거나 전투 균형·사운드 실기기 청취·실기기 터치를 검수한 것은 아니다. 미검수 본문이 없어 원고와 플레이의 최종 결합 검수는 Phase B에서 해야 한다.12장 반복은 기존 길표/낮은 길의 실제 왕복이며 완전히 새 지형 루프가 아니다.18장 위협은 예고된80단위 근접 하강이며 압사 시뮬레이션은 아니다.29는 기존 군인/망령 공유 미술이며 새 전용 보스 에셋을 제작하지 않았다.

Gemini3단 검수는 부모 측 credential_state_unavailable 안전 차단으로0회다. 새 production catalogue 적용·master 병합·Pages 배포는 의도적으로 보류한다. Library ZIP의 바이트 전송은 지원 재시도까지 실패했으나 Git 문서10개와 원본53,466바이트/SHA256 확인으로 구현 입력은 확보했다. ZIP/MANIFEST 자체를 검증했다고 보고하지 않는다.
