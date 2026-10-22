# 11·14·17·18장 진행 길이 · 통합 배포 후보

브랜치 **`integration/act2-pacing-release-20261022`**. 최신 master `9cb849a5eceb2529a4204232fdf55a09e543d079`와 후보 `f05549659e28a68aa5f475c83da3f77d9a3b19c2`를 두 부모의 merge commit으로 합치고 최종 소스로 재빌드했다. 후보의 마지막 런타임은 `be995e672d05bdf11bd9268b1ec5b9c8badd186d`다. **master 변경·Pages 배포는 수행하지 않았으며 부모의 최종 확인 후 반영 대상이다.**

## 소스와 실행 SHA

- 통합 런타임·재빌드: **`25a7108242ab185713a5d3679fbddade70adabe2`**. 충돌은 생성 HTML/`web/`에만 있었다. 최신 master의 생성 자산 목록을 빌드의 출발점으로 삼아 `npm run build`로 HTML·공통 모듈·manifest를 다시 생성했다. 후보의 옛 HTML로 최신 게임을 대체하지 않았다.
- 문서 정정: `14662d9a`. 실제 브라우저 저장 검사/집중 캡처 도구: `4ffdae46`, `b3e1b126`.
- **최종 실행 SHA: `2e154a206f3e4cb36310d798d67780114df287e8`**. 18장 준비 fixture의 완료 고정구 상태만 보완한 테스트 커밋이다. 이 SHA에서 영향받는 18장 후반 세그먼트·모바일·별도 종합을 다시 실행했다.
- 네 장 집중1/2, 11·14·17장 집중3/종합 및 최종 저장 검사는 `b3e1b126297b60e3d9beaf3a8e808103d0632635`에서 실행했다. 이후 **게임 런타임·맵·생성 HTML·web 자산은 모두 `25a71082`와 동일**하다. 뒤의 보고서 보존 커밋도 문서·증거만 바꾼다.
- 현재 Playtest: `web/entries/game.84a2fe1cd63ebbef.html?embedded=1`. [활성 자산·네 장 목표/배우 ID·보존 소스 해시](evidence/active-build.json).

최신 master의 `main.js`, `act-endings.js`, `act-endings-content.js`, `rest-journey.js`, 엔딩 CSS는 바이트 동일하다. 디버그 설정/여정첩 엔딩과 기존 일반 보고서·저장 경로를 보존했다. 공통 렌더 성능 실험 브랜치, 8·22·23장 후속작업, 초상화 변경은 가져오지 않았다. 관련 AGENTS.md·환경 스킬·SOP·교전 기준·release guard를 읽고 이 통합 범위에만 적용했다.

## 측정 표기 정정과 저장 계약

원자료 [`measurements.json`의 routes](../act2-pacing-20261022/evidence/measurements.json)는 네 클래스 × before/after **8행 모두 `level:12`**다. [기존 README](../act2-pacing-20261022/README.md)의 주민→흔적 행과 도입 문구, BUG_LOG 요약을 경지12로 정정했다. 별도의 경지10 중앙 보호·주민 구조 교전 결과는 그대로다.

**주민→흔적 R1→R5에서 R1→R2, 즉 5→2라운드는 해당 이동구간만의 결과다.** 적과 다른 동행을 초기 설정에서 제외한 실제 move/jump/wait/tick 검사이며 전체 장 클리어 라운드·사람의 클리어 시간으로 합산하거나 주장하지 않는다. 병합 후 네 클래스 모두 같은 결과를 재현했다([routes](evidence/routes.json)).

**기존11장 이어하기는 옛 흔적 위치 `x15040`·저장된 적 편성을 유지한다. 새 위치 `x11900`·감축 편성은 새 진입/재시도에서만 적용한다.** 이번 polygon/map revision 변경은 없다. 목표 이행은 지원되는 진행 중 캠페인만 적용하며 성장·보상 중복 방지와 custom/Workshop/완료/미인식 계획 제외를 보존한다.

브라우저에서 실제 download→파일 input→Continue를 거쳐 배우·지형·흔적·성장 원장을 보존했고, production retry에서만 새 흔적과 초기 적43체를 확인했다([저장 검사](evidence/save-summary.json)). 역사적 fixture에는 현재 map revision stamp가 없어 기존 master 정책대로 재시작될 수 있다. 이번 브라우저 비교는 **현재 map stamp를 명시한 호환성 fixture**다.

