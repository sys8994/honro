# HONRO · Game + Workshop

**스토리 제작 기준(2026-10-14):** [새 기준서와 적용 범위](game/docs/story/README.md). 두 사용자 v1.0 문서를 채택하며, 기존 구현·저장·검증 이력은 보존합니다. 4–6막은 후반 기획이며 이번 새 스테이지 구현 범위가 아닙니다.

본게임 RC21과 Map Workshop을 하나의 엔진·Scene·맵 모델로 통합한 정적 웹 프로젝트입니다.

- 게임: 기존 Pages 또는 로컬 HTTP 서버에서 루트 `HONRO.html`을 엽니다.
- 캐릭터 도감: [혼로의 얼굴들](tools/character-catalog.html)에서 실제 렌더러의 인물·동작·등장 근거와 검수 의견을 봅니다. [수집/검증 범위](game/docs/CHARACTER_CATALOG.md).
- 편집기: 루트 `HONRO_WORKSHOP.html`을 엽니다. 기본 프로젝트는 Stage 1~30(1막·2막·3막)이며, 1·2는 목업을 반영한 숲길·분지 개편판입니다.
- 실행 자산: `web/` 전체와 `assets/bgm/`을 HTML과 함께 같은 디렉터리 구조로 배포합니다. HTML·CSS·실행 모듈·캠페인 JSON·그래픽은 역할별 파일로 분리됩니다.
- 편집한 맵 실행: `HONRO_WORKSHOP.html`의 Playtest에서 실행합니다. 개발용 `HonroApp.launchMap(project, project.activeStageId)`와 JSON 가져오기 핸들러는 유지하며, 일반 게임 타이틀에는 Workshop Map 버튼을 표시하지 않습니다. 캠페인 저장과 분리해 실행합니다.
- Playtest: 실제 게임 HUD와 조작을 사용합니다. 시작 위치·선택 유닛·현재 카메라에서 시작하고 Stop으로 편집에 복귀합니다.
- 길 위의 쉼터: 일반 여정은 지역별 쉼터에서 이어집니다. 모닥불로 모든 동행의 능력치·기예를 준비하고, 동행을 눌러 선택 대화를 나누며, 오른쪽 이정표로 다음 장소에 진입합니다. 장면 설명은 쉼터의 필수 대화로 전달합니다. 여정첩은 지상·지하 지리와 지난 전투 다시 걷기를 위한 보조 메뉴입니다. [화면·대사·저장 계약](game/docs/REST_JOURNEY.md).
- 필수 사건과 대화: 단서는 기록함 확보·구조·현장 대조 같은 행동과 짧은 필수 장면으로 전달합니다. 별도 선택 원문 읽기는 없습니다. 대화창은 `이전 / 대화 넘기기 / 다음`으로 제어하며, 저장한 장면은 같은 위치에서 이어집니다. [1막 이야기 구성과 검증](game/docs/STORY_REWRITE_IMPLEMENTATION_NOTES.md).

2막 **울리지 않는 종**은 1막 완료 후 이어지는 10개 장입니다. 소단을 포함한 4인 동행으로 동굴마을·잠운사·묵종을 지나 생존자를 호송합니다. 일반 여정의 여정첩에서 지상·지하의 장소를 볼 수 있으며 각 장은 앞 장을 완료하면 열립니다. 디버그도 같은 쉼터와 여정첩을 사용하며 1–30장 선택과 네 동행의 모든 기예 준비를 열어 줍니다. [구현·스테이지·몬스터 목록](game/docs/ACT2_IMPLEMENTATION_NOTES.md), [검증과 한계](game/docs/ACT2_QA.md). 집중 검사는 `npm.cmd run test:act2`입니다.

스테이지를 바로 확인하려면 게임의 **설정 → 디버그 모드**를 켜고 쉼터의 **여정첩**에서 지상·지하·읍성의 1–30장을 선택합니다. 선택한 장소의 쉼터에 먼저 도착하며, 모닥불에서 네 동행의 모든 기예와 경지 1–30을 준비한 뒤 이정표로 진입합니다. 경지를 낮추면 능력치 수련을 해당 경지 한도로 줄입니다. 전투의 출전 인원·분할 팀·자원·목표는 일반 규칙을 유지합니다. 현재 일반 기록 전체를 독립 복제하므로 이미 진행 중인 전투도 검수용 사본에서 이어갈 수 있습니다. 검수 변경은 일반 저장에 남지 않으며 모드를 끄거나 새로고침하면 원래 일반 기록으로 돌아옵니다. 모드 선택은 유지됩니다. 디버그에서 내보낸 기록도 보호된 일반 저장이며 Workshop Playtest는 계속 독립되어 있습니다.

