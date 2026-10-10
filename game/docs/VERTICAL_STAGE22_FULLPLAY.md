# 수직22 관아 정상자원 Native App 검사

2026-10-10. 이 문서는 검사 정책과 실제 실행 상태를 분리한다. 완주 하나만으로 군집·파동의 실효성이나 브라우저 품질을 승인하지 않는다.

## 고정 입력 계약

- `tests/stage22-vertical-entry-helper.mjs`는 실제 최초 완료/영입 보상 함수를 1–21장에 적용한 **진입 검증 fixture**다. 이전21장을 실제 플레이한 기록이 아니다. 22장의 완료/전투 XP는 미리 지급하지 않는다.
- 진입 경지16, 획득33SP. 일반 수련6과 각4슬롯, 필요한 선행기술 포함 모든 배운 기술은 rank1이다. 설오/담허/휘겸/소단의 지출은9/11/9/12이며 남은 점수는 쓰지 않는다. SP03·M09·O11은 없다.
- 슬롯은 설오 A01/A14/A11/A05, 담허 M01/M04/M11/M03, 휘겸 S00/S03/S01/S09, 소단 O01/O04/O08/O06이다. 실제 장착·기력 비용으로만 발사한다.
- 실제 Engine 이동·기본 점프·선택·공격, 현재 E eligibility/use, App.defend와 대화 넘김만 사용한다. 숨은 소모품, Engine.recover, 배우 HP/위치/기력/이동량 및 지형·목표 직접 변경은 금지한다. 이동/점프 비용과 모든 피해/발사/실제 적 행동큐를 기록한다.
- 초기26/정예6, 원래 반응2+3+2와 대조 등불2, cap35, 행동3, 전투XP천장2890을 유지한다.
- 원래 봉인(휘겸 E) → 사건 보고(E) → 호적(E) → 대조(실제 적팀 종료2회) → 출구만 완료한다. 최종 대조대와 출구의240 간격, 생존한 먼 적, 미진입 파동 취소를 결함으로 취급하지 않는다. 전원청소나 새 승리조건을 만들지 않는다.

## 이동·전투 정책

`stage22-vertical-fullplay-helper.mjs`는 실제19 route의 jumpTo/dropTo를 포함한 입력 제안 graph다. 닫힌 문은 원래 E 완료 전 열린 경로로 간주하지 않는다. 임의 층간 도약·순간이동을 만들지 않고, 실패 착지는 원본 trace에 남겨 경로를 다시 계산한다. 같은 지지면의 read-only 위치 후보에서 퇴로를 고르더라도 실제 유한 이동으로만 간다.

작업점의 실제 sameFloor 작업반경 안 적과 현재 동행 가까운 같은 교전층 위협을 우선한다. 나머지는 다음 원래 목표로 이동한다. 휘겸은 근접 접근, 설오·담허·소단은 다른 사거리와 기예를 쓴다. 무료 기본공격과 장착 기예의 안전한 실제 탄도 예측을 비교하며, 근접·범위·실제 반사·투과가 선택된 이유와 실제 후속 피해를 따로 기록한다. 예측은 실제 명중 증거가 아니다.

대조에서는 기존460 방어반경 안의 x2535/y1200를 유지할 수 있고, 실제 sameFloor 경쟁자230만 대조 진행을 막는다. 등불이 공중에 있다는 이유만으로 같은층 경쟁자로 세지 않는다. 대조 완료 후 원래 출구로 진행하며 남은 적을 청소하도록 정책을 바꾸지 않는다.

기하학 검사의84회(19개 route와2개 왕복×4직업), 기본 점프 약214, 개별 문 차단과 지형 접속 증거는 별도 `stage22-vertical-traversal.mjs`의 책임이다. 이 fullplay가19개 선택/복귀 경로를 모두 실제 사용하는 것처럼 주장하지 않는다.

## 원본 증거와 재현

각 실행은 새로운 `HONRO_FULLPLAY_OUT` 디렉터리를 요구한다. controller·entry·navigator·prediction helper 원문과 SHA256, 실제 로드한 전체 project/runtime 및 gameplay-only SHA256을 함께 보존한다. 외부 Continue는 기존 source/runtime/controller/helper/entry 해시가 모두 같을 때만 허용한다. 정책 수정 뒤 과거 중간 전투를 숨겨 고치거나 이어 성공한 것으로 합치지 않는다.

- 출처만: `HONRO_FULLPLAY_PROVENANCE_ONLY=1 HONRO_FULLPLAY_OUT=<새경로> node tests/stage22-vertical-fullplay.mjs`
- 짧은 probe: `HONRO_FULLPLAY_PROBE=1 HONRO_FULLPLAY_OUT=<새경로> node tests/stage22-vertical-fullplay.mjs`
- 정상자원 관측: `HONRO_FULLPLAY_OUT=<새경로> node tests/stage22-vertical-fullplay.mjs`