처음 원본 fixture의 HP/좌표와 App Continue를 직접 비교한 검사는 실패했다. 동일 fixture를 **최신 master `9cb849a5`의 실제 빌드로 한 번 열어 대조**한 결과, 두 빌드의 77개 배우 ID·HP·좌표·편성과 지형이 일치했다. 기존 master의 능력치/배우 이행을 통합 회귀로 오판하지 않도록 비교 기준을 명시했다. 이를 원본 역사 저장의 모든 수치가 무변경이었다고 표현하지 않는다. 전용 pacing 이행 함수 자체의 물리 상태 보존은 별도 state 검사로 확인했다.

17장 전체 소탕/일지는 master부터 자동 증거 완료였다. 이번 새 성과는 보호5→3회와 최대 방어 증원10→6체 등이며 **전역 전멸 제거를 새 성과로 쓰지 않는다.**

## 선별 실행 결과

| 검사 | 병합 후 결과·범위 |
|---|---|
| `npm run build` | 통합 소스로 양 HTML·해시 자산 생성 완료. 의존성 설치는 작업용 `/tmp` npm cache를 사용했고 lockfile 변경 없음 |
| `node tests/act2-pacing-state.mjs` | 국소 위협/보호 NPC 실패, 기존 목표 Continue/export/재Continue, 11장 서측 전원 제압+미입장 추격 경계, 최종 E, 완료 보상 exactly-once 통과. [상태 결과](evidence/state.json), [로그](evidence/state.log) |
| `node tests/act2-pacing-authoring.mjs` | 11/14/17/18 재생성→최종 author와 활성 목표/배우 ID/흔적/사건 일치. [로그](evidence/authoring.log) |
| `node tests/act2-pacing.mjs` | 네 클래스 경지12 이동 before/after, 기존 저장 직접 이행, 다른26장·지형/환경 보존, 멱등 적용·지원 제외 조건 통과. [로그](evidence/routes.log) |
| `node tests/act2-pacing-segments.mjs 14 17 18` | 준비된 후반 구간의 실제 엔진 선택/이동/발사/대기/tick으로 모두 승리. 14장 R6/먼 적41체 생존, 17장 R4/60체 생존, 18장 R8/57체 생존·종지기 HP1 비살상. [입력·진행 요약](evidence/segments-summary.json), [최초 로그](evidence/segments.log) |
| 18장 fixture 보완 후 같은 segment 재실행 | 앞선 고정구 완료 flag에 맞춰 descriptor/배우도 완료 상태로 준비. 이후 R8·57체 생존·종지기 HP1과 42행동 재현. [재검사 로그](evidence/segment18-recheck.log). 초기 준비 뒤 피해·좌표·자원 보정 없음 |
| `python tests/act2-pacing-release-save-browser.py --reference …/reference.json` | 최신 master와 옛11장 실제 Continue 비교·download/import/재Continue·새 retry 경계 통과. [로그](evidence/save.log) |
| `node tests/web-split.mjs` | 생성349파일 해시/바이트·원본/장별 재조립·Game/embedded 기본 진입·embedded 저장 보호·Workshop 직접 iframe 연결 통과. 전30장 정상 완주 검사가 아님. [로그](evidence/web-split.log) |
| `debug-journal-ending-records-browser.py --review final` | 미클리어 1막에서 UI로 디버그 켜기 → 10/20/30 기록 → 미리보기 → 터치 진행 → 원래 여정첩 복귀. 390×844/844×390 총6건 통과. 막·선택·확대·스크롤·DOM·열린 기록 메뉴·profile/normal/battle/localStorage 바이트 보존. [결과](evidence/journal-summary.json) |
| `debug-act-ending-preview-browser.py --review entry` | 기존 설정 진입·세 막 미리보기·설정 복귀·상태/저장 불변 총6건 통과. [결과](evidence/settings-summary.json) |

성공한 브라우저 실행의 pageerror/HTTP 실패는 모두0건이다. 기존의 긴 중앙/구조 교전, 정상 엔딩/일반 갤러리 전체 행렬을 반복하지 않고 이 병합의 목표·저장·번들·대표 UI 연결을 검사했다.

## 실제 화면 · 집중3회와 별도 종합

설치된 Chromium의 로컬 최종 빌드를 **각 회차 새 브라우저로 열었고 이미지를 직접 확인**했다. 전체 viewport JPG이므로 HUD/목표/조작부도 포함한다. 집중3의 진행 상태는 명시적 fixture이며, 14·17·18 종합은 위 실제 Native 엔진 세그먼트의 won 저장을 브라우저에 다시 표시했다. 11장 종합은 하부 흔적 목표를 준비한 화면이다. 각 회차의 실제 ArrowRight 키 + production App.frame 20회 입력으로 네 장의 시작 위치 이동도 확인했다.

