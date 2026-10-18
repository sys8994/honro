# 첫 타이틀 표시와 초기화 비용 — 2026-10-18

기준 master는 `a25675f`다. 묵종/후경 미배포 브랜치는 포함하지 않는다. 이번 변경은 기존 타이틀을 전체 게임 초기화와 분리하고 데이터 복원 비용을 낮춘다. 이 절은 첫 단계의 기록이며, 아래 두 번째 단계에서 선택 장 우선 준비를 추가했다.

## 원인과 변경

기존 HTML의 app은 비어 있었고13개 stylesheet와138개 순차 import, 캠페인 전체 로딩 후 App 생성자에서 타이틀을 만들었다. 6,361,595바이트 library를 포함한 프로젝트 JSON은8,924,596바이트였다. hydrate는 primitive까지 async recursion/Promise.all/Object.fromEntries로 복제했다. 4배 CPU 조건에서 library 복원의 최초 동기 구간만 약508/600ms, 완료까지 약792/941ms였다. 타이틀 이미지는 App 생성 뒤에야 요청했다.

- `shared/runtime/title-markup.js`의 한 템플릿을 빌드 시 HTML과 profile-aware showTitle이 공유한다. 배경·한자/한글 로고·태그라인·시작 영역을 HTML에서 먼저 표시한다. 타이틀 필수 스타일만 인라인하고 게임 CSS는 첫 그림이 표시된 뒤 로드한다. 준비 전 버튼은 `준비 중`이며 게임 실행을 예약하지 않는다. 완료 시 기존 이미지 DOM을 보존하고 실제 프로필에 맞는 버튼만 인계한다. 저장의 선행 parse/migration은 추가하지 않는다. 오류 시 그림을 유지하고 `다시 시도`로 새로고침한다.
- `index.html`도 같은 생성 HTML이다. 기존 JS redirect를 제거해 루트 진입에서 문서를 다시 받지 않는다. 두 공개 HTML과 index는 빌드 생성물이다.
- 타이틀 알파 원본은 보존하고 한자1200px/한글660px의 lossless WebP를 외부 해시 자산으로 만든다. 합1,258,053→348,532바이트다. 배경/로고 이미지 우선순위를 높이고 초기 게임 modulepreload는 다음12개 범위로 제한한다. story portrait/stage intro의 URL 메타는 유지하며 이것만으로 이미지를 내려받지는 않는다. Stage21 이미지는 실제 표시할 때만 요청한다. 미술 형태는 바꾸지 않는다.
- 빌드가 `$honroAsset` 위치 목록을 기록한다. loader는 실제 참조 위치만 URL로 바꾸고 SVG 원문 I/O만 기다린다. 참조 없는 library/chapter는 원소별 Promise나 전체 트리 재복제/탐색이 없다. 구 형식에는 동기 in-place traversal fallback을 제공한다. `HONRO_SVG_SOURCES`와 asset URL 계약은 유지한다.
- 큰 JSON은 ArrayBuffer를 worker로 넘겨 UTF-8 decode/parse하고, 큰 배열은16항목 단위로 회수한다. worker 미지원/실패 시 기존 main-thread JSON parse로 복구한다. 완료 후 worker/Blob URL/임시 버퍼를 해제한다. 서버 압축을 가정하거나 gzip를 직접 디코딩하지 않는다.
- import와 프로젝트 author 사이에12ms 경과 budget으로 paint/input 기회를 준다. 각 모듈마다 고정 timeout을 넣지 않는다. 프로젝트 author 순서는 기존과 동일하다. library만 먼저 받아 독립 모듈 로딩과 겹치고, 전체 chapter 요청으로 초기 작은 메타 요청을 밀어내지 않는다.

## 같은 조건의 cold-load 비교

로컬 Chromium, 각 측정마다 새 context/cache disabled, DPR1, CPU slowdown4, RTT40ms, download2MiB/s. Desktop1440×960/모바일 viewport390×844를 각각 한 번 비교했다. 실제 휴대폰 실측이나 공개 Pages 속도 측정이 아니다. `title paint`는 배경과 로고가 decode된 다음 프레임, app ready는 App 생성 완료다. 요청/바이트는 ready와 title paint 확인 뒤500ms까지다.

