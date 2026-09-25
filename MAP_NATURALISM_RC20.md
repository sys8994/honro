# HONRO Act I RC20 — Stage 1·2 Naturalism Pass

## 핵심 원칙

RC20의 자연스러움은 단순히 노이즈를 많이 넣는 것을 뜻하지 않는다. 큰 지형 구성은 사람이 의도적으로 설계하고, 그 위에 중간/미세 스케일의 불규칙성을 deterministic seed로 추가한다.

1. **Macro form** — 절벽, 계곡, 능선, basin, 거목처럼 공간을 규정하는 큰 덩어리.
2. **Meso form** — 암반 돌출부, 가지, 작은 턱, 물웅덩이, 노출 암반.
3. **Micro detail** — 고밀도 surface node, 작은 요철, 풀·양치·자갈·바위의 불규칙한 분포.
4. **Logical attachment** — 모든 scatter decoration은 support terrain에 종속되고, 허공에 배치하지 않는다.
5. **Material composition** — grass/moss/mud/rock/scree/water는 지면을 따라 생성되는 얕은 material mass이며, 별도의 떠 있는 색칠 polygon이 아니다.
6. **Performance bound** — Canvas filter를 사용하지 않고 draw order, alpha, palette로 depth를 만든다.

## Stage 1 — 오래된 송림 고갯길

### 구조
- 4200×3200.
- `forest-floor` 단일 주 진행 지형은 **216 authored top nodes**를 가진다.
- 큰 오르막의 흐름은 유지하되 여러 주파수의 작은 요철을 합성해 같은 간격의 선분 느낌을 제거했다.
- 진행로 안에 두 개의 고밀도 irregular physical boulder를 배치한다.
- main route는 이 바위들을 정상적인 걷기+점프로 넘어 출구까지 진행 가능하다.

### 거대 고목
- 고목 줄기는 `giantPine` structural background landmark로서 collision이 없다.
- 줄기에서 이어져 보이는 4개의 gameplay branch가 별도 polygon이다.
- `root-step-low → root-step-mid → root-step-high → canopy-root` 순서로 실제 점프 가능하다.
- branch는 파괴 가능하되, 전부 파괴되어도 main ground route는 남는다.

### Material
- grass
- moss
- mud
- exposed rock
- scree
- 실제 depression을 채우는 shallow water pool

Material cap은 support terrain을 다시 sampling해 만들어지므로 지면과 분리되지 않는다. 풀/양치 장식 역시 support-bound scatter다.

### 자연물
- deterministic scattered ancient pine
- fern/scree patches
- irregular rock piles
- 16~18 node physical boulder

무작위처럼 보이지만 동일 seed에서는 항상 동일한 결과가 생성된다.

## Stage 2 — 상여 협곡

### 공간 구성
기존의 하나의 V자 곡선을 폐기하고 세 개의 큰 land mass로 분리한다.

1. `left-high-ground` — 설오 시작 고지
2. `canyon-ground` — 상여가 지나는 넓은 협곡 basin
3. `right-cliff-ground` — 반대편 절벽

전체 authored ground top은 **252 nodes**이며, 설오 시작점과 basin의 고저차는 약 **1802 world units**다.

### 왼쪽 하강
자연물 자체가 이동 경로를 만든다.

`left-high-ground`
→ `left-tree-branch-upper`
→ `left-rock-ledge-1`
→ `left-tree-branch-lower`
→ `left-rock-ledge-2`
→ `canyon-ground`

추상적인 `platform 1/2/3`이 아니라 거대한 고목의 가지와 절벽에 박힌 암반턱으로 구성한다.

### 오른쪽 상승
왼쪽과 대칭으로 만들지 않는다.

`canyon-ground`
→ rock ledge 1~4
→ `right-tree-branch`
→ `right-grass-shelf`

암반 중심의 상승 후 고목 가지를 거쳐 grass shelf에 도착하는 구조다.

### Basin
- support terrain 자체가 depression을 가진다.
- 그 depression에 수평 water surface가 생성된다.
- 물은 blocking solid가 아니다.
- 추후 감전/빙결/증기 같은 environment interaction volume으로 확장할 수 있도록 data layer를 분리한다.

### Material
- exposed rock
- scree
- mud
- moss
- grass
- shallow water

### 자연물 분포
- left/right cliff에 support-bound ancient pine
- basin에 scree, fern, irregular rock pile
- embedded high-node boulder
- 두 개의 large ravine pine은 structural-back layer로 배치

## Rendering / Layer Contract

아래 순서를 유지한다.

1. far sky / distant ridge
2. distant forest / cliff
3. `back` scenery — 낮은 alpha
4. `structural-back` — 거대 고목/협곡 나무
5. physical terrain
6. attached material caps
7. prop / interactive terrain
8. characters / projectile / VFX
9. front atmosphere

Canvas `filter`는 사용하지 않는다.

## Editor 방향

RC20 generator는 미래 맵에디터의 brush로 확장할 수 있다.

- irregular boulder brush
- support-bound foliage scatter
- material patch brush
- water depression + level brush
- giant tree + branch topology prefab
- cliff mass + ledge prefab

랜덤값은 seed 기반이므로 에디터 저장/재생산이 가능하다.
