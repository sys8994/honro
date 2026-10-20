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


## 세 번째 단계: 실행 순서를 보존한 요청 묶음 (2026-10-19)

기준 master0c2181a의 코드와 목적 장 우선 JSON 로딩을 유지한다.159개 순차 import를33개로 줄였다. 동기 코드만 연속된 원래 순서로15묶음에 넣고, 각 소스는 strict arrow scope로 격리하며 기존 yield 경계도 남긴다.192KiB를 넘기기 전 묶음을 나누되 원래 약967KB 엔진 한 파일은 쪼개지 않는다. await 데이터 모듈은 별도 완료 경계이고, title-markup과 Workshop stage-rules의 독립 진입도 유지한다. Promise.all로 패치 실행 순서를 바꾸거나 eval을 추가하지 않는다. 준비 라벨은 첫 화면·장소 자료·게임 규칙과 풍경·동행과 조작 단계로 표시한다. 실제 HONRO_APP_READY 후에만 버튼이 준비된다.

로컬 HTTP·새 isolated context·캐시 disabled·Chromium CPU4배·latency40ms·download2MiB/s, 기존 startup-browser.py로 전후 각1회 비교했다. 요청/전송량은 App ready 및 타이틀 확인 후500ms까지의 동일 창이다.

| 항목 | Desktop 이전 → 이후 | 모바일390×844 viewport 이전 → 이후 |
|---|---:|---:|
| App 준비 |4.303s →3.622s|4.238s →3.579s|
| 전체 요청 |219 →93|219 →93|
| JS 요청 |162 →36|162 →36|
| 전송 바이트 |5,281,065 →5,256,665|5,273,203 →5,248,803|
| JS 본문 바이트 |2,830,231 →2,830,316|2,830,231 →2,830,316|

약126개 요청·24,400전송 바이트·준비시간 약16% 감소는 요청/직렬 대기 축소다. 코드 본문은85바이트 증가했다. 전체 코드 제거·압축이나 '필요한 코드만 로딩'을 달성한 것이 아니다.2·3막 패치, 이후 장 미술, 기예 미리보기와 여정 코드가 여전히 초기 준비에 포함된다. 이들은 전역 등록/이전 패치 참조가 있어 이번에 무리하게 지연하지 않았다. JSON의 목적 장 base/shared/stageLibrary/stage와 다음 장 idle 준비, 저장 목적지 선택은 바꾸지 않았다. 실기 휴대폰·통계적 성능 우위·무관 기예/전투·전 장 확인은 범위 밖이다. 비교 원본은 _local/reports/startup/baseline-zoom-startup.json 및 grouped-zoom-startup.json에 있다.

확인은 ordered-runtime-groups.mjs의 패치/consumer 순서·격리·yield/async 거부, ordered-startup-browser.py의 새1장/저장21장·HP/3라운드·성장/장착/완료 보존과 공통 편집기/embedded 초기화, quiet-layered-zoom-browser.py의 실제pinch3프레임·가로pan/조준으로 한정했다. Workshop Playtest의 전투 시작은 baseline master에도 있는 프로젝트검증23개 오류로 차단된다. 기준/수정본 오류가 정확히 같은 것을 별도로 비교했고 이를 성공으로 기록하지 않는다. 이 범위 밖 맵 검증 수리는 하지 않았다. _local/reports/zoom-startup/에 결과가 있다.


## 선택 기능 런타임: 허공터·기예 미리보기 (2026-10-19)

기준은 `ef1b8ce`다. `runtimeEntries`는 training/skill-preview 항목에 optional 메타만 붙이며 native/단일 실행의 코드 목록·순서는 유지한다. 외부 웹 빌드는 두 소스를 각각 해시 모듈로 emit하고 Game 필수 import/modulepreload에서 제외한다. embedded/full은 원래 위치에서 두 모듈을 실행한다. Workshop의 common 경로는 동일하다. 선택 모듈은 idle 예열 없이 실제 기능 사용 때만 요청한다.

`optional-runtime-loader.js`는 Game entry 안에 들어간다. 이름별 진행 중 import를 공유하고 성공한 전역 등록을 재사용한다. 실패하면 pending을 비우고 다음 명시적 시도에 `honroRetry` query를 붙여 브라우저의 실패 module URL cache를 피한다. 원본 콘텐츠 해시는 유지한다.

`talent`는 텍스트/수련점/장착 조작을 즉시 연다. passive는 요청하지 않는다. active의 실제 canvas·스킬·modal 노드·profile·요청 token이 같은 동안만 setup한다. 닫기/다른 modal/화면 이동은 취소한다. `restoreTalent`는 기존 canvas/preview 객체가 있으면 재생성 없이 복원하고 최신 hero 및 스크롤을 잇는다. tick은 열린 modal의 연결된 실제 preview에만 실행한다.

