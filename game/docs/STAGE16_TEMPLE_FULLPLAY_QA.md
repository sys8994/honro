# Stage16 잠운사 정상 입력 완주 검수

최종 검사일: 2026-10-09 UTC. `stage16-temple-fullplay.mjs`는 production App/Engine을 사용하는 정상 입력 실행기이며, `stage16-temple-fullplay-helper.mjs`는 입장 보상 원장·합법 수련·이동 경로 제안을 제공한다. 제작 지형/적/기예/승리조건을 바꾸지 않는다.

## 실제 캠페인 첫 진입 원장

production `HonroWorld.build → HonroProgression.initialize → complete → recruit`를 1→15 순서로 호출해 첫 완료 보상과 합류 보정을 계산한다. 11장 전에 실제 `HonroAct2.recruit`로 소단을 합류시킨다. 앞 15장을 플레이한 검증이 아니며, 완료 기록은 잠금 해제 및 보상 계산 fixture이다.

계산 결과 네 동행 모두 **37,445 XP·경지13·27SP**다. `legacyCampaignAnchor(15)`와 정확히 일치한다. 경지를 임의로 13/15로 설정하거나 `plan(16).entryLevel`을 현재 성장곡선에 대입하지 않는다. 단계별 시작/완료 한도, 합류 후 XP/경지/SP는 자동 생성 `readiness-ledger.json`에 남긴다.

원장의 실제 합류 수련값에서 정상 `untrain`으로 되돌리고 `train`, `investStat`, `sanitizeLoadout`으로 새 입장 준비를 한다. 149회의 정상 수련/환불 API 호출로 4명 각각 27/27점을 사용한다. 네 슬롯의 기예는 모두 배웠고 선행/경지/포인트 제한을 만족한다.

| 동행 | 장착 네 기예 | 기초 단련 | 입장 HP / 집중 |
|---|---|---:|---:|
| 설오 | A01 / A02 / A06 / A05 | 1 | 747 / 174 |
| 담허 | M01 / M10 / M11 / M04 | 0 | 774 / 235 |
| 휘겸 | S00 / S01 / S03 / S05 | 1 | 1455 / 195 |
| 소단 | O01 / O02 / O04 / O08 | 3 | 999 / 301 |

## 구조·방어·저장 계약

`stage16-temple-fullplay-semantics.mjs`는 명시적인 상태 fixture 검사다. 여기서만 구조/방어 조건을 격리하기 위해 actor 위치, 원혼 HP, 목표·라운드를 설정한다. 이 파일 통과를 정상 플레이 증거로 쓰지 않는다.

- 순서: `clear-court → monk → hall → hold-hall → record → clear-temple → witness`, 목표 7개와 적 행동 상한4.
- `monk`는 action=`act2`이다. 일반 action=`rescue`의 live-NPC 거리 추종을 새로 적용하지 않는다. E는 마커 거리260(세로0.75 가중), 층차150과 현재 행동 가능 여부를 확인한다.
- 주변 일반 위협이 사라지고 붙은 혼 HP가 40% 이하일 때 소단으로 분리할 수 있다. 다른 동행은 붙은 혼이 죽거나 제압되어 있어야 한다.
- 실제 구조는 살아 있는 `resident-1`을 요구한다. 원혼은 정상 처치 XP를 지급하고 해제되며, 승려 HP를 깎지 않고 해결 상태·최대 HP30% 보호막을 받는다. 중복 E는 보상을 반복하지 않는다.
- 보호 NPC는 승려 `resident-1` 950HP와 피난 주민 `objective` 1900HP다. 어느 쪽이든 쓰러지면 실패한다.
- 방어 반경680, 적 경합 반경260, 온전히 유지한5라운드, 유한 석등귀10명을 유지한다. 경합 중 진행0, 경합이 끝난 불완전 라운드도0, 이후 온전한5라운드의 증가를 검사한다. 새 잠운사에서만 서/동/서/동 예고를 저장하고, 각 파동이 예고보다 늦은 actorTurnSerial에서 생성되는지 확인한다.
- production export/Continue에서 actor, 지형, 소모품, 라운드/phase/side/active, 목표/방어/파동, 성장 원장, 마커와 이벤트를 정확히 보존한다. fixture 저장 전에는 격리용 위치를 원래 유효 입장/생성 위치로 되돌린다. 정상 완주 실행기는 이런 보정을 하지 않는다.

## 최종 결과: 동결 정책 fresh

