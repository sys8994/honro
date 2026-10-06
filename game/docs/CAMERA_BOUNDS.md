# 플레이 영역·카메라 중심·시각 영역

현재 맵 v6의 지형·충돌·cache·이관 계약은 [단일 지형 영역](TERRAIN_DOMAIN.md)을 따른다. 아래 skirt 조사는 이전 구현의 원인과 옛 저장 호환 기록이다. 새 전투는 canonical polygon을 안팎에 같은 renderer로 그리며 별도 skirt를 사용하지 않는다. 카메라/줌 수식은 유지한다.

공통 기준은 `shared/map/bounds.js`의 `HonroBounds`다. 기존 엔진의 오른쪽 +X, 아래 +Y를 유지한다. 요청서의 높이 Z는 여기서 Y다. Game·Stage View·Playtest 모두 같은 Scene과 렌더러를 사용한다.

## 조사 결과

이전 `Scene.zoom()`의 하한은 화면 비율과 무관한 `0.16`이었다. 맵 너비·높이로 하한을 계산하는 식은 없었다. 따라서 너비 390 화면은 가로 2,437.5, 너비 1440 화면은 가로 9,000 월드 단위를 보았다. 별도로 `HonroCamera.axis()`는 viewport 전체를 맵 내부에 넣고, viewport가 맵보다 큰 축은 카메라를 중앙에 고정했다.

`Scene.outsideTerrain()`은 모든 맵의 좌우를 반복되는 완만한 평지로 연장하고 아래를 단색 사각형으로 채웠다. 이것은 애초부터 `b.terrain`에 들어가지 않는 시각 전용 처리였다. 활성 10개 맵의 collision terrain에는 카메라 확대용 더미가 없었다. 실제 바닥·절벽·발판을 삭제하지 않고 이 렌더링 우회를 제거했다.

## 세 영역의 계약

| 영역 | 소스 | 용도 |
|---|---|---|
| Play Bounds | `play(source)` = `[0,width] × [0,height]` | 기존 유닛 이동·스폰·임무·충돌 좌표계. 시각 처리로 확장하지 않는다. |
| Camera Focus Bounds | `focus(source)` | viewport 크기와 무관하게 카메라 중심만 제한. 기본은 플레이 범위에 공통 여유를 더한다. |
| Visual Bounds | `visual(source,w,h,zoom)` | 최소 줌·화면 비율·focus 범위로 계산한 렌더링 여유. 충돌·저장 지형이 아니다. |

선택 필드 `stage.camera.focusBounds = {left,top,right,bottom}`로 초점 범위를 작성한다. 유한하며 Play Bounds를 포함해야 한다. 컴파일 시 `battle.honroCamera`로 복사한다. 없는 옛 맵·전투는 자신의 width/height에서 기본값을 계산하며 저장 자체를 변경하지 않는다. 스키마 v4의 선택적 추가로, Workshop `stage.update`와 export/import를 지원한다.

위쪽 focus 여유는 기존 고각탄의 상단 영역도 볼 수 있도록 둔다. 이것은 투사체 소멸 경계가 아니다. 예측·실탄·충돌·사거리·낙사·자동 추적은 기존 엔진을 유지한다. manual pan, 발사탄 추적, 대사 카메라의 소유권도 유지한다. 추가 자동 조준 framing은 도입하지 않았다.

## 전술 줌과 시각 여유

`HonroBounds.POLICY`가 유일한 기본 설정이다. 화면 크기는 CSS pixel이고 단일 배율 `screen = world × zoom`을 쓴다.

```
tacticalMin = viewportWidth / desiredTacticalWorldWidth
readabilityMin = minActorScreenHeight / smallestActorWorldHeight
minZoom = min(maxZoom, max(tacticalMin, readabilityMin))
visualMarginX = viewportWidth / (2 × minZoom) + overscanMargin
visualMarginY = viewportHeight / (2 × minZoom) + overscanMargin
```

가로 목표 6,800, 가장 작은 일반 적의 높이 기준 66, 최소 식별 높이 3.75px, 최대 확대 1.65다. 생사·증원 때 줌 하한이 튀지 않도록 고정된 일반 적 기준을 쓴다. 극단적인 축소 화면에서는 배우가 작게 보이므로 전투 중에는 다시 확대할 수 있다.

기존 4,200 제한은 기본 화살의 정점(가로 약 2,087)과 배우 7px 식별을 근거로 둔 값이었다. 그러나 지형을 뺀 완충 예측에서 설오의 A01 사거리는 약 4,952, A02·A14는 약 5,325–5,327이므로 전체 사격 구간을 한 화면에서 보기에는 부족했다. 이번 6,800 목표는 그 긴 사거리와 양쪽 여유를 포함한다. 자동 추적·수동 이동 및 투사체 물리는 바꾸지 않았다.

너비 1440·844·390에서 최저 줌의 가로 시야는 6,800이다. 너비 320에서는 식별성 제한으로 약 5,632가 되어 위 긴 사격 예측 거리보다 넓다. 화면 높이는 줌 식에 들어가지 않는다. 회전·resize는 가로 world span을 유지하고 새 화면의 식별 범위로 제한한다. X/Y 비등방 확대는 없다.

