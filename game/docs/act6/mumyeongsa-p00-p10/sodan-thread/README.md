# P40 소단의 육신과 혼줄

| 상태 | 기예와 조작 |
|---|---|
| 55 외부 돌단 | 장착한 O13 호혼령만 보조 버튼에서 허용한다. O01–O12와 O14–O16 직접 기예를 봉인한다. 이동·도약·전환·밀림을 막고 돌단 위 원본은 피해를 받는다. |
| 53·54·56 내부 혼 | 배운 O06 주박부를 장당 한 번 허용한다. 담허의 행동을 사용하고 실제 투사체와 상태 효과를 낸다. 일반 네 배우 목록에 육신을 복제하지 않는다. |
| 57 보호 받침 | 돌단 수성에서 보호 받침 이송으로 넘어가며 일반 이동이 가능하다. 담허 합체 이전에는 O13만 허용하고, 합체 뒤 기존 장착 기예와 진입 조작을 되돌린다. |

52의 실제 네 원본 영수증에 있는 소단으로 혼줄을 시작한다. 55는 53·54의 실제 소모 기력을 외부 원본에 한 번 적용하고 57은 56의 새 소모만 적용한다. 원본의 체력·장비와 내부 기예 전용 상태는 따로 유지한다. 54에서 주박부 투사체의 비행이 끝나고 수문지기가 죽어야 차트로 넘어간다. 기존 투사체 및 물·진목·소환 제한을 유지했다.

| 확인 | 결과 |
|---|---|
| 54 B → 차트·M09·C | 소단의 O06이 기존 수문지기의 체력을 600→236으로 낮췄고 담허의 M01이 나머지를 제거했다. 실제 차트·M09·C 뒤 새 55 기록을 열었다. 54에서 기력 36을 사용한 영수증을 확인했다. [로그](b-to-bell.json) · [혼줄 화면](screens/spirit-on-b.webp) |
| 53 내부 혼 지원 | 일반 53 서고에서 소단의 실제 O06으로 원래 적 290→0. 같은 판에서 54 B를 교전하고 두 장의 O06을 사용한 영수증으로 새 55를 다시 열었다. [120Hz 실측](../encounters/wall-60-120.json) |
| 55 피격 → 좌정 복구 | 휘겸이 방어선에 닿은 뒤 실제 HLN01이 결속을 약하게 했다. 좌정 소단을 선택 키와 초상으로 바꿀 수 없었다. 소단은 (2688, 1700.3077)에서 같은 arrival-core-terrace 접촉을 유지하며 결속을 복구했다. 설오가 실제 포격으로 빈종각귀를 격파하고 휘겸이 결속을 정렬했다. 새 56 기록의 라이브와 재로드를 확인했다. [로그](bell-repair.json) · [좌정 화면](screens/seated-at-bell.webp) |
| 55 온전한 결속 방어 | 설오의 A02와 휘겸의 S03으로 빈종각귀 체력을 480→276→11로 내렸다. 이어 발생한 빈종각귀의 HLN01 범위 피해로 자기 체력이 0이 됐다. HLN01은 결속 범위 밖 휘겸도 맞혔고 다른 적의 LA01이 소단을 맞혔다. 결속은 내내 온전했고, 수리 없이 `intactBellAlignedAfterGateDefeat`를 남겨 라이브 및 새 컨텍스트에서 56을 열었다. [로그](bell-intact.json) · [정렬 화면](screens/bell-intact.webp) |
| 55 방어 실패 | 복구하지 않고 가만히 있으면 실제 HLN01 두 발이 돌단의 소단에게 닿고 3라운드에 패배한다. 장 소유자가 붕괴를 기록해도 전투가 계속되던 문제를 고쳤다. 이 경로에서 56 저장을 쓰지 않았다. [로그](bell-collapse.json) · [패배 화면](screens/bell-collapse.webp) |
| 55 터치 복구 | 390×844에서 소단 초상 탭을 거부하고 휘겸이 실제 터치 조이스틱과 도약으로 종터에 닿았다. HLN01 피격 뒤 실제 복구 버튼을 탭해 결속을 복구했다. 소단 발점과 지지면, 기존 저장은 동일했다. [로그](mobile-bell.json) · [화면](screens/mobile-bell.webp) |
| 55 장착 O13 | 격리된 검수 기록에서 소단에게 O13을 장착하고 일반 55를 열었다. 실제 버튼 탭으로 투사체가 나가 원본 소단 소유의 호혼령이 `(2614.43, 1677.67)`에 생성됐다. 소단 발점과 저장 바이트를 유지했다. [로그](mobile-warden.json) · [화면](screens/mobile-warden.webp) |
| 57 네 원본 재합류 | 기존 57 저장에서 합체 전 O06 거부, 합체 후 같은 소단 원본의 O06 실제 명중(보조 적 850→0), 네 명의 D 직접 통과와 58 새 저장을 확인했다. [로그](reunion.json) · [재합류 화면](screens/sodan-reunited.webp) |
| 56 혼 기예 → 새 57 저장 | 기존 56 저장을 열었다. 첫 하강에서 소단의 O06이 기존 적의 체력을 987→440으로 낮췄다. 가름진의 +145→−145 역류를 지나 57에 들어갔다. 소단 육신의 기력이 751→715로 한 번 차감됐고 새 컨텍스트에서 같은 장과 저장 바이트를 확인했다. [로그](deep-to-reunion.json) · [57 수신 화면](screens/deep-to-reunion.webp) |

