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

## 첫 승리 판

같은 체크포인트의 방어 판에서 시작 10, 누적 34, 최대 활성 14, 공격 큐 상한 8이었다. 서쪽 3라운드 HMO01은 휘겸 실드 `462→437`, 동쪽 4라운드 HMO01은 담허 실드 `246→189`, 실제 앞발 4라운드 HWD01은 교각의 휘겸 실드 `462→431`을 줄였다. 양쪽의 입장과 퇴각을 확인한 뒤 9라운드에 실제로 승리했다. 11라운드 페이스 목표와 전진 공략의 별도 승리는 당시 미달·미검수다. 60 새 기록과 그 기록의 PC·모바일 엔딩, 일반 저장 바이트, 자연 타이틀 복귀는 통과했다. [실제 방어 판](courtyard-rotation-guard.json) · [승리 화면](screens/courtyard-rotation-guard.webp) · [실제 승리 기록의 엔딩](courtyard-rotation-ending.json)

## 교대로 전진하는 방어 판

전선별로 새 분대가 도착하는 순서를 서→동으로 교차했다. 진행 중인 분대는 다음 공격과 퇴각을 이어가며 가름진 연결 때까지 양쪽 사선이 남았다. 같은 시드 방어 판에서 시작 10, 누적 34, 최대 활성 12, 실제 공격 큐 최고 8, 승리 11라운드였다. 서쪽 증원은 10발을 발사해 아군 피해 처리 8회를, 동쪽은 8발을 발사해 피해 처리 8회를 남겼다. 앞발은 4라운드에 실제 HWD01을 맞혔고, 휘겸이 방어한 뒤 암반 위로 후퇴했다. 31개의 이동 퇴각을 기록했다. 새 60 기록, 두 화면비의 엔딩 및 타이틀 복귀가 통과했다. 이 표본의 브라우저는 동시에 돌린 다른 PC 검수가 있어, 프레임타임을 단독 성능으로 사용하지 않는다. [방어 원자료](courtyard-alternating-guard.json) · [화면](screens/courtyard-alternating-guard.webp) · [엔딩](courtyard-alternating-guard-ending.json)

## 짝을 이룬 직접 타격 판

위 방어 판과 같은 빌드·체크포인트 해시 `71967cd69770cdf901a794fb976bdf3e4596f21314cfac364273fb1fe746dd1b`, 시드 `19388`이다. 4라운드에 휘겸을 교각 위 (4140.53,2909.93)로 전진시켜 실제 S03으로 앞발을 물렸다. 발점 (4237.57,2912.49)에서 같은 암반을 따라 300.68 px를 후퇴했다. 서쪽 증원 7발·아군 피해 처리 5회, 동쪽 증원 8발·아군 피해 처리 7회였다. 시작 10·누적 34·최대 활성 12·실제 공격 큐 최고 8을 유지했다. 11라운드 갑주 실제 퇴각으로 이겼고 새 60 저장·1440 PC와 390 모바일의 두 혼·추모·엔딩·타이틀이 모두 열렸다. 두 판 모두 원래 일반 저장을 보존했다. [직접 타격 원자료](courtyard-alternating-strike.json) · [실제 앞발](screens/courtyard-forepaw-visible.webp) · [승리 화면](screens/courtyard-alternating-strike.webp) · [엔딩](courtyard-alternating-strike-ending.json)

## 시드 민감도와 난이도

일반 앱의 시작 시드는 19388로 고정된다. 별도 민감도 판에서는 장을 처음 연 뒤 브라우저 검수기가 RNG만 바꿨고, 배우·장비·컷신·행동·적·승리·저장은 실제 앱 입력과 소유자를 거쳤다. 두 제어 시드에서 방어와 직접 타격을 각각 실행해, 네 판 모두 누적 34와 11라운드 승리, 새 60 재로드와 PC·모바일 타이틀 복귀를 확인했다. 기본 시드의 공개 입력 두 판과 구분한다. [31717 방어](courtyard-variants/31717-guard.json) · [31717 타격](courtyard-variants/31717-strike.json) · [46183 방어](courtyard-variants/46183-guard.json) · [46183 타격](courtyard-variants/46183-strike.json)

탐험과 숙련 난이도의 별도 저장으로 390×844 실제 터치 전진을 6라운드 검수했고 양쪽 전선이 피해를 줬다. 첫 탐험 판에서 원래 갑주가 예정 입장 발점과 14 px 거리에서 막고 있어 앞발이 6라운드 동안 나타나지 않았다. 동일 암반의 옆 발점을 후보에 넣은 뒤 탐험 판에서 앞발을 관측했다. 또 휘겸이 예정 발점을 실제로 점유한 대조판에서 앞발이 대체 발점 (4417.127,2892.904)에 접지해 출현했다. 난이도별 전체 승리 시나리오와 실기기 성능은 미검수다. [탐험 첫 판](courtyard-variants/explorer.json) · [수정 탐험](courtyard-variants/explorer-berth.json) · [숙련](courtyard-variants/veteran.json) · [실제 점유 대조](courtyard-variants/blocked-forepaw.json) · [화면](courtyard-variants/blocked-forepaw.webp)

```bash
probe=game/docs/act6/mumyeongsa-p00-p10/baseline/courtyard_combat.py
python "$probe" --build "$PWD" --out /tmp/act6-59-seed-guard --finish --forepaw guard --seed 31717 --rounds 21
python "$probe" --build "$PWD" --out /tmp/act6-59-seed-strike --finish --forepaw strike --seed 46183 --rounds 21
python "$probe" --build "$PWD" --out /tmp/act6-59-explorer --rounds 6 --touch --advance --difficulty explorer
python "$probe" --build "$PWD" --out /tmp/act6-59-veteran --rounds 6 --touch --advance --difficulty veteran
```

점유 대조는 59 일반 체크포인트에서 휘겸으로 교각의 기억을 확인하고 x=4237.569 부근 동일 암반에 선다. 3라운드까지 휘겸의 차례마다 같은 위치로 실제 걸어 복귀하고 방어를 누른다. 4라운드 첫 조작에서 육안과 엔진 발점으로 앞발의 위치를 확인한다.