3막 **지워진 기록**은 읍성·서고·옛 운송로의 21–30장이다. 원경 산맥, 장소별 지형과 접지 장식, 한국 악귀와 유한 증원, 순차 목표·피해 합산·경험치·레벨업의 현재 제작 계약은 [3막 보강](game/docs/ACT3_REFINEMENT.md)을 참고한다. 디버그는 분할 원정 중에도 쉼터와 모닥불을 사용할 수 있다. 첫 화면은 먹빛 나루 풍경과 한자 `魂路`·작은 한글 `혼로` 제목을 사용한다. [미술·반응형·검수 범위](game/docs/TITLE_SCREEN_DESIGN.md).

21–30장은 기존 지형을 보존하며 적 배치의 반복 간격과 공중 적 끼임을 개선했습니다. [장별 결과 캡처와 최종 21·27장 대표 실행](review/act3-role-layout/README.md)을 직접 볼 수 있습니다. 전면 지형 재설계나 정상 완주 판정은 아닙니다. 후속으로 29장 상층 수문길의 실제 엄폐만 보완했습니다. [변경 전후와 검증 범위](review/act3-terrain-continuation/README.md).

1·2스테이지 개편의 실제 화면·작성 과정·검증은 [개편 보고서](game/docs/STAGE12_REDESIGN.md)에 있습니다. 기존 전투 저장은 보존하며 새 스테이지 진입·재시도에 새 맵을 적용합니다. Workshop에 기존 자동저장 프로젝트가 있으면 활성 [campaign.json](shared/data/campaign.json)을 Import하여 새 기본 맵을 불러올 수 있습니다.

3–6스테이지의 지형·건축물 접지·물길·한국 산지 분위기 개편은 [장소 설계 기록](game/docs/STAGE36_PLACE_DESIGN.md)을 참고합니다. `npm.cmd run test:stage36`으로 레시피 재현, 지형 접지, Game/Stage View/Playtest 화면을 검사합니다.

ES 모듈과 JSON을 불러오므로 로컬에서도 HTTP를 사용합니다. 저장소 루트에서 `python -m http.server 8000`을 실행하고 `http://localhost:8000/HONRO_WORKSHOP.html`을 엽니다.

## GitHub Pages 배포

원격 최신 상태와 단일 발행 담당자를 확인한 뒤 변경 단위별로 비강제 push하고, 최종 master와 기존 Pages의 배포 결과를 확인한다. [원격 반영과 배포](game/docs/RELEASE_OPERATION_GUARD.md)를 참고한다. 복잡한 저널과 배포 영수증은 선택 사항이며 `test:release-guard`는 그 도구를 수정할 때만 사용한다.

`HONRO.html` 이름을 그대로 사용할 수 있습니다. 저장소의 **Settings → Pages → Deploy from a branch**에서 배포할 브랜치와 **/(root)**를 선택합니다.

- 기본 주소 `https://<사용자>.github.io/<저장소>/`는 `index.html`을 통해 게임으로 이동합니다. 쿼리와 `#` 뒤의 진입 옵션도 유지합니다.
- 게임 직접 주소: `https://<사용자>.github.io/<저장소>/HONRO.html`
- 편집기 직접 주소: `https://<사용자>.github.io/<저장소>/HONRO_WORKSHOP.html`
- 배포 필수 파일은 `index.html`, `HONRO.html`, `web/` 전체와 `assets/bgm/`의 MP3 5개입니다. 편집기도 공개하려면 `HONRO_WORKSHOP.html`을 함께 포함합니다. `npm run build`가 두 HTML과 콘텐츠 해시 자산을 함께 최신화합니다. Playtest는 `web/entries/game.<hash>.html?embedded=1`을 직접 열며 기존 공개 주소와 저장키는 유지합니다.

Pages는 파일명의 대소문자를 구분합니다. [GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)를 참고합니다.

