# HONRO Act I RC11 — Polygon Physics & Stage Route Rebuild

## 이번 RC의 목적

RC10에서 도입한 폴리곤 지형의 핵심 문제는 **지형 위에 정상적으로 서 있는 상태를 충돌/penetration으로 오판하는 경우**가 있었다는 점이다. 이때 캐릭터가 support surface와 스스로 충돌한 것으로 처리되면서 이동, 점프, 발사 준비 상태가 동시에 무너질 수 있었다. 또한 전장 제작 규칙이 "멋있는 실루엣"에 치우쳐 실제 보행 경로를 막거나, 진행에 필요한 다리/오브젝트가 파괴되는 soft-lock이 발생할 수 있었다.

RC11은 이 둘을 별개로 고쳤다.

1. **폴리곤 물리 자체를 수정**해서 support contact와 penetration을 분리했다.
2. **10개 스테이지를 progression corridor 기준으로 재검수/재배치**해서 필수 동선은 파괴되지 않고, 실제 이동 능력으로 끝까지 통과 가능한 구조로 바꿨다.

---

## 1. 폴리곤 물리 수정

### 원인

기존 폴리곤 충돌은 캐릭터의 발이 폴리곤 경계에 닿아 있을 때도 body collision 후보로 들어갈 수 있었다. 특히 여러 surface가 같은 x에 존재하는 다층 구조에서 현재 서 있는 polygon의 top edge / side edge를 다시 충돌로 잡아 movement solver가 캐릭터를 고정시키는 경우가 있었다.

### 수정

- `poly(t)`를 렌더/보행/투사체 충돌의 공통 geometry로 사용.
- polygon edge 충돌은 **운동 방향이 실제로 polygon 내부로 들어갈 때만** 충돌로 처리.
- 현재 support polygon의 정상적인 접촉은 penetration으로 보지 않음.
- 걷기 경사는 `bbox slope`가 아니라 현재 x에서의 실제 polygon surface slope로 계산.
- 같은 x에 복수 층이 있을 때 `topAt(t,x,reference)`가 reference 높이에 가장 가까운 surface를 선택.
- recovery / landing / friction도 같은 polygon surface API를 사용.
- 모든 route polygon 위에서 `move → jump → fire`가 실제로 가능한지 자동 검사 추가.

---

## 2. 스테이지별 월드 비율과 지형 구조

| Stage | World size | Ratio | 핵심 구조 |
|---|---:|---:|---|
| 1 | 5200 × 2600 | 2.00 | 완만한 숲길 + 뿌리 아치 + 별도 고지 망보기 |
| 2 | **5600 × 3600** | **1.56** | 넓고 낮아진 협곡 + 설오 능선 + 중간 절벽 둥지 |
| 3 | 7600 × 2400 | 3.17 | 강변 3개 지대 + **파괴 불가능한 영구 잔교 2개** |
| 4 | 4600 × 3400 | 1.35 | 피란문 분지 + 좌우 shoulder / 망루 |
| 5 | 4300 × 4600 | 0.93 | 수직 폭포 + 동굴 천장 + 받이진 + 좁은 사격창 |
| 6 | 6500 × 3600 | 1.81 | 끊어진 상부 다리 / 연속된 하부 구조로 |
| 7 | **3600 × 5000** | **0.72** | 4개 층의 지그재그 거목 뿌리마을 |
| 8 | 8200 × 3000 | 2.73 | 긴 장례길 + 결박 회랑 |
| 9 | 3400 × 3200 | 1.06 | 압축된 사당 안마당 + 좌우 회랑 |
| 10 | 5200 × 3800 | 1.37 | **점프가 필요 없는 연속 완경사** + 중앙 의식대 |

Stage 2는 RC10의 지나친 세로 비율을 폐기하고 **폭을 늘리고 높이를 낮췄다.** 상단 둥지의 4개 적은 설오의 기본 사격 `A01`을 실제 탄도 스윕하여 도달 가능함을 검증했다.

