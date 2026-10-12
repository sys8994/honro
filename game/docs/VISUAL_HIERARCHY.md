# 게임플레이와 배경의 시각 위계

## 공통 계약

`shared/map/visual-style.js`의 STYLE이 강도의 단일 기준이다. 모든 맵의 Game, Stage View, Playtest는 같은 번들을 쓴다. L1은 실제 월드와 같은 투영, L2→L4는 먼 유한 풍경, SKY는 가장 먼 파노라마다. `back`, `prop`, `structural-back` 등은 그리기 순서이며 상호작용 여부가 아니다.

- 실제 지형·충돌 건축물·사건/상호작용 사물·캐릭터는 원래 채도와 읽을 수 있는 윤곽을 유지한다.
- 장식에는 외곽선, 기와/판재/암면의 얇은 내부 선을 두지 않는다. 넓은 명암면은 유지한다. 선 자체가 나무 줄기나 지지대 몸체인 기존 native 그림은 채움 리본으로 보존한다.
- 채도만 거리별로 줄인다. RGB 휘도와 알파를 보존하며 형태, 충돌, 퀘스트, 캐릭터, 광원 배치, 밤톤은 수정하지 않는다. 화면 전체나 캐릭터에 채도 필터를 적용하지 않는다.
- 충돌 여부는 실제 collisionIds/자산 충돌/terrain 연결을 우선한다. marker/objective 연결과 현재 전용 bell/cargo/ferry/mechanism 계약은 명시적으로 유지한다. `collisionSource: authored-stage-terrain`만으로 게임 사물이라고 추정하지 않는다. support/grounding 정보만 있는 지지대도 충돌 사물이 아니다.

## 경로와 캐시

최종 `visual-hierarchy.js` 훅이 스테이지별 landmark/background override 이후 의미 스타일을 선택한다. elements와 vector-art 경로는 같은 정책을 쓰며 기존 저장/사용자 맵에도 적용된다. 환경 support/placement는 실제 group 깊이로 스타일을 대체한다. SKY SVG/벡터는 초기 이미지/래스터 작성 때만 처리한다. 승인 원본의 path/node/transform은 변경하지 않는다.

팔레트 변환, context facade, 굵은 재질 리본과 SVG 이미지 보정은 캐시한다. 화면·월드 타일 키에 시각 정책 버전을 포함하고 화면 캐시 작성 context도 원래의 역할을 이어받는다. 매 프레임 픽셀 읽기·필터·벡터 재작성은 하지 않는다. 배경 안에서 그리던 실제 매달린 목표/단서와 environmentTone의 목표 안내는 장식 처리에서 제외한다.

## 검증

`node tests/visual-hierarchy.mjs`는 의미 분류, 깊이별 채도와 휘도/알파, native/벡터 외곽·내부 선, 재질 리본, 스타일 누수 방지와 공통 번들 적용을 검사한다. `tests/terrain-readability.mjs`는 노출 충돌 합집합/보행선/one-way/파괴·근사 hitbox 예외를 계속 소유한다. `tests/static-screen-cache.mjs`는 생산 Scene의 픽셀 동일성과 캐시 무효화를 검사한다.

`HONRO_VISUAL_LABEL=before|after node --expose-gc tests/visual-hierarchy-native.mjs`는 fc7c8eb 렌더 소스와 새 렌더 소스를 같은 현재 맵·카메라·시각에서 비교한다. 산출물은 `_local/reports/visual-hierarchy/`이며 실제 브라우저 조작이나 FPS 검증을 대신하지 않는다. 전체 스테이지 의미 분류/자산 커버리지와 실제 Game·Workshop 확대/축소·이동·동작을 별도로 확인한다.
