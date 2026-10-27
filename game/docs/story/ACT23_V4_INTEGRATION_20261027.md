# v4 통합 후보 · 2026-10-27

전용 브랜치 `codex/act23-v4-integration-20261027`는 Act2 감사 복구 `47c1e8a91837b77a45d97be8889a5529b91adf3c`와 최종 Act3 `dfe699a576d72bba00678b3198bdf767932e458c`를 포함한다. 공개 master `0f19f8f75ebf77a356f9f8016fcb81ea51ff9fa2`의 레벨업·합류·축지 수정도 공통 선조로 보존한다. 기존 작업 브랜치를 reset/덮어쓰기하지 않았다. master/Pages는 미발행이며 부모의 최종 후보 확인 뒤 별도 배포한다.

## 최종 동작

- `game/config/story-release.json`의 `reviewedAct23=true`가 Game·Workshop·직접 Playtest의 기본 2·3막 검수본을 활성화한다. `HONRO_ACT23_V4_RELEASE=0`은 전체 기본값 rollback이며 기존 명시 opt-in과 Phase A off cap은 유지한다. model-only fixture는 명시 활성 방식이므로 production 기본값은 별도 release-policy/App/Chromium 검사로 검증한다.
- `shared/build.mjs`는 Act2·Act3 provider와 데이터/렌더 공통 모듈을 같은 목록으로 연결한다. 29장 실제 창 모듈은29장 provider 직전이다. 21장 데이터는 다른 Act3 장의 alias 조회에도 포함한다. 과거15243 기준 exact 문자열 패치는 다시 실행하지 않는다.
- 현장 선택 대사는 Act2 목표·조작 안내창의 실제 메뉴에서 현재 생존·출연·지식·물리 조건을 재확인하고 Story cursor와 전투별 once로 저장한다. Act3의 전투 전 대사는 기존 쉼터/preview 계약을 유지한다.
- `story-barks.js`가 기존 `#banter` 자막으로 `delivery=bark`를 비정지 전달한다. reader/camera/input lock을 만들지 않는다. queued·표시 행의 생존·관측 검사, elapsed/index 재개, 실제 표시 receipt와 취소를 보존한다. 혼합 bark/guide 묶음은 기존 수동 안내와 live cursor로 나눈다. 즉시 창·낙하·화재 경고가 일반 자막에 우선하며 중단된 cursor는 남는다.
- 수동 reader도 실제 DOM 표시 ID만 versioned receipt로 기록한다. event terminal/once·물리 진행과 목격 목록은 분리하며 나중 취소돼도 이미 본 행은 사실로 남는다. 최초 admission이나 종료 시 생존만으로 미표시 행을 추가하지 않는다. 구 저장 진행·cursor/확정 이력을 소급 변조하지 않으며16장 명시 witnessPresented를 보존한다.
- 최종29장은 실제 phase3 전진·동일 지면 native 창 예고와 유료 공격, 이탈/가림/보스 사망 취소를 연결한다. 최종30장은 실제 두 항차/증언/지도 뒤 곽진 곁 집결에서 승인 이별3행을 표시하고 기존 높은 출구는 별도 유지한다. 채택 본문 없는 COMPAT30 세 항목은 새 대체표시를 생략하며 과거 기록·성장·완료를 보존하는 확정 정책이다. 장별 원고 보류는 없다.

## 공통 보존 계약

`act23-v4-reviewed.js`의 provider dispatch, `story.js`의 common 생존/기예/관측 및18장 사망 경계, `rest-journey.js`의 Act2/Act3 preview와20장 쉼터를 함께 보존한다. stake retry는 검수 목격/표시 상태만 기존 물리 checkpoint 전후에 복원한다.29장 App.retry, 승인 목표 이유, 문서 span/actor paint, 실제 profile의30장 ending 조회를 연결하며 Act2 ending은 유지한다. 새 미검수 대사나 원고 수정은 없다.

Stage5의 `terrain-domain.js`, `stage5-waterfall-geometry.js`, `stage5-waterfall.js`, `stage5-positioning.js`는 공개0f19 바이트와 같다. 보류 중인 미술/수역 작업을 병합하지 않았다. 빌드는 성공 발행59개 generation metadata와 보호 immutable 파일을 보존한다. 후보를 새 발행으로 등록하지 않았다.

## 검증 결과와 한계

- canonical 정적 대조:665장별+11공통=676 ID/본문/조건/전달/모든 원본 행 필드 및 alias/retire 보존. Act3 문서321행 manifest·원본 blob도 대조했다. 정적 대조는 모든 대사의 실제 도달을 의미하지 않는다.
- 집중 App/Engine fixture:11장 실제받침 혼생성/회복,16장 담허·설오 사망과 핵심5행,17장 결원 brace/withdrawal,18장 실제 fatal 경계와 무발화 경계,20장 pre-ack 공중·접지 취소/같은짐1회,공통 stale안내,25/27 자유순서·개인기록,26/28/29/30 물리·불길·retry·배·이별·호환,실제표시 receipt·선택메뉴·live bark를 통과했다.
- production App fixture:구216→516 전투 재시작에서 성장/XP/SP/ranks/장착/party/기록 보존,같은 검수 revision의 두번 Continue에서HP/focus/위치/session 완전보존,실제 과거Lv17 23장 export→423 재시작에서 지급성장·장착·완료·기록 보존을 통과했다.
- 기본 빌드 Chromium:Game/Workshop20장 flag·676 payload,stage1 원래 전달/no empty bark state,Canvas/pageerror0. live bark 중 실제 키보드 이동·순서/cursor reload·대상 사망 제거,실제 field 메뉴/Enter/390px,29장 native 경고/공격·저장·모바일,30장 실제 두 항차·NPC보행·곽진곁3행·저장/모바일·과거기록 보존이 통과했다. Game·Workshop 빌드 및 TypeScript typecheck도 통과했다.
- 추가 실행한 `stage23-escort-growth-resume.mjs`의 첫 assertion은 과거 snapshot 전체가SP migration만 받고 그대로 Continue된다고 기대해 실패했다. 해당 실제 snapshot은 map revision이 없어 현행 공개 지형 계약에서도 재시작 대상이다. rollout-off model에서도 재현했다. 이 오래된 검사는 수정하지 않았으며 production-resume 검사가 현행 재시작·성장/장착 보존을 따로 통과했다.

모든 실행 결과는 제어 fixture와 로컬 빌드 검증이다. 정상30장 자동완주·공개 Pages 동작 검증은 하지 않았다. 부모가 감사5건과18장 마지막말,11장 혼합생존 receipt를 별도 확인했다.

## 병행 작업 충돌 예상

공통 수정 파일은 `main.js`(29 retry/field 메뉴),`shared/build.mjs`,`interactions.js`,`story.js`,`story-barks.js`,`rest-journey.js`,`act23-v4-reviewed.js`,`act23-v4.js`,`stake-crossing.js`,`act-endings.js`다. `renderer.js`와`game/src/journey.css`에도 앞선 통합 변경이 있으므로 미술 작업과 대조한다. 생성 HTML/immutable/manifest는 최종 병합 소스로 재빌드하며 서로 다른 후보 생성물로 덮지 않는다.
