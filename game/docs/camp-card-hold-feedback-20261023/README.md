# 카드 길게 누르기 500ms와 잡기 표시

기준 `cf2bd15887435a80574e1eadc9b6d67f38fd8343`. 카드 단위 빌드 진입점 `game.a68940d3292d34a4.js`. 타이머1000→500ms, 잡힌 카드에 황금/주황 테두리·5px 들림·그림자를 적용했다. CSS 개별 `translate`는 기존 inline 가로 `transform`과 합성하므로 재배열 FLIP와 충돌하지 않는다. 드롭/취소 때 class와 inline transform 정리 경로를 유지한다. 대사·음향·게임 규칙은 불변이다.

코드에서 준비 타이머는 pointerdown당1개이며 이동 중 재시작하지 않는다. 기존 준비 중 dx10/dy8 취소는 보존했다. 4px/3px 손떨림은 유지되고11px/9px는 취소되는 것을 확인했다. 사용자 실기기의 더 긴 지연 원인은 재현하지 못했다. 약한 기존 상태 표시, 취소 임계값, 메인 스레드 지연은 서로 구분한다.

- `node tests/player-turn-order.mjs`: 기존 턴/저장/Continue/수동 선택/구 저장 검사 통과.
- `python tools/testing/camp-card-hold-feedback-browser.py`: 결정적 가상 시계499ms 비활성/500ms 활성, 타이머 실행1회, 정지 상태 표시, 비선택 휘겸 유지, inline transform 없이 세로5px, 같은 자리 저장0회, contextmenu 취소·cleanup 통과.
- 실제 touch emulation390×844/844×390에서 약500.6/500.9ms로 관측. 의도적450ms시점180ms longtask는636.8ms로 지연됐다. 이는 지연 기전의 인위 표본이며 사용자 원인 증명이 아니다. 가로 모션 감소, 이동 중 임시 순서/드롭 저장1회 통과.
- `tools/testing/player-turn-order-browser.py`: 기존 탭/실시간 재배열·다른 카드180ms 애니메이션/외부/pointercancel/Escape/멀티터치/스크롤/모달/화면 이탈/재진입/저장과 실제 전투 차례 회귀 통과. 기존700/1060ms 검사 기대만350/560ms로 갱신했다.
- 빌드 통과. 최종 추가 UI 단위와 함께 web-split와 기준/공개 그래프 보존을 확인한다.

결과는 Git 제외 `_local/reports/camp-card-hold-feedback-20261023/`의 `feedback.json`, `regression/result.json`, native/build 로그다. `390-held.jpg`, `844-held.jpg`는 움직이지 않은 잡기 상태이고 각각의 `-dropped.jpg`는 해제 상태다. Android 실기기/공개 검증이 아니며 master/Pages는 부모 담당이다.
