# 새 인트로·막 엔딩 실제 브라우저 검수

상태: 새 그림 통합, 3회 집중 미술 검수와 별도 최종 종합 검수 및 관련 실제 브라우저 기능 검사 완료. `integration/fresh-responsive-art-20261022`에 커밋·푸시했다. master 병합과 Pages 배포는 하지 않았다. 부모의 최종 미술 판정을 기다리는 상태이며 작업 차단은 없다.

최종 화면부터 확인: [세로 인트로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-390x844.jpg) · [세로 1막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-390x844.jpg) · [세로 2막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-390x844.jpg) · [세로 3막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-390x844.jpg) · [가로 인트로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-1440x900.jpg) · [가로 1막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-1440x900.jpg) · [가로 2막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-1440x900.jpg) · [가로 3막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-1440x900.jpg).

## 기준과 보존

- 기준 master: `c5e5ec8e80ccc03c5ee7d5c8a4a4eea102b83c2f`.
- 방향별 구현: `0688710aae5b2b955d7b628b572a4bc9a43d30cd`, 통합 merge `40637db2`.
- 새 그림: `cee74f6e237af09ac35ba2e4d54bd9aad2f70ef7`을 `2d9dc103`으로 cherry-pick. 8개 WebP와 인트로 JPEG 대체본 2개를 바이트 그대로 사용한다. 거부된 `art/portrait-scenes-20261022`는 사용하지 않았다.
- 최초 새 그림 빌드/검사 소스: `c84c459a`. `npm run build` 성공. 실제 로컬 Chromium이 빌드된 HONRO.html 및 해시 에셋을 연 캡처이며 그림 자체나 합성 미리보기가 아니다. 모든 캡처는 브라우저에서 직접 저장한 JPEG 품질 85이며 개별 1MB 미만이다.
- 게임 기획·본문·저장 형식·성장·보상·지형·공통 엔진은 유지한다. 인트로의 별도 최신 한자/한글 로고도 유지한다.

## 1차: 전체 구도와 핵심 물체

소스 `c84c459a`, 화면 320×568 / 390×844 / 412×915 / 844×390 / 1440×900, 기본 safe area, 첫 컷. `1/checks.json`과 실제 캡처 20장. 20장을 직접 열어 비교했다.

- 인트로의 나룻배·등불, 1막의 나무·문·방울, 2막의 종·출구 계단, 3막의 장부·끊긴 옛길이 방향별로 함께 보인다. 첫 본문은 주요 물체 아래에 위치한다. 세로 그림은 가로 그림의 확대 대체가 아니다.
- 발견: 844×390에서 2막 종의 상단 장식이 위쪽 crop에 일부 걸린다. 다음 수정에서 해당 가로 화면의 CSS 초점을 위로 맞춘다. 기존 이미지를 수정하지 않는다.
- 시작 시 인트로 현재 방향 1건, 엔딩 0건. 각 막 화면 진입 시 해당 방향 1건. layout overflow·JS 오류·HTTP 오류 없음.

## 2차: 긴 문구·다음 막 제목·안전 영역

소스 `c84c459a`, 같은 5개 화면, 세로 safe area 위44/아래34px, 가로 좌우44/아래21px. `2/checks.json`과 캡처 35장. 인트로의 재개 버튼 두 개, 각 막 긴 세 번째 문구 및 다음 막 제목을 검사했다. 대표 9장을 직접 열어 작은 세로 본문·짧은 가로 제목·큰 가로 4막 준비 중 표시를 확인했다.

- 320×568의 가장 긴 3막 문구도 세 줄 안에 읽히며 장부를 가리지 않는다. 제목은 중앙의 어두운 면 위에 있고 본문과 미세 배경 질감이 겹쳐 식별을 방해하는 문제는 보이지 않았다.
- 320×568에서 두 개의 인트로 재개 버튼을 쓰면 등불 상단과 두 번째 버튼이 가까워진다. 짧은 세로의 인트로 CSS 초점을 위쪽 기준으로 조정하여 등불·배를 조금 더 아래에 보존하고 재확인한다.
- safe area 및 문구·제목·메뉴 경계, 초기 이미지 CLS <0.01, 방향별 요청 수 통과. 자동 수치 통과와 미술 판정을 구분한다.

## 재현

```sh
npm ci --ignore-scripts --cache /tmp/honro-npm-cache
npm --prefix game ci --ignore-scripts --cache /tmp/honro-npm-cache
npm run build
python -X utf8 tests/responsive-story-art-browser.py --round 1
python -X utf8 tests/responsive-story-art-browser.py --round 2
```

