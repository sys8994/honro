# 천뢰호 rich VFX + 최신 휴식터 통합 후보

2026-10-22. 브랜치 **`integration/cheonroe-rich-rest-hub`**. 승인된 복원 효과를 최신 master와 통합하고 재빌드·집중 검사했다. **최종 통합 후보의 부모 signoff는 아직 대기 중이다. master 병합·Pages 배포는 하지 않았다.** 기존 복원 미술 승인은 유지하며 새 미술 설계나 효과 축소는 없다.

## 정확한 기준과 후보

- fetch 및 마지막 원격 확인의 master: `62c03a0ae79ecaa4ddc30eb91720f20d6cebcf4e`.
- 병합한 복원 브랜치 HEAD: `a0189968ac10977c3113cefbe3c879bac860637e`; 해당 실행 소스 후보 `4fc6fea87cf336d2db67aabf9c1e228ffe2764e7`; 공통 옛 기준 `d33402627e0c632593a388ec19e0b5370cc68439`.
- **검사·최종 JPG의 소스/생성물 후보 커밋: `457822b7c416ab706e057c2ba68a66b970789c9f`**. 두 부모를 가진 merge이며 비강제 push/원격 SHA 확인 완료.
- 이 보고서·통합 캡처 도구·검사 기록은 후속 문서/검사 커밋이다. 최종 브랜치 HEAD는 `git log -1 --format=%H`로 확인한다. 실행 코드와 빌드는 위 후보 이후 바꾸지 않았다.

## 병합과 보존

충돌은 생성 HTML/index, web entry rename 및 manifest에만 있었다. 임시로 master의 생성물 상태를 복원한 뒤 **합쳐진 현재 소스에서 `npm run build`로 전부 재생성**했다. 옛 복원 브랜치의 생성물을 최종본으로 선택하지 않았다. 빌더의 미참조 옛 entry/style 정리도 그대로 반영했다. Game/Workshop/direct Playtest 공통 그래프는342파일이다.

- master 대비 실행 소스 변경은 `shared/engine/src/{art,skillMechanics,skillVisuals}.ts` 세 파일뿐이다. 모두 승인 복원 HEAD와 바이트가 같다.
- `shared/runtime/`, `shared/data/`, `shared/assets/`, `shared/map/`, `game/config/`, `game/src/`의 master 파일 **619개 전부 SHA256/바이트 보존**. `main.js`, `rest-journey.js`, 여정/막 지도/캠페인·지형·리그·CSS·계획 문서를 되돌리지 않았다.
- 84개 `shared/assets/skill-icons/v1/*.webp`, 엔딩 가로/세로6개, `act-endings.js`/content/CSS 모두 그대로다. [전체 파일별 해시](integration-evidence/source-preservation.json).
- master의 BUG_LOG 전체와 복원 브랜치의 추가 기록을 모두 보존했다. 기존 `tests/cheonroe-visual-spacing.mjs`는 승인 복원 브랜치의 수정본과 정확히 같다.
- 원본6가지·큰 굴곡·긴 가지·4층 색/빛·full contact glow·9방전·.9초 수명, 본줄기/가지70%폭, frozen target head snapshot, 피해128.8(+15%)와 NPC LM05 94, .35초 지연/대상별1회/화면 밖/옛 중앙 천장·범위를 유지한다. 자세한 수식은 [복원 계약](README.md)을 따른다.

## 실행한 검사

아래 명령은 저장소 루트 기준이다. [Node 명령/exit code/시간](integration-evidence/checks.json)과 같은 폴더의 `.log`를 함께 커밋했다.

