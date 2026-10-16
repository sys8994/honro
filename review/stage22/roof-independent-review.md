# Stage22 E 지붕 독립 검수 — 제한된 증거 검토

검수자: stage26_design (22 구현에 참여하지 않음). 2026-10-16. 소스 변경·빌드·배포·테스트 재실행 없이 지정된 화면, 테스트 소스와 원본 JSON을 읽었다. 기존 independent-review.md의 검수자/범위를 확장하지 않는다.

판정: **정적 미술 개선과 격리 지붕 경로 증거는 확인. 궁수의 실제 처마 접촉과 jump/drop UI까지 확인. 최신 정상 전투와 전체 encounter 승인 미완료.** 아래 정상 전투 수치는 지붕 변경 전 기록이며 최신 변경에 대한 합격으로 재사용하지 않는다.

## 실제 픽셀 비교

`browser/{before,after}-{desktop,mobile}-archive-roof.png` 네 PNG를 직접 열어 비교했다. desktop 1440×900, mobile 390×844. 보고서상 같은 요청/실제 카메라: desktop (2670,2560,0.7), mobile (2670,2560,0.48), manual=true. 전후 외형 변화와 카메라 변화는 혼동하지 않았다.

- 이전의 매끈한 지붕 면에 기와 세로 결, 밝은 용마루와 어두운 처마 두께가 추가되어 지붕/벽/기단의 재질 구별이 개선됐다. 창살도 모바일에서 읽힌다. 지붕 외곽과 벽 상단은 연결되어 있고 기단과 아래 보행면 사이에 눈에 띄는 공백은 없다.
- 배후의 거대한 반복 창·기둥 격자가 넓은 암면으로 바뀌어 작은 서고가 독립된 건물로 보인다. 다만 암면은 여전히 화면의 큰 부분을 차지하는 단순한 각면이며 기와 줄 자체를 미술 완성으로 보지는 않는다.
- desktop 배우들은 왼쪽 경사에 있고 mobile에는 현장 배우가 없다. 따라서 발바닥과 지붕 접촉, 처마 경사의 착지 높이, 관통/내려오기 동작 중 가림은 **이 PNG로 검증 불가**다. 아래 격리 숫자 검사가 시각 접촉 증거를 대신하지 않는다. 실제 지붕 위 배우를 포함한 desktop/mobile 착지·하강 화면이 필요하다.
- 모바일 지붕과 문/기단은 HUD 위에서 식별된다. 그러나 접근 경사와 배우가 잘린 카메라 관찰 장면이므로 실제 조작 시 경로 발견성과 착지 추적을 승인하지 않는다.

## 경로/저장/탄도 증거

`tests/stage22-place-roof.mjs`와 `_local/reports/stage22-place-roof/report.json`을 읽었다. review 폴더의 roof*.json은 검토 시점에 없었다. 보고서는 archer/mage/knight/occultist 네 클래스에서 route/interior/drop/projectileBothDirections 통과를 기록한다. 실제 컴파일된 `v22-art-main-document-archive:collision:0` oneWay를 사용한다.

경로는 E 경사 (2170,2705) → 처마 (2387.99,2608.94) → 지붕 (2500,2491) → (2800,2491) → 왼쪽 처마 복귀 후 기존 drop → 아래 `v22-report-crossing` y2850이다. 내부 x2387.99↔2920↔2390 이동도 확인한다. 따라서 기본 점프 진입과 기존 drop 출구의 숫자 증거는 있다. 오른쪽 처마에서 걸어 내려오는 별도 출구를 입증한 테스트는 아니다.

상향 탄은 통과/하향 탄은 지붕 충돌을 검사하고, 4클래스×prepare/fall 8개 App Continue 사례에서 terrain/state 보존과 아래층 착지를 기록했다. 테스트는 초기 위치 설정, 다른 배우 제거, 승리 검사 해제 후 실행하는 격리 경로 검사다. 정상 전투 또는 브라우저 입력 검사로 부르지 않는다. 이번 검수자는 재실행하지 않았으며 파일의 결과를 검토했다.

