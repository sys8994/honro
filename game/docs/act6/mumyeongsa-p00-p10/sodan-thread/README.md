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
| 57 네 원본 재합류 | 기존 57 저장에서 합체 전 O06 거부, 합체 후 같은 소단 원본의 O06 실제 명중(보조 적 850→0), 네 명의 D 직접 통과와 58 새 저장을 확인했다. [로그](reunion.json) · [재합류 화면](screens/sodan-reunited.webp) |
| 56 혼 기예 → 새 57 저장 | 기존 56 저장을 열었다. 첫 하강에서 소단의 O06이 기존 적의 체력을 987→440으로 낮췄다. 가름진의 +145→−145 역류를 지나 57에 들어갔다. 소단 육신의 기력이 751→715로 한 번 차감됐고 새 컨텍스트에서 같은 장과 저장 바이트를 확인했다. [로그](deep-to-reunion.json) · [57 수신 화면](screens/deep-to-reunion.webp) |

55의 실제 O13은 기예가 장착된 기록으로 추가 검수가 필요하다. 외부에서는 O06 사용을 막으므로 무피격 결속 판에 O06 차단을 적용하지 않았다. 모바일 좌정·복구는 별도 검수한다.

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/native_b.py --build "$PWD" --out /tmp/honro-sodan-b --hz 120 --spirit
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-repair --bell-only --bell-case repair
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-intact --bell-only --bell-case intact
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-collapse --bell-only --bell-case collapse
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_passage.py --build "$PWD" --out /tmp/honro-sodan-reunion --case live-d --sodan
python game/docs/act6/mumyeongsa-p00-p10/baseline/relay_live_chain.py --build "$PWD" --out /tmp/honro-sodan-deep --deep-thread
```
