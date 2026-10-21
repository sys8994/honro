# 12장 old-road 공통 암반 연결 후보

구현 소스 `7ad53ad74aabbaa8c0aa13859cf1c08288a7392a`, 브랜치 `stage/act2-ch12-old-road-material`, 기준c7adfd9a. **오른쪽 상단의 단순 회색 판 인상을 인접한 공통 암반 표현으로 교정했다.** 부모가 인정한 수레·길표·후방 지지·서쪽/상하 접합은 보존했다. master/Pages/13장은 보류하며 부모 최종 픽셀 판정을 기다린다.

## 변경 범위와 실제 공통 호출

`tools/environment/stage12-quarry-art.mjs:QUARRY_FACE_ATTACHMENTS`에 sq-old-road 전면 참조3개만 추가했다. 실제 canonical edge/밑면을 기준으로 기존 공통 원본을 uniform scale로 삽입하고 원래 solid 내부에서 clip한다. 장 전용 도형·새 원본·이미지·소나무·작은 노이즈를 추가하지 않았다. 실패색면옵션은 계속 비활성이다.

| 인스턴스 | 실제 assetId | 실제 edge/along | scale / base inset |
|---|---|---|---|
| quarry-face-old-road-west | geology:granite-foundation |1 / .8|.95 /80|
| quarry-face-old-road-crown | geology:granite-vertical |4 / .9|.85 /120|
| quarry-face-old-road-east | geology:granite-vertical-cleft |6 / .65|.9 /70|

모두 기존 native 허용 배율 안이다. `stage.design.space.terrainAttachments` → 기존 compiler → HonroTerrainAttachments → 기존 HonroElements/VectorArt painter로 그린다. 공통 geology SVG/builder/renderer와 단일 수레 painter/metadata는 c7adfd9a와 동일하다. 보행면·polygon·충돌·기능 좌표·카메라·수레/잔석 접지·열린 통로를 바꾸지 않았다. 기본 면과 겹치는 기존 room block만 종전 opt-in 경로가 처리한다.

전체 프로젝트 비교에서 이3개 시각 참조와 artAssetIds 출처목록 외에는 **전체 데이터가 동일**하다(scope.json). 다른29장, Library, 기존10개 전면 참조, 후방3개와 기존 모든 요소/대사/이벤트/보상/revision이 그대로다. latest master bafc275c 및 다른 브랜치의2/5/11·스킬·카메라·적 통합 작업은 fetch/merge하지 않았다. 이후 부모가 최신 master를 보존해 source 기준으로 통합·재빌드해야 한다.

## 확인한 rim 결함과 최소 공통 수정

초기 그림 검수 후 native 검사에서 sq-old-road의 **x11450,y2541.130174408446** 보호점이255alpha로 칠해지는 실패를 확인했다(rim-before.txt). 실제 충돌은11200에서 투영되지만 공통 terrain painter는 바깥 표시 지형의 rim을 이어 그리고, attachment clip은 physical walk 정점만 알고 있었다.

`shared/runtime/elements.js:terrainFaceClip`에서 honroDomain의 범위 밖 표시 surface edge도 같은28world 보호에 포함했다. 물리나 표시 외곽을 바꾼 수정이 아니며 새 rim도 그리지 않는다. 장/지형 ID 분기 없이 기존 common surfaceEdges를 사용한다. 이 코드는 terrainAttachments가 있는 opt-in 경로에서만 사용된다. 검사 기준은 유지하고 실패 메시지에 위치만 추가했다.

수정 후 old-road 실제 채색sample1207, solid 외부0, 보호 rim28점 무채색, battle/Canvas purity와 기존 cache 재사용/한도 검사가 통과했다. 본 후보의 비선택 대표6장 native 정적 픽셀도 c7adfd9a와 같다. 이 검사는 최신 bafc275c 전체 브랜치에 대한 검사가 아니다. 검사 수로 미술 합격을 대신하지 않는다.

## 실제 화면

`evidence/old-road-material/`에 before/focus/final 각9컷, 원본 PNG27장을 저장했다. before의4컷, 초기 focus4컷, 별도 final9컷을 직접 열었다. 처음 focus는 미커밋3개 배치이며 표시 연장 rim 보호 실패가 남아 있던 증거다. final은 수정·검사 후 깨끗한7ad53ad7에서 촬영했고 pageerror0이다. source SHA/해시/실제 PNG 크기/직접 열어 본 목록은 OLD_ROAD_MATERIAL.json에 있다.

| 최종 핵심 파일 | 카메라 x,y / 배율 | viewport |
|---|---|---|
| stage12-center-overview.png |6500,4200 / 실제 최소 .21176470588235294|1440×900|
| stage12-old-road-normal.png |9250,3000 / .65|1440×900|
| stage12-old-road-east.png |10800,2850 / .55|1440×900|
| stage12-carrier-mobile.png |7800,3500 / .55|390×844|

before/final9개 카메라 rows는 정확히 같다. old-road 일반/동쪽에서 넓은 앞·옆면이 주변과 같은 조형으로 이어지고 원래 보행 rim과 인물은 선명하다. 수레 일반/근접/모바일에서는 빈 짐칸·차대·바퀴·손잡이가 유지되며 위 지형의 가림도 같은 외곽에서 발생한다. 새로운 밟는 턱이나 통로를 채우는 solid 그림을 만들지 않았다. 길표 모바일·서쪽·상하 접합3화면은 수정 전과 **PNG 바이트 동일**하다(unchanged-views.json).

요청한 국소 재질 연결을 교정한 후보로 판정한다. 큰 암면 크기 자체를 새 실패 이유로 삼거나 전체 지형을 재설계하지 않았다. 전체 stage12 최종 수용과 master 배포 승인은 부모에게 남긴다.

## 재현과 저장 보존

`HONRO_FACE_BASELINE=c7adfd9a620810788fe4ea1cfe0d2af65a367a79 node tests/terrain-face-attachments.mjs`로 실제 공통 호출/clip/보행 보호/캐시/순수성/관련 정적 회귀를 확인했다. 컴파일 terrain/worldTerrain/units/heroes/items/markers/기믹/route/revision 동일, author2회와 build도 통과했다. 원본 render-checks.json·author.txt·final-build.txt를 보관했다.

실제 기존 상/하 정상승리 저장 Continue는 terrain/worldTerrain/units/heroes/items/state/route/revision 및 landmarks/elements까지 동일하다(save-checks.json). 구저장 전투를 강제 이관하지 않았고 성장·SP·장비·정상 완주를 재작성하지 않았다. 이번 작업은 새 완주/발사/강제 자원/적 삭제를 하지 않았다. 접근 거부나 결과 불명 쓰기는 없으며 master 보류는 부모 지시다.
