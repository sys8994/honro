# 53·54 세 구역을 직접 싸운 첫 판

54는 실제 53 출발의 B 경계에서 시작했다. B의 네 명, 54-N의 네 명과 회랑 세 구역에서 새로 다섯 명이 들어와 **누적 13명**을 확인했다. 최대 공격 큐는 4명이다. 들보와 관측턱에서 13라운드까지 실제 교전했지만 담허가 쓰러져 M09나 C로 갈 수 없었다. 이 판은 누적과 총 피해의 실측이며 승리 경계를 통과하지 못했다. [54 피해·발점 원자료](54-first.json) · [실패 화면](54-first.webp)

53은 다섯 명으로 시작해 세 방에 도착해 실제 공격했다. 누적 일곱 명이었고, 8라운드에 윗난간에서 진목 쌍을 사용하려 했으나 기한 내 착지하지 못했다. 같은 위치에서 발점과 기존 `gateResolution`의 전체 거부 이유를 따로 기록하도록 재현기를 보강했다. [53 타격·이동기록](53-first.json) · [실패 화면](53-first.webp)

```bash
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_encounters.py --build "$PWD" --out /tmp/honro-53-pressure --stage 53
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_encounters.py --build "$PWD" --out /tmp/honro-54-pressure --stage 54 --b-proof game/docs/act6/mumyeongsa-p00-p10/visual-atlas/capture-input-b.json
```

53 재현에서 여덟 번째 라운드에 실제 발점이 맞았지만 두 진목이 모두 사라진 것을 확인했다. 플레이어 설치물을 처리하는 기존 유효기간 부여가 장 소유의 고정 통로에도 적용되었다. 고정 통로의 정확히 두 진목을 구분했다. 53 방 세 곳의 접지 거리 범위도 조정해 후방 적이 멀어지면 살아 있는 몸을 유지한 채 다음 방에 자리가 생기도록 했다. 변경 후 같은 일반 앱에서 시작 5명, 누적 12명, 활성 최대 6과 라운드 공격 큐 최대 4를 확인했다. 목진목 11·12를 원래 발점에서 사용한 뒤 실제 M09와 공용 B를 밟아 54 새 저장을 읽었다. 이 판은 빠른 경로로, 장기 대치 후 재통과와 8라운드 하한은 추가 검수 중이다. [TTL 실패](53-expired-gates.json) · [12명 실전과 새 54](53-retained-route.json)
