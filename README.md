# HONRO · Game + Workshop

본게임 RC21과 Map Workshop을 하나의 엔진·Scene·맵 모델로 통합한 정적 웹 프로젝트입니다.

- 게임: 루트 `HONRO.html`을 브라우저에서 엽니다.
- 편집기: 루트 `HONRO_WORKSHOP.html`을 엽니다. 기본 프로젝트는 Stage 1~10이며, 1·2는 목업을 반영한 숲길·분지 개편판입니다.
- 실행 자산: `assets/bgm/`을 HTML과 함께 같은 디렉터리 구조로 배포합니다. MP3는 HTML에 포함되지 않습니다.
- 편집한 맵 실행: Workshop의 Project JSON을 내보낸 뒤 게임 타이틀의 `Workshop Map`으로 가져옵니다. 캠페인 저장과 분리해 실행합니다.
- Playtest: 실제 게임 HUD와 조작을 사용합니다. 시작 위치·선택 유닛·현재 카메라에서 시작하고 Stop으로 편집에 복귀합니다.
- 대화와 장부: 대화창의 `대화 기록` 또는 일시정지 메뉴의 `대화와 장부 기록`에서 지나온 장면을 다시 읽습니다. 넘긴 대화도 남으며, 장부를 읽다 저장하면 같은 쪽에서 이어집니다. [1막 이야기 구성과 검증](game/docs/STORY_REWRITE_IMPLEMENTATION_NOTES.md).

1·2스테이지 개편의 실제 화면·작성 과정·검증은 [개편 보고서](game/docs/STAGE12_REDESIGN.md)에 있습니다. 기존 전투 저장은 보존하며 새 스테이지 진입·재시도에 새 맵을 적용합니다. Workshop에 기존 자동저장 프로젝트가 있으면 활성 [campaign.json](shared/data/campaign.json)을 Import하여 새 기본 맵을 불러올 수 있습니다.

3–6스테이지의 지형·건축물 접지·물길·한국 산지 분위기 개편은 [장소 설계 기록](game/docs/STAGE36_PLACE_DESIGN.md)을 참고합니다. `npm.cmd run test:stage36`으로 레시피 재현, 지형 접지, Game/Stage View/Playtest 화면을 검사합니다.

`file://`로 실행하거나, 저장소 루트에서 `python -m http.server 8000`을 실행하고 `http://localhost:8000/HONRO_WORKSHOP.html`을 엽니다.

## GitHub Pages 배포

`HONRO.html` 이름을 그대로 사용할 수 있습니다. 저장소의 **Settings → Pages → Deploy from a branch**에서 배포할 브랜치와 **/(root)**를 선택합니다.

- 기본 주소 `https://<사용자>.github.io/<저장소>/`는 `index.html`을 통해 게임으로 이동합니다. 쿼리와 `#` 뒤의 진입 옵션도 유지합니다.
- 게임 직접 주소: `https://<사용자>.github.io/<저장소>/HONRO.html`
- 편집기 직접 주소: `https://<사용자>.github.io/<저장소>/HONRO_WORKSHOP.html`
- 배포 필수 파일은 `index.html`, `HONRO.html`, `assets/bgm/`의 MP3 5개입니다. 편집기도 공개하려면 `HONRO_WORKSHOP.html`을 함께 포함합니다. 두 HTML은 `npm run build`로 최신화합니다.

Pages는 파일명의 대소문자를 구분합니다. [GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)를 참고합니다.

## 개발과 검증

Node.js 20 이상과 Python 3.10 이상을 사용합니다. Windows PowerShell에서는 실행 정책 충돌을 피하려면 `npm.cmd`를 사용합니다.

```powershell
npm.cmd --prefix game ci
python -m pip install -r requirements-dev.txt
# Chrome/Edge가 없으면 테스트용 Chromium 설치
python -m playwright install chromium
npm.cmd run build
npm.cmd run verify
```

브라우저 검사는 Chrome/Edge 또는 Playwright Chromium을 찾습니다. 다른 실행 파일은 `HONRO_BROWSER` 환경 변수로 지정합니다. 성능 검사는 다른 브라우저 부하와 겹치지 않게 순차 실행합니다.

