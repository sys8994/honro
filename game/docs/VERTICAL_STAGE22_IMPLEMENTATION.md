# 수직22 관아: 교전·유한 진입 구현 후보

2026-10-10. 회색모형 위의 교전 후보이며, 한국 관아 미술·실효 교전·정상자원 완주·실제 App/브라우저 검수를 통과한 완성품이 아니다.

## 변경 범위와 통합

- `tools/map-forge/apply-stage22-vertical.mjs`: 검증된 별도 geometry author를 호출한 뒤 새22의 군집/유한 입구/저장용 명세만 작성한다. 다른29장 JSON은 exact이며 반복 적용 결과도 동일하다. 이 모듈은 기존 저장을 고치는 함수가 아니다.
- `shared/runtime/stage22-vertical.js`: `honroStage===22`, 비custom, `honroVerticalStage22Revision===1`, `honroVerticalStage22EncounterRevision===1` 모두를 가진 전장만 opt-in한다. geometry만 적용한 옛 snapshot에도 교전 revision을 임의로 붙이지 않는다.
- 독립 테스트 두 개는 공통 build 등록 없이 `vm.runInContext`로 위 런타임을 한 번 로드한다.
- 통합 담당자는 `shared/build.mjs`의 `modelFiles` 끝에서 `stage14-vertical` 다음에 `stage22-vertical`을 한 번 등록한다. `act3-objectives`, `act3-encounters`, `stage8-bier`, `encounter-density`보다 뒤에 둔다. 그 뒤 기존 새진입 canonical 저작 흐름에서 `authorStage22Vertical(project,g)`를 호출한다. 선택 미술 author는 이 호출 뒤에 적용한다. 기존 미술 build가 새22 지형을 예전 수평 관아로 덮지 않는지도 별도로 확인해야 한다.
- 새 author의 CLI는 저장 canonical을 쓸 수 있으므로 통합 담당자만 실행한다. 이 작업자는 canonical, 공통 manifest, package, geometry, 14장, build/HTML을 편집하지 않았다.
- 테스트 명령은 `node tests/stage22-vertical-composition.mjs --out-dir=<evidence-dir>`와 `node tests/stage22-vertical-runtime.mjs --out-dir=<evidence-dir>`다. 두 검사는 순차 실행한다.

## 원래 계약

5목표는 archive-seal(휘겸 E, archive-door 개방) → ledger-case(E, upper-door 개방) → upper-register(E) → compare-ledgers(조건을 만족하는 적팀 종료2회, 등불2) → archive-exit이다. 목표 자료, 같은층 dy≤150/작업반경260/주변 적220, 방어460/경쟁230, 두 실제 문의 닫힘/개방과 모든 원래 승리 조건은 Act3가 소유한다.

G/H는240 떨어져 있고 방어원과 탈출원이 겹친다. x2535에 서서 방어 완료 후 자연스럽게 탈출할 수 있는 기존 동작을 보존한다. 생존한 먼 적/미진입 반응파동을 없애는 전원청소, 새 마지막 전투, 강제 파티 분할을 추가하지 않는다. 등불이 떠 있다는 이유만으로 sameFloor 경쟁자로 계산하지 않는다.

## 역할 구성과 별개인 세 예산

초기26체/정예6체는 기존 제안32/8을 목표 숫자로 맞춘 결과가 아니다. 실제 석축에 놓을 수 있는7군집이다.

- A 봉인 앞4: 근접 봉인 수비와 서쪽 서리/궁귀 후열
- B 하층 경사4: 판문 뒤 도약 입구와 반응 진입 엄호
- C 사건 보고3: 작업점의 가까운2와 위문 너머 사격수
- D 가까운 회랑3: C 동쪽 경사에 닿는 교차엄호; 먼 서쪽 끝에는 청소용 적을 두지 않음
- E 호적각 아래4: 계단 높이별 사선과 F 접근 압박
- F 호적 마당4: 작업점2와 동쪽 돌아오르는 입구2; 선택 서쪽 경로로 후방각 가능
- G 대조마당4: 방어 작업공간 앞줄과 출구 방향 후열

행동 상한은3이다. 최대 동시 생존은 초기26 + 기존 반응7 + 기존 등불2 =35다. 새로운 정예 반응은 없다. 기존 Act3 튜닝이 초기 정예6의 weight를1.6으로 만들고, 반응7의 weight7과 등불2의 weight1.6을 원래 성장 초기화에서 예약한다. 총weight38.2이며 이 비율로 기존 장별 전투XP 예산을 나눈다. 검사 기준 실제22 전투XP천장은2890으로 그대로다. 적 수에 맞춰 총XP를 늘리지 않는다. 진행 중 `honroGrowth`/XP지급 기록을 다시 초기화하거나 다른 총원으로 재계산하지 않는다.

## 네 유한 진입

원래 세 반응의 event ID, objectiveDone, once, action source, 종류/수2+3+2와 nonelite 계약은 보존한다. 옛 event.entry와 action의 좌표 모두 새 실제 지지면으로 옮긴다. 저장용 정확한 formation은 `honroVerticalStage22Spec.entries`에 있다.

