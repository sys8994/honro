# P0 모바일 조이스틱 입력 — 최종 검수

- 기반: origin/master `27efe8eb`, 전용 `fix/p0-joystick-intent-20deg`.
- 구현: `1a808154` (원격 push 확인). 실제 Game/Playtest runtime과 TS App의 공통 reducer 적용. 입력 외 기예·지형 소스 변경 없음.
- 환경: Linux headless Chromium `/usr/bin/chromium`, CDP touch 합성, DPR 2. 실제 휴대기기/실제 손가락 테스트가 아니다. Game은 로컬 HTTP의 실제 생성 문서/모듈을 사용했다.
- 결과: browser 255 assertions / 429 state samples / 614 delivered pointer events, uncaught browser exception 0. 순수 의도 120 방향/크기 조합+반경/히스테리시스/물리, typecheck, S13 기존 14조건, 충전 입력 기존 126조건 모두 통과. 동일 물리 loop를 직접 일정 간격 호출했으며 전체 장 플레이나 성능 승인과 구분한다.

## 집중 검수 1 — 의도 판정

PASS. 320×740, 360×800, 390×844, 844×390 CSS viewport. 상/하·좌/우 양쪽 19/20/21도와 45도, 초기 tiny jitter, 7.5/8.1 CSS px, 중앙 복귀와 반대 재드래그, release 후 반대 의도 재시작을 확인했다. 원점은 중앙에서 3/2px 벗어난 실제 pointerdown 위치다. 19/20도는 aimOnly: physics 실행 전후 x/y/move budget 불변이고 `Engine.move` 호출 0. 21도는 moveAim이며 실제 좌표와 예산이 변했다. 45도 시작 후 x=.15/y=.98의 미세 이동+조준, 이어서 수직 조준도 가능했다. 모든 모바일 크기의 radial 판정은 min 8px가 지배했다(68px pad range27.88, 72px pad range29.52). 큰 범위는 순수 검사에서 .18×range 분기를 확인했다.

정확한 20도 CDP 입력에서 float32 좌표 오차가 재현돼 0.001도 수치 허용오차를 적용했다. 20.01도는 순수 검사에서 moveAim임을 별도 확인한다.

## 집중 검수 2 — 방향 전환

PASS. ±.59에서는 새 방향으로 바뀌지 않고 ±.61에서만 전환하며, .36/.34를 사이에 둔 해제와 재진입 및 중앙을 거치지 않는 큰 반대 입력을 확인했다. aimOnly는 전 구간 유지했고 x/y/예산 및 이동 호출 수는 그대로였다. 좌우 반전 시 sin(world angle)이 동일해 발사 높낮이가 튀지 않았다. Engine의 -85/-30/0/35/90도 반사 왕복은 속도·기력·예산도 보존했다. raw knob는 크게 움직이는 동안 gameplay x는 0이었다. 별도 impulse/fall fixture에서 물리 x/y는 정상 변하고 이동도는 보존됐다.

## 집중 검수 3 — 생명주기

PASS. pointercancel, 실제 lostpointercapture, blur, pause, 실제 HUD 동행 선택, 방어/턴 종료, Engine.finishAction 직접 종료 뒤 pointer/축이 비워지고 새 포인터로 이동할 수 있었다. 허공터는 1인맵이므로 동행 선택에만 두 번째 일반 동행 fixture를 추가했다. 다른 stick touch의 release는 주 pointer를 보존했다. stick+fire는 독립적으로 충전하고, stick만 취소해도 fire pointer/충전이 유지되어 release 시 실제 발사됐다. stick+jump는 주 pointer를 보존하고 정상 jump cost만 사용했으며 점프 손가락 release에도 stick은 유지됐다. targeted stick cancel은 브라우저 dispatchEvent(PointerEvent)의 합성 이벤트이며, 통상 touch down/move/up/cancel 및 capture 경로는 CDP가 전달한 trusted 브라우저 이벤트다. 두 종류 모두 실제 물리 장치 터치와 구분한다.

키보드 ArrowLeft/ArrowRight/A/D 이동 및 양쪽 facing의 ArrowUp/ArrowDown 높낮이 회귀를 실제 브라우저 key 이벤트로 확인했다. 별도 기존 입력 검사에서 Space 충전·포인터 충전/중복/취소·검술 추가 행동 방향 전환을 확인했다.

## 종합 판정과 증거

입력 범위 PASS. 요청한 제스처 지속 잠금·정상 미세 이동·방향 전환·생명주기·다중 터치·키보드 회귀가 최종 소스에서 함께 통과했다. 모바일 320/390 및 가로 844 스크린샷을 직접 열어 작은 모드 라벨과 raw 노브를 확인했다. 새 큰 UI는 없다. 가로 허공터의 기존 HUD가 캐릭터 하단을 가리는 구도는 입력 수정 범위에 포함하지 않았다.

- `input-trace.json`: 최종 전체 상태/브라우저 이벤트/255개 판정. 실패 이력은 `attempts/`이며 최종 통과 trace와 분리한다. 다중 터치 초기 진단에서는 CDP touchEnd의 종료 접촉 명세를 반대로 사용한 검사 fixture를 바로잡았다.
- `mobile-{320,360,390,844}-aim-only.png`: 실제 브라우저 viewport screenshot. 좌우 raw 노브 변위에도 이동도 1964/1964, 조준 모드.
- `provenance.json`, `built-manifest.json`, `screenshot-sha256.json`: 소스/생성 문서/캡처 연결.
- `browser-test.log`, `pure-test.log`, `build.log`: 실행 결과.

실제 기기 손 감각, iOS/Safari, OS 화면 회전·터치 취소는 미검증이다. 원격 브랜치는 입력 소스/테스트/문서만 반영한다. 생성 HTML/web은 부모가 병렬 소스를 통합한 뒤 재빌드한다. master 병합·GitHub Pages 배포/공개 브라우저 검증은 요청대로 보류했다. 차단/거부된 작업 없음.
