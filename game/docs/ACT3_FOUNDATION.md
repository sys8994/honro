# 3막 제작 준비: 비활성 설계 슬롯과 실제 확장 경계

상태: 맵 컨셉 검수 대기. 운영 캠페인은 1–20장 그대로이며 21–30장은 제작·플레이 가능 상태가 아니다. 아래 준비는 사용자 스토리 기획 v0.1의 26쪽 전체를 읽고 작성했다. 중요 맵 선택, 목표 조합, 난이도, 새 보스, 결말을 대신 확정하지 않는다.

## 바로 사용할 입력과 검사

- `tools/map-forge/act3-draft.json`: 원문 3-1–3-10을 숫자 ID 21–30과 대응한 열 개 슬롯. 각 제목과 원문 쪽 번호가 있으며 `mapPlan`, `canonicalStage`와 주요 결정은 모두 `null`이다. `null`은 미결정이며, 새 보스가 없다는 결정도 아니다.
- `node tools/map-forge/act3-foundation.mjs`: 현재 콘텐츠·밸런스·정본 맵·여정·막 목록의 일치와 초안 비활성을 읽기 전용으로 확인한다. 엔진·앱·빌더·세이브·localStorage를 실행하거나 쓰지 않는다.
- `node tests/act3-foundation.mjs`: 현20장 목록, 합성21–30 목록, 잘못된 인덱스/누락/중복/선행조건, 초안의 운영 입력 유입을 검사한다. 합성 데이터에는 지형·전투가 없다. 통과는 새 맵, 전체 회귀, 세이브 호환성 또는 정상 플레이 성공의 증거가 아니다.
- 실제 맵은 승인 후 기존 `honro-map` v6 Stage와 `design.space` v1로 작성한다. 별도 3막 지형 스키마·렌더러·물리 엔진을 만들지 않는다. 초안 JSON은 Workshop Project가 아니므로 Import하지 않는다.

이 파일과 초안/검사 도구는 `shared/build.mjs`에 등록하지 않는다. 공개 파일이 저장소에 존재하는 것과 게임에 3막이 열리는 것은 별개다.

## 숫자 20을 바꾸기 전에 맞춰야 할 연결

| 연결 | 실제 현재 계약 | 3막 승인 후 최소 작업 |
|---|---|---|
| 콘텐츠 목록 | `content.js`, `act2-content.js`의 `H.stages`; `main.js`와 compiler가 `stageId - 1`로 찾는다 | 21–30을 순서대로 추가하고 `requires`, 막/막내 번호, 도입/결말/안내를 함께 제공 |
| 정본 맵 | `shared/data/campaign.json`; `schema.js`는 이미 콘텐츠 목록 길이를 stageId 상한으로 사용한다. 콘텐츠 없는 단독 도구만 기본20 | 숫자 상한만30으로 변경하지 않는다. 실제 콘텐츠와 맵을 함께 등록. 맵 object ID와 metadata.stageId 중복 금지 |
| 성장/전투 수치 | `progression.js plan(id)`는 `balance.stages[id-1]`; compiler의 `profileFor`도 entryLevel을 즉시 읽는다 | 승인된 성장/난이도 곡선을 21–30에 추가. 20장 끝18.0 값을 임의 외삽하지 않음. 기존20장 budget과 ledger 불변 |
| 목표/사건 | `mission.js`, `objectives.js`, `interactions.js`가 11–20 전용 `HonroAct2`로 분기. 그 안에 수문·붕괴·종 상태와 특정 ID가 섞임 | 승인된 목표 조합에서 필요한 것만 좁게 공유. 단순 `active <= 30` 확장은 3막에 종 기믹을 잘못 적용하므로 금지 |
| 일반 진행 | `journey-content.js places`의 20개 장소 순서가 `next()`를 결정. 콘텐츠만 늘려도 일반 여정은21장에 도달하지 않음 | 장소/쉼터·필수/선택 대화·지리 레이어·지도 좌표·마지막 쉼터를 함께 추가 |
| UI/지도 | `rest-journey.js`의 둘째 막 끝, `main.js`의 20장 종료 문구, `act2-journey.js`의 두 막 탭/6800×1800 지도, `journey-art.js`의 지상·지하 지도 | 새 도시 지리와 선택된 장소 전환에 맞춰 끝 상태·막 버튼·프레임을 갱신. 기존20장 위치·저장 화면 유지 |
| Workshop | stage 생성/목록은 배열 기반. 새 custom map도 metadata.stageId를 통해 기존 콘텐츠/밸런스를 참조 | 게임·Stage View·Playtest 공통 compiler 사용. custom import로 캠페인 해금·보상을 우회하지 않음 |
| 승인된 전체 막 어댑터 | `intent-pipeline/act-adapter.mjs`의 문서 타입/recipe/builder/목표 비교·save 검사 대부분2막 전용 | 현재 어댑터를 3막 구현 증거로 재사용하지 않는다. 승인된 3막 정본 builder·목표 계약만 별도 연결 |