1막 1–10장의 야외 장소·순수 SVG·접지 개편과 3장 바위 충돌 이음새 수정은 [구현 기록](game/docs/ACT1_SPATIAL_IMPLEMENTATION.md), [검증 범위](game/docs/ACT1_SPATIAL_VALIDATION.md)를 참고합니다. `npm run test:act1:offline`과 `npm run capture:act1 -- final --review`로 재현합니다.

## 개발과 검증

Node.js 20 이상과 Python 3.10 이상을 사용합니다. Native Canvas 캡처/오프라인 미술 검사는 루트에 고정된 `@napi-rs/canvas` 개발 의존성을 사용합니다. 게임 HTML을 여는 데에는 Node 의존성이 필요하지 않습니다. Windows PowerShell에서는 실행 정책 충돌을 피하려면 `npm.cmd`를 사용합니다.

```powershell
npm.cmd install --ignore-scripts
npm.cmd --prefix game ci
python -m pip install -r requirements-dev.txt
# Chrome/Edge가 없으면 테스트용 Chromium 설치
python -m playwright install chromium
npm.cmd run build
```

일반 수정은 변경 관련 최소 확인만 합니다. 디자인은 해당 이미지/필요 모션, 스킬은 기존 정량 계산/해당 동작, 맵은 해당 구간 이동/퀘스트를 확인합니다. 문서만 바꾸면 문구·링크만 확인하며 위 설치·빌드·브라우저 준비도 생략합니다. 전체 검사는 광범위한 회귀 조사가 필요한 경우에만 `npm.cmd run verify`로 선택 실행합니다. [검증 범위와 과거 기록](VALIDATION.md).

게임 집계 검증은 정적 감사(`npm --prefix game test`)와 RC21 브라우저·성능 검사(`npm --prefix game run test:rc21:browser`)를 순서대로 실행하여 Stage 1/2 지도를 한 번만 감사합니다. 독립 실행 `npm --prefix game run test:rc21`은 지도 감사부터 브라우저·성능까지 모두 실행합니다. `npm --prefix game run test:verification-plan`은 중복·누락·실패 무시가 없는 명령 구성을 빠르게 검사하며 실제 감사/브라우저 통과를 대신하지 않습니다.

브라우저 검사는 Chrome/Edge 또는 Playwright Chromium을 찾습니다. 다른 실행 파일은 `HONRO_BROWSER` 환경 변수로 지정합니다. 성능 검사는 다른 브라우저 부하와 겹치지 않게 순차 실행합니다.

`npm run build`는 게임과 Workshop을 함께 생성합니다. `shared/build.mjs`의 단일 목록을 `shared/web-build.mjs`가 `web/runtime/`, `web/styles/`, `web/data/`, `web/graphics/`, `web/entries/`로 내보냅니다. `web/manifest.json`은 현재 자산 그래프이며 HTML이나 `web/` 생성물을 직접 수정하지 않습니다. 파일 분리 연결만 확인할 때는 `node tests/web-split.mjs`로 데이터 재조립·자산 해시·native 기본 진입·embedded 저장 보호를 확인합니다. 기존 HTML 안의 script 추출을 전제한 과거 검사는 새 모듈 빌드에 그대로 적용되지 않을 수 있습니다. 기존 `python workshop/build.py`도 같은 빌더에 위임합니다. 생성 HTML을 직접 수정하지 않습니다.

이야기 런타임·기록·저장/재개를 바꿨다면 필요에 따라 빌드 후 기존 `npm run test:story`를 사용합니다. 문구·문서만 바꾸면 이 검사를 실행하지 않습니다. 이 검사는 전체 `verify`에도 포함됩니다.

사용자 스토리 기획 v0.1의 1·2막 반영과 공개 순서는 [현재 서사 계약](game/docs/STORY_CANON_V01.md)을 따릅니다. `npm run test:story-canon`은 기존 지형·퀘스트·전투 보존, 돌림진부터 저문골/무명사 단서까지의 정보 순서, 진행 중 대화·쉼터 저장을 집중 검사합니다.

## 소스와 문서

맵 v6의 전30장은 [하나의 큰 지형 내부에 Play Bounds](game/docs/TERRAIN_DOMAIN.md)를 둡니다. 안팎은 같은 polygon·재질·renderer이며 충돌은 기존 시뮬레이션 범위로 투영합니다. 진행 저장은 유지하고 새 진입/재시도부터 적용합니다. `npm run test:terrain-domain`으로 확인합니다.

