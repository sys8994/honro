# 14장 공개 검수 후보와 목표 패널 후속 수정

2026-10-10 04:30 UTC 갱신. 이전 미보존 문서2211f03의 원본문 복원이 아닌 현재 확인 상태의 재작성이다.

## 공개 기준과 변경 범위

- 공개14 master `ca0bddc6269ceed2f0b49d721c3a983eb685c5ca`, tree `3b8ebf1afb27075e56a95e145bdf6c442206cecf`. Pages workflow와 공개 HTML/campaign의 exact bytes는 게시 담당이 확인했다.
- 실제 Pages 좁은 창에서 첫 목표의 적이 살아 있는데 패널은 고정 `남은 대상 0명`을 표시했다. 진행 판정은 기존 cohort 필터로 정상이다. `5145264`는 새14 안내만 같은 `HonroAct2.enemiesFor`에서 수치를 읽도록 고친다. 상단 현재행동 한 문장, 원 목표·저장·지형·배우·물리·자원은 보존한다.
- 최신 양HTML은 공통build 생성물이다. Game SHA256 `4290ce0cb3c165af7f58d4e4535efb5baac2b7b06573bd688ecc3c5ff31672e3`, Workshop `23acb7262ea39b513b3e2e8811c61941271844badef37d660491baf76389b1f3`. 생성물 직접수정은 없다.22는 이14 후보에서 기존 비대상 맵이며 별도 archive branch에서만 활성 작업 중이다.

## 새 환경에서 직접 확인한 범위

- 빠른14계약7개 PASS: 다른29장/기존586asset/128생산소스/기존목표·보호배우의 source-boundary 및8부정변이,5난이도 composition, runtime, production App 저장, 목교/낙하 기본복귀, 안내, 구형R8 저장.
- 안내는 초기10/11/43, 적의 다른층 이동, 죽음/HP0/제압/진영변경,0명 뒤 기존다음목표, 저장 재개, 최종clear 유한증원 포함을 확인한다. 읽기 전후 전체battle exact이며 상단은 수치를 늘어놓지 않는다.
- Workshop 반응형 정적/공통Game iframe exact, Playtest template, vertical-regression wiring PASS. 실제 브라우저 입력이나 화면 검사를 이 검사로 대신하지 않는다.
- npm verify: build와 game typecheck PASS, 역사 project 전체hash에서 FAIL. 기대4e6862fc와 현재749fd68e는 다른 역사스냅샷이다. 뒤 검사 미도달, fixture 재기준화 없음.
- 독립 검토에서 capture→완료기록→release 뒤 완료 행의 남은 수가 되살아나는 표시 경계를 발견했다. `816eabb`는 완료행을 제압 완료로 고정한다. 실제 Engine capture→Act2.tick→release 회귀 PASS, 완료/다음목표 및 전체battle 읽기불변 유지.
- 독립 검수자 review_target_count_fix가 실제 초기10/11/43, 최종guidance 및 capture-release 회귀, 구형R8·13·15·22·custom14의 generic 결과 불변, 양HTML의 정확한현재모듈 포함을 별도 확인했다. 이 작은 패치의 남은 차단 finding은 없다. 실제 Pages 재검수는 배포 후 별도다.

## 이전 플레이·미술 증거와 남은 한계

- 아래 수치는 당시 native production App 정상입력 기록이다. 기본기+실제 UI 방어 R89, 대표기예 정책 R74,55체/정예14,8목표/12유한증원/6턴방어,4동행과주민 생존,실제15진입 및 Continue를 확인했다. 경로·정책이 달라 두 실행을 기예 하나의 인과비교로 해석하지 않는다.
- 방어후 정리가22/15라운드, 피난민 추가손실217/446HP였다. 정상 입력의 마지막 추적 페이싱은 후속 개선점이며 보호 규칙을 제거하지 않았다. inner 진입점 완전점유 해제는 별도 정상기본보행 fixture에서 확인했으나 실제 정상완주 중 발생·해제 관측은 아니다.
- 최종14 미술은 당시 플레이 기준 대비 terrain/units/markers/anchors/initialState/events/objectives/routes exact이며 elements/design과 전용 library 미술만 달라졌다. 원경 단순화·큰암면 반복감은 남아 있다. 승인된 Native4장만 사용자에게 전달했으며 Pages 캡처로 부르지 않는다.
- 실행환경 전환 뒤 이전 raw/전체캡처/검수ZIP은 현재 접근되지 않는다. Native4장은 Library 보존, 코드·테스트·문서는 원격 보존이다. 이전 검수 gate의21 BLOCKED는 증거 연결 미충족이며21개 gameplay 결함이라는 뜻이 아니다. 정상플레이·성능·전체verify·미술 전체최종승인까지 통과했다고 보고하지 않는다.
