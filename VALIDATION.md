# 통합 검증

2026-09-25 Windows / Chrome headless 환경에서 실행했습니다. 브라우저 오류는 pageerror와 게임 lastError를 수집했습니다. 모바일은 844×390 가로 터치 에뮬레이션입니다. 생성 HTML을 실제로 열어 검사했으며 빌드 성공만으로 판정하지 않았습니다.

## 실행 명령과 범위

```powershell
npm.cmd --prefix game ci
python -m pip install -r requirements-dev.txt
npm.cmd run verify
```

루트 verify는 빌드 → 기존 RC21 검증 → 통합 검사 → 게임·편집기 성능 검사를 순차 실행합니다. TypeScript 검사, 기존 map/impact/SFX/balance/charge/party 검사, RC20 브라우저와 RC21 성능 검사를 포함합니다.

| 검사 | 판정 기준 / 결과 파일 |
|---|---|
| Migration | 10 Stage × story/normal/veteran, 원본 상태·geometry·material·unit·events 일치, 재생성·왕복 일치. [결과](reports/migration.json) |
| Integration | Stage 1~10 동일 viewport/camera/zoom에서 픽셀 차이 0. 실제 게임/iframe에 같은 420 tick 입력을 적용한 위치·속도·grounded·충돌·투사체 trace 일치. 10 Stage 이동·점프·공격 smoke, 실제 유닛·undo/redo·preview·모바일 HUD 포함. [결과](reports/integration.json) |
| Editor features | 실제 포인터로 terrain/solid·node/whole-shape drag·Ctrl snap·paint·scatter·lock/hide·Element polygon/collision·왕복·legacy import·asset layer 검사. [결과](reports/editor-features.json) |
| Authored game | 실제 file input import, level/rank, encounter, 턴 경계 trigger/dialogue, 소켓 interaction, 목표, 파괴 cache, retry, localStorage 격리·프로필 복원. [결과](reports/authored.json) |
| BGM unit | lazy preload, playlist, state/index 보존, crossfade, mute/volume, 실패 fallback, dispose. [결과](reports/audio-unit.json) |
| BGM browser | 실제 MP3 currentTime 증가, desktop/mobile playlist/보스/일시정지/비전투, SFX, iframe BGM와 Stop dispose. [결과](reports/audio-browser.json) |
| RC21 performance | Stage 1~4 실제 runtime, ≥50Hz, render 평균 <7ms, 시작 <500ms, heap 증가 <30MB, 파괴 후 cache invalidate. [결과](game/reports/rc21-performance.json) |

최종 검사 수와 성능 수치는 아래 자동 갱신 표에 기록합니다. 개별 명명된 assertion과 세부값은 각 JSON에 남습니다.

<!-- RESULTS_START -->
**최종 `npm run verify`: PASS (exit 0).** [실행 기록·산출물 SHA256](reports/verification-run.json)

| Suite | Result |
|---|---|
| integration | PASS · 47 checks |
| editor-features | PASS · 23 checks |
| authored | PASS · 15 checks |
| audio-unit | PASS · 11 checks |
| audio-browser | PASS · 28 checks |
| migration | PASS · 10 stages × 3 difficulties |
| Existing RC21 verify | PASS · typecheck, Node audits, browser 10, performance 5 |
| Browser uncaught JS errors | 0 |

| Stage / viewport / zoom | Original Hz / ms | Game Hz / ms | Editor Hz / ms | Original / Game / Editor load ms |
|---|---|---|---|---|
| 1 / 1365×768 / 0.82 | 59.76 / 3.575 | 59.84 / 3.203 | 60.10 / 0.986 | 83.4 / 94.7 / 56.6 |
| 2 / 1365×768 / 0.82 | 60.20 / 2.375 | 60.02 / 2.334 | 60.30 / 1.814 | 106.2 / 96.2 / 86.5 |
| 1 / 1365×768 / 0.2 | 59.77 / 3.805 | 60.17 / 3.831 | 59.67 / 1.537 | 102.3 / 99.8 / 55.8 |
| 2 / 1365×768 / 0.2 | 59.97 / 2.091 | 59.84 / 2.642 | 60.29 / 2.113 | 99 / 94.9 / 63.1 |
| 1 / 844×390 / 0.2 | 60.00 / 3.748 | 60.01 / 3.871 | 59.87 / 1.569 | 87.6 / 92.5 / 69.6 |
| 2 / 844×390 / 0.2 | 59.65 / 2.581 | 59.67 / 2.513 | 59.85 / 2.010 | 99.2 / 96.8 / 58.1 |

