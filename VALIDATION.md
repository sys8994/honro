# 통합 검증

최신 전체 검증: 2026-09-29 Windows / Chrome headless, `npm.cmd run verify` PASS(exit 0, 709.91초, 13:42:36 UTC 완료). [실행 기록·HTML SHA256](_local/reports/verification-run.json), [전체 로그](_local/logs/final-verify.log). 네 동행 v008의 시트 기반 얼굴·v007 대비 ±5% 노드 예산·소단 연보라색 포인트와 기존 리그/동작 보존을 확인했습니다. 같은 작업공간의 전투·피날레·서사 변경도 포함한 전체 검증입니다. [제작 기준](game/docs/PARTY_ART_PIPELINE.md), [전용 53개 결과](_local/reports/party-forge/browser.json), [네 단계 시각 검토](_local/reports/party-forge/VISUAL_REVIEW.md). 12캐릭터 220px 렌더 p95는 현 PC에서 3.8ms였습니다. Game/Stage View/Playtest의 픽셀 일치와 두 HTML의 실제 충전·발사·피해·점프 연결을 확인했습니다. 공방 재생·스크럽·메모 다운로드·모바일 크기 유지도 별도 5개 PASS입니다. [공방 조작 검사](_local/reports/party-forge/review-ui.json). 브라우저 오류는 pageerror와 게임 lastError를 수집했습니다. 모바일은 터치 에뮬레이션이며 실기기 검사는 아닙니다. 기술 통과와 시각적 완성도 평가는 별개입니다.

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
| Party art | 실제 시트 SHA/crop·v007 앵커 ±5%·리그/동작/무기 제약 보존·5동작 × 101시점 × 4인·SVG/Canvas 일치·양방향 조준·Game/Playtest 발사/피격/점프·Stage View 그림 일치. [결과](_local/reports/party-forge/browser.json) |
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
| party-forge/browser | PASS · 53 checks |
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
| story-rewrite/browser | PASS · 62 checks |
| migration | PASS · 10 stages × 3 difficulties |
| Existing RC21 verify | PASS · typecheck, Node audits, browser 10, performance 5 |
| Browser uncaught JS errors | 0 |

| Stage / viewport / zoom | Original Hz / ms | Game Hz / ms | Editor Hz / ms | Original / Game / Editor load ms |
|---|---|---|---|---|
| 1 / 1365×768 / 0.82 | 59.76 / 3.575 | 56.52 / 0.809 | 57.05 / 0.670 | 83.4 / 78.9 / 40.9 |
| 2 / 1365×768 / 0.82 | 60.20 / 2.375 | 56.83 / 0.488 | 56.36 / 0.337 | 106.2 / 131 / 66.3 |
| 7 / 1365×768 / 0.82 | — | 56.74 / 0.722 | 56.86 / 0.598 | — / 76.8 / 35.7 |
| 10 / 1365×768 / 0.82 | — | 56.69 / 1.240 | 56.60 / 1.313 | — / 68.7 / 26.8 |
| 1 / 1365×768 / 0.2 | 59.77 / 3.805 | 56.89 / 1.315 | 57.05 / 1.230 | 102.3 / 77.9 / 35 |
| 2 / 1365×768 / 0.2 | 59.97 / 2.091 | 56.87 / 1.563 | 57.24 / 1.695 | 99 / 129.5 / 59.5 |
| 7 / 1365×768 / 0.2 | — | 57.06 / 1.906 | 57.45 / 1.790 | — / 71.7 / 29.2 |
| 10 / 1365×768 / 0.2 | — | 56.72 / 1.570 | 57.57 / 1.854 | — / 61.8 / 29.5 |
| 1 / 844×390 / 0.2 | 60.00 / 3.748 | 57.23 / 1.375 | 56.72 / 1.183 | 87.6 / 76.6 / 32.8 |
| 2 / 844×390 / 0.2 | 59.65 / 2.581 | 57.11 / 0.678 | 57.01 / 1.440 | 99.2 / 123.2 / 62.1 |
| 7 / 844×390 / 0.2 | — | 56.85 / 1.311 | 56.91 / 1.259 | — / 72.6 / 29.4 |
| 10 / 844×390 / 0.2 | — | 56.76 / 1.845 | 56.54 / 1.818 | — / 67.2 / 24.8 |

| Metric | Original | Game | Editor |
|---|---|---|---|
| renderMaxMs | 3.70 ms … 5.40 ms | 0.70 ms … 3.90 ms | 0.60 ms … 3.10 ms |
| heapDelta | -0.436 MB … 1.311 MB | -2.000 MB … 1.836 MB | -1.405 MB … 1.054 MB |
| warmCacheRebuilds | 0 … 0 | 0 … 0 | 0 … 0 |

Hz는 관측된 Scene 렌더 호출률, ms는 평균 JavaScript render 비용입니다. 현재 Game/Editor 24개 표본 모두 기준을 통과했습니다. Original은 보관된 RC21의 Stage 1/2 측정이며 원본 표본이 없는 Stage 7/10은 —로 표시합니다. Game/Editor는 개편 콘텐츠이므로 동일 콘텐츠의 성능 비교는 아닙니다. 수치 원본: [before](tests/fixtures/performance-before.json), [game](_local/reports/performance-game.json), [editor](_local/reports/performance-editor.json).
정적 cache 바이트 예산과 build/hit 횟수도 각 JSON에 포함됩니다.
<!-- RESULTS_END -->

검증 범위: 이번 전체 verify는 네 동행 v008·일반 적 11종 및 현재 전투/서사 변경을 포함한 두 HTML의 기록된 SHA256 기준입니다. 종료 후 해시·제작 소스·전용 검사 결과의 일치를 확인했습니다. [네 동행 시트 비교](_local/reports/party-forge/references.png), [시각 검토](_local/reports/party-forge/VISUAL_REVIEW.md), [공방 UI 5개](_local/reports/party-forge/review-ui.json). 이전 일반 적 미술의 직접 관찰은 [몬스터 시각 검토](_local/reports/monster-forge/VISUAL_REVIEW.md)에 보존합니다. 수치 통과를 사용자의 미술 승인으로 취급하지 않습니다.

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