게임 원본 동결은 `4d17a3162534aad66d4172197c8087c619dd5605`다. 최종 test-only 입력 정책은 `06f0ab9`에 보관했다. 아래 fingerprint가 실행한 실제 production source와 controller를 식별한다. 최초 blockout 또는 중간 탐색 정책의 결과를 합산하지 않는다.

**2026-10-09 05:06 UTC, 새 입장부터 재시도·재개 없이 47라운드에 승리했다.** 초기35명(일반34+붙은 혼1), 명시 정예8, 유한 증원10, 적 행동상한4와 목표7개를 그대로 사용했다. 실제 원본35+증원10 모두 처리했고, 승려 구조·법당 방어·기록·증언을 production App에서 완료했다.

- 동행 사망0. 최종 HP는 설오717.6/747, 담허774/774, 휘겸1455/1455, 소단903/999.
- 보호 NPC는 승려925/950(구조 완료·보호막285), 피난 주민1818/1900으로 생존.
- **소모품 사용0**. 입장/완료 모두 회복3·집중3·정화2·방호2를 그대로 보유.
- 새 입장 뒤 actor HP/좌표/집중/이동력, 목표 완료값, 적 목록을 직접 수정하지 않았다. 이동·기본 점프·발사·방어·E 및 production 물리/임무/성장만 진행했다.
- 실제 HP 피해는 동행합계2008, 적합계45,955다. 방어·회생진목·회기시·레벨/회복 등 정상 규칙이 최종 HP에 반영되므로 시작/끝 HP 차이와 같지 않다.

| 측정 | 관측값 |
|---|---:|
| 정상 발사 / 이동 구간 / 방어 | 144 / 76 / 75 |
| 기본 점프: 계획 / 경로 회복 | 12 / 7 |
| 실제 착지 기록 / E / 회생진목 | 29 / 4 / 2 |
| 경로 제안 실패 / 총 기록 항목 | 13 / 362 |
| 입력 API 호출 / 대화 줄 | 27,253 / 32 |
| production Engine tick | 113,891 |
| native simulation 누적 | 949.092초, 약15분49초 |
| 가상 대화/턴 표시 대기 | 0.767초 |
| 순수 조준 탐색·발사 dispatch wall time | 250.612초 |
| native physics wall time | 73.531초 |
| Node combat segment 전체 wall time | 332.243초 |
| 의도적인 bot idle wait wall time | 0초 |

`회복 점프`도 같은 정상 `Engine.jump` 입력이다. 포즈나 이동력을 보정한 뜻이 아니다. 소모품을 사용한 회복도 아니다. `defend`는 발사 후 후퇴 행동과 같은 actor-turn 안에 있을 수 있으므로, 방어75를 비공격75턴으로 해석하지 않는다. native simulation/가상 표시대기/Node 계획시간은 사람 플레이 시간·적정시간·최소시간의 증거가 아니다.

### 목표와 방어 파동

실제 `act2.checkpoints`의 완료 라운드:

| 목표 | 완료 라운드 |
|---|---:|
| 앞마당 제압 | 16 |
| 승려 구조 | 16 |
| 기록방 문 | 17 |
| 법당 방어 | 26 |
| 금기 문서 | 38 |
| 잔존 적 전부 제압 | 46 |
| 생존 승려 증언 | 47 |

방어에 R17 진입하여 R26 완료했다. 보호 범위/경합/입구 점유 조건 때문에 최종 유지 진척은6이다. 원래 승리조건은 **최소5회 온전한 방어와 증원10명 생성**이므로, 파동이 기다리는 동안 유지 진척이5를 넘는 것을 실패로 취급하지 않는다.

서/동/서/동 네 파동은3/3/3/1명이다. 예고→출현 actor-turn serial은156→167,176→177,186→199,206→249이고, 출현 라운드는18/19/21/26이다. 첫 서측은 대체입구 x5330, 마지막 동측은 대체입구 x8260을 사용했다. 모든 출현이 예고보다 뒤의 실제 actor 경계이며, 동행과 겹친 기본입구 대신 같은 방향의 검증된 대체입구를 쓰는 생산 규칙이 이 fresh 실행에서도 관측되었다.

### 공격 없는 방어와 정체를 구분한 분석

