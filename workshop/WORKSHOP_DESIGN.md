# HONRO Map Workshop v2 — UX / Cowork Design

> V2의 UX 기록입니다. 현재 runtime·Playtest·schema 결정은 루트 [ARCHITECTURE.md](../ARCHITECTURE.md)를 우선합니다.

## 목표

사람은 큰 형태와 미술 구도를 빠르게 만든다. AI agent는 같은 editor command API로 디테일링·배치·검증·이벤트를 이어서 작업한다.

## 사람 중심 편집 원칙

### Click what you see
- Element Editor: polygon 내부 클릭 → polygon 선택, drag → polygon 전체 이동
- Stage Editor: terrain body / element / unit / event 클릭 → 선택 및 drag
- node handle은 직접 drag
- Ctrl+node drag → grid snap

### Place once, return to Select
Asset / Unit / Event를 한 번 배치하면 자동으로 Select로 돌아간다. 반복 배치가 필요하면 다시 palette에서 선택한다.

### Grid is optional precision
Grid는 시각적 가이드이며 Ctrl을 누르고 drag할 때만 강제 snap한다. Grid size는 inspector에서 수정 가능하다.

## Geometry modes

### Ground Pen
surface만 freehand로 그리고 아래를 solid로 자동 채운다. 가장 빠른 기본 지형 제작 방식.

### Solid Polygon
동굴/overhang/천장/벽처럼 Ground로 표현할 수 없는 구조를 closed polygon으로 직접 작성한다.

### Element Polygon
한 element에 여러 visual polygon을 추가할 수 있다. Collision은 visual과 동기화하거나 별도로 발전 가능하다.

## Performance principle

Authoring complexity와 runtime draw complexity를 분리한다.

- Control points: 사람이 다루는 macro geometry
- Derived nodes: runtime/export geometry
- Optimize ε: derived node를 비파괴 단순화
- Adaptive LOD: zoom-out draw만 임시 단순화

실제 HONRO의 현재 줌아웃 병목은 background/landmark vector redraw이므로, node optimizer만으로 본게임 성능 문제가 전부 해결되는 것은 아니다.

## AI Cowork

AI는 raw JSON을 임의 편집하지 않고 command set을 생성한다.
Preview → Apply/Discard 흐름을 기본으로 하며, 모든 변경은 Undo history에 들어간다.