| Metric | Original | Game | Editor |
|---|---|---|---|
| renderMaxMs | 3.70 ms … 5.40 ms | 3.60 ms … 5.80 ms | 1.60 ms … 2.90 ms |
| heapDelta | -0.436 MB … 1.311 MB | -1.353 MB … 1.300 MB | -1.644 MB … 0.919 MB |
| warmCacheRebuilds | 0 … 0 | 0 … 0 | 0 … 0 |

Hz는 관측된 Scene 렌더 호출률, ms는 평균 JavaScript render 비용입니다. 18개 표본 모두 기준을 통과했습니다. 수치 원본: [before](reports/performance-before.json), [game](reports/performance-game.json), [editor](reports/performance-editor.json).
정적 cache 바이트 예산과 build/hit 횟수도 각 JSON에 포함됩니다.
<!-- RESULTS_END -->

## 원본 대비 보관된 회귀 검사

원본 import commit `8c22dde`를 별도 worktree에 두고 기존 Node 검사 **20개 전체**를 양쪽에 실행했습니다. 양쪽 8개 PASS, 양쪽 12개 FAIL, 원본에서 통과하다 통합에서 실패한 검사는 0개였습니다. [전체 결과와 원본 실패 이유](reports/historical-regressions.json).

기존 브라우저 검사 **8개 전체**도 같은 방식으로 비교했습니다. RC13/RC20 두 개는 양쪽 PASS, 나머지 6개는 양쪽 FAIL, 새 실패는 0개였습니다. [결과](reports/historical-browser.json). 테스트의 Chrome 경로·UTF-8·이동한 소스 경로만 플랫폼에 맞췄고 원래 map revision/좌표 기대값을 새 게임에 맞춰 낮추지 않았습니다.

이 실패들은 통합판 전체를 PASS라고 포장하지 않기 위해 별도 표시합니다. RC11/12/15/17/18/19의 이전 map revision·옛 layout 기대값 등은 이미 RC21에서 맞지 않습니다. 현재 합격 게이트는 RC21의 `game/package.json verify`와 새 통합 검사입니다. 실패한 과거 설계로 게임을 되돌리지 않았습니다.

재현:

```powershell
git worktree add --detach .test-output/rc21-baseline 8c22dde
npm.cmd --prefix .test-output/rc21-baseline/game ci
python -X utf8 tests/historical-regressions.py
python -X utf8 tests/historical-browser.py
```

## 성능 측정 방식과 한계

원본 RC21 HTML과 통합 HTML을 같은 Chrome, Stage 1/2, camera 중심, .82/.20 zoom, 1365×768 및 844×390 viewport에서 순차 측정했습니다. 각 표본은 600ms warmup 이후 2초입니다. Game은 Scene 렌더 비용, Editor는 같은 Scene의 정지 편집 렌더 비용입니다. Editor는 HUD·시뮬레이션이 멈춰 있으므로 게임 수치보다 작을 수 있습니다. Stage load에는 해당 host의 초기화가 포함됩니다.

Frame rate, render 평균/최대, load, cache build/hit/bytes, heap delta를 JSON에 기록했습니다. Warmup 이후 world cache rebuild 0을 검사합니다. 별도 RC21 검사는 실제 지형 파괴 후 rebuild 증가도 확인합니다. Source baseline은 `[8c22dde]:HONRO.html`입니다. 재측정은 이 파일을 `.test-output/RC21.html`로 복원한 뒤 `python -X utf8 tests/performance.py .test-output/RC21.html reports/performance-before.json`으로 실행합니다.

짧은 heap delta는 GC 영향을 받으며 장시간 메모리 누수의 증명은 아닙니다. Render cost의 작은 변동도 표에 그대로 남깁니다. 시각 상세도·node 수를 줄여 수치를 맞추지 않았습니다.

전체 Stage 수동 클리어, 실기기 iOS/Safari, 전곡 청취·sample 단위 gapless loop, 수 시간 편집 스트레스 테스트는 수행하지 않았습니다. 스크린샷·로그는 `.test-output/`에 두고 Git에서 제외합니다. BGM의 ended 순환은 이벤트를 발생시켜 검사했으며 실제 디코딩·재생 시작은 MP3 파일로 검사했습니다.
