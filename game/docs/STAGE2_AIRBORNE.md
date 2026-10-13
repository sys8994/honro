# 2장 상여 위의 공중 엄호군

## 원인과 변경 범위

우측 `shelf-roost`는 원본 `foe-1`(crow,3370/1010), `foe-4`(bat,3190/1150) 및 1막 편성 확장으로 생기는 두 `-cluster`다. 원본 JSON의 초기6체는 실제 새 전투에서12체가 된다. 공중군의 동료까지 최소 가중 거리는2109–2385로 공통 활성1600 밖이다. `fixed`는 공중 유지 플래그이며 공중 이동 AI를 막지 않는다. 실제 활성화 없이 큐에 못 들어간 것이 주원인이다. 별도로 crow clone(3460/1010)은 가지 윗끝과 몸의 공중 여유가 겹쳐 기존 `flightClear`를 만족하지 못했다.

`shared/runtime/stage2-airborne.js`만 저작된2장 집단의 호송 반응을 담당한다. 공통 엔진의 활성 거리, 탄도, 목표 선택, 사거리와 비행 이동280, 적 행동 상한3을 변경하지 않는다. 원본 지형/장식/카메라/목표/동료/초기12/유한 추가4/HP·공격·XP 예산은 보존한다.

- 지상 호송 교전에서 실제 피해/죽음이 발생하거나 상여가1520에 도달하면 전술경고1회.
- 경고 후 실제 선택 가능한 아군 행동 기회를 기록하고 그 행동 종료 뒤 우측4체를 기존 큐 후보에 포함한다. 경고 전에 이미 발사한 공격의 종료를 대응 기회로 세지 않는다.
- 큐의 기존 lastAct 순환·상한3을 그대로 사용한다. 피해를 강제하거나 행동순번을 추가하지 않는다. 실제 이동/사격은 현재 살아 있는 설오/상여/동료 좌표를 재선택하는 기존 AI다.
- 새 기본 Game/Stage View/Playtest는 같은 저작 revision을 사용한다. 새 입력의 invalid crow clone만 공통 배치기와 full-body 공중여유로64px 위 안전 공중에 배치된다. 다른3체는 그대로다.
- 기존 canonical campaign2장에도 다음 정상 행동에서 같은 반응 정책을 적용한다. attach/Continue 자체는 저장된 좌표/HP/진행/큐를 변경하지 않는다. 원래 잘못 낀 crow clone의 정확한ID/종류/집단/원위치·spawn 좌표가 그대로이고 실제 공중여유도 실패할 때만 다음 적 행동 직전에128 이내 안전 후보로 복구한다. 체력·진행·목표·성장은 유지하며 이동했거나 정상인 배우는 건드리지 않는다.
- 구형/미표시 Workshop 프로젝트, 사용자 정의 전투, 다른 장, 종료 전투는 반응 정책 밖이다. 기본 프로젝트의 명시 revision이 있는 Stage View/Playtest는 같은 새 배치/AI다.

## 실제 편성·파동 인벤토리

- procession-screen: `foe-0`, `foe-3`와 각 clone, 지상 전위4체.
- shelf-roost: `foe-1`, `foe-4`와 각 clone, 우측 공중 엄호4체.
- exit-core: `foe-2`, `foe-5`와 각 clone, 출구 아래 지상 차단4체.
- road-pressure: 기존 x1850 진입 산개2체. 초기1체 spawn이1막 정책에서2체가 된다.
- sniper-seen: 기존 설오 현재 위치를 기준으로 진입하는 까마귀2체. `sniperAmbush`는 gate의 일반 spawn 자동 열거에 없으므로 런타임 파동 인벤토리에 명시해야 한다.
- 나머지 procession-seen/right-cliff/last-flight는 대사·바람·서사 이벤트이며 새 적을 만들지 않는다.2장은 overwatch라 defend/settle habitat 파동도 없다.

## 검수와 아직 남은 항목

`node tests/stage2-airborne.mjs`: 격리 source 경계, 타29장 컴파일동일, 실제12체/행동상한, 경고 전 진행 중 공격 제외, 새 Game/Stage View/Playtest 일치, old mount·끼임 복구·반복 App export/Continue 보존.

`node tests/stage2-airborne-fullplay.mjs`: 생산 App의 각도/충전·발사/방어/방향입력과 실제 frame을 사용한다. DOM·Canvas·시간은 대역이며 실제 브라우저가 아니다.1장 첫클리어 합법 보상 ledger의 준비 진입으로 이전 장 연속 완주라 부르지 않는다. 은닉 소모품/HP·위치·목표·적 주입은 없다.

`node --expose-gc tests/stage2-airborne-native-art.mjs`: 전체·우측공중·하부호송 같은 카메라 Native Scene 전후6장. 실제 브라우저/성능/미술승인이 아니다.

현재는 구현/격리회귀 저장점이다. 최종 소스 정상 입력 trace, 기존 진행 저장, 모든 군집/각 파동의 실효 행동·플레이어 대응, 독립 이미지·전술검수, encounter gate, aggregate verify, master/Pages 직접 확인이 남아 있다. 정상 경고 대응 기회 검토에서 발견한 초안 결함은 회귀로 고쳤으며 그 전의 완료 trace는 최종 증거에 재사용하지 않는다.
