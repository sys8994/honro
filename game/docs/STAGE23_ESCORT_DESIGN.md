# 23장 사라진 짐 · 계단식 관창 호송

## 승인 범위와 첫 구현 단위

기준은 `7df220ba9de5a0eeee3432091f92cf285cbc86f6`의 최종12이다. 23장만 9800×6200의 관창 앞뜰, 중앙 하역뜰, 짧은 석교, 높은 창고 두 구역, 지상 반출문으로 바꾼다. 초기22/정예5+유한8은 비교 기준이고 초기28/정예6+유한8은 후보 예산이다. 최종 편성은 동일 실제 입장/입력 정책의 완주와 교전 부담 검수 후 정한다. 28은 확정 수치가 아니다.

새 지도의 저장 opt-in은 `honroStage===23 && !honroCustom && honroEscortYardRevision===1`이다. 기존 `honroWaterworksRevision:1`도 유지한다. `honroState.escortYard`와 `honroEscortYardSpec`은 이 opt-in 전투에서만 생성/소비한다. 구23, 구12/18/30의 지도·성장·대화·행동 큐를 Continue에서 새 자료로 바꾸지 않는다. Restart만 현재 새 지도를 만든다.

## 그대로인 네 목표와 짐꾼 계약

`dispatch-bundle → carrier-start → dock-mid → dock-exit`의 원본 단계 배열을 보존한다. 새 필수 목표, 전멸, 동행 전원 집결, 제한시간, 직업 E는 없다. 살아 있는 병사 적도 추가하지 않는다. 기존 possessedGuard/possessedArcher 악귀만 편성한다.

원본 `HonroAct3` 호송 함수는 바꾸지 않는다. 짐꾼은 r50/h110, HP1450, 기본 보행260이다. 출발 후 매 tick 이동 예산900을 채워 `Engine.walk`만 호출한다. NPC 점프·순간이동·진목이 없다. 선도자는 살아 있는 본체 동행이면 이미 행동했거나 적 차례여도 된다. 발높이차≤150, 가중거리≤950, 진행 방향 앞섬>65를 모두 만족해야 한다. 대화 동안은 원래처럼 멈춘다. 필수 아래길은 연속된 실제 지지면이고 포치 입구는150 높이로 분리해 짐꾼이 위로 붙지 않는다.

경사0.667에서 발높이150 제한은 수평 간격 약225까지다. 입력 정책은 이 구간에서180 안쪽의 선도를 사용한다. 600 앞에서 기다려 NPC가 멈춘 것을 경로 결함으로 분류하지 않는다. 초기 배치/waypoint 좌표는 `tools/map-forge/stage23-loading-yard.mjs`가 유일한 저작 원본이다.

## 높은 지원과 아래 호송의 비용

높은 D/F 경로는 기본 점프와 실제 이동 예산을 쓴다. 지형 전용 입장은 같은 XP75748/Lv16의 능력0 프로필이다. 초회 격리 검사에서 네 직업14경로×화물 전후112회가 통과했고, 담허의 D→E 실제 소모는 전1499/후1637, F→G1608, E→F2084였다. 이동량1660인 담허에게 F 선점은 한 행동의 이동량을 넘는다. 이는 실제 전투 중 접근/복귀 완료나 정상 플레이 라운드를 증명하지 않는다.

짐꾼 격리 통로 검사에서는 전후 모두1683개의1/60초 보행, 실거리7294.1을 썼다. 실제 영웅 선도·교전·대화·대기를 포함하는 fullplay 시간과 구분한다. 사선 없는 높이의 적이 행동3칸을 선점하지 않도록 작은 역할 소조를 분리한다. 활성은 실제 접지 접근 또는 원본 피격 aggro로 결정하며 공격 AI·공격력·명중·턴 공정성 정렬은 공통 엔진 그대로다. 고지의 하향 지원은 검증된 support/좌표 범위만 추가한다.

## 화물: 같은 물체, 다른 사선

큰 생활화물 묶음의 실제 사각형 외곽 크기는440×140이다. 위 적재면의 stored polygon을 전체 경사 경로만큼 평행이동해 중앙 뜰 옆의 settled polygon으로 옮긴다. 모양 축소, 수직 인양, 크레인, 탑승, 배우 이동/피해는 없다. 그릇·곡식자루·농기구가 묶인 생활화물 하나를 사용한다.

실제 NPC가 출발 후 x3750–4000, 발높이5100±40에 들어왔을 때만 예고한다. 고지 선행의 maxX는 화물이나 마지막 증원 계기가 아니다. `stored → warned → waiting → sliding → settled`이며 종료 시 미정착 상태는 cancelled가 된다. 화물은 선택 사건이라 점유로 계속 대기해도 원래 네 목표를 완료할 수 있다.

