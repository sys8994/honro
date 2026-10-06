# 단일 지형 영역과 내부 플레이 범위

맵 v6부터 지형은 플레이 사각형 안팎을 잇는 하나의 유한 지리다. 공통 소스는 `shared/map/terrain-domain.js`, 활성 데이터는 `shared/data/campaign.json`이다. 1–20장 모두 적용하며 18·19장은 같은 지하 공간과 외곽 윤곽을 공유한다.

## 하나의 원본과 두 투영

- `stage.terrains`의 polygon이 전체 지형의 유일한 형상 원본이다. 원래 단면을 따라 능선·골짜기·동굴 바닥과 천장이 이어진다. 별도 외부 dummybody나 skirt를 덧붙이지 않는다.
- `stage.terrainBounds`는 좌우 6,000, 위아래 24,000 월드 단위 여유를 가진 유한 지리 범위다. 빈 하늘도 이 영역에 포함되며 사각형 전체를 암반으로 채우는 뜻이 아니다.
- `stage.playBounds`는 내부의 `[0,width] × [0,height]`다. width/height는 계속 기존 시뮬레이션 좌표계이며 이동·스폰·탄 수명·낙사·임무의 규칙을 바꾸지 않는다.
- 확장 고체의 `playProjection`은 기존 충돌 여유를 포함한 **스테이지 전체**의 고정 클립 범위와 polygon 시작점을 가진다. 컴파일러는 전체 polygon을 잘라 `battle.terrain`을 만든다. 별도 옛 geometry 복사본을 충돌 원본으로 저장하지 않는다.
- 같은 compiler는 전체 형상을 `battle.honroWorldTerrain`에 스냅샷으로 넣고 공유 Scene이 읽는다. 체력·파괴·동적 요소는 현재 collision과 ID로 연결한다. 12장 낙석 제거처럼 live polygon이 복구되면 같은 지리 함수로 전체 mass를 다시 만들고 저장/재개 뒤에도 유지한다.

`design.space.surfaces[].edgeIndices`와 `honroWalkEdges`는 **플레이 충돌 투영**을 참조한다. 원래 index를 확장된 전체 polygon에 직접 적용하지 않는다. 공통 validator와 ACT2 renderer가 이를 따르며 외부 rim은 전체 polygon의 노출 면에서 얻는다.

135개 기존 collision 객체와 20장 유닛·이벤트·초기 상태·임무·encounter는 변경 전 SHA-256 fixture와 비교한다. 넓은 세계는 추가 이동 공간이나 보상을 의미하지 않으며 기존 높은 곡사탄의 사각형 밖 여유도 유지한다.

## 지하와 열린 입구

바닥과 천장은 같은 지리 흐름을 사용하고 통로를 남긴다. 전체 지하 공간의 암반은 위로 이어진다. 12·13장 입구와 20장 출구의 부분 천장은 유한 산 능선으로 마무리하고 열린 방향을 막지 않는다. 능선 위 하늘에는 지하용 수직 암막을 칠하지 않는다. 닫힌 문·개방 조건·공중 발판·물길·장치는 원래 동작을 유지한다.

## 공통 renderer와 cache

Game·Stage View·Playtest는 동일한 전체 terrain 경로·재질·큰 암면·rim을 쓴다. 새 전투는 generic skirt, legacy cave enclosure, ACT2 enclosure를 호출하지 않는다. 옛 진행 저장만 원래 renderer를 유지한다.

정적 미술은 Play Bounds와 무관한 월드 고정 tile에 캐시한다. 내부 512px와 2px gutter를 사용하며 화면의 실제 정수 픽셀에 맞춘 clip으로 gutter를 정확히 한 번 합성한다. 분수 줌에서도 틈과 중복 alpha를 동시에 방지한다. raster scale은 줌별로 양자화하고 모바일 최대 12개, 데스크톱 24개 tile만 보관한다. 큰 나무·건물은 실제 asset bounds를 scale/rotation/anchor로 변환해 판정한다.

`renderCacheStats().worldBuilds`는 세대 재구축 횟수, `domainTileBuilds`는 실제 tile 생성 횟수다. 팬은 같은 세대를 재사용하고 새 지역에 필요한 tile만 만든다. 보관 메모리는 정해진 개수로 제한한다. Native 테스트/캡처는 각 scene의 canvas 자원을 명시적으로 해제하고 순차 실행한다.

## 이관·편집·저장

기존 진행 전투를 자동 교체하지 않는다. **이어하기는 옛 지형을 유지하고 새 진입/재시도부터 v6가 적용된다.** 기존 저장을 이어 한 화면은 새 지형의 검증 자료가 아니다. 새 battle의 world 스냅샷은 저장/불러오기에서 유지한다. 프로필 schema는 4 그대로다.

옛 v1–v5 Workshop 프로젝트도 자동 확장하지 않는다. v5 이하 클라이언트는 v6를 거절해 확대 polygon을 gameplay collision으로 오인하지 않도록 한다. null/잘못된 projection뿐 아니라 확장 고체에서 projection을 제거한 경우도 거절한다.

`node tools/map-forge/apply-terrain-domain.mjs`는 기존 맵 제작 뒤 실행하는 명시적 전 장 이관이며 idempotent하다. `npm run migrate`의 마지막 단계다. ACT2 recipe는 기존 domain 프로젝트를 재생성하면 domain을 보존한다. Workshop에서 전체 polygon을 편집해도 stage 범위로 collision을 투영하므로 개별 고체의 옛 AABB가 내부 이동/편집을 자르지 않는다. Bounds overlay에서 Play / Camera / Visual / Terrain을 확인한다.

## 검증

- `npm run test:terrain-domain`: 20장/135개 collision 해시, 통로·입구, 이동 범위, 실제 낙석 복구, 새/옛 저장, malformed 입력, Workshop 편집. Native Canvas의 단일 alpha 합성, cache/pan/purity, 키 큰 사물도 검사한다.
- `npm run capture:terrain-domain -- after`: 전 장 좌우·하단·상단·최소 줌 portrait·chamber 120 view. 선택 장 번호를 붙여 범위를 제한할 수 있다. PNG SHA-256, source commit/tree와 실제 project hash를 manifest에 기록한다.
- migration·schema·ACT1/ACT2·환경 검사를 별도로 유지한다. Native Canvas는 브라우저 HUD/입력, 정상 전투 완주, 모바일 GPU 성능 또는 최종 미술 승인을 대신하지 않는다.
