# 첫 타이틀 표시와 초기화 비용 — 2026-10-18

기준 master는 `a25675f`다. 묵종/후경 미배포 브랜치는 포함하지 않는다. 이번 변경은 기존 타이틀을 전체 게임 초기화와 분리하고 데이터 복원 비용을 낮춘다. 30장을 장별로 지연 생성하는 구조 변경은 하지 않는다.

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