플레이 경계·카메라 중심·시각 영역은 [카메라 경계 계약](game/docs/CAMERA_BOUNDS.md)을 따릅니다. 줌은 가로 전술 시야와 식별 크기로 결정하며, 큰 지형의 collision 투영은 기존 플레이 범위를 유지합니다. Workshop `Bounds`로 세 영역을 보고 `npm.cmd run test:camera`로 세로/가로 화면과 입력·저장·지형 연결을 검증합니다. 새 1장은 마지막 능선이 1,200만큼 확장되며 진행 중인 옛 저장은 옛 맵을 유지합니다.

배경 제작은 [환경 구도·대기 시스템](game/docs/ENVIRONMENT_COMPOSITION.md)과 [전체 분류표](game/docs/ENVIRONMENT_INVENTORY.md)를 따른다. Workshop에서 Depth와 Zone/Group/Support를 선택하고 Atmosphere를 정한다. `npm run test:environment`는 수직 맵·접지·줌·물 움직임·저장과 편집을 검증한다.

설오·담허·휘겸·소단은 [네 동행 제작 기준](game/docs/PARTY_ART_PIPELINE.md)의 v010을 사용한다. 기존 전체 키·얼굴 형태·복식·소단의 연보라 포인트를 유지하고 설오 몸 폭은 20%, 담허·휘겸은 12.5% 넓혔다. 머리 장식 아래의 두개골 정수리부터 턱까지로 재어 설오·휘겸·소단 약 7.5등신, 담허 약 7등신으로 맞췄다. 앵커 수는 512/541/480/511 그대로이며 충돌 크기는 변경하지 않는다. 제작 입력은 `tools/party-forge/`, 공통 리그는 `shared/runtime/party-rig.js`, 생성물은 `shared/assets/party/`다. `npm run test:character-balance`가 v009 전후·작은 초상·양방향 5동작의 Native Canvas 증거를 만들며, `npm run test:party`는 여기에 실제 브라우저 검사를 추가한다. 캠프·수련·HUD·대화의 초상은 `shared/runtime/portraits.js`가 머리 전체를 보존하는 공통 흉상 구도로 맞춘다. 전장·쉼터의 전신과 캠페인의 적 소단에도 같은 v010 벡터를 사용한다.

몬스터 미술은 [제작·시각 검수 계획](game/docs/MONSTER_ART_PIPELINE.md)을 따른다. 일반 적 11종을 최초 원본 대비 약 3배의 앵커로 제작하고 공통 벡터 렌더러로 표시한다. `npm.cmd run test:monsters`로 검수 공방과 전후·크기별 비교 이미지를 생성하고 `_local/reports/monster-forge/index.html`을 연다. 제작 원본은 `tools/monster-forge/recipes.mjs`와 `species.mjs`, 원본 측정 기준은 `tests/fixtures/monster-baseline.json`이다. 적 소단은 위 네 동행 에셋을 사용한다.

동맹·주민·소환귀·상여·운반대·문·구 보스 20종은 [동맹과 혼 제작 기준](game/docs/ACTOR_ART_PIPELINE.md)에 따라 한국식 다크 판타지로 다시 그렸다. 승인된 동행/몬스터와 같은 높이로 비율과 톤을 비교하며, 노드 증량보다 성인 비율·복식·역할 구분을 우선한다. `npm.cmd run test:actors` 뒤 `_local/reports/actor-forge/index.html`에서 전후·기존 승인작·크기·5동작을 검토한다. 원본은 `tools/actor-forge/`, 생성물은 `shared/assets/actors/`다.

맵 장식과 원경은 [맵 미술 제작 기준](game/docs/MAP_ART_PIPELINE.md)을 따른다. 화강암·기와집·성문·장승·솟대·당산나무·의식 제단을 저채도 한국형 다크 판타지로 손보고, 각 장식과 배경 레이어의 Canvas 경로 점 수를 기존의 2배 이하로 제한한다. `npm.cmd run test:map-art`가 전후 화면과 52개 표본의 점 수, Game/Stage View/Playtest의 공통 그림을 검사한다.

