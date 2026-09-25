# HONRO Act I RC13 — Combat Balance & Pacing

## 변경 사항

- 랜덤 산개형 다중투사체에 `aimControl`을 도입해 기대 적중률을 정량화했다.
- 염화혜성/빙륜/우레등의 1발 피해 보정을 각각 RC12 대비 약 +27% / +52% / +41% 높였다.
- Stage 2 담허를 HP 494 / ATK 1.376 / Armor 0.12로 재조정했다.
- Stage 3에 휘겸을 전투 동맹으로 연결하고 HP 752 / ATK 1.772 / Armor 0.24로 설정했다.
- Stage 10 소단을 HP 5803 / ATK 3.378 / Armor 0.14, O01/O09/O10 Rank 5의 최종보스로 조정했다.
- Stage 3/6/8에 중간보스 cadence를 구성했다.
- Stage 1→10 목표 턴을 5–6 → 15–16으로 단계적으로 증가하도록 적 수/증원/보스 내구도를 조정했다.
- Stage 2 실제 전투 증원은 2명만 남겨 초반 과밀 이벤트를 완화했다.
- Stage 4는 9턴 방어 목표를 유지하되 세 차례 증원을 두 차례로 압축했다.
- Stage 10은 초반 일반몹을 줄이는 대신 소단 본체와 협동전 후반 증원에 난이도를 집중했다.
- RC12 지형/미니맵/점프 경로는 변경하지 않았다.

## 검증

- `npm run verify`: 통과
- RC13 balance audit: 7/7
- RC13 browser audit: 7/7, runtime exception 0
- RC12 map gameplay: 14/14
- movement: 36 cases / 0 failure
- impact: 29 checks
- mission/enemy-flight: 28 checks
- audio: 19 checks
- charge/tuning: 192 profiles + 12 actual launches
- party pacing: 9 checks
- RC12 browser/minimap: 31 checks, runtime exception 0

목표 턴수는 자동 planning model의 예상값이며 사람의 실제 평균 플레이 telemetry는 아니다.