## 변경 전 정상 입력의 실제 영향

`normal-input-before-roof/result.json`, `provenance.json`, `trace.json`을 읽었다. production App/Engine native 입력, DOM/render/storage/clock doubles, 21장까지 합법 진입 프로필이다. 이전 21장 연속 플레이와 실제 브라우저 전투는 아니다. 36라운드 won, 4명 생존, 18처치, 17생존 적; 기본기 전용은 아니다. 26 초기 적+7 유한 반응+2 방어 등불의 9 births가 있다.

아래는 원본 damage에서 owner를 activations의 cell에 연결하고 **side=0, amount>0만** 다시 집계했다. result의 damageDealt와 집계 범위가 다를 수 있으며 총 피해로 승인을 내리지 않는다. 첫 기록은 첫 적 유효 피해이지 모든 종류를 포괄한 최초 실효 행동이라는 주장이 아니다.

| 군집/파동 | 적 행동 수 | 아군 양수 피해 건수 / 합 | 첫 피해 round / frame |
|---|---:|---:|---|
| comparison-court | 14 | 11 / 389 | 25 / 61730 |
| comparison-lanterns | 2 | 5 / 132 | 34 / 79242 |
| ledger-front | 6 | 4 / 135 | 7 / 17008 |
| ledger-response | 3 | 1 / 35 | 11 / 27728 |
| lower-ramp | 16 | 16 / 613 | 2 / 4715 |
| near-gallery | 12 | 9 / 401 | 11 / 27285 |
| register-court | 17 | 13 / 447 | 20 / 47991 |
| register-response | 8 | 3 / 137 | 25 / 61261 |
| register-rise | 9 | 6 / 192 | 11 / 27025 |
| seal-porch | 7 | 8 / 273 | 1 / 1568 |
| seal-response | 11 | 10 / 330 | 5 / 11929 |

7군집 및 4파동 모두 관측된 실피해가 있으므로 무기능이라고 단정할 근거는 없다. 반대로 아래 누락 때문에 `qualityBlockers: []`를 디자인 승인으로 받아들이지 않는다.

- ledger-response (`act3-response-22-1`): 경고 frame23471, 출생23729, 첫 피해27728(event-63→archer 35). 3명 중 총 1건35 피해, playerResponses/firstPlayerResponse가 비어 있고 damageTaken=0. 경고 후 위치 변경/억제/회피에 미친 영향이 충분히 연결되지 않았다. 세 명 모두 생존해 승리하는 것은 허용 가능하나 파동의 독립적 전술 역할은 미검증이다.
- comparison-lanterns (`act3-compare-ledgers`): 경고 round26/frame63075, 진입 round34/frame78883, 첫 피해79242(event-202→mage35). 예고와 진입 간 8라운드 간격이 있다. 5건132 피해는 실효 증거이나 firstPlayerResponse=null/damageTaken=0이다. 일반 저체력 defend가 보이더라도 해당 등불 때문에 선택했다는 인과는 단정하지 않는다. 예고가 실제 진입 시점에 이해 가능한지와 대응 선택은 보강 필요다.
- seal-response: 경고5304 → 출생5584 → 첫 피해11929 → 첫 명시 대상 대응32044(round14). register-response: 경고59447 → 출생60294 → 첫 피해61261 → 대응66123(round27). 파동별 예고/진입/효과가 있으나 첫 대응 지연과 위치 관계의 전술적 적절성은 별도 평가해야 한다.
- result의 일부 firstEffect는 플레이어의 선제 피해(`player-suppression`)이고 firstAction은 적 이동/발사 종료 기록이다. 둘을 적의 첫 실효 공격으로 동일시하지 않았다. 예측 predictedEnemyDamage/기술 선택 이유만으로 실제 기예 효과를 인정하지 않는다.
- E register-rise의 첫 플레이어 피격 대상 거리 약964.68은 긴 사선이다. 해당 군집이 아래쪽에서 아군에게 실피해를 주는 사실은 확인했으나 새 지붕 위 교전·차폐·퇴로 선택의 유용성을 이전 trace로 입증할 수 없다.

