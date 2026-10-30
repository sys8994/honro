# 천뢰호 M05 — 원본의 풍부한 낙뢰 복원 후보

2026-10-22, `fix/cheonroe-restore-rich-effects`. **부모 시각 검수용 후보이며 master 병합·Pages 배포는 하지 않았다.**

- 착수 때 최신 origin/master: `d33402627e0c632593a388ec19e0b5370cc68439`.
- 검증한 실행 코드·빌드 후보: `4fc6fea87cf336d2db67aabf9c1e228ffe2764e7` (원격 push 확인).
- 이 문서·증거·브라우저 재현 도구는 후속 커밋이다. 전체 검수 패키지는 이 브랜치 HEAD이며 `git log -1 --format=%H`로 식별한다. 실행 코드는 위 후보와 같다.
- 마지막 원격 조회에서 master/별도 `feat/rest-hub-journey-flow`는 `62c03a0ae79ecaa4ddc30eb91720f20d6cebcf4e`로 전진했다. 해당 브랜치·파일을 변경/병합하지 않았으며 이 후보에 가져오지 않았다.

## 회귀의 정확한 범위와 복원값

원본 master `be79826869c70ae68950eb8be8a4bd7d187600dc`, 첫 대상별 구현 `b1e4efc41d91107a037ba23977532f546c57f948`(구현 `b1ea007f`, 빌드·증거 `e1e345ad` 포함), 착수 master를 비교했다. 이 경로의 M05 시각 변경은 첫 구현 이후 **`75c86629`와 `0e02735a` 두 커밋**이다. `integration/skill-icons-thunder-v1`의 뒤 두 축소만 해당 hunk에서 제거했으며 파일 전체 revert는 하지 않았다.

| 속성 | 축소된 master | 복원한 원본 수식/값 |
| --- | --- | --- |
| 좌우 굴곡 진폭 | `min(12,max(1.5,gap*.28),max(4,len*.022))` | `min(48,max(11,len*.075))` |
| 가지 수 | 3 | 6 |
| 가지 뻗음 | `min(min(24,max(4,gap*.6)),len*.09)*(.5+noise)` | `min(155,len*.24)*(.5+noise)` |
| 가지 불투명도 | 각 선층 alpha의 `.24` | 각 선층 alpha의 `.45+i*.055` (i=0..5) |
| 접점 광휘 반경 | `min(18+size*2+t*12,max(9,gap*.45))` | `34+size*8+t*55` |
| 접점 광휘 alpha | `life*.24` | `life*.65` |
| 접점 방전 | 4갈래, `min(7+noise*9,max(4,gap*.4))`, alpha `.24` | 9갈래, `(22+noise*35)*(1+t*.6)`, alpha `.55`, 폭1.1 |

굽은 본줄기·6점 가지 모양·색상·4중 겹침·`lighter` 합성·발광 gradient·노이즈 seed·3번의 형태 위상·원본 envelope와 **0.9초 수명**을 보존한다. 가지 선폭은 각 본줄기 층의 `.42`다. 적 수·간격·작은 화면에 따른 축소나 새로운 제한은 없다. 겹치는 피해 숫자를 이유로 장식을 제거하지 않는다.

**사용자 요청은 유지:** `size5 → 3.5`, 네 본줄기 월드 폭 `35/15/5/1.75 → 24.5/10.5/3.5/1.225`; 가지 선층도 정확히70%다. 접점 방전은 원본의 고정1.1 폭을 유지한다. 발광 반경은 원본 수식에 size3.5를 넣으므로 size 항만 함께 줄어든다. M05 기본 피해 `112 → 128.8`(+15%), NPC LM05는94다.

M05 전용 `text:'cheonroe'`·인접 간격 계산과 해당 호출 인자만 제거했다. 결과적으로 art.ts/skillMechanics.ts는 첫 대상별 구현과 동일하고 skillVisuals.ts는 원본·첫 구현 모두와 동일하다([소스 해시 대조](evidence/source-audit.json)). M04 등 다른 번개의 기본 렌더 명령도 축소 master의 기본 경로와 동일함을 검사했다. 84개 아이콘·리그 에셋·성장/범위/차폐·다른 스킬·쉼터 소스는 수정하지 않았다. HTML과 web은 공통 빌더가 생성했다.

## 보존한 역학

0적→0줄기,10적→10개의 별도 머리 줄기다. 발동 순간 하나의 frozen target snapshot을 시각과 기존 blast가 공유하며 적마다 피해를 한 번 적용한다. 원래 중앙 천장 열/반경 판정, 0.35초 지연, SP 성장·범위·피해 감쇠, 화면 밖 적 포함, 실제 monster head point(14종의 계층/방향/크기/피격 변환), 머리 관절이 없는 적의 기존 몸 상단 fallback을 보존했다. 치사·넉백 뒤에도 발동 순간의 접점은 고정된다.

