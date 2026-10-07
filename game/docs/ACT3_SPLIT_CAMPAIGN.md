# 24–27 조사팀 상태 계약

새 전투 생성에만 split version 1을 적용한다. 24장은 네 명, 25장은 휘겸(knight)·담허(mage), 26장은 설오(archer)·소단(occultist), 27장은 네 명이다. 실제 player unit 생성 목록이 activeRoster이며 비출전 영웅은 units·행동 목록·피해 대상으로 존재하지 않는다. profile.recruited는 영입 이력으로 네 명을 그대로 보존한다.

## 연속 출정과 재플레이

24부터 시작한 mode=continuous 경로는 24 종료의 네 영웅을 저장한다. A25 종료값을 보존하며 B26은 B24 종료값으로 시작한다. 27은 A25+B26 종료값을 합성한다. HP·MP 부족량은 최대치 증가분을 제외하고 유지한다. 쿨다운 및 지속 상태의 라운드 기준은 남은 턴으로 저장/복원하므로 비출전 시간에 줄어들지 않는다. 소환·매혹 개체, 투사체와 지형 설치물은 맵을 넘지 않는다.

새 직접25/26/27 진입은 mode=replay로 같은 출전 명단을 사용한다. 분기 이력이 없으므로 기존 재플레이의 현재 성장/장착·기본 시작 자원으로 명시적 entry snapshot을 생성하고, 없는 과거 소비·피해는 만들어내지 않는다. 일반·디버그는 같은 함수다. 이 준비값을 24부터 이어진 무휴식 플레이 증거로 취급하면 안 된다.

진행 중 옛24–27 저장은 honroSplit 필드가 없으며 Continue는 roster·목표·피해를 강제로 변경하지 않는다. 명시적 재시도/새 진입에서만 새 계약을 적용한다. 1–23/28–30은 기존 동작이다.

## 저장과 보상

battle.honroSplit/profile.honroSplitCampaign은 version, mode, stage, activeRoster, vitals, starts, completed, items, nextStage, finished를 가진다. profile.heroes와 honroGrowth는 기존 성장/장별 지급 원장이다. 이 값과 honroBattle의 실제 목표·카운터·스토리 커서는 같은 프로필 쓰기로 저장된다.

분할 구간의 전투/완료 XP는 원정4명에 기존 영웅별 장 상한으로 지급한다. 비출전 영웅은 HeroProgress만 변경되고 피해/상태 시계는 움직이지 않는다. 재시도는 해당 장 starts의 자원만 복원하고 현재 성장 원장을 유지한다. 26 재시도는 완료된 A25를 지우지 않는다. 27 재시도는 두 분기 완료를 지우지 않는다. applyHero가 사망 캐릭터를 되살리지 않는 기존 규칙을 유지한다.

24/25/26에서 출전 인원이 쓰러지면 해당 장 실패다. 27 합류 및 전원 도착은 정확한 출전 명단을 요구하며 소환/매혹 개체는 인원으로 세지 않는다. 24 분리 결과부터 27 완료까지 쉼터·모닥불·훈련 진입으로 상태를 초기화할 수 없다. 제목 화면과 내보내기/종료/Continue는 가능하다. 결과 직후 종료해도 nextStage가 이어질 팀을 복구한다.

## 지도와 씬 인터페이스

- runtime module: HonroSplitCampaign
- active(b): 새 분할 battle인지
- allPresent(b): activeRoster의 각 영웅이 정확 한 명씩 살아 있는지
- b.honroSplit.activeRoster / b.activeRoster: 출전 클래스
- b.honroMapAnchors.splitSpawns: 27의 정확한 네 실제 지형 좌표. knight/mage는 A서측, archer/occultist는 B동측. 각 값은 {x,y}.
- splitSpawns 미저작 시 spawnReady=false. 기존 배치를 안전한 좌우 합류 지도라고 주장하지 않는다.
- 선택적 anchors.splitA/splitB: 씬 카메라용 지점. runtime은 이 두 점을 근거로 임의 오프셋을 생성하지 않는다.
- 27 목표: water-release(설오), fire-screen(휘겸) 병렬. 두 조치 뒤 party-reunion의 allHeroes reach. 목표·gate는 act3-objectives/지도 담당 소유.
- 씬 커서는 기존 공통 프레임워크가 관리하며 split module은 별도 대사 엔진을 생성하지 않는다.

## 검증 범위

node tests/act3-split-campaign.mjs는 production App의 연속24→25→26→27 결과전환, 피해/자원 승계, export/import/Continue, 재시도, XP 상한, 옛저장, 직접재플레이, 쉼터우회를 검사한다. 명시적피해·종료 fixture와 DOM/Canvas double을 사용하므로 실제 정상전투 난도·지도 완주·브라우저/Pages 검수를 대신하지 않는다. 최종 무휴식 난도 검증은 표준성장·기본기술의24부터 연속 플레이로 수행해야 한다.

2026-10-07 단독 소스 검증: 상태회귀11묶음과 기존 save-boundaries6/growth6/transition14/camp11/debug11을 통과했다. test:act3 aggregate의 stage25 인원4 고정기대는 새2인 계약 때문에 실패한다. 목표/지도 통합 담당과 해당 검사 계약을 갱신하고 전체 검사를 다시 수행해야 하며 현재 aggregate PASS가 아니다.

## Workshop 복귀와 debug 선택 경계

Workshop 임시 프로필에서 다른 장/훈련에 들어갈 때도 보호된 returnProfile의 정상 출정 제한을 검사한다. 정상 분할로 돌아가는 쉼터·모닥불은 보호된 저장 전투를 그대로 이어가며 무료 재준비 화면을 만들지 않는다. debug에서는 임시 복사본에서 어느 장이든 선택할 수 있다. 결과 전환/동일 장 재시도는 원래carry를 사용하고, 다른 장을 명시적으로 선택하면 그 QA 복사본의 carry만 새 재플레이로 준비한다. debug 해제 시 정상25의 피해/MP/가방은 그대로 복원된다.
