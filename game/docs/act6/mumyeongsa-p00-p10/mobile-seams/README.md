# C·D 모바일 수신과 접지

Chromium 390×844에서 일반 쉼터의 이어가기를 탭하고 실제 조이스틱 터치로 움직였다. 각 표본은 기존 일반 저장과 장 경계의 바이트가 같았다.

| 범위 | 실제 입력과 관측 |
|---|---|
| C의 56 수신 | 실제 55에서 작성한 새 경계를 다시 열었다. (736,900)에서 위쪽 중력, 법선 (0,1)과 찢어진 처마 발점을 확인했다. 조이스틱을 오른쪽으로 밀어 정상 방향 (0,320)으로 돌아와 (928,1136)의 승인 난간에 착지했다. 66개 프레임 발점·중력 표본. [천장](c-ceiling-mobile.webp) · [착지](c-veranda-mobile.webp) |
| D의 58 수신 | 이전 호환 경계를 열었다. 네 배우의 초기 발점은 같은 `local-lower-08-body`였다. 담허의 조이스틱 왼쪽 이동으로 x=2780.04→2663.94를 실제 걸었으며 같은 석단에 접지했다. [초기 네 발점](d-receiving-mobile.webp) · [실제 이동](d-step-mobile.webp) |

C의 54 송신은 앞선 B와 실제 M09를 같은 390×844 탭에서 키와 버튼으로 통과한 뒤 검수했다. 담허가 천장 `(380,900)`에서 조이스틱을 밀어 `(736,900)`의 같은 처마에 도착했다. 중력 `(0,−320)`과 접촉 법선 `(0,1)`이며 trusted touch 시작·종료를 관측했다. 실제 다음 장을 탭해 55가 열렸고 일반 원본 바이트를 유지했다. 55 새 기록도 별도 일반 쉼터에서 열어 확인했다. [처마 시작](c-send-entry.webp) · [송신 발점](c-send-threshold.webp) · [55 라이브](c-send-live55.webp) · [경계 및 재로드](c-send-native.json)

[측정 원자료](observed.json) · [C 실제 경계](captured-c-source.json)

```bash
npm run build
p=game/docs/act6/mumyeongsa-p00-p10
python "$p/baseline/mobile_seams.py" --build "$PWD" --out /tmp/honro-mobile-seams --c-proof "$p/mobile-seams/captured-c-source.json"
python "$p/baseline/native_b.py" --build "$PWD" --out /tmp/honro-54-touch-eave --touch-c --spirit
```

## R의 네 명

실제로 법당을 마치고 돌문턱을 걸어 작성한 58→59 새 기록을 390×844의 별도 창에서 열었다. 같은 산문에 네 몸이 접지했다. 소단·설오·휘겸·담허를 차례로 실제 탭으로 선택하고 조이스틱으로 서쪽 출구를 넘겼다. 열여섯 번의 trusted 터치 시작·종료를 기록했다. 마지막 담허 뒤 마당이 열렸고 네 명 모두 원래 마당 받침에 접지했다. 원래 기록 바이트를 유지했다. [R 수신](r-receiving-mobile.webp) · [마당 착지](r-courtyard-mobile.webp) · [터치 원자료](r-observed.json) · [58에서 작성한 R 기록](captured-r-source.json)

위 명령에 `--r-proof "$p/mobile-seams/captured-r-source.json"`을 더하면 같은 R 수신을 다시 열 수 있다.

58 실제 승리 직후 소단·설오·휘겸·담허를 터치로 선택하고 조이스틱으로 같은 `R.sill`을 네 번 건넜다. 390×844에서 16개의 trusted touch 시작·종료가 잡혔다. 실제 다음 장 탭 뒤 같은 객체·발점·상태와 같은 돌문이 59에 들어왔고 별도 일반 쉼터에서 같은 네 발점과 저장 바이트를 확인했다. 문턱 앞 보스전은 키와 버튼으로 진행했다. [58에서 네 발점](r-send-mobile.webp) · [59 라이브](r-receive-live-mobile.webp) · [송신·재로드·터치 원자료](../encounters/hall-pressure/phase-counterplay-touch-r58.json)

```bash
python game/docs/act6/mumyeongsa-p00-p10/baseline/daedosa_return.py --build "$PWD" --out /tmp/honro-58-touch-r --pressure --tactic ceiling --touch-return
```

## 두 화면 폭과 픽셀 비율

360×800 DPR 2와 430×932 DPR 3에서 실제로 작성한 B·C·D·R의 모든 수신 저장을 각각 독립 일반 쉼터에서 열었다. B에서 담허가 벽을 따라 이동하고 뛰어 같은 벽에 착지했다. C에서 같은 천장부터 정상축 (928,1136)으로 돌아왔다. D에서 네 발점과 실제 석단 보행을, R에서 실제 네 명의 조이스틱 귀환을 확인했다. 두 실행에서 각각 네 저장의 바이트가 같았다. 이 결과는 브라우저 화면·입력 검수다. [360 기록](contacts-360.json) · [360 화면](contacts-360.webp) · [430 기록](contacts-430.json) · [430 화면](contacts-430.webp)

```bash
p=game/docs/act6/mumyeongsa-p00-p10
python "$p/baseline/mobile_seams.py" --build "$PWD" --out /tmp/honro-mobile-scale-360 --size 360 800 --device-scale 2 --b-proof "$p/visual-atlas/capture-input-b.json" --c-proof "$p/mobile-seams/captured-c-source.json" --d-proof "$p/visual-atlas/capture-input-d.json" --r-proof "$p/mobile-seams/captured-r-source.json"
```

## 57에서 D를 실제로 송신

이전 호환 57을 모바일 일반 쉼터에서 열고, 곽진의 받침 수호와 네 몸의 재합류까지 키와 게임 버튼으로 진행했다. 새 석교가 열린 뒤 네 사람은 조이스틱과 초상화 탭으로 D를 건너 `local-07-08-exact-receiving-slice`에 접지했다. 최초 모바일 판은 휘겸의 이동력이 바닥나고, 소단이 목표를 지나 별도 암반에 섰다. 다시 실행할 때 이동력이 남은 실제 턴에 짧게 조이스틱을 밀었다. 390×844에서 신뢰된 터치 시작·종료 30개가 기록됐다. 58의 네 객체는 동일했고 별도 일반 쉼터의 발점 오차는 모두 `(0,0)`이었다. 저장 바이트도 같았다. [57 모바일 송신](d-send-mobile.webp) · [58 모바일 라이브](d-receive-live-mobile.webp) · [곽진·배우·접촉·재로드](d-send-native.json)

```bash
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --build "$PWD" --out /tmp/honro-57-touch-short --case live-d --touch-d
```