## 남은 승인 조건

최신 지붕 소스/HTML 해시에 묶인 정상 입력 결과가 완료되면 같은 원본 액션·피해·파동 기록을 다시 대조해야 한다. 실제 브라우저 정상 자원 전투, 지붕 위 배우 접촉 전후 화면, 파동에 대응한 위치/기예 선택, encounter gate의 최신 증거 연결은 현재 미검증이다. 기존 정상 입력 결과의 완료나 격리 4클래스 통과만으로 이 항목을 닫지 않는다.

## 검토 파일 고정

검토 시작 checkout: `913cd161902830f863a44d393d2416e8ca272f91`.

- `browser/before-desktop-archive-roof.png`: `dbe726b4344080be873e8c626b6aaa4959a7d903efa04f5988b74cbba0cceeaf`
- `browser/after-desktop-archive-roof.png`: `1a85dcc1017ebf921398d7c31ea35d429880a93b2235279fc3fcde5c529582ec`
- `browser/before-mobile-archive-roof.png`: `13af991554b3f929e865333b23c2e60421ff493ae364555d9cb589302836a3a8`
- `browser/after-mobile-archive-roof.png`: `fd78164fe81c411ab65cc545f73368e1a8030ab4e1b01b36800ae085a6fa58cf`
- `normal-input-before-roof/result.json`: `fe371466564825af03851c169d4aa9a42eade5d1fee1e67c86a64efb3af09c12`
- `normal-input-before-roof/trace.json`: `ff296a835242679cc8aa2e28d35be8f4740d606f392934c2e7d539e124324389`

## 추가 수신 검토 — 실제 지붕 접촉 UI

`browser/roof-contact-desktop.png`, `browser/roof-contact-mobile.png`를 직접 열어 보았다. 궁수 발은 왼쪽 처마 상면에 놓이며 눈에 띄는 공중 부유나 지붕 속 잠김은 보이지 않는다. 좁은 처마의 어두운 가장자리와 신발의 경계는 읽힌다. desktop에서는 접근 경사/아래 보행층을 함께 볼 수 있고, mobile에서는 배우와 처마 접촉은 선명하지만 건물 오른쪽과 접근 경사의 대부분이 잘린다. 이 두 장은 앞서 적은 ‘배우 없는 전후 PNG’의 접촉 증거 부족을 **해당 궁수 왼쪽 처마 정지 장면에 한해** 보완한다. 다른 체형/지붕 중앙과 오른쪽/하강 도중 시각은 미검증이다.

`browser/roof-controls.json`: desktop/mobile 둘 다 x2391.125,y2608.462의 실제 roof support, drop 가능, 아래 y2850 도착 및 HP365 유지, errors=[]를 기록한다. 초기 한 번의 위치 설정과 적 제거를 사용한 격리 궁수 UI 검사다. 두 크기 모두 수평 입력은 keyboard D이고 모바일 jump/drop만 touch다. 모바일 조이스틱 완전 검수나 정상 자원 전투로 확대하지 않는다. 해당 테스트는 다른 담당자가 실행했고 이번 검수자는 결과/픽셀을 읽었다.

`review/stage22/roof-routes.json`으로 4체형+8저장 결과가 보존된 것도 확인했다. 위 _local 결과의 범위를 유지한다.

추가 증거 SHA256:
- `roof-routes.json`: `e768eff7f33221df8245ca53a9c416438d2eea04cf5804a1e088db0abc53e7c3`
- `browser/roof-controls.json`: `a6674de62044794a8630f71ab377ed71e97f7e755e97ea421b84e1131625b6c2`
- `browser/roof-contact-desktop.png`: `f05423c309ee71e0859576757b2e20d235570fb3de8a8cff39c396a074b8a5ce`
- `browser/roof-contact-mobile.png`: `e4e156899a8097a141fac25b3bd9886a64b502ccf347691937e67e8b1673eb1d`

