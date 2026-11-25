# 6막 1~7장(51~57) 전투 개정 인수인계 — 2026-11-25

사용자 지시: 1~7장 전투 개정을 진행한다. 진행 중인 6막 저장이 지워져도 된다(미배포 제작 중). 다른 에이전트가 동시에 master에 올리므로 브랜치에서 작업하고, 최신 master 위로 리베이스한 뒤 빨리 감기로만 병합한다. 강제 push는 쓰지 않는다.

## 현황(공격하는 적, 시작→누적)
| 장 | 시작→누적 | 비고 |
|---|---|---|
| 51 | 4→4 | 체력 527~758. 레벨 25 파티 앞에서 의미 없음 |
| 52 | 3→3 | 지지석·문지기 |
| 53 | 2→2 | 담허 단독 |
| 54 | 0→0 | 중력 회랑, 전투 없음 |
| 55 | 4→4 | 빈종각귀(480) 외 |
| 56 | 3→4 | 역류 압박 1 |
| 57 | 2→3 | 후퇴·합류 |

## 구조(필수 이해)
- 장별 데이터: `shared/data/act6-qa/{first-two,third,fourth,fifth,sixth,seventh}.json`.
- 각 데이터의 SHA는 `shared/act6-app-qa.mjs`에 고정돼 있고, 진행 모듈 일부도 해시로 고정돼 있다.
  - `act6-first-missions.mjs`, `act6-fifty-rest-qa.mjs`가 그렇다.
  - 고치면 고정값도 함께 갱신해야 한다.
- 장별 진행 모듈:
  - 51·52: `act6-first-missions.mjs`
  - 53: `act6-inner-missions.mjs`, `stage53-actions.mjs`
  - 54: `stage54-pilot-owner.mjs`
  - 55: `stage55-pilot-owner.mjs`
  - 56: `stage56-owner.mjs`, `stage56-adapter.mjs`
  - 57: `stage57-*.mjs`
- 각 모듈은 적의 id·체력·위치를 정확히 대조한다. 예: 55는 빈종각귀 hp 480 등 `STAGE55.gate`를 본다. 적을 바꾸면 이 대조값도 함께 바꾼다.
- 장 경계 저장(`shared/act6-boundary/chapter-boundary.mjs`)은 출발 장 데이터가 바뀌면 그 뒤 기록을 '은퇴' 처리하고 6막 1장 재시작을 안내한다. 이번에는 허용된다.
- 디버그 미리보기 고정 데이터(`shared/act6-debug-stages/fixtures.json`)도 같이 갱신해야 한다. 빌드가 fromPacket/toPacket을 검사하고, 미리보기 실행 시 소유 모듈 핀을 검사한다. 52~57장 고정 데이터는 다시 만들어야 한다.

## 권장 접근(8·9장과 같은 방식)
1. **증원은 런타임에서 넣는다.** 적 데이터를 고치는 대신, 진행 모듈 쪽에서 사건(정예 등장, 진목 설치, 역류 등)에 맞춰 전선 분대를 추가한다. 9장 `FRONTS59` 패턴(예고 → 진입 → 상한 → 지연)을 재사용한다.
2. **능력치는 50장 기준으로 생성한다.** `G.HonroUnits.create(...,{mode:'campaign',honroStage:50,...},profile,G.HONRO_CONTENT.stages[49])`.
3. **전용 미술 리그를 연결한다.** `u.honroRigAsset`을 지정하면 `actor-vector.js`가 그 리그로 그린다. 새 리그는 `tools/actor-forge/grotesques.mjs`에 추가하고, 예산 기준을 넉넉히 준다.
4. **장별 목표:**
   - 6-1/2: 낮은 길·교량·고지의 역할을 분리한다.
   - 6-3: 기둥그림자 정예.
   - 6-4: 중력 전환이 실제 교전 판단이 되게 한다(되짚는 상주).
   - 6-5: 빈종각귀 고유 행동.
   - 6-6: 배 없는 사공.
   - 6-7: 추격·차단 전선.

## 검수 도구(세션 작업 폴더, 다음 세션에서 다시 만들어야 할 수 있음)
- 공개 주소를 로컬 빌드로 돌려주는 Playwright 하네스.
- 51~57장 개발용 진행기: 텔레포트·처치 치트를 쓰는 경계 기록 확보용이며, 플레이 증거가 아니다.
- 8·9장 입력 재현 봇. 핵심 기법:
  - `HonroApp.releaseCharge`로 정확한 힘으로 발사한다.
  - `b.honroState.localFinaleProgress`로 9장 진행을 읽는다.
  - 프로필은 휴식터에서 `HonroEquipment.equip`으로 장착한 뒤 `HonroApp.persist()`로 정규화한다.
