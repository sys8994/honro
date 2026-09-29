# 통합 검증

최신 전체 검증: 2026-09-29 Windows / Chrome headless, `npm.cmd run verify` PASS(exit 0, 408.10초). [실행 기록·HTML SHA256](_local/reports/verification-run.json), [전체 로그](_local/logs/final-verify.log). 설오·담허·휘겸·소단 v007의 약 2배 앵커·얼굴/복식 개정·머리 비율 유지·모션 조정, 일반 적 벡터 11종과 기존 기예·방향 가이드·캠페인 회귀를 함께 검사했습니다. [네 동행 제작·검수 기준](game/docs/PARTY_ART_PIPELINE.md), [전용 48개 결과](_local/reports/party-forge/browser.json), [직접 본 미술 검토](_local/reports/party-forge/VISUAL_REVIEW.md). 12캐릭터 220px 렌더 p95는 현 PC에서 4.8ms였습니다. Game/Stage View/Playtest의 캐릭터 픽셀 일치와 두 HTML의 실제 충전·발사·피해·점프 연결을 확인했습니다. 공방 재생·스크럽·메모 다운로드·모바일 크기 유지도 별도 5개 PASS입니다. [공방 조작 검사](_local/reports/party-forge/review-ui.json). 브라우저 오류는 pageerror와 게임 lastError를 수집했습니다. 모바일은 터치 에뮬레이션이며 실제 기기 검사는 아닙니다.

Pages 배포 구성도 별도로 검사했습니다. `index.html`·게임·편집기·BGM만 있는 `/honro/` HTTP 경로에서 기본 주소 이동(쿼리·해시 보존), 게임 시작, MP3 5개 다운로드/원본 일치, 편집기 10개 스테이지, JavaScript 없는 진입점의 5항목 PASS·브라우저 예외 0건입니다. [결과](_local/reports/pages-smoke.json). 실제 GitHub 배포는 수행하지 않았습니다. `_local/` 결과·로그·이미지는 로컬 전용이며 Git에 포함되지 않습니다.

## 실행 명령과 범위

```powershell
npm.cmd --prefix game ci
python -m pip install -r requirements-dev.txt
npm.cmd run verify
```

루트 verify는 빌드 → 기존 RC21 검증 → 통합 검사 → 게임·편집기 성능 검사를 순차 실행합니다. TypeScript 검사, 기존 map/impact/SFX/balance/charge/party 검사, RC20 브라우저와 RC21 성능 검사를 포함합니다.

| 검사 | 판정 기준 / 결과 파일 |
|---|---|
| Migration | 10 Stage × story/normal/veteran 원본 이관 일치. 개편한 1·2는 원본 프로젝트로 비교하고 활성 3~10은 원본과 동일. 현재 전체 프로젝트는 원본+Workshop 레시피 재현·왕복 일치. [결과](_local/reports/migration.json) |
| Stage 1·2 redesign | 실제 Workshop 작성·내보내기, 이동·점프·가지 파괴·상여 경로·물 전도, 실제 Playtest 입력. [결과·화면](game/docs/STAGE12_REDESIGN.md) |
| Integration | Stage 1~10 동일 viewport/camera/zoom에서 픽셀 차이 0. 실제 게임/iframe에 같은 420 tick 입력을 적용한 위치·속도·grounded·충돌·투사체 trace 일치. 10 Stage 이동·점프·공격 smoke, 실제 유닛·undo/redo·preview·모바일 HUD 포함. [결과](_local/reports/integration.json) |
| Editor features | 실제 포인터로 terrain/solid·node/whole-shape drag·Ctrl snap·paint·scatter·lock/hide·Element polygon/collision·왕복·legacy import·asset layer 검사. [결과](_local/reports/editor-features.json) |
| Authored game | 실제 file input import, level/rank, encounter, 턴 경계 trigger/dialogue, 소켓 interaction, 목표, 파괴 cache, retry, localStorage 격리·프로필 복원. [결과](_local/reports/authored.json) |
| Party art | 고정 v006 앵커 예산·5동작 × 101시점 × 4인 리그·SVG/Canvas 일치·양방향 조준·실제 Game/Playtest 발사/피격/점프·Stage View 그림 일치. [결과](_local/reports/party-forge/browser.json) |
| BGM unit | lazy preload, playlist, state/index 보존, crossfade, mute/volume, 실패 fallback, dispose. [결과](_local/reports/audio-unit.json) |
| BGM browser | 실제 MP3 currentTime 증가, desktop/mobile playlist/보스/일시정지/비전투, SFX, iframe BGM와 Stop dispose. [결과](_local/reports/audio-browser.json) |
| RC21 performance | Stage 1~4 실제 runtime, ≥50Hz, render 평균 <7ms, 시작 <500ms, heap 증가 <30MB, 파괴 후 cache invalidate. [결과](_local/game-reports/rc21-performance.json) |