허공터 action과 직접 `launch(...,true,...)`는 training 준비 전 화면·전투·profile·저장을 바꾸지 않는다. 중복 진입을 합쳐 한 번만 실행하고 실패는 원래 화면에서 다시 시도/취소한다. 준비 후 기존 class/skill 설정 → launch/toolbar → open 순서를 유지한다. reset도 같은 launch 경계를 쓴다. 늦게 등록된 training key listener보다 Main이 먼저 Escape/Tab을 소비하지 않도록 training-dialog는 기존 전용 listener에 넘긴다. 기존 저장은 훈련을 영속 전투로 바꾸지 않고 보류한 캠페인 snapshot을 유지한다.

### 최소 확인과 한계

필요한 Game/Workshop 빌드와 `tools/testing/startup-browser.py optional-checks`만 사용했다. ready 전 두 선택 모듈 요청0·초기 preload 제외·passive 미요청, active A02 로딩 중 수련점 변경과 빠른 닫기/늦은 setup 차단, 실제 preview tick·canvas/객체/스크롤 복원, A01 import 실패/재시도, 허공터 실패 시 화면/저장 보존·중복 클릭 한 번 진입·toolbar/open·Escape·reset·직접 training launch, 기존 캠페인 저장 reload/continue의 성장/장착/완료 보존을 확인했다. pageerror는0이다. 기예 전수·전체 verify·다른 맵 검사는 하지 않았다.

embedded는 HONRO_READY와 두 전역의 기존 eager 준비까지 확인했다. 실제 Workshop Playtest 전투 진입은 **기준 master에서도 같은 오류로 실패**한다: stage1–4 ACT1 scene unsupported version/invalid lights, terrainBounds와 stable playBounds 포함 조건, invalid zone coverage. 기준/수정본의 common27개 해시가 모두 같고 두 화면에서 같은 오류를 대조했다. 이 항목을 전투 실행 통과로 기록하지 않으며 미술·지형·schema 수정은 범위에서 제외했다. `_local/reports/startup/optional-embedded-baseline.json`과 `optional-checks.json`에 근거가 있다.

cold cache/new context/CPU4배/RTT40ms/2MiB/s에서 기존 스크립트로 전후 각1회만 비교했다. 실제 기기/공개 Pages 실측이 아니다.

| 항목 | Desktop 이전 → 이후 | 모바일 viewport 이전 → 이후 |
|---|---:|---:|
| 실제 ready |3.931 →4.126s|3.909 →4.144s|
| ready+500ms 관측 전송 |5,259,575 →5,242,680B|5,251,713 →5,234,818B|
| 관측 요청 수 |93 →94|93 →94|

Game 필수 common+app JS와 entry는2,823,453→2,806,363B(동일 title/data loader 제외), 순감17,090B다. 선택 모듈 원본 합은22,227B이며 gate/registry 코드가 일부를 차지한다. full 순서를 지키는 bundle 경계로 필수 core import는31→32(별도 title2개 포함33→34)다. ready는 이 단일 비교에서 약0.2초 늘었으므로 속도 개선을 주장하지 않는다. 이번 변경의 확인된 효과는 실제 진입까지 선택 코드 전송·실행을 미루는 것이다. `optional-before.json`, `optional-after.json`, `optional-build.json`에 측정 근거를 둔다.

소스/검증과 생성물을 별도 커밋으로 남긴다. 부모가 진행 중인 미술과 순서대로 통합하도록 이 작업은 브랜치 push까지만 수행하며 master/Pages는 발행하지 않는다. 통합 시 최신 미술의 생성물과 이전 두 distinct 배포 세대 기준으로 다시 빌드한다. 로컬 빌드는 별도 worktree의 TypeScript5.9.3 API를 사용했으며 package 선언/lockfile은 변경하지 않았다.


### 최신 1장 미술 기준 통합 발행 (2026-10-19)

부모가 master `41c3289`의 승인 balanced1장을 확인한 뒤 소스 `d0689d9` 통합과 master/기존 Pages 발행을 승인했다. `34dadf4` 생성물은 가져오지 않고 별도 통합 브랜치에서 소스만 cherry-pick했다(새 source `62c8583`). BUG_LOG의 추가 기록만 양쪽을 보존하여 해결했다. 최신 미술·지형·충돌·revision 파일은 변경하지 않았고 공통27개 모듈의 콘텐츠 해시도 기준과 같다. 생성물은 최신 기준에서 한 번 빌드했으며 기준 배포 자산 및 이전 두 distinct 세대를 유지했다.