- 예고 뒤 실제 살아 있는 본체의 새 행동 한 번을 제공한다. 적/소환수/이미 review 중이던 행동/serial만 증가한 boundary는 기회가 아니다.
- safe actor boundary에서 실제 sweep polygon과 사라지는/새로 생기는 두 solid를 검사한다. 영웅, 적, NPC, 소환수, 진목, 탄, field, delayed/attached zone을 포함한다. 부분 spawn이나 강제 밀기는 없다.
- 공통 `HonroStoryStaging`의1.2초 look cue와 저장 cursor만 사용한다. 새 프레임 루프나 별도의 scene clock은 없다. modal/history/hidden window는 같은 cursor를 멈춘다.
- 정착은 두 지형 배열(`terrain`, `honroWorldTerrain`)에서 stored 비활성+settled 활성의 단일 동기 commit이다. save/Continue/Next/Skip 이후 commitCount는1을 넘지 않는다.
- 연출 도중 새로운 점유/물리 이벤트가 생기면 충돌을 건드리지 않고 waiting으로 돌아가며 다음 안전한 행동에서 재시도한다.
- asset 검색 bounds/viewBox는 타일 culling을 위해 경로 전체를 포함할 수 있다. 물체 크기, 충돌 polygon, 점유 sweep과 별도이다. 그림은 항상 같은440×140 평행이동이다.

화물이 있던 위 사선이 열리고 아래 측면의 낮은 엄폐가 생긴다. NPC 지지면 배열은 전후 동일하다. 광선 교차 증거는 실제 탄도·소모·명중 증거와 구분한다.

## 유한 증원

기존3+2+3과 종류/정예 수를 보존한다. 예고문, 실제 주진입 support, 동일 편 alternate와 spacing을 저작하고 maxDistance0으로 전체 인원을 예약한다. 한 자리가 막히면 그 무리 전체가 기다린다. 한 boundary에 한 무리, cap3 행동은 그대로다.

마지막3명은 원래 `carrier-start + maxHeroX4250 + response1`을 대신해 정확히 `dock-mid 완료 + response1 완료`로 바꾼다. 실제 짐꾼의 석교 도착 전 고지 선행이 이를 앞당길 수 없다. 새 cap은 초기+8(22→30,28→36)이며 기존 maxAlive에 또8을 더해44로 만들지 않는다. 총 전투 XP3155는 그대로다.

## 증거 구분

- `stage23-escort-entry.mjs`: 실제 최초 완료/합류 보상 장부와 합법4슬롯, 능력6/0, 원본 계약. 실제1–22 완주 아님.
- `stage23-escort-geometry.mjs`: 격리된 몸체/경로, 다른 배우 제거·라운드 이동량 재충전 명시. 정상 전투 아님.
- `stage23-escort-runtime.mjs`: 실제 App/Engine/Story와 명시적 점유/목표/지형 fixture. DOM·Canvas·시계 대역.
- `stage23-escort-old-save.mjs`: 실제 export→file-import→Continue/mount, 구23·12/18/30 보호. 명시적 setup 포함.
- `stage23-escort-native-art.mjs`: 공통 production Scene의 Native 정적 렌더. 실제 브라우저 화면/성능/정상 플레이 아님.
- `stage23-escort-fullplay.mjs`: 합법 입장에서 실제 입력만 수행하는 별도 고정정책 검수. 진행 중 실패/대기/죽음/회귀비용도 보존한다.

첫 구현 단위 시점에는 최종 편성, 실제 정상 완주, 기본기 민감도,24 연결, 두 HTML/브라우저/Pages 검수를 아직 합격으로 처리하지 않는다.

## Actual level-up resume guard

The first fixed-policy 22/5 run reached R16/Lv17/dock-mid but failed full-state Continue: legacy progression initialization overwrote the four heroes' trained crit fields. `tests/fixtures/stage23-escort-level17-dock-mid.json` retains the actual App export and original run/source hashes. This is failure evidence, not a completion fixture. The Stage23 adapter retains only existing finite critChance/critMultiplier in opted-in battles with a growth ledger; it neither recalculates statistics nor alters fresh entry, XP grants, ordinary level-ups, missing-field migration or old chapter behavior. The regression compares the complete battle through four imports/Continues/mounts and checks a fresh entry's actual XP boundary separately.

The cargo release segment moves220 west and10 down before descending. Full-solid intersection must remain zero; separately reported one-way front-walkway intersections require rear-chute/front-rim art layering. Occupancy covers the same whole sweep, including anyone standing on the front walkway.
