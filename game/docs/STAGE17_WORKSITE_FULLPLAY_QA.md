# Stage17 작업장 정상 입력 완주 검수

검사일: 2026-10-09 (UTC). 실행기는 `tests/stage17-worksite-fullplay.mjs`이며, 경로 제안과 입장 성장 원장 검사는 `tests/stage17-worksite-fullplay-helper.mjs`에 한정된다. 테스트는 제작 지형·적·승리조건을 수정하지 않는다.

## 검증 범위

- 실제 production App의 `launch`, `mount`, 임무 판정, 대화 넘기기, E 상호작용, 방어, export, Continue 및 실제 Engine의 이동·기본 점프·장착 기예 발사를 사용한다.
- DOM/Canvas/오디오/저장 다운로드/벽시계는 test double이다. 입력 정책은 전장 상태·작성된 경로·탄도 예측을 읽는 자동화 봇이다. 브라우저 조작, 사람의 시야·조준·반응, 실제 화면 가독성, 사람 플레이 시간의 증거가 아니다.
- Stage17 진입 뒤 HP/좌표/이동력/집중/적 roster/목표 완료값을 직접 바꾸지 않는다. 시나리오 포즈·적 제거·숨은 승리 처리·소모품 사용은 없다. 실제 방어 행동의 회복·방패 및 기예·성장 효과는 정상 규칙으로 발생한다.
- 모든 라운드 시작에 production export를 저장하고 actor 목록이 현재 전장과 정확히 같은지 검사한다. Continue는 원본 project/runtime fingerprint를 요구하고 전체 actor 목록 보존을 검사한다.
- 입력별 trace, 라운드 상태, 실제 피해, 사망, 경고와 증원 발생 actor-turn serial, 대화, 초기/마지막 전장 및 fingerprint를 `_local/reports/stage17-worksite/`에 남긴다. 이 디렉터리는 생성 증거이므로 Git에는 넣지 않는다.

## 실제 캠페인 입장 준비값

`plan(17).entryLevel=15.6`에 현재 성장곡선의 `xpAt`를 적용하면 60,599 XP/실제 15레벨이 된다. 이것은 정상 1→16 첫 완료 보상에 비해 과준비다. 따라서 이 값으로 한 초기 보조 완주를 최종 정상 입장 증거로 사용하지 않는다.

최종 검사는 production `initialize → complete → recruit`로 1→16의 **보상 원장만** 순서대로 계산한 결과를 사용한다. 이는 앞 16장을 실제 플레이했다는 주장이 아니다. 모든 동행은 41,755 XP/실제 13레벨이며, `legacyCampaignAnchor(16)`과 일치한다. 단순 `rewardXpAt(15.6)=40,398`에 빠진 동료 합류·진입 보정도 이 경로에서 반영된다. 검증 원장은 각 실행의 `readiness-ledger.json`에 있다.

준비 프로필의 앞 장 완료 기록은 입장 잠금/성장 원장 fixture이다. Stage17은 새로 시작하며 어떤 현재 목표도 완료되어 있지 않다. 난이도는 Normal이다. `C.train`으로 각각 27점만 사용하고 남은 점수는 정상 능력치 수련에 배분한다. 네 슬롯 모두 실제 배운 기예인지 검사한다.

| 동행 | 장착 네 기예 | 능력치 수련 | 초기 HP / 집중 |
|---|---|---:|---:|
| 설오 | A01 평사, A02 관통시, A06 회기시, A05 격퇴시 | 1 | 747 / 174 |
| 담허 | M01 기파, M10 회생진목, M11 반탄파, M04 뇌호 | 0 | 774 / 235 |
| 휘겸 | S00 평참, S01 도약참, S03 횡참, S05 회신참 | 1 | 1455 / 195 |
| 소단 | O01 혼령탄, O02 투과령, O04 황천창, O08 현형부 | 3 | 999 / 301 |

세부 능동·지속 기예 랭크는 `initial.json`과 `result.json`에 전부 기록한다. 준비값은 임의로 높인 최고 수준이나 무수련 기본 공격만의 검증과 다르며, 이 특정 합법 빌드에 대한 결과다.

## 최종 결과

최종 동결 production commit: `862daa4cc80544f344181d590cf083621dc5c3c3`.

최종 source의 36 초기 적, 명시 정예 8과 인양틀 우두머리, 유한 예고 증원 10, 동시 행동 상한 3, 목표 7개를 그대로 사용한다. **새 입장부터 63라운드에 승리했다.** 재시도·재개 없이 완료한 한 번의 fresh 실행이다. 36 원본과 10 증원 모두 쓰러졌고, 일곱 목표 완료와 방어 5라운드가 실제 App 판정에서 확인되었다. 사망 0, 소모품 0이다. 소모품은 입장/완료 모두 회복 3·집중 3·정화 2·방호 2로 동일하다.

