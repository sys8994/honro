# 12장 연결형 공통 암반 부착 — 부분 개선, 미술 합격 보류

최종 렌더 소스 `799f6d2634b0d731cb5846fe72ec36a4623af8de`, 브랜치 `stage/act2-ch12-geology-attachments`. 부모가 연결을 허용한 공통 원본은 `bbe8acea8fa403b1f16df31a86dbae4c1f6d2069`다. 2장 브랜치 전체·campaign·map·배치는 가져오지 않았다. master/Pages에 쓰지 않았으며 13장도 시작하지 않았다.

**기술 연결과 범위 내 교정은 완료했지만 미술 합격은 아니다.** 상부 빈 띠와 전면 암반에 포함된 소나무 반복은 줄었다. 그러나 모바일의 큰 면, 길표 접합의 독립 덩어리 인상, 기존 수레 가림과 전체 화면의 서쪽 옛 색면은 남는다. 기능 검사 수로 이를 합격 처리하지 않는다.

## 통합 단위와 원본 소유권

- `64e9c8a5288572c039c26d4f78d7b6461bab4767`: 최신 master `edf712e910a08d73dd4490dfe017060308bcfa0f`를 이 후보에 병합했다. 스킬 UI·저장 검사 실행 소스는 master와 동일하다. BUG_LOG 양쪽 기록을 보존했고 HTML/web 충돌은 원본 재빌드로 해결했다. master 자체는 변경하지 않았다. master에서 들어온 SKILL_PREVIEW_SCENARIOS.md의 기존 EOF 공백 경고는 해당 파일을 수정하지 않고 남겼다.
- `3ab07d859f5017e98bfffc757079f48754cacc70`: 공통 SVG 5개, builder, renderer를 지정 원본 그대로 등록했다. 원본7개 파일의 바이트 동일성과 SHA256은 `evidence/shared-geology-attachments/import-checks.json`에 있다.
- `887135bb8c24e23abf2106fd2c9eb5665b9b248a`: 기존 지형을 바꾸지 않고 연결형 모듈 8개와 명시적 solid boundary 앵커를 연결했다.
- `799f6d2634b0d731cb5846fe72ec36a4623af8de`: 길표 앞쪽 접합1개를 추가하고 하단을 기존 매립 합성으로 묻었다. 최종 총9개 인스턴스다.

자산 원본/SVG/common builder/renderer는 임의 수정하지 않았다. `wood-pine-wall-root.svg`는 원본 builder가 5개 자산을 함께 읽는 등록 의존성으로 포함했으며 12장에는 배치하지 않았다. 기존 승인 rooted-pine4개와 수레·장식은 모두 그대로다. 실패한 jointed-granite 선택은 계속 비활성이다.

### 등록 metadata의 실제 호환성 결함

지정 원본의 ledge-neck은 scaleRange [.65,1]인데 backgroundRange [.85,1.1]이라 현행 Environment 검증이 거절했다. 원본 브랜치도 같은 정의이며 검증 규칙을 완화하지 않았다. 별도 `tools/environment/register-geology-art.mjs`에서 원래 native scaleRange와 backgroundRange의 교집합만 등록한다(ledge-neck 상한1.1→1). SVG·scaleRange·builder를 덮어쓰지 않았다.

향후 2장 공통 등록과 합칠 때 이 어댑터를 보존하거나 원본 담당자가 metadata를 수정해야 한다. 원래 applyGeologyArt를 나중에 재호출하면 이 불일치를 다시 발행할 수 있다. 이는 배율 허용 범위를 넓히거나 미술을 변형한 수정이 아니다.

## 실제 공통 호출과 부착

원본 `shared/assets/environment/geology-granite-{vertical,vertical-cleft,foundation,ledge-neck}.svg` → 원본 `tools/environment/build-geology-art.mjs` → 등록 어댑터 → canonical Library/공통 lazy bundle 순서다. `shared/build.mjs`가 등록과 원본 `shared/runtime/geology-art.js`를 공통으로 로드한다. Game/Workshop/Playtest가 동일 목록을 사용한다.

