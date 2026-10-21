# 12장 기존 공통 자산의 지형 전면 부착 실험 — 미술 불합격

브랜치 `stage/act2-ch12-face-attachments`. 최종 렌더 소스 `b6dcdc11f33fb4dfa34e32d222e077eab9c97d5e`, 실패 재질 비활성화 기준 `8322de2c59061eb6d91214daebae4bb0fadbb15a`. 이번 범위의 구현·검사는 완료했지만 **미술 합격이 아니다**. master/Pages 반영과 13장 착수는 하지 않았다. 2장에서 제작 중인 미승인 공통 절벽/하부 지지/암턱 연결 모듈은 가져오거나 중복 제작하지 않았다.

## 실제 화면 판정

별도 최종 검수는 깨끗한 소스 b6dcdc11의 실제 production HTML/Chromium에서 수행했다. `evidence/terrain-faces/final/capture.json`의 workingTree는 빈 문자열, page error는 0이다. frozen debug scene으로 미술만 확인했으며 정상전투 완료가 아니다. `before/`는8322de2c, `final/`은b6dcdc11이다. 두 묶음의 같은 카메라·화면비·배율 7컷을 모두 직접 열었다.

| 원본 파일명(각 before/final 폴더) | 카메라 x,y | 배율 | viewport |
|---|---|---|---|
| stage12-upper-normal.png | 6800,3800 | .65 | 1440×900 |
| stage12-sign-normal.png | 6500,4900 | .65 | 1440×900 |
| stage12-center-overview.png | 6500,4200 | .21176470588235294(실제 최소) | 1440×900 |
| stage12-upper-mobile.png | 6900,3800 | .55 | 390×844 |
| stage12-sign-mobile.png | 6520,4800 | .55 | 390×844 |
| stage12-upper-max.png | 6800,3800 | 1.65 | 1440×900 |
| stage12-sign-max.png | 6520,4900 | 1.65 | 1440×900 |

실제 비교 기준인 1장 승인본 `51e0b2b290bb787183868853a7e4fa9a503b0288`의 `evidence/common-full/reference/stage01-normal-51e0b2b.png`도 다시 열었다. 승인본에서는 나무가 지표에 서고 바위가 하나의 접촉부를 가지지만, 현재 전면 부착은 소나무를 포함한 완결된 노출암 실루엣이 벽 안에서 반복된다. 공통 자산 사용 사실이 이 차이를 해소하지 않는다.

집중 검수 기록은 `focus1`~`focus5`에 각각 7컷, 그중 일반2·전체1·모바일2의 5컷을 매 회 직접 열었다. 확대2컷은 보관만 했으며 최종 검수에서 별도로 직접 열었다. 초기 캡처는 미커밋 작업 중 화면임을 각 capture.json에 남겼으며 과거 HEAD를 최종 소스처럼 취급하지 않는다.

| 회차 | 직접 확인한 결함과 교정 | 판정 |
|---|---|---|
| focus1 | env:cliff가 독립 세로 탑, 다른 녹색 바위가 떠 있는 소품처럼 보임 | 실패, 후보 제거 |
| focus2 | 탑 제외·하단 매립 후에도 녹색 바위가 암면에 붙인 소품으로 보임 | 실패 |
| focus3 | 기존 회색 화강암/암주로 제한, 독립 암체 반복과 빈 면 잔존 | 실패 |
| focus4 | 하단 합성의 native mask 좌표 결함 수정, 겹치는 기존 room block만 제거 | 실패 |
| focus5 | 다른 높이의 4개 인스턴스로 정리, 반복된 원본 실루엣과 지질 연결 부족 | 실패 |
| 별도 final | 일반/전체/모바일/확대 전후 14컷 확인 | 미술 불합격 유지 |

## 부족한 표현과 후속 공통 모듈 연결 지점

- 중앙 상부의 바위 위쪽과 바위 사이에 넓은 기본 암면 띠가 남는다. 전체 화면에서 원래 판의 바깥 윤곽 위에 독립 암체 몇 개를 붙인 구조가 읽힌다. 기존 valley-granite의 봉우리·소나무가 반복되어 지층의 연속성이 없다. **보행면 아래 어깨에서 내려오는 세로 절벽 면**과 옆 암체에 이어지는 비대칭 측면이 필요하다.
- 길표 아래는 자산의 원래 완결된 암체 하단을 fade로 묻었지만 **아래로 이어지는 지지 암반**을 만들어 주지는 못한다. 지면 깊이가 큰 이 solid는 base datum이 canonical 세계 하단까지 내려가므로 surface anchor+inset를 사용했다. 현 화면은 독립 outcrop을 벽 속에 넣은 인상이며 넓은 빈 면도 남는다.
- 오른쪽 어깨·작은 턱·뒤쪽 경로의 **턱 밑면과 옆벽의 오목한 접합부**는 이 두 기존 자산으로 표현하지 못했다. 연속 암턱 연결 형태가 필요하다. 이 부분을 작은 돌 반복이나 추가 임의 도형으로 메우지 않았다.

