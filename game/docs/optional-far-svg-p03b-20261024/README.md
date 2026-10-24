# P0.3b 선택 SVG 원문의 초기 대기 경계

기준 master `3a8f0ac8f634b9ba3c820d74d80e6181a9f64de5`. 첫 소스 보존 커밋은 `55805c2e284b72da19a5cc802514d18576bb0c70`. 제품 변경은 지정한 `shared/web-build.mjs`, `shared/web-loader.js`, `shared/runtime/journey-art.js` 세 파일뿐이다. 전역 초기화·Canvas 이미지·전투·지도·P1 정리는 바꾸지 않았다.

## 원인과 구현

이전 hydrate는 ACT1_FAR_DATA의 SVG 원문 fetch도 Promise.all로 기다려503이 HONRO_READY를 거부했다. 변경 전 로컬 Chromium에서 title의 다시 시도 상태와503 거부를 재현했다. 이 원문을 소비하는 generic campaignBackdrop은 현행1–30 sharedRest가 사용하는 raster 경로와 다르다.

- 생성기는 ACT1_FAR_DATA에만 명시적으로 `svgSources:'optional'`을 전달한다. 다른 dataModule의 false 정책, 기본 required hydration, 필수 JSON/모듈/프로젝트/단계와 파싱·author 순서는 유지한다. 필수 데이터를 빈 값으로 대신하지 않는다.
- 별도 URL Map은 optional 원문 작업의 성공/실패/진행을 문서 수명 동안 기억한다. 기존 request의 실패 eviction이 있어도 같은 문서의 optional 원문이 자동으로 다시 요청되지 않는다. 새 문서는 새 Map이다.
- 하나의 optional batch를 Promise.all과 단일1500ms 타이머로 경합시킨다. 빠른 성공/실패는 즉시 진행하고 무응답4개에도 파일별 순차6000ms 대기는 없다. 타임아웃이 요청을 취소하지 않으므로 늦은 성공은 정확한 원문을 기존 registry에 넣는다. 늦은 실패는 그 optional 경계에서 처리하며 초기화·화면을 재시작하지 않는다.
- campaignBackdropSource가 같은 campaignMood/URI 선택과 inline base64 처리를 담당한다. generic scene 키에는 그 선택 원문의 준비 여부만 넣고, 같은 결과를 렌더에 전달한다. unrelated SVG 도착은 해당 scene을 무효화하지 않는다. 늦은 선택 원문이 도착하면 다음 호출에서1회 새 markup을 만든다. sharedRest 조기 반환/키/markup은 그대로다.

## 관련 검사

`node tests/optional-far-svg.mjs`:5묶음 통과. 격리된 VM fetch/시계에서4개 URL 병렬 요청과1499ms 미완료/1500ms 완료, 무응답/늦은 정확 원문/늦은 reject·503, 서로 다른 JSON의 반복 hydrate와 실패 후 dedup, 정상 새 문서/false 정책, required JSON503·invalid JSON·required SVG 오류를 확인했다. 이1499/1500은 결정적 타이머 검사이며 실시간 기동 측정이 아니다.

같은 검사에서 generic의 기존 늦은 캐시 결함을 기준 코드로 재현하고, 새 코드의 선택 원문 도착→다음 scene1회 갱신/반복 유지·unrelated 원문 무영향·inline SVG 동치를 확인했다. generic은 Kit 없는 격리 context로 해당 production 경로를 직접 호출했다. 현재 rest1/10/21은 실제 kit와 생성된 raster/pilot 데이터를 사용해 기준 markup/cache와 정확히 비교했고10장 guardian-root-stairs/distant-taut-thread를 보존했다. 전장 순회나 새 미술 판정이 아니다.

`python tools/testing/optional-far-svg-browser.py`: 새 로컬 Chromium390×844 touch 컨텍스트의7묶음 통과. 사용자 저장을 읽거나 지우지 않았고 정상 App.frame/rAF를 유지했다.

| 실제 브라우저 조건 | 결과 |
| --- | --- |
| 선택 SVG4개503 | 기동 성공, JS pageerror/unhandled0. 반복 hydrate도4개 요청 그대로. |
| 같은 문서 새로고침 후 정상 응답 | 새 시도4개, 생성 SVG4개의 정확한 원문과 registry 일치. |
| no-response | 첫 SVG 요청→ready 1555.88ms. ready 때4개 원문 요청 미완료, App/title 노드 유지, JS unhandled0. |
| late-success | 첫 SVG 요청→ready 1529.61ms. ready 때4개 원문 요청 미완료, App/title 노드 유지, JS unhandled0. |
| late-failure | 첫 SVG 요청→ready 1530.47ms. ready 때4개 원문 요청 미완료, App/title 노드 유지, JS unhandled0. |
| 필수 JSON503/잘못된 JSON | 둘 다 기존 다시 시도 화면과 HONRO_READY 거부 유지. 예상 required 오류로 구별. |

관측1530–1556ms는 선택 요청 시작부터 남은 모듈/author/UI 작업까지 포함한다.1500ms는 필수 JSON을 읽은 뒤 optional batch에 설정하는 대기 타이머이며, 전체 HTML 기동의 상한이나 바쁜/백그라운드 브라우저의 실시간 보장은 아니다. 타이머 실행은 브라우저 이벤트 루프 스케줄에 따른다. 무응답 fixture는 ready/미완료 측정 뒤 종료 정리에서만 해제한다. 실제 공개 네트워크·Android 실기기 시간은 측정하지 않았다.

기존 `intro-loading-browser.py`의 required SVG 실패 fixture는 required JSON 실패로 바꿔 새 계약과 맞췄다. 그 긴 과거 장면 검사를 전체 실행하지는 않았다. 이전 Workshop21장 대기 실패는 수정하거나 반복하지 않았다.

## 생성물·발행 보존

`npm run build`, `node tests/web-split.mjs` 통과. 생성 JS에서 optional 정책은 ACT1_FAR_DATA 한 곳이며 활성408파일이다. 기존 순수 `profile-store-p01-preservation.mjs` bytes/hash/source 감사로 공개41개 그래프829파일과 발행 메타데이터 보존을 확인했다. 저장 보호 전체 회귀를 다시 돌린 것은 아니다.

부모가 확인한 P0.3a 발행을 기존 retain-published-web 도구로 등록했다: source3a8f0ac8, [Pages40059998501](https://github.com/sys8994/honro/actions/runs/40059998501), success2026-10-24T03:53:36Z. 공개 entry·title 준비·기존 이어가기 버튼 확인은 부모 증거로 계획표에 반영했다. 최근7일/최소2개·hash dedup 계약을 유지하고 이번 후보는 발행으로 등록하지 않았다.

최종 entry `web/entries/game.d8d63d9c496bc88a.js`, manifest SHA256 `ea381b948d15b5ab78a194c1a855851d1862405d9109471a439aac794612f9b2`. 자동 보고는 Git 제외 `_local/reports/optional-far-svg-p03b/`의 before/native/browser/preservation JSON과 실행 로그에 있다. master/Pages는 부모 담당이다.