`wait-analysis.json`은 actorTurnSerial 안에 받아들여진 발사 없이 방어한 턴을 센다. 걷기/점프가 포함될 수 있다. 별도 `detailed-actions.json`의 정지형 방어는 발사·기록된 이동·점프·착지·E·회생진목이 없는 방어 턴이며, 거절된 경로 제안이나 아주 작은 위치 변화는 있을 수 있다.

| 동행 | 발사 / 이동 / 방어 | 비공격 방어 총수 / 최장 연속 | 정지형 방어 총수 / 최장 연속 |
|---|---|---|---|
| 설오 | 37 / 39 / 45 | 8 / 4턴(R7–10) | 4 / 4턴(R7–10) |
| 담허 | 28 / 15 / 16 | 16 / 4턴(R7–10) | 7 / 3턴(R8–10) |
| 휘겸 | 33 / 15 / 14 | 14 / 4턴(R7–10) | 6 / 3턴(R8–10) |
| 소단 | 46 / 7 / 0 | 0 / 0 | 0 / 0 |

R1–46의 모든 라운드에는 적어도 한 번 실제 발사가 있었다. 전원에게 발사가 없던 라운드는 이동+증언E로 끝난 R47뿐이다. 적 HP/목표/방어 상태가 같고 전 동행의 라운드 간 이동이40px 미만인 연속 정체 구간은 관측되지 않았다. 이40px 기준은 controller 상태 분석이며 사람의 체감 정지나 입력 없는 실시간 대기를 뜻하지 않는다.

13개의 경로 제안 실패는 겹친 사면에서 가짜 역방향 지지면 연결을 고르거나, 정상 점프 후 반사벽 위에 착지한 경우다. 최종 helper는 실제 지지면을 기준으로 재탐색하고, 실패한 보행 지지면 연결을 반복 선택하지 않으며, 실제 보행 윗변 끝에서 유효한 아래 지지면으로 step-off한다. 게임 좌표를 보정하지 않고 계속 진행했다. O08 현형부는 실제로5회 발사했다.

## 최종 fresh 저장의 실제 Continue

위 fresh 실행의 R47 증언 직전 production export를 `fullplay-4d17-final-continue/`에서 그대로 읽었다. App Continue 후 전체 actor, 지형, 소모품, 라운드/phase/side/active, 목표/방어/파동을 포함하는 `honroState`, 성장 원장, 마커/이벤트와 잠운사 증원입구를 deep equality로 확인했다. 이어 정상 이동+E+대화로 같은 R47에 승리했다. 추가 sim18.508초·가상 대화0.117초이며 별개의 fresh 완주 횟수로 세지 않는다.

보상 원장·합법 수련·구조/주민 실패·유한 방어·fixture 저장 왕복도 복원된 최종 source에서 재실행하여 PASS했다. `_local/reports/stage16-temple/semantics/`가 그 결과다.

## 탐색 및 복원 기록: 최종 fresh와 분리

04:36 UTC 실행 환경 교체로 초기 blockout 작업 트리와 생성 증거가 사라졌다. 네 검사/문서 파일을 도구 호출 원문에서 복구했고, 그 뒤 최종 원본에서 다시 검사했다. 초기 소실 증거가 현재 남아 있다는 주장은 하지 않는다.

`fullplay-4d17-fresh`와 `fullplay-4d17-continue-nav1`부터 `nav6`까지는 같은 실제 전투를 중간 helper 수정 후6차례 Continue한 탐색 증거다. R104에서45명처리·목표7개·4인/NPC2명생존·소모품사용0으로 승리했으나, 방어298회·경로 실패177회·최장27연속 비공격 방어가 포함되어 있다. 이것을 정상 fresh 페이싱이나 현재 정책의 새 완주 횟수로 쓰지 않는다. `nav3/4/5`의 종료는 입력 controller 정체 제한이며 게임 패배가 아니다. 중단 당시 checkpoint와 결과/중단 이유를 그대로 보관한다.

수정한 것은 test-only 경로 제안과 결과 단언이다. 가까운 서로 다른 지지면을 임의 양방향으로 연결하던 부분, 사다리꼴 bbox 대신 실제 보행 윗변을 사용해야 하는 부분, 이미 실패한 역통과의 재시도, 유한 입구 지연 때 방어 진척이 정확히5여야 한다던 잘못된 단언을 바로잡았다. production 지형·적·HP·전투·목표는 동결 뒤 바뀌지 않았다.

## 원본 증거와 fingerprint