| 장 | 집중1 · 구조/동선 | 집중2 · 대상/접지/구분 | 집중3 · 모바일/상태 변화 | 별도 종합 |
|---|---|---|---|---|
|11|[산지·고목·선택로](evidence/11-focus1-overview.jpg)|[주민 피난처·입구](evidence/11-focus2-refuge.jpg)|[하부 새 흔적 목표](evidence/11-focus3-mobile-trace.jpg)|[주민→하부 능선](evidence/11-final-lower-route.jpg)|
|14|[층별 집과 연결로](evidence/14-focus1-overview.jpg)|[다리·주민·등잔집](evidence/14-focus2-refuge.jpg)|[보호3/4 표시](evidence/14-focus3-mobile-refuge.jpg)|[R6 국소 완료](evidence/14-final-bridge.jpg)|
|17|[작업굴·인양틀·상하층](evidence/17-focus1-overview.jpg)|[인양틀·복구면·사격턱](evidence/17-focus2-hoist.jpg)|[보호2/3·남은1회](evidence/17-focus3-mobile.jpg)|[R4 일지 완료](evidence/17-final-worksite.jpg)|
|18|[대종·양측 지형](evidence/18-focus1-overview.jpg)|[종입술·열린 틈](evidence/18-focus2-mouth.jpg)|[하강 뒤 종지기](evidence/18-focus3-mobile-keeper.jpg)|[R8 동쪽 퇴로 완료](evidence/18-final-keeper.jpg)|

직접 본 결과: 전체 구조에서 기존 연결된 암대·고목·목조 지지와 선택 사격층이 유지된다. 근접 화면에서 주민/장식/적과 지지면이 구분되고 새로운 전면 가림이 없다. 모바일에서 흔적·보호3/4·보호2/3·종지기 목표와 하단 조작부를 확인했다. 종합에서 새 흔적 접근 위치와 세 후반 사건 완료 표시·먼 잔적 생존을 확인했다. 모든 카메라/기예 조합이나 사람의 재미 승인을 뜻하지 않는다.

11장의 최초 촬영은 일시 턴 배너가 장소를 가려 자연 만료 후 재촬영했다. 18장의 준비 fixture는 완료 flag만 세우고 고정구 descriptor를 남겨 관련 없는 고정구 표식이 보였다. 테스트 준비 상태만 정합하게 보완하고 해당 segment→집중3→별도 종합 순서로 다시 실행했다. 게임 런타임/목표·지형을 화면에 맞춰 수정하지 않았다. 아래 18장 재검사 기록과 JPG가 앞선 준비 fixture 증거를 대체한다.

[집중1](evidence/review1-capture.json), [집중2](evidence/review2-capture.json), [집중3 최초](evidence/review3-capture.json), [18장 집중3 보완](evidence/review3-18-recheck.json), [종합 최초](evidence/final-capture.json), [18장 최종 종합](evidence/final18-recheck.json)에 실행 SHA·카메라·화면비·상태·키 입력·오류를 보존했다.

디버그 대표 실제 화면: [10장 기록](evidence/final-records-10-390x844.jpg), [20장 기록](evidence/final-records-20-390x844.jpg), [30장 기록](evidence/final-records-30-844x390.jpg), [1막 재생](evidence/final-ending-10-390x844.jpg), [2막 재생](evidence/final-ending-20-390x844.jpg), [3막 재생](evidence/final-ending-30-844x390.jpg), [30장 원래 메뉴 복귀](evidence/final-return-30-844x390.jpg), [기존 디버그 설정](evidence/settings-debug-390x844.jpg). 직접 열어 기록 메뉴·엔딩 그림/문구·복귀 버튼·모바일 가독성을 확인했다.

대표 JPG **24장, 최대118,001bytes, 모두1MB 미만**. [파일별 크기와 SHA-256](evidence/screenshots.json).

## 남은 한계와 인계

네 장의 새 진입부터 종료까지 연속 정상 완주, 30장 완주, 사람의 클리어 시간·성능 개선, 실기기/Safari/공개 Pages 검증은 이번 결과가 아니다. 전체 verify·무관한 baseline4실패 수리·후속 장 개편은 실행하지 않았다. 기존 `stage18-bell-refinement-resume.mjs`의 옛 terrain 조회 가정 실패는 [입력 후보 기록](../act2-pacing-20261022/README.md)에 남겨 두었고 이번 통과 항목에 포함하지 않았다.

브랜치별 변경 단위 커밋·비강제 push로 보존한다. master는 `9cb849a5…` 그대로이며 부모가 이 후보를 마지막 확인한 뒤 master/Pages를 반영한다. 이 작업의 명시적 권한 거부·미해결 원격 쓰기·런타임 차단 발견은 없다. 최초 npm 기본 cache 쓰기 오류는 `/tmp` 작업용 cache로 설치해 해결했으며 프로젝트 의존성 버전은 바꾸지 않았다.