확인은 필요한 통합 빌드와 짧은 실제 Game smoke만 했다: 초기 ready/두 선택 모듈 요청0, 실제1장6000×3000 및 campaign map revision3, A01 preview 최초 import/setup/tick1회, 허공터 최초 import/toolbar/open1회, pageerror0. 측정과 전수 검사, 앞 단계의 상세 실패/저장 확인 및 미술 검수는 반복하지 않았다. 결과는 `_local/reports/startup/optional-integration-smoke.json`이다. 이 발행 확인이 앞 절의 기준-master Playtest schema 차단을 수리했다는 주장은 하지 않는다.


## 필수 JSON의 직렬 요청 대기 완화 (2026-10-20)

기준 master `1fb64610be98f9d6b4e7c273d08fc64b80c9d886`의 기존 장별/선택 runtime 분할을 유지했다. 현재 병목은 새 장의 author보다 필수 공통 JSON의 요청 시점이었다. cold에서 split 메타 fetch372.7ms, 응답 완료→hydrate40.2ms, hydrate0ms; 동행 자료 fetch335.1ms, 응답 완료→hydrate10.2ms, hydrate0.1ms였다. 응답 후 구간은 worker parse/전달 및 스케줄링을 포함하며 순수 parse만 따로 측정한 값은 아니다. campaign import의 현재1장 author/완료 구간은 약17ms였다. 엔진 파일의 전송/실행 대기와 far SVG 원문 hydrate도 남아 있다.

`modulepreload`는 실행 전 코드만 받으므로, 빌드는 각 data module의 필수 JSON 목록을 함께 기록한다. 기존12모듈 lookahead에서 해당 JSON을 먼저 request한다. 기존 cache를 공유해 소비 시 중복 요청하지 않으며 실패는 cache에서 제거된다. hydration/전역 등록/author/패치는 원래의 순차 import 시점에 수행한다. party alias에도 실제 data module의 JSON 목록을 전달한다. 현재/이어갈 장의 기존 JSON 선행 요청은 첫 준비 구간으로 당긴다. 전체 library, 다른 장, optional preview/training, Workshop 앱, 래스터 그림을 새로 예열하지 않는다. full/embedded의 코드 실행 순서와 모든 데이터/그림/CSS 콘텐츠는 그대로다. common 미술/지형/쉼터 렌더와 저장/진도/입력/audio 코드는 수정하지 않았다.

로컬 Chromium `390×844` touch/mobile viewport, 새 isolated context/cache disabled, CPU slowdown4, latency40ms, download2MiB/s에서 같은21장 synthetic 전투 저장을 재사용해 전후 각1회 측정했다. ready는 `data-honro-ready`, 요청/전송 관측은 ready와 타이틀 그림 표시를 확인한 뒤500ms까지다. 클릭 반응은 trusted click 시작부터 화면 전환 및 audio context running 관측까지이며 Playwright 관측 지연을 포함한다. 실제 휴대폰/공개 Pages/통계적 우위의 근거가 아니다.

| 항목 | Cold 새 시작 이전 → 이후 | 21장 이어하기 이전 → 이후 |
|---|---:|---:|
| 실제 ready |3.694 →3.064s|4.151 →3.654s|
| 타이틀 그림 표시 |0.404 →0.384s|0.421 →0.432s|
| 관측 요청 수 |95 →95|94 →94|
| 관측 전송 |5,368,235 →5,370,626B|6,904,540 →6,906,931B|
| 클릭 후 관측 |0.493 →0.529s|2.005 →2.223s|
| ready 전 chapter/장별 assets |1장만 →1장만|21장만 →21장만|

준비시간은 각각 약17.1%/12.0% 줄었지만 요청/바이트/클릭 후 진입은 개선되지 않았다. 새 bootstrap 목록 때문에 전송은2,391B 늘었다. 전송량 축소나 무관 코드 제거를 주장하지 않는다. firstPaint의 이미지 최대1200ms/두rAF와 준비 전 버튼 비활성도 기존 그대로다. far SVG 원문 대기, 필수 엔진/구 저장 호환 메타/서사·장 패치 초기화는 남아 있으며, renderer가 캡처하는 전역과 쉼터 SVG cache를 깨는 임의 지연은 추가하지 않았다. 벡터 지형과 기존 래스터 요청 시점은 기준 master의 구현을 유지한다.

한정 확인은 필요한 build/구문 검사와 실제 cold/continue 측정,12장 fetch 실패→기존 전투/profile/저장 동일→재시도 및 중복 launch의 요청1회,21장 취소→늦은 로딩 완료→타이틀 유지 각1건이다.21장 HP/3라운드/성장/장착/완료, trusted click의 audio running도 보존했다. pageerror0, 초기 optional/Workshop/full-library 요청0이다. 빌드 전후 data81개·graphics81개·styles14개 해시가 동일했다. 전체verify·별도검수자·무관 기예·다른 장·Workshop 실제 실행·master/Pages는 하지 않았다. 로컬 생성물은 측정용이며 소스 커밋에 포함하지 않고 부모의 통합 순서에 맡긴다.

