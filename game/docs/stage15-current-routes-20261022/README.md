# 15장 현행 경로·저장 사전 점검 · 2026-10-22

**A/B 기본 지형 연결과 조건·16장 인계 fixture는 통과했지만, A 배수 직후 저장/Continue에서 적2명의 좌표 보존이 실패했다. 정상 전투 완주·현행 소요 턴/시간은 측정하지 않았다.** 게임은 수정하지 않았다.

- 고정 게임 소스: `d55b6c6876a79ce041bf7473ba43b50a10389543`(부모 확인 공개 기준).
- 검사 코드 보존: `0882e37777588e84999662dab9e23d21c3795000` (`audit/stage15-current-routes-20261022`). 실행 때의 HEAD는d55와 해당 테스트 워킹트리이며 실제 파일 SHA256을 증거에 기록했다.
- 변경은 테스트 선택 실행/현재 경계 진단과 이 문서뿐이다. game/runtime/campaign/narrative/미술/generated/master/Pages는 unchanged다. 기존14장/빌드/미술 검수를 다시 하지 않았다.

## 현재 실제 조건과 경로

8000×6000, 동행4/적22, active4, waveCount0이다. 필수는 **groove 조사 → A 또는 B 출구에 생존 동행1인 도달**이다. 수문 sluice는 선택이며 별도 방어/전맵 소탕은 없다.

| 항목 | 현행 계약 |
|---|---|
| 수문 sluice | (2350,3800) 실제 E, 선택. 주변360 내 들림을 먼저 제압해야 한다 |
| 공통 groove | (6240,4395) 마른 관찰점의 옛/새 작업 흔적 조사. 실제 E, 주변360 위협 해소와 같은 층/근접 조건 |
| A 아랫길 | (7530,4031) 도달. groove와 sluice 완료 + fc15-drained-ledge 활성 필요 |
| B 고지 | (7350,3502.63) 도달. groove 필요, 수문/배수 발판 불필요 |
| 출구 판정 | reach 반경150, 생존 일반 동행만 인정. 소환/들림/사망은 제외. E로 출구를 강제 실행하는 방식이 아니다 |
| 실패 |15장 전용 보호 NPC/필수 클래스 실패 조건은 없음. 전원 사망의 일반 실패 유지 |
|16장 연결 | 선택을 해당 run에 고정해16장 A/B entry variant로 인계. 재개 시 새로 선택하지 않음 |

A는 낮은 바닥·물골과 배수 발판을 지나 공통 조사점/하부 출구로 이어진다. B는 dry-shoulder 기본 점프→서쪽 광물아치→마른 관찰점→동쪽 아치의 기본 점프로 고지 출구에 이른다. 같은 groove를 거치므로 조사 없이 다른 층의 출구만 찾아가도 완료되지 않는다. 조사 대사/지연 큐가 끝나기 전에도 출구가 먼저 확정되지 않는다.

현행 guide는 “마른 관찰점에서 옛 고정 자리와 새 작업 흔적을 확인하세요. 수문을 열어 낮은 길로 가거나 수문을 건드리지 않고 고지로 통과하세요.”다. 반면 design.description의 “수차 제압·수문 방어·높은 공동의 고정구 사격”, target33–53/expectedMinutes50–77, 옛 site 이름은 현재 필수3항목과 맞지 않는 기획 흔적이다. 이 값을 현행 측정치로 인용하거나 새 수치로 재기입하지 않았다.

## 검증 결과와 한계

| 검사 | 결과 | 증거 범위 |
|---|---|---|
| 기존 reviewed 전체 검사 | BLOCKED |15장 전에 과거5장 lake hash 불일치. 무관한 기준을 수리/재기준화하지 않음 |
| 기존 optional15 원본 | BLOCKED→선택 실행 PASS | 불필요한11장 역사 projection을15 선택 시 호출하지 않도록 한정. 기본 전체 실행은 보존 |
| dry-shoulder 기본 점프 |4동행 PASS | 선언된 진입점의 첫 시도 모두 성공·HP 손실0·SP03=0. 배우 제거/최초 위치 준비 후 정상 move/jump/wait/tick, 실행 중 이동도 보충 없음 |
| A/B 전체 경로 geometry |8/8 PASS | 기존 helper 재사용, 각4동행. 다른 배우 제거·이동도 직접 보충하는 isolated fixture. 정상 전투/정상 이동예산/완주 턴 증거가 아님 |
| groove 누락/경로 자격 |PASS | 현재 production predicate. A는 수문/활성 발판 둘 중 하나만 있어도 거절, B는 둘 없이 허용 |
| 주변 위협/E/배수 |부분 PASS | 실제 E 뒤 수면120 하강, 대화/review 중 활성 지연, collision/world 동시 전환·중복 E 거절. **안전 접촉 보장은 아래 FAIL** |
| 저장/대사 |5개 exact PASS,1개 FAIL | 수문 pending, 조사 대사·큐, 양16장 entry는 exact. A 배수 활성 직후만 아래 두 적 좌표 차이 |
| 보상/16장 |A/B PASS fixture | 준비한 안전/도착 상태에서 실제 자동 route commit→outcome→결과/쉼터→16장, 선택별4동행 좌표·성장·반복 보상 방지·Continue exact |
| 정상15장 플레이 |미실행 | 현행 A/B 전투 완주, 실제 턴·사람 시간·전투 난도는 미입증 |

상호작용/저장/16장 양성 검사는 **배우 도착과22적 제압 상태를 미리 공급한 fixture**다. 적의 ID/HP는 유지하되 subdued를 설정했고 위치는 지점별 snapshot에서 준비했다. 이를 정상 클리어로 부르지 않는다. 보상은 그 fixture의 production outcome과 이미 지급된 clone의 재정산으로 중복 여부만 확인했다.15장용 대형 controller를 만들지 않았다.

