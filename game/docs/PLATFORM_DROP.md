# 발판 아래로 내려가기

## 조작과 범위

- 기존 방어 자리에는 아래 화살표가 있고 방어는 바로 왼쪽에 있다. Game과 Workshop Playtest가 같은 HUD와 엔진을 쓴다.
- 아래 화살표는 실제 발이 지지된 oneWay 윗면에서만 켜진다. 단단한 땅·혼합 solid 이음새·공중·고정 개체에서는 사용할 수 없다.
- 키보드 ↓와 조이스틱 세로축은 기존 조준 기능을 유지한다. 새 단축키는 만들지 않는다. F는 방어다.
- 발판에서 지지를 해제하는 이동이라 추가 기력·이동력·턴 비용이 없다. 기존 낙하 피해는 높이에 따라 그대로 적용한다.

## 공통 물리와 모션

`Engine.drop()`은 0.18초 준비 → 낙하 → 0.26초 착지 완충을 만든다. 준비 중 발 좌표는 그대로 유지하고 골반·무릎을 굽힌다. 어깨·팔·무기 연결을 보존하고 옷자락만 접는다. 발판 통과 뒤 기존 하강 자세로 다리를 풀며, 다음 실제 지지면에서만 착지한다.

현재 발이 닿은 실제 oneWay의 위쪽 edge만 임시 제외한다. 같은 높이의 중첩/좁은 이음새는 양쪽 실제 면을 묶지만 solid가 하나라도 섞이면 거절한다. 다른 층의 발판, 같은 다층 polygon의 아래쪽 윗면, solid 벽·바닥은 그대로 충돌한다. 발이 윗면보다 6px 아래에 오면 해당 면의 예외도 끝난다. 낙하 중 직사각형 플랫폼은 edge 판정으로 내부 시작의 가짜 t=0 착지를 방지한다. 투사체 및 기예의 oneWay 규칙은 바꾸지 않는다.

준비/낙하 동안 전투 입력을 잠가 연타·공격·방어·아이템·상호작용이 중복 처리되지 않는다. 착지 후 즉시 일반 점프·공격·보행을 할 수 있고 새 행동은 착지 모션을 해제한다. 외부 충격·사망·고정·회수에는 잔여 drop 상태를 제거한다. 일시정지는 그대로 멈추며 저장은 현재 phase/elapsed/실제 접촉 edge를 보존한다.

## 검증과 남은 범위

- `node tests/platform-drop.mjs`: 59개 실제 엔진 fixture; 네 동행·다섯 dt·얇은 하층·겹친/혼합 seam·경사·동일 polygon 아래층·반복입력·상태 취소.
- 기존 `one-way-platform-physics`: 140개, `ground-contact`: 2,090개 통과. TypeScript 검사 통과.
- 독립 검수의 307개 synthetic 물리 조건 통과. 네 동행, 작은 하층 간격, 중첩/혼합 이음새, 경사, 두 윗면을 가진 동일 polygon, 입력 경합과 취소를 포함한다. 이는 정상 캠페인 플레이 증거가 아니다.
- `node tests/platform-drop-save.mjs`: 네 동행의 준비/낙하/착지 28개 중간시점을 실제 App export/import/Continue로 각각 두 번 재개(총 56회)하여 위치·속도·자원·접촉 edge 보존 확인. 독립 검수의 별도 36개 App 저장/상태 경계도 통과했다. 두 집계는 서로 다른 fixture 집합이다.
- Native Canvas 네 동행 × 양방향 자세표에서 발 고정, 팔/다리 관절·무기 grip 유지, 낙하 중 비접지를 수치와 이미지로 확인. 담허 지팡이 끝의 준비 관통을 없애고 낙하→착지 상체를 90ms에 걸쳐 이어 준다.
- `node --expose-gc tests/platform-drop-motion.mjs`는 자세표에 더해 동일 world/camera의 두 발판 사이 6단계 그림을 만든다. 추가 world-frame 첫 실행은 환경 자원 압박이 관찰된 시점에 exit 137로 중단됐다. 이후 동일 최종 엔진/어댑터의 독립 Native 검수를 캐릭터별로 순차 재실행해 통과했다. 4인의 고정 world 좌표 그림에서 상층 접지→통과→하강→하층 접지까지 확인했다. 구현자와 독립 검수자가 전부 직접 확인했으며, 이는 실제 브라우저 Scene 검수와 구분한다.
- 독립 검수 기록과 이미지: `_local/reports/platform-drop/independent/final-manifest.json`, `physics-report.json`, `save-report.json`, `motion-*-report.json`, `world-*.png`. 원본 commit/hash는 manifest에 있다. Native 세계좌표 그림은 단순 두 발판 fixture와 실제 리그를 사용한다.
- 두 HTML 빌드 완료. 공식 클라우드 브라우저는 file URL을 URL 보안정책으로 거절해 로컬 HTML UI 검수를 진행하지 않았다. 허용된 Pages HTTP(S)에서 Game/Workshop/Playtest 실제 UI 검수를 이어가야 한다.
- 전체 `verify`는 통과하지 않았다. 독립 검사에서 `one-way-platforms`의 기존 density source-membership 실패는 기준 checkout에서도 재현했다. `migration`은 기존 미술 library membership/order에서 실패했으며 기준 실행은 아직 하지 않았다. 변경하지 않은 과거 원본 fixture를 이번 기능에 맞춰 덮어쓰지 않는다. 구현자의 `game test` 재실행은 자원 조율 중 중단했고 후속 단계는 실행되지 않았다.
- master 및 Pages는 최종 통합/직접 검수 대기다. 중단/미실행을 통과로 세지 않는다.