| 측정 | 최종 관측값 |
|---|---:|
| 최종 HP: 설오 / 담허 / 휘겸 / 소단 | 747 / 774 / 1455 / 809 |
| 동행 총 실제 HP 피해 / 적 총 실제 HP 피해 | 870 / 43,838 |
| 정상 발사 / 기본 점프 / E | 132 / 34 / 3 |
| 정상 방어 / 이동 구간 / 착지 기록 | 141 / 77 / 50 |
| 입력 API 호출 / 기록된 경로·행동 항목 | 28,276 / 443 |
| 대화 줄 | 25 |
| production Engine tick 누적 | 122,239 tick = 1018.658초 (약 16분 59초) |
| 별도 가상 대화/턴 알림 대기 | 0.65초 |
| 조준 탐색·발사 dispatch wall time | 303.755초 |
| native physics wall time | 73.146초 |
| 전체 Node combat-segment wall time | 388.193초 |
| 의도적인 bot idle wait wall time | 0초 |

63라운드와 위 sim 시간은 **이 입력 정책의 관측값**이다. 사람에게 필요한 시간·최소 시간·숙련 플레이 시간이나 페이싱 승인으로 해석하지 않는다. 검사 시작의 성장 원장 준비/번들 로드는 combat-segment wall time에서 제외되어 있다.

라운드 경계에서 처음 관측한 목표는 작업장 정리 R1, 버팀목 R5, 인양틀 R6, 수리 R9, 방어 R12, 잔존 적 정리 R22, 기록 R63이다. 실제 E는 담허의 버팀목 R5, 휘겸의 수리 R11, 설오의 기록 R63이었다. 방어 진입은 R11, 진척 5 도달은 R22이며, 지킴이가 반경 밖에 있었던 동안은 진척이 멈췄다.

서/동/서/동 네 파동은 각각 3/3/3/1명이다. 경고→출현 actor-turn serial은 90→91, 97→98, 106→107, 115→116이며 출현은 R11/12/13/14였다. 각 출현이 경고 이후 실제 동행/적 행동 단계를 지난 뒤인지 자동 검사했다.

### 공격 없는 방어와 경로 계획 한계

`wait-analysis.json`은 actor-turn serial별로 실제 발사 없이 방어한 횟수를 센다. 해당 턴에 걷기·점프는 있을 수 있으므로, 숫자를 아무 입력도 없는 정지 시간으로 바꾸지 않는다.

| 동행 | 공격 없는 방어 턴 총수 | 가장 긴 연속 구간 |
|---|---:|---|
| 설오 | 35 | 33턴, R30–62 |
| 담허 | 35 | 31턴, R32–62 |
| 휘겸 | 41 | 38턴, R25–62 |
| 소단 | 3 | 2턴, R49–50 |

전 동행에게 실제 발사가 없던 최장 구간은 R49–50의 2라운드였다. 소단이 중간 다리를 역방향 기본 점프로 건너 서쪽 상부 계단에 오르는 이동 구간이었다. R57에도 발사 없이 소단이 상부에서 기록 쪽으로 돌아왔다. 마지막 R63은 이동+E 완료라 별도 취급한다.

후반이 길어진 주요 원인은 입력 정책이다. R31 이후 남은 적은 숨은 혼령이며 production `HonroAct2.visible`은 현재 선택 동행의 혼 시야를 따른다. 봇은 높은 직접 피해를 우선하여 장착한 O08 현형부를 쓰지 않았고, 소단이 대부분의 후반 혼령 정리를 혼자 수행했다. 다른 동행을 위한 현형·목표 배분을 최적화하지 않은 결과다.

`no graph route` 여섯 번은 모두 휘겸이 선택 기록 작업대 `ws-notes-work-deck`, 약 (10016, 4539)에 있던 R25–30에 발생했다. 목표는 R25의 동쪽 상부 박쥐 `a2-enemy-11`, R26의 하부 `ws-gallery-cart`, R27–30의 서쪽 상부 박쥐 `a2-enemy-10`이었다. 이 test helper에 해당 선택 작업대의 보행 이탈 연결이 없어서 후보 경로 탐색이 실패했다. 실제 충돌벽에 갇혔다고 판정한 결과가 아니다. 별도의 `notes-deck-access`와 `main-return` 격리 물리 검사는 네 몸체 전원 통과했으며, 근거는 `verification/stage17-traversal.log` 및 `stage17-worksite-traversal.mjs`의 supplemental 경로다. 이 한계가 있었지만 다른 동행의 정상 행동으로 진행했고, 포즈 수정 없이 일곱 목표를 마쳤다.

### 같은 13레벨 실제 저장의 Continue

최종 실행의 R63 기록 직전 production export를 `fullplay-level13-36-final-continue`에서 다시 읽었다. production App Continue 뒤 actor 전체, 지형, 소모품, 라운드/phase/side/active, `honroState`(목표·방어·파동), 성장 원장, 마커/이벤트, 서동 증원 진입점이 저장과 정확히 같은지 deep equality로 검사했다. 이후 정상 이동+E와 대화로 R63 승리까지 완료했다. 추가 sim은 0.942초이며, 새 fresh 완주나 다른 난이도 검증으로 더하지 않는다.