| 항목 | Desktop 이전 → 이후 | 모바일 viewport 이전 → 이후 |
|---|---:|---:|
| 배경·로고 포함 타이틀 표시 |13.368s →0.517s|12.919s →0.493s|
| App ready |12.251s →9.236s|11.593s →9.678s|
| 긴 작업 총시간(50ms 이상) |3578ms →1129ms|2951ms →1206ms|
| 가장 긴 작업 |1070ms →484ms|1354ms →739ms|
| 요청 수 |228 →225|228 →225|
| 전송 바이트 |15,510,927 →13,823,525|15,503,065 →13,815,663|

단일 실행이므로 작은 차이의 통계적 우위를 주장하지 않는다. 모든 게임 데이터와 실행 모듈은 여전히 ready 전에 로드한다. 남은 주요 비용은6.36MB library 등 초기 전송과 큰 객체/author 작업이며, project-data-ready 이후 author 합은 약220/273ms였다. 초기화 중0.5–0.7초대 긴 작업도 남는다. 이번 단계는 몇 초의 빈 화면을 없애고 임시 Promise/복사 비용을 줄였으며, 완전한 무정지 초기화나 즉시 플레이를 주장하지 않는다. 이후에는 측정에 따라 큰 library의 표현/전송 단위와 비필수 런타임 초기화를 분리할 수 있다.

## 한정 확인

`tools/testing/startup-browser.py` 하나를 before/after/checks/mobile 모드로 사용한다. Game/Workshop 빌드, desktop와 portrait 실제 화면, 조기 클릭 중복/자동 실행 없음, 배경·로고 DOM 동일 인계, 새 시작·정확한 계속 버튼·성장/장착/완료 보존·디버그 분리, trusted click의 audio wake/context running, embedded Playtest/복귀·프로젝트 보존, 실패 시 그림 유지/재시도 성공을 확인했다. 4배 CPU의 시작 클릭→화면 상태 확인은 Playwright 대기 포함 약1.13초였으며 데이터 로딩을 클릭 후로 미루지 않는다. 전체 verify·기예/맵 전수 검사는 실행하지 않는다.

캠페인 base/library/30개 chapter의 콘텐츠 해시 경로는 기준 master와 동일하다. 렌더/미술 WIP의 코드나 자산을 가져오지 않았고 이전 두 distinct 배포 세대의 immutable 자산을 보존했다. 증거 JSON과 내부 비교 화면은 `_local/reports/startup/`에 있다. 공개 Pages 직접 접근이 CONNECT403이면 로컬 결과와 배포 run 성공을 구분해 보고한다.


## 두 번째 단계: 선택 장과 의존 에셋 우선 준비

기준 master `2d678f6`의 승인 1–3장 미술과 공통 모듈 목록을 보존했다. 엔진·미술을 교체하지 않고 Game의 캠페인 준비 단위만 나눴다.

