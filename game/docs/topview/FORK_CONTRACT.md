# 탑뷰 1막 1장 포크의 계승 범위

2026-11-28 사용자 보완 지시. 인계서에서 말하는 독립 게임의 단위는 제품과 실행 경로다. 개발은 기존 혼로 저장소와 이력 위에서 계속한다. 탑뷰 데모에서 열리는 콘텐츠는 1막 1장이다. 이후 장이 같은 공통 시스템과 저작 방식을 쓸 수 있어야 한다.

## 복구 기준

- 원본 저장소는 `sys8994/honro`이고 포크 시점의 `master`는 `cc81427699f40bebfe3716f4ed3bb5c2ca36ef8e`이다. 같은 트리를 담은 원격 브랜치는 `backup/honro-before-topview-20261128`이다.
- 데모는 `work/topview-act1-demo-20261128`의 별도 체크아웃에서 개발했다. 2026-11-28 사용자의 공개 전환 요청으로 `master`의 루트와 `HONRO.html`에서 탑뷰 데모를 시작한다. 기존 캠페인 파일은 백업 브랜치에서 복원할 수 있으며 사용자 저장은 제품별 키로 구분한다.
- 데모에는 전용 진입점과 저장 공간을 둔다. 탑뷰 자산을 읽지 못했을 때에는 오류와 재시도를 표시한다. 횡스크롤 캠페인으로 이어지는 경로는 제공하지 않는다.

## 확인한 소스 경계

| 게임 동작 | 원본 소스에서 확인한 경로 | 포크에서 다룰 범위 |
| --- | --- | --- |
| 캠페인 전투 시작 | `shared/runtime/main.js`의 `launch` → `shared/runtime/world.js`의 `HonroWorld.build` → `shared/map/compiler.js`의 `createBattle` | 1장의 실제 콘텐츠, 배우·장비·능력치 소유권을 유지하고 배치의 월드 좌표를 변환한다. 연습장 기본 캐릭터·표적을 정식 편성처럼 사용하지 않는다. |
| 발사와 예측 | `shared/engine/src/engine.ts`의 `fire`, `predict`, `velocity`, `advanceProjectile`, `collision`, `impact`; `physics.ts`의 `environmentAt`, `advanceLinear` | 같은 발사 위치·환경장·접촉 원칙을 예측과 실탄에 적용한다. 화면 방향에서 월드 방향으로의 변환, 충돌 형상, 평면상 힘을 바꾼다. 실험 앱의 별도 탄도 루프를 가져오지 않는다. |
| 스킬·피해·속성·턴 | `engine.ts`의 `effective`, `hurt`, `finishAction`; `skillMechanics.ts`, `turnOrder.ts`, `damageVariance.ts`; `shared/data/elements.json` | 기존 비용·판정·속성·부가 효과·행동 정산을 실제 호출한다. 입력과 지형 의존 코드만 격리한다. |
| 장비·성장·전투 기록 | `shared/engine/src/equipmentCombat.ts`, `progression.ts`; `shared/runtime/progression.js`, `profile-store.js` | 기존 계산과 데이터 스키마를 재사용하고 저장 키는 데모 소유로 격리한다. |
| 대사·HUD·소리·연출 | `shared/data/narrative-current.json`, `shared/runtime/story.js`, `story-direction.js`, `main.js`, `game/src/hud.css`, `shared/engine/src/bgm.ts`, `skillAudioPlayer.ts`, `skillVisuals.ts` | 원문, 장면·자산 ID, 화면과 오디오 재생기를 계승한다. 카메라 초점, 월드 도형과 화면 고정 UI의 변환만 구분한다. |

## 증거의 종류

코드에서 확인한 연결과 데모에서 실제 재생된 동작을 따로 기록한다. 확대·축소와 8방향 이동, 예측과 실탄의 첫 접촉, 방어와 적 턴, 대사와 장 종료, 전용 저장 복원은 데모의 실제 진입점에서 확인한다. PC 브라우저, 모바일 터치 에뮬레이션, 실기기는 각각 표시한다. 이미지 원본과 런타임 이미지, 지형의 통행·사선 데이터, 제작 과정과 실패한 결과도 구분한다.

## 포크 직전 실행 표본

원본 배포 파일을 로컬 HTTP로 제공하고 새 Chromium 프로필에서 정상 캠페인의 `HonroCampaignLoader.ensureStage(1)`와 `HonroApp.launch(1)`를 호출했다. 설오의 원본 ID는 `p-archer`, 시작 HP는 365, 장착 기예는 `A01`이었다. 활성 전투 배열에는 적 12개가 생성됐다. 장 이벤트 ID는 `cart`, `more`, `witness`, `ridge` 순이며 원본 35도·0.7 위력에서 예측은 82개 지점을 반환했다. 이 수치는 원본의 프로그램 호출 표본이다. 좌표계가 달라진 데모의 완주·난도 검증은 별도로 수행한다.

같은 원본 대화에 연결된 지형·모션 제작 실험은 소스 `0f83eb650a355031a96d114873de6f856f3b02d7`에서 브라우저로 열었다. 실험용 `dist/honro-asset-lab-kit.zip`은 14,540,695바이트이며 재질·소품·임시 궁수 원본, Tiled 지도, 변환 스크립트가 있다. 제작 인계용 `honro-topview-act1-codex-handoff-20261128.zip`은 14,642,174바이트다. 실험의 임시 궁수와 전투 모형은 정식 설오나 혼로 전투 엔진으로 간주하지 않는다.

최종 인계 ZIP은 분할 보관본 20개에서 복원해 동봉 검증기와 대조했다. 포크 원칙을 원문에 반영한 별도 인계본과 원본 ZIP의 크기·해시는 제작 SOP에 기록했다. [제작 SOP](PRODUCTION_SOP.md)
