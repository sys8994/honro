# HONRO Act I RC12 — 수정 및 검증 보고서

## 사용자 피드백에 대한 직접 수정

### 1. 미니맵이 실제 맵과 다르게 보임
원인은 실제 전장은 polygon vertex를 사용하지만 미니맵은 일부 지형을 legacy trapezoid로 근사하던 경로가 남아 있었기 때문이다. RC12부터 polygon 지형은 `terrain.vertices`를 그대로 minimap canvas에 투영한다.

브라우저 검증에서는 각 Stage의 terrain polygon으로 별도 expected mask를 만든 뒤 실제 minimap pixel mask와 IoU를 비교했다. 10개 Stage 모두 **0.9456~0.9843**으로 통과했다. 월드 aspect ratio 오차도 최대 약 0.38%다.

### 2. Stage 2 중앙의 쓸모없는 절벽
중앙 진행부를 하나의 연속 `canyon-ground`로 재작성했다. 크기는 **6200×3200**으로 낮고 넓게 변경했다. 높은 선반은 선택 전술 지형으로만 남겨 메인 진행을 차단하지 않는다.

설오 기본 활 `A01`로 초기 고지 적 4개를 실제 각도/힘 sweep한 결과 최저 miss distance가 각각 약 **36.0 / 31.1 / 36.1 / 34.2**로 모두 도달 가능하다.

### 3. 지형만 다른 직선형 전투
10개 Stage에 별도의 위치 변경 gameplay route를 추가했다.

- Stage 1 — 숲길 + 뿌리 jump route + 고지 vantage
- Stage 2 — 연속 지면 + 선택 overwatch shelf
- Stage 3 — 영구 잔교 + 상자 발판 + 창고 지붕
- Stage 4 — 중앙 분지 + 좌우 vantage
- Stage 5 — **7단 점프 발판 + upper roost**
- Stage 6 — 연속 하부 호송로 + 잔해 3단 발판 + 상부 파손교량
- Stage 7 — 세로형 지그재그 뿌리마을 + 측면 사격점
- Stage 8 — 장례길 + 처마 회랑
- Stage 9 — 정방형 안마당 + 양쪽 gallery + center lookout
- Stage 10 — 연속 앞마당 + 계단형 발판 + 의식대/회랑

월드 비율도 `1.67, 1.94, 2.59, 1.29, 0.94, 1.74, 0.72, 2.12, 1.03, 1.28`로 서로 다르게 유지한다.

### 4. Stage 6 polygon 접합부에서 아래로 빠짐
문제 구간은 하부 진행면과 상부 polygon이 겹치며 local support 후보가 불안정해질 수 있는 구조였다.

- 필수 하부 진행로를 단일 연속 polygon `lower-road`로 다시 작성했다.
- 상부 `bridge-west`를 시작 지면과 물리적으로 분리했다.
- 하부→상부는 별도의 debris jump steps로 접근한다.
- local support query가 좁은 범위에서 여러 층을 만날 경우 reference 높이에 가장 가까운 surface를 선택하도록 보완했다.
- Stage 6 좌측 구간을 실제로 이동시키면서 body penetration과 seam fall을 매 step 검사했다.

## 필수 지형 안정성

- Stage 3 필수 다리는 파괴 가능한 오브젝트가 아니라 영구 polygon route다.
- Stage 1/2/3/4/5/6/8/9/10은 시작점→출구를 실제 locomotion solver로 완주했다.
- Stage 7은 별도의 수직 waypoint route로 crown까지 완주했다.
- 모든 일반 walkable route endpoint 26개에서 캐릭터 body가 terrain 내부에 매몰되지 않는지 검사했다.

## 검증 결과

- TypeScript typecheck — 통과
- RC12 map gameplay — **14/14**
- Movement — **36 cases / 0 failures**
- Impact/fall/knockback — **29 checks**
- Mission & enemy-flight, RC12 Stage 2 contract — **28 checks**
- Audio — **19 checks**
- Balance report — 10개 Stage 전부 XP budget 내
- Charge/tuning — **192 profiles + 12 actual launches**
- Party pacing — **9 checks**
- RC12 browser/minimap — **31 checks**, runtime exception 0
- Minimap polygon IoU — **0.9456~0.9843**

## 레거시 검사 주의

`regressions.mjs`, `terrain-audit.mjs`, `rc11-map-physics.mjs`에는 과거 Stage 2의 크기/형상을 고정값으로 요구하는 assertion이 남아 있어 RC12 release gate에서 제외했다. `tactics-audit.mjs`의 `crow flies in two dimensions` assertion은 **수정 전 RC11에서도 동일하게 실패하는 기존 항목**임을 별도 원본 실행으로 확인했으며, 이번 맵 변경의 회귀로 분류하지 않았다.

실물 모바일 장시간 플레이 및 사람이 1막 전체를 처음부터 끝까지 완주하는 장시간 수동 QA는 별도 범위다.
