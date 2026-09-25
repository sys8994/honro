# HONRO ACT 1 RC15 — Stage 1·2 Micro Terrain Rework

## 목표
RC14에서 미달했던 핵심 요구를 release gate로 고정했다.

- Stage 1/2 메인 지형 vertex 수를 RC13 대비 최소 5배 이상 유지
- 고해상도 geometry를 물리 문제 때문에 다시 단순화하지 않음
- macro / meso / micro 형태를 함께 구성
- earth / rock / root-wood / shallow water / moss / scree를 실제 장면에서 사용
- 배경에 far/mid/same-depth/foreground atmosphere 레이어를 추가
- 수직 선택 루트를 실제 점프로 검증

## Stage 1 — 짙은 송림 고갯길
- 4200 × 3200
- 메인 지면: 91 authored top nodes
- RC13 baseline 10 nodes 대비 9.1×
- 오르막 메인 루트 + 3단 root route + 암반 vantage
- surface layer: moss 34 nodes / shallow-water 32 nodes / exposed-rock 32 nodes
- 5~10배 신장의 ancient pine landmark를 반복 배치
- 큰 소나무 수관, 뿌리, 바위면, 양치류를 same-depth noninteractive scenery로 보강

## Stage 2 — 상여를 굽어보는 절벽 협곡
- 4300 × 4000
- 메인 지면: 103 authored top nodes
- RC13 baseline 13 nodes 대비 7.9×
- U자 협곡 바닥 + 5단 rock climb + upper shelf
- 보조 지형까지 authored top nodes 208
- surface layer: shallow-water 44 nodes / scree 34 nodes
- high shelf의 rock cover와 절벽 소나무를 이용한 원거리 사격 포지션

## 렌더링
- `surfaceZones`는 gameplay collision과 분리된 same-distance terrain material layer다.
- shallow water는 얕은 수면/반사 리플만 그리며 캐릭터 이동을 막지 않는다.
- background는 기존 layer 위에 ancient pine canopy / ravine cliff mass / same-depth silhouette을 추가했다.
- terrain material은 earth / rock / wood / water 별로 표면선과 micro-mark를 다르게 그린다.

## 검증
- Stage 1 start → exit 보행 통과
- Stage 2 start → exit 보행 통과
- Stage 1 root-step-low → mid → high 실제 점프 통과
- Stage 2 climb-1 → 2 → 3 → 4 → 5 → mid-shelf 실제 점프 통과
- Stage 2 high-roost 실제 기본 활 사거리 유지
- browser runtime exception 0