근거 JSON: `_local/reports/startup/critical-path-{before,after}.json`, `critical-path-checks.json`. 캡처: `critical-path-after-{cold-ready,cold-entered,continue21-ready,continue21-entered}.png`, `critical-path-retry.png`, `critical-path-cancelled.png`. 같은 디렉터리의 `critical-probe.py`와 `critical-entry-check.py`는 이번 한정 측정의 로컬 재현 스크립트다.


## 클릭 후 진입 대기 한정 조사 (2026-10-20)

기준은 master/Pages에 통합한 `2014aa4c57c4a4deb579863fdea87cfb7c08f2d1`이다. 이번 요청은 클릭 뒤 SVG 준비가 전투 진입을 막는 경우만 고치며 엔진/미술 영역은 수정하지 않는 범위다. 조사 결과 해당 경로에 SVG 대기가 없어서 실행 코드를 변경하지 않았다.

- 생성 campaign manifest의 base/library/shared와30개 chapter·30개 stageLibrary의 `assetPaths`가 모두 빈 배열이다. 플레이 지형/충돌/인터랙션/주인공 벡터 자료는 inline JSON/런타임 자료로 준비되며 이 JSON을 지연하는 변경은 하지 않는다. `hydrate`가 SVG 원문 fetch를 기다리는 코드는 존재하지만 현재 캠페인 ensureStage의 입력에는 해당 참조가 없다.
- 외부 SVG8개는 `HONRO_ACT1_FAR_DATA`/`HONRO_ACT2_FAR_DATA`의 원경이다. 이 모듈은 ready 전에 실행되고 raw source8개도 이미 채워져 있었다. 전장 원경 renderer는 Image 준비 여부와 fallback을 사용하지만, act1 raw source는 `journey-art.js:campaignBackdrop`의 동기 inline SVG 소비처가 있다. source가 없을 때 만들어진 쉼터 fallback은 같은 scene cache key에 남으므로 이를 무작정 비동기화하지 않았다. 이 준비를 바꾸는 것은 이번 클릭 지연의 해결도 아니다.
- 같은 synthetic21장 저장, Chromium390×844 touch/mobile viewport, CPU4배/RTT40ms/2MiB/s, 새 context/cache disabled에서 method timer와 CDP CPU profiler로1회만 관측했다. ready 때 준비된 장은21장 하나였고 `has(21)`은true였다. 실제 click 이후 fetch0회, ensureStage0회였으며, 완료 resource에는 favicon만 추가됐다. 앞 단계의 클릭 완료 관측과 달리 실제 capture click event부터 첫 render 반환까지를 재었다.

| 구간 | 이번 단일 관측 |
|---|---:|
| click → 첫 전장 render 반환 |2452.4ms|
| click → 첫 render 후 두rAF 경계 |2660.4ms|
| continue 동기 호출 |1851.6ms|
| mount(continue에 포함) |1754.3ms|
| 최초 updateHUD(mount에 포함) |1631.2ms|
| 최초 Scene.render |552.7ms|
| portrait alphaBounds / sourceFor CPU self time |1058.6 /350.5ms|

구간들은 중첩되므로 더하지 않는다. profiler는 클릭 전후를 포함하며 자체 오버헤드가 있고 단일 실행이다. 원인은 `mount→updateHUD(true)→drawPortraits→HonroPortraits.draw→sourceFor→alphaBounds`의 최초 초상화 준비다. `portraits.js`는1200×1500 Canvas에서 주인공을 그린 뒤 alpha pixel을 순회한다. 이 초상화/렌더 코드는 이번 소유 범위 밖이므로 건드리지 않았다. 후속 개선을 한다면 이 최초 준비를 별도 범위로 다루어야 하며, SVG fetch 비동기화로 클릭 진입이 개선된다고 주장할 근거는 없다.

필수 표시만 확인했다:21장 전투 canvas/지형27개/네 동행 및 HUD 초상화 표시, HP358·3라운드·성장/장착/완료 보존, audio running, pageerror0. 런타임/생성물 변경이 없어 전후 비교쌍·재시도/취소 재실행·빌드·master/Pages 갱신·전체verify·기타 장/기예 검사는 하지 않았다. 기존 소유권/취소/재시도 코드는 그대로다. 이번 단위의 완료물은 조사 문서이며 속도 개선 패치가 아니다.

근거: `_local/reports/startup/click-entry-analysis.json`, `click-entry-dependencies.json`, `click-entry-probe.py`, `click-entry-continue21.png`.
