# 27장 심부 배경 후속 시안

사용자15:17 지시에 따른 배경 전용 후속이다. 앞선 `README.md`의 전투/저장 검사 한계는 그대로 적용한다. 최신 이미지는 `distortion-browser/`와 `distortion-native/`이며 기존 `browser/`, `native/`는 이전 시안 기록이다.

- `distortion-browser/desktop-deep-before-fall.png`: 실제 Game Chromium1440×900. 카메라3730/2810, 배율0.68. 낙하 직전3050y 지지면에 두 동행을 준비한 검사 상태다. RAF를 페이지 로드 전 고정하고 캡처 직전 실제 카메라x/y가 요청값과 일치함을 assertion했다. 정상 조작으로 이곳까지 완주했다는 뜻은 아니다.
- `distortion-browser/mobile-deep-before-fall.png`: 실제844×390 모바일, 카메라3730/2990, 배율0.48. 같은 준비 상태에서 동행/실제발판/HUD 가독성을 확인했다.
- `distortion-native/stage-27-overview.png`: 공통 HonroScene Native Canvas 전체도. 개념도나 브라우저 캡처가 아니다.

기존 하역장 배면의 색을약43% 밝기로 낮췄다. 심부의 같은 하역구가 불가능한 높이에서 반복되고, 뒤편 회랑의 소실점과 연결 높이가 맞지 않으며, 지지 기둥은 틈을 넘어 엇갈려 이어진다. 넓은 물띠는 옆으로 휘어 올라가는 형태, 젖은 배면에는 위 시설과 어긋난 반사를 그렸다. 물띠는 큰 면·가느다란 하이라이트로 읽히는 **정적 벡터 배경**이다. 유체 애니메이션·실제 물리 흐름을 추가한 것은 아니다. 보라색 포털·발광 입자·서사 해설은 없다.

정확한 비교 검사 `tests/stage27-background-distortion.mjs`는 이전시안 c1342cb 대비 후경 자산포인터1개와 collision빈 신규자산1개만 달라졌음을 확인했다. 기존 모든 자산, 30장 게임필드, 중력·지형·유닛·목표·진목·필수조우 trigger/support·물리적인 물 영역 및 runtime/engine/map 코드가 모두 동일하다. 이전 저장용 자산도 삭제/수정하지 않았다. 신규 재현/멱등성과 기존4방향보행 검사 재통과, 두HTML 재빌드 및 PC/mobile 캡처 JS오류0이다. 전투/조우 회귀의 앞선 결과는 해당 코드·게임필드가 정확히 불변이므로 재사용하며 이번에 재실행한 것으로 쓰지 않는다.

공식참고 픽셀 접근 차단, 정상자원 전투완주/성능/최종encounter gate/사용자미술승인은 여전히 미완료다. 원격 push는 부모의 인증 장애로 대기 중이다. master/Pages에는 쓰지 않았다.

재생성 순서: 최종 story/objective 저작 → `stage27-depot-revision.mjs` → `stage27-depot-distortion.mjs` → 두 HTML build.
