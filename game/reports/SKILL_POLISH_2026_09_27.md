# 허공터·기예 설명·명중 피드백 후속 개선

2026-09-27. 사용자 후속 요청 7개 항목에 대응한다. 기존 개편 명세보다 이번 요청의 빙호 대기 시간과 설명 방식이 우선한다. 실행 파일은 루트 `HONRO.html`, `HONRO_WORKSHOP.html`이며 같은 빌드 목록과 엔진을 사용한다.

| 요청 | 반영 내용 |
|---|---|
| 허공터 선택 UX | 동행 4명의 현재 캐릭터 초상, 계통 탭, 아이콘·서사 설명이 있는 카드, 경지 1~8 버튼, 선택 경지의 효과 패널, 상시 기예의 개별 적용/해제. 기본기와 단일 경지 비기는 해당 규칙을 표시한다. 카드 순서는 실제 트리의 순서다. |
| 설명과 수치 분리 | 플레이어 기예 84개의 서사 설명을 `skillLore.ts`에서 관리한다. 사용 조건·횟수·회복·피해·시간은 공통 `skillEffectRows()`로 이동/보완하여 기존 `.effect-compare`와 허공터에 함께 표시한다. |
| 명중음 누락 | 개편 기예의 실제 피해·보호막 흡수 경로에서 명중음을 발생시킨다. 관통/귀환/연쇄의 조기 반환도 빠지지 않는다. `arrowhit`의 동일 음 중복 억제를 해제해 같은 프레임의 연속 명중도 각각 소스를 시작한다. 전체 음성 수 상한과 압축기는 유지한다. |
| 예측 궤적 | 설오의 화살을 복제한 전투에서 실제 `fire → stepProjectile`로 전개한다. 급락 정점, 귀환 선회, 추적, 관통, 도약, 산개와 칠성 분열까지 같은 물리/충돌을 사용한다. 살아 있는 전투의 RNG·체력·지형을 변경하지 않는다. 조준 상태 캐시는 유지한다. |
| 빙호 | 대기 1.6초 → 2.4초. 적 몸도 실제 충돌 대상으로 삼아 반사한다. 도자기 반동음과 작은 충격원을 추가한다. 접촉 즉시 폭발/피해 없이 대기 후 폭발하며 얼음조각·감속은 유지한다. 예측도 적 반동과 실제 age-before-motion 순서를 반영한다. |
| 진목 | 파진=적갈·갈라진 머리, 회생=비취·새싹, 유인=보라·고리, 축지=청색·쌍부적, 오방=황토·가로 봉목. 종류별 글귀와 짧은 이름, 흔들리는 부적, 떠오르는 잔광, 회전하는 지면 자취를 그린다. |
| 파문술 | 회백색 기운에 넓은 옅은 번짐과 마른 붓결을 겹친다. 날아가는 기운도 붓끝처럼 바꾸고, 명중점에는 퍼지는 붓획·작은 먹방울을 추가한다. 파문 전개/명중/반사를 `qiWave / qiHit / qiRebound`로 구분한다. 판정 도형은 기존 공통 geometry를 그대로 사용한다. |

허공터 연속 사용과 원호파·팔괘파·파문/번개 표현은 이후 [추가 요청 보고서](SKILL_EFFECTS_2026_09_27.md)의 변경이 최신 기준이다. 이 문서의 수치와 화면은 당시 검증 기록이다.

## 확인된 원인

허공터는 두 `select`를 만들고, roster 준비와 실제 허상 전투 생성에서 스킬을 각각 8경지로 덮어썼다. 두 경로 모두 선택한 경지를 반영하도록 수정했다. 임시 설정은 앱 메모리와 복제한 수련 roster에만 쓰며 캠페인 육성은 건드리지 않는다.

관통시 등의 `redesignImpact`는 다음 관통·귀환·도약을 위해 마지막 명중음 구문보다 먼저 반환했다. 파문 도형의 `hurt(..., projectile)`도 일반 `!projectile` 명중음 조건에 들어가지 않았다. 피해가 확정되는 공통 경로로 명중 피드백을 옮겼다.

