# 6막 여정첩과 쉼터의 이전 기록

정상 55 이전 기록에서 쉼터는 55를 열었지만 여정첩의 현재 위치는 비었고 51까지만 표시됐다. 여정첩이 빌드와 도착 장 pin 전부의 동일성을 요구했기 때문이다. 여정첩과 쉼터는 이제 정상 경계의 읽기 전용 판정을 함께 쓴다. 이전 출발 패킷과 유형별 영수증이 현재 검사를 통과하면 이전 빌드의 기록도 표시한다. [변경 전후 실측](observed.json)

| 판 | 여정첩 | 쉼터와 저장 |
|---|---|---|
| 이전 55 원본 | 현재 6막 5장, 51–55 표시, 쉼터에서 이어가기 | 실제 일반 55를 열고 기존 프로필·경계 바이트 동일. [화면](screens/historical.webp) |
| 출발본이 다른 유효 형식의 시험 기록 | 51 표시, 쉼터로 이동 | 기존 진척은 재개 대상에서 제외하고 6막 1장 입구 표시. 기록 바이트 동일. [화면](screens/retired.webp) |
| M09 증거가 훼손된 시험 기록 | 시작 지점만 표시, 이어가기 없음 | 일반 안내만 표시. 55 장 번호와 후속 경로를 표시하지 않았다. 기록 바이트 동일. [화면](screens/damaged.webp) |

일반 60 재검수에서 1440·390 모두 기존 두 혼, 세 라운드, 완료 영수증과 자연스러운 타이틀 귀환을 확인했다. 별도 경계 기록을 재개해 실행한 검사다.

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/journey_boundary.py --build "$PWD" --out /tmp/honro-journey-boundary --expect-aligned
python tools/act6-ending-v2/normal.py --chromium /usr/bin/chromium
```
