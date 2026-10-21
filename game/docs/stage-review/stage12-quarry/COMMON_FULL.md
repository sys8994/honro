# 12장 전체 공통 렌더 연결 — 내부 비교 후보, 미술 미충족

**미술 합격/완성본이 아니다.** 부모의 보류 지시를 유지한다. master 통합·Pages 요청·13장 진행 없음. 실행 소스는 `0e585709bf8c17bf2b98904060aa40378f816b16`, 브랜치는 `stage/act2-ch12-common-full`이다. 데이터 기준 V3는 `8a494854cbb54451491c6f556fc8b577816b57ef`다.

## 승인 기준과 적용 범위

부모가 지정한 `51e0b2b290bb787183868853a7e4fa9a503b0288`의 `game/docs/stage-review/stage01-positioning/evidence/refined-final/stage01-normal.png`를 Git에서 그대로 추출해 직접 열었다. 원본 사본은 [reference/stage01-normal-51e0b2b.png](evidence/common-full/reference/stage01-normal-51e0b2b.png)다. 이미지 지형 시절 화면을 기준으로 사용하지 않았다. 승인본은 인물 높이 대비 약5–7배의 나무, 몸통·가지가 받치는 덩어리 수관, 바위 앞/옆면·바닥 접촉을 보여 준다. 현재 공통 나무는 크기가 비슷해도 이 수관 밀도와 지지 구조에는 미달한다.

pilot의 직사각 선택 창을 없애고 V3의 12개 지형 전체를 기존 공통 렌더 경로로 되돌렸다. `shared/runtime/stage12-quarry-art.js`의 forms/exposures/rearFaces·terrain/landmark/sky 덮어쓰기와 전용 소나무 생성을 제거했다. 해당 파일에는 기존 서사 신발만 남는다. 전용 함수를 공통 파일로 옮기거나 이름을 바꾼 것이 아니다. `tools/environment/stage12-quarry-art.mjs`도 이제 기존 assetId·scale·foot 보정만 지정하며 그림 경로를 생성하지 않는다.

V3 지형, 이동/사격 경계, 배우·38명 편성, 스토리·이벤트·보상·출구, revision1과 기존 환경/원경은 동일하다. 장식의 원래 지지 좌표를 유지하되 공통 자산의 reference.foot 차이에 맞춰 원점을 보정했다. 새 지형·암반 그림·소나무·이미지는 제작하지 않았다. 통과 공간을 가짜 후면 모암으로 덮던 장식 `sq-art-recessed-mother-rock` 하나는 퇴역했다. 물리 ID는 제거하지 않았다.

## 읽은 기준과 실제 증거

[체크아웃 환경 스킬](../../../../.agents/skills/honro-environment/SKILL.md), [SOP](../../STAGE_PRODUCTION_SOP.md), [MAP_ART_PIPELINE](../../MAP_ART_PIPELINE.md), [ENVIRONMENT_INVENTORY](../../ENVIRONMENT_INVENTORY.md), `map-art-polish.js`를 실제로 읽고 적용했다.

| 기준 | 이번 변경과 증거 |
| --- | --- |
| 승인된 기존 공통 assetId, 장별 복사 패스 금지 | 활성 Library 정의는 V3와 정확히 동일. 새 이름·새 도형 정의 없음. 전체 지형의 실제 `HonroAct2SpatialArt.terrain` 호출12개, 공통 polygon 호출9개를 [checks.json](evidence/common-full/checks/checks.json)에 기록했다. |
| 단일 canonical polygon, 표시와 충돌의 같은 지리 | terrain SHA256 `5032b7a5537faacc5079ccae97d1aed2b59ab9715b94078e265ccbbb64de39e9`. 데이터 및 컴파일 terrain/worldTerrain/units/markers/steps/routeSpec/quarrySpec/revision이 V3와 동일하다. |
| L1-back, 접지, 원래 크기 범위 | 기존 장식 지지점과 non-art element를 대조. 각 자산 foot을 회전/크기 변환한 실제 위치가 원래 support.x/y와 일치한다. 전부 기존 scaleRange 안이며 비균일 늘림 없음. 수레만 기존 경사0.504165961479153rad로 회전한다. |
| 큰 실루엣·중간 형태·광원, 잔돌 반복 금지 | 기존6개 자연석과 운반 잔석1개만 공통 rock-bank로 교체. 빈 암면을 메우는 추가 복제 없음. 거대한 빈 면이 남으므로 이 기준은 **미충족**이다. |
| 나무 지지·바위 앞/옆면, 실제 화면 직접 확인 | 아래3회 집중 검수 및 별도 최종8컷을 전부 직접 열었다. 얇은 수관·바위 면 분리·수레 가림을 실패로 기록했다. 자동 검사 수로 합격시키지 않는다. |
| 벡터 근경+기존 이미지 원경 | `shared/assets/environment/campaign-far/manifest.json`의 stage12 valleyFar→`../painted-pilots/stage2-wet-valley.webp`, enclosed→cave-entrance 유지. `shared/runtime/authored-far-art.js`의 공통 로딩/표시 경로를 변경하지 않았다. |

