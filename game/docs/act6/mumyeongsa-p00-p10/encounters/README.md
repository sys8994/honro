# P50 실제 전투 편성

51·52에서는 정상 장 소유자가 서명된 원본과 임무 배치를 연 뒤 세 구간의 유한 증원대를 연다. 51은 아랫길 추격, 중턱 위아래 협공, 전망대 방어선이다. 52는 첫 암벽 아래 초병, 끊어진 석교 양안, 빈 종터 방향의 증원이다. 원래 명중해야 할 지지석은 적 수에서 뺐다. 퀘스트 표적과 별개의 적을 전부 쓰러뜨려야 하는 조건은 없다.

| 장 | 실측 시작 / 누적 / 최대 활성 | 엔진 공격 큐 상한 | 교전 표본 |
|---|---:|---:|---|
| 51 | 8 / 17 / 8 | 5 | 원래 4명과 새 초기 4명, 아랫길·중턱·전망대에서 각 3명. 구간마다 두 라운드 진행한 판에서 20발 발사, 추격대가 설오에게 실제 2회 명중해 1720→1606. [추가 교전](pressure-51.json) · [중턱](screens/approach-51.webp) |
| 52 | 9 / 16 / 9 | 6 | 암벽 3명, 석교 1명, 종터 접근 3명. 암벽 증원의 HBM01로 설오 1720→1683. 설계 예산 19 중 이 판에서 석교 2명과 종터 1명은 대기했다. [로그](approach-52.json) · [석교](screens/approach-52.webp) |
| 53 | 5 / 9 / 미실측 | 4 | 세 구간의 증원이 일부 입장했다. 실제 M09와 B를 거쳐 54, 차트와 C 뒤 새 55까지 진행했다. 이 판 누적 9는 목표 12보다 적다. [로그](interior-53.json) · [산문 안쪽](screens/approach-53.webp) |
| 54 | 4 / 8 이상 / 미실측 | 4 | +X 같은 면에 원래 수문지기와 새 순라·매듭귀·잔향, 갤러리에 별도 예비대. 120Hz에서 원래 적이 담허에게 실제 명중했고 O06과 M01이 수문지기를 600→236→0으로 낮췄다. 원래 차트·M09·C 진입과 54·55 새 저장을 확인했다. 전체 증원·60Hz는 별도 검수한다. [로그](lateral-54.json) · [B 입구](screens/wall-roster-54.webp) |
| 55 | 8 / 18 / 미실측 | 7 | 빈종각귀의 공격 순서를 보장하되 나머지 증원이 그 뒤에 실제 행동한다. 원래 적이 소단을 실제로 맞혀 복구한 판과, 두 동행이 공격하고 온전한 결속을 정렬한 판이 각각 새 56까지 통과했다. 계획 누적 24 중 관측 누적은 18이다. [온전한 판](bell-intact-55.json) · [복구 판](bell-repair-55.json) · [화면](screens/bell-pressure-55.webp) |
| 56 | 5 / 16 / 미실측 | 5 | 가름진 역류 시 원본 예비 적을 포함해 모두 16명이 나타났다. 일반 증원이 담허를 먼저 밀어서 원본 역류 회피를 확인할 수 없는 실패를 재현했다. 낮은 턱의 단일 회피 차례에 원본 적을 먼저 행동시킨 뒤 세 구간 전투를 재개한다. 변경 후 실제 O06·역류·회피·57 라이브/새 저장을 다시 확인했다. [로그](interior-56.json) · [역류](screens/approach-56.webp) |
| 58 | 4 / 7 이상 / 미실측 | 6 | D 수신 때 부하 4명이 실제 받침에 섰고 대도사는 두 의식 뒤 원래 제기혼과 함께 나타났다. 60·120Hz의 실제 벽·천장 접지에서 담허 M01이 윗마루 부하를 595→367로 낮췄다. 전체 국면·R 재검수는 진행 중이다. [60Hz](hall-58-60.json) · [120Hz](hall-58-120.json) · [화면](screens/hall-combat-58.webp) |
| 59 | 10 / 미실측 / 미실측 | 8 | 서쪽 높은 단·교각·동쪽 파열에 독립 초병을 배치했다. 기존 정예는 그대로며 기존 양측 증원은 살아 있는 적 14명을 넘지 않도록 대기한다. R을 직접 벗어난 직후와 기존 기록의 첫 화면에서 각각 10명 확인. 두 전술의 후속 전선·거점·가름진 종료는 미검수다. [로그](courtyard-59.json) · [R 이후](screens/approach-59.webp) |

54는 담허와 원래 수문지기 객체를 유지하고 장 소유자가 검사한 적만 각 방에 들인다. 진행 중인 포격·진목·장 효과가 남으면 방을 바꾸지 않는다. 실제 발점과 원래 수문지기 제압이 확인된 뒤 이전 방의 증원만 남겨 두고, 관측과 발점이 맞으면 다시 다음 차트로 넘어간다.

PC에서 51은 일반 쉼터, 52는 기존 정상 기록을 열어 실제 키로 세 구간을 이동했다. 기존 원본 발점과 신설 적의 실제 발판을 기록했다. PC 호스트의 수집 표본은 각각 16.8·33.3 ms p95였다. 장 완료까지 연속 세 시드, 난이도 차이, 모바일 성능, 51·52에서 생성한 새 이어하기와 57 증량은 별도 검수한다.

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/exterior_combat.py --build "$PWD" --out /tmp/honro-act6-exterior-combat
python game/docs/act6/mumyeongsa-p00-p10/baseline/exterior_combat.py --build "$PWD" --out /tmp/honro-act6-pressure51 --stages 51 --rounds-per-site 2
python game/docs/act6/mumyeongsa-p00-p10/baseline/native_b.py --build "$PWD" --out /tmp/honro-act6-inner53 --hz 120 --spirit
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-act6-repair55 --bell-only --bell-case repair
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-act6-intact55 --bell-only --bell-case intact
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-act6-inner56 --deep-thread
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --build "$PWD" --out /tmp/honro-act6-hall58 --case gallery-combat --rates 60 120
python game/docs/act6/mumyeongsa-p00-p10/baseline/return_gate.py --build "$PWD" --out /tmp/honro-act6-courtyard59
```
