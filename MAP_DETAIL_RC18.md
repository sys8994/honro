# HONRO RC18 — Stage 3/4 Map Design

## Stage 3 — 물안개 나루와 잠긴 잔교

공간은 `높은 제방 → 진흙 내리막 → 얕은 물 basin → 영구 잔교 → 동쪽 상승지 → 창고 지붕`으로 읽히도록 설계했다.

- main ground: 96 top nodes
- optional terrain: 74 top nodes
- visible surface nodes: 398
- terrain types: moss / mud-track / shallow-water / scree / exposed-rock
- permanent dock: dock-west / dock-mid / dock-east (indestructible)
- vertical route: ground → cargo-step-1 → cargo-step-2 → warehouse-roof
- encounter logic: dock pack / water flock / warehouse core

필수 진행은 얕은 물과 지면을 따라 계속 가능하고, 잔교와 창고 지붕은 선택 사격점이다. 다리는 필수 통로이면서 파괴 가능한 오브젝트가 되지 않도록 indestructible terrain으로 유지했다.

## Stage 4 — 연목 피란문과 세 갈래 방어선

공간은 `성문 앞 석로 → 배수로 하강 → 중앙 수레 분지 → 불탄 마을 경계 → 동쪽 감시대 상승`으로 나눴다.

- main ground: 91 top nodes
- optional terrain: 54 top nodes
- visible surface nodes: 292
- terrain types: stone-road / mud-track / charred-soil / dry-grass / exposed-rock
- west high route: west-step-1 → west-step-2 → west-shoulder
- east high route: east-step-1 → east-step-2 → east-watch
- encounter logic: gate pressure / cart pocket / watch crossfire

마을문과 성벽은 배경, 실제 이동 가능한 둔덕/발판은 전면 terrain으로 구분했다. 피란 수레는 시각적 landmark로만 남겨 필수 진행을 막지 않는다.

## Shared rendering rules

- back landmarks render behind collision terrain
- mid landmarks render after terrain
- no Canvas `filter` usage
- surface variety is non-blocking overlay; collision geometry remains stable
- scenery is anchored to a valid support terrain