## 실제 공통 정의와 호출 경로

활성 정의는 모두 `shared/data/campaign.json`의 `library[id]`다. `builtin:*` 최초 등록은 `migration/migrate-stages.mjs`이며 이것을 신규 저작 원본으로 쓰지 않았다. act2 rock 및 cart의 별도 현행 생성기는 확인하지 못했다. 활성 정본 polygon을 그대로 참조한다.

| assetId | 기존 정의·선택 | 실제 최종 경로 |
| --- | --- | --- |
| `builtin:ravinePine` | 중앙 bent-waymark .48, 서쪽 western .49 | `shared/map/compiler.js:compile()` → native landmark(kind=ravinePine) → `Scene.landmark` → `shared/runtime/map-art-polish.js:drawSpecial()` → 기존 `ravinePineInk()` |
| `builtin:ancientPine` | old-road 2.4, rear-root 1.6 | 같은 native 경로 → `drawSpecial()` ancientPine 분기 → 내부 .48 scale의 기존 `pine()` |
| `builtin:receiverStone` | 기존 길표 ID, scale1.8, 기존 상호작용/이벤트 연결 유지 | 같은 native 경로 → `drawSpecial()` → `stone(c,'receiverStone')`. 각인·다른 돌과 구별되지만 원래 기울어진 겹길표 형상은 보존하지 못한다. |
| `cart` | abandoned-cart scale1.6, collision0, 기존3개 visual polygon | compile canonical-element → `shared/runtime/elements.js:draw()` → 기존 Act2Spatial/Vector 분기 비대상 → `HonroGeometry.shapes()` → 공통 polygon/stroke 그리기. 테스트에서 실제 cart shapes 호출 확인. |
| `act2:rock-column` | remaining-pillar scale.4, collision0 | 같은 canonical-element 경로. 실제 shapes 호출 확인. |
| `act2:rock-bank` | carrier-rubble1.6, natural-stone-0..5 각1.4/1.25/1.4/1/1.15/1.25, collision0 | 같은 canonical-element 경로. 실제7개 shapes 호출 확인. 원래 접점 유지. |
| 전체12개 지형 | 기존 V3 polygon, 신규 자산 없음 | 기존 `Scene.terrain` 체인 → `shared/runtime/art-dark.js` active 분기 → `shared/runtime/act2-spatial-art.js:terrain()`/`prepareTerrain()`. ceiling은 기존 Act2/cave-enclosure 체인을 거쳐 같은 공통 painter 사용. `terrain-readability.js`도 기존 공통 실행; stage12 omitReadability는 항상 false. |

현재 stage12 elements16개 중 공유 신규 참조14개, 기존 공통 opening1개, 미충족 tools1개다. 상세 인스턴스 ID/원점/scale/지지점은 [COMMON_FULL.json](COMMON_FULL.json)에 전부 있다. `builtin:cliffFace`와 `builtin:refugeeCarts`는 등록 ID만으로 적합한 실제 전용 그리기 경로를 입증하지 못해 사용하지 않았다. `act1-scene:valley-granite`는 pilot에서 최소 크기로도 좁은 턱에 뜬 결과를 확인했으므로 재사용하지 않았다. 이 큰 지형을 적절히 감쌀 공통 대형 암면 자산은 확인하지 못했다. 임의 도형으로 대체하지 않았다.

미충족 예외: `sq-art-cutting-tools`는 맞는 공통 쓰러진 곡괭이 자산을 찾지 못해 `stage12:quarry-fallen-cutting-tools` 그대로다. 서사 진행으로 나타나는 신발도 기존 전용 그림이다. 기능을 없애거나 다른 물건으로 바꾸지 않았다. 예전 stage12 Library 정의는 구저장 호환 때문에 보존했으며 현재 새 전투에서는 위 tools 이외에 참조하지 않는다.

## 집중 검수3회와 최종 판정

모든 이미지는 실제 프로덕션 HTML의 Chromium 캡처 원본이며 합성/편집 없음. 디버그 시작 전투를 정지해 보는 화면 검사이고 이동·전투 완주 증거가 아니다. 일반0.65/수레0.8, 최대1.65, 최소0.21176470588235294, 모바일390×844 및844×390. 정확한 카메라는 각 폴더 capture.json에 있다.