## 최신 지붕 변경 후 정상 입력 후속 검토

원본 `_local/reports/stage22-review/roof-normal-input/{result,trace,provenance}.json`을 직접 읽었다. 보존 대상 경로는 `review/stage22/normal-input-roof/`이다. sourceHash `94e9902a3432bad90845209232b1c042e373da1a732689159e2fc203e6b4665e`, runtimeSha256 `d6bf358d2c7e2016b55b4543ab58d8f236013d4d54a4fe55b81f674bcbfe87b1`에만 유효하며 통합 checkout의 결과가 아니다.

39라운드 won, 22처치, 네 명 생존, validationFailure 없음, qualityBlockers=[]이다. 다섯 Continue는 각 시점 배우/지형/아이템/턴/목표/파동 상태 보존을 기록한다. Native 입력 결과이며 실제 브라우저 정상 전투 완료로 확대하지 않는다.

아래도 원본 damage의 적 owner→side0/amount>0만 직접 집계했다.

| 군집/파동 | 아군 실제 피해 건수 / 합 | 첫 피해 round / frame | 명시 대응 수 |
|---|---:|---:|---:|
| seal-porch | 8 / 273 | 1 / 1568 | 38 |
| lower-ramp | 16 / 613 | 2 / 4715 | 38 |
| ledger-front | 4 / 135 | 7 / 17008 | 27 |
| near-gallery | 9 / 401 | 11 / 27285 | 29 |
| register-rise | 4 / 132 | 11 / 27025 | 2 |
| register-court | 10 / 393 | 20 / 47991 | 9 |
| comparison-court | 14 / 521 | 25 / 61631 | 31 |
| act3-response-22-0 | 10 / 330 | 5 / 11929 | 28 |
| act3-response-22-1 | 1 / 35 | 11 / 27728 | 0 |
| act3-response-22-2 | 4 / 190 | 25 / 60917 | 15 |
| act3-compare-ledgers | 5 / 128 | 34 / 79745 | 0 |

모든 군집/파동의 실피해는 다시 관측됐다. 기존 두 대응 누락은 **해소되지 않았다**. ledger-response는 frame23471 예고→23729 출생→27728 첫 피해35이고 playerResponses=[]이다. 등불은 round26/frame62732 예고→round34/frame79385 출생→79745 첫 피해33, 총128 피해이나 playerResponses=[]이다. 이 결과는 ‘공격이 효과가 없다’는 주장을 반박하지만 파동별 의식적인 회피/제압/위치 선택을 입증하지 않는다. 일반 defend/목표 이동을 그 파동 때문에 선택한 반응으로 새로 채우지 않았다.

E register-rise의 첫 대응은 표적명이 v22-f2라 요약만 보면 잘못 연결된 것처럼 보인다. 원본을 대조하면 frame49625 shot127의 predictedTargets=[v22-e2]이고 실제 damage[151] frame49985에 knight→v22-e2 224가 있다. 두 번째는 frame64222 shot155 occultist→v22-e3 291이다. 따라서 해당 두 입력의 실제 군집 영향은 확인되며 예측만으로 인정한 것은 아니다.

actions의 support에서 archive 지붕을 사용한 정상 전투 행동은 찾지 못했다. 따라서 최신 native 완주는 지붕을 선택한 전투/퇴로의 유용성 승인으로 확대하지 않는다. 궁수 처마 접촉 UI와 4체형 격리 경로 증거는 별개로 유효하다. 전체 디자인/encounter 승인에는 독립 gate 묶음과 미검증 범위의 최종 판단이 남는다.

최신 원본 SHA256:
- `result.json`: `e26d282e0f4a545190d634653ca0d40668cf2b7699dfb0a33c714161959f2248`
- `trace.json`: `1443424029734274a413403d8e3f01eb3dc8e6d405b2561f0d5c1bfd35778872`
- `provenance.json`: `1f43958bcd5cb5e08f3e0a8114fa1edecca348132c88a22e5d0377bad1de229e`