| 명령 | 실제 결과 |
|---|---|
| `npm --prefix game run typecheck` | PASS |
| `npm run build` | PASS, 공통342파일, direct Playtest `web/entries/game.c7c543c098eaa64f.html?embedded=1` |
| `node tests/cheonroe-rich-effects.mjs` | PASS, 원본/첫 구현 대비21실제 draw traces·9경로·70%폭·방전/M04/수명 |
| `node tests/cheonroe-visual-spacing.mjs` | PASS, 원본6가지/큰 진폭/긴 가지·간격/15위상 독립성 |
| `node tests/cheonroe-target-lightning.mjs` | PASS, SP1/4/8×0/1/4/10·지연/경계/상태·천장/oneWay·치사 snapshot·재시전/저장·420대상 |
| `node tests/damheo-damage-balance.mjs` | PASS, 담허16기예/SP1·8/실제HP·후속/지연·NPC/저장 |
| `node tests/projectile-platforms.mjs` | PASS, 발판/천장6그룹 |
| `node tests/rest-hub-journey-flow.mjs` | PASS,14그룹: 취소/확인·신규/옛 저장·act gate·선택/CTA·debug/허공터/분할/종료휴식터·Continue |
| `node tests/journey-stage-departure.mjs` | PASS,6그룹 |
| `node tests/rest-journey.mjs` | PASS,9그룹 |
| `node tests/camp-persistence.mjs` / `node tests/camp-reward-budget.mjs` | PASS,11/4그룹 |
| `node tests/rest-scene-controls.mjs` / `node tests/rest-idle.mjs` | PASS,8/7그룹 |
| `node tests/journey-art.mjs` / `node tests/journey-atlas-proof.mjs` / `node tests/journey-layout.mjs` | PASS, 기존 그림 구조·막 pin/경로·viewport 공식 |
| `node tests/web-split.mjs` | PASS,342파일 해시/바이트·데이터 재조립·native/embedded 진입/저장 보호 |
| `python -X utf8 tests/rest-hub-journey-browser.py` | PASS, 기존 원본 harness의 OUT만 `_local/reports/cheonroe-rich-integration/rest-hub`로 치환해 실행.360×800/390×844/844×390/1280×900·취소/승인/저장/reload·회전/드래그/휠/더블클릭. [결과](integration-evidence/rest-hub-results.json) |
| `HONRO_ENDING_OUT=_local/reports/cheonroe-rich-integration/endings python -X utf8 tests/rest-hub-act-endings-browser.py` | PASS,10/20/30장4컷/제목/휴식터·컷2 Continue/reload/파일가져오기·중복 outcome/보상/합류 방지·pending 엔딩을 hub/book으로 건너뛰지 않음·3막 뒤 준비중. [결과](integration-evidence/ending-results.json) |
| `python -X utf8 tests/cheonroe-rich-rest-hub-browser.py` | PASS, 최종 빌드/override 없음·모바일/desktop VFX/입력·대상 수/고정 머리 좌표/피해1회/소멸·pageerror0. [결과](integration-evidence/browser-results.json) |
| 소스/84아이콘/엔딩/BUG_LOG 대조, `git diff --check` | PASS |

### 실패와 미실행을 구분

`node tests/campaign-transition-regressions.mjs`는 **FAIL(exit1)**: 첫 `Practice entry keeps the persisted campaign` assertion (`:19`). `suspended()`가 옛 동작처럼 `rest`를 누른 뒤 새 휴식터 확인을 처리하지 않아, 기존 저장1턴과 연습 진입 때 저장된7턴을 비교한다. **별도 clean worktree의 정확한 master `62c03a0a`에서도 동일 명령/실패를 재현했다.** Assertion diff와 stack preamble은 checkout 경로와 session timestamp만 정규화하면 같다(큰 객체 dump의 잘린 꼬리 위치는 다르다). [기준 대조](integration-evidence/regression-baseline-comparison.json), [후보 로그](integration-evidence/campaign-transition-regressions.mjs.log), [master 로그](integration-evidence/baseline-campaign-transition-regressions.mjs.log). 이번 VFX 병합의 신규 회귀로 보지 않으며, 옛 검사를 이번 좁은 범위에서 고치지 않았다. 이 묶음의 이후 항목은 실행되지 않았다.

