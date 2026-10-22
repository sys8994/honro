# 15장 배수 발판 접촉 전이 수정 후보

기준 공개 소스는 `d55b6c6876a79ce041bf7473ba43b50a10389543`, 작업 브랜치는 `fix/stage15-drain-contact-20261022`다. master와 Pages에는 쓰지 않았다.

- 런타임 및 검사 소스: `91a02485c8fdd16ec8ebeebd76e0e04ce9a303c4`
- 해당 소스의 공통 빌드/생성물: `44866afe7a82dbe79a3b3dc743a5382073e56fb5`
- 게임 진입 파일: `web/entries/game.90cc1c5737b022e8.js`
- 원본 실패와 수정 후 결과: [evidence.json](evidence.json). 원본 진단 증거 커밋 `916b42ab6cdaad0018fff2c739ccd72a9d862fe7`의 실패를 별도 보존했다.

## 원인과 변경

기존 `HonroNarrativeRevision.tick`은 아직 `broken:true`인 `fc15-drained-ledge`를 `HONRO_CORE.terrainRectIntersects`에 넘겼다. 이 함수는 비활성 지형에 false를 반환한다. 따라서 원래 살아 있는 minecart 두 체가 새 형상과 겹치는데도 점유가 없는 것으로 판정해 활성화했다. 이후 `validTerrainContactPose`가 두 체를 invalid로 판정했고, 20 Engine ticks에도 원위치였다. `HonroStageRules.sanitizeStageBattle`의 기존 공용 복구는 Continue 때 다른 좌표로 옮겨 저장 전후 exact 비교가 실패했다. 원자료의 비활성 검사 결과는 `[]`, 활성 예정 복제 형상 검사 결과는 `[a2-enemy-15, a2-enemy-17]`이다.

새 `HonroStage15Drain.plan`은 활성 예정 형상과 배우 복사본만 읽고 계산한다. 형상에 실제로 묻히는 살아 있는 배우를 ID 순서로 처리하고, 기존 `HonroTerrain.place`/`HONRO_CORE.validTerrainContactPose`로 가장 가까운 **샘플링된 합법 접촉 후보**를 찾는다. 공용 배치 함수에 선택 인자 `step`과 `verticalWeight`를 추가했으며, 기존 호출의 기본값 32/.75는 그대로다. 이 전이만 수평 8px 샘플, Euclidean 거리, 반경 192px를 쓴다.

원래 두 minecart는 높이 84px/반경 43px다. 8px는 반경의 약 1/5보다 작고, 192px는 몸 높이의 약 2.3배로 제한한 국소 범위다. 이 범위 내에서 아래 두 위치를 찾았으므로 맵 전체 배치 검색이나 멀리 있는 적의 AI 활성화를 기다리지 않는다. 지형·배우 원본은 탐색 중 바뀌지 않는다. 모든 후보가 유효할 때만 충돌 지형/월드 지형의 활성과 위치 전이를 같은 동기 호출에서 확정한다.

| 원래 배우 | 원위치 x,y | 확정 위치 x,y | 이동 거리 |
| --- | --- | --- | --- |
| a2-enemy-15 | 6210, 4553.207547 | 6290, 4539.622642 | 81.145238px |
| a2-enemy-17 | 5890, 4749.411765 | 5874, 4760.235294 | 19.317060px |

변경되는 배우 필드는 x/y와 접촉에 필요한 vx/vy=0, jumping/airborne=false뿐이다. HP·기력·이동 잔여·행동권·경험치·보상·spawn 좌표·AI 진행 사실은 그대로다. 겹치지 않는 배우는 객체 필드 전체가 exact다. `honroState.act2.drainContact`에 전이 출처와 원위치/확정 위치를 기록한다. 두 적을 숨기거나 죽이거나 subdued로 바꾸는 런타임 처리는 없다.

대화·조준 충전·발사/검토·근접 행동 등 진행 중에는 실제 공개를 미룬다. 이미 활성화된 옛 저장의 해당 접촉도 같은 국소 계획으로 한 번 정리한 뒤 기존 일반 로드 정규화가 다시 이동시키지 않게 한다. 유효한 접촉의 구 저장에는 새 stamp도 강요하지 않는다. 스테이지15/기존 narrative revision1/정확한 배수 지형 ID에만 적용한다.

## 실행 결과

아래 최종 검사는 모두 소스 커밋 `91a02485c8fdd16ec8ebeebd76e0e04ce9a303c4`에서 실행했다. 준비 중 HEAD가 `4b3bb947`였던 앞선 경로 결과 대신, 소스 커밋 확정 후 `routes-final` 결과를 증거에 수록했다.

