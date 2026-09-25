# HONRO · Game + Workshop

본게임 RC21과 Map Workshop을 하나의 엔진·Scene·맵 모델로 통합한 정적 웹 프로젝트입니다.

- 게임: 루트 `HONRO.html`을 브라우저에서 엽니다.
- 편집기: 루트 `HONRO_WORKSHOP.html`을 엽니다. 기본 프로젝트는 원본 Stage 1~10입니다.
- 실행 자산: `assets/bgm/`을 HTML과 함께 같은 디렉터리 구조로 배포합니다. MP3는 HTML에 포함되지 않습니다.
- 편집한 맵 실행: Workshop의 Project JSON을 내보낸 뒤 게임 타이틀의 `Workshop Map`으로 가져옵니다. 캠페인 저장과 분리해 실행합니다.
- Playtest: 실제 게임 HUD와 조작을 사용합니다. 시작 위치·선택 유닛·현재 카메라에서 시작하고 Stop으로 편집에 복귀합니다.

`file://`로 실행하거나, 저장소 루트에서 `python -m http.server 8000`을 실행하고 `http://localhost:8000/HONRO_WORKSHOP.html`을 엽니다.

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

## 소스와 문서

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
| `tests/`, `reports/` | 통합 검사와 결과 |

[아키텍처](ARCHITECTURE.md), [스키마](MAP_SCHEMA.md), [Agent API](AGENT_API.md), [이전 방식](MIGRATION.md), [BGM](BGM_INTEGRATION.md), [검증](VALIDATION.md), [인계](HANDOFF_REPORT.md)를 참조합니다. 과거 RC 문서는 당시 기록이며 현재 실행 방법과 합격 기준은 루트 문서를 우선합니다.
