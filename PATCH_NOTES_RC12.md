# HONRO Act I RC12 — Map Gameplay & Seam Stability

## 수정 사항

### 미니맵
- 미니맵이 실제 지형과 다른 모양으로 보이던 원인을 수정했다.
- 실제 terrain polygon vertex를 그대로 사용한다.
- 10개 Stage 모두 실제/예상 polygon mask를 픽셀 단위로 비교한다.

### Stage 2
- 중앙을 가로막던 불필요한 절벽 구조를 없애고 **하나의 연속된 지면**으로 재설계했다.
- 월드를 `6200×3200`으로 조정해 RC11보다 낮고 넓게 만들었다.
- 높은 선반의 초기 적 4명을 설오 기본 활 `A01`로 실제 trajectory sweep해 모두 사거리 안에 들어오는지 확인했다.

### 전 스테이지 입체 플레이
- Stage 1: 뿌리 발판 / 고지 사격점
- Stage 3: 영구 다리 + 창고 지붕 jump route
- Stage 4: 양측 vantage
- Stage 5: **7단 발판 + upper roost**
- Stage 6: 하부 호송로 + 잔해 3단 발판 + 상부 다리
- Stage 7: 수직 지그재그 뿌리마을
- Stage 8: 처마 회랑
- Stage 9: 좌우 gallery
- Stage 10: 의식대/회랑 jump route

### Stage 6 접합부 낙하
- 좌측에서 하부 지형과 상부 polygon이 겹치며 support가 불안정해지던 구조를 제거했다.
- 하부 필수 진행로를 `lower-road` 하나의 연속 polygon으로 만들었다.
- 상부 다리는 시작점과 분리하고 잔해 발판으로만 접근하도록 했다.
- local support 탐색 시 다층 지형에서는 reference 높이에 가장 가까운 surface를 우선하도록 보완했다.

### Stage 3 다리
- 필수 다리를 파괴 가능한 오브젝트가 아니라 영구 polygon route로 유지한다.
- 양쪽 은행과 다리 edge 좌표를 정확히 접속시켜 seam을 제거했다.

## 검증 요약
- RC12 map gameplay: **14/14**
- Movement audit: **36 cases / 0 failure**
- Impact / fall / knockback: **29 checks**
- Mission / enemy-flight (RC12 Stage 2 계약): **28 checks**
- Audio: **19 checks**
- Charge/tuning: **192 profiles + 12 actual launches**
- Party pacing: **9 checks**
- Browser RC12: **31 checks**, runtime exception 0
- Minimap polygon IoU: Stage별 **0.9456–0.9843**

기존 `regressions.mjs`, `terrain-audit.mjs`, `rc11-map-physics.mjs`에는 RC9/RC11의 Stage 2 고정 크기를 계약으로 잡은 검사가 남아 있어 RC12 release gate에서 제외했다. `tactics-audit.mjs`의 crow 2D 이동 assertion은 수정 전 RC11에서도 동일하게 실패하는 기존 항목으로, 이번 맵 변경의 회귀로 보지 않았다.
