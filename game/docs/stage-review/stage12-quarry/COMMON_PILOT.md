# 12장 중앙 구간 공통 미술 연결 — 내부 비교용

**완성본/미술 합격이 아니다.** 부모가 이 구간을 확인하기 전 전체 확장·master 통합·Pages 배포·13장 진행을 하지 않는다. 기준 V3는 `8a494854cbb54451491c6f556fc8b577816b57ef`, 이번 실행/최종 캡처 소스는 `d2dce0b9b22175c62605a5cf35c3f771374fdbbe`다. 브랜치는 `stage/act2-ch12-common-pilot`이다.

## 적용한 체크아웃 기준과 증거

이번 작업에서 [.agents/skills/honro-environment/SKILL.md](../../../../.agents/skills/honro-environment/SKILL.md), [STAGE_PRODUCTION_SOP.md](../../STAGE_PRODUCTION_SOP.md), [MAP_ART_PIPELINE.md](../../MAP_ART_PIPELINE.md), [ENVIRONMENT_INVENTORY.md](../../ENVIRONMENT_INVENTORY.md), `shared/runtime/map-art-polish.js`를 실제로 읽었다.

| 적용 기준 | 이 변경에서 확인한 증거 |
| --- | --- |
| 환경 스킬의 “승인된 기존 벡터 지형·공통 에셋”과 SOP의 “공유 assetId·재질·조합” | 기존 `builtin:ravinePine`, `act2:rock-bank`를 같은 ID로 직접 참조한다. 새 에셋 생성/이름 변경/Library 정의 변경이 없다. `checks/checks.json`의 `libraryExact:true`와 실제 호출 기록을 참조한다. |
| 환경 스킬의 Canvas 공통 렌더러, MAP_ART_PIPELINE의 장별 복사 패스 금지 | 선택한 중앙 지형은 캡처 전부터 존재하던 `HonroAct2SpatialArt.terrain()`으로 직접 복귀한다. 새 암면 Path2D를 공통 파일로 옮기거나 추가하지 않았다. 호출 관찰은 `commonTerrainCalls`에 있다. |
| 환경 스킬의 L1-back·접지·scaleRange·고정 월드 좌표 | 두 장식은 L1/back, 동일 x와 support를 유지한다. 소나무 scale0.48, 작은 돌 scale1은 원래 범위 안이다. 돌은 reference.foot.y=52.43421719246703을 보정하여 실제 밑점이 원래 기반 y4670에 닿게 했다. 비균일 늘림·줌별 위치 조작은 없다. |
| 단일 canonical polygon·경계 보존 | V3 terrain/초기상태/동선/행위자/사건/보상/카메라 등 물리/기획 필드와 컴파일 terrain/worldTerrain/units가 동일하다. terrain SHA256은 `5032b7a5537faacc5079ccae97d1aed2b59ab9715b94078e265ccbbb64de39e9`다. |
| 실제 화면 직접 확인·렌더 연결과 개편 합격 구별 | 일반/최대확대/모바일/주변 문맥의 동일 카메라 전후8컷과 탈락 중간4컷을 모두 직접 열었다. 평탄한 큰 면과 비교 마스크 경계를 남은 문제로 기록한다. 전체 장 합격으로 처리하지 않는다. |

## 범위와 실제 호출 경로

내부 비교 창은 월드 x5700–7100 / y4250–6800이다. `sq-lower-ground`, `sq-inner-joint`만 이 창 안에서 공통 지형으로 그린다. 같은 창의 후면 모암 `sq-art-recessed-mother-rock`은 전용 `rearFaces`를 그리지 않아 원경과 통과 공간이 보인다. 인접 북쪽 상부 암반, 길표, 다른 소나무, 적 미술은 V3를 유지한다.

`shared/runtime/stage12-quarry-art.js`의 변경은 이 선택 창의 **클립/기존 렌더 호출**이다. 직사각형 Path2D는 두 기존 그리기 경로를 선택하는 마스크이며 암반 도형·충돌체가 아니다. 비교 창 밖은 V3, 안은 공통 경로이므로 화면에 수직 경계가 보인다. 이를 자연스러운 지질 접점이나 완료된 장소로 주장하지 않는다.

| 대상 | 기존 공통 정의 | 최종 실제 호출 |
| --- | --- | --- |
| 중앙 지형 | `shared/runtime/art-dark.js`의 `Scene.prototype.terrain`; `shared/runtime/act2-spatial-art.js`의 `prepareTerrain()`/`terrain()` | 12장 선택 창 → 저장해 둔 원래 `Scene.terrain` 체인 → `art-dark.js`의 active 판정 → `HonroAct2SpatialArt.terrain(c,t,b)`. 테스트에서 `sq-lower-ground`, `sq-inner-joint` 호출을 직접 관찰했다. 전용 `forms/exposures`는 이 두 지형의 창 안에 그려지지 않는다. |
| `builtin:ravinePine` | 활성 `shared/data/campaign.json`의 `library[id='builtin:ravinePine']`: `renderer:'landmark',kind:'ravinePine'`. 원래 ID 작성은 `migration/migrate-stages.mjs`의 builtin 등록부. | `shared/map/compiler.js:compile()` → native landmark(kind=ravinePine,size=.48) → `Scene.landmark` → `shared/runtime/map-art-polish.js:drawSpecial()` → `ravinePineInk()`. 기존 `sq-art-bent-waymark-pine` ID와 지지 좌표를 유지한다. |
| `act2:rock-bank` | 활성 `shared/data/campaign.json`의 `library[id='act2:rock-bank']`: 기존 visual polygon2개, collision0. 현 체크아웃에서 별도 생성 함수는 찾지 못했으며 활성 정본 정의를 그대로 참조한다. | `compile()` → canonical-element → `shared/runtime/elements.js:draw()` → `HonroGeometry.shapes(asset,instance)` → 공통 polygon/gradient 그리기. 테스트에서 `act2:rock-bank`의 실제 shapes 호출을 직접 관찰했다. 기존 `sq-art-natural-stone-3` ID/x/support를 유지한다. |

