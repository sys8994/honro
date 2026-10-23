# 실제 수비 범위 표시

기준cf2bd158, UI 완료3561a2f3 위의 별도 수정이다.18장 단축 퀘스트의 contestRadius0과 공통 holdGuide의 “contestRadius가 양수일 때만 표시” 조건이 충돌해 실제 반경680의 원 전체가 사라졌다. 렌더 순서는 지형/물/환경색 보정 뒤라 지형 가림 문제는 아니었다.

실제 step.radius와 같은 marker의 유클리드 발 위치 판정을 읽는다. 적 점유 반경은 옵션이며0이면 점선/적 진입 금지 안내를 그리지 않는다. 실선의 어두운 받침·밝은 윤곽·얕은 면과 실제 중심표식을 추가했다. hero/적 대상 제외도 기존 Act2.tick과 맞춘다. 퀘스트/반경/턴/적/HP/조건/저장 데이터를 바꾸지 않는다. 구/신 저장 모두 화면에서만 복구된다.

정상 줌에서680반경은 모바일 viewport보다 넓어 원의 양쪽이 화면 밖일 수 있다. 원을 줄여 위장하지 않고 중심/방어중 상태와 실제 전체 면을 보여 준다. 기존 화면 밖 목표 화살표는 “담허 · 수비 범위”를 명확히 표시하고 목표·조작 안내의 “수비 범위 보기”는 실제 중심을 가리키며 기존 camera zoom 한도 안에서 범위를 맞춘다. 새 전투 입력/진행은 없다.

`node tests/hold-zone-display.mjs` 통과: 실제 newRound2회 뒤 R3에서 담허의 실제 silence use/tick으로 hold를 시작했고 기존 actor를 모두 유지했다. 반경 안679.99/경계680/밖680.01에서 guarded 실제 값과 일치하며0 contest는 중앙 적도 방해로 오표시하지 않는다.20회 조회 무변경·Continue actor exact·현재 저작된 hold8개(14/17/18/20/21/22/29/30) 정의/marker를 확인했다. 다른 Act2 hold는 양수 방해 반경이라 같은 누락이 없고3막은 이미 same-floor 영역을 그린다.3막의 해당 공통 HUD 안내만 “원”→“범위”로 수정했다. 이전 저장의 양수 contest도 기존 점선을 유지한다.

`python tools/testing/hold-zone-display-browser.py` 통과: 실제 빌드390×844/844×390, R3 준비 상태·줌.68/.24/.5·화면밖 화살표·실제 목표 버튼·Continue 전체battle exact. all8 정의 읽기 검사는 전체 장 플레이가 아니다. 준비 좌표와 직접 라운드 경계의 검사이며 정상 전투 완주·실기기·공개 검증이 아니다.

자동 증거는 `_local/reports/hold-zone-display-20261023/`의 `native.json`, `browser.json`, `r3-active-profile.json`, `390-current.jpg`, `390-wide.jpg`, `390-offscreen.jpg`, `390-goal-view.jpg`, `844-current.jpg`, `844-goal-view.jpg`, `844-continue.jpg`다. 최종 빌드/공개 그래프는 부모 통합 전 후보에서 보존한다.