- 빌드는 장의 모든 필드(요소·environment placement 포함)에서 library ID를 찾고, 참조 에셋 안의 ID까지 재귀로 닫는다. 두 장 이상 사용하는 에셋은 공통133,295바이트, 나머지는 장별 한 묶음이다. 1장은 별도2,085바이트와 chapter51,267바이트다. 사용하지 않는 전체 library6,361,595바이트는 Game의 초기 요청에 없다. compiler가 재사용하는 boss 원형은 작은 공통 메타로 보존한다. Workshop/embedded는 기존 전체 프로젝트 경로를 쓴다.
- 전체30장 이름·ID·크기·연결/열림 정보는 catalog와 기존 `H.stages`/journey 메타에 남는다. pending catalog는 실제 stage로 취급하지 않는다. loader는 실제 장 하나와 완전한 의존 library만 기존6개 author에 기존 순서로 전달한다. compiler도 pending 입력을 거부한다. 전체 프로젝트를 받은 뒤 filter하는 방식이 아니다.
- 초기 저장 읽기는 game/schema/기본 roster를 확인하는 읽기 전용 힌트다. 유효한 전투의 honroStage, 지형 재입장 장, 다음 미완료 장을 고르고 lastStage만 신뢰하지 않는다. 기존 App.load·growth/skill migration·map revision·저장 경로는 하나로 유지한다. 최종 profile 목적지가 힌트와 다르면 그 장을 준비한 뒤에만 기존 타이틀 버튼을 켠다. 배경·로고·태그라인은 기존 첫 표시를 유지하고 준비 안내는 실제 완료 모듈/데이터 묶음 수로 표시한다. 준비 완료 뒤 자동 실행하지 않는다.
- launch/continue/retry/결과 다음/여정첩 진입은 동기 API를 유지한다. 필요한 장이 없으면 현재 화면·전투·저장 변경 전에 준비하고, 한 요청으로 합친 뒤 한 번 재진입한다. profile/화면 소유권과 pending token을 확인하고 화면 이동·모달 열기/닫기 시 취소한다. 늦은 요청이 새 화면을 덮지 않는다. 실패는 현재 화면에서 다시 시도/취소할 수 있고 실패 fetch를 cache에서 제거한다. 이어하기는 기존 전투 snapshot을 계속 사용한다.
- ready 이후 다음 한 장의 JSON 두 묶음만 idle/low priority로 순서대로 예열한다. 이때 author/compile은 하지 않는다. 숨김·절약 모드·2G·전투 화면에서는 시작하지 않으며 나머지는 필요할 때 준비한다. 모든 장을 백그라운드에서 몰아 받지 않는다. 기존 worker parse·16항목 회수·시간 budget yield·외부 해시와 이전 두 distinct 배포 세대 보존은 유지한다.

### 한정 실측과 기능 확인

앞 절과 같은 로컬 Chromium/new context/cache disabled/CPU4배/RTT40ms/2MiB/s 조건에서 각각 한 번 비교했다. 실제 모바일 기기나 공개 Pages 실측이 아니다. 총 요청/전송은 ready+500ms 관측 창이며, 이후 값에는 다음 장 idle 예열이 일부 포함될 수 있다.

| 항목 | Desktop 이전 → 이후 | 모바일 viewport 이전 → 이후 |
|---|---:|---:|
| 실제 시작 준비 |9.339s →5.046s|9.239s →4.416s|
| 타이틀 그림 표시 |0.480s →0.480s|0.441s →0.393s|
| 관측 창 전송 |13,871,120 →5,219,026B|13,863,258 →5,211,164B|
| 요청 수 |228 →203|228 →203|
| 긴 작업 합/최대 |1248/609 →327/111ms|922/480 →128/68ms|
| ready 전 chapter 요청 |30 →1|30 →1|

이후 ready 전 완료 resource body는 desktop5,091,692B/모바일5,083,830B였다. 두 경우 모두 chapter01 하나만 요청하고 전체 campaign-library 요청은 없었다. 초기화가 완전 무정지라는 뜻은 아니며 공통 런타임·캐릭터·서사/구 저장 호환 데이터는 여전히 공통 준비에 포함된다.

`tools/testing/startup-browser.py` 하나를 재사용했다. fresh는 실제 stage1만 준비·library38개/catalog30개, 21장 저장은 잘못된 lastStage1을 무시하고 실제21장만 준비한 뒤 HP/round/성장/장착/완료를 보존했다. 준비 실패→동일 전투/저장 유지→재시도12장, 취소된21장 요청의 늦은 완료가 타이틀을 덮지 않음, 이동/재시도, 실제 여정첩 확인 진입/직결 다음 장, 기존 동기 반환, full editor/embedded, Game/Workshop의 실제1·21장 author 결과 일치를 확인했다. 초기 타이틀 DOM 인계·조기 클릭 자동 실행 없음·trusted click audio·debug 분리·초기 오류 재시도도 통과했다. 전체 verify·30장 실행·무관한 기예 검사는 하지 않았다. 증거는 `_local/reports/startup/phase2-before.json`, `phase2-after.json`, `stage-checks.json`, `entry-checks.json`, `checks.json`이다.
