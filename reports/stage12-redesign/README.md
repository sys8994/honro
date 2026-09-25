# Stage 1·2 목업 개편 — 2026-09-25

사용자가 제공한 두 목업의 큰 지형 윤곽과 역할 구분을 실제 Workshop 데이터로 작성했다. 캐릭터·스토리·성장 수치를 교체하지 않고 기존 HONRO 색조 안에서 큰 바위, 잔디 면, 희미한 나무와 파괴 가능한 가지를 구성했다.

- Stage 1: 4200×2200, 완만한 숲길, 매립된 큰 화강암과 작은 바위, 중앙 소나무, 좌우 가지 2개, 얕은 물웅덩이, 오른쪽 잔디 오르막. 가지는 기본 점프로 연결되고 파괴 후에도 지상 경로가 남는다.
- Stage 2: 4300×3300, 좌우 절벽과 열린 분지, 왼쪽 위 설오 시작점, 경사진 배경 나무 3개와 가지 5개, 절벽 바위·잔디 선반, 물웅덩이 3개. 상여는 x=1240에서 분지 바닥을 따라 x=3340의 오른쪽 도착점으로 이동한다.

## 실제 작성·실행 화면

| 본게임 전체 지도 | Workshop 작성 화면 |
|---|---|
| [Stage 1](stage-1-overview.png) | [Stage 1](workshop-stage-1.png) |
| [Stage 2](stage-2-overview.png) | [Stage 2](workshop-stage-2.png) |

[Stage 1 Playtest](playtest-stage-1.png) / [Stage 2 Playtest](playtest-stage-2.png). 이미지 생성 목업이 아닌 실제 공통 Scene 렌더러 출력이다.

## 작성 경로

`workshop/recipes/stage12-forest-basin.js`가 만드는 명령을 실행 중인 `HonroWorkshopAPI.previewCommands/applyPreview`로 적용했다. Preview의 원본 불변, Undo/Redo의 문자열 일치, schema 검증을 확인한 후 `exportProject()` 결과를 `shared/data/campaign.json`에 저장했다. [실행 증거](authoring.json). 새 asset 추가, terrain 생성, 재질 작성, unit/marker 이동, anchor/escort 목표 변경을 모두 같은 모델에서 수행한다.

새 작성 명령은 `asset.add`, `stage.update`, `object.update`, terrain의 `properties`이다. 게임·편집기·Playtest는 동일 canonical 데이터를 컴파일한다. Stage 3~10은 원본과 동일하다. `npm run migrate`는 원본 이관 후 이 레시피까지 재현한다.

## 동작·검증

최종 결과: 전용 Node 검사 18개, 전용 브라우저 검사 9개, 전체 `npm run verify` PASS(exit 0). 공통 Integration 47개 검사에 포함된 10개 스테이지의 게임/에디터 렌더링 비교도 통과했다.

[물리·임무 검사](checks.json)는 기본 이동/점프의 Stage 1 출구 도달, 두 가지 연결, 가지 파괴 후 경로, Stage 2 하강, 상여의 충돌 없는 도착, 물 전격 전도와 높은 물웅덩이 아래 유닛 보호, 반대편 공중 적까지 화살 궤적, 생성 공간, 저장 재마운트, 재현성과 무손실 왕복을 포함한다. 상여 완료 검사는 적과 필수 이벤트를 해결한 상태를 구성해 이동·완료 판정을 검증한다. 전체 전투를 정상 입력으로 클리어했다는 뜻은 아니다.

[브라우저 검사](browser.json)는 두 실제 HTML의 새 맵 로드, 도입 대사 버튼, Playtest 키 입력 이동·점프, Stop 후 원본 유지와 예외를 검사한다. 전체 `npm run verify`는 공통 렌더 비교, 420 tick 물리 비교, 10개 맵 smoke, 오디오, 타입, 회귀와 성능을 포함한다. 최종 실행 결과는 [전체 검증](../verification-run.json), [검증 표](../../VALIDATION.md)를 참조한다.

새 바위 배치로 드러난 보행의 발끝 침투는 `walkTerrain`에서 유효 지지면이 없을 때 발이 고체 안으로 들어가기 전에 멈추도록 보완했다. 새 물 재질은 `conductive:true`로 실제 Water에 연결했고, 전격은 물의 바닥 높이를 넘어 전달되지 않는다. 나무줄기는 배경이며 물 자체는 고체 충돌이 아니다.

## 저장과 확인 범위

기존 진행 중인 Battle과 Workshop 자동저장 프로젝트를 강제로 덮어쓰지 않는다. 본게임은 새 스테이지 진입·재시도부터 새 지형을 쓴다. Workshop에 이전 자동저장이 남아 있다면 루트 `shared/data/campaign.json`을 Import하면 된다. 새 맵의 모든 기예 조합, 전체 수동 클리어, 실기기 Safari는 검증하지 않았다. 2스테이지 절벽을 곧장 내려가는 경로에는 낙하 피해가 있으며 자동 이동 검사에서 설오는 생존했다.
