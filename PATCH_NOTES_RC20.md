# HONRO Act I RC20

## Stage 1·2 Naturalism Pass

- Stage 1 main ground: 216 authored top nodes
- Stage 2 authored ground masses: 252 top nodes total
- deterministic high-density scenery generator 추가
- support-bound material patch generator 추가
- irregular high-node boulder primitive 추가
- shallow water를 실제 depression + horizontal surface로 표현
- Stage 1 거대 고목의 장식 trunk + 파괴 가능한 branch polygon 구성
- Stage 2를 left high cliff / basin / right cliff의 3 mass 구조로 전면 변경
- Stage 2 왼쪽 자연 하강 route: tree branch + rock ledge
- Stage 2 오른쪽 비대칭 상승 route: rock ledges + tree branch + grass shelf
- structural-back / back / terrain / prop 레이어 분리 강화
- Canvas filter 금지 유지
- save/map revision 20으로 갱신

## 검증

- RC20 map audit: 13/13 PASS
- RC20 browser acceptance: 10/10 PASS
- Performance:
  - Stage 1: 23 renders/s, launch ~130 ms
  - Stage 2: 45 renders/s, launch ~88 ms
  - Stage 3 regression: 53 renders/s
- impact/fall/knockback: 29 checks PASS
- audio: 19 checks PASS
- RC13 balance audit: PASS
- tuning: 192 profiles + 12 actual launches PASS
- party pacing: 9 checks PASS
