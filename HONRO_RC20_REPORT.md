# HONRO RC20 — Stage 1·2 Naturalism Rebuild

## 목적

Stage 1·2를 “논리적으로 배치된 기능적 맵”에서 더 나아가, **고밀도 geometry와 비주기적 자연물 분포를 가진 자연스러운 한국형 다크 판타지 지형**으로 다시 설계했다.

## Stage 1

- `forest-floor`: **216 top nodes**
- deterministic scatter: **34개**
- surface material zones: **19개**
- irregular physical boulder: **2개**, 각각 16~18 vertices
- 거대 고목 trunk는 비상호작용 structural scenery
- branch 4개는 실제 파괴 가능한 physics polygon
- branch chain 실제 점프 통과
- branch가 없어도 main route 출구 도달 가능

## Stage 2

- 세 개의 독립 land mass:
  - left-high-ground
  - canyon-ground
  - right-cliff-ground
- authored ground top: **252 nodes**
- start→basin drop: 약 **1801.7**
- 왼쪽 자연 하강:
  - giant-tree branch
  - embedded rock ledge
  - second branch
  - lower ledge
  - basin
- 오른쪽 비대칭 상승:
  - rock ledge 1~4
  - tree branch
  - grass shelf
- basin shallow water는 실제 지면 depression을 수평면으로 채우며 collision은 없다.
- 상부 적은 설오 기본 활로 여전히 도달 가능.

## 자연스러움 구현

- macro terrain은 authored layout
- meso/micro detail은 deterministic seed generator
- scatter는 모두 terrain support에 결합
- material patch는 terrain surface를 sampling해서 생성
- 바위는 irregular high-node polygon
- 가지 underside는 taper/irregular profile
- 단순 반복 noise가 아닌 큰 형태→중간 형태→미세 형태의 hierarchy 사용

## 성능

고밀도 지형을 유지하면서도 RC17의 filter 회귀를 반복하지 않았다.

- Stage 1: launch 130.4 ms, 23 render/s
- Stage 2: launch 87.8 ms, 45 render/s
- Stage 3 regression: launch 80.3 ms, 53 render/s
- heap 증가 없음
- browser runtime exception 0

## 검증 한계

자동 물리/브라우저/성능 검사는 수행했지만 실물 모바일에서 장시간 완주 플레이를 수행한 것은 아니다. Stage 2는 의도적으로 다층 자연 지형이므로 단순히 오른쪽으로 걷기만 하는 자동화 대신, authored descent/ascent route를 직접 physics sequence로 검증했다.