최종 결과는 `_local/reports/stage16-temple/fullplay-4d17-final-fresh/`의 `initial`, `readiness-ledger`, `camp-training`, `checkpoint`, `result`, `trace`, `wait-analysis`, `detailed-actions`, `final-battle` JSON과 `run.log`다. 실제 재개는 인접 `fullplay-4d17-final-continue/`에 같은 형태로 남긴다.

- 전체 project SHA-256: `71c1d14ab1bbb205d2e77929d30719fc298c23acc953c82dccb871f7219e0bdb`
- 전체 runtime SHA-256: `798ebd3a4923d436a7d1f940b62a96e034d66260c9fd8ed84e7d9d881a871802`
- gameplay project SHA-256: `164bc145809ac88c35b1486d47a77f8217de9680f3938efe7e9c1298b287217b`
- gameplay runtime SHA-256: `a35992a4a3482875861dfb7efaf5799b083ba96aa19a26e8fa90b20a4aa7d773`
- 최종 controller SHA-256: `675ec23b29546297772a8f8153b3ea433c7162dca2fb873f58982e5dc346e579`
- 최종 helper SHA-256: `b06a096459bfe42f761f1e2c2319cdc3b99b8ef6c447c0e8dfd67b5770846196`

## 정상 입력 실행 범위

- 실제 App `launch`, 임무 판정, 대화 넘기기, E, 방어, export, Continue 및 Engine 이동·기본 점프·발사를 사용한다.
- 새 입장 뒤 HP/좌표/집중/이동력/적 목록/목표 완료값을 직접 바꾸지 않는다. 소모품 사용0, 보호 NPC 생존, 모든 목표와 최소5라운드 방어 및 증원10명의 완료를 단언한다.
- 숨은 혼령을 소단이 공격할 때 장착된 O08 현형부를 우선 제안한다. 실제 발사는 production 예측·자원·행동 가능 조건을 통과해야 한다.
- 모든 라운드 시작과 목표 경계에서 production export를 저장한다. 재개는 같은 project/runtime fingerprint를 요구하고 actor뿐 아니라 턴·목표·파동·지형·성장도 deep equality로 검사한다.
- 기록: `_local/reports/stage16-temple/<실행명>/`의 원장, 수련, 초기 전장, 라운드 checkpoint, trace, result, wait-analysis 및 final-battle. 생성 증거는 Git에 포함하지 않는다.
- DOM/Canvas/오디오/다운로드/벽시계는 test double이다. 실제 브라우저 UI·시각 가독성·사람의 난도·사람 플레이 시간의 검증이 아니다. native tick 시간, 가상 대화 대기, 순수 조준 계획 wall time, native physics wall time은 각각 기록한다.

## 재현

```sh
node tests/stage16-temple-fullplay-semantics.mjs
HONRO_FULLPLAY_OUT=_local/reports/stage16-temple/fullplay-recheck \
HONRO_FULLPLAY_PRODUCTION_COMMIT=4d17a3162534aad66d4172197c8087c619dd5605 \
node tests/stage16-temple-fullplay.mjs
```

기존 증거를 덮어쓰지 않도록 새 OUT 경로를 사용한다. `HONRO_FULLPLAY_CONTINUE=<checkpoint.json>`은 해당 저장에서 정상 입력으로 이어간다. `HONRO_FULLPLAY_PROVENANCE_ONLY=1`은 현재 fingerprint만 기록한다. 개발용 `ROUND_LIMIT`/`ACTION_LIMIT` 중지는 승리/패배와 구분한다.

## 외부 거대 석불을 추가한 뒤의 증거 경계

47라운드 새 입장 완주·실제 Continue는 외부 석불 추가 전의 동결 미술에서 실행했다. 이후 `dbef41c`는 충돌 없는 asset1개와 후경 element1개만 추가하며 기존 전투·목표·지형·동행·적을 바꾸지 않는다. 전체 project/runtime fingerprint는 미술 데이터 때문에 바뀌지만 위 gameplay project/runtime 두 fingerprint는 그대로다. 추가 뒤의 exact art delta, 실제 compiled battle 동일성, 저장 호환을 별도 검사하고 새 완주로 세지 않는다. [외부 석불 검수](STAGE16_TEMPLE_BUDDHA.md).

천개와 후덕한 볼을 정리한 석불 revision2도 같은 asset1개만 수정한다. 전체30장 JSON과 다른539개 자산/순서가 그대로이며 두 gameplay fingerprint는 변하지 않는다. 이 미술 수정 역시 새로운 정상 전투 실행으로 세지 않는다.