외부에서는 O06 사용을 막으므로 온전한 결속 판에 O06 차단을 적용하지 않았다. O13 표본은 장착 시험 기록에서의 실제 시전과 소환까지 확인했다.

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/native_b.py --build "$PWD" --out /tmp/honro-sodan-b --hz 120 --spirit
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-repair --bell-only --bell-case repair
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-intact --bell-only --bell-case intact
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-collapse --bell-only --bell-case collapse
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --build "$PWD" --out /tmp/honro-sodan-reunion --case live-d --sodan
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-deep --deep-thread
python game/docs/act6/mumyeongsa-p00-p10/baseline/mobile_bell.py --build "$PWD" --out /tmp/honro-sodan-mobile
python game/docs/act6/mumyeongsa-p00-p10/baseline/mobile_bell.py --build "$PWD" --out /tmp/honro-sodan-warden --warden
```

### 53 터치에서 재사용 및 기력 부족 차단

390×844에서 일반 쉼터로 53을 열고 실제 조이스틱으로 적의 사정권에 들어갔다. 평상 기록에서는 주박부를 눌러 O06 실제 명중을 확인한 뒤 방어 턴이 돌아와 같은 위치를 다시 탭했다. 공격 수와 혼 기력, 장착 목록이 재탭 전후 정확히 같았다. 비교판은 같은 53 기록을 격리 복제하고 보관된 소단의 시작 기력만 0으로 맞췄다. 해당 복제판에서 적과 담허가 접지한 상태로 버튼이 비활성화됐고 입력 뒤 실제 발사 수가 그대로였다. 두 판 모두 일반 저장 바이트와 담허의 기예 목록을 보존했다. 기력 고갈 자체를 정상 성장 플레이로 재현한 기록은 아니다.

[기력·발사·장착 원자료](sodan-acceptance.json) · [사용 후 재탭](actual-use-and-retap.webp) · [기력이 없는 복제판](low-focus-copy.webp)

```bash
python game/docs/act6/mumyeongsa-p00-p10/baseline/sodan_acceptance.py --build "$PWD" --out /tmp/honro-sodan-acceptance
```

57 일반 저장에서 담허 회수 전 O06이 차단된 것을 확인했다. 회수 뒤 동일한 기예 배열을 가진 소단이 다시 실제 O06을 적중시켰고 사용 뒤 배열도 그대로였다. 네 원본은 동일 객체로 D를 건넜으며 58 새 컨텍스트가 같은 저장 바이트를 읽었다. [57 복귀와 명중](restore-loadout.json)
