# v4 통합 준비 · 2026-10-27

별도 브랜치 `codex/act23-v4-integration-20261027`는 현재 공개 master `0f19f8f75ebf77a356f9f8016fcb81ea51ff9fa2`를 포함하는 Act2 감사 복구 `47c1e8a91837b77a45d97be8889a5529b91adf3c`에, 확인된 Act3 `8a02a97eec4b44bf382d21c6348dec11d9e31b9a`를 병합했다. 기존 두 작업 브랜치를 변경하지 않는다. master/Pages는 미발행이다.

## 공통 연결

- `shared/build.mjs`: 현재 Act2 모듈 순서 뒤에 Act3 모듈/전용 미술을 연결한다. 21/22/23/24/25/27만 개별 private opt-in을 지원한다. 21장 데이터는 Act3 alias 해석에도 필요하므로 다른 허용 Act3 장만 활성화한 경우 데이터만 포함하며 21장 실행 flag는 켜지 않는다.
- `act23-v4-reviewed.js`: 장별 provider dispatch를 지연 조회해 Act2 wrappers와 함께 쓴다.
- `story.js`: 기존 commonReviewRevision 생존/기예/관측 및 DEATH.01 일회 경계 가드를 유지하고, reviewedStage 검사를 Act3 provider에도 적용한다.
- `rest-journey.js`: Act3 전투 전 현장 관측/재개와 기존 Act2 enabledFor/20장 쉼터를 함께 보존한다. 과거11장 전용 문자열 조건으로 되돌리지 않는다.
- `stake-crossing.js`: 기존 물리 checkpoint 복구 전후로 Act3의 검수 목격/표시 상태만 capture/restore한다. 자원/적/지형/XP 계약은 기존 담당을 유지한다.
- `act23-v4.js`: 활성 provider의 revision421–427을 사용하며 Act2 revision과 비활성 장을 보존한다.

`tools/testing/act3-v4-parent-integration.mjs`는 오래된 base용 검증 복사본 제안이다. 이 통합 브랜치에 그대로 재실행하지 않는다. 현재 Story·쉼터·build 앵커에 맞춰 비교한 결과가 위6개 활성 파일이다.

## 확인과 미완료

`act3-v4-reviewed-source`의 문서 manifest/321행 전체 필드 보존, `act23-v4-reviewed21/22/23/24/25-27` 집중 검사를 통과했다. 제어된 전투·영웅 위치·시간 fixture이며 정상 캠페인 완주/공개 검증이 아니다. 26/28–30은 원고 데이터만 보존했고 구현 완료로 취급하지 않는다. 기본 production 및 Phase A 단독의 검수 플래그는 계속 꺼져 있다.

## 병행 작업 충돌 예상

Stage5 담당이 수정할 수 있는 `shared/runtime/main.js`는 후속 현장 선택 대사 메뉴의 최소 연결 지점과 겹칠 수 있다. `shared/build.mjs`도 모듈/자산 등록 시 충돌 가능하다. `shared/runtime/interactions.js`, `shared/runtime/renderer.js`, `game/src/journey.css`는 이전 Phase A 변경이 있어 기준을 대조해야 한다. `shared/map/terrain-domain.js`는 이번 통합에서 수정하지 않는다. 생성 `HONRO.html`/`HONRO_WORKSHOP.html`/`index.html`/`web/manifest.json`·immutable 파일은 최종 통합 빌드에서 다시 만들며 서로의 생성물로 덮지 않는다.

현재 공개 master의 레벨업·합류·축지 수정은 공통 선조에 포함되어 있다. 이번 공통 연결은 해당 엔진/성장/축지 계산을 변경하지 않는다.

## 최신 Act3 병합 · a8d4ba0b