최종 검사 수와 성능 수치는 아래 자동 갱신 표에 기록합니다. 개별 명명된 assertion과 세부값은 각 JSON에 남습니다.

<!-- RESULTS_START -->
**최종 `npm run verify`: PASS (exit 0).** [실행 기록·산출물 SHA256](_local/reports/verification-run.json)

| Suite | Result |
|---|---|
| integration | PASS · 47 checks |
| editor-features | PASS · 23 checks |
| authored | PASS · 15 checks |
| audio-unit | PASS · 14 checks |
| audio-browser | PASS · 69 checks |
| bgm-transitions | PASS · 68 checks |
| aim-direction/browser | PASS · 58 checks |
| monster-forge/browser | PASS · 43 checks |
| party-forge/browser | PASS · 48 checks |
| stage12-redesign/checks | PASS · 18 checks |
| stage12-redesign/browser | PASS · 9 checks |
| skill-redesign/unit | PASS · 35 checks |
| skill-redesign/browser | PASS · 21 checks |
| skill-polish/unit | PASS · 7 checks |
| skill-polish/browser | PASS · 59 checks |
| skill-effects/unit | PASS · 6 checks |
| skill-effects/browser | PASS · 21 checks |
| field-polish/unit | PASS · 9 checks |
| field-polish/browser | PASS · 24 checks |
| hwigyeom-p5/unit | PASS · 38 checks |
| hwigyeom-p5/browser | PASS · 37 checks |
| skill-tuning/unit | PASS · 6 checks |
| skill-tuning/browser | PASS · 20 checks |
| story-rewrite/unit | PASS · 8 checks |
| story-rewrite/browser | PASS · 61 checks |
| migration | PASS · 10 stages × 3 difficulties |
| Existing RC21 verify | PASS · typecheck, Node audits, browser 10, performance 5 |
| Browser uncaught JS errors | 0 |

| Stage / viewport / zoom | Original Hz / ms | Game Hz / ms | Editor Hz / ms | Original / Game / Editor load ms |
|---|---|---|---|---|
| 1 / 1365×768 / 0.82 | 59.76 / 3.575 | 57.17 / 0.683 | 57.32 / 0.707 | 83.4 / 87.3 / 32.9 |
| 2 / 1365×768 / 0.82 | 60.20 / 2.375 | 57.21 / 1.343 | 56.70 / 1.329 | 106.2 / 100.8 / 55.7 |
| 1 / 1365×768 / 0.2 | 59.77 / 3.805 | 56.76 / 1.214 | 57.08 / 1.058 | 102.3 / 68.6 / 26.4 |
| 2 / 1365×768 / 0.2 | 59.97 / 2.091 | 57.14 / 1.330 | 57.10 / 1.277 | 99 / 105 / 45.7 |
| 1 / 844×390 / 0.2 | 60.00 / 3.748 | 56.96 / 1.231 | 56.83 / 0.939 | 87.6 / 72.4 / 29 |
| 2 / 844×390 / 0.2 | 59.65 / 2.581 | 57.04 / 1.288 | 57.33 / 1.388 | 99.2 / 105.7 / 46.9 |