12장 배치는 `tools/environment/stage12-quarry-art.mjs:QUARRY_FACE_ATTACHMENTS` → stage.design.space.terrainAttachments → `shared/map/compiler.js:terrainAttachments` → battle.honroTerrainAttachments → 공통 terrain wrapper → `HonroTerrainAttachments.draw` → `HonroElements.draw` → **HonroVectorArt.draw**다. 실제 painter 호출은 checks.json에 기록했다. 원본 GeologyArt의 geologyComposition 인스턴스 경로는 12장에 추가하지 않아 이중으로 그리지 않는다. 별도 stage12 전용 미술 경로나 절대좌표 Path2D 목록이 없다.

| 인스턴스 suffix | 공통 assetId suffix | 실제 host | 원본 edge / along | scale |
|---|---|---|---|---|
| north-foundation | granite-foundation | sq-north-quarry | 3 / .6 | 1.05 |
| north-west | granite-vertical | sq-north-quarry | 1 / .9 | .9 |
| north-crown | granite-vertical-cleft | sq-north-quarry | 5 / .3 | 1 |
| north-toe | granite-ledge-neck | sq-north-quarry | 9 / .35 | .8 |
| back-neck | granite-ledge-neck | sq-back-road | 2 / .25 | 1 |
| cave-buttress | granite-vertical | sq-cave-buttress | boundary 0 / .55 | .85 |
| lower-foundation | granite-foundation | sq-lower-ground | 17 / .935 | 1.1 |
| sign-granite | granite-vertical-cleft | sq-lower-ground | 17 / .05 | 1.05 |
| sign-neck | granite-ledge-neck | sq-lower-ground | 17 / .05 | 1 |

assetId는 모두 `geology:` prefix다. 모든 배율은 원본 범위 내 균일배율이며 회전/비균일 확대/격자/작은 돌 도배를 쓰지 않았다. 배치의 datum·inset·실제 변환 위치는 checks.json의 resolvedAttachments에 있다. 상부는 유한 실제 밑면, 하부는 실제 보행면으로부터의 깊이를 사용한다. 하부 세계 하단32000을 화면용 기반으로 바꾸지 않았다.

비보행 cave-buttress는 실제 ceiling solid라 기존 walk-only 앵커가 거절했다. 공통 anchor.kind='boundary'가 실제 polygon edge를 참조하게 최소 확장했다. kind 미지정은 종전 walk 조건을 유지하고 명시적 walk로 비보행 벽을 참조하면 계속 거절한다. 지형 ID/장 번호 분기를 추가하지 않았다. 실제 solid clip과 보행면 안쪽28world 보호를 유지하며 통로에 그림을 채우지 않는다. asset collision·target·walk edge를 발행하지 않는다.

## 실제 화면 검수

`evidence/shared-geology-attachments/`의 PNG는 실제 local production HTML/Chromium frozen debug scene이다. 새 정상전투 완주 증거가 아니다. before는 깨끗한64e9c8a, final은 깨끗한799f6d26이며 rows가 정확히 같다. final11컷, before11컷을 모두 직접 열었다. pageerror0. 각 capture.json의 오래된 renderSourceSha256 필드는 stage12-quarry-art.js 하나의 해시이므로 실제 변경 소스 해시는 GEOLOGY_ATTACHMENTS.json을 사용한다.

| 화면 | 카메라 x,y / 배율 | 크기 |
|---|---|---|
| upper-normal | 6800,3800 / .65 | 1440×900 |
| sign-normal | 6500,4900 / .65 | 1440×900 |
| center-overview | 6500,4200 / .21176470588235294 실제 최소 | 1440×900 |
| upper-mobile | 6900,3800 / .55 | 390×844 |
| sign-mobile | 6520,4800 / .55 | 390×844 |
| upper-max | 6800,3800 / 1.65 | 1440×900 |
| sign-max | 6520,4900 / 1.65 | 1440×900 |
| carrier-normal | 7850,3550 / .65 | 1440×900 |
| lower-joint | 7340,5170 / .65 | 1440×900 |
| carrier-mobile | 7800,3500 / .55 | 390×844 |
| upper-toe | 8400,4120 / .65 | 1440×900 |