이후 `a8d4ba0bee53fc5f85c9e322f878e69a5d6a41d3`까지 추가 병합했다. 위의26/28–30 미구현 상태는 이 이전 checkpoint의 기록이며, 현재 해당 provider/원고/검사는 포함하되 기본 비활성은 유지한다. [Act3 통합 요구](act3-v4-binding/INTEGRATION.md)의9파일 계약 중 기존6파일 연결은 보존하고 새 문서 span/전용 actor paint,29장 App.retry, 내부 interaction 이유 및30장 context ending 조회를 연결했다. ending 조회는 전역 App 대신 실제 호출의 profile을 넘겨 Act2 엔딩 계약과 독립 검사를 보존한다.

`act23-v4-reviewed26-30`이 실제 구조/NPC 보행·불길12적턴 경계·조기처치/수문·배 두 항차/하선·사공·저널·retry/XP 보존을 통과했다. 이 역시 위치/전투 fixture 검사다. Act3 담당이 명시한 보류3개(29장 실제 창 예고,30장 먼 곽진 이별2행, 채택 본문 없는 COMPAT30)는 완료로 승격하지 않는다. live bark 전달은 별도 공통 후속이다.

## 현재 통합 준비 상태

- 현장 선택 대사: Act2 목표·조작 안내창에 실제 메뉴가 연결돼 있다. 현재 생존/출연/지식/물리 조건을 확인하고 일반 Story cursor와 전투별 once로 저장한다. Act3의 전투 전 대사는 기존 쉼터/preview 가드를 유지한다.
- 전달 방식: `delivery=bark`는 기존 자막의 비정지 커서로 재생하며 reader를 열지 않는다. queued/표시 행의 생존·관측 검증, 실제 표시 receipt/취소 행 분리, elapsed/index 재개를 구현했다. scene/guide/document는 수동 reader 계약을 유지한다. 이 구현은 뒤에 추가한 `story-barks.js`가 제공하며 과거 Act3 보고서의 수동 bark 상태를 대체한다.
- 원고: `act23-v4-reviewed-source-all`이665장별+11공통=676 canonical의 ID/본문/조건/전달/원본 행 필드와 alias/retire 계약을 대조한다. 11장의 원본 `speaker_and_condition`도 데이터/씬 metadata에 보존했고12–20의 원본 필드도 씬으로 전달한다. 이 정적 검사는 전체676행의 실제 도달/정상 플레이 수락을 의미하지 않는다.
- 검증: 일반/전체 opt-in 검수 Game·Workshop 빌드, 실제 Chromium live bark 중 키보드 이동190px·cursor reload/Continue·대상 사망 제거·현장 menu/Enter/390px,26장 실제 단일 문서 span/cursor 검사가 통과했다. 통합된 Act2 감사16/17/18/20/common 집중 재검사도 통과했다. 기존 Act3 장별 focused 검사는 물리/가드 계약이며 새 delivery 경계는 별도 `act23-v4-live-barks` 및 `act23-v4-live-delivery-browser.py`가 검사한다. 모두 fixture·로컬 검증이며 정상 전체 플레이/공개 Pages 검증은 아니다.
- 공개 상태: 기본 검수 flags/payload는 여전히 비활성이다. production 전환은 아직 하지 않았고, 장별 보류3건 및 부모 최종 QA/통합 승인 상태를 확인한 뒤 별도 최종 빌드/배포한다. 과거15243 exact 문자열 패치는 다시 실행하지 않는다.

실제 공통 충돌 우선 파일은 `main.js`(29 retry 및 field menu 한 곳), `shared/build.mjs`(모듈/명시 flag), `interactions.js`(승인 목표 이유), `story.js`(생존/사망 경계/문서/bark), `rest-journey.js`, `act23-v4-reviewed.js`, `act23-v4.js`, `stake-crossing.js`, `act-endings.js`다. Stage5 담당의 지형·수역·엔진 계산은 이 후속 통합에서 수정하지 않았다. `terrain-domain.js`는 그대로다. master0f19는 여전히 이 브랜치의 공통 선조다.
