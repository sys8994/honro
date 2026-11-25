# C·D 모바일 수신과 접지

Chromium 390×844에서 일반 쉼터의 이어가기를 탭하고 실제 조이스틱 터치로 움직였다. 각 표본은 기존 일반 저장과 장 경계의 바이트가 같았다.

| 범위 | 실제 입력과 관측 |
|---|---|
| C의 56 수신 | 실제 55에서 작성한 새 경계를 다시 열었다. (736,900)에서 위쪽 중력, 법선 (0,1)과 찢어진 처마 발점을 확인했다. 조이스틱을 오른쪽으로 밀어 정상 방향 (0,320)으로 돌아와 (928,1136)의 승인 난간에 착지했다. 66개 프레임 발점·중력 표본. [천장](c-ceiling-mobile.webp) · [착지](c-veranda-mobile.webp) |
| D의 58 수신 | 이전 호환 경계를 열었다. 네 배우의 초기 발점은 같은 `local-lower-08-body`였다. 담허의 조이스틱 왼쪽 이동으로 x=2780.04→2663.94를 실제 걸었으며 같은 석단에 접지했다. [초기 네 발점](d-receiving-mobile.webp) · [실제 이동](d-step-mobile.webp) |

C의 54 송신과 D의 57 송신을 모바일에서 직접 완료하는 테스트는 남아 있다. C와 D 두 표본에서 trusted touch 시작/종료를 각각 관측했다.

[측정 원자료](observed.json) · [C 실제 경계](captured-c-source.json)

```bash
npm run build
p=game/docs/act6/mumyeongsa-p00-p10
python "$p/baseline/mobile_seams.py" --build "$PWD" --out /tmp/honro-mobile-seams --c-proof "$p/mobile-seams/captured-c-source.json"
```

## R의 네 명

실제로 법당을 마치고 돌문턱을 걸어 작성한 58→59 새 기록을 390×844의 별도 창에서 열었다. 같은 산문에 네 몸이 접지했다. 소단·설오·휘겸·담허를 차례로 실제 탭으로 선택하고 조이스틱으로 서쪽 출구를 넘겼다. 열여섯 번의 trusted 터치 시작·종료를 기록했다. 마지막 담허 뒤 마당이 열렸고 네 명 모두 원래 마당 받침에 접지했다. 원래 기록 바이트를 유지했다. [R 수신](r-receiving-mobile.webp) · [마당 착지](r-courtyard-mobile.webp) · [터치 원자료](r-observed.json) · [58에서 작성한 R 기록](captured-r-source.json)

위 명령에 `--r-proof "$p/mobile-seams/captured-r-source.json"`을 더하면 같은 R 수신을 다시 열 수 있다.
