# HONRO RC17 — Stage 1 / 2 Micro Design

## Stage 1 — 고목과 물길을 지나는 송림 고갯길

### 공간 phase
1. **고목 들머리** — 낮고 넓은 흙길. 거대한 송림은 back layer.
2. **개울 함몰부** — 길이 실제로 아래로 꺼지고 shallow-water surface가 등장.
3. **첫 오르막** — mud track을 따라 높이가 빠르게 상승.
4. **제단/돌무더기 terrace** — 잠깐 평평해져 전투 호흡을 끊음.
5. **암반 상승부** — exposed rock + root 3단 선택 루트.
6. **상부 뿌리/능선** — canopy root와 upper ridge를 타면 고지 적을 먼저 공격 가능.

### terrain material
- moss
- shallow-water
- mud-track
- exposed-rock
- scree

### z-order
- ancient pine / cliff face / fern / scree: `back`
- fallen tree / spirit knot / old gate: `mid`
- collision terrain / roots / rock shelves: full-opacity gameplay layer

## Stage 2 — 상여를 내려다보는 층절벽 협곡

### 공간 phase
1. **설오 전용 high perch** — basin과 물리적으로 분리된 `left-high-ground`.
2. **descent 1~4** — 네 개의 실제 rock ledge를 차례로 내려갈 수 있음.
3. **상여 basin** — 넓은 하부 road, mud + shallow water 구간.
4. **우측 rock slope** — exposed rock/scree 지형.
5. **climb 1~5** — 반대편 절벽을 실제 점프로 상승.
6. **mid-shelf / roost** — 높은 날짐승 둥지와 cover rock.

### gameplay
- 높은 곳에서 곡사 지원을 유지할 수도 있고 직접 내려가 사거리를 줄일 수도 있음.
- basin에서 싸운 뒤 우측 cliff climb으로 높은 둥지를 근거리에서 제거할 수 있음.
- Stage 2 main silhouette은 더 이상 하나의 연속 V/cos curve가 아님.

### terrain material
- exposed-rock
- scree
- mud-track
- shallow-water
- moss

## 정량 detail

- Stage 1 main ground nodes: 109
- Stage 2 ground nodes: 111 total (`left-high-ground` + `canyon-ground`)
- Stage 2 descent: 4 physical ledges
- Stage 2 ascent: 5 physical ledges + high shelf