신규 캡처 도구의 첫 실행은 취소 뒤 전체 battle JSON 즉시 비교에서 실패했다. 취소가 정상 RAF를 재개해 animation clock이 진행되는 검사의 타이밍 문제였다. 확인 중 exact snapshot과 취소 후 같은 session/stage/turn을 확인하도록 고치고 최종 실행을 통과했다. 제품 런타임은 수정하지 않았다. 기존 원본 hub suite의 정지/취소/저장 경계 검사도 별도로 통과했다. 전투 JPG는 실제 진입 카메라/턴 배너가 가라앉은 뒤 캡처했다.

이전 두 보고서에 기록된 `quest-targets-app-resume`의 VM `window is not defined`, `custom-map-return-profile`의 옛 reload 기대값 차이, `journey-content`의 옛5장 대사 기대값 실패는 **이번에 재실행/수리하지 않았다**. `npm run test:rest-journey` 전체나 `npm run verify`가 통과했다고 주장하지 않는다. 기존40장 비교 브라우저/성능 묶음도 반복하지 않았다. 정상30장 완주·새 난이도 평가·실기기 터치/GPU·Safari/고DPR·Pages 검증은 미실행이다.

## 최종 실제 JPG와 직접 픽셀 확인

Chromium154.0.8037.57, DPR1의 실제 production App/Engine/Scene 캡처다. **8장 합계474,308bytes, 모두1MB 미만**. [파일별 크기/해시](integration-evidence/screenshots.json). 합성·생성·리페인트는 없다.

| 실제 최종 화면 | JPG |
|---|---|
| 390×844 복원1대상 | [열기](integration-evidence/final-390x844-1-controlled-arena.jpg) |
| 390×844 복원10대상 | [열기](integration-evidence/final-390x844-10-controlled-arena.jpg) |
| 1280×900 복원10대상 | [열기](integration-evidence/final-1280x900-10-controlled-arena.jpg) |
| 390×844 휴식터 | [열기](integration-evidence/final-390x844-flow-rest.jpg) |
| 390×844 여정첩/막gate/CTA | [열기](integration-evidence/final-390x844-flow-journal.jpg) |
| 390×844 실제 새 전투 진입 | [열기](integration-evidence/final-390x844-flow-battle.jpg) |
| 390×844 휴식터 복귀 확인 | [열기](integration-evidence/final-390x844-flow-confirmation.jpg) |
| 390×844 3막 엔딩 | [열기](integration-evidence/final-390x844-act3-ending.jpg) |

VFX는 승인 때 사용한 **기존 controlled arena harness**의 동일 SETUP/CONFIG/STRIKE·카메라/scale/38world 간격을 재사용했다. 화면에도 arena라고 표기한다. 실제 캠페인 전투나 정상 발사 완주 캡처로 가장하지 않는다. 원본/축소 module route override는 없다. 이동은 기존 rest-hub setup의 진행 fixture에서 **실제 public UI 버튼**으로 휴식터→여정첩→휴식터→전투→확인/취소/승인을 수행했다. 엔딩은 기존 terminal battle fixture다. 모바일 크기의 실제 Chromium 검증이며 물리 모바일 기기를 뜻하지 않는다.

최종8장을 직접 열었다.1대상은 큰 비대칭 굴곡·길게 뻗은 옆가지·청색 외곽/흰 중심·머리 접점 방전/광휘를 보존한다.10대상은 서로 별도의 머리로 내려오며 원본의 강한 빛/숫자 중첩을 그대로 드러낸다. desktop에서도 긴 가지와 각 머리 접점이 보인다. 휴식터 하단3버튼,1막 활성/2·3막 잠김/4–6막 준비중, 여정첩 하단CTA, 새 전투 동행/HUD, 복귀 확인 문구와 두 버튼이 viewport 안에 있다. 엔딩은 세로 그림과 하단 본문이 보존된다. 이 통합 관찰은 부모의 최종 후보 수락을 대신하지 않는다.

## 인계 상태

실행 소스 merge와 후속 증거/보고서를 각각 commit·비강제 push한다. 접근 거부/승인 보류/결과 불명 쓰기는 없다. master는 기준SHA 그대로이며 배포하지 않았다. **부모가 최종 후보를 확인한 뒤 master fast-forward와 기존 Pages 배포를 진행할 단계가 남아 있다.**
