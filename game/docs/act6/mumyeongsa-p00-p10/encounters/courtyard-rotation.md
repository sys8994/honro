# 6-9 양쪽 전선 재검수

기존 시드 19388 승리 판에서 서쪽은 3라운드에 2명, 동쪽은 4라운드에 1명이 들어왔다. 5·6·7라운드에는 두 전선이 모두 총 활성 자리를 기다렸다. 두 전선의 첫 분대가 모두 들어와야 했던 앞발은 나타나지 않았다. 8라운드에 갑주가 물러날 때 전체 유입이 닫혔다. 누적은 15였다. [수정 전 승리 로그](courtyard-won-59.json)

전선 사격과 지지점 확보에 따라 공격대를 실제 뒷길로 물린다. 물러나는 동안 적은 같은 단 위에서 움직이고 맞을 수 있다. 이동 거리와 발점을 기록한 뒤, 아군에게서 떨어진 지점에 도달하면 퇴각 효과와 함께 자리를 비운다. 첫 분대와 앞발 자리를 남겨 두고 양쪽의 실제 사선 후보에게 차례를 준다. 앞발은 별도 실체로 나오며, 휘겸이 교각에서 실제 공격 턴을 버티거나 일행이 직접 피해를 주면 물러난다. 두 접근로의 전위가 현장에 도달하고 기존 지지점들을 확보해야 가름진 연결이 열린다. 이후 갑주를 처치하거나 실제로 밀어내는 원래 선택은 유지한다.

첫 수정 판은 앞발이 6라운드에 실제 발사했고 교각에서 휘겸이 받아낸 뒤 실제 지지면을 따라 물러났다. 두 증원 모두 아군에게 피해를 줬고 활성 최고는 14였다. 단일 입장점만 있던 동쪽 둘째 분대의 남은 선두 자리는 x=5961.3, 가까운 담허는 x=6001.5였다. 나머지 후보가 이미 출현했어도 그 한 자리가 막혀 다음 분대를 기다렸다. 소단이 혼길을 비운 채 가름진 자리를 기다리면서 13라운드에 세 번째 거점 붕괴로 패배했다. 후보에 같은 받침의 인접 발점을 추가하고, 방어 전략은 실제 연결이 열릴 때까지 혼길을 지키도록 재현 입력을 고쳤다. [첫 수정 실패와 앞발 발사·피해·퇴각 원자료](courtyard-rotation-first-failure.json)

```bash
npm run build
probe=game/docs/act6/mumyeongsa-p00-p10/baseline/courtyard_combat.py
python "$probe" --build "$PWD" --out /tmp/honro-59-guard --rounds 21 --finish --forepaw guard
python "$probe" --build "$PWD" --out /tmp/honro-59-strike --rounds 21 --finish --forepaw strike
python tools/act6-ending-v2/normal.py --chromium /usr/bin/chromium --from-courtyard-proof /tmp/honro-59-guard/court.json
```
