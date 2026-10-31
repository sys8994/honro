# Stage31 v40 — all four fresh outcomes

World SHA: `540e65d68ab2049ea0271fa168c78b1024b598703ec9e63bcf7fc19c9e67ccc1`

| Build | Seed | Result | Round | Survivors | Decisions / passes | Boss shots / damage | Healing | Jumps / drops | Off-route / fall-death / water recovery |
|---|---:|---|---:|---:|---|---|---:|---|---|
| default | 17031 | won | 13 | 3 | 46 / 13 | 2 / 0 | 0 | 3 / 4 | 0 / 0 / 0 |
| default | 17032 | won | 14 | 3 | 49 / 16 | 2 / 0 | 0 | 4 / 3 | 0 / 0 / 0 |
| support | 17031 | won | 13 | 4 | 50 / 16 | 2 / 415 | 3397 | 4 / 4 | 0 / 0 / 0 |
| support | 17032 | won | 13 | 4 | 50 / 16 | 2 / 200 | 3521 | 4 / 4 | 0 / 0 / 0 |

All outcomes retained. Two seeds per build are not a population win-probability or difficulty-curve estimate. Old v5 outcomes are NOT included. Native combat endpoint and declared warning receipt do not validate browser visibility, real charge UI, quiet condition, boarding, or full-stage round cap. Actual production water hook runs once after every native tick; no HP/AP/position edits. See ADAPTER_CONTRACT.md.

## 런타임 및 회귀 판정
- 실제 로드 bundle SHA: `9b4e627c1630146f35b312159c8cd2872da69b23ed8c663d1d9c9b9aaaae46df`. 네 run 모두 동일함.
- 네 run의 행동/피해/회복/라운드/프레임 수/낙하/물 회복/경로 이탈 로그가 기존 v30과 정확히 동일함 (`v30-v40-exact-comparison.json`).
- 입력 controller/policy/후보/profile 해시는 배치 종료 후에도 불변.
- controlled 경고 인지 precondition을 사용한 전투 회귀 통과이며 DOM/미션/실제 승선/브라우저/인간 재미 합격은 아님.

| 빌드 | seed | 궁수 HP | 법사 HP | 기사 HP | 주술사 HP |
|---|---:|---:|---:|---:|---:|
| default | 17031 | 359 | 386.4 | 1255.2 | 0 |
| default | 17032 | 594.2 | 616.2 | 0.7 | 0 |
| support | 17031 | 1102 | 1011.4 | 2943 | 850 |
| support | 17032 | 974.6 | 824 | 2973 | 876 |

default17032 기사 0.7HP 생존은 매우 좁은 여유다. 두 seed의 자동 전문가 정책 결과를 일반 사용자 승률이나 적정 난이도 확정으로 확대하지 않는다.