검사는 pending-ending 및 저장 프로필 fixture를 사용한다. 정상 전투 완주, 실물 휴대전화, Safari, 실제 Pages 확인으로 확대 해석하지 않는다.

## 3차: 회전·캐시·실패 및 초점 수정 재확인

실행 소스 `9ae7fdac`(미술/CSS), 같은 5개 기본 크기와 각각 가로세로를 뒤집은 화면. 실제 새 엔딩의 긴 세 번째 문구 30장, `3/checks.json`. 대표 11장을 직접 열어 회전 뒤 종 상단 장식·문/방울·장부/옛길과 본문의 분리를 확인했다. 844×390 및 915×412에서 종 상단 장식이 살아났으며, 회전된 568×320의 두 줄 본문도 물체 아래에 유지된다.

- 인트로 native picture와 엔딩 모두 최초 현재 방향 1건, 회전 후 반대 방향만 1건, 되돌릴 때 0건 추가. 현재 방향 원본의 SHA-256 접두사가 실제 URL에 포함됨을 검사한다. 컷/회전 중 전체 프로필 문자열 불변, 이미지/본문 경계 및 본문 내부 잘림 없음.
- `races/`의 실제 새 1막 세로 바이트 지연 응답과 의도적 HTTP 404: 늦은 방향 응답 무시, 디코딩된 그림 캐시 재사용, 화면 이탈 뒤 복원 방지, 세로 실패→새 가로 대체, 양쪽 실패→읽을 수 있는 어두운 본문, 정상 그림 복구 통과. 예상된 404를 성공 HTTP로 기록하지 않는다.
- 첫 지연 검사 실행은 빌드의 상대 URL을 Playwright route에 그대로 넣어 가로챔이 되지 않아 실패했다. route를 `**/`+실제 해시 경로로 바로잡아 같은 검사를 재실행했다. 제품 로딩 코드는 수정하지 않았다.

## 검사 측정 기준 교정

`npm run test:title`은 이전 구현의 세로 `right bottom` 문자열과 전체 아카이브 원본 PNG를 합산하던 기준 때문에 처음 실패했다. 새 그림은 별도 세로 중심 구도를 쓰므로 중심 및 짧은 세로 top 초점을 명시 검사한다. 용량은 실제 빌드가 보내는 6개 이미지(양 방향 WebP/JPEG와 기존 lossless WebP 로고 모두)로 측정하고 기존 1,650,000바이트 상한을 유지했다. 실제 전달 합계 1,440,828바이트, 아카이브 원본 합계 2,350,349바이트다. PNG 로고 identity/alpha/획/톤과 5개 저장 분기는 기존 강도를 유지해 통과했다. 의도한 측정 대상의 변경이며 원본 합계가 옛 상한을 통과했다고 기록하지 않는다.

`web-split`, `web-build-retention`, `ordered-runtime-groups`도 통과했다. 캠페인 복원 값·생성 파일 해시·이전 배포 보존·실행 모듈 순서 검사를 포함한다.


## 별도 최종 종합 검수

최종 실행·검사 소스 `d79bb74b0e2fed478c98e5b71eb4ba45b2765fe6`, 미술/CSS 변경은 `9ae7fdac`. 이후 실행 소스와 에셋은 바꾸지 않았다. 새 브라우저 컨텍스트에서 같은 다섯 크기의 인트로·세 막 긴 문구·다음 막 제목을 35장 다시 촬영했고, **35장을 모두 직접 열어** 앞선 수정의 회귀와 구도/문구를 종합 판정했다. `final/checks.json`에 실제 natural 크기, 선택 URL, object-position, 본문, DOM/내부 scroll 범위, 초기 CLS 및 요청 기록이 있다.

- 320×568의 긴 3막 본문은 세 줄이며 장부 아래에 있다. 인트로의 두 재개 버튼 아래로 등불과 배를 분리하는 수정도 통과했다.
- 844×390의 종 상단 장식과 출구 계단은 보존되고, 세 막의 긴 문구는 주요 물체 아래의 어두운 면에 있다. 가로·세로 모두 나무+문+방울 / 종+탈출길 / 장부+옛길 / 배+등불을 식별했다.
- 별도 로고의 획·한글 세로 읽기와 기존 먹빛 톤은 유지된다. 본문과 다음 막 제목의 밝은 획이 배경의 돌/물/풀 질감에 묻히는 간섭은 보이지 않았다. 장부의 먼 잔글씨를 읽는 화면은 아니며 종·바위의 세부 질감 자체가 제거됐다고 주장하지 않는다.
- 모든 크기에서 초기 CLS 0, 시작 인트로 현재 방향 1건·엔딩 0건. 막 첫 진입 해당 방향만 1건. `3/checks.json`은 회전 때 추가 1건, 복귀 때 0건을 별도로 확인한다. final의 요청 목록에는 컷 저장 후 의도적으로 수행한 페이지 새로고침의 재요청도 포함된다.
- 각 막×다섯 크기에서 컷 2 저장→새로고침→Continue, 진입 클릭 방지·터치 한 컷·중복 클릭 방지·Enter/Space·reduced motion, 다음 막 제목→쉼터, 완료 막 재생 방지 및 안정화된 쉼터 재진입의 성장/장착/보상/기록 불변 통과. 임의 테스트 프로필을 실제 캠페인 완주로 기록하지 않는다.

