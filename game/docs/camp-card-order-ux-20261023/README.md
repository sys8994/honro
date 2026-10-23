# 휴식터 카드 순서 UX

기준: `261e44ed5c93b4b65f7748a622ecc77f20309ff2`. 실행 소스·최종 생성물 커밋: `03a21b15`(전체 브라우저 검사 당시 작업 트리와 최종 smoke 소스 hash는 각 JSON 참조). 작업 브랜치: `fix/camp-card-order-ux-20261023`. master 반영과 공개 검수는 부모 담당이다.

기존 코드도 비선택 합류 카드를 허용했지만 길게 누르기가 420ms였고, 이동 대상의 외곽선만 바뀌었다. 1초 길게 누르면 선택을 유지한 채 이동하며, 원래 슬롯 경계를 넘을 때 기존 카드 노드를 재배치하고 다른 카드가 180ms 동안 부드럽게 이동한다. 이동 중 순서는 임시 DOM에만 있으며, 유효한 놓기에서 기존 playerTurnOrder 저장을 한 번 호출한다. 같은 자리 놓기는 저장하지 않는다. 모션 감소 설정에서는 즉시 재배치한다.

안내는 ‘길게 눌러 순서 변경’ 한 줄이다. 짧은 탭 선택, 마우스 드래그, Alt+방향키, 미합류 카드 비활성은 유지한다. 길게 누르기 전 세로 이동은 네이티브 스크롤에 양보하며, 활성 이동 중 세로 흔들림은 스크롤을 일으키지 않는다. pointercancel·다중 터치·Escape·영역 밖 놓기·모달·화면 이탈은 원래 순서로 복원한다. 새 rAF나 이미지 로더를 만들지 않는다.

가로 844px 검사에서 이전 기준에도 존재하던 배지 넘침(scrollWidth826/clientWidth800)을 확인했다. max900 규칙의 point-dot에 빠져 있던 position:absolute 한 속성을 추가했다. 카드 내부 이름/경지/수련점과 승인 초상화는 유지한다. 엔진·대사·지형·초상화·스킬·효과음 소스는 변경하지 않았다.

## 수행한 검사

- `node tests/player-turn-order.mjs`: 새 라운드·기존 행동/죽음/기절·수동 선택·구 Continue·저장/import/debug 통과.
- `HONRO_CARD_ORDER_OUT=_local/reports/camp-card-order-ux-20261023/browser python tools/testing/player-turn-order-browser.py`: Chromium 실제 터치/CDP·마우스·키보드 통과. 700ms 비활성/1060ms 활성, 비선택 소단 이동 중 담허 선택 유지, 미리보기의 저장 0회, 다른 카드의 실제 animation/위치 변화, 놓기 1회, 취소/모달/화면 이탈/재진입/저장 복원 확인. 네이티브 스크롤 0→158, 순서 저장 없음. 새 전투의 소단 첫 행동→수비 후 휘겸, 수동 선택·export/Continue 보존, 휴식터 재정렬 후 다음 담허 행동 확인. pageerror/HTTP 실패 0.
- `python tools/testing/camp-card-order-smoke.py`: 최종 빌드의 320×640/360×780/390×844/844×390 통과. 비선택 휘겸 1초 터치·실시간 미리보기·선택 유지·활성 중 세로 흔들림 16px·놓기 1회·최소44px 터치·가로 넘침 없음·모션 감소 확인. 네 승인 초상 ready 확인.
- 소스 JS/Python syntax, `npm run build`, `node tests/web-split.mjs` 통과. 최종 entry는 `web/entries/game.6958bfcc5cc94966.js`, 활성378파일이다. 전체 브라우저 검사는 앞선 entry714442b1에서 했고, 이후 숨김 aria 상태 문구와 배지 한 속성을 바꾼 최종 빌드에 위 좁은 smoke를 수행했다.

검사는 데스크톱 Chromium의 모바일 크기/터치 에뮬레이션이다. 실제 Android/Safari 검사가 아니다. 전투 연결 검사는 준비된 이전 장 완료/성장 fixture와 프레임 고정 후 제한된 실제 Engine tick을 사용했다. 일반 캠페인 완주나 성능 향상을 입증하지 않는다. 스크린샷은 최종 320/844 및 앞선 390 시작/이동/저장을 직접 열어 확인했다.

## 증거

AGENTS.md에 따라 자동 결과와 JPG는 Git 제외 `_local/reports/camp-card-order-ux-20261023/`에 보존한다.

- [390 이동 전](../../../_local/reports/camp-card-order-ux-20261023/browser/mobile-before.jpg), [실시간 이동](../../../_local/reports/camp-card-order-ux-20261023/browser/mobile-dragging.jpg), [미리보기 정착](../../../_local/reports/camp-card-order-ux-20261023/browser/mobile-preview-settled.jpg), [저장 후](../../../_local/reports/camp-card-order-ux-20261023/browser/mobile-saved-cards.jpg)
- [최종320 미리보기](../../../_local/reports/camp-card-order-ux-20261023/320-preview.jpg), [최종844 저장 후](../../../_local/reports/camp-card-order-ux-20261023/844-saved.jpg)
- `browser/result.json`, `browser/actual-window.json`, `smoke.json`, `landscape-baseline.json`, `native.txt`, `build-final.txt`, `web-split.txt`, `retention.json`.

기존 공개30그래프와 현재261의 활성378파일을 바이트/SHA256 대조했다(총11396레코드). 빌드가 중간세대로 취급해 지운261의 고유4파일은 해당 Git blob에서 정확히 복원했다. 이후 부모가 Pages39918787757 completed/success의 updated_at `2026-10-23T07:38:10Z`, 08:20:47UTC 재확인, 공개 `game.8b4bc34c455c6bc6.js` 실제 브라우저 로드07:50:11UTC를 전달했다. 이 근거로261을 정식 보호 이력과 fixture에 등록하여 공개31그래프를 보존한다. 기존0570/379 보호 이력도 그대로다. 앞선 `gh api repos/sys8994/honro/actions/runs/39918787757` 읽기의 `Forbidden` 후 같은 API를 우회/재시도하지 않았고 부모의 직접 확인을 사용했다. 현재 미해결 차단은 없으며 이번 후보는 공개하지 않았다.
