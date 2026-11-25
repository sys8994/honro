# 57→58 D 수신과 58-B 법당

검수 빌드는 `npm run build`로 만든 일반 앱이다. 브라우저는 저장소의 이전 경계 기록을 격리된 새 프로필에 넣고 일반 쉼터와 실제 키·버튼 입력을 사용했다. 기존 57의 접촉 슬라이스에 58과 같은 석재 문틀을 그린다. 발면은 기존 57의 형상과 58의 기존 석단을 좌표 변환 `x−3200, y+758`으로 비교한다. 58 라이브 수신 코드는 기존 네 배우의 객체를 그대로 넘기고 곽진의 실제 수호 증거를 검증한다.

| 검수 | 관측 |
|---|---|
| 이전 57→58 저장 | 60Hz·120Hz 모두 일반 쉼터에서 열림. 설오·휘겸·소단·담허 모두 `local-lower-08-body`에 접지. 각 실행의 저장 바이트 해시 동일. [측정값](gallery.json) · [첫 화면](screens/d-receiving.webp) |
| 법당 상층 | 두 주사율에서 담허가 진입 발판에서 벽 `x=4380`으로 가속해 법선 `(-1,0)`에 접지. 점프로 벽을 벗어나고 같은 면에 재착지. 천장 `y=2570`으로 위쪽 가속해 법선 `(0,1)`에 접지한 뒤 왼쪽으로 나가 일반 마루에 착지. [벽](screens/body-wall-60.webp) · [천장](screens/body-ceiling-120.webp) |
| 대도사 등장 | 소단 기둥 의식과 담허 문턱 의식으로만 등장. 대도사 원래 리그·10500 HP 및 제기혼 둘의 원래 발점과 접지 유효. [등장 화면](screens/daedosa-entrance.webp) |
| 상층 포격 | 60Hz·120Hz 모두 천장에 접지한 담허가 마루의 열린 틈으로 실제 M01을 쏴 기존 제기혼 `a6-c08-vessel-a`를 맞혔다. 두 실행에서 체력 1100→809. [발사·충돌 로그](gallery-combat.json) · [충돌 화면](screens/hall-vessel-hit.webp) |
| 새 57→58 라이브와 새 저장 | 실제 입력으로 57의 받침 수리, 석교 개방, 결속 이송, 곽진 수호, 담허 합체와 네 배우의 같은 수신면 접지를 통과했다. 네 객체가 그대로 58에서 이어졌다. 일반 쉼터의 새 브라우저는 같은 발점과 배우 상태를 읽었으며 저장 바이트 해시가 동일했다. [57 출발 화면](screens/d-live-57.webp) · [58 첫 화면](screens/d-live-58.webp) · [새 저장 재로드](screens/d-new-checkpoint-58.webp) · [접지·배우 기록](live-d.json) |

처음에는 원본 대도사의 바닥 조회를 석단 하나로 제한해 먹메아리 예약 위치가 유효하지 않아 옛 58 저장이 열리지 않았다. 원본 지형 배열 전체를 사용하도록 수정한 뒤 다시 열었다. 천장 출구 또한 마지막 횡이동 전에 중력 구역에서 벗어나 화면 아래로 떨어졌다. 발이 출구선을 직접 넘은 시점에 정상 방향으로 복귀하도록 수정해 두 주사율에서 통과했다. 닫힌 마루의 첫 시험은 설오에게 맞았고 적 타격으로 세지 않았다. 92 world px 폭의 틈을 열어 보스·제기혼의 원래 발점은 유지하면서 실제 위아래 교전이 가능해졌다. [첫 충돌 기록](first-projectile.json)

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --build "$PWD" --out /tmp/honro-hall
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --case gallery-combat --build "$PWD" --out /tmp/honro-hall-combat
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --case live-d --build "$PWD" --out /tmp/honro-hall-live
```

57의 낮은 돌단 아래에서 갇힌 설오의 발점을 재현했다. 서쪽 징검석과 돌단 위 입력 경로를 확보하고, 새 석교에 끼일 위치에서는 지형 접힘을 거부하도록 접촉 검사와 안내를 붙였다. [발점 판정 기록](fold-contact.json)

실제 재합류 판은 서 있는 지점과 담허까지의 거리, 접힐 지형에서 유효한 접촉을 원본 경계 정의로 대조했다. 이후 소단 O06 실제 명중, 원래 네 객체의 D 통과와 새 58 저장을 확인했다. 네 발점의 선언 변환 오차는 모두 `(0,0)`이다. [재합류 원자료](reunion-native-57.json) · [D 송신 화면](screens/reunion-native-57.webp)

58→59 실전 승리와 59의 수신 계약은 [R 증거](../return-r/README.md)에 기록한다. 외부 더미 접합, 소단 지원 및 편성은 전체 증거 색인에 남긴다.