긴 normalplay는 미술/성능 대형 검사와 겹치지 않게 순차 실행한다. `initial.json`, `readiness-ledger.json`, `provenance.json`, 매 라운드 checkpoint/progress, 최종 `trace.json`, `shot-evidence.json`, `wait-analysis.json`, `result.json`을 남긴다. 각 군집과 네 파동의 예고/완료행동기회/원자진입/첫행동/첫발사/첫실효피해/플레이어 반응을 분리한다. 원거리 피해만 있고 위협·위치 반응이 없는 경우 별도 우려로 남긴다.

완주 시 실제 보상을 받은 export와 정상 결과-계속/쉼터/23장 진입,23장 전체 전투 exact Continue를 `stage23-entry.json`에 기록한다. 도입·봉인/보고/호적·첫파동·등불 진입 등의 실제 Continue도 보존한다.

## 현재 실행 상태

- `provenance-001`: 통합된 canonical22/runtime 출처 확인 통과.
- `probe-001`: 임의 목적지 x1110에 대한 검사 tolerance가 graph node 선택보다 좁아 종료. controller/initial/provenance 원문 보존. 전투 완주나 지형 결함으로 판정하지 않는다.
- `probe-002`: 실제 초기 휘겸 위치 x1050/y5300에서9.375를 이동하고9.375의 유한 이동량을 소비했다. HP 보존, 외부 배우쓰기0, recover0, 현재 목표 봉인 유지, 실제 export/load/App.continue 전체 battle exact 확인. 검사 전용 진입 fixture만 사용했다.
- 전체 정상자원 완주, 전 군집/파동 실효성,23진입은 아직 미검증이다.

Native 검사는 생산 App/Engine을 쓰지만 DOM·Canvas·음향·저장 다운로드·시계는 대역이다. 실제 브라우저/사용자 조작/성능/Pages 및 인간의 전술·미술 승인을 대신하지 않는다.

## 복원 후 정상자원 실행과 직접 원본 검토

첫 executor의 `attempt-001`은 R20까지 관측했지만 파일시스템 소실 뒤 raw/최종 결과를 확인하지 못했다. 위 provenance/probe 기록도 당시 관측 역사이며 현재 raw가 복구됐다는 뜻은 아니다. 성공 증거로 이어 붙이지 않았다. controller/helper/entry/문서4파일은 당시 SHA256과 byte-identical 복원했고, 새 checkout `b5aac2cc4578e175da77e647fb4e1b83cb88b61d`에서 새로 처음부터 실행했다.

새 원본은 `_local/reports/vertical-stages/stage22-fullplay/attempt-002-restored/`다. 부모 승인 후 이 실행 동안 controller/geometry/gameplay를 변경하지 않았다. controller SHA256은 `7624f9e5a2b24186d6f4f26fadbb53f227fece34dd476b33e4a66b83bd3117eb`, helper는 `9863a63f57301f79ef567e47b4db1c479aebacd230dc522b1c06c105b71d11c5`, entry는 `0333cff84bc5ee9f3e0c5b6e26b3a2aa573e35b98b347d98165f5809ac46365c`다. 실제 loaded project/runtime 및 각 raw 파일의 해시는 `provenance.json`과 별도 `analysis-002-restored.json`에 연결했다.

### 정상 입력의 기술적 결과

- R29 `won`, validationFailure 없음, 네 동행 생존. 초기26+유한9=35 중25처치,10명 생존 상태로 원래 출구를 통과했다. 전원청소를 요구하지 않았다.
- 봉인/보고/호적은 각각 R3/R9/R24에 휘겸의 실제 E로 완료했다. 세 E 모두 dy0, 작업반경 내 살아 있는 적0이며, 거리194.876/6.25/20.730이었다.
- 대조는 실제 enemy teamEnds27과28에서 progress1과2가 됐다. 최종 출구는 R29에 완료했다.240 간격의 원래 자연출구를 보존했다.
- 각 경고 뒤 설오의 실제 A01 완료행동이 있었고, 그 E 자체나 적 직렬 증가로 기회를 대신하지 않았다. 첫/둘째 반응은 R3/R9에2/3명이 같은 frame에 진입했다. 호적 반응은 R24 예고 후 점유로 blocked를 유지하다 R26에2명이 함께 진입했다. 등불2명은 R24에 함께 진입했다.9명 모두 nonelite다.
- 실제 적 완료행동은28개 라운드에서 최대3이다. 외부 x/y/HP/기력/이동량 쓰기0, Engine.recover0, 숨은 소모품0, 기록된 동행 접촉/낙하 피해0다.
- 실제 App.defend2회: 각각 HP42·MP39·shield126을 얻고 행동이 끝났다. 실제 발사108회와12종 기예의 비용/피해는 `resources`와 `usedSkills`에 있다. 전원 이동비용은53,468.171이며 개인별16,307.113/14,829.870/8,945.437/13,385.750이다. 이는 교전·후퇴 포함 봇 이동이며 기본 경로7212나 인간 플레이 시간과 혼동하지 않는다.
- 봉인/첫파동/보고/호적/등불 시점5회 전체 battle exact Continue를 통과했다. 정상 결과-계속→쉼터→23장에 진입했고 실제 보상 후 XP75748·기존 배분을 이어받았다.23장 `dispatch-bundle` 도입에서 전체 battle exact Continue를 다시 확인했다.

