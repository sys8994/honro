# HONRO Act I RC11 — Map Design Contract

RC11의 맵 설계 기준은 **멋있어 보이는 지형보다 먼저, 실제로 놀 수 있는 공간**이다. 모든 geometry는 다음 네 질문을 통과해야 한다.

1. 플레이어가 그 표면에 올라갔을 때 이동·점프·공격이 모두 가능한가?
2. 목표까지 가는 필수 경로가 파괴되거나 영구히 차단될 수 있는가?
3. 이 지형은 포격 전투에서 실제 다른 판단을 만드는가?
4. 다른 스테이지의 실루엣·aspect ratio와 충분히 구별되는가?

## Stage 1 — 젖은 숲길과 뿌리 아치

- 낮은 main forest floor.
- 별도 lookout rock에는 까마귀/박쥐가 있어 기본 지상 군집과 사격 우선순위가 갈린다.
- 수레는 cover 역할만 하며 main path를 끊지 않는다.

## Stage 2 — 상여 위의 넓어진 협곡

- 5600×3600으로 재설계.
- 좌측 설오 능선, 낮은 basin road, 중간 높이의 독립 roost, 우측 절벽으로 구성.
- 지나치게 높은 적 배치를 제거했다.
- roost 적 4기는 실제 A01 trajectory sweep에서 모두 맞출 수 있다.

## Stage 3 — 나루터와 물 위의 잔교

- 가장 넓고 낮은 전장 중 하나.
- west bank → bridge west → islet → bridge east → east bank라는 공간 문법.
- 두 bridge는 progression geometry이므로 파괴 불가능.
- 물가 섬 위 공중군과 창고 주변 전열을 서로 다른 각도로 처리한다.

## Stage 4 — 피란문 삼방향 분지

- 중앙 분지 + 서쪽 shoulder + 동쪽 watch.
- 파괴 가능한 refugee cart는 cover일 뿐 route가 아니다.
- 문 앞 돌진군, 수레 pocket, 높은 watch crossfire가 분리되어 있다.

## Stage 5 — 폭포 장막과 동굴 사격창

- 4300×4600의 거의 세로형 전장.
- valley floor / archer step / hidden ledge / upper roost / polygon cave roof.
- 담허의 위치 유지가 실제 projectile blocker 개방 조건.
- 설오의 사격은 열린 window를 통과해야 cleat에 damage가 들어간다.

## Stage 6 — 끊어진 다리의 위아래 두 전장

- 필수 이동은 continuous lower road.
- 상부의 west/mid/east bridge fragments는 combat geometry이며 하부 길을 파괴하지 않는다.
- 교각 아래 swarm과 상부 roost가 동시에 다른 사격 해법을 요구한다.

## Stage 7 — 거목 뿌리 수직마을

- 3600×5000, width보다 height가 큰 전장.
- 4개의 생활층과 3개의 연결 ramp를 zig-zag로 오른다.
- 주민 위치와 enemy pocket을 분리해 구조 중 광역기 오발을 줄인다.

## Stage 8 — 돌아오는 빈 상여

- 8200×3000의 매우 긴 행렬형 전장.
- west/east binding과 boss 접근로가 긴 거리에서 순차적으로 열린다.
- 결박 오브젝트는 route를 가로막지 않는 one-way contact로 둔다.

## Stage 9 — 바람 없는 닫힌 안마당

- 3400×3200의 압축된 courtyard.
- 두 receiver와 중앙 well pocket이 가까워 전투 순서 자체가 핵심이다.
- west/east gallery는 공중/원거리 적의 별도 위치를 만든다.

## Stage 10 — 소단, 놓지 못한 밤

- 중앙 ritual hill을 **continuous walk-grade polygon**으로 만들었다.
- 올라갈 수 없는 vertical step을 제거.
- main slope 최대값 0.60.
- 좌우 gallery는 보조 fire position이고 진행 자체는 outer yard만으로 가능하다.

## Physics rule

필수 진행 geometry는 `indestructible`이거나 main solid mass의 일부다. 파괴 가능한 geometry는 반드시 cover / optional tactical object에 한정한다. Renderer, body collision, projectile collision, minimap은 같은 polygon document를 읽는다.