| Metric | Original | Game | Editor |
|---|---|---|---|
| renderMaxMs | 3.70 ms … 5.40 ms | 1.40 ms … 2.40 ms | 1.10 ms … 2.30 ms |
| heapDelta | -0.436 MB … 1.311 MB | -1.710 MB … 1.156 MB | -2.510 MB … 2.387 MB |
| warmCacheRebuilds | 0 … 0 | 0 … 0 | 0 … 0 |

Hz는 관측된 Scene 렌더 호출률, ms는 평균 JavaScript render 비용입니다. 18개 표본 모두 기준을 통과했습니다. Original은 RC21 원본 지형이고 Game/Editor는 개편 지형이므로 동일 콘텐츠의 성능 비교는 아닙니다. 수치 원본: [before](tests/fixtures/performance-before.json), [game](_local/reports/performance-game.json), [editor](_local/reports/performance-editor.json).
정적 cache 바이트 예산과 build/hit 횟수도 각 JSON에 포함됩니다.
<!-- RESULTS_END -->

검증 범위: 이번 전체 verify는 일반 적 11종을 반영한 두 HTML의 기록된 SHA256 기준이며, 종료 후에도 해시가 일치함을 확인했습니다. 이전 기예·방향선 개별 재검사 기록은 [보관 결과](_local/reports/skill-tuning/latest-artifacts-check.json)입니다. 공방 조작 5항목도 별도 확인했습니다([UI 검사](_local/reports/monster-forge/lab-ui.json)). 이미지 관찰 결과는 [시각 검토](_local/reports/monster-forge/VISUAL_REVIEW.md)에 있으며, 기술 통과를 사용자의 미술 승인으로 취급하지 않습니다.

## 원본 대비 보관된 회귀 검사

원본 import commit `8c22dde`를 별도 worktree에 두고 기존 Node 검사 **20개 전체**를 양쪽에 실행했습니다. 양쪽 8개 PASS, 양쪽 12개 FAIL, 원본에서 통과하다 통합에서 실패한 검사는 0개였습니다. [전체 결과와 원본 실패 이유](_local/reports/historical-regressions.json).

기존 브라우저 검사 **8개 전체**도 같은 방식으로 비교했습니다. RC13/RC20 두 개는 양쪽 PASS, 나머지 6개는 양쪽 FAIL, 새 실패는 0개였습니다. [결과](_local/reports/historical-browser.json). 테스트의 Chrome 경로·UTF-8·이동한 소스 경로만 플랫폼에 맞췄고 원래 map revision/좌표 기대값을 새 게임에 맞춰 낮추지 않았습니다.

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

Frame rate, render 평균/최대, load, cache build/hit/bytes, heap delta를 JSON에 기록했습니다. Warmup 이후 world cache rebuild 0을 검사합니다. 별도 RC21 검사는 실제 지형 파괴 후 rebuild 증가도 확인합니다. Source baseline은 `[8c22dde]:HONRO.html`입니다. 당시 비교 기준 JSON은 `tests/fixtures/performance-before.json`에 보존합니다. 재측정은 이 HTML을 `.test-output/RC21.html`로 복원한 뒤 `python -X utf8 tests/performance.py .test-output/RC21.html _local/reports/performance-before-rerun.json`으로 실행합니다.

짧은 heap delta는 GC 영향을 받으며 장시간 메모리 누수의 증명은 아닙니다. Render cost의 작은 변동도 표에 그대로 남깁니다. 시각 상세도·node 수를 줄여 수치를 맞추지 않았습니다.

전체 Stage 수동 클리어, 실기기 iOS/Safari, 전곡 청취·sample 단위 gapless loop, 수 시간 편집 스트레스 테스트는 수행하지 않았습니다. 스크린샷·로그는 `.test-output/`에 두고 Git에서 제외합니다. BGM의 ended 순환은 이벤트를 발생시켜 검사했으며 실제 디코딩·재생 시작은 MP3 파일로 검사했습니다.
