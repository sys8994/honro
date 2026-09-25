# HONRO Act I RC19 — Stage 1~4 Terrain Composition

## 설계 원칙

RC19의 목적은 terrain 위에 색 polygon을 덧칠하는 것이 아니라, **재질·장식·상호작용 지형이 하나의 논리적인 공간을 구성하도록 만드는 것**이다.

### 1. Support-bound material

`materialBands`와 `waterPools`는 `(x,y)`로 직접 배치하지 않는다. 지정된 물리 지형의 실제 surface를 다시 샘플링한 뒤 그 위에 geometry를 생성한다.

- grass / moss — 지표면을 따라 material mass가 형성되고 grass blade는 surface normal 방향으로 자람
- rock / scree / gravel — 지표면 아래 일정 깊이까지 재질 덩어리로 표현
- mud / charred soil — 별도의 흙 재질 덩어리
- shallow water — 실제 함몰된 ground 위에 수평 수면을 생성. 통과 가능하며 blocking terrain이 아님

즉 지면과 material 사이에 떠 있는 간격이 생기지 않는다.

### 2. Decoration / gameplay 분리

Scene order:

1. far background
2. `back` landmark — 큰 나무, 암벽, 건물 등 비상호작용 장식
3. physical terrain
4. support-bound material surface
5. `prop` landmark — 수레, 사당, 문 등 같은 거리의 비상호작용 소품
6. character / projectile / VFX

`back`은 alpha 0.52, `prop`은 0.76으로 낮춰 물리 지형과 구분한다. Canvas `filter`는 사용하지 않는다.

### 3. Stage 1 — giant pine + destructible branch route

기존 공중 root platform을 제거했다.

- giant pine trunk: background landmark, collision 없음
- `root-step-low`, `root-step-mid`, `root-step-high`, `canopy-root`: 실제 줄기에서 뻗는 branch polygon
- branch HP: 390~430, 파괴 가능
- one-way platform이라 아래 main path를 막지 않음
- branch가 전부 파괴되어도 main uphill route로 완주 가능

Terrain composition:

- forest grass
- moss bank
- shallow creek
- mud path
- exposed rock
- scree ridge
- upper grass

### 4. Stage 2 — cliff material + basin water

기존 stepped canyon topology는 유지하면서 material composition을 물리 지형에 맞춰 다시 생성한다.

- left high perch: grass + exposed rock
- descent / basin edge: scree
- basin: mud + shallow water
- right ascent: exposed rock
- upper shelf: moss

5-step climb과 upper shelf 사격 루트는 그대로 실제 물리로 연결된다.

### 5. Stage 3 — ferry terrain

- west bank: grass
- approach: mud
- basin: shallow water
- east bank: scree + exposed rock
- cargo yard: gravel
- warehouse approach: stone road

필수 잔교 3개는 indestructible terrain. 창고의 optional high route는 cargo scaffold를 배경 구조로 추가해 기존 floating-platform 인상을 줄였다.

### 6. Stage 4 — refugee gate terrain

- gate approach: stone road
- cart choke: mud
- burned village center: charred soil
- east slope: dry grass
- watch approach: exposed rock
- exit edge: grass

서쪽/동쪽 방어 고지는 실제 점프 체인으로 유지한다. 벽·수레·불탄 집·감시대는 support terrain에 종속된 장식이다.

## 성능 원칙

RC17에서 발생했던 Canvas `filter` 회귀는 금지한다. material rendering은 fill / stroke / alpha만 사용하고, Stage 1~4는 브라우저 성능 gate를 통과해야 한다.