선택/저작 입력은 `tools/environment/stage12-common-pilot.mjs`다. 그림 생성 함수는 없으며 기존 에셋 ID/scale/접지/선택 창만 지정한다. `apply-stage12-quarry.mjs`의 author가 이 비교 메타데이터를 발견할 때 같은 참조를 다시 적용하여 V3 전용 소나무로 되돌리지 않는다.

## 직접 본 결과와 한계

1. 첫 공통 바위 후보 `act1-scene:valley-granite`는 활성 정의와 `tools/environment/build-act1-art.mjs`/`shared/assets/environment/act1-scene-valley-granite.svg` 연결을 확인했다. 원래 scaleRange 최소0.5로 배치해도 발치 폭이 약585으로, 좁은 중앙 어깨에 비해 넓어 일부가 뜨는 것을 실제 화면에서 확인했다. 이 후보를 폐기하고 `interim-granite-rejected/`에 중간4컷을 보존했다. 축소 범위를 벗어나거나 지형을 바꿔 끼워 맞추지 않았다.
2. 최종은 크기가 맞는 기존 `act2:rock-bank` 한 개와 `builtin:ravinePine` 한 그루다. 소형 바위를 복제해 넓은 면을 메우지 않았다.
3. 공통 지형 렌더는 실제 V3 윤곽과 보행 테두리를 그리지만 일반 거리에서 넓은 어두운 면이 남는다. 비교 창의 수직 경계도 보인다. 검토한 공통 landmark 후보 중 이 큰 다층 암반 전체에 맞는 표현은 확인하지 못했다. 기존 공통 렌더의 큰 면 구성이 부족하다는 결과를 새 임의 도형으로 대신하지 않았다. 이 결과를 미술 통과나 전체 장 복원 완료로 제출하지 않는다.
4. 일반/최대확대에서 카메라 위로 나가는 수관은 주변 문맥/모바일에서 함께 확인했다. 대상은 실제 공통 수관·줄기이며 장별 소나무 생성 함수의 이름만 바꾼 것이 아니다. 인물/적/길표 테두리는 유지되지만 전체 장소의 최종 가독성은 미판정이다.

## 같은 카메라의 원본

`evidence/common-pilot/` 기준. before는 보류된 로컬 병합 트리10d7442d의 V3 빌드이며 내용은 8a494854와 동일하다. 동일한 V3 baseline 서버의 체크아웃에서 다시 촬영하여 capture metadata도10d7442d의 깨끗한 상태로 기록했고, 먼저 직접 연 baseline4컷과 PNG 바이트가 정확히 같음을 확인했다. after-final은 d2dce0b9의 깨끗한 체크아웃에서 촬영했다. PNG 편집/생성/합성은 하지 않았다. 원본 크기·카메라·SHA256은 `COMMON_PILOT.json`에 있다.

| 화면 | 카메라/배율/viewport | V3 | 공통 연결 |
| --- | --- | --- | --- |
| 일반 | (6400,4800) / .65 / 1440×900 | [원본](evidence/common-pilot/before/stage12-central-normal.png) | [교정](evidence/common-pilot/after-final/stage12-central-normal.png) |
| 최대확대 | (6210,4500) / 1.65 / 1440×900 | [원본](evidence/common-pilot/before/stage12-central-max.png) | [교정](evidence/common-pilot/after-final/stage12-central-max.png) |
| 모바일 | (6300,4600) / .55 / 390×844 | [원본](evidence/common-pilot/before/stage12-central-mobile.png) | [교정](evidence/common-pilot/after-final/stage12-central-mobile.png) |
| 주변 문맥 | (6400,4800) / .4 / 1440×900 | [원본](evidence/common-pilot/before/stage12-central-context.png) | [교정](evidence/common-pilot/after-final/stage12-central-context.png) |

## 확인한 범위

- `tests/stage12-common-pilot.mjs`: Library/다른29장/물리·동선·초기상태·이벤트·보상 동일성, 컴파일 물리 동일성, 공통 terrain/shapes 실제 호출, native ravinePine 분기, scaleRange, Canvas transform/alpha 및 battle 무변형 통과.
- `tests/stage12-common-pilot-save.mjs`: 실제 V3 A/B terminal 저장을 그대로 Continue하며 terrain/worldTerrain/units/heroes/items/스토리/선택 출구/revision을 보존했다. 같은 map revision=1이며 구전투를 폐기하지 않는다. 새 비교 그림은 새 전투의 metadata에 적용되며, 기존 V3 진행 저장은 원래 그림도 보존한다.
- author2회 전체 동일성, 원본 build, production 브라우저 pageerror0, 동일 카메라 전후 검수 통과. 이번은 렌더 연결 확인으로, 정상 자원 완주를 새로 실행했다고 주장하지 않는다. 이전 정상 승리 원본은 그대로 보존한다.

master와 보류된 로컬 병합10d7442d는 건드리지 않았다. 새 기능/공통 자산 제작이나 전체 화면 확장은 부모의 구간 확인 뒤 별도 범위로 결정한다.
