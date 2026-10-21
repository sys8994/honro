# 모바일 조이스틱 의도

2026-10-21 사용자 확정: 위/아래 중심 각각 ±20°에서 처음 시작하면 제자리 조준, 나머지는 이동+조준. 포인터를 뗄 때까지 의도를 유지한다.

- `shared/engine/src/math.ts`의 `joystickGesture`를 TypeScript App과 실제 Game/Playtest의 `shared/runtime/main.js`가 함께 사용한다. 기존 두 App의 매 move 재평가/수평 억제만으로는 세로로 시작한 제스처의 의도를 보존할 수 없었다.
- 원점은 패드 중앙이 아니라 pointerdown의 CSS 좌표다. 최초 반경 입력 `max(range × .18, 8 CSS px)` 미만은 undecided이며 이동·조준 출력이 모두 0이다. 첫 유효 입력에서 한 번만 판정한다. 브라우저 float32 좌표를 위한 경계 수치 허용오차는 0.001°다.
- aimOnly는 중앙 통과·좌우 재드래그에도 이동축 0이며 `Engine.move`를 호출하지 않는다. 물리 tick·낙하·충격 속도와 명시적 점프의 기존 비용은 유지한다.
- 방향 전환은 정규화한 수평 raw 축 절댓값 .60에서 해당 방향으로, .35 미만에서 다시 무장하는 별도 히스테리시스다. 큰 반대 입력은 중앙을 거치지 않아도 반전할 수 있다. `Engine.face`는 이동·속도·이동 예산을 건드리지 않고 기존 보행과 같은 `180 - angle` 반사로 높낮이를 보존한다. 이후 ↑/↓의 기존 시각적 높낮이 규칙을 유지한다.
- moveAim의 수평 데드존은 .12 진입/.10 해제다. 세로축 크기에 따라 .26/.50 이상으로 억제하던 분기를 제거하여 21° 바깥과 대각선 이동 중의 미세 수평 입력을 살린다. 세로축은 기존 .12 곡선을 사용한다.
- 노브는 제한 반경 내 raw visual axes, 게임은 intent를 적용한 axes를 사용한다. 기존 크기의 작은 라벨로 `조준`/`MOVE-AIM`을 표시한다. 키보드 이동·조준·충전·점프 규칙은 유지한다.
- pointerup/cancel/lost capture는 해당 stick만 정리한다. 전역 cancel/blur/pagehide/숨김/pause/동행 교체/행동 종료는 소유 포인터·의도·축을 비운다. 취소는 캡처를 반납하고 closure에 오래된 id를 남기지 않는다. 프레임과 물리 substep 경계에서 입력 가능 여부·활성 유닛·라운드 소유권도 확인한다. 발사·점프의 다른 포인터는 stick 종료만으로 지우지 않는다.

## 재현 검증

```sh
npm ci --ignore-scripts
npm --prefix game ci --ignore-scripts
npm --prefix game run typecheck
node tests/joystick-intent.mjs
node tests/combo-landing-turn.mjs
node tests/charge-input.mjs
npm run build
python -X utf8 tests/joystick-intent-browser.py
```

브라우저 검사는 로컬 HTTP로 실제 생성 Game 문서를 열고 Chromium CDP touch 합성으로 브라우저 PointerEvent·캡처를 통과한다. 실제 production frame/120Hz 물리 루프를 직접 일정 간격 진행하며 좌표·이동도·이동 호출 수를 확인한다. 네 viewport의 허공터 바닥과 실제 활성 유닛을 사용하며, 동행 교체 사례만 두 번째 일반 동행 fixture를 추가해 실제 HUD 선택을 누른다. 화면 렌더링은 증거 촬영 시 실제 렌더러를 사용한다.

부모 화면 검수용 최소 원본은 [공유 증거 묶음](stage-review/joystick-intent/evidence/README.md)에 보존한다. 전체 증거는 `_local/reports/joystick-intent/`의 `input-trace.json`, `mobile-{320,360,390,844}-aim-only.png`, `review.md`에 둔다. 최종 Chromium 브라우저 검사는 255개 판정(429 상태/614 PointerEvent)을 통과했다. 의도 판정/방향 전환/생명주기 세 집중 검수와 종합 결과는 review에 별도 기록했다. 물리 장치의 손가락 감각·OS별 취소/화면 회전·Safari는 이 Chromium 합성 검증과 별도로 확인해야 한다.

입력 전용 브랜치에서는 master/Pages를 발행하지 않는다. 병렬 지형 작업과 생성물 충돌을 피하기 위해 소스·검사·문서만 커밋하며, 부모 최종 통합 시 `npm run build`로 HTML/web을 재생성한다.