| 위치 | 역할 |
|---|---|
| `shared/engine/src/` | 실제 엔진, 물리·이동·전투, SFX/BGM |
| `shared/runtime/` | Scene, 캐릭터 렌더링, 게임 앱·HUD·스토리·임무 |
| `shared/map/` | schema, geometry, compiler, unit factory, commands |
| `shared/data/campaign.json` | Stage 1~30과 요소 라이브러리의 활성 데이터 |
| `shared/assets/` | 실제 캐릭터 벡터 에셋 |
| `web/` | 생성된 공통 ES 모듈·CSS·장별 JSON·공용 그림 JSON·SVG/이미지·Playtest 문서 |
| `workshop/src/` | 편집 UI·오버레이·히스토리·Playtest 호스트 |
| `game/config/`, `game/src/`, `game/vendor/` | 기존 설정, 게임 CSS, UI 자산 |
| `migration/legacy/` | 이전·비교 검사 전용 원본 정의 |
| `tests/`, `game/tests/` | 통합·게임 검사. `fixtures/`의 비교 기준 데이터도 Git으로 관리 |
| `game/docs/` | 버그 기록·수정 맥락·현재 기예 명세·설계 설명 |
| `_local/reports/`, `_local/game-reports/` | 자동 생성 검사 결과·스크린샷·오디오 (Git 제외) |
| `_local/archive/` | 과거 패치 노트·RC 설계/출시 보고서·압축본·구 Workshop 문서 (Git 제외) |
| `_local/logs/` | 전체 검증 실행 로그 (Git 제외) |

[아키텍처](ARCHITECTURE.md), [스키마](MAP_SCHEMA.md), [Agent API](AGENT_API.md), [이전 방식](MIGRATION.md), [BGM](BGM_INTEGRATION.md), [검증](VALIDATION.md)을 참조합니다.

`_local/`은 이 PC에만 보관하는 폴더이며 `.gitignore`로 전체 제외합니다. 과거 문서는 원래 경로 구조를 `_local/archive/` 아래에 보존했습니다. 새 패치 노트·일회성 보고서·배포 압축본도 그곳에 저장합니다. 빌드·검사 결과는 `_local/` 아래에 자동 생성되며 새 clone에는 포함되지 않습니다. 문서의 `_local/` 링크는 로컬 검증 증거용입니다. 이전에 커밋한 파일의 이력은 Git에 남아 있습니다.

`game/docs/BUGFIX_CONTEXT.md`, `game/docs/BUG_LOG.md`와 현재 명세는 유지보수에 필요하므로 계속 Git으로 관리합니다. 검사 입력으로 읽는 기준 JSON은 `tests/fixtures/`, `game/tests/fixtures/`에 보존합니다.

## 2막 공간 개편 (2026-10-05)

11–20장의 방과 실제 보행 지형, 순수 SVG·공통 렌더링을 다시 저작했습니다. 18/19는 같은 묵종 공간이며 20의 행렬은 실제 오른쪽 보행을 유지합니다. 기존 진행 중인 전투는 보존하고 새 진입/재시도에 적용됩니다. 지도 형식은 v5, 프로필 저장은 기존 schema 4입니다.

[구현·실행·검증 범위](game/docs/ACT2_SPATIAL_IMPLEMENTATION.md). 브라우저를 제외한 검사는 `npm run verify:offline`, 정상 엔진 자동전투는 `npm run test:act2:normal`로 분리합니다. 이번 환경에서는 실제 브라우저 UI/성능을 검증하지 않았습니다.

## 의도와 실제 검수를 연결하는 로컬 작업

`npm run review-job -- help`로 현재 소스 또는 승인된 전체 막 실행을 재개 가능한 검수 작업으로 시작할 수 있습니다. 기존 구현/빌드/회귀를 실제 실행하고 정확한 HTML·외부 자산 해시와 연결된 브라우저 관찰을 반입합니다. 미해결 중요한 선택, 정상 플레이, 최종 미술 검수는 별도 대기하며 자동 승인·공개 배포하지 않습니다. CLI·증거 형식·검수 보고서·재개 절차는 [의도 파이프라인](game/docs/INTENT_PIPELINE.md#실행재개-가능한-검수-작업)을 참고합니다.

지형·적 편성·증원은 [변경 구간의 교전 확인](game/docs/ENCOUNTER_ACCEPTANCE.md)에 따라 해당 구간의 실제 역할·이동·퀘스트를 짧게 확인합니다. `encounter:review`는 선택형 기록 도구이며 manifest·별도 검수자는 필수가 아닙니다. 알려진 관련 결함과 미확인 범위를 보고하고, 도구의 형식 통과를 미관·재미의 자동 승인으로 표시하지 않습니다.