현재 내부 작업에서 안전한 변경은 목록의 일치 검증이다. schema 상한은 이미 데이터 기반이고, 나머지20은 실제 2막 종료 장소·목표·미술 의미를 갖는다. 의미 없는 전역 숫자 치환이나 범용 플러그인 프레임워크는 필요하지 않다. 첫 승인 목표에 맞춰 필요한 공통 primitive를 추출하면서 기존 Act2 호출·상태 키를 보존한다.

## 기믹 재사용 범위와 보완점

다양한 승리 조건은 장별 장소·기록을 얻는 행동과 묶는다. 모든 장을 전멸 후 문서 대화나 같은 거점 방어로 만들지 않는다. 이 표는 가능한 재료 목록이지 특정 장의 목표를 승인한 배치표가 아니다.

| 재료 | 코드 근거 | 사용 가능 범위 / 제한 |
|---|---|---|
| 도달·탈출, 적 제거, 파괴, 상호작용, flag | `authored.js objectiveState`, `compiler.js` authored events | 기존 범용 판정 재사용. 기본 authored 목표는 필수 조건의 AND이며 순차 퍼즐/분기/보호 실패를 자동 제공하지 않음 |
| 상황에 따른 증원·바람·안개·회복·문 파괴 | `encounters.js matches/update/flush`, `allies.js execute` | 위치·라운드·선행 사건과 연결 가능. 실제 배치 성공 후 사건 완료와 저장 큐 유지. 장시간 대화를 진행으로 착각하지 않게 현장 목표를 먼저 설계 |
| 정밀 사격 장치와 문/길 개방 | `act2.js attach/use`: `requiredClass`, `rock-pin`, `exit-pin`, `gate-*` | 실제 충돌 장치/파괴 표식과 연동. 장치 ID·Act2 상태를 공통화할 필요. `rock-pin`의 기존 지형 복구는 특정 authored vertices 처리 |
| 거점 유지·작업 보호 | `act2.js tick`: `hold`, guarded/contested, rounds/wave | 특정 인물 필요, 적의 진입으로 정지, 실제 턴/증원 조건 있음. 지정된 원형 범위와 Act2 순서/저장 상태에 결합 |
| 비살상 구조·주민 보호 | `act2.js eligibility/use/failure`, `objectives.js interactionTarget` | 구조, 혼 약화 후 분리, 보호 주민 사망 실패의 기존 구현. 구조 표식은 이동한 주민을 따르는 최신 패치 보존. 새 인질/짐/문서의 실패 조건은 별도 승인·작성 |
| 호송 | `act2.js tick`20장의 `escort`, `allies.js` 상여/운반인 | 현재20장은 실제 `e.walk`로 NPC를 오른쪽으로 전진시킴. 역방향·다층 지붕 호송·서로 갈라지는 행렬을 지원한다고 가정하지 않음 |
| 수위 변화 | `act2.js lowerPool/use('sluice')` | 물 표면/바닥·전도 Water와 막힌 길이 함께 갱신되는 실제 하강 구현. 범용 홍수 시뮬레이션/부력/수영은 없음. 다른 장소 수문에 필요한 설정만 추출 |
| 지지대·붕괴·잔해 복구 | `act2.js attach('collapse-pin')`, `use('rebuild-brace')` | 잘못된 순서의 낙석 피해, 잔해 막힘, 복구 가능. 연쇄 구조 붕괴/낙하 rigid body는 없음. 모든 건물 자동 물리 붕괴로 확대하지 않음 |
| 이동 발판/승강기 | `engine.ts newRound`, `store.ts` moving validator | 구 엔진에 라운드별 두 위치 토글과 위에 선 유닛 이동은 있다. 현재 canonical polygon `vertices`/v6 world terrain을 같이 이동하지 않으므로 즉시 사용 가능한 승강기로 계산하지 않음. 충돌·탑승·저장·Game/Workshop 그림 별도 보완 필요 |
| 처마·벽·지붕·상하 포격 | `map/geometry.js`, 공통 solid/oneWay/terrain-space/physics | 실제 천장·overhang으로 고각탄을 막고 노출된 보행면으로 이동을 계산. 벽과 지붕 그림만 그려 탄도가 막힌다고 주장하지 않음 |