### 실제 보상 경계와 정상 플레이 체크포인트

`python -X utf8 tests/final-act-endings-browser.py` 통과. `flow/summary.json`, `flow/flow-summary.json`, `flow/checkpoint-traversal.json`과 실제 화면을 보존했다.

- 세 막 실제 outcome 경로의 terminal battle fixture에서 중복 outcome, 컷 2 새로고침, 실제 파일 내보내기/가져오기, 네 컷·제목·쉼터, XP/SP/장착/방문 기록 보존을 확인했다. 이 세팅을 정상 전투 승리로 간주하지 않는다.
- 저장소의 기존 정상 플레이 `normal-21-escape-save.json`을 가져온 뒤 **휘겸 선택 및 키보드 d**로 출구에 도달했다. 배우 좌표·HP·자원을 새로 쓰지 않았다. safe outro→새 세로 1막 그림→다음 막 제목→소단을 포함한 쉼터→재개까지 통과했다. 기존 체크포인트 이전 전투는 이번에 재실행하지 않았다.
- 실제 체크포인트 엔딩: [새 1막](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/flow/final-real-checkpoint-act1.jpg), [2막 제목](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/flow/final-real-next-title.jpg), [다음 쉼터](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/flow/final-real-next-rest.jpg).

### 최종 대표 화면

| 화면 | 세로 390×844 | 가로 1440×900 | 짧은 세로 320×568 | 낮은 가로 844×390 |
|---|---|---|---|---|
| 인트로 | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-390x844.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-1440x900.jpg) | [두 재개 버튼](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-320x568.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/intro-844x390.jpg) |
| 1막 긴 문구 | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-390x844.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-1440x900.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-320x568.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act1-844x390.jpg) |
| 2막 긴 문구 | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-390x844.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-1440x900.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-320x568.jpg) | [초점 수정 후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act2-844x390.jpg) |
| 3막 긴 문구 | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-390x844.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-1440x900.jpg) | [세 줄 본문](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-320x568.jpg) | [보기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/fresh-responsive-art-20261022/evidence/final/act3-844x390.jpg) |

412×915의 네 화면과 다섯 크기별 각 막의 다음 제목도 `final/`에 같은 파일명 규칙으로 있다. `*-next-title-*`는 다음 막 제목, `3/*-rotated-from-*`는 표기 크기에서 가로세로를 뒤집은 실제 화면이다. 이전 두 회차의 수정 전 증거도 그대로 남겼다.

### 완료한 관련 검사와 한계

- `npm run build`, `npm run test:title`, `node tests/web-split.mjs`, `node tests/web-build-retention.mjs`, `node tests/ordered-runtime-groups.mjs` 통과.
- 실제 Chromium `responsive-story-art-browser.py --round 1 / 2 / 3 / final`: 각각 20 / 35 / 30 / 35장, races 4장 및 별도 outcome/checkpoint 검사를 통과했다.
- [asset-integrity.json](asset-integrity.json): 부모 공급 커밋의 10개 이미지와 활성 빌드 파일 SHA-256/바이트 동일, 최신 별도 로고 두 원본 동일. `main.js`, `shared/data`, `shared/map`, `shared/engine`, `game/config`는 기준 master와 변경 없음.
- 전체 verify·전 장 완주·실물 휴대전화·Safari·실제 Pages는 이번 범위에서 실행하지 않았다. 부모의 새 그림 최종 미술 승인도 대신하지 않는다. 추가 권한 요청이나 접근 제한 우회는 하지 않았다.
- master 병합/배포는 명시적 요청에 따라 보류했다. 부모 검수 후 통합 브랜치 HEAD를 검토해 진행하면 된다.

최종 재현 추가 명령:

```sh
python -X utf8 tests/responsive-story-art-browser.py --round 3
python -X utf8 tests/responsive-story-art-races-browser.py
python -X utf8 tests/responsive-story-art-browser.py --round final
python -X utf8 tests/final-act-endings-browser.py
npm run test:title
node tests/web-split.mjs
node tests/web-build-retention.mjs
node tests/ordered-runtime-groups.mjs
```