### 군집·파동의 실효성과 경계

아래 동행 피해는 trace의 target side0만 합산했다. raw result.damageDealt는 target side를 필터하지 않아 적의 자해/아군사격까지 포함하는 전체 발생피해다. 초기 요약에서 전체 발생피해를 동행 피해로 부른 것은 정정한다. 예측이나 단순 발사횟수를 피해로 계산하지 않는다. 자세한 첫 행동·첫 발사·첫 피해·첫 플레이어 반응은 원본 result/trace와 별도 analysis의 배열 index로 연결된다.

| 군집/파동 | 실제 적 행동/발사 | 동행 피해 | 전체 발생피해 | 적이 받은 피해 | 비고 |
|---|---:|---:|---:|---:|---|
| A seal-porch |6/6|213|289|4596|봉인 작업반경 근접·실제 반사 대응|
| B lower-ramp |12/10|347|374|4596|경사 고저 사격과 하층 반응 연결|
| C ledger-front |3/2|64|64|3586|낮은 지지면에서 교차사격·투과, 휘겸 범위근접|
| D near-gallery |7/4|125|125|3030|첫행동 R7, 첫 실제 피해 R13; 초기 사선 없는 행동을 숨기지 않음|
| E register-rise |17/6|229|267|700|첫행동 R10, 첫 실제 피해 R15; 아래의 행동큐 문제 별도 차단|
| F register-court |13/10|329|365|3677|상층 작업점 압박, 종료시1명 생존|
| G comparison-court |6/2|150|150|4596|동일층 대조 경쟁과 출구 방향 사격|
| 봉인 반응2 |5/5|141|166|2020|R3 진입·첫 피해|
| 보고 반응3 |8/7|244|347|1063|R9 진입·첫 피해, 종료시3명 생존|
| 호적 반응2 |2/2|96|96|2020|R26 진입, R27 담허 선제 범위공격 뒤 궁귀 실제 사격|
| 대조 등불2 |5/5|342|342|0|R24 진입·첫 피해. 직접 표적공격은 선택되지 않았고 둘 다 생존|

7군집과4파동 모두 실제 동행 피해가 관측됐다. 그러나 모든 개체의 역할·사선이나 큐 효율까지 이 합계로 승인하지 않는다. 특히 등불에 대한 `firstPlayerResponse`는 null이다. 경고 후 완료행동 기회와 실제342 피해는 확인했지만, 등불을 직접 겨냥한 플레이어 대응이 있었다고 만들지 않는다.

M11은 실제11발 모두 반사했고 총15개의 실제 bounce 증가가 기록됐다. O04는5발 중2발(shot36/43)에서 실제 고체 내부 통과가 관측됐다. E의 전체267과 동행229 차이38은 R18 shot108의 v22-e4→자기 자신(side1), direct:false 피해이며 shield 흡수나 영웅 후속피해가 아니다. 이 추적기는 실제 HP 감소만 기록하므로 shield-only 피해 합계는 제공하지 않는다.

실제 발사 기하와 피해를 함께 직접 확인한 대표 사례:

- M11 shot3/projectile3: R1 frame847/1059에 실제 bounce0→1→2, frame1061에 봉인 정예 a4에259 피해. 예측의 반사 표시만으로 주장하지 않았다.
- O04 shot36: R6 frame15336에 report-crossing 고체 내부(1444.065,3855.566), frame15366에 위 C의 c1에322 피해. shot43도 같은 고체 내부 기록 뒤142 피해·처치가 연결된다.
- S03 shot40: 같은 발사로 c1/c2에442/722 피해. A14 shot41은 아래 report-approach에서 위 C 정예에242 피해를 주었다.

### 열린 전술 품질 문제: R25 원거리 군집의 행동슬롯