## 실제 브라우저 화면

JPG **40장 모두 실제 Chromium154.0.8037.57의 production App/Engine/Scene 렌더**다. 파일당 최대144,359bytes, 모두1MB 미만이며 전체2,523,492bytes다([파일별 해시/크기](evidence/screenshots.json)). 이미지 합성·생성·리페인트를 하지 않았다. 증거용 글자는 DOM overlay다.

같은 h80 hound, 발 위치y1000, 카메라(1000,760), 적 좌표·피해 snapshot을 고정했다. 모바일 zoom.75(몸 높이60 CSS px), desktop1.0(80px); 일반 10명은38world px 간격이다. **대표 gameplay-scale도 선언된 통제 arena이며 정상 캠페인 전투 장면은 아니다.**

비교를 분리하기 위해 original-rich는 **원본 skillVisuals 모듈·size5를 현재의 대상별 hit snapshot에 재생**했다. 원래 master의 단일 중앙줄기 메커니즘을10줄기였다고 주장하지 않는다. current-reduced는 착수 master의 실제 art/skillVisuals 모듈·size3.5, restored-rich는 **override 없는 최종 빌드·size3.5**다. 원본/축소 비교 모듈만 HTTP route로 교체하며 App·Scene·에셋·역학은 같다. 세 버전의 카메라/머리 snapshot/피해 일치를 자동 확인했다.

| 화면 / 대상 | 원본 풍부함(size5 재생) | 축소 master(size3.5) | 복원 후보(size3.5) |
| --- | --- | --- | --- |
| 360×800 / 1 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-360x800-1-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-360x800-1-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-360x800-1-matched.jpg) |
| 360×800 / 3 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-360x800-3-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-360x800-3-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-360x800-3-matched.jpg) |
| 360×800 / 10 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-360x800-10-gameplay-scale.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-360x800-10-gameplay-scale.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-360x800-10-gameplay-scale.jpg) |
| 390×844 / 1 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-390x844-1-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-390x844-1-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-1-matched.jpg) |
| 390×844 / 3 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-390x844-3-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-390x844-3-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-3-matched.jpg) |
| 390×844 / 10 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-390x844-10-gameplay-scale.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-390x844-10-gameplay-scale.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-10-gameplay-scale.jpg) |
| 1280×900 / 1 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-1280x900-1-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-1280x900-1-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-1280x900-1-matched.jpg) |
| 1280×900 / 3 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-1280x900-3-matched.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-1280x900-3-matched.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-1280x900-3-matched.jpg) |
| 1280×900 / 10 | [원본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/original-rich-1280x900-10-gameplay-scale.jpg) | [축소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/current-reduced-1280x900-10-gameplay-scale.jpg) | [복원](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-1280x900-10-gameplay-scale.jpg) |

**밀집 진단(8world px 간격, 정상 편성 기준 아님):** [360×800](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-360x800-10-dense-diagnostic.jpg), [390×844](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-10-dense-diagnostic.jpg), [1280×900](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-1280x900-10-dense-diagnostic.jpg). 화면에 `DENSE DIAGNOSTIC`을 표기했으며 동일 이름의 original-rich/current-reduced도 evidence에 있다. 큰 접점 광휘와 숫자 중첩을 숨기지 않았다.

자연 발사/비행/착탄/.35초 대기/낙뢰도 실제 Engine.tick으로 확인했다: [대기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-natural-390x844-wait.jpg), [10줄기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-natural-390x844-strike.jpg). 시간 경과: [초기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-3-matched.jpg), [중기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-3-middle.jpg), [후기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-rich-effects-restoration/evidence/restored-rich-390x844-3-late.jpg). 그 외 비교는 위치·시간을 고정해 production impact/strike를 직접 호출했다.

## 직접 픽셀 검수

1. **의미/머리 정렬:** 실제360/390px의1·3·10명 및 desktop10명을 열어 머리 앞쪽 관절에서 흰 접점이 시작함을 보았다. 몸 중심/바닥으로 잘못 내려오지 않는다. DOMMatrix112조건(14종×방향2×키2×idle/피격2)과 발동 전 head snapshot 대조도 통과했다. 넉백 뒤의 현재 머리와 접점 차이는 원래 frozen snapshot 동작이다.
2. **원본 풍부함/폭:** 모바일1명 원본·축소·복원 및 desktop10명을 직접 대조했다. 원본과 동일한 큰 지그재그·긴 옆가지·청색 외곽/흰 중심·머리의 큰 방전/발광이 돌아왔다. 선폭은 원본보다 얇고 축소본의 직선적인 가느다란 굴곡과 확연히 다르다. 실제 그리기 명령21조건 및9경로 대조에서 기하·alpha·색·타이밍은 원본과 같고 본줄기/가지 각 층 폭만.7배다.
3. **기능/성능:** 자연 비행10피해/10줄기, 확대 시 화면 밖 적 포함,420줄기 보존/만료·예외0을 확인했다. 축소본/복원본의10명 scene+HUD render를 각각 warmup15회 뒤60회 측정했다. 아래 값은 이 컨테이너 Chromium CPU 제출 시간이며 실기기 FPS나 성능 개선의 증명이 아니다. 변동이 크며 성능을 이유로 효과를 줄이지 않았다.