시각 여유는 위 margin을 focus 영역 바깥에 더해 계산한다. Workshop은 전체를 검토하기 위한 기존 0.05 검사 줌을 유지하며, 더 축소하면 실제 배율에 맞게 coverage를 넓힌다. 같은 렌더러를 사용하고 Playtest는 게임 전술 줌을 적용한다. `Bounds` 토글은 Play / Camera focus / 게임 최소 줌 Visual 영역을 구별한다. 맵마다 margin 표를 만들지 않는다.

## 이전 저장의 지하 암반과 경계

`shared/runtime/terrain-skirt.js`는 실제 지형의 맵 하단 단면과 좌우 경계에 닿는 기저 암반을 읽는다. 좌우는 끝의 높이와 안쪽 표면 기울기를 이어받아 완만한 산비탈·큰 능선으로 연장한다. 모든 끝을 절벽으로 떨어뜨리지 않는다. 바깥으로 갈수록 기울기를 완화하고 낮은 대비·안개로 멀어지게 하며, 표면은 고정 월드 좌표여서 pan/resize 때 출렁이지 않는다. 사용자는 작업 도중 전장이 절벽 꼭대기에 고립되어 보이는 처리를 피하고 지형 연장을 선호한다고 명시했다.

연장부와 지하 암반은 Path2D로 캐시하고 `HonroTerrainPalette`를 공유한다. 얇은 겹침으로 래스터 캐시의 안티앨리어싱 틈을 막는다. 큰 암면과 깊어지는 먹빛으로 아래를 연결하며 공중 발판 사이의 통로는 채우지 않는다. 빈 맵에는 연장 지형이 없다. 이것은 시각 전용 연장이며 걸어갈 수 있는 신규 지형과 구분한다.

SKY SVG·미세 시차·밤톤과 L1–L4 투영은 유지한다. 암반은 배경 위, 캐릭터·탄·조준선 뒤에 그린다. terrain·collision index·AI 경로·물·저장 데이터를 추가하지 않는다. 캐시는 sceneVersion·terrain 참조·coverage가 바뀔 때 재생성하며 pan 때 경로 수나 캐시 크기가 늘어나지 않는다.

## 전체 맵 검토

| 장 | Play 크기 | 크기 판단 |
|---|---|---|
| 1 | 5400 × 2200 | 기존 4200에서 동쪽 1200 추가. 마지막 사슴 전투용 분지와 출구 능선. |
| 2 | 4300 × 3300 | 양측 고지와 호송로의 수직·수평 교전 거리 유지. |
| 3 | 6500 × 3100 | 긴 나루·창고 경로의 가로 거리 유지. |
| 4 | 4600 × 3500 | 피란문·양측 방어 고지의 지원 거리 유지. |
| 5 | 4400 × 4700 | 진 유지와 상부 고지 공략이 중심인 수직 맵 유지. |
| 6 | 6600 × 3800 | 호송로와 상부 교량의 긴 교전 구간 유지. |
| 7 | 3600 × 5000 | 좁고 높은 지그재그·주민 구조 동선 유지. |
| 8 | 7200 × 3400 | 이미 긴 상여 길·처마 경로 유지. |
| 9 | 3600 × 3500 | 의도적인 소형 방어 마당과 세 높이의 교차사격 유지. |
| 10 | 5000 × 3900 | 중앙 보스와 양측 회랑의 협력 방어 거리 유지. |

1장은 `workshop/recipes/stage12-forest-basin.js`에서 재현한다. 기존 `forest-floor`와 두 가지·바위는 보존하며 `ridge-east-extension` 실제 ground 한 개를 추가한다. 마지막 사슴 x=4780, 고개 문·출구 x=5210으로 옮긴다. 초반 적·나무꾼·회복·이벤트·보상 수치는 유지한다. 새 시작·재시도에는 새 맵을 쓰고 진행 중인 4200 폭의 옛 전투는 옛 지형·출구로 끝낸다.

## 검증

- `npm run test:camera`: 수식·범위·이관·원본 충돌 불변, 1장 왕복·승리·긴 곡사, 전 맵 × 4 viewport의 wheel·center·coverage·캐시, pan·pinch·회전, 옛 1장 저장, 탄 추적·편집기/Playtest. 기준 데이터는 `tests/fixtures/camera-bounds-baseline.json`이다.
- `python -X utf8 tests/camera-bounds-performance.py`: 다른 브라우저 검사 없이 최소 줌으로 pan하며 경로 캐시·terrain node 불변·렌더 시간을 확인한다.
- migration·integration·environment·전체 verify도 실행하고 결과와 한계를 BUG_LOG에 남긴다.

화면과 수치는 `_local/reports/camera-bounds/index.html`에서 본다. 수동 캠페인 완주와 실제 모바일 GPU 측정은 별도다.

## 짧은 가로 화면의 자동 추적

`HonroCamera.followY`는 기존 몸 높이 두 배의 위쪽 오프셋을 화면 높이 28% 이내로 제한한다. 너비/높이 변경 시 자동 추적은 일시정지의 dt=0에서도 새 세로 구도를 적용한다. 너비 기반 줌 보존·최소 전술 줌, 수동 팬, 이야기/목표/투사체의 카메라 소유권은 바꾸지 않는다. `npm run test:camera-follow`는 네이티브 Canvas 회귀이며 실제 브라우저 레이아웃 검사는 별도다. HBUG-087에 실제 공개 빌드 재현과 한계를 기록했다.