옛 설오 예측은 일반 탄도 적분만 수행하여 정점 이후의 중력 변경과 귀환 선회를 재현하지 않았다. 빙호는 유닛 충돌 검사에서 명시적으로 제외되어 있었다. 진목은 종류와 무관하게 동일한 정지 목재 도형이었다.

## 검증과 증거

- `node tests/skill-polish.mjs`: 7개 회귀 묶음. 화살 8종 × 경지 2개 × 각도 3개 × 바람 2개 = 96조건의 예측/실탄 좌표를 비교했다. 최대 오차 0이며 원본 전투 불변도 검사했다. 적 관통 6회 명중음, 빙호 반동·지연·파편·예측, 파문 5종과 기본기의 실제 명중 VFX/SFX, 설명/효과 패널, 진목 구분, 음원 파형을 포함한다. [결과](../../reports/skill-polish/unit.json)
- `python -X utf8 tests/skill-polish-browser.py`: 59개 검사 통과, 브라우저 예외 0건. 본게임과 Workshop의 실제 버튼/키보드 입력으로 모든 캐릭터와 계통, 경지 반영·재시작·상시 기예·취소·캠페인 육성 불변을 확인했다. 브라우저 `AudioBufferSourceNode.start()` 호출도 확인했다. 390×844와 844×390에서 레벨 버튼·고정 적용 버튼을 조작했다. [검사와 조준 성능](../../reports/skill-polish/browser.json)
- `npm.cmd run verify`: **PASS, exit 0, 267.93초**. 빌드, TypeScript, 기존 전투/이관/저장/맵/오디오, 두 HTML의 스킬 검사, 성능 검사를 순차 실행한다. 정확한 최종 종료 코드와 HTML 해시는 [실행 기록](../../reports/skill-polish/verification.json), 상세 출력은 [로그](../../reports/skill-polish/verify.log)에 기록한다.

화면: [허공터 PC](../../reports/skill-polish/training-desktop.png), [모바일 카드](../../reports/skill-polish/training-mobile-portrait.png), [모바일 경지](../../reports/skill-polish/training-level-portrait.png), [설명/효과 패널](../../reports/skill-polish/skill-detail.png), [진목 5종](../../reports/skill-polish/stakes-game.png), [파문](../../reports/skill-polish/wave-M15.png), [귀환 예측·실탄 겹침](../../reports/skill-polish/trajectory-A12.png), [Workshop 파문](../../reports/skill-polish/workshop-wave.png).

## 저장과 범위

추가 저장 포맷 변경이나 SP 환원은 없다. HBUG-031의 `skillRevision=1`을 유지한다. 기존 NPC의 LA/LM 기예와 캠페인 진행·맵은 보존한다. 허공터에서 선택한 경지/상시 기예는 같은 앱 세션의 재시작에 유지되며 브라우저를 새로 열 때까지 영구 저장하지 않는다.

예측은 조준 시점의 전장 상태를 기준으로 한다. 발사 이후 움직이는 적/시전자, 전로시의 추가 입력처럼 미래 입력까지 확정할 수는 없다. 브라우저 검사는 실제 빌드의 통제된 전투 fixture이며 전체 캠페인 정상 육성·수동 완주나 실기기 스피커 청취를 뜻하지 않는다. 음 출력 검증은 WebAudio 소스 시작과 파형 검사다.

주요 소스: `shared/runtime/training.js`, `main.js`, `renderer.js`, `shared/engine/src/skillLore.ts`, `progression.ts`, `skillMechanics.ts`, `engine.ts`, `skillVisuals.ts`, `art.ts`, `sound-design.ts`, `game/src/training.css`.

최종 성능: 게임/Workshop 각 6조건이 모두 50Hz 이상, 평균 render 7ms 미만, 예열 후 캐시 재생성 0 기준을 통과했다. Chrome에서 충전 중 예측을 반복한 p95는 급락시 0.8ms, 귀환시 2.5ms, 칠성추혼 3.5ms였다. 개별 기기의 동일한 성능을 보장하는 수치는 아니다.