## 공간·미술을 새로 준비할 부분

- `space-layout.js`의 rooms/surfaces/connections/routes/sites/encounterSites, required/optional-jump/optional-walk/return 경로를 재사용한다. sky는 open/cave/transition 세 종류이며, 도시라는 이유만으로 네 번째 물리 종류를 추가할 필요는 없다.
- v6 단일 전체 polygon + 내부 Play Bounds, 기존 카메라 최소 줌·캐시·접지, `environment.js`의 구역/지지면/깊이 체계를 유지한다. 담장·건물과 강변의 물이 연속된 지리에 붙어야 한다.
- 원문18–23쪽의 성문/장터/관아·문서고/하역장·수로/방계 저택·사당/주조장/관아 뜰·옥상/옛길 단서를 장소 전환의 근거로 삼는다. 장별 지형/배경 변화와 각기 다른 전투 동사를 맵 검수안에서 확인한다.
- 현재 재료 후보: `builtin:royalGate`, `builtin:villageWall`, `builtin:warehouse`, `act2:scene-market-awning`, `act2:scene-court-wall`, `act2:scene-temple-corridor`, `act1-scene:ferry-house`. 현재 형상은 연목/동굴용 미술이므로 새 읍성 미술 완성으로 세지 않는다.
- 새 건축물·도시 원경은 승인된 컨셉에 따라 순수 SVG·공통 vector renderer로 제작한다. 장식 복붙과 색 변경만으로 기록 추적의 장소 변화를 대신하지 않는다. 제작 전에 `.agents/skills/honro-environment/SKILL.md`를 읽는다.

## 정본 이야기와 저장의 경계

- 원문의 3막은 러프 기획이다. 저문골→묵종→무명사 기록과 휘겸의 가문이 연결되는 범위는 원문23–24쪽의 공개/보류 목록을 따른다. 정확한 주조 방식·첫 타종 전체 장면·대도사의 현재 상태·현묵이 아직 남아 있다는 사실·담허 최종 생사는 이 초안으로 확정하거나 공개하지 않는다.
- 원문3막 끝의 옛길 목적지는 전체 엔딩이 아니다. 새 보스/분기/최종 막 수는 미결정 상태를 유지한다.
- 운영 저장은 `honro-first-act-profile-1`, profile schema4, `honroBattle.honroRevision===20`을 유지한다. 여기의20은 챕터 수가 아니라 저장 호환 revision이므로30으로 바꾸면 진행 전투가 폐기될 수 있다.
- 저수준 `store.ts`의 stageId/lastStage/mapNode 상한은36이지만 실제 HONRO 앱의 콘텐츠·정본·목표·여정이 따로 필요하다. 30보다 크다는 이유만으로 호환성을 인증하지 않는다. 기존에 저장된 전투는 새 지형으로 강제 교체하지 않는다.

## 승인 후 통합 순서

### 성장·난이도 후속 확인