| viewport | 축소 median / p95 ms | 복원 median / p95 ms |
| --- | --- | --- |
| 360×800 | 21.2 / 68.5 | 24.6 / 94.4 |
| 390×844 | 28.7 / 99.4 | 21.4 / 94.5 |
| 1280×900 | 23.0 / 31.9 | 16.7 / 23.7 |

**최종 종합:** 최종 실행 소스의 desktop10·390px 자연 타격·후기 fading·360px 밀집을 별도로 열어 검토했다. 원본 풍부함과 요구된 얇은 선, 모든 머리 타격, 소멸을 함께 보존한다. 밀집 광휘/숫자 겹침은 실제 모습으로 남긴다. 이 기록은 내부 복원 점검이며 부모의 최종 미술 수락을 대신하지 않는다.

## 실행한 검사와 재현

[검사 명령·범위·준비 중 수정](evidence/validation-results.json), [브라우저 원시 좌표/피해/성능](evidence/browser-results.json), [엔진 결과](evidence/engine-results.json), [원본 draw-command/폭 대조](evidence/visual-contracts.json), [담허 피해 회귀](evidence/damheo-damage-results.json)를 커밋했다.

| 명령 | 최종 결과/범위 |
| --- | --- |
| `node tests/cheonroe-rich-effects.mjs` | PASS, 원본·첫 구현의 실제 명령/모양,70%폭,방전/수명/M04 기본 경로 |
| `node tests/cheonroe-visual-spacing.mjs` | PASS,기존 통합 검사 진입점 보존·반려된3가지/간격상한 조건을 원본6가지/큰굴곡/긴가지/15위상·간격 독립성으로 갱신 |
| `node tests/cheonroe-target-lightning.mjs` | PASS, SP1/4/8×0/1/4/10,경계/대기/대상 상태,천장/oneWay,치사 snapshot,재시전/저장,420명 |
| `npm --prefix game run typecheck` | PASS |
| `npm run build` | PASS, Game/Workshop/Playtest 공통342파일 |
| `node tests/damheo-damage-balance.mjs` | PASS,16담허 스킬 SP1/8·실제 HP·후속/지연/설치/반사·NPC/저장 범위 |
| `node tests/quest-hostile-targets.mjs` | PASS,기존 표적 계약(전30장 플레이 아님) |
| `node tests/projectile-platforms.mjs` | PASS,발판/천장 관련6그룹 |
| `node tests/web-split.mjs` | PASS,342파일 해시/바이트·데이터 재조립·native/embedded 진입/저장 |
| `node tests/cheonroe-rich-reference-cores.mjs` 후 `python -X utf8 tests/cheonroe-rich-effects-browser.py` | PASS,36비교 장면+시간/자연비행=40JPG,112머리 변환,화면 밖/420줄기/만료,예외0 |
| `git diff --check` | PASS |

기존 간격 검사는3개 짧은 가지와12px 진폭상한을 의무화해 사용자에게 반려된 축소를 검증하고 있었다. 검사 파일을 삭제하지 않고 원본 복원 요구를 검증하도록 갱신했다.

읽기 전용 HOME의 npm cache 설치 실패는 `/tmp/cheonroe-npm-cache`로 해결했다. 신규 검사 작성 중 부동소수 엄격 비교와 Playwright route callback 인자를 수정한 뒤 최종 검사를 통과했다. 이를 제품 오류나 통과한 중간 실행으로 기록하지 않는다.

기존 `quest-targets-app-resume.mjs`의 VM `window is not defined` 실패는 [이전 master 대조 기록](../skill-icons-v1/integration/README.md)에 있다. 이번에는 해당 검사를 **실행/수리하지 않았으며 통과로 주장하지 않는다.** 전체 verify·전30장 순회·실기기·Safari/고DPR·최대 부하 FPS·Pages 검증도 하지 않았다.112변환 검사는 수학 대조이며14종 전부의 별도 미술 캡처 수락이 아니다. idle 시간0 머리 샘플/관절 없는 특수 적 fallback 등 기존 제한도 그대로다.

차단·승인 대기·결과 불명인 쓰기는 없다. 후보 브랜치만 비강제 push했으며 master 최종 수락/통합 및 기존 Pages 발행은 부모 담당자에게 남긴다.
