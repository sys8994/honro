# P2.2 퇴역 이미지 지형 provider 정리 — 2026-10-24

기준 master `b6e178689667d58b6b0db588cdee8895ae0062b6`. 부모가 확정한17개 omitted runtime provider를 삭제했다. [inventory.json](inventory.json)에 각 원래 경로/바이트/SHA256와 고정된 기준 commit 링크를 기록했다. 과거 문서의 파일 위치는 이 inventory로 찾을 수 있다. 원본 이미지·압축 fixture·역사 테스트·독립 character-catalog HTML·보호된 web 그래프는 삭제하지 않았다.

vector-campaign-art.js 31,526B는 `migration/legacy/runtime/vector-campaign-art.js`로 byte-exact 이동했다. review/shared-terrain-interior/source-overlay.mjs의 readFile 경로만 바꾸고 replacement dictionary key와 역사 bundle marker는 보존했다. vector-campaign-config.js 및 현재 build 목록은 바꾸지 않았다. 역사 overlay 도구의 과거 bundle 패치 동작은 실행하지 않았으며 입력 경로/원본 bytes를 검사했다.

renderer의 painted raster/pooled/static 선택과 registry, main stablePause 예외, 환경 Stage21 우회, readability 조기반환, Act1 Stage3/4/6 support 예외를 provider 없는 현재 결과로 단순화했다. Stage18은 비-pilot 팔레트와 단일 paint cache를 유지하며 pilot terrain/naturalEdges 우회만 제거했다. 승인 묵종v8, 기존 non-pilot soundWindow clip/overlay/drawBell 경로는 유지했다. 12/24 타일 제한, 기존 raster scale/cache key/culling/픽셀 정렬은 보존했다. 새 cache/alias/fallback을 추가하지 않았다.

## 관련 검사

- `node tests/retired-art-providers-contract-p22.mjs`:17개 삭제/1개 이동의 원본 git bytes와 inventory SHA 일치, 이동 exact, build 목록 unchanged/omitted provider 경로 없음, overlay readFile 단일 교체, 현재 호출 분기 참조 없음, pixel alignment/clip/cap 수식과 drawBell 본문 exact. shared/assets/engine/map/data/game/src/vector config 불변. 실제 사용자 저장을 사용하지 않았다.
- `HONRO_PROVIDER_BASELINE=b6e178689667d58b6b0db588cdee8895ae0062b6 node tests/retired-art-providers-render-p22.mjs` 후 같은 파일을 환경변수 없이 실행: 기존 static-screen-cache의 production Native Canvas 준비 코드를 재사용해 기준/현재 출력9개 exact. 일반1장 TerrainDomain·승인v8 종이 있는18장·TerrainDomain 비활성 custom/legacy 경로 각각960×640 scale.65 /390×844 scale.48 /960×640 close1.2 비교. 전체 픽셀 hash·raster scale·tile 수가 같고 render가 battle을 변경하지 않았다. tile 수12/24 이내 확인. legacy non-pilot soundWindow clip SVG/overlay 선택·동일 asset paint cache 재사용도 기준과 같았다.
- 원래 static-screen-cache.mjs는 보존했다. 그 준비 코드의 옛 `parts.push(await read...)` build regex·선행 eager image 가정 및 authored-far 누락은 현재 build/lazy image와 달라 새 관련 fixture에서 현재 `await file` 목록/마지막 authored-far 모듈 및 실제 raster manifest를 준비했다. 제품 초기화나 이미지 로더를 이 테스트에 맞춰 바꾸지 않았다. 기존 전체 static-screen-cache 테스트를 통과했다고 주장하지 않는다.
- `python3 tools/testing/render-paused-boundaries.py`: 기존 케이스 중 옛 registry monkeypatch 한 항목만 registry/provider 없음 검사로 바꿨다. 나머지 camera/loading/preview/flight/pause 검사는 그대로다. 실제 로컬 Chromium 정상 frame에서17항목 통과: retained/normal pixels, 세 화면 resize/DPR/원점, camera/revision/context restore/hit/camera tween/loading, preview, resume/charge/fire, flight pause/state,12회 pause의 canvas/DOM/tile 상한 및 JS error0. 실기기/청취/전체 게임 완주는 아니다.
- 실제 로컬 Game은 위 pause 검사로, Workshop은 별도 fresh browser context에서 HonroWorkshopAPI/프로젝트 UI/공통 Scene 기동과 retired registry/provider 부재·JS error0을 확인했다. Workshop 전체 편집/Playtest는 범위 밖이다.
- `npm run build`, `node tests/web-split.mjs` 통과. contract 검사의 기존 발행 보존 부분에서 활성354파일/실제 공개46그래프/중복 제외855파일 SHA·bytes·기존 발행 메타데이터 확인. P2.1 성공 발행만 기존 도구로 등록했으며 새 후보는 발행으로 등록하지 않았다. 30장 입력 데이터 비교는 플레이 순회가 아니다.

## 제거량과 현재 번들

- 삭제17개 source153,642B. 역사 이동31,526B는 repo 삭제량이 아니다.
- 현재 실행6파일의 absent-provider 분기 단순화 순감소3,165B. runtime 디렉터리에서 빠진 총량188,333B에는 역사 이동도 포함한다. tracked source의 순감소는156,807B이며 새 테스트/문서와 구분한다.
- omitted17개와 이동 자료는 이미 현재 번들에서 제외돼 있었으므로 그것들의 삭제로 새 asset/request 절감이 생겼다고 주장하지 않는다. 활성 graph는354파일 그대로,34,596,957→34,594,315B로2,642B 감소했다. 이는 생성물 전체 bytes 비교이며 실제 초기 요청/전송시간/FPS 계측이 아니다. 과거 발행 파일은 현재 활성 로딩과 구분해 보존했다.

현재 entry `web/entries/game.313759e6ffc706a1.js`, manifest SHA256 `313b0c4846e7989c4412079612f220a04cf09e31ff8f504b74958cd0446bd003`.

원시 결과와 캡처는 정책대로 `_local/reports/retired-art-providers-p22/` 및 기존 pause 검사 경로 `_local/reports/render-update/paused/`에 있다. master/Pages는 부모 담당이다. 추가 미사용 데이터/이미지 삭제는 부모의 후속 소비 관계 조사로 정하며 이번 범위를 확장하지 않았다.