기존 act2-playthrough는 옛 clear-gallery/exit 이동 조건과 다른 입장 XP/결과 override를 사용하므로 현행 두 출구의 정상 완주 근거로 바로 사용할 수 없다. 이 범위에서 새 거대 자동 조종기를 만들거나14장 검사를 재실행하지 않았다.

## 발견한 실제 접촉/저장 경계 문제 — 미수정

조건: 원래 배치의 a2-enemy-15/17이 살아 있는 동안 수문 배수 발판을 활성화하고 저장/Continue한다.

`shared/runtime/narrative-revision.js`의 배수 공개 guard는 아직 `broken:true`인 지형을 `terrainRectIntersects`에 넘긴다. `shared/engine/src/math.ts`는 broken 지형이면 즉시 false를 반환하므로 해당 검사가 점유를 발견하지 못한다. 같은 지형을 **검사용 active clone**으로 읽으면 정확히 두 배우의 겹침을 검출한다. 이 clone은 predicate 확인용이며 실제 world를 미리 바꾸지 않았다.

| 적 | 활성 직후 저장 좌표 | Continue 정규화 좌표 | HP |
|---|---|---|---:|
| a2-enemy-15 | (6210,4553.2075) | (6178,4432.6429) |1434 유지 |
| a2-enemy-17 | (5890,4749.4118) | (5858,4771.0588) |925 유지 |

활성 이전에는 유효했던 접촉 자세가 활성 뒤 invalid가 됐다. 원래의 살아 있는22적/정상 HP/제압 flag 없는 배치에서도, 완료 수문·pending 공개 사실만 공급한 독립 조건 fixture로 재현했다. 추가20 ordinary Engine ticks 후에도 두 invalid 자세가 남고, 저장 정규화에서 위치가 바뀌었다. 별도의 실제 E/safe-arrival fixture의 App export→Continue에서도 같은 차이를 확인했다. 단순히 제압 flag를 설정해서 생긴 차이가 아니다.

도달 가능성의 확인 범위도 제한한다. 두 적은 수문 반경360 밖의 원래 배치이므로 실제 수문 자격은 두 적의 처치를 요구하지 않는다. 따라서 게임 계약상 배제되지 않는 상태다. 그러나 주변 위협을 정상 전투로 해결하고 수문까지 걸어가 같은 두 적의 위치/생존을 유지한 상태에서 재현한 실행은 없다. 실제 E 검사는 준비한 안전/도착·제압 fixture이고, 정상 적 상태 교차검사는 수문 완료/pending 사실을 공급한 fixture다. 일반 플레이의 발생 빈도나 자연 진행 전체 재현을 확인했다고 쓰지 않는다.

실제 관련 production 함수는 `HonroNarrativeRevision.tick` → `HONRO_CORE.terrainRectIntersects` 및 로드의 `HonroStageRules.sanitizeStageBattle`/App Continue다. 수치상 guard 결과는 broken 형상 `[]`, active clone `['a2-enemy-15','a2-enemy-17']`이며, 두 배우의 `validTerrainContactPose`가 true→false로 변했다.

이것은 현행 특정 배수/저장 상태의 배우 위치 불연속 증거다. A 경로 전체가 불가능하다거나 보상이 복제된다는 증거는 아니다. B는 수문이 불필요하며 B 조사/16장 저장 연결에서는 이 차이를 관측하지 않았다. 실사용자의 미확인 저장 전체나 정상 전투 도중의 발생 빈도는 측정하지 않았다.

## 다음 최소 수정 후보

1. 배수의 점유 검사는 실제 활성 예정 형상으로 평가해야 한다. 현재 broken 객체 그대로 검사하는 문제를 먼저 좁혀 교정하고 위 재현을 유지한다.
2. 겹친 원래 배우2명을 어떻게 안전하게 전이할지/언제 공개할지 함께 결정해야 한다. guard만 켜면 먼 휴면 적 때문에 pending이 계속될 수 있으므로, 수정 후 A의 공개 해제와 저장 전후 접촉 일관성을 함께 확인한다. 이번에는 배치·물리·목표를 고치지 않았다.
3. 옛 “수문 방어”/예상 시간 메타데이터는 별도 정리 대상으로 표시한다. 현행 정상 플레이를 재지 않고 턴·시간 값을 새로 확정하지 않는다.

## 재현·증거

```sh
node tests/act2-optional-routes.mjs 15
node tests/act23-route-geometry.mjs 15
node tests/stage15-current-routes.mjs
node tests/stage15-drain-contact.mjs
```

뒤 두 진단은 현재 배수/save FAIL을 보존하므로 종료코드1이다. 조건/16장 연결 양성 결과까지 실패로 뭉개거나 전체 PASS로 덮어쓰지 않는다. `node tests/act2-reviewed-routes.mjs`의 무관한 역사 hash BLOCKED도 별도 보존했다. 어댑터 작성 중 after-action 대사 큐를 열린 dialogue와 동일시한 가정을 고쳐 정상 Story.turn/review로 처리했으며, 그런 어댑터 오류를 게임 결함으로 분류하지 않았다.

[evidence.json](evidence.json)에 소스 조건·12개 경로 결과·현재 경계 결과·두 contact 차이·broken/active guard 비교·로그/검사 파일 SHA256을 보존했다. raw는 `_local/reports/stage15-current-routes-20261022/`, 지형/optional raw는 각각 act23-redesign/act2-spatial 폴더다. 모든 검사는 로컬 production source/Engine/App와 DOM·렌더·저장·시계 doubles이며 Pages·브라우저·미술 승인/정상 캠페인 완주 증거는 아니다.