후속 공통 모듈은 승인 후 실제 library assetId로 등록되어야 한다. 현재 API는 `reference.bounds/foot/scaleRange`, `terrainId`, 실제 walk edge+along, surface/base datum, inset, uniform scale, solid clip을 지원한다. 특정 장 분기 없이 연결할 수 있다. 지금 만든 경로는 **기술적 연결 후보**이며 새 모듈 또는 12장 미술의 승인 근거가 아니다. 원본 자산 크기 범위를 늘리거나 pending ID를 지어내지 않았다.

## 자산·정의·실제 호출 경로

배치 원본은 `tools/environment/stage12-quarry-art.mjs:QUARRY_FACE_ATTACHMENTS`; canonical 저장 위치는 `shared/data/campaign.json`의 stage12.design.space.terrainAttachments다. stage12 전용 Path2D·forms/exposures/rearFaces를 추가하지 않았다. 실패한 jointed-granite 선택은 제거했으며 그 실패 재질 코드를 계속 조정하지 않았다.

| 실제 assetId | 정의 원본 / 활성 정의 | 최종 painter | 사용 |
|---|---|---|---|
| act1-scene:valley-granite | shared/assets/environment/act1-scene-valley-granite.svg → tools/environment/build-act1-art.mjs → campaign.library | shared/runtime/elements.js draw → shared/map/vector-art.js HonroVectorArt.draw | 북서1.3, 중앙1.55, 길표 아래1.4; 허용 [.5,2.4] |
| act2:rock-column | workshop/recipes/act2-caves.js rock-column → campaign.library | elements.js draw → HonroGeometry.shapes | 북동 발치 .9; 허용 [.4,4] |
| act1-scene:rooted-pine | shared/assets/environment/act1-scene-rooted-pine.svg → build-act1-art.mjs → campaign.library | 기존 landmark → elements.js draw → HonroVectorArt.draw | 기존4개 .69/.77/.7/.52 보존 |

valley-granite 내부의 소나무 역시 원래 SVG 일부다. 전면의 나무를 새로 생성한 것이 아니며, 이 원본 구성 자체가 현재 반복/접지 표현의 한계다. 원본 SVG와 전체 library는 기준8322de2c와 동일하다. 기존 수레·표식·장식·물리 좌표는 이번 범위에서 모두 그대로다.

공통 호출은 `HonroMaps.compile/terrainAttachments` → battle.honroTerrainAttachments → `visual-hierarchy.js` 최종 공통 terrain wrapper → `HonroTerrainAttachments.draw` → 기존 asset painter다. Game/Workshop/Playtest가 같은 runtimeEntries를 사용한다. 단계/지형 이름을 검사하는 common renderer 분기는 없다.

solid와 실제 walking rim의 안쪽28world clip을 함께 적용한다. base는 play projection의 인공 하단이 아닌 canonical world solid를 사용한다. 순수 시각 인스턴스로 asset collision·새 보행면·target을 만들지 않는다. 옵션 replaceBlocks는 같은 host에서 자산의 transformed 범위와 겹치는 기존 room block만 억제한다. embedFade는 원본 그림의 밑부분만 bounded bitmap에서 합성한다. 이미지 원본은 수정하지 않는다. 16MiB LRU와 자산당 최대2M pixels, stable-frame 재사용을 확인했다. native gradient는 device pixel 좌표에서 mask를 생성하도록 고쳤다.

## 보존 검사와 실제 한계

`evidence/terrain-faces/checks.json` 및 build.txt/author.txt/save.json/save.txt에 결과를 보관했다.

- Stage12 canonical에서 새 시각 attachment/출처목록만 제외하면 전체 데이터 동일: 지형·동선·ID·revision·서사·이벤트·보상·기존 모든 장식 동일.
- 컴파일 terrain/worldTerrain/유닛/아이템/영웅/markers/route/quarry spec 동일. 다른29장 canonical 데이터와 library 동일.
- 실제 기존 자산 painter 호출, JSON snapshot, invalid anchor/scale 거절, broken host 무출력, battle/Canvas 상태 purity 통과. 실제 채색 sample이 존재하고 solid 밖 sample0, 보호 walk sample76곳 무채색이다.
- 대표1/2/13/15/21/30장 native 정적 지형·장식 pixel 동일. 다른29장 전체 브라우저 검수라고 확장하지 않는다.
- 실제 V3 상·하 출구 정상승리 저장 Continue의 성장·SP·장비·캠페인·전투 상태가 보존됐다. 기존 live save에 새 시각 attachment를 강제 이관하지 않는다. 이번 시각 연결 작업은 정상전투·이동을 새로 완주하지 않았다.
- build 및 author2회 동일성 통과. 자산 lazy bundle은 원본에서 재생성했다. 활성 chapter별 공통 자산 dependency 재분류로 다른 chapter 생성 bundle명이 바뀌어도 원본 데이터·그림은 바꾸지 않았다.

마지막 read-only 원격 master 관측은 `edf712e910a08d73dd4490dfe017060308bcfa0f`다. 이 후보에는 master 통합을 하지 않았다. 최신 master의 스킬 UI와 다른 작업을 부모가 통합할 때 보존하고 생성물은 재빌드해야 한다. 접근 거부나 대기 중인 외부 쓰기는 없으며, 현재 보류 사유는 **미술 부족과 부모의 통합 보류 지시**다. 소스/원본 PNG SHA256과 직접 열어 본 목록은 FACE_ATTACHMENTS.json에 있다.