**정상자원 완주 통과와 전술 품질 승인을 분리한다.** `analysis-002-restored.json`의 `v22-fullplay-r25-stale-cell-action-slots`는 열린 문제다. 자동 `result.json`의 `qualityBlockers:[]`는 무효군집/원거리청소의 좁은 탐지이며 이 큐 문제를 탐지하지 못했다. raw 결과를 수정해 숨기지 않는다.

R25 적큐는 `[v22-e2,v22-e3,v22-g3]`다. 네 동행 모두 G의 y1200–1301.717에 있는 동안 e2/e3은 E의 y2512.143/2621.429에서 시작해 둘 다 사격·피해 없이 `사선 없음 · 방어`로3슬롯 중2개를 소비했다. e2는 F의(1675.833,2200), e3은 E의(1927.616,2431.934)까지 실제 이동했지만 이 턴의 현지 위협으로 닿지 못했다.

소스와 trace를 함께 본 원인 추정은 `stage22-vertical.js`의 군집 단위 eligibility다. 하나의 살아 있는 구성원만 최근 피격 `aggroUntil`이 유효해도 군집 전체가 eligible이므로, 비피격 원거리 e3도 다음층 큐를 차지할 수 있다. 최소 개선 후보는 경보/피격 반응 기록을 유지하되 실제 행동 후보를 개체별 현재 지지면·고도·거리 또는 검증된 실효 사선으로 제한하는 것이다. 행동3과 저장된 Continue 큐를 바꾸거나 강제 이동/전원청소로 해결하지 않는다.

정확한 재현 입력은 같은 원본의 `lantern-entry-continue.json`이다. 변경 전 source/controller 그대로 R25까지 이어 비교할 수 있다. 개선은 부모와 별도 수정 단위로 조율하고, 변경된 source에서는 새 정상자원 실행을 해야 한다. 이 검사 작업자는 해당 runtime·geometry나 실행 정책을 수정하지 않았다. 독립 전술/미술 검토, 실제 브라우저·성능·Pages는 여전히 별도다.

R25의 더 좁힌 원시 재구성은 `_local/reports/vertical-stages/stage22-fullplay/r25-diagnosis/r25-observed-fixture.json`이다. loadableWholeBattle:false로 명시하며, R24 실제 전체 export와 R25 관측값/각 필드 출처를 연결한다. 기록하지 않은 R25 RNG·nextId·모든 미선택자 위치/상태·bestShot 내부를 만들어 넣지 않는다.

- R24 export/R25 행동 시작에서 e2는(1990,2512.143), HP771, aggroUntil25, lastAct20; e3은(2075,2621.429), HP1010, aggroUntil0, lastAct20이다. e2의 aggro는 R22 설오 A01 shot126의239 HP피해 뒤 기존 round+3으로 생겼다. e3은 이전 피격이 없다. E의 e1/e4도 aggro26/25이므로 군집 hit가 유효하다.
- 기본 Engine.combatEnemies는 awake와 세로×0.7 가중거리2300 또는 자신의 aggro를 검사한다. 새22 필터의 군집 hit를 통과하면 e3도 기본 거리 안에 남는다. switchTeam은 lastAct를 먼저 정렬하고 동률 때 가로거리를 쓰므로, lastAct20의 e2/e3이 현지 G(lastAct21 이상)보다 앞선다. 이 경계에서 새 유한파동 예약은 적용 대상을 만들지 않는다. 등불은 R24에 이미 행동했고 호적 반응은 아직 blocked다.
- 네 영웅은 G 지지면이므로 원래 E의 현지접근(support/height/radius) 조건은 false다. e2/e3에서 영웅 몸통까지의 직선8개는 모두 G 돌덩이에 막힌다. 이는 직선 검산이며 모든 가능한 곡사 후보가 불가능하다는 증명은 아니다. 실제 그 두 행동은 사격 없이 끝났다.
- 실제 저작 E→F→G 경로로 첫 G 평지까지 산술 이동비용은 e2 약2004.346, e3 약2142.795다. 각550 예산이면 이 경로는 적어도4행동이 필요하다. 최단 AI 경로나 새 몸충돌 검증을 주장하지 않는다.

따라서 E 배치를 단순히 G로 옮기는 것은 현재 E 진입수비 역할을 지우면서 현상을 가릴 수 있다. 배치 개선은 초기 사선 없는 행동을 줄일 수 있지만, 파티가 다른 층으로 떠난 뒤의 군집 단위 피격/오래된 lastAct 우선순위 문제까지 일반적으로 해소하지 못한다. 군집의 영구 awake는 보존하면서 실제 개체의 현지 행동 자격을 분리할 타당한 근거가 있다. 자신의 최근 피격까지 제한할지, 실효 사선 예외를 둘지는 별도 설계 결정이며 이 문서의 관측만으로 자동 적용하지 않는다.