| 검사 | 결과와 범위 |
| --- | --- |
| `node tests/stage15-drain-transition.mjs` | PASS, 15개 기록. 원래 26명 전원 생존 roster, 휴면 적 활성화 대기 없이 배수, 읽기 전용 계획, 자원/AI/행동 보존, 반복 tick, 20 Engine ticks, 실제 export→Continue 2회, 옛 활성 invalid 저장의 일회 복구, 정상 구 저장 exact |
| 같은 전이 검사 예외 fixture | PASS. 플레이어와 동맹 점유의 일관된 국소 배치, 앞 배우 후보 발견 후 다음 배우가 막히면 전체 보류, 대화/review/flight/charging/volley/melee 중 지연, 관계없는 airborne 배우 exact |
| `HONRO_STAGE15_DIAGNOSTIC_OUT=… node tests/stage15-drain-contact.mjs` | PASS. 원래 살아 있는 roster에서 새 invalid 0, 후속 일반 sanitize 이동 0, 20 ticks 후 invalid 0 |
| `HONRO_STAGE15_ROUTES_OUT=… node tests/stage15-current-routes.mjs` | PASS. groove 없을 때 A/B 거절, A의 sluice+활성 발판 조건, 수문 없는 B, 반경360 국소 위협 조건, 실제 E/대화/배수, 6개 저장 경계 whole-battle exact, 보상 중복 방지, A/B 각각 16장 진입 |
| `node tests/act23-route-geometry.mjs 15` | PASS, 4클래스×A/B의 8개 고립 이동/점프 경로. 이동 예산을 준비하는 지형 연결 fixture이며 전투 완주 증거가 아니다. |
| `npm --prefix game run typecheck` / `npm run build` | PASS. 공통 소스 목록으로 Game/Workshop/direct Playtest 생성, 활성 그래프 354개 파일 |

첫 검사와 접촉 진단의 입장 roster는 현행 progression plan15의 경지14.4, XP48393 기준으로 만든다. full-living 접촉 진단은 4동행+원래22적의 HP/정체성/휴면 상태를 유지하되 **수문 완료와 공개 대기 사실을 입력 fixture로 준비**한다. 실제 정상 전투로 수문까지 도달한 재현은 실행하지 않았다.

경로/정산 검사는 별도로 도착 위치 및 적22체의 subdued 사실을 준비한다. 이후 실제 production 상호작용·대화·저장·정산·다음 장 진입 함수를 검사한다. 이 prepared predicate/arrival 검사를 정상 자원 전체15장 완료나 사람 클리어 시간으로 주장하지 않는다. 전체30장·전역 verify·긴 자동 조종 실행은 하지 않았다.

## 보존과 한계

아치·A/B 경로·바닥·배수 발판 원형·배우 배치/체력·목표·대사·수문 조건·전역 밸런스와 campaign JSON은 변경하지 않았다. 프로젝트 데이터 경로는 기준과 같은 `web/data/campaign.a00e58c9ad9e5187.json`이다. 미술 후보를 병합하지 않았다.

빌드 전에 실제 d55 발행(Pages39828457605, `2026-10-22T18:08:34Z`, `game.80058be2c7d5a3e3.js`)을 성공 이력에 등록했다. 빌드 후 최근7일 전체/최소2개 정책의 발행 그래프 8개, 현재·보존 그래프와 d55 활성 파일의 합집합 470개를 읽어 SHA256/길이 일치를 확인했다. 원래934의 다음 두 파일도 보호 그래프에 있고 바이트가 보존됐다. 후보를 성공 발행으로 등록하지 않았다.

- `web/data/chapter-13-assets.1387b6a1f088fc74.json`
- `web/data/chapter-13.516170b245a8b075.json`

지역 탐색은 ID 순서의 보수적 greedy 계획이며 8px 샘플 간의 연속 최적점이나 전체 배우 조합 최적해를 보장하지 않는다. 하나라도 192px 안에 유효한 후보가 없거나 부착된 배우라면 새 형상 공개 전체를 안전하게 보류한다. 이미 형상이 활성화된 **병리적 구 저장**에서 같은 국소 해법이 없으면 형상을 다시 끄거나 원거리로 배우를 보내지 않으며, 해당 invalid 접촉은 미해결 상태로 남는다. 이 경우 일반 원거리 복구도 해당 배우에 적용하지 않는 것을 예외 fixture로 확인했다. 모든 손상된 저장을 복구했다는 뜻은 아니다.

실패 원자성은 지형·배우·act2 전이 사실을 검사한다. 기존 narrative pressure scheduler가 같은 tick에서 독립 경고 메타데이터를 갱신하는 현행 동작은 유지했다. 직접 `plan`/실패 `transition` 호출은 전투 전체가 exact임을 확인했다. 사용자 실제 저장 파일과 실제 정상 전투 도달/전체 완주는 미확인이다.
