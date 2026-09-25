# HONRO ACT 1 — RC17 Report

## 핵심 수정

- RC16 gap analysis를 작업 규칙으로 고정하고 Stage 1·2를 다시 설계.
- Stage 1 macro shape를 creek hollow / shrine terrace / rocky rise / exposed ridge의 구간형 산길로 변경.
- Stage 1 optional route를 root 3단 → canopy root → upper ridge로 확장.
- Stage 2의 단일 V형 ground를 폐기.
- Stage 2를 `left-high-ground`와 하부 `canyon-ground` 두 개의 ground mass로 분리.
- Stage 2 좌측에 실제 4단 하강 route, 우측에 5단 상승 route + high shelf 구성.
- Stage 1·2에 5종 이상의 surface terrain을 실제 배치.
- back scenery는 terrain 뒤에서 낮은 alpha/saturation으로 렌더하고 mid landmark는 terrain 이후 렌더.
- Stage 1·2 authored landmark는 모두 support-bound 배치.

## 검증

RC17 map audit: **12/12 PASS**

- Stage 1 main ground nodes: 109
- Stage 2 ground nodes: 111
- Stage 2 high-perch → basin vertical drop: 약 1530 world units
- Stage 1 start → exit: PASS
- Stage 2 start → exit: PASS
- Stage 1 root/canopy high route: PASS
- Stage 2 4-step descent: PASS
- Stage 2 5-step climb → high shelf: PASS
- Stage 2 high roost A01 reachability: PASS
- authored landmark support audit: PASS
- z-order source contract: PASS

Regression:
- impact / fall / knockback: 29 checks PASS
- RC13 combat balance audit: PASS
- audio audit: 19 checks PASS

## 한계

- 이번 RC는 Stage 1·2만 수정했다. Stage 3~10 지형은 의도적으로 유지했다.
- 실물 모바일 장시간 플레이와 사람이 1막 전체를 완주하는 수동 QA는 별도다.