원본 파일명은 `stage12-{화면}.png`다. 1차는 전체/상부 구조, 2차는 길표/하부/수레/턱 접점, 3차는 모바일/확대, 4차는 새 길표 접합 결함을 다뤘다. 세 번이 자동 합격 기준이 아니다. 초반 세 회차는 각11컷 중 각각4/4/5컷을 직접 열었고 4차는4컷 모두 열었다. 정확한 목록은 GEOLOGY_ATTACHMENTS.json에 있다. 작업 중 캡처는 실제 미커밋 변경을 capture.json에 남겼다. 별도 final은 소스 커밋 후11컷을 다시 촬영했다.

1차에서 길표 아래 원본 봉우리가 독립 암체처럼 떠 보였다. 2차에서 위로 묻고 기반을 겹쳤으며 비보행 solid를 연결했다. 3차에서 하부를 옆으로 옮겨도 모바일 큰 어두운 면이 남았다. 4차에서 실제 길표 아래 ledge-neck 하나로 그 면을 나눴으나 밑면이 붙인 조각처럼 보여 최종에서 기존 embedFade180으로 하단을 묻었다. 수레는 before와 final 모두 위쪽 old-road에 가려진 상태다. 기능 좌표나 레이어를 바꾸어 숨기지 않았다.

최종 판단:

- **개선:** 중앙 상부의 큰 빈 띠가 실제 공통 암면의 앞/옆면으로 채워지고, 완결된 바위+소나무 반복이 제거됐다. 상부 발치와 오른쪽 비보행 solid도 같은 자산 팔레트로 이어졌다. 사각 이미지 clip 경계는 없으며 actual solid 외곽과 보행 rim은 유지된다.
- **미충족:** 모바일에서는 native 모듈의 한 큰 면이 화면 대부분을 차지한다. 길표의 목 모듈은 하단 경계가 줄었어도 독립된 돌출 덩어리로 읽힐 위험이 남는다. 넓은 lower-ground와 서쪽 기존 면까지 하나의 지질로 완성한 상태가 아니다. narrow turning-veil의 기존 실제 직사각 실루엣, 수레 가림, 보존한 일부 소나무의 암반 가림도 그대로다.
- 최종 미술 합격·장 개편 완료·배포 가능으로 판정하지 않는다. 이번 범위의 공통 연결과 교정 후보를 부모가 직접 검토해야 한다. 원본 소유권과 native 배율을 넘어 자산을 재제작하거나 다른 실패 재질을 다시 조정하지 않았다.

## 최소 관련 검사와 보존

checks.json은 공통 등록 후3ab07d85와 비교한다. 별도 import-checks.json은 등록 전64e9c8a와도 비교하여 원래 Library와 다른29장 전체 canonical 동일·신규자산5개만 추가를 확인했다. Stage12는 새 시각 목록/출처목록 외 canonical 전체가 동일하다. 물리·서사·동선·편성·이벤트·보상·revision·rooted-pine·수레와 기존 장식 좌표를 보존했다.

컴파일 terrain/worldTerrain/units/heroes/items/markers/route/quarry spec 동일, 실제9개 painter 호출, invalid anchor/scale와 비보행 walk/알 수 없는 kind 거절, snapshot JSON, broken-host 무출력, Canvas/battle purity, 실제 채색 존재와 walk 보호94곳을 확인했다. native clip의 경계 픽셀 중심만 보던 예전 검사는 안티앨리어싱5픽셀을 오류로 잡았다. 픽셀 footprint가 실제 solid와 교차하는지 구분하여 기록했고 완전히 외부인 채색 sample은0이다. 허용 좌표를 밖으로 넓히지 않았다.

매립 cache는 native 반복 검사에서2,852,360bytes/상한16MiB,2개 build 후 재사용이다. 대표1/2/13/15/21/30장 native 정적 픽셀 동일을 확인했으며 전체29장 브라우저 미술 검수라고 주장하지 않는다. author2회 동일성·build가 통과했고 실제 V3 정상 상/하 출구 terminal Continue의 성장·SP·장비·캠페인·전투 상태를 보존했다. 저장 검사 원본은 save.json에 있다. 새로운 이동/전투 완주는 수행하지 않았다.

최초 옛 로컬 서버8872의 empty-response는 새 서버8873으로 복구했다. 자산 등록 metadata 오류는 위 어댑터로 해결했다. 현재 접근 거부·결과 불명 외부 쓰기는 없으며 master/Pages는 부모의 보류 지시와 미술 미충족 때문에 실행하지 않았다.
