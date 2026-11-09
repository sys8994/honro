# 서사 진행·대사 복구 — 2026-11-09

사용자의19장 가족 작별 복구 및 추가감사 결함 수정 지시에 따른 변경이다. 원문과 지형·몬스터·성장·승패 기획을 통째로 되돌리지 않고 발견한 대사/진행 경계를 고쳤다.

| 장 | 수정된 행동 | 저장 보존 |
|---|---|---|
| 13 | 접근 적·두 증원 원혼을 관측 전에 처치해도 구출과 문 조작을 계속할 수 있다. 이미 죽은 적이 현재 다가온다는 대사는 재생하지 않고 미관측/생략 사유를 남긴다. | 기존 전투와 구출·문 상태 유지 |
| 19 | `narrative-current.json`의 가족 여섯 단락35행을 문구·응답 순서 그대로 복구했다. 각 만남의 분리 대화→작별 대화가 끝난 뒤 혼이 실제로 떠난다. | 기존 완료 천도는 되감지 않고 미완료 만남부터 적용. 대화 중 커서/위치/HP/성장 유지 |
| 21 | 살아 있는 화자가 실제 현장에서 수레/갑주를 볼 때 선택대화6행을 목표·조작 안내의 현장 대화에서 읽을 수 있다. | 가짜 쉼터 관측 플래그 생성 없음 |
| 23 | 현재 장의 물건 관측과 소단의 실제 시야로 선택대화1행을 연다. 같은 장의 미래 완료 이력을 요구하지 않는다. | 완료 이력 합성 없음, read-once/cursor 재개 유지 |
| 24 | 기존 ENTRY에서 빠진 주민 발화만 실제 접근 후 보충한다. 그 발화가 끝난 뒤 감지/분할로 진행한다. | 옛 partial-entry/skipped-heard도 기존 전투 그대로 복구 |
| 31 | 출발 발화를 수락한 뒤 배가 움직인다. 이미 이동/접안한 옛 저장에서 빠진 BOAT/BOARD만 재제안한다. | 배 위치와 기존 완료/읽은 장면 유지 |
| 39 | 실제 손잡기 목격 뒤 발화가 다른 자막에 막히면 재시도한다. 자막이 자연 종료될 때까지 승리/결과창을 기다린다. | 자막 cursor/elapsed와 이미won인 진행 저장도 유지, 보상 중복 없음 |

## 19장 원문과 저장 계약

원문은 `shared/data/narrative-current.json#stages.19.beats`의 `separate-1/send-1`, `separate-2/send-2`, `separate-3/send-3`이다. 형의 망치와 약속12행, 언니를 부르는 일상의 호칭과 응답12행, 이름 없는 혼 곁에 남는 휘겸11행을 사용한다. 기존33행 자료는 보존하고 `shared/data/reviewed/act23-v4-ch19.json.familyRestoration`에 사용자 지시로 복구한 원문과 출처를 명시했다. 공통 row 조회는19장 복구 자료에만 한정해 이35행을 인정한다.

맵 revision은 올리지 않았으며 전투 스냅샷을 폐기하지 않는다. 복구 전 저장에서 이미 분리/천도한 만남은 `familyRepair.carried`로 이어받고 새 대사 열람 영수증을 위조하지 않는다. 남은 만남은 복구된 대화로 진행한다. 이미 끝난 장면을 다시 보려면 기존 여정 재방문을 사용한다. 완료 기록·SP·성장·장착·동행과 진행 중 대사의 커서를 초기화하지 않는다.

## 집중 검증

- `node tests/narrative-repair13-24.mjs`: 실제App/Story/Engine의 선처치 두 경계, 옛 partial-entry/발화 후 진행, Continue의units/성장/revision 유지.
- `node tests/narrative-repair19.mjs`: 원문35행 일치, 자유3→1→2 만남, 대화 종료 뒤 퇴장, 중간 커서 재개, 부분/전체 천도 완료 구형 저장 보존과 남은 만남 복구.
- `node tests/narrative-repair21-23.mjs`: 실제 도움말/현장 대화,7행·read-once·중간Continue, 생존/접지/시야/거리/차폐와 무관한 목표·RNG·전투 상태 불변.
- `node tests/narrative-repair31-39.mjs`: 실제 생산 함수VM의 BOAT 경합, 옛 이동/접안 저장 복구, HAND 대기/숨김·보이지 않는 시간 미진행, snapshot/자연 종료/실제App결과 경계.
- 기존 관련검사 `act23-v4-reviewed24`, `act23-v4-reviewed24-field`, `act23-v4-field-talk`, `act4-story-compact-save` 통과.
- 실제Chromium:19장 가족35행을DOM에서Enter로 읽고, 대화 중 저장/reload/Continue에서cursor/session/revision/units/성장 일치.21장6행·23장1행은 실제help→현장 버튼으로 읽고21장cursor재개/read-once 확인. desktop/mobile 화면을 직접 확인, pageerror0.

App검사의DOM/Canvas/접근 위치, 브라우저의 선행 클리어·접근 위치·일부 프레임/phase 준비는 명시fixture다. 전체 정상 캠페인 플레이·전 장 완주·사람의 재미 평가로 표시하지 않는다. 상세결과/스크린샷은 `_local/reports/narrative-repairs-20261109/`, 장별검사 결과는 `_local/reports/narrative-repair13-24/`, `_local/reports/narrative-repair31-39/`에 보존한다.

기존13장 전체검사는 변경 전부터 shared 원고와 과거 검토snapshot의 도착 문구가 달라 초기동일성검사에서 막혔다. 기존Act4 geometry검사는 이벤트검사 진입 전 pilot모듈/기준데이터가 없는harness bootstrap에서 막혔다. 이를 통과로 기록하거나 무관한 원고/검사를 수정하지 않았으며, 발견한 경계는 위 표적검사에서 따로 확인했다. 전체verify/전장순회/난도테스트는 실행하지 않았다.

## 발행 자산 보존

릴리스 사전검사에서 기존 발행SVG 한 파일의 CRLF→Git LF변환으로 manifest가 실제 공개파일과10바이트 달랐던 것을 확인했다. 실제Git blob과HTTP 공개바이트를 대조해 그1개 metadata를 바로잡고 원래 공개바이트를 보존했다.765개 원본 그래프를 확인한 뒤 성공발행을 등록했다. 새SVG는해시계산전에LF로정규화하고 `/web/** -text`로 생성물의Git 바이트를 보존한다. 지형 경로/색/그림은 변경하지 않았다. 실제 렌더/발화 검사와 이 발행 바이트 검사는 구분한다.