최종 원본 증거: `fullplay-level13-36-final/{initial,readiness-ledger,checkpoint,result,trace,wait-analysis,final-battle}.json`. 재개 증거는 `fullplay-level13-36-final-continue/`에 같은 형태로 남긴다.

- 전체 project SHA-256: `d15ce27ee71c26643c76c207cc712a75c429cc7a860d510a389ecf83ccf0e09b`
- 전체 runtime SHA-256: `30f4292957fb421637afca6dd435ff70f53b8775d0e856ded4472a5d611fe358`
- gameplay project SHA-256: `68b26dcd47947fd416c4ffd5df0c566da642d3ee479af2b1f4a4c513fccd9f40`
- gameplay runtime SHA-256: `daeb6c70a3d9192d886a7f5a9628f55b8ad9da2925c44f7fe9479db83451a98a`

후속 test-only 분석/Continue 단언 보강은 source gameplay를 바꾸지 않았다. 각 결과에는 해당 실행 당시 controller/helper hash도 별도로 남아 있다.

## 시도 기록 보존

1. `fullplay-attempt1`: 옛 24 초기 적/과준비 실제 15레벨 보조 실행. 29라운드 승리, 사망 0, 소모품 0. 새 36 편성 또는 정상 13레벨의 증거가 아니다. 초기 timing의 `botPlanningSeconds`는 이동/물리도 포함한 controller 작업 시간이라 순수 계획 시간으로 사용하지 않는다.
2. `fullplay-attempt1-continue`: 위 실행의 29라운드 실제 export를 production Continue로 읽어 actor 상태를 정확히 보존한 뒤, 정상 이동+E로 종료한 재개 검사. 독립적인 새 완주 횟수에 더하지 않는다. 첫 segment에는 순수 계획 시간 counter가 없었음을 `continues`에 기록한다.
3. `fullplay-level13-preflight`: 13레벨/41,755 XP 및 27점 훈련을 검증하고 의도한 1라운드 관측 뒤 2라운드 시작에서 중지했다. 게임 패배가 아니다.
4. `fullplay-level13-36`: 새 36 편성으로 시작했으나 이후 하부 공구 선반/적 위치 변경이 공지되어 중지했다. 마지막 정상 export는 8라운드/aim, 작업장 정리와 버팀목 완료 상태다. `interruption.json`에 exit 130과 마지막 체크포인트의 범위를 기록한다. 최신 지형 완주나 패배로 세지 않는다.
5. `fullplay-level13-36-final`: 동결 source에서 새로 시작하여 63라운드에 승리한 최종 실행.
6. `fullplay-level13-36-final-continue-actor-precheck`: 마지막 저장의 actor 보존을 먼저 확인한 예비 재개 검사.
7. `fullplay-level13-36-final-continue`: actor뿐 아니라 목표·파동·지형·성장·턴까지 정확 보존을 추가 단언한 최종 재개 검사. 위 두 재개를 독립적인 새 완주로 더하지 않는다.

## 재현

```sh
HONRO_FULLPLAY_OUT=_local/reports/stage17-worksite/fullplay-level13-36-final \
HONRO_FULLPLAY_PRODUCTION_COMMIT=862daa4cc80544f344181d590cf083621dc5c3c3 \
node tests/stage17-worksite-fullplay.mjs
```

기존 증거를 덮어쓰지 않으려면 새 OUT 경로를 지정한다. `HONRO_FULLPLAY_CONTINUE=<checkpoint.json>`은 정확히 같은 production project/runtime의 실제 저장으로만 재개한다. `HONRO_FULLPLAY_ROUND_LIMIT`/`ACTION_LIMIT`으로 개발 관측을 제한한 종료는 승리나 패배와 구분해서 기록한다.

`HONRO_FULLPLAY_PROVENANCE_ONLY=1`은 현재 source fingerprint만 출력한다. 전체 project/runtime hash에 더하여, 지형·roster·목표·초기 상태·재질·캠페인 content와 runtime code의 gameplay hash를 분리해 미술-only 변경 여부를 검토할 수 있게 했다. fingerprint 차이가 있으면 이전 실행을 새 source의 완주로 재분류하지 않는다.

## 남는 한계

- 완주 하나는 모든 난이도·빌드·인원 손실 상황의 밸런스 승인이 아니다. 목표 라운드 범위, 인간 플레이 시간 또는 튜토리얼 이해도를 확정하지 않는다.
- 이 완주가 모든 동행으로 모든 분기를 걸었다는 주장은 하지 않는다. 각 경로×네 실제 몸체의 기본 걷기/점프 검사는 별도 `stage17-worksite-traversal.mjs`의 격리 물리 검사다.
- 네이티브 sim 시간은 production Engine tick 누적이고, 대화/턴 표시 대기는 가상 벽시계로 별도 계산한다. 조준 탐색/발사 dispatch wall time, native physics wall time, 전체 Node combat-segment wall time을 구분한다. controller 전체 wall time은 다른 두 counter와 겹치므로 더하지 않는다. 의도적인 bot idle wait는 0이다.
- 실제 Game/Workshop 화면, 브라우저 입력, 배포 Pages 동작은 이 파일의 검증 범위에 포함하지 않는다.