1. 봉인 뒤 장부귀2: 하층 동쪽 x2475/2625, y4550. 대안은 같은 하층 동쪽 x2890/3040의 실제 지면이다. 다음 B 도약 입구와 같은 연결된 바닥에 있고 B에서 사격/접근할 수 있는 후보 위치다.
2. 보고 뒤 장부귀3: 보고고 동쪽 x2520/2670/2820, y2850. 같은 방향 대안 x2640/2790/2940. 다음 E 도약 입구 x2390과 같은 실제 평면이다.
3. 호적 뒤 궁귀2: 대조마당 서쪽 x2030/2180, y1200. 대안 x2065/2215. 다음 필수 대조마당의 서쪽 오름입구에 두며, 뒤에 남겨 청소를 요구하는 파동이 아니다.
4. 대조 등불2: 동쪽 공중 실제 발좌표(2700,940)/(2860,870), 대안(2690,750)/(2860,670). `createEnemy(...,absolute=true)`로 쓰므로 일반 lantern factory의 추가170/255/340 이동을 겹치지 않는다. 원래 `spawnHold`가 성공 후만 spawned2를 기록한다.

각 진입의 위치는 전신/지원면/간격과 원래 경로 연결까지만 검증했다. 첫 유효 사격, 실제 플레이어 반응, 방어 종료 전 영향과 정상 전투 중 위치 도달은 별도 관측이 필요하다. 서쪽 회랑 사격점에서는 특히 돌턱에 탄이 막히는지 확인해야 한다.

## 런타임 안전·지속성

- 방향을 저장한 예고가 먼저 난다. 살아 있는 원래 영웅이 aim 상태에서 제안을 받고 실제 wait/fire/E 등의 행동을 마친 뒤에만 기회를 소비한다. 예고를 일으킨 E, 적의 직렬 증가, 미완료 review, 죽은 배우는 대신하지 못한다.
- 대화/모달/이력/충전, 발사체/연사/소환/근접 후속/미정착, flight/review/ally/summon 상태에서는 진입하지 않는다. 한 actor 경계에는 최대 한 전투군집만 들어간다.
- 전체 formation은 factory를 전혀 부르지 않는 크기만 있는 임시 몸으로 먼저 검사한다. 지면/공중, 전신 지형, 배우 간격, 진목/장판/발사체가 하나라도 막으면 IDs·배우·spawn 수·성장 예산을 쓰지 않는다. 같은 방향의 명시적 대안만 시험하고 모두 막히면 기다린다. 배우를 밀거나 다른 층으로 보정하지 않는다.
- 완전 예약 뒤에만 정확한 좌표의 실제 적 전원을 한 번에 만든다. 새 ID, source, birth round, cell과 최종 Act3 weight를 저장한다. 중복 호출은 다시 생성하지 않는다.
- 현재 실제 지지면/고도/거리 또는 피격 반응에 따라 현지 군집을 후보로 삼는다. 경보 기록은 저장하지만 멀어진 층이 계속 세 슬롯을 잠그지는 않게 한다. 새로 들어와 아직 행동하지 않은 현지 그룹에 기존3슬롯 중 하나를 예약할 수 있다. 전역 AI, 중력, 점프, 전체 스테이지 활성화는 바꾸지 않는다.
- Continue에서는 임시 후보 캐시만 재구성한다. 저장된 배우, awake, queue, 목표, 문, 경고/완료행동 기회, teamEnds, HP/자원/성장은 유지한다. 전투가 끝나면 미진입 경고를 취소하고 예산을 쓰지 않는다.

## 증거와 남은 승인

composition 검사는 다섯 난이도에서30배우의 raw compile→sanitize 좌표/HP exact, 전신 비중첩·접지,8초 자연정지, 기본/대안8formation의 전신 순수preflight, 다른29장 exact/반복 저작과 원래5목표를 확인한다.

runtime 검사는 실제 구현을 synthetic fixture로 격리한다. E의 순서/직업/층/주변 적과 문 파괴 방지, 예고→실제 완료행동, 원자성/factory미호출/동일방향 대안,35상한, 안전 경계, 각 반응과 등불의 warned/review/blocked/entered remount, 구 수평22와 부분진행 snapshot, 층별 후보·기존3슬롯 예약, 적팀 종료 방어·이탈/경쟁, 겹친 자연탈출·생존자/미진입파동 허용을 확인한다.

이 증거는 fixture 위치/목표/배우를 직접 준비한다. 실제 App export/import/Continue, 렌더/미술, 전체 군집과 파동의 첫 유효 행동, 정상자원 완주, 전체 회귀와 기존 Pages 직접 검수는 미검증이다. 원래 geometry의 기본 이동 약7212는 제안 상한7000보다 약3% 길며, 숫자만 줄이거나 통과시켜 페이싱을 승인하지 않는다.