1. **전체 구조** — `focus1-structure/` 서·중앙·동쪽 최소 줌3컷을 직접 열었다. 393f87ee 위 미커밋 전체 공통 복귀 상태다. 비교 창 경계는 없어졌다. 중앙 상부와 서쪽 거대한 암면은 비어 있고 독립 부유 암체로 읽힌다. 실패. 이후 지형에 장식을 덧그리지 않았다.
2. **디테일·인물 대비** — `focus2-assets/` 중앙/시작4인/수레/서쪽4컷을 직접 열었다. 같은 미커밋 상태에서 중앙·서쪽 나무를 ancientPine에서 같은 높이의 ravinePine으로 바꾸고 수레를 원래 경사에 맞춘 마지막 재확인본이다. 수관 윤곽은 더 불규칙해졌지만 승인1장보다 빈약하다. 공통 수레는 인접 잔석과 위 지형에 가려 갈색 면만 드러난다. 앞/옆면과 접촉 그림자도 승인본보다 약하다. 실패.
3. **카메라·모바일** — `focus3-camera/` 최종 소스0e585709에서 최대/중앙 세로/길표 뒤 가로/서쪽 세로4컷을 직접 열었다. 모바일 길표 글자와 상호작용 링·플레이 경계는 구별되지만 암면이 화면 대부분을 점유한다. 공통 나무 일부 수관/가지 연결도 얇다. 미술 실패.
4. **별도 최종 종합** — clean0e585709의 `final/`8컷 및 같은 카메라/배율의 `before-v3/`8컷을 모두 직접 열었다. before checkout은 보류된 로컬10d7442d이며 Git tree가 V3 8a494854와 `344c6754db949ab3dcf2a2c2e20bdadf73d8e6ce`로 정확히 같다. 두 capture.json rows는 일치하고 브라우저 pageerror는0이다. 전용 덧그리기 제거와 공통 연결은 확인. 승인본 대비 전체 미술은 **불합격·미완료**.

정확한 실패 구간은 `sq-north-quarry` x5320–8652.5/y3310–4470, `sq-lower-ground` 길표 아래 x5740–7140/y4800 이후의 거대한 빈 면, `sq-west-quarry` 앞/옆면 분리 부족, `sq-back-road` x7110–8937.5/y4270–4840의 딱딱한 수직면/작은 턱, x7730 수레 가림이다. 전용 가짜 후면을 제거하여 통로는 보이지만 공간적 지지까지 해결됐다고 주장하지 않는다.

## 제한된 검증과 구저장

`tests/stage12-common-full.mjs`는 데이터·컴파일 물리 동일성, 타29장/Library 동일성, 실제 common dispatch, foot 접점, 렌더 상태/transform/alpha 순수성을 통과했다. `tests/stage12-author-preservation.mjs`는 author2회 완전 동일, `npm run build` 성공. 실행 로그는 `checks/`다. 새 PNG·자동검사 숫자를 정상 승리나 미술 합격으로 해석하지 않는다. 기존 정상 A/B 승리·13장 전환 증거는 V3 자료에 그대로 있다. 이번에는 전투·전체 이동 검사를 재실행하지 않았다.

기존 `tests/stage12-common-pilot-save.mjs`로 실제 V3 A/B terminal 구저장 Continue만 확인했다. terrain/worldTerrain/units/heroes/items/state/routeChoice/revision 보존. 새 승리를 만들거나 자원을 강제하지 않았다. **같은 revision의 구전투는 embedded landmark/asset 스냅샷도 보존하므로 새 공통 장식이 소급 적용되지 않는다.** 전용 renderer는 제거됐지만 구전투의 기존 장식 정의를 새 참조로 치환하는 migration은 이번에 추가하지 않았다. 새 화면 증거는 현행 canonical map으로 새로 시작한 전투다. 구저장까지 공통 장식 복원이 끝났다고 주장하지 않는다.

현재 실제 차단 동작 없음. V3 비교용 이전 로컬 서버8856이 ERR_EMPTY_RESPONSE를 반환하여 동일 clean checkout의8861 서버로 읽기만 재개했다. 원격 master는 마지막 조회 ee73add57bc27357abdbe2d1c606c9017e393351. master/Pages에 쓰지 않았으며, 이전 Pages/Actions API Forbidden을 재시도하거나 우회하지 않았다. 소스와 이 증거만 작업 브랜치에 저장한다. 부모의 픽셀 확인 전 전체 미술 합격 처리·배포·13장 재개는 하지 않는다.

## 바로 여는 비교

| 화면 | V3 원본 | 공통 연결 최종 |
| --- | --- | --- |
| 중앙 전체 | [before](evidence/common-full/before-v3/stage12-center-overview.png) | [final](evidence/common-full/final/stage12-center-overview.png) |
| 길표·중앙 일반 | [before](evidence/common-full/before-v3/stage12-central-normal.png) | [final](evidence/common-full/final/stage12-central-normal.png) |
| 나무와 시작4인 | [before](evidence/common-full/before-v3/stage12-old-road-party.png) | [final](evidence/common-full/final/stage12-old-road-party.png) |
| 수레 가림 | [before](evidence/common-full/before-v3/stage12-carrier-cart.png) | [final](evidence/common-full/final/stage12-carrier-cart.png) |
| 중앙 최대 | [before](evidence/common-full/before-v3/stage12-central-max.png) | [final](evidence/common-full/final/stage12-central-max.png) |
| 중앙 모바일 | [before](evidence/common-full/before-v3/stage12-central-mobile.png) | [final](evidence/common-full/final/stage12-central-mobile.png) |

28개 원본 PNG의 SHA256과 소스 상태/카메라는 COMMON_FULL.json에 있다.