- 운영 플레이어 상한은 `progression.ts`의 **경지30 / 372,860 XP**다. 현재 레벨업 필요 XP는 구곡선의1.5배지만, `runtime/progression.js rewardXpAt()`의 캠페인 보상은 구25상한 곡선을 유지한다. 따라서 balance의 `entryLevel`/`exitLevel`을 실제 도착 경지로 그대로 읽지 않는다.
- 실제 성장 함수를 사용한 **새 저장·전원 합류·각 장 최초 완료의 산술 모의**에서는20장 진입56,222 XP(15경지19.4%), 완료61,569 XP(15경지69.0%), 네 동행 각각 총수련점31점이다. 정상 전투·플레이 완주 결과가 아니며, 기존 높은 XP/기록을 가진 저장의 도착 경지를 제한하는 값도 아니다. 20장 기본 보상 예산은5,347 XP, 전투 지급 한도는2,139 XP(40%)다.
- `balance.json maxLevel:25`는 현재30상한과 다른 구 메타데이터다. `futureActs`의3막은8개 종료경지(18.5→22)를 가진 구계획이며 활성 캠페인 제작 입력이 아니다. `game/tests/balance-report.mjs`의 schedule은 새 `xpAt()`를 사용하므로 구 `rewardXpAt()`를 쓰는 실제 캠페인 보상과 구분한다. 새10장 성장표의 근거로 그대로 복사하지 않는다.
- 구보상곡선은 설정경지25부터150,262 XP로 포화한다. `entryLevel`/`exitLevel`만25 이상으로 늘리면 추가 보상이0이 될 수 있다. 새3막은 실제15경지 후반의 진입 상태를 기준으로 검토하되, 목표 종료경지·성장 속도·새 보상 정책은 아직 미정이다. 기존20장 보상과 저장은 보존한다.
- `act2.js tuneEncounter()`는2막 적의 HP/공격에0.78/0.75를 적용하고,17–20장에는 추가로0.85/0.65를 적용한다. 새3막에 같은 명목 `targetHits`/피해율만 복사하면 이 추가 완화가 사라져 난이도가 뛰는 것을 주의한다. 지도·스토리 방향 선택 후 실제 기믹/전투 검수에서 성장과 압박 강도를 함께 확인한다.
- 이번 확인으로 운영 상한·기예·밸런스·보상·저장 코드를 변경하지 않았다. 근거: `shared/engine/src/progression.ts`의 `MAX_LEVEL`, `xpToNext`, `oldXpToNext12`, `pointsEarned`; `shared/runtime/progression.js`의 `budget`, `initialize`, `complete`, `recruit`; `shared/runtime/act2.js`의 `tuneEncounter`.

### 제작·통합 단계

1. 맵 선택과 장별 행동/승리 조건, 공개할 정보, 배경 전환을 검수하고 결정 출처를 기록한다.
2. 승인한 첫 장의 정본 Stage/목표/밸런스/여정 데이터를 비활성 작업 입력에서 제작한다. 필요한 기존 기믹만 추출하고 Game/Stage View/Playtest가 같은 결과를 쓰게 한다.
3. 기존20장과 스키마/진행 저장/성장 보존을 확인하면서21–30을 완성한다. source 및 map 목록 검사는 실제 데이터와 연결한다. 합성 fixture를 실물로 취급하지 않는다.
4. `npm run test:campaign-continuity`, `npm run test:camp-persistence`, `npm run test:rest-journey`, migration/integration, 20→21 전환·저장 재개·재시도·해금/보상 중복 방지·Workshop import를 검사한다. 새 맵의 실제 보행/포격/보호 실패/복구·정상 전투와 mobile Game/Workshop UI·성능·최종 미술 검수는 별도 증거가 필요하다.
5. 최종 승인된 콘텐츠를 실제 목록에 등록한 뒤 두 HTML을 통합 빌드하고 master/기존 Pages에서 직접 검수한다. 이 foundation만으로는 캠페인 활성화 단계에 도달하지 않는다.

이번 준비의 범위: 이 문서, 비활성 초안, 읽기 전용 목록 검사와 그 회귀만 변경한다. 운영 소스·campaign.json·balance.json·HTML·에셋·세이브 형식의 변경은 없다.