---

## 3. 진행 soft-lock 방지

### Stage 3 — 나루의 다리

진행에 필요한 두 잔교를 파괴 가능한 오브젝트에서 **영구 polygon terrain**으로 변경했다.

- `permanent-bridge-west`
- `permanent-bridge-east`

둘 다 `indestructible:true`이며 `damageTerrain()`이 이 flag를 존중한다. 공격을 아무리 받아도 진행 동선이 사라지지 않는다.

### Stage 10 — 올라갈 수 없는 언덕

기존의 점프로도 못 오르는 단차를 제거했다. 전체 main floor를 하나의 연속 polygon으로 설계했고 최대 경사는 **0.60**으로 제한했다. 시작 지점에서 우측 출구까지 이동 시뮬레이션으로 통과를 확인했다.

### Stage 7 — 수직 맵

한 개의 거대한 경사면 대신 실제로 층이 바뀌는 구조로 만들었다.

`하층 → 1차 ramp → 중층 → 방향 전환 ramp → 상층 → 최종 ramp → crown`

8개 실제 waypoint를 순서대로 이동시키는 자동 검사를 통과했다.

### 그 외 Stage

1, 3, 4, 5, 6, 8, 9, 10은 시작 지점에서 exit까지 실제 locomotion solver로 직접 이동시키는 progression-corridor 검사를 통과했다.

---

## 4. 지형/전투 디자인

각 전장은 단순한 `한 줄 바닥 + 등간격 적` 대신 다음 패턴을 조합한다.

- 낮은 **swarm pocket**: 광역기 보상
- 별도 **elevated roost**: 정밀 사격용 고지 표적
- `screen + core`: 앞 전열 뒤 핵심 표적을 곡사
- 상부/하부 두 전장: Stage 6
- 실제 사격창 / blocker: Stage 5
- 파괴 가능한 cover와 파괴 불가능한 progression terrain 분리

모든 초기 enemy encounter에는 `honroSpawnReason`, `honroTacticalReason`, `honroEncounterRole`을 유지한다.

---

## 5. 누적 수정 유지

- 박쥐/까마귀/수의귀 계열의 비정상적 장거리 공격 범위 완화.
- 데스크톱 `E` 상호작용 프롬프트 복구.
- Stage 5 담허–설오 협동 기믹 유지.
  - 담허가 받이진에서 의식 유지 → waterfall veil 개방.
  - 닫힌 상태에서는 고리쇠 피해 무효.
  - 담허가 자리를 벗어나면 다시 닫힘.
- 포스터는 메인 전체 배경으로 쓰지 않음.
  - 메인: `혼로` 캘리그라피 crop만 사용.
  - Stage 1–10 진입: 해당 poster panel crop을 개별 establishing shot으로 사용.
- 미니맵은 실제 world aspect ratio를 그대로 보존.

---

## 6. 검증

### RC11 전용

- Polygon/map physics audit: **12 / 12**
- Browser acceptance: **39 checks 통과**
- Browser runtime exception: **0**
- 10개 Stage intro art: **10개 모두 서로 다른 crop 확인**
- 10개 Stage runtime terrain: **모든 terrain이 polygon geometry**

### 공통 시스템

- Impact / fall / knockback / safe-contact: **29 checks**
- Audio audit: **19 checks**
- Charge/tuning: **192 profiles + 12 launches**
- Party pacing: **9 checks**

과거 RC5/RC9의 고정 좌표 및 단층 지형을 정답으로 간주하는 legacy terrain tests는 RC11의 다층 polygon map과 계약 자체가 다르므로 active release gate에서 분리했다. 테스트 파일은 회귀 이력 확인용으로 계속 동봉한다.

### 수동 QA 범위

자동 검사와 Chromium browser acceptance를 수행했다. 실제 사람이 1막 전체를 처음부터 끝까지 장시간 플레이하는 완주 QA와 실물 모바일 장시간 QA는 이번 자동 검증에 포함되지 않는다.