`npm run build`는 게임과 Workshop을 함께 생성합니다. 기존 `python workshop/build.py`도 같은 빌더에 위임합니다. 생성 HTML을 직접 수정하지 않습니다.

이야기·문서·기록·저장/재개 회귀만 확인하려면 빌드 후 `npm run test:story`를 실행합니다. 이 검사는 전체 `verify`에도 포함됩니다.

## 소스와 문서

배경 제작은 [환경 구도·대기 시스템](game/docs/ENVIRONMENT_COMPOSITION.md)과 [전체 분류표](game/docs/ENVIRONMENT_INVENTORY.md)를 따른다. Workshop에서 Depth와 Zone/Group/Support를 선택하고 Atmosphere를 정한다. `npm run test:environment`는 수직 맵·접지·줌·물 움직임·저장과 편집을 검증한다.

설오·담허·휘겸·소단은 [네 동행 제작 기준](game/docs/PARTY_ART_PIPELINE.md)의 v009를 사용한다. 시트 얼굴 형상·소단의 연보라 포인트를 유지하고 몸과 팔다리를 늘렸으며 휘겸의 어깨를 넓혔다. 갓·머리카락을 제외한 얼굴 높이는 남성 셋이 같은 수준, 소단은 약 12.5% 작게 맞췄다. 앵커는 v008과 동일한 512/541/480/511이다. 제작 입력과 경로는 `tools/party-forge/`, 공통 리그는 `shared/runtime/party-rig.js`, 생성물은 `shared/assets/party/`다. 빌드 후 `npm.cmd run test:party`로 시트/벡터·전후·머리 크기·축소·모션 검수 자료를 만들고 `_local/reports/party-forge/index.html`을 연다. 캠페인의 적 소단에도 같은 개정판을 적용한다.

몬스터 미술은 [제작·시각 검수 계획](game/docs/MONSTER_ART_PIPELINE.md)을 따른다. 일반 적 11종을 최초 원본 대비 약 3배의 앵커로 제작하고 공통 벡터 렌더러로 표시한다. `npm.cmd run test:monsters`로 검수 공방과 전후·크기별 비교 이미지를 생성하고 `_local/reports/monster-forge/index.html`을 연다. 제작 원본은 `tools/monster-forge/recipes.mjs`와 `species.mjs`, 원본 측정 기준은 `tests/fixtures/monster-baseline.json`이다. 적 소단은 위 네 동행 에셋을 사용한다.

동맹·주민·소환귀·상여·운반대·문·구 보스 20종은 [동맹과 혼 제작 기준](game/docs/ACTOR_ART_PIPELINE.md)에 따라 한국식 다크 판타지로 다시 그렸다. 승인된 동행/몬스터와 같은 높이로 비율과 톤을 비교하며, 노드 증량보다 성인 비율·복식·역할 구분을 우선한다. `npm.cmd run test:actors` 뒤 `_local/reports/actor-forge/index.html`에서 전후·기존 승인작·크기·5동작을 검토한다. 원본은 `tools/actor-forge/`, 생성물은 `shared/assets/actors/`다.

맵 장식과 원경은 [맵 미술 제작 기준](game/docs/MAP_ART_PIPELINE.md)을 따른다. 화강암·기와집·성문·장승·솟대·당산나무·의식 제단을 저채도 한국형 다크 판타지로 손보고, 각 장식과 배경 레이어의 Canvas 경로 점 수를 기존의 2배 이하로 제한한다. `npm.cmd run test:map-art`가 전후 화면과 52개 표본의 점 수, Game/Stage View/Playtest의 공통 그림을 검사한다.

| 위치 | 역할 |
|---|---|
| `shared/engine/src/` | 실제 엔진, 물리·이동·전투, SFX/BGM |
| `shared/runtime/` | Scene, 캐릭터 렌더링, 게임 앱·HUD·스토리·임무 |
| `shared/map/` | schema, geometry, compiler, unit factory, commands |
| `shared/data/campaign.json` | Stage 1~10과 요소 라이브러리의 활성 데이터 |
| `shared/assets/` | 실제 캐릭터 벡터 에셋 |
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
